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

const onUpdateAction = (domain: string, options: { port: number }) => {
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

  const { port } = options;

  validatePort(port);

  const newConfig = config.map((c) => {
    if ((isUUID && c.id === domain) || c.domain === domain) {
      c.port = port;
    }

    return c;
  });

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

  shell.echo(chalk.green("\n[Success] - 🎉 Domain removed succesful.\n"));
  shell.echo(chalk.green("\n[Action] - 🔄 Updating proxy image.\n"));

  generateProxyImage(newConfig);
};

export default onUpdateAction;
