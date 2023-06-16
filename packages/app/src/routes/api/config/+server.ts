import fs from "fs";
import shell from "shelljs";
import path from "path";

import up from "~/up";
import type Config from "config.type";

export const GET = async () => {
	const configPath = path.resolve(`.`, "config.json");

	const data = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");

	return new Response(
		JSON.stringify(data),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			}
		}
	)
}

export const POST = async ({ request }) => {
	const { domain, port } = await request.json();

	const data = JSON.parse(fs.readFileSync(`./config.json`, { encoding: "utf8" }) || "[]");

	const exists = data.find((d: Config) => d.domain === domain);
	if (exists) {
		return new Response(
			JSON.stringify({}),
			{
				status: 409,
				headers: {
					'Content-Type': 'application/json',
				}
			}
		)
	}

	shell.exec(`mkcert -install \
	-key-file ssl/${domain}-key.pem \
	-cert-file ssl/${domain}-cert.pem \
	${domain} localhost 127.0.0.1 ::1 > /dev/null`);

	const newData: Config[] = [...data, {
		domain: domain,
		port: port,
		ssl: { cert: `./ssl/${domain}-cert.pem`, key: `./ssl/${domain}-key.pem` },
		nginxConf: null,
	}];

	fs.writeFileSync('./config.json', JSON.stringify(newData, null, 2));

	up();

	return new Response(
		JSON.stringify(newData),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			}
		}
	)
}