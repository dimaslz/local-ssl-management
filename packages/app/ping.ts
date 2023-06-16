import shell from "shelljs";

import config from "./config.json";
import Config from "./src/types/config.type";

const run = async () => {
	(config as Config[]).forEach(({ domain }) => {
		const curl = `curl -s -o /dev/null -w "%{http_code}" https://${domain}`;
		const status = shell.exec(curl).stdout;

		if (status === "200") {
			console.log(` - https://${domain} ✅`);
		} else {
			console.log(` - https://${domain} ❌`);
		}
	});
}

run();