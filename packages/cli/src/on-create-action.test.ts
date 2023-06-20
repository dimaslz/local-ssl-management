import fs from "fs";
import { vi } from "vitest";
import shell, { ShellString } from "shelljs";
import crypto from "crypto";

import onCreateAction from "./on-create-action";
import generateProxyImage from "./generate-proxy-image";

vi.mock("shelljs");
vi.mock("fs");
vi.mock("chalk", async () => ({
	default: {
		green: vi.fn((v) => v),
		red: vi.fn((v) => v)
	}
}));

vi.mock("./generate-proxy-image");

describe("On create action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("failures", () => {
		test("can not create with invalid domain", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			const domain = "wrong.domain";
			const port = 3000;

			expect(() => { onCreateAction(domain, { port }); }).toThrow();

			expect(shell.echo).toHaveBeenCalledWith("\n[Error] - Domain (https://wrong.domain)format is not valid\n");
			expect(shell.exit).toHaveBeenCalledWith(1);
		});

		test("can not create with invalid port", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
			vi.spyOn(shell, 'echo').mockImplementation((v) => ShellString(v));
			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			const domain = "some-domain.com";
			const port = 666;

			expect(() => { onCreateAction(domain, { port }); }).toThrow();

			expect(shell.echo).toHaveBeenCalledWith("\n[Error] - Port (--port <port>) should be into the range 1025 to 65535\n");
			expect(shell.exit).toHaveBeenCalledWith(1);
		});
	});

	describe("success", () => {
		test("domain config created sucessfully", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
			vi.spyOn(fs, "mkdirSync");
			// TODO: how to fix it? (typescript issue)
			(fs.readdirSync as any) = vi.fn(() => ([
				"some-domain.com-cert.pem",
				"some-domain.com-key.pem",
			]));
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

			const domain = "some-domain.com";
			const port = 3000;

			onCreateAction(domain, { port });

			expect(fs.readFileSync).toHaveBeenNthCalledWith(
				1,
				expect.stringMatching(/.local-ssl-management\/config.json/),
				{ encoding: "utf8" }
			);
			expect(fs.existsSync).toHaveBeenCalledWith(
				expect.stringMatching(/.local-ssl-management\/ssl/),
			);
			expect(fs.mkdirSync).not.toHaveBeenCalled();

			expect(generateProxyImage).toHaveBeenCalled();
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expect.stringMatching(/.local-ssl-management\/config.json/),
				JSON.stringify([
					{
						"id": "48d1a85c-377a-40ef-8a82-d1405f7a074f",
						"domain": "some-domain.com",
						"port": 3000
					}
				], null, 2)
			);
		});

		test("double domain config created sucessfully", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
			vi.spyOn(fs, "existsSync").mockReturnValue(true);

			crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

			const domain = "some-domain.com,some-domain.es";
			const port = 3000;

			onCreateAction(domain, { port });

			expect(fs.readFileSync).toHaveBeenNthCalledWith(
				1,
				expect.stringMatching(/.local-ssl-management\/config.json/),
				{ encoding: "utf8" }
			);
			expect(fs.existsSync).toHaveBeenCalledWith(
				expect.stringMatching(/.local-ssl-management\/ssl/),
			);
			expect(fs.mkdirSync).not.toHaveBeenCalled();

			expect(generateProxyImage).toHaveBeenCalled();
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expect.stringMatching(/.local-ssl-management\/config.json/),
				JSON.stringify([
					{
						"id": "48d1a85c-377a-40ef-8a82-d1405f7a074f",
						"domain": "some-domain.com,some-domain.es",
						"port": 3000
					}
				], null, 2)
			);
		});

		test("domain config created sucessfully (does not exists /ssl)", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
			// TODO: how to fix it? (typescript issue)
			(fs.readdirSync as any) = vi.fn(() => ([
				"some-domain.com-cert.pem",
				"some-domain.com-key.pem",
			]));
			vi.spyOn(fs, "existsSync").mockReturnValue(false);

			crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

			const domain = "some-domain.com";
			const port = 3000;

			onCreateAction(domain, { port });

			expect(fs.readFileSync).toHaveBeenNthCalledWith(
				1,
				expect.stringMatching(/.local-ssl-management\/config.json/),
				{ encoding: "utf8" }
			);
			expect(fs.existsSync).toHaveBeenCalledWith(
				expect.stringMatching(/.local-ssl-management\/ssl/),
			);
			expect(fs.mkdirSync).toHaveBeenCalled();

			expect(generateProxyImage).toHaveBeenCalled();
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expect.stringMatching(/.local-ssl-management\/config.json/),
				JSON.stringify([
					{
						"id": "48d1a85c-377a-40ef-8a82-d1405f7a074f",
						"domain": "some-domain.com",
						"port": 3000
					}
				], null, 2)
			);
		});

		test("domain config already exists", () => {
			vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([
				{
					"id": "48d1a85c-377a-40ef-8a82-d1405f7a074f",
					"domain": "some-domain.com",
					"port": 3000
				}
			], null, 2));
			// TODO: how to fix it? (typescript issue)
			(fs.readdirSync as any) = vi.fn(() => ([
				"some-domain.com-cert.pem",
				"some-domain.com-key.pem",
			]));
			vi.spyOn(fs, "existsSync").mockReturnValue(true);

			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			const domain = "some-domain.com";
			const port = 3000;

			expect(() => { onCreateAction(domain, { port }); }).toThrow();

			expect(shell.echo).toHaveBeenCalledWith("\n[Error] - Domain already exists\n");
			expect(shell.exit).toHaveBeenCalledWith(1);
		});
	})
});
