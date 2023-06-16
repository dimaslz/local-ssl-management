import fs from "fs";
import path from "path";
import shell from "shelljs";

import type { Config } from "@dimaslz/local-ssl-management-core";
import chalk from "chalk";
import generateProxyImage from "./generate-proxy-image";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;
const sslPath = `${rootPath}/ssl`;

const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

const onRemoveAction = (_domain: string) => {
	const v4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
	const isUUID = v4.test(_domain);

	const domain = _domain.split("_").join(",");

	const exists = isUUID
		? config.some((c) => c.id === _domain)
		: config.some((c) => c.domain === domain);

	if (!exists) {
		if (isUUID) {
			shell.echo(chalk.red(`\n[Error] - Domain with id "${_domain}" does not exists\n`));
		} else {
			shell.echo(chalk.red(`\n[Error] - Domain "${domain}" does not exists\n`));
		}

		shell.exit(1);
	}

	let newConfig = isUUID
		? config.filter((c) => c.id !== domain)
		: config.filter((c) => c.domain !== domain);

	const domainData = config.find(c => {
		if (isUUID) {
			return c.id === _domain;
		}

		return c.domain === _domain;
	});

	const certFile = `${domainData?.domain}-cert.pem`;
	const keyFile = `${domainData?.domain}-key.pem`;


	const certFileExists = fs.existsSync(`${sslPath}/${certFile}`);
	const keyFileExists = fs.existsSync(`${sslPath}/${keyFile}`);

	if (certFileExists) {
		fs.unlinkSync(`${sslPath}/${certFile}`);
	}

	if (keyFileExists) {
		fs.unlinkSync(`${sslPath}/${keyFile}`);
	}

	if (!newConfig.length) {
		newConfig = config;
	}

	fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

	shell.echo(chalk.green("\n[Success] - 🎉 Domain removed succesful.\n"));
	shell.echo(chalk.green("\n[Action] - 🔄 Updating proxy image.\n"));

	generateProxyImage(newConfig);
};

export default onRemoveAction;
