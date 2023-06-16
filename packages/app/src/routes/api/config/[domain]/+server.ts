import fs from "fs";
import up from "~/up";
import type Config from "config.type";

export const DELETE = async ({ params }) => {
	const { domain } = params;

	const data = JSON.parse(fs.readFileSync(`./config.json`, { encoding: "utf8" }) || "[]");
	const newData = data.filter((i: Config) => i.domain !== domain);
	fs.writeFileSync('./config.json', JSON.stringify(newData, null, 2));
	fs.unlinkSync(`./ssl/${domain}-cert.pem`);
	fs.unlinkSync(`./ssl/${domain}-key.pem`);

	up();

	return new Response(
		JSON.stringify({}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			}
		}
	)
}

export const PUT = async ({ request, params }) => {
	const { domain } = params;
	const { port } = await request.json();

	const data = JSON.parse(fs.readFileSync(`./config.json`, { encoding: "utf8" }) || "[]");
	const dataIndex = data.findIndex((i: Config) => i.domain === domain);
	data[dataIndex].port = port;
	fs.writeFileSync('./config.json', JSON.stringify(data, null, 2));

	up();

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