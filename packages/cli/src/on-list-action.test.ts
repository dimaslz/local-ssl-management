import fs from "fs";
import shell from "shelljs";

import onListAction from "./on-list-action";

vi.mock("fs");

vi.mock("shelljs", async () => ({
	default: {
		exec: vi.fn((v) => v),
		echo: vi.fn((v) => v),
		exit: vi.fn((v) => v)
	}
}));

describe("On list action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("no domains available", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
		vi.spyOn(shell, 'exit').mockImplementation(() => { throw new Error(); });

		expect(() => { onListAction(); }).toThrow();

		expect(shell.echo).toHaveBeenCalledWith(`\nDoes not exists configs yet.\n`);
		expect(shell.exit).toHaveBeenCalledWith(1);
	});

	test("list domains availables", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([
			{
				"id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
				"domain": "local.some-domain.tld",
				"port": "3333"
			},
		]));

		onListAction();

		expect(shell.echo).toHaveBeenCalledWith(`
id                                   key                   domains                       port
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx local.some-domain.tld https://local.some-domain.tld 3333
`);
	});
});
