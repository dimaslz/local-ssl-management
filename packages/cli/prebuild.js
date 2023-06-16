import fs from "fs";
import cpy from "cpy";
import { rimrafSync } from "rimraf";

const run = async () => {
	if (fs.existsSync("dist/.local-ssl-management")) {
		await cpy("dist/.local-ssl-management/**/*", ".tmp-local-ssl-management");
	}

	rimrafSync("dist");

	if (fs.existsSync(".tmp-local-ssl-management")) {
		fs.mkdirSync("dist", { recursive: true });
		await cpy(".tmp-local-ssl-management/**/*", "dist/.local-ssl-management");
	}

	rimrafSync(".tmp-local-ssl-management");

	fs.mkdirSync("dist/.local-ssl-management/ssl", { recursive: true });
}

run();