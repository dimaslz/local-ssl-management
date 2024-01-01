import crypto from "crypto";
import fs from "fs";
import shell from "shelljs";

import onRemoveAction from "./on-remove-action";

vi.mock("./list-container");
vi.mock("path", () => ({
  default: {
    resolve: () => "/root/path",
  },
}));

vi.mock("fs");
vi.mock("shelljs", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await vi.importActual("shelljs");

  return {
    ...actual,
    default: {
      exec: vi.fn((v) => v),
      echo: vi.fn((v) => v),
      exit: vi.fn((v) => v),
    },
  };
});
vi.mock("chalk", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await vi.importActual("chalk");

  return {
    default: {
      ...actual,
      green: vi.fn((v) => v),
      red: vi.fn((v) => v),
    },
  };
});

describe("On remove action", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(shell, "exit").mockImplementation(() => {
      throw new Error();
    });
  });

  describe("failure", () => {
    test("removing domain by name does not exists", () => {
      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify([]));

      expect(() => {
        onRemoveAction("dummy");
      }).toThrow();

      expect(shell.echo).toHaveBeenCalledWith(
        `\n[Error] - Domain "dummy" does not exists\n`,
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    test("remove domain by id does not exists", () => {
      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify([]));

      expect(() => {
        onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");
      }).toThrow();

      expect(shell.echo).toHaveBeenCalledWith(
        `\n[Error] - Domain with id "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26" does not exists\n`,
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    test("removing path does not exists", () => {
      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
        JSON.stringify(
          [
            {
              id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
              domain: "domain.tld",
              services: [
                {
                  id: "6c57a1a0-3577-4fba-a0d8-73b81e7855d8",
                  location: "/app-name",
                  port: "3000",
                },
              ],
            },
          ],
          null,
          2,
        ),
      );

      expect(() => {
        onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26", {
          location: "/something",
        });
      }).toThrow();

      expect(shell.echo).toHaveBeenCalledWith(
        `\n[Error] - Location "/something" does not exists\n`,
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("success", () => {
    test("remove domain by id", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
            domain: "local.some-domain.tld",
            services: [
              {
                id: "bed951c4-8829-4afe-911c-8a2d212e4f0f",
                port: "3333",
                location: "/",
              },
            ],
          },
        ]),
      );

      expect(() => {
        onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");
      }).toThrow();

      // unlink
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/local.some-domain.tld-cert.pem$/g),
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/local.some-domain.tld-key.pem$/g),
      );

      // shell echo's
      expect(shell.echo).toHaveBeenCalledTimes(3);
      expect(shell.echo).toHaveBeenNthCalledWith(
        1,
        `\n[Success] - 🎉 Domain removed succesful.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        2,
        `\n[Action] - 🔄 Updating proxy image.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        3,
        `\n[Info] - Does not exists config to create reverse proxy\n`,
      );
      expect(shell.exit).toBeCalledWith(1);
    });

    test("remove domain by name", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
            domain: "local.some-domain.tld",
            services: [
              {
                id: "bed951c4-8829-4afe-911c-8a2d212e4f0f",
                port: "3333",
                location: "/",
              },
            ],
          },
        ]),
      );

      expect(() => {
        onRemoveAction("local.some-domain.tld");
      }).toThrow();

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        1,
        "/root/path/.local-ssl-management/ssl/local.some-domain.tld-cert.pem",
      );
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        2,
        "/root/path/.local-ssl-management/ssl/local.some-domain.tld-key.pem",
      );

      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        1,
        "/root/path/.local-ssl-management/ssl/local.some-domain.tld-cert.pem",
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/local.some-domain.tld-key.pem$/g),
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        1,
        "/root/path/.local-ssl-management/ssl/local.some-domain.tld-cert.pem",
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        2,
        "/root/path/.local-ssl-management/ssl/local.some-domain.tld-key.pem",
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/root/path/.local-ssl-management/config.json",
        JSON.stringify([], null, 2),
      );

      expect(shell.echo).toHaveBeenCalledTimes(3);
      expect(shell.echo).toHaveBeenNthCalledWith(
        1,
        `\n[Success] - 🎉 Domain removed succesful.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        2,
        `\n[Action] - 🔄 Updating proxy image.\n`,
      );
    });

    test("remove multiple domain by name", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
            domain: "demo.com,demo.es",
            services: [
              {
                id: "bed951c4-8829-4afe-911c-8a2d212e4f0f",
                port: "3333",
                location: "/",
              },
              {
                id: "a1847b28-fb4e-4773-a93b-7495d15cbe2f",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]),
      );

      crypto.randomUUID = vi.fn(() => "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

      expect(() => {
        onRemoveAction("demo.com_demo.es");
      }).toThrow();

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g),
      );
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g),
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g),
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/.*?\/\.local-ssl-management\/config.json$/g),
        JSON.stringify([], null, 2),
      );

      expect(shell.echo).toHaveBeenCalledTimes(3);
      expect(shell.echo).toHaveBeenNthCalledWith(
        1,
        `\n[Success] - 🎉 Domain removed succesful.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        2,
        `\n[Action] - 🔄 Updating proxy image.\n`,
      );
    });

    test("remove multiple domain by domain id", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
            domain: "demo.com,demo.es",
            services: [
              {
                id: "bed951c4-8829-4afe-911c-8a2d212e4f0f",
                port: "3333",
                location: "/",
              },
              {
                id: "a1847b28-fb4e-4773-a93b-7495d15cbe2f",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]),
      );

      crypto.randomUUID = vi.fn(() => "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

      expect(() => {
        onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");
      }).toThrow();

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g),
      );
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g),
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g),
      );
      expect(fs.unlinkSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/.*?\/\.local-ssl-management\/config.json$/g),
        JSON.stringify([], null, 2),
      );

      expect(shell.echo).toHaveBeenCalledTimes(3);
      expect(shell.echo).toHaveBeenNthCalledWith(
        1,
        `\n[Success] - 🎉 Domain removed succesful.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        2,
        `\n[Action] - 🔄 Updating proxy image.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        3,
        `\n[Info] - Does not exists config to create reverse proxy\n`,
      );
    });

    test("remove location", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify([
          {
            id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
            domain: "demo.com,demo.es",
            services: [
              {
                id: "bed951c4-8829-4afe-911c-8a2d212e4f0f",
                port: "3333",
                location: "/",
              },
              {
                id: "a1847b28-fb4e-4773-a93b-7495d15cbe2f",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]),
      );

      crypto.randomUUID = vi.fn(() => "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

      onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26", {
        location: "/app-name",
      });

      expect(fs.existsSync).toHaveBeenCalledTimes(6);
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g),
      );
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g),
      );

      expect(fs.writeFileSync).toBeCalledTimes(3);
      expect(fs.writeFileSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/\.local-ssl-management\/config.json$/g),
        JSON.stringify(
          [
            {
              id: "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26",
              domain: "demo.com,demo.es",
              services: [
                {
                  id: "bed951c4-8829-4afe-911c-8a2d212e4f0f",
                  port: "3333",
                  location: "/",
                },
              ],
            },
          ],
          null,
          2,
        ),
      );

      expect(shell.echo).toHaveBeenCalledTimes(4);
      expect(shell.echo).toHaveBeenNthCalledWith(
        1,
        `\n[Success] - 🎉 Domain removed succesful.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(
        2,
        `\n[Action] - 🔄 Updating proxy image.\n`,
      );
      expect(shell.echo).toHaveBeenNthCalledWith(3, `\nSSL proxy running\n`);
      expect(shell.echo).toMatchSnapshot();
    });
  });
});
