import consola from "consola";
import shell from "shelljs";

import { validateDomain } from ".";

describe("Validate domain", () => {
  describe("wrong TLD", () => {
    test("domain with wrong TLD should not be acceptable", () => {
      const domain = "your-domain.FAKE_TLD";

      validateDomain(domain);

      expect(consola.error).toBeCalledWith(
        "Domain (https://your-domain.FAKE_TLD) format is not valid",
      );
    });

    test("domain with not allowed characters should not be acceptable", () => {
      const domain = "your!domain.com";

      validateDomain(domain);

      expect(consola.error).toBeCalledWith(
        "Domain (https://your!domain.com) format is not valid",
      );
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
    });
  });
});
