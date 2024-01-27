import fs from "fs";

import { domainExistsInHosts } from "@/utils";

describe("Utils - domainExistsInHosts", () => {
  test("domain does not exists", async () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1       				localhost
127.0.0.1               domain-exists.com
`);

    expect(await domainExistsInHosts("domain-does-not-exists.com")).toBe(false);
  });

  test("domain exists", async () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1       				localhost
127.0.0.1               domain-exists.com
`);

    expect(await domainExistsInHosts("domain-exists.com")).toBe(true);
  });
});
