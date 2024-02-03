import consola from "consola";
import fs from "fs";
import shell from "shelljs";

import onCreateAction from "@/on-create-action";

vi.mock("@/list-container");

describe("Actions - onCreateAction", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValueOnce(true);
  });

  describe("failures", () => {
    test("can not create duplicated domain", async () => {
      const domain = "some-domain.com";
      const port = "4000";
      const location = "/app-name";

      vi.spyOn(fs, "readFileSync")
        .mockReturnValueOnce(
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
        )
        .mockReturnValueOnce(
          `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`,
        );

      await onCreateAction(domain, { port, location });

      // read files
      expect(fs.readFileSync).toBeCalledTimes(2);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );
      expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
        encoding: "utf8",
      });

      // write files
      expect(fs.writeFileSync).not.toBeCalled();

      expect(shell.exec).not.toBeCalled();

      expect(consola.error).toBeCalledWith(
        'Domain "some-domain.com" already exists, with this location "/app-name" and port "4000"',
      );
    });

    test("can not create duplicated domain (with default options)", async () => {
      const domain = "some-domain.com";

      vi.spyOn(fs, "readFileSync")
        .mockReturnValueOnce(
          JSON.stringify([
            {
              id: "57ef8e87-7547-4bf5-a6a9-3dad7ffebe9e",
              domain: "some-domain.com",
              services: [
                {
                  id: "a4eb6238-f1ab-418e-b910-29d73192637a",
                  port: "3000",
                  location: "/",
                },
                {
                  id: "a4eb6238-f1ab-418e-b910-29d73192637a",
                  port: "4000",
                  location: "/app-name",
                },
              ],
            },
          ]),
        )
        .mockReturnValueOnce(
          `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`,
        );

      await onCreateAction(domain, {});

      // read files
      expect(fs.readFileSync).toBeCalledTimes(2);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );
      expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
        encoding: "utf8",
      });

      // write files
      expect(fs.writeFileSync).not.toBeCalled();

      expect(shell.exec).not.toBeCalled();

      expect(consola.error).toBeCalledWith(
        'Domain "some-domain.com" already exists, with the datult location "/" and port "3000"',
      );
    });

    test("can not create with invalid domain", async () => {
      const domain = "wrong.domain";
      const port = "3000";

      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
        JSON.stringify([], null, 2),
      );

      await onCreateAction(domain, { port });

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).not.toBeCalled();

      expect(shell.exec).not.toBeCalled();

      expect(consola.error).toBeCalledWith(
        "Domain (https://wrong.domain) format is not valid",
      );
    });

    test("can not create with invalid port", async () => {
      const domain = "some-domain.com";
      const port = "666";

      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
        JSON.stringify([], null, 2),
      );

      await onCreateAction(domain, { port });

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).not.toBeCalled();

      expect(shell.exec).not.toBeCalled();

      expect(consola.error).toBeCalledWith(
        "Port (--port <port>) should be into the range 1025 to 65535",
      );
    });

    test("can not create duplicated location", async () => {
      vi.spyOn(fs, "readFileSync")
        .mockReturnValueOnce(
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
        )
        .mockReturnValueOnce(
          `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`,
        );

      const domain = "some-domain.com";
      const port = "5000";
      const location = "/app-name";

      await onCreateAction(domain, { port, location });

      // read files
      expect(fs.readFileSync).toBeCalledTimes(2);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );
      expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
        encoding: "utf8",
      });

      // write files
      expect(fs.writeFileSync).not.toBeCalled();

      expect(shell.exec).not.toBeCalled();

      expect(consola.error).toBeCalledWith(
        'Location "/app-name" already exists',
      );
    });
  });

  describe("success", () => {
    beforeEach(() => {
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
      test("domain config created sucessfully", async () => {
        const domain = "some-domain.com";

        const hostMock = `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`;

        vi.spyOn(fs, "readFileSync")
          .mockReturnValueOnce(JSON.stringify([]))
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock);

        await onCreateAction(domain, {});

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        // read files
        expect(fs.readFileSync).toBeCalledTimes(5);
        expect(fs.readFileSync).nthCalledWith(
          1,
          "/root/path/.local-ssl-management/config.json",
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).nthCalledWith(3, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).nthCalledWith(4, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).nthCalledWith(5, "/etc/hosts", {
          encoding: "utf8",
        });

        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        // write files
        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();
        expect(fs.writeFileSync).nthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "da406b35-79b8-4909-9af1-07cfdcf37d00",
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

      test("domain config created sucessfully", async () => {
        const domain = "some-domain.com";
        const port = "3000";
        const hostMock = `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`;

        vi.spyOn(fs, "readFileSync")
          .mockReturnValueOnce(JSON.stringify([]))
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock);

        await onCreateAction(domain, { port });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        // read files
        expect(fs.readFileSync).toBeCalledTimes(5);
        expect(fs.readFileSync).nthCalledWith(
          1,
          "/root/path/.local-ssl-management/config.json",
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).nthCalledWith(3, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).nthCalledWith(4, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).nthCalledWith(5, "/etc/hosts", {
          encoding: "utf8",
        });

        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        // write files
        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();
        expect(fs.writeFileSync).nthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "da406b35-79b8-4909-9af1-07cfdcf37d00",
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

      test("domain config created sucessfully (does not exists /ssl)", async () => {
        const hostMock = `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`;
        vi.spyOn(fs, "readFileSync")
          .mockReturnValueOnce(JSON.stringify([], null, 2))
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock);
        vi.spyOn(fs, "existsSync").mockReturnValue(false);

        const domain = "some-domain.com";
        const port = "3000";

        await onCreateAction(domain, { port });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        // read files
        expect(fs.readFileSync).toBeCalledTimes(5);
        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).toHaveBeenNthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(3, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(4, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(5, "/etc/hosts", {
          encoding: "utf8",
        });

        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).toHaveBeenCalled();

        // write files
        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();
        expect(fs.writeFileSync).nthCalledWith(
          3,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "da406b35-79b8-4909-9af1-07cfdcf37d00",
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

      test("domain config already exists", async () => {
        vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
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
        ).mockReturnValueOnce(`
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`);

        const domain = "some-domain.com";
        const port = "3000";

        await onCreateAction(domain, { port });

        // read files
        expect(fs.readFileSync).toBeCalledTimes(2);
        expect(fs.readFileSync).nthCalledWith(
          1,
          "/root/path/.local-ssl-management/config.json",
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });

        // write files
        expect(fs.writeFileSync).not.toBeCalled();

        expect(consola.error).toBeCalledWith(
          'Domain "some-domain.com" already exists, with the datult location "/" and port "3000"',
        );
      });
    });

    describe("multiple services", () => {
      test("domain config created sucessfully", async () => {
        const hostMock = `
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`;
        vi.spyOn(fs, "readFileSync")
          .mockReturnValueOnce(
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
          )
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock)
          .mockReturnValueOnce(hostMock);

        vi.spyOn(fs, "existsSync").mockReturnValue(true);

        const domain = "some-domain.com";
        const port = "4000";
        const location = "/app-name";

        await onCreateAction(domain, { port, location });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        // read files
        expect(fs.readFileSync).toBeCalledTimes(5);
        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).toHaveBeenNthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(3, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(4, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(5, "/etc/hosts", {
          encoding: "utf8",
        });

        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).not.toHaveBeenCalled();

        // write files
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

      test("domain config created sucessfully (does not exists /ssl)", async () => {
        vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify([]))
          .mockReturnValueOnce(`
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`);
        vi.spyOn(fs, "existsSync").mockReturnValue(false);

        const domain = "some-domain.com";
        const port = "3000";

        await onCreateAction(domain, { port });

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).nthCalledWith(
          1,
          "NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME",
          { silent: true },
        );
        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://some-domain.com',
          { silent: true },
        );

        // read files
        expect(fs.readFileSync).toHaveBeenCalledTimes(4);
        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).toHaveBeenNthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(3, "/etc/hosts", {
          encoding: "utf8",
        });
        expect(fs.readFileSync).toHaveBeenNthCalledWith(4, "/etc/hosts", {
          encoding: "utf8",
        });

        expect(fs.existsSync).toHaveBeenCalledWith(
          expect.stringMatching(/.local-ssl-management\/ssl/),
        );
        expect(fs.mkdirSync).toHaveBeenCalled();

        // write files
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
                    id: "da406b35-79b8-4909-9af1-07cfdcf37d00",
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

      test("domain config already exists", async () => {
        vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "da406b35-79b8-4909-9af1-07cfdcf37d00",
                    port: "3000",
                    location: "/",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        ).mockReturnValueOnce(`
        127.0.0.1       				localhost
        127.0.0.1               other-domain.com
        `);

        const domain = "some-domain.com";
        const port = "3000";

        await onCreateAction(domain, { port });

        // read files
        expect(fs.readFileSync).toBeCalledTimes(2);
        expect(fs.readFileSync).toHaveBeenNthCalledWith(
          1,
          "/root/path/.local-ssl-management/config.json",
          { encoding: "utf8" },
        );
        expect(fs.readFileSync).toHaveBeenNthCalledWith(2, "/etc/hosts", {
          encoding: "utf8",
        });

        // write files
        expect(fs.writeFileSync).not.toBeCalled();

        expect(consola.error).toBeCalledWith(
          'Domain "some-domain.com" already exists, with the datult location "/" and port "3000"',
        );
      });
    });
  });
});
