import { vi } from "vitest";
import shell from "shelljs";

import listContainer from "./list-container";

vi.mock("chalk", async () => ({
	default: {
		green: vi.fn((v) => v),
		red: vi.fn((v) => v)
	}
}));

vi.mock("shelljs");


describe("List container", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("success", () => {

		test("commmand found local-ssl-management container running", async () => {
			// TODO: how to fix it? (typescript issue)
			(shell.exec as any) = vi.fn(() => {
				return {
					stdout: "XXXXXXXXXXXX | local-ssl-management | 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp"
				};
			});
			listContainer();

			expect(shell.echo).toHaveBeenCalledTimes(2);

			expect(shell.echo).toHaveBeenNthCalledWith(1, `\nThe local ssl proxy is running.\n
		ℹ️ The local ssl proxy is running. Keep it mind that it is important to the local domains that works through HTTPS.\n`);
			expect(shell.echo).toHaveBeenNthCalledWith(2, `
┌──────────────┬──────────────────────┬──────────────────────────────────────────┐
│ container id │ container image      │ port                                     │
├──────────────┼──────────────────────┼──────────────────────────────────────────┤
│ XXXXXXXXXXXX │ local-ssl-management │ 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp │
└──────────────┴──────────────────────┴──────────────────────────────────────────┘
`);
		});
	});

	describe("failure", () => {
		test("some error happen", () => {
			// TODO: how to fix it? (typescript issue)
			(shell.exec as any) = vi.fn(() => ({
				stdout: "XXXXXXXXXXXX | something | 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp"
			}));
			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			expect(() => { listContainer(); }).toThrow();

			expect(shell.echo).toHaveBeenCalled();
			expect(shell.exit).toHaveBeenCalled();
		});
	});
});
