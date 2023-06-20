import fs from "fs";
import shell from "shelljs";
import crypto from "crypto";

import onRemoveAction from "./on-remove-action";
import generateProxyImage from "./generate-proxy-image";

vi.mock("path", () => ({
	default: {
		resolve: () => "/root/path"
	}
}));

vi.mock("fs");

vi.mock("shelljs", async () => ({
	default: {
		exec: vi.fn((v) => v),
		echo: vi.fn((v) => v),
		exit: vi.fn((v) => v)
	}
}));

vi.mock("chalk", async () => ({
	default: {
		green: vi.fn((v) => v),
		red: vi.fn((v) => v)
	}
}));

vi.mock("./generate-proxy-image");

describe("On remove action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("failure", () => {
		test("removing domain by domain name does not exists", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");

			onRemoveAction("dummy");

			expect(shell.echo).toHaveBeenCalledWith(`\n[Error] - Domain "dummy" does not exists\n`);
			expect(shell.exit).toHaveBeenCalledWith(1);
		});

		test("remove domain by id does not exists", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");

			onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

			expect(shell.echo).toHaveBeenCalledWith(`\n[Error] - Domain with id \"6eb61d17-ba78-4618-a2ac-47aeb4ba8b26\" does not exists\n`);
			expect(shell.exit).toHaveBeenCalledWith(1);
		});
	});

	describe("success", () => {
		test("remove domain by id", () => {
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([
				{
					"id": "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
					"domain": "local.some-domain.tld",
					"port": "3333"
				},
			]));

			onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

			expect(fs.existsSync).toHaveBeenCalledTimes(2);
			expect(fs.existsSync).toHaveBeenNthCalledWith(
				1, expect.stringMatching(/.*?\/local.some-domain.tld-cert.pem$/g)
			);
			expect(fs.existsSync).toHaveBeenNthCalledWith(
				2, expect.stringMatching(/.*?\/local.some-domain.tld-key.pem$/g)
			);

			expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				1, expect.stringMatching(/.*?\/local.some-domain.tld-cert.pem$/g)
			);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				2, expect.stringMatching(/.*?\/local.some-domain.tld-key.pem$/g)
			);
			expect(shell.echo).toHaveBeenCalledTimes(2);
			expect(shell.echo).toHaveBeenNthCalledWith(1, `\n[Success] - 🎉 Domain removed succesful.\n`);
			expect(shell.echo).toHaveBeenNthCalledWith(2, `\n[Action] - 🔄 Updating proxy image.\n`);
			expect(generateProxyImage).toBeCalled();
		});

		test("remove domain by domain name", () => {
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([
				{
					"id": "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
					"domain": "local.some-domain.tld",
					"port": "3333"
				},
			]));

			onRemoveAction("local.some-domain.tld");

			expect(fs.existsSync).toHaveBeenCalledTimes(2);
			expect(fs.existsSync).toHaveBeenNthCalledWith(
				1, "/root/path/.local-ssl-management/ssl/local.some-domain.tld-cert.pem"
			);
			expect(fs.existsSync).toHaveBeenNthCalledWith(
				2, "/root/path/.local-ssl-management/ssl/local.some-domain.tld-key.pem"
			);

			expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				1, "/root/path/.local-ssl-management/ssl/local.some-domain.tld-cert.pem"
			);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				2, expect.stringMatching(/.*?\/local.some-domain.tld-key.pem$/g)
			);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				1, "/root/path/.local-ssl-management/ssl/local.some-domain.tld-cert.pem"
			);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				2, "/root/path/.local-ssl-management/ssl/local.some-domain.tld-key.pem"
			);
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				"/root/path/.local-ssl-management/config.json",
				JSON.stringify([], null, 2)
			);

			expect(shell.echo).toHaveBeenCalledTimes(2);
			expect(shell.echo).toHaveBeenNthCalledWith(1, `\n[Success] - 🎉 Domain removed succesful.\n`);
			expect(shell.echo).toHaveBeenNthCalledWith(2, `\n[Action] - 🔄 Updating proxy image.\n`);

			expect(generateProxyImage).toBeCalled();
		});

		test("remove multiple domain by domain key", () => {
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([
				{
					"id": "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
					"domain": "demo.com,demo.es",
					"port": "3333"
				},
			]));

			crypto.randomUUID = vi.fn(() => "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26")

			onRemoveAction("demo.com_demo.es");

			expect(fs.existsSync).toHaveBeenCalledTimes(2);
			expect(fs.existsSync).toHaveBeenNthCalledWith(
				1,
				expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g)
			);
			expect(fs.existsSync).toHaveBeenNthCalledWith(
				2,
				expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g)
			);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				1, expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g)
			);
			expect(fs.unlinkSync).toHaveBeenNthCalledWith(
				2, expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g)
			);
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expect.stringMatching(/.*?\/\.local-ssl-management\/config.json$/g),
				JSON.stringify([], null, 2)
			);

			expect(shell.echo).toHaveBeenCalledTimes(2);
			expect(shell.echo).toHaveBeenNthCalledWith(1, `\n[Success] - 🎉 Domain removed succesful.\n`);
			expect(shell.echo).toHaveBeenNthCalledWith(2, `\n[Action] - 🔄 Updating proxy image.\n`);

			expect(generateProxyImage).toBeCalled();
		});
	});
});
