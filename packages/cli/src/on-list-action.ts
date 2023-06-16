import path from "path";
import fs from "fs";
import shell from "shelljs";
import Table from "cli-table";
import { Config } from "@dimaslz/local-ssl-management-core";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;

const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

const onListAction = () => {
	const table = new Table({
		head: ["key", "domains", "port"],
	});

	config.forEach(({ domain, port }) => {
		table.push([
			domain.split(",").map(i => i.trim()).join("_"),
			domain.split(",").map((d) => `https://${d.trim()}`).join(", "),
			String(port)]);
	});

	shell.echo(table.toString());
};

export default onListAction;
