import consola from "consola";
import fs from "fs";
import shell from "shelljs";

import onUpdateAction from "./on-update-action";
import { validatePort } from "./utils";

vi.mock("./utils/validate-port");

vi.mock("./list-container");
vi.mock("path", () => ({
  default: {
    resolve: () => "/root/path",
  },
}));

describe("On update action", () => {
  describe("failures", () => {
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

      onUpdateAction(domain, { port });

      expect(consola.error).toBeCalledWith(
        'Domain "foo-domain.com" does not exists',
      );
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

      onUpdateAction(domain, { port });

      expect(consola.error).toBeCalledWith(
        'Domain with key "48d1a85c-377a-40ef-8a82-d1405f7a0722" does not exists',
      );
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

      onUpdateAction(domain, { port });

      expect(consola.error).toBeCalledWith("Location is mandatory");
    });

    test("location does not exists on replace", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";

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

      onUpdateAction(domain, { location: "/not-exists,/app-name" });

      expect(consola.error).toBeCalledWith(
        'Location "/not-exists" does not exists',
      );
    });

    test("location does not exists on update", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";

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

      onUpdateAction(domain, { location: "/app-name" });

      expect(consola.error).toBeCalledWith(
        'Location "/app-name" does not exists',
      );
    });

    test.skip("port is mandatory", () => {
      const domain = "48d1a85c-377a-40ef-8a82-d1405f7a074f";

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

      onUpdateAction(domain, { location: "/" });

      expect(consola.error).toBeCalledWith("Port is mandatory");
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

        expect(consola.success).nthCalledWith(1, "Domain updated succesful");
        expect(consola.success).nthCalledWith(2, "Updating proxy image");

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

        expect(consola.success).nthCalledWith(1, "Domain updated succesful");
        expect(consola.success).nthCalledWith(2, "Updating proxy image");

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

        expect(consola.success).nthCalledWith(1, "Domain updated succesful");
        expect(consola.success).nthCalledWith(2, "Updating proxy image");

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

        expect(consola.success).nthCalledWith(1, "Domain updated succesful");
        expect(consola.success).nthCalledWith(2, "Updating proxy image");

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

        expect(consola.success).nthCalledWith(1, "Domain updated succesful");
        expect(consola.success).nthCalledWith(2, "Updating proxy image");

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
