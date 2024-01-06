#! /usr/bin/env node

import { dockerExists, mkcertExists } from "@dimaslz/local-ssl-management-core";
import { Command } from "commander";
import fs from "fs";
import path from "path";

import onCreateAction from "./on-create-action";
import onListAction from "./on-list-action";
import onRemoveAction from "./on-remove-action";
import onUpdateAction from "./on-update-action";

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
    .action(onCreateAction);

  program.command("list").description("List domains").action(onListAction);

  program
    .command("update <domain|id>")
    .description("update domain")
    .option("-p, --port <port>", "Port where is running the application")
    .action(onUpdateAction);

  program
    .command("remove <domain|id>")
    .description("Create domain")
    .action(onRemoveAction);

  program.parse();
};

cli();
