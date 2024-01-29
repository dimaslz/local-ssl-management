#! /usr/bin/env node
import { dockerExists, mkcertExists } from "@dimaslz/local-ssl-management-core";
import { Command } from "commander";
import consola from "consola";
import fs from "fs";
import path from "path";

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
    .command("create <domain>")
    .description("Create domain")
    .option("-p, --port <port>", "Port where is running the application")
    .option(
      "-l, --location <location>",
      'Location where nginx will serve the application. By default is "/"',
    )
    .configureOutput({
      writeErr: (str) => consola.error(str.replace("error: ", "")),
    })
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
    .configureOutput({
      writeErr: (str) => consola.error(str.replace("error: ", "")),
    })
    .action(onUpdateAction);

  program
    .command("remove <domain|id>")
    .description("Remove domain")
    .option(
      "-l, --location <location>",
      "Location where nginx will serve the application.",
    )
    .configureOutput({
      writeErr: (str) => consola.error(str.replace("error: ", "")),
    })
    .action(onRemoveAction);

  program
    .command("reset")
    .description("Remove all domain in `/etc/hosts` created by this cli")
    .configureOutput({
      writeErr: (str) => consola.error(str.replace("error: ", "")),
    })
    .action(onResetHosts);

  program.parse();
};

cli();
