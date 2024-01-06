import crypto from "crypto";
import fs from "fs";
import shell, { ShellString } from "shelljs";
import { SpyInstance } from "vitest";

import onCreateAction from "./on-create-action";

vi.mock("shelljs");
vi.mock("./list-container");
vi.mock("@dimaslz/local-ssl-management-core", async () => {
  return {
    getLocalIP: () => "11.22.33.445",
    mkcert: vi.fn(),
  };
});
vi.mock("fs");
vi.mock("chalk", async () => ({
  default: {
    green: vi.fn((v) => v),
    red: vi.fn((v) => v),
  },
}));

describe("On create action", () => {
  describe("failures", () => {
    beforeEach(() => {
      vi.spyOn(shell, "echo").mockImplementation((v) => ShellString(v));
      vi.spyOn(shell, "exit").mockImplementation(() =>
        Promise.resolve(1 as never),
      );
      vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
    });

    test("can not create with invalid domain", () => {
      const domain = "wrong.domain";
      const port = 3000;

      expect(() => {
        onCreateAction(domain, { port });
      }).toThrow();

      expect(shell.echo).toHaveBeenCalledWith(
        "\n[Error] - Domain (https://wrong.domain)format is not valid\n",
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    test("can not create with invalid port", () => {
      const domain = "some-domain.com";
      const port = 666;

      expect(() => {
        onCreateAction(domain, { port });
      }).toThrow();

      expect(shell.echo).toHaveBeenCalledWith(
        "\n[Error] - Port (--port <port>) should be into the range 1025 to 65535\n",
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("success", () => {
    beforeEach(() => {
      vi.clearAllMocks();

      vi.spyOn(fs, "mkdirSync");
      (vi.spyOn(fs, "readdirSync") as SpyInstance).mockImplementation(() => [
        "some-domain.com-cert.pem",
        "some-domain.com-key.pem",
      ]);
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(shell, "exec").mockImplementation(() => {
        return { stdout: "200" };
      });
    });

    describe("double service", () => {
      test("domain config created sucessfully (double location)", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "a5051812-e151-4ca3-b9b6-b86f6fb05817",
                domain: "some-domain.com",
                port: "3000",
                location: "/",
              },
            ],
            null,
            2,
          ),
        );

        crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

        const domain = "some-domain.com";
        const port = 3000;
        const location = "/lala";

        onCreateAction(domain, { port, location });

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/i),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                port: "3000,3000",
                location: "/,/lala",
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config created sucessfully (double location with different port)", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "a5051812-e151-4ca3-b9b6-b86f6fb05817",
                domain: "some-domain.com",
                port: "3000",
                location: "/",
              },
            ],
            null,
            2,
          ),
        );

        crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

        const domain = "some-domain.com";
        const port = 4000;
        const location = "/lala";

        onCreateAction(domain, { port, location });

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/i),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                port: "3000,4000",
                location: "/,/lala",
              },
            ],
            null,
            2,
          ),
        );
      });
    });

    describe("single service", () => {
      test("domain config created sucessfully", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue("[]");

        crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

        const domain = "some-domain.com";
        const port = "3000";

        onCreateAction(domain, { port });

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                port: "3000",
                location: "/",
              },
            ],
            null,
            2,
          ),
        );
      });

      test("double domain config created sucessfully", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue("[]");

        crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

        const domain = "some-domain.com,some-domain.es";
        const port = "3000";

        onCreateAction(domain, { port });

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com,some-domain.es",
                port: "3000",
                location: "/",
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config created sucessfully (does not exists /ssl)", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
        vi.spyOn(fs, "existsSync").mockReturnValue(false);

        crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

        const domain = "some-domain.com";
        const port = "3000";

        onCreateAction(domain, { port });

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).toHaveBeenCalled();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                port: "3000",
                location: "/",
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config already exists", () => {
        vi.spyOn(shell, "echo").mockImplementation(
          vi.fn(() => ShellString("1")),
        );
        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                port: "3000",
                location: "/",
              },
            ],
            null,
            2,
          ),
        );

        vi.spyOn(shell, "exit").mockImplementation(() => {
          throw new Error();
        });

        const domain = "some-domain.com";
        const port = "3000";

        expect(() => {
          onCreateAction(domain, { port });
        }).toThrow();

        expect(shell.echo).toHaveBeenCalledWith(
          "\n[Error] - Domain already exists\n",
        );
        expect(shell.exit).toHaveBeenCalledWith(1);
      });
    });
  });
});
