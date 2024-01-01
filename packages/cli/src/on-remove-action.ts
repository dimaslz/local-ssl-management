import type { Config } from "@dimaslz/local-ssl-management-core";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import generateProxyImage from "./generate-proxy-image";
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
      shell.echo(
        chalk.red(`\n[Error] - Domain with id "${_domain}" does not exists\n`),
      );
    } else {
      shell.echo(chalk.red(`\n[Error] - Domain "${domain}" does not exists\n`));
    }

    shell.exit(1);
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
      shell.echo(
        chalk.red(`\n[Error] - Location "${location}" does not exists\n`),
      );
      shell.exit(1);
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

  shell.echo(chalk.green("\n[Success] - 🎉 Domain removed succesful.\n"));
  shell.echo(chalk.green("\n[Action] - 🔄 Updating proxy image.\n"));

  generateProxyImage(newConfig);
};

export default onRemoveAction;
