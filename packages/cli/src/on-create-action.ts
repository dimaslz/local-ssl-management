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

	if (domainExists) {
		shell.echo(chalk.red("\n[Error] - Domain already exists\n"));
		shell.exit(1);
	}

	const domainIndex = config.findIndex((c) => c.domain === domain);

	const locationExists = config[domainIndex]?.services
		.some((service) => service.location === location) || false;
	const portExists = config[domainIndex]?.services
		.some((service) => service.port === port) || false;

	if (locationExists) {
		shell.echo(chalk.red("\n[Error] - Location already exists\n"));
		shell.exit(1);

		return;
	}

	if (portExists) {
		shell.echo(chalk.red("\n[Error] - Port already exists\n"));
		shell.exit(1);

		return;
	}

	let currentLocation: string = config.find((c) => c.domain === domain)?.location || "/";
	let currentPort: string = config.find((c) => c.domain === domain)?.port;

	if (currentLocation) {
		currentLocation += `,${location}`;
	}

	if (currentPort) {
		currentPort += `,${port}`;
	}

	if (domainIndex > -1) {
		config[domainIndex].services.push({
			id: crypto.randomUUID(),
			location,
			port,
		});
	} else {
		config.push({
			id: crypto.randomUUID(),
			domain,
			services: [{
				id: crypto.randomUUID(),
				location,
				port,
			}]
		});
	}

	generateProxyImage(config);

	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

export default onCreateAction;
