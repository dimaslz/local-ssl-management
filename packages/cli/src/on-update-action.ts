import { Config } from "@dimaslz/local-ssl-management-core";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import generateProxyImage from "./generate-proxy-image";
import { validatePort } from "./utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;

type Options = { port?: string; location?: string };

const onUpdateAction = (domain: string, options: Options) => {
  const config: Config[] = JSON.parse(
    fs.readFileSync(configPath, { encoding: "utf8" }) || "[]",
  );

  const v4 = new RegExp(
    /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  );
  const isUUID = v4.test(domain);

  const exists = isUUID
    ? config.some((c) => c.id === domain)
    : config.some((c) => c.domain === domain);

  if (!exists) {
    if (isUUID) {
      shell.echo(
        chalk.red(`\n[Error] - Domain with key "${domain}" does not exists\n`),
      );
    } else {
      shell.echo(chalk.red(`\n[Error] - Domain "${domain}" does not exists\n`));
    }

    shell.exit(1);
  }

  let { port } = options;
  const { location } = options;

  if (!location) {
    shell.echo(chalk.red(`\n[Error] - Location is mandatory\n`));
    shell.exit(1);
  }

  const domainIndex = config.findIndex(
    (c) => (isUUID && c.id === domain) || c.domain === domain,
  );

  if (location.includes(",")) {
    const [oldLocation] = location.split(",");

    if (!port) {
      port = config[domainIndex].services.find(
        (service) => service.location === oldLocation,
      )?.port;
    }

    const oldLocationExists = config[domainIndex].services.some(
      (service) => service.location === oldLocation,
    );

    if (!oldLocationExists) {
      shell.echo(
        chalk.red(`\n[Error] - Location "${oldLocation}" does not exists\n`),
      );
      shell.exit(1);
    }
  } else {
    const locationExists = config[domainIndex].services.some(
      (service) => service.location === location,
    );

    if (!locationExists) {
      shell.echo(
        chalk.red(`\n[Error] - Location "${location}" does not exists\n`),
      );
      shell.exit(1);
    }
  }

  if (port) {
    validatePort(port);
  }

  const newConfig = config.map((c, cIndex) => {
    if (domainIndex === cIndex) {
      c.services.map((service) => {
        if (location?.includes(",")) {
          const [oldLocation, newLocation] = location.split(",");

          if (service.location === oldLocation) {
            service.location = newLocation;
            service.port = port || service.port;
          }
        }

        if (service.location === location && port) {
          service.port = port;
        }
      });
    }

    return c;
  });

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

  shell.echo(chalk.green("\n[Success] - 🎉 Domain updated succesful.\n"));
  shell.echo(chalk.green("\n[Action] - 🔄 Updating proxy image.\n"));

  generateProxyImage(newConfig);
};

export default onUpdateAction;
