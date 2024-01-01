import fs from "fs";
import shell from "shelljs";

import onUpdateAction from "./on-update-action";
import validatePort from "./utils/validate-port";

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
    vi.resetModules();
  });

  describe("failures", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();
    });

    test("update domain by wrong domain name", () => {
      const domain = "foo-domain.com";
      const port = "3333";

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              services: [
                {
                  id: "eb887c54-1d0d-4e5b-b0dc-b7595931619d",
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

      vi.spyOn(shell, "exit").mockImplementationOnce(() => {
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
      const port = "3333";

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              services: [
                {
                  id: "21f06978-0f8b-4974-a453-67b11545c7e0",
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

      vi.spyOn(shell, "exit").mockImplementationOnce(() => {
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

    test("location is mandatory", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";
      const port = "3333";

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              services: [
                {
                  id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

      expect(() => {
        onUpdateAction(domain, { port });
      }).toThrow();

      expect(shell.echo).toBeCalledWith("\n[Error] - Location is mandatory\n");
      expect(shell.exit).toBeCalledWith(1);
    });

    test("location does not exists on replace", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";

      vi.spyOn(shell, "exit").mockImplementationOnce(() => {
        throw new Error();
      });

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              services: [
                {
                  id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

      expect(() => {
        onUpdateAction(domain, { location: "/not-exists,/app-name" });
      }).toThrow();

      expect(shell.echo).toBeCalledWith(
        '\n[Error] - Location "/not-exists" does not exists\n',
      );
      expect(shell.exit).toBeCalledWith(1);
    });

    test("location does not exists on update", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";

      vi.spyOn(shell, "exit").mockImplementationOnce(() => {
        throw new Error();
      });

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              services: [
                {
                  id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

      expect(() => {
        onUpdateAction(domain, { location: "/app-name" });
      }).toThrow();

      expect(shell.echo).toBeCalledWith(
        '\n[Error] - Location "/app-name" does not exists\n',
      );
      expect(shell.exit).toBeCalledWith(1);
    });

    test.skip("port is mandatory", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";

      vi.spyOn(shell, "exit").mockImplementationOnce(() => {
        throw new Error();
      });
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify(
          [
            {
              id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
              domain: "some-domain.com",
              services: [
                {
                  id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

      expect(() => {
        onUpdateAction(domain, { location: "/" });
      }).toThrow();

      expect(shell.echo).toBeCalledWith("\n[Error] - Port is mandatory\n");
      expect(shell.exit).toBeCalledWith(1);
    });
  });

  describe("success", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();

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

    describe("update port", () => {
      test("update domain by domain key", () => {
        const domain = "some-domain.com";
        const port = "3333";
        const location = "/";

        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

        onUpdateAction(domain, { port, location });

        expect(validatePort).toBeCalled();

        expect(shell.echo).nthCalledWith(
          1,
          "\n[Success] - 🎉 Domain updated succesful.\n",
        );
        expect(shell.echo).nthCalledWith(
          2,
          "\n[Action] - 🔄 Updating proxy image.\n",
        );

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

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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
      });

      test("update domain by domain id", () => {
        const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";
        const port = "3333";
        const location = "/";

        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

        onUpdateAction(domain, { port, location });

        expect(validatePort).toBeCalled();

        expect(shell.echo).nthCalledWith(
          1,
          "\n[Success] - 🎉 Domain updated succesful.\n",
        );
        expect(shell.echo).nthCalledWith(
          2,
          "\n[Action] - 🔄 Updating proxy image.\n",
        );

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

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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
      });
    });

    describe("update location", () => {
      test("update domain by domain key", () => {
        const domain = "some-domain.com";
        const location = "/,/app-name";

        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

        onUpdateAction(domain, { location });

        expect(validatePort).toBeCalled();

        expect(shell.echo).nthCalledWith(
          1,
          "\n[Success] - 🎉 Domain updated succesful.\n",
        );
        expect(shell.echo).nthCalledWith(
          2,
          "\n[Action] - 🔄 Updating proxy image.\n",
        );

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

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
                    port: "3000",
                    location: "/app-name",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });

      test("update domain by domain id", () => {
        const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";
        const location = "/,/app-name";

        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

        onUpdateAction(domain, { location });

        expect(validatePort).toBeCalled();

        expect(shell.echo).nthCalledWith(
          1,
          "\n[Success] - 🎉 Domain updated succesful.\n",
        );
        expect(shell.echo).nthCalledWith(
          2,
          "\n[Action] - 🔄 Updating proxy image.\n",
        );

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

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
                    port: "3000",
                    location: "/app-name",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });
    });

    describe("update location and port", () => {
      test("update domain by domain id", () => {
        const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";
        const location = "/,/app-name";
        const port = "4000";

        vi.spyOn(fs, "readFileSync").mockReturnValue(
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
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

        onUpdateAction(domain, { port, location });

        expect(validatePort).toBeCalled();

        expect(shell.echo).nthCalledWith(
          1,
          "\n[Success] - 🎉 Domain updated succesful.\n",
        );
        expect(shell.echo).nthCalledWith(
          2,
          "\n[Action] - 🔄 Updating proxy image.\n",
        );

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

        expect(fs.writeFileSync).toBeCalledTimes(3);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(fs.writeFileSync).toHaveBeenNthCalledWith(
          1,
          expect.stringMatching(/.local-ssl-management\/config.json/),
          JSON.stringify(
            [
              {
                id: "48d1a85c-377a-40ef-8a82-d1405f7a074f",
                domain: "some-domain.com",
                services: [
                  {
                    id: "5ac20bc9-4d7c-43e5-a1ae-a8f09866a7e1",
                    port: "4000",
                    location: "/app-name",
                  },
                ],
              },
            ],
            null,
            2,
          ),
        );
      });
    });
  });
});
