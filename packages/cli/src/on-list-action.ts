import type { Config } from "@dimaslz/local-ssl-management-core";
import consola from "consola";
import fs from "fs";
import path from "path";

import { listConfigs } from "./utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;

const onListAction = () => {
  const config: Config[] = JSON.parse(
    fs.readFileSync(configPath, { encoding: "utf8" }) || "[]",
  );

  if (!config.length) {
    consola.box("Does not exists configs yet.");

    return;
  }

  listConfigs(config);
};

export default onListAction;
