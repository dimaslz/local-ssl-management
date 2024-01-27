import { mkcert } from "@dimaslz/local-ssl-management-core";
import consola from "consola";
import fs from "fs";
import shell from "shelljs";

import listContainer from "@/list-container";
import { generateProxyImage } from "@/utils";

vi.mock("@/list-container");

describe("Utils - generateProxyImage", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
  });

  describe("failure", () => {
    test("does not exists config to create reverse proxy", () => {
      generateProxyImage([]);

      expect(consola.warn).toBeCalledWith(
        "Does not exists config to create reverse proxy",
      );
    });
  });

  describe("success", () => {
    describe("single service", () => {
      beforeEach(() => {
        vi.clearAllMocks();

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

      test("does not exists localhost certs", () => {
        generateProxyImage([
          {
            id: "485b5a34-f0c3-4472-8308-6bcc0a485527",
            domain: "domain.tld",
            services: [
              {
                id: "7ab48ea7-8adb-4439-949b-a22868d65050",
                port: "3000",
                location: "/",
              },
            ],
          },
        ]);

        expect(fs.existsSync).toBeCalledTimes(4);
        expect(mkcert).toBeCalledTimes(2);
        expect(mkcert).nthCalledWith(
          1,
          "localhost",
          "/root/path/.local-ssl-management/ssl",
        );
        expect(mkcert).nthCalledWith(
          2,
          "domain.tld",
          "/root/path/.local-ssl-management/ssl",
        );

        expect(fs.writeFileSync).toBeCalledTimes(2);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).toHaveBeenNthCalledWith(
          1,
          `NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
          { silent: true },
        );
        expect(shell.exec).toHaveBeenNthCalledWith(
          2,
          `curl -s -o /dev/null -w "%{http_code}" https://domain.tld`,
          { silent: true },
        );

        expect(listContainer).toBeCalled();

        expect(consola.success).toBeCalledWith("SSL proxy running");
        expect(shell.echo).toBeCalledTimes(1);
        expect(shell.echo).toMatchSnapshot();
      });

      test("create domain config succesful (localhost certs does not exists)", () => {
        vi.spyOn(fs, "existsSync").mockImplementation((v) => {
          if (/localhost-cert.pem$/.test(String(v))) {
            return false;
          }

          if (/demo.com-.*.pem$/.test(String(v))) {
            return true;
          }

          return false;
        });

        generateProxyImage([
          {
            id: "485b5a34-f0c3-4472-8308-6bcc0a485527",
            domain: "demo.com",
            services: [
              {
                id: "22fab721-eeef-472f-8dfb-83b14b933d01",
                port: "4000",
                location: "/",
              },
            ],
          },
        ]);

        expect(fs.existsSync).toBeCalledTimes(4);

        expect(mkcert).toBeCalledTimes(1);
        expect(mkcert).nthCalledWith(
          1,
          "localhost",
          "/root/path/.local-ssl-management/ssl",
        );

        expect(fs.writeFileSync).toBeCalledTimes(2);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).toHaveBeenNthCalledWith(
          1,
          `NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
          { silent: true },
        );
        expect(shell.exec).toHaveBeenNthCalledWith(
          2,
          `curl -s -o /dev/null -w "%{http_code}" https://demo.com`,
          { silent: true },
        );

        expect(listContainer).toBeCalled();

        expect(consola.success).toBeCalledWith("SSL proxy running");

        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(shell.echo).toBeCalledTimes(1);
        expect(shell.echo).toMatchSnapshot();
      });

      test("create domain config succesful (domain certs does not exists)", () => {
        generateProxyImage([
          {
            id: "485b5a34-f0c3-4472-8308-6bcc0a485527",
            domain: "demo.com",
            services: [
              {
                id: "1c3ca615-72e9-465b-a0e2-e788aafa0890",
                port: "4000",
                location: "/",
              },
            ],
          },
        ]);

        expect(fs.existsSync).toBeCalledTimes(4);

        expect(mkcert).toBeCalledTimes(2);
        expect(mkcert).nthCalledWith(
          1,
          "localhost",
          "/root/path/.local-ssl-management/ssl",
        );
        expect(mkcert).nthCalledWith(
          2,
          "demo.com",
          "/root/path/.local-ssl-management/ssl",
        );

        expect(fs.writeFileSync).toBeCalledTimes(2);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).toHaveBeenNthCalledWith(
          1,
          `NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
          { silent: true },
        );
        expect(shell.exec).toHaveBeenNthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(listContainer).toBeCalled();

        expect(consola.success).toBeCalledWith("SSL proxy running");

        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(shell.echo).toBeCalledTimes(1);
        expect(shell.echo).toMatchSnapshot();
      });
    });

    describe("multiple service", () => {
      beforeEach(() => {
        vi.clearAllMocks();

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

      test("does not exists localhost certs", () => {
        generateProxyImage([
          {
            id: "485b5a34-f0c3-4472-8308-6bcc0a485527",
            domain: "demo.com",
            services: [
              {
                id: "c977c7cc-e9e1-4237-b6b1-8dd7b3d4001b",
                port: "4000",
                location: "/",
              },
              {
                id: "0438bcb8-ac14-4d81-b8ac-1da3da4065b0",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]);

        expect(fs.existsSync).toBeCalledTimes(4);

        expect(mkcert).toBeCalledTimes(2);
        expect(mkcert).nthCalledWith(
          1,
          "localhost",
          "/root/path/.local-ssl-management/ssl",
        );
        expect(mkcert).nthCalledWith(
          2,
          "demo.com",
          "/root/path/.local-ssl-management/ssl",
        );

        expect(fs.writeFileSync).toBeCalledTimes(2);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).toHaveBeenNthCalledWith(
          1,
          `NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
          { silent: true },
        );
        expect(shell.exec).toHaveBeenNthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(listContainer).toBeCalled();

        expect(consola.success).toBeCalledWith("SSL proxy running");
        expect(shell.echo).toBeCalledTimes(1);
        expect(shell.echo).toMatchSnapshot();
      });

      test("create domain config succesful (localhost certs does not exists)", () => {
        vi.spyOn(fs, "existsSync").mockImplementation((v) => {
          if (/localhost-cert.pem$/.test(String(v))) {
            return false;
          }

          if (/demo.com-.*.pem$/.test(String(v))) {
            return true;
          }

          return false;
        });

        generateProxyImage([
          {
            id: "485b5a34-f0c3-4472-8308-6bcc0a485527",
            domain: "demo.com",
            services: [
              {
                id: "f8a368e6-3cab-4107-a463-a9edda7edbfa",
                port: "4000",
                location: "/",
              },
              {
                id: "6c157015-3b64-47b8-82c1-8e6813c96990",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]);

        expect(fs.existsSync).toBeCalledTimes(4);

        expect(mkcert).toBeCalledTimes(1);
        expect(mkcert).nthCalledWith(
          1,
          "localhost",
          "/root/path/.local-ssl-management/ssl",
        );

        expect(fs.writeFileSync).toBeCalledTimes(2);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).toHaveBeenNthCalledWith(
          1,
          `NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
          { silent: true },
        );
        expect(shell.exec).toHaveBeenNthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(listContainer).toBeCalled();

        expect(consola.success).toBeCalledWith("SSL proxy running");

        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(shell.echo).toBeCalledTimes(1);
        expect(shell.echo).toMatchSnapshot();
      });

      test("create domain config succesful (domain certs does not exists)", () => {
        generateProxyImage([
          {
            id: "485b5a34-f0c3-4472-8308-6bcc0a485527",
            domain: "demo.com",
            services: [
              {
                id: "f8a368e6-3cab-4107-a463-a9edda7edbfa",
                port: "4000",
                location: "/",
              },
              {
                id: "6c157015-3b64-47b8-82c1-8e6813c96990",
                port: "3000",
                location: "/app-name",
              },
            ],
          },
        ]);

        expect(fs.existsSync).toBeCalledTimes(4);

        expect(mkcert).toBeCalledTimes(2);
        expect(mkcert).nthCalledWith(
          1,
          "localhost",
          "/root/path/.local-ssl-management/ssl",
        );
        expect(mkcert).nthCalledWith(
          2,
          "demo.com",
          "/root/path/.local-ssl-management/ssl",
        );

        expect(fs.writeFileSync).toBeCalledTimes(2);
        expect(fs.writeFileSync).toMatchSnapshot();

        expect(shell.exec).toBeCalledTimes(2);
        expect(shell.exec).toHaveBeenNthCalledWith(
          1,
          `NAME=local-ssl-management && docker rm -f $NAME && docker rmi -f $NAME && docker build --no-cache -t $NAME /root/path/.local-ssl-management && docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
          { silent: true },
        );
        expect(listContainer).toBeCalled();

        expect(consola.success).toBeCalledWith("SSL proxy running");

        expect(shell.exec).nthCalledWith(
          2,
          'curl -s -o /dev/null -w "%{http_code}" https://demo.com',
          { silent: true },
        );

        expect(shell.echo).toBeCalledTimes(1);
        expect(shell.echo).toMatchSnapshot();
      });
    });
  });
});
