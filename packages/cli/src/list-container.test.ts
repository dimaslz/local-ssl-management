import shell from "shelljs";

import listContainer from "./list-container";

vi.mock("chalk", async () => ({
  default: {
    green: vi.fn((v) => v),
    red: vi.fn((v) => v),
  },
}));

vi.mock("shelljs");

describe("List container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

      expect(shell.echo).toHaveBeenCalledTimes(2);
      expect(shell.echo).toMatchSnapshot();
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

      vi.spyOn(shell, "exit").mockImplementation(() => {
        throw new Error();
      });

      expect(() => {
        listContainer();
      }).toThrow();

      expect(shell.echo).toBeCalledTimes(1);
      expect(shell.exit).toBeCalledTimes(1);
    });
  });
});
