import fs from "fs";

import { HOSTS_END, HOSTS_START } from "@/constants";
import onResetHosts from "@/on-reset-hosts";
import { updateSystemHosts } from "@/utils/update-system-hosts";

vi.mock("@/utils/update-system-hosts");

describe("Actions - onResetHosts", () => {
  describe("success", () => {
    test("reset hosts", async () => {
      vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1				other-domain.com
${HOSTS_START}
127.0.0.1				domain-name.com
${HOSTS_END}
`);
      await onResetHosts();

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
        encoding: "utf8",
      });

      // write files
      expect(fs.writeFileSync).toBeCalledWith(
        expect.stringMatching(/\/.tmp-hosts/i),
        `
127.0.0.1				other-domain.com

`,
      );

      expect(updateSystemHosts).toBeCalledWith(
        expect.stringMatching(/\/.tmp-hosts/i),
      );
    });
  });
});
