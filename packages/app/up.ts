import fs from "fs";
import path from "path";
import shell from "shelljs";

import getLocalIP from "./src/utils/get-local-ip.js";
import type Config from "config.type.js";

const { pathname: __dirname } = new URL('./', import.meta.url);

const folderExists = (folder: string) => {
	return JSON.parse(shell.exec(`if [[ -d ${folder} ]]; then echo 'true'; else echo 'false'; fi;`).stdout.trim());
}

const fileExists = (file: string) => {
	return JSON.parse(shell.exec(`if [[ -f ${file} ]]; then echo 'true'; else echo 'false'; fi;`).stdout.trim());
}

const LOCAL_IP = getLocalIP();
const toReplace = "#--server-config--#";

if (!shell.which('mkcert')) {
	shell.echo('Sorry, this script requires "mkcert"');
	shell.exit(1);
}

if (!shell.which('docker')) {
	shell.echo('Sorry, this script requires "docker"');
	shell.exit(1);
}

const up = () => {
	const configPath = path.resolve(__dirname, "config.json");
	if (!fileExists(configPath)) {
		console.log("Sorry, config.json does not exists.");
	}

	const config: Config[] = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

	const domains = config.map((c) => c.domain.split(",").map(d => d.trim()).join("_")).concat("localhost");
	const filesToRemove = fs.readdirSync(path.resolve(__dirname, "ssl"))
		.filter((file) => {
			const f = file.replace(/-?cert\..+?$|-?key\..+?$/, "");
			return !domains.includes(f)
		});

	filesToRemove.forEach(file => fs.unlinkSync(path.resolve(__dirname, `ssl/${file}`)))

	const localhostCertExists = fs.existsSync(path.resolve(__dirname, "ssl/localhost-cert.pem"));
	const localhostKeyExists = fs.existsSync(path.resolve(__dirname, "ssl/localhost-key.pem"));
	if (!localhostCertExists || !localhostKeyExists) {
		shell.exec(`mkcert -install -key-file ssl/localhost-key.pem -cert-file ssl/localhost-cert.pem localhost 127.0.0.1 ::1`)
	}

	const nginxConfServerTplPath = path.resolve(__dirname, "assets/nginx.conf.server.tpl");

	const certsUrl: { cert: string; key: string; }[] = [];
	const newConfig: Config[] = [];
	const serverConfigs: string[] = config.map((c: Config) => {
		if (!fileExists(nginxConfServerTplPath)) {
			console.log("Sorry, is not possible to find './nginx.conf.server.tpl' file.");
		}

		const nginxConfServerTpl = fs.readFileSync(nginxConfServerTplPath, { encoding: "utf8" });

		if (c.nginxConf) {
			return nginxConf;
		}

		const multipleDomains = c.domain.split(",").length > 1;
		const domain = multipleDomains ? c.domain.split(",").map(d => d.trim()).join(" ") : c.domain.trim();
		const certName = multipleDomains ? c.domain.split(",").map(d => d.trim()).join("_") : c.domain.trim();

		if (!c.ssl.cert || !c.ssl.key) {
			shell.exec(`mkcert -install -key-file ssl/${certName}-key.pem -cert-file ssl/${certName}-cert.pem ${domain} localhost 127.0.0.1 ::1`)

			c.ssl.cert = `./ssl/${certName}-cert.pem`;
			c.ssl.key = `./ssl/${certName}-key.pem`;
		}

		certsUrl.push({
			cert: c.ssl.cert,
			key: c.ssl.key
		});

		newConfig.push(c);

		return nginxConfServerTpl
			.replaceAll("%APP_DOMAIN%", certName)
			.replace("%SERVER_NAME%", c.domain.split(",").map(i => i.trim()).join(' '))
			.replace("%LOCAL_IP%", LOCAL_IP)
			.replace("%PORT%", String(c.port));
	});

	fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

	const nginxConfTplPath = path.resolve(__dirname, "assets/nginx.conf.tpl");
	if (!fileExists(nginxConfTplPath)) {
		console.log("Sorry, is not possible to find 'nginx.conf.tpl' file.");
	}

	const nginxConfTpl = fs.readFileSync(nginxConfTplPath, { encoding: "utf8" });
	const nginxConf = nginxConfTpl.replace(toReplace, serverConfigs.join("\n"));

	const nginxConfDest = path.resolve(__dirname, "nginx.conf");
	fs.writeFileSync(nginxConfDest, nginxConf);

	const dockerfileTplPath = path.resolve(__dirname, "assets/Dockerfile.tpl");
	const dockerfileContent = fs.readFileSync(dockerfileTplPath, { encoding: "utf8" });
	const dockerfileDest = path.resolve(__dirname, "Dockerfile");
	fs.writeFileSync(dockerfileDest, dockerfileContent.replace(
		"#-certs-#",
		certsUrl.map((d: { cert: string; key: string; }) => {
			return `COPY ${d.key} /etc/nginx/
COPY ${d.cert} /etc/nginx/`
		}).join("\n\n")
	));

	shell.exec(`NAME=local-ssl-management && \
	docker rm -f $NAME && \
	docker rmi -f $NAME && \
	docker build --no-cache -t $NAME . && \
	docker run --name $NAME -p 80:80 -p 443:443 -d $NAME && \
	docker ps`);

	config.forEach((c: Config) => {
		c.domain.split(",").map(d => d.trim()).forEach((domain) => {
			const curl = `curl -s -o /dev/null -w "%{http_code}" https://${domain}`;
			const status = shell.exec(curl).stdout;

			if (status === "200") {
				console.log(` - https://${domain} ✅`);
			} else {
				console.log(` - https://${domain} ❌`);
			}
		})
	});
}

export default up;