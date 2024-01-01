import fs from "fs";
import crypto from "crypto";
import shell from "shelljs";
import chalk from "chalk";
// import path from "path";

import type { Config } from "@dimaslz/local-ssl-management-core";
import { validateDomain, validatePort, validateLocation } from "./utils";
import generateProxyImage from "./generate-proxy-image";

// const distPath = path.resolve(__dirname, "./");
// const rootPath = `${distPath}/.local-ssl-management`;
const rootPath = `.local-ssl-management`;
const sslPath = `${rootPath}/ssl`;
const configPath = `${rootPath}/config.json`;


const onCreateAction = (_domain: string, options: { port: string, location?: string; }) => {
	const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

	let { location = "/" } = options as { port: string; location: string; };
	const { port } = options as { port: string; location: string; };

	validateLocation(location);
	validatePort(port);
	validateDomain(_domain);

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
	const domainIndex = config.findIndex((c) => c.domain === domain);
	let currentLocation: string = config.find((c) => c.domain === domain)?.location || "/";
	let currentPort: string = config.find((c) => c.domain === domain)?.port;

	if (domainExists) {
		shell.echo(chalk.red("\n[Error] - Domain already exists\n"));
		shell.exit(1);
	}

	if (currentLocation) {
		currentLocation += `,${location}`;
	}

	if (currentPort) {
		currentPort += `,${port}`;
	}

	if (domainIndex > -1) {
		config[domainIndex] = {
			id: crypto.randomUUID(),
			domain,
			port: currentPort,
			location: currentLocation,
		} as Config;
	} else {
		config.push({
			id: crypto.randomUUID(),
			domain,
			port,
			location: "/",
		} as Config);
	}

	generateProxyImage(config);

	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

export default onCreateAction;
