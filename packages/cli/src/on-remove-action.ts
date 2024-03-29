import type { Config } from "@dimaslz/local-ssl-management-core";
import consola from "consola";
import fs from "fs";
import path from "path";

import { generateProxyImage } from "@/utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;
const sslPath = `${rootPath}/ssl`;

const onRemoveAction = (
  _domain: string,
  options: { port?: string; location?: string } = {},
) => {
  const { location } = options;

  const config: Config[] = JSON.parse(
    fs.readFileSync(configPath, { encoding: "utf8" }) || "[]",
  );

  const v4 = new RegExp(
    /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  );
  const isUUID = v4.test(_domain);

  const domain = _domain.split("_").join(",");

  const exists = isUUID
    ? config.some((c) => c.id === _domain)
    : config.some((c) => c.domain === domain);

  if (!exists) {
    if (isUUID) {
      throw new Error(`Domain with id "${_domain}" does not exists`);
    } else {
      throw new Error(`Domain "${domain}" does not exists`);
    }
  }

  const byLocation = !!location;

  let newConfig = config;

  if (byLocation) {
    const domainIndex = config.findIndex(
      (c) => (isUUID && c.id === domain) || c.domain === domain,
    );

    const locationExists = config[domainIndex].services.some(
      (service) => service.location === location,
    );

    if (!locationExists) {
      throw new Error(`Location "${location}" does not exists`);
    }

    newConfig = config.map((c, cIndex) => {
      if (domainIndex === cIndex) {
        c.services = c.services.filter(
          (service) => service.location !== location,
        );
      }

      return c;
    });
  } else {
    newConfig = isUUID
      ? config.filter((c) => c.id !== _domain)
      : config.filter((c) => c.domain !== domain);
  }

  const domainData = config.find((c) => {
    if (isUUID) {
      return c.id === _domain;
    }

    return c.domain === domain;
  });

  const certFile = `${domainData?.domain.split(",").join("_")}-cert.pem`;
  const keyFile = `${domainData?.domain.split(",").join("_")}-key.pem`;

  const certFileExists = fs.existsSync(`${sslPath}/${certFile}`);
  const keyFileExists = fs.existsSync(`${sslPath}/${keyFile}`);

  if (certFileExists) {
    fs.unlinkSync(`${sslPath}/${certFile}`);
  }

  if (keyFileExists) {
    fs.unlinkSync(`${sslPath}/${keyFile}`);
  }

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

  consola.success("Domain removed succesful.");
  consola.success("Updating proxy image.");

  generateProxyImage(newConfig);
};

export default onRemoveAction;
