import shell from "shelljs";

import validateDomain from "./validate-domain";

vi.mock('shelljs');

vi.mock("chalk", async () => ({
	default: {
		green: vi.fn((v) => v),
		red: vi.fn((v) => v)
	}
}));

describe("Validate domain", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("wrong TLD", () => {
		test("domain with wrong TLD should not be acceptable", () => {
			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			const domain = "your-domain.FAKE_TLD";

			expect(() => { validateDomain(domain); }).toThrow();

			expect(shell.echo).toBeCalledWith(`\n[Error] - Domain (https://your-domain.FAKE_TLD)format is not valid\n`);
			expect(shell.exit).toHaveBeenCalledWith(1);
		});

		test("domain with not allowed characters should not be acceptable", () => {
			vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

			const domain = "your!domain.com";

			expect(() => { validateDomain(domain); }).toThrow();

			expect(shell.echo).toBeCalledWith("\n[Error] - Domain (https://your!domain.com)format is not valid\n");
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
