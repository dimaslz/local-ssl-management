import type { Config } from "@dimaslz/local-ssl-management-core";
import consola from "consola";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { generateProxyImage, updateHosts } from "@/utils";

import {
  domainExistsInHosts,
  validateDomain,
  validateLocation,
  validatePort,
} from "./utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;
const sslPath = `${rootPath}/ssl`;

const onCreateAction = async (
  _domain: string,
  options: { port?: string; location?: string },
) => {
  const config: Config[] = JSON.parse(
    fs.readFileSync(configPath, { encoding: "utf8" }) || "[]",
  );

  const { location = "/" } = options as { port: string; location: string };
  const { port } = options as { port: string; location: string };

  validateDomain(_domain);
  if (port) {
    validatePort(port);
  }
  validateLocation(location);

  const domains = config
    .map((c) =>
      c.domain
        .split(",")
        .map((d) => d.trim())
        .join("_"),
    )
    .concat("localhost");

  if (!fs.existsSync(sslPath)) {
    fs.mkdirSync(sslPath, { recursive: true });
  }

  const filesToRemove = fs.readdirSync(sslPath).filter((file) => {
    const f = file.replace(/-?cert\..+?$|-?key\..+?$/, "");
    return !domains.includes(f);
  });

  filesToRemove.forEach((file) => fs.unlinkSync(`${sslPath}/${file}`));

  const domain = _domain
    .split(",")
    .map((d) => d.trim())
    .join(",");
  const domainExists = config.some((c) => c.domain === domain);
  const domainIndex = config.findIndex((c) => c.domain === domain);

  const locationExists =
    config[domainIndex]?.services.some(
      (service) => service.location === location,
    ) || false;

  if (domainExists && locationExists) {
    if (location === "/") {
      const domainExists = await domainExistsInHosts(domain);

      if (!domainExists) {
        consola.error(
          `Domain "${domain}" already created with the default location "${location}", but does not exist on your local \`/etc/hosts\``,
        );
      } else {
        consola.error(
          `Domain "${domain}" already created with the default location "${location}"`,
        );
      }
    } else {
      consola.error(`Location "${location}" already exists`);
    }

    return;
  }

  if (domainExists && locationExists) {
    consola.error(`Domain "${domain}" already exists`);

    return;
  }

  const portExists =
    config[domainIndex]?.services.some((service) => service.port === port) ||
    false;

  if (portExists) {
    consola.error(`Port "${port}" already exists`);

    return;
  }

  if (domainIndex > -1) {
    config[domainIndex].services.push({
      id: crypto.randomUUID(),
      location,
      port,
    });
  } else {
    config.push({
      id: crypto.randomUUID(),
      domain,
      services: [
        {
          id: crypto.randomUUID(),
          location,
          port,
        },
      ],
    });
  }

  generateProxyImage(config);

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  await updateHosts(domain);
};

export default onCreateAction;
