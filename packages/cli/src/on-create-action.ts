import type { Config } from "@dimaslz/local-ssl-management-core";
import chalk from "chalk";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import generateProxyImage from "./generate-proxy-image";
import { validateDomain, validateLocation, validatePort } from "./utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;
const sslPath = `${rootPath}/ssl`;

const onCreateAction = (
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
      shell.echo(
        chalk.red(
          `\n[Error] - Domain "${domain}" already created with the default location "${location}"\n`,
        ),
      );
    } else {
      shell.echo(
        chalk.red(`\n[Error] - Location "${location}" already exists\n`),
      );
    }

    shell.exit(1);
  }

  if (domainExists && locationExists) {
    shell.echo(chalk.red(`\n[Error] - Domain "${domain}" already exists\n`));
    shell.exit(1);
  }

  const portExists =
    config[domainIndex]?.services.some((service) => service.port === port) ||
    false;

  if (portExists) {
    shell.echo(chalk.red(`\n[Error] - Port "${port}" already exists\n`));
    shell.exit(1);
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
};

export default onCreateAction;
