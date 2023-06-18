import { vi } from "vitest";
import shell from "shelljs";

import validatePort from "./validate-port";

vi.mock('shelljs');

describe("Validate port", () => {
	afterEach(() => {
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
			validatePort(Number(port));

			expect(shell.echo).toBeCalled();
			expect(shell.exit).toHaveBeenCalledWith(1);
		});
	});
});
