#! /usr/bin/env node
import { dockerExists, mkcertExists } from "@dimaslz/local-ssl-management-core";
import { Command } from "commander";
import consola from "consola";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import onCreateAction from "@/on-create-action";
import onListAction from "@/on-list-action";
import onRemoveAction from "@/on-remove-action";
import onResetHosts from "@/on-reset-hosts";
import onUpdateAction from "@/on-update-action";

const createBaseFolders = () => {
  const distPath = path.resolve(__dirname, "./");
  const rootPath = `${distPath}/.local-ssl-management`;
  const sslPath = `${rootPath}/ssl`;

  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
  }

  if (!fs.existsSync(sslPath)) {
    fs.mkdirSync(sslPath, { recursive: true });
  }

  const configPath = `${rootPath}/config.json`;

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, "[]");
  }
};

const cli = () => {
  createBaseFolders();

  mkcertExists();
  dockerExists();

  const program = new Command();

  program
    .name("create")
    .usage("<domain> [options]")
    .command("create <domain>")
    .description("Create domain")
    .option("-p, --port <port>", "Port where is running the application")
    .option(
      "-l, --location <location>",
      'Location where nginx will serve the application. By default is "/"',
    )
    .addHelpText(
      "after",
      `

  Example:
    $ local-ssl create your-domain.com                                # location "/" and port "3000" by default
    $ local-ssl create your-domain.com --location /                   # port "3000" by default
    $ local-ssl create your-domain.com --location /app --port 4000`,
    )
    .action(onCreateAction);

  program.command("list").description("List domains").action(onListAction);

  program
    .command("update <domain|id>")
    .description("update domain")
    .option("-p, --port <port>", "Port where is running the application")
    .option(
      "-l, --location <location>",
      'Location where nginx will serve the application. By default is "/"',
    )
    .addHelpText(
      "after",
      `

Example:
  $ local-ssl update your-domain.com --location /,/app              # "/" to "/app"
  $ local-ssl update your-domain.com --location / --port 4000       # "3000" to "4000"
  $ local-ssl update your-domain.com --location /,/app --port 4000  # "3000" to "4000", "/" to "/app"`,
    )
    .action(onUpdateAction);

  program
    .command("remove <domain|id>")
    .description("Remove domain")
    .option(
      "-l, --location <location>",
      "Location where nginx will serve the application.",
    )
    .addHelpText(
      "after",
      `

Example:
$ local-ssl remove your-domain.com|39edd1b4-ba9c-46fb-9929-cc3534bb6f3f                   # remove endpoint
$ local-ssl remove your-domain.com|39edd1b4-ba9c-46fb-9929-cc3534bb6f3f --location /app   # remove location "/app"`,
    )
    .action(onRemoveAction);

  program
    .command("reset")
    .description("Remove all domain in `/etc/hosts` created by this cli")
    .action(onResetHosts);

  program.configureOutput({
    writeErr: (str) => {
      consola.error(str.replace("error: ", ""));
      shell.exec("local-ssl --help").stdout;
    },
  });

  program.parse();
};

cli();
