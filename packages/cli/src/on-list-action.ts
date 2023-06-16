import path from "path";
import fs from "fs";
import shell from "shelljs";
import Table from "cli-table";

import type { Config } from "@dimaslz/local-ssl-management-core";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;

const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

const onListAction = () => {
	const table = new Table({
		head: ["id", "key", "domains", "port"],
		chars: {
			'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
			, 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
			, 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
			, 'right': '', 'right-mid': '', 'middle': ' '
		},
		style: { 'padding-left': 0, 'padding-right': 0 },
	});

	config.forEach(({ id, domain, port }) => {
		table.push([
			id,
			domain.split(",").map(i => i.trim()).join("_"),
			domain.split(",").map((d) => `https://${d.trim()}`).join(", "),
			String(port)
		]);
	});

	shell.echo(`\n${table.toString()}\n`);
};

export default onListAction;
