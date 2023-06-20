import fs from "fs";
import crypto from "crypto";
import shell from "shelljs";
import chalk from "chalk";
import path from "path";

import type { Config } from "@dimaslz/local-ssl-management-core";
import { validateDomain, validatePort } from "./utils";
import generateProxyImage from "./generate-proxy-image";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const sslPath = `${rootPath}/ssl`;
const configPath = `${rootPath}/config.json`;


const onCreateAction = (_domain: string, options: any) => {
	const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

	const { port } = options as { port: number; };

	validatePort(port);
	validateDomain(_domain);

	// const portAlreadyExists = config.find((c) => c.port === port);
	// if (portAlreadyExists) {
	// 	shell.echo(chalk.yellow(`\n[Notice] - Port "${port}" is already used for domain "${portAlreadyExists.domain}".
	//   If you want to use this port for this new domain "${_domain}", update the the other domain port it using "local-ssl update ${portAlreadyExists.domain} --port XXXX" and after try again.\n`));
	// }

	const domains = config
		.map((c) => c.domain.split(",")
			.map(d => d.trim()).join("_")
		).concat("localhost");

	if (!fs.existsSync(sslPath)) {
		fs.mkdirSync(sslPath, { recursive: true });
	}

	const filesToRemove = fs.readdirSync(sslPath)
		.filter((file) => {
			const f = file.replace(/-?cert\..+?$|-?key\..+?$/, "");
			return !domains.includes(f)
		});

	filesToRemove.forEach(file => fs.unlinkSync(`${sslPath}/${file}`))

	const domain = _domain.split(",").map(d => d.trim()).join(",");
	const domainExists = config.some((c) => c.domain === domain);

	if (domainExists) {
		shell.echo(chalk.red("\n[Error] - Domain already exists\n"));
		shell.exit(1);
	}

	config.push({
		id: crypto.randomUUID(),
		domain,
		port,
	} as Config);

	generateProxyImage(config);

	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

export default onCreateAction;
