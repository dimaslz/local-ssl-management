import fs from "fs";
import shell from "shelljs";

import generateProxyImage from "./generate-proxy-image";
import onUpdateAction from "./on-update-action";
import validatePort from "./utils/validate-port";

vi.mock("./generate-proxy-image");
vi.mock("./utils/validate-port");
vi.mock("fs");
vi.mock("shelljs");
vi.mock("@dimaslz/local-ssl-management-core", () => ({
  mkcert: vi.fn(),
  getLocalIP: vi.fn(() => "192.168.0.0"),
}));
vi.mock("./list-container");
vi.mock("path", () => ({
  default: {
    resolve: () => "/root/path",
  },
}));

vi.mock("chalk", async () => ({
  default: {
    green: vi.fn((v) => v),
    red: vi.fn((v) => v),
  },
}));

describe("On update action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("failures", () => {
    test("update domain by wrong domain key", () => {
      const domain = "foo-domain.com";
      const port = 3333;

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              port: 3000,
            },
          ],
          null,
          2,
        ),
      );
      vi.spyOn(shell, "exit").mockImplementation(() => {
        throw new Error();
      });

      expect(() => {
        onUpdateAction(domain, { port });
      }).toThrow();

      expect(shell.echo).toBeCalledWith(
        '\n[Error] - Domain "foo-domain.com" does not exists\n',
      );
      expect(shell.exit).toBeCalledWith(1);
    });

    test("update domain by wrong id", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a0722";
      const port = 3333;

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              port: 3000,
            },
          ],
          null,
          2,
        ),
      );
      vi.spyOn(shell, "exit").mockImplementation(() => {
        throw new Error();
      });

      expect(() => {
        onUpdateAction(domain, { port });
      }).toThrow();

      expect(shell.echo).toBeCalledWith(
        '\n[Error] - Domain with key "48d1a85c-377a-40ef-8a82-d1405f7a0722" does not exists\n',
      );
      expect(shell.exit).toBeCalledWith(1);
    });
  });

  describe("success", () => {
    test("update domain by domain key", () => {
      const domain = "some-domain.com";
      const port = 3333;

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              port: 3000,
            },
          ],
          null,
          2,
        ),
      );

      onUpdateAction(domain, { port });

      expect(validatePort).toBeCalled();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/root/path/.local-ssl-management/config.json",
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              port: 3333,
            },
          ],
          null,
          2,
        ),
      );

      expect(shell.echo).toBeCalledTimes(2);
      expect(shell.echo).nthCalledWith(
        1,
        "\n[Success] - 🎉 Domain removed succesful.\n",
      );
      expect(shell.echo).nthCalledWith(
        2,
        "\n[Action] - 🔄 Updating proxy image.\n",
      );

      expect(generateProxyImage).toBeCalled();
    });

    test("update domain by domain id", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";
      const port = 3333;

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              port: 3000,
            },
          ],
          null,
          2,
        ),
      );

      onUpdateAction(domain, { port });

      expect(validatePort).toBeCalled();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/root/path/.local-ssl-management/config.json",
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              port: 3333,
            },
          ],
          null,
          2,
        ),
      );

      expect(shell.echo).toBeCalledTimes(2);
      expect(shell.echo).nthCalledWith(
        1,
        "\n[Success] - 🎉 Domain removed succesful.\n",
      );
      expect(shell.echo).nthCalledWith(
        2,
        "\n[Action] - 🔄 Updating proxy image.\n",
      );

      expect(generateProxyImage).toBeCalled();
    });
  });
});
