import consola from "consola";
import crypto from "crypto";
import fs from "fs";
import shell from "shelljs";

import onCreateAction from "./on-create-action";

vi.mock("./list-container");

describe("On create action", () => {
  beforeEach(() => {
    vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
    vi.spyOn(fs, "existsSync").mockReturnValueOnce(true);
  });

  describe("failures", () => {
    test("can not create with invalid domain", () => {
      const domain = "wrong.domain";
      const port = "3000";

      expect(() => {
        onCreateAction(domain, { port });
      }).toThrow();

      expect(consola.error).toBeCalledWith(
        new Error("Domain (https://wrong.domain) format is not valid"),
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    test("can not create with invalid port", () => {
      const domain = "some-domain.com";
      const port = "666";

      expect(() => {
        onCreateAction(domain, { port });
      }).toThrow();

      expect(consola.error).toBeCalledWith(
        new Error(
          "Port (--port <port>) should be into the range 1025 to 65535",
        ),
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    test("can not create duplicated location", () => {
      const domain = "some-domain.com";
      const port = "3000";
      const location = "/app-name";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(fs, "readdirSync").mockImplementationOnce((): any[] => [
        "some-domain.com-cert.pem",
        "some-domain.com-key.pem",
      ]);

      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
        JSON.stringify([
          {
            id: "57ef8e87-7547-4bf5-a6a9-3dad7ffebe9e",
            domain: "some-domain.com",
            services: [
              {
                id: "a4eb6238-f1ab-418e-b910-29d73192637a",
                port: "4000",
                location: "/",
              },
              {
                id: "a4eb6238-f1ab-418e-b910-29d73192637a",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]),
      );

      expect(() => {
        onCreateAction(domain, { port, location });
      }).toThrow();

      expect(consola.error).toBeCalledWith(
        new Error('Location "/app-name" already exists'),
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    test("can not create duplicated domain", () => {
      const domain = "some-domain.com";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(fs, "readdirSync").mockImplementationOnce((): any[] => [
        "some-domain.com-cert.pem",
        "some-domain.com-key.pem",
      ]);

      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
        JSON.stringify([
          {
            id: "57ef8e87-7547-4bf5-a6a9-3dad7ffebe9e",
            domain: "some-domain.com",
            services: [
              {
                id: "a4eb6238-f1ab-418e-b910-29d73192637a",
                port: "4000",
                location: "/",
              },
              {
                id: "a4eb6238-f1ab-418e-b910-29d73192637a",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]),
      );

      expect(() => {
        onCreateAction(domain, {});
      }).toThrow();

      expect(consola.error).toBeCalledWith(
        new Error(
          'Domain "some-domain.com" already created with the default location "/"',
        ),
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("success", () => {
    beforeEach(() => {
      vi.spyOn(fs, "mkdirSync");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(fs, "readdirSync").mockImplementationOnce((): any[] => [
        "some-domain.com-cert.pem",
        "some-domain.com-key.pem",
      ]);

      vi.spyOn(shell, "exec")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementationOnce((): any => "")
        .mockImplementationOnce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (): any => {
            return { stdout: 200 };
          },
        );
    });

    describe("single service", () => {
      test("domain config created sucessfully", () => {
        crypto.randomUUID = vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f");

        const domain = "some-domain.com";
        const port = "3000";

        onCreateAction(domain, { port });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /Users/dimaslz/Development/local-ssl-management/packages/cli/src/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        expect(fs.readFileSync).toBeCalledTimes(1);
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
                services: [
                  {
                    id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                    location: "/",
                    port: "3000",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config created sucessfully (does not exists /ssl)", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([]));
        vi.spyOn(fs, "existsSync").mockReturnValue(false);

        vi.spyOn(crypto, "randomUUID")
          .mockImplementationOnce(
            vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f"),
          )
          .mockImplementationOnce(
            vi.fn(() => "63add84e-b600-4f0f-9e1a-7ea85cfa2d06"),
          );

        const domain = "some-domain.com";
        const port = "3000";

        onCreateAction(domain, { port });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /Users/dimaslz/Development/local-ssl-management/packages/cli/src/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

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
                services: [
                  {
                    id: "63add84e-b600-4f0f-9e1a-7ea85cfa2d06",
                    location: "/",
                    port: "3000",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config already exists", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "8145baf2-6e39-453a-a842-9b4a4f576003",
                    port: "3000",
                    location: "/",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );

        const domain = "some-domain.com";
        const port = "3000";

        expect(() => {
          onCreateAction(domain, { port });
        }).toThrow();

        expect(consola.error).toBeCalledWith(
          new Error(
            'Domain "some-domain.com" already created with the default location "/"',
          ),
        );
        expect(shell.exit).toHaveBeenCalledWith(1);
      });
    });

    describe("multiple services", () => {
      test("domain config created sucessfully", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "54a04fef-f263-4eab-a17a-016c76986160",
                domain: "some-domain.com",
                services: [
                  {
                    id: "ac8a5cb1-a331-4888-8b6f-d99fc277a1ca",
                    port: "3000",
                    location: "/",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );

        vi.spyOn(fs, "existsSync").mockReturnValue(true);

        vi.spyOn(crypto, "randomUUID").mockImplementationOnce(
          vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f"),
        );

        const domain = "some-domain.com";
        const port = "4000";
        const location = "/app-name";

        onCreateAction(domain, { port, location });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /Users/dimaslz/Development/local-ssl-management/packages/cli/src/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "54a04fef-f263-4eab-a17a-016c76986160",
                domain: "some-domain.com",
                services: [
                  {
                    id: "ac8a5cb1-a331-4888-8b6f-d99fc277a1ca",
                    port: "3000",
                    location: "/",
                  },
                  {
                    id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                    location: "/app-name",
                    port: "4000",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config created sucessfully (does not exists /ssl)", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify([]));
        vi.spyOn(fs, "existsSync").mockReturnValue(false);

        vi.spyOn(crypto, "randomUUID")
          .mockImplementationOnce(
            vi.fn(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f"),
          )
          .mockImplementationOnce(
            vi.fn(() => "63add84e-b600-4f0f-9e1a-7ea85cfa2d06"),
          );

        const domain = "some-domain.com";
        const port = "3000";

        onCreateAction(domain, { port });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /Users/dimaslz/Development/local-ssl-management/packages/cli/src/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).toHaveBeenCalled();

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "63add84e-b600-4f0f-9e1a-7ea85cfa2d06",
                    location: "/",
                    port: "3000",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });

      test("domain config already exists", () => {
        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "8145baf2-6e39-453a-a842-9b4a4f576003",
                    port: "3000",
                    location: "/",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );

        const domain = "some-domain.com";
        const port = "3000";

        expect(() => {
          onCreateAction(domain, { port });
        }).toThrow();

        expect(consola.error).toBeCalledWith(
          new Error(
            'Domain "some-domain.com" already created with the default location "/"',
          ),
        );
        expect(shell.exit).toHaveBeenCalledWith(1);
      });
    });
  });
});
