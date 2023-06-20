import { vi } from "vitest";
import shell from "shelljs";

import validatePort from "./validate-port";

vi.mock('shelljs');

vi.mock("chalk", async () => ({
	default: {
		green: vi.fn((v) => v),
		red: vi.fn((v) => v)
	}
}));

describe("Validate port", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("valid", () => {
		const ports = [
			["1025"],
			["3000"],
			["65535"],
		];
		test.each(ports)("Port %s is valid", (port) => {
			validatePort(Number(port));

			expect(shell.echo).not.toBeCalled();
			expect(shell.exit).not.toHaveBeenCalledWith(1);
		});
	});

	describe("invalid (port should be from 1025 to 65535", () => {
		const ports = [
			["foo"],
			["333"],
			["1024"],
			["70000"],
		];

		test.each(ports)("Port %s is not valid", (port) => {
			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			expect(() => { validatePort(Number(port)); }).toThrow();

			if (Number(port)) {
				expect(shell.echo).toBeCalledWith("\n[Error] - Port (--port <port>) should be into the range 1025 to 65535\n");
			} else {
				expect(shell.echo).toBeCalledWith("\n[Error] - Port (--port <port>) should be a valid number\n");
			}
			expect(shell.exit).toHaveBeenCalledWith(1);
		});
	});
});
