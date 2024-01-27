import consola from "consola";
import fs from "fs";
import shell from "shelljs";

import listContainer from "@/list-container";

describe("Actions - listContainer", () => {
  describe("success", () => {
    test("commmand found local-ssl-management container running", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (vi.spyOn(shell, "exec") as any).mockImplementation(() => {
        return {
          stdout:
            "XXXXXXXXXXXX | local-ssl-management | 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp",
        };
      });

      listContainer();

      expect(consola.info).toBeCalledWith("The local ssl proxy is running.");
      expect(consola.box).toBeCalledWith(
        "The local ssl proxy is running. Keep it mind that it is important to the local domains that works through HTTPS.",
      );

      expect(shell.echo).toHaveBeenCalledTimes(1);
      expect(shell.echo).toMatchSnapshot();

      // read files
      expect(fs.readFileSync).not.toBeCalled();

      // write files
      expect(fs.writeFileSync).not.toBeCalled();
    });
  });

  describe("failure", () => {
    test("some error happen", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (vi.spyOn(shell, "exec") as any).mockImplementation(() => {
        return {
          stdout:
            "XXXXXXXXXXXX | something | 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp",
        };
      });

      listContainer();

      expect(consola.error).toBeCalledWith(
        "Something have been failure. Contact with the author.",
      );

      // read files
      expect(fs.readFileSync).not.toBeCalled();

      // write files
      expect(fs.writeFileSync).not.toBeCalled();
    });
  });
});
