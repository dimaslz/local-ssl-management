import fs from "fs";
import path from "path";
import shell from "shelljs";

import { Config } from "@dimaslz/local-ssl-management-core";
import chalk from "chalk";
import generateProxyImage from "./generate-proxy-image";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;
const sslPath = `${rootPath}/ssl`;

const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

const onRemoveAction = (_domain: string) => {
	const domain = _domain.split("_").join(",");

	const exists = config.some((c) => c.domain === domain);

	if (!exists) {
		shell.echo(chalk.red(`\n[Error] - Domain "${domain}" does not exists\n`));
		shell.exit(1);
	}

	let newConfig = config.filter((c) => c.domain !== domain);

	const certFileExists = fs.existsSync(`${sslPath}/${_domain}-cert.pem`);
	const keyFileExists = fs.existsSync(`${sslPath}/${_domain}-key.pem`);

	if (certFileExists) {
		fs.unlinkSync(`${sslPath}/${_domain}-cert.pem`);
	}

	if (keyFileExists) {
		fs.unlinkSync(`${sslPath}/${_domain}-key.pem`);
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
