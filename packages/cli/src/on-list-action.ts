import type { Config } from "@dimaslz/local-ssl-management-core";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import { listConfigs } from "./utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;

const onListAction = () => {
  const config: Config[] = JSON.parse(
    fs.readFileSync(configPath, { encoding: "utf8" }) || "[]",
  );

  if (!config.length) {
    shell.echo(`\nDoes not exists configs yet.\n`);
    shell.exit(1);
  }

  listConfigs(config);
};

export default onListAction;
