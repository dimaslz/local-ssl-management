import shell from "shelljs";

import { validateDomain } from "@/utils";

describe("Validate domain", () => {
  describe("wrong TLD", () => {
    describe("failure", () => {
      test("domain with wrong TLD should not be acceptable", () => {
        const domain = "your-domain.FAKE_TLD";

        expect(() => {
          validateDomain(domain);
        }).toThrowError(
          "Domain (https://your-domain.FAKE_TLD) format is not valid",
        );
      });

      test("domain with not allowed characters should not be acceptable", () => {
        const domain = "your!domain.com";

        expect(() => {
          validateDomain(domain);
        }).toThrowError("Domain (https://your!domain.com) format is not valid");
      });
    });
  });

  describe("success", () => {
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
