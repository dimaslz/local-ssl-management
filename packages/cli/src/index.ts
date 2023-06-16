#! /usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { program } from "commander";

import { dockerExists, mkcertExists } from "@dimaslz/local-ssl-management-core";
import type { Config } from "@dimaslz/local-ssl-management-core";
import onCreateAction from "./on-create-action";
import onListAction from "./on-list-action";
import onRemoveAction from "./on-remove-action";
import onUpdateAction from "./on-update-action";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const sslPath = `${rootPath}/ssl`;

if (!fs.existsSync(sslPath)) {
  fs.mkdirSync(sslPath, { recursive: true })
}

if (!fs.existsSync(rootPath)) {
  fs.mkdirSync(rootPath, { recursive: true })
}

const configPath = `${rootPath}/config.json`;

if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, "[]");
}

const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

const cli = () => {
  mkcertExists();
  dockerExists();

  program
    .command("create <domain>")
    .description("Create domain")
    .option("-p, --port <port>", "Port where is running the application")
    .action((domain, options) => onCreateAction(domain, options, config));

  program
    .command("list")
    .description("List domains")
    .action(onListAction);

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
}

cli();