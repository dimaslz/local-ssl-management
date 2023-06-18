import { vi } from "vitest";
import shell from "shelljs";

import validateDomain from "./validate-domain";

vi.mock('shelljs');

describe("Validate domain", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("wrong TLD", () => {
		test("domain with wrong TLD should not be acceptable", () => {
			const domain = "your-domain.FAKE_TLD";

			validateDomain(domain);

			expect(shell.echo).toBeCalled();
			expect(shell.exit).toHaveBeenCalledWith(1);
		});

		test("domain with not allowed characters should not be acceptable", () => {
			const domain = "your!domain.com";

			validateDomain(domain);

			expect(shell.echo).toBeCalled();
			expect(shell.exit).toHaveBeenCalledWith(1);
		});
	});

	describe("corrent domains", () => {
		const domains = [
			["your-domain.com"],
			["local.your-domain.com"],
			["your-domain.local"],
			["foo.your-domain.local"],
			["your-domain.test"],
			["foo.your-domain.local"],
		];

		test.each(domains)("domain %s is acceptable", (domain) => {
			validateDomain(domain);

			expect(shell.echo).not.toBeCalled();
			expect(shell.exit).not.toHaveBeenCalledWith(1);
		});
	});
});
