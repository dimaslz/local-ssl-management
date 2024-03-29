import consola from "consola";
import fs from "fs";
import shell from "shelljs";

import onRemoveAction from "@/on-remove-action";
import { generateProxyImage } from "@/utils/generate-proxy-image";

vi.mock("@/list-container");
vi.mock("@/utils/generate-proxy-image");

describe("Actions - onRemoveAction", () => {
  describe("failure", () => {
    test("removing domain by name does not exists", () => {
      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify([]));

      expect(() => {
        onRemoveAction("dummy");
      }).toThrowError('Domain "dummy" does not exists');

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).not.toBeCalled();
    });

    test("remove domain by id does not exists", () => {
      vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify([]));

      expect(() => {
        onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");
      }).toThrowError(
        'Domain with id "6eb61d17-ba78-4618-a2ac-47aeb4ba8b26" does not exists',
      );

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).not.toBeCalled();
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
      }).toThrowError('Location "/something" does not exists');

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).not.toBeCalled();
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

      onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).toBeCalledTimes(1);
      expect(fs.writeFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        "[]",
      );

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

      expect(consola.success).nthCalledWith(1, "Domain removed succesful.");
      expect(consola.success).nthCalledWith(2, "Updating proxy image.");

      expect(generateProxyImage).toBeCalled();
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

      onRemoveAction("local.some-domain.tld");

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

      expect(consola.success).nthCalledWith(1, "Domain removed succesful.");
      expect(consola.success).nthCalledWith(2, "Updating proxy image.");

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).toBeCalledTimes(1);
      expect(fs.writeFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        "[]",
      );

      expect(generateProxyImage).toBeCalled();
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

      onRemoveAction("demo.com_demo.es");

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

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).toBeCalledTimes(1);
      expect(fs.writeFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        "[]",
      );

      expect(consola.success).nthCalledWith(1, "Domain removed succesful.");
      expect(consola.success).nthCalledWith(2, "Updating proxy image.");

      expect(generateProxyImage).toBeCalled();
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

      onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26");

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

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).toBeCalledTimes(1);
      expect(fs.writeFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        "[]",
      );

      expect(consola.success).nthCalledWith(1, "Domain removed succesful.");
      expect(consola.success).nthCalledWith(2, "Updating proxy image.");

      expect(generateProxyImage).toBeCalled();
    });

    test("remove location", () => {
      vi.spyOn(shell, "exec")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementationOnce((): any => ({
          stdout: 200,
        }));

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

      onRemoveAction("6eb61d17-ba78-4618-a2ac-47aeb4ba8b26", {
        location: "/app-name",
      });

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/.*?\/demo.com_demo.es-cert.pem$/g),
      );
      expect(fs.existsSync).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/.*?\/demo.com_demo.es-key.pem$/g),
      );

      // read files
      expect(fs.readFileSync).toBeCalledTimes(1);
      expect(fs.readFileSync).nthCalledWith(
        1,
        "/root/path/.local-ssl-management/config.json",
        { encoding: "utf8" },
      );

      // write files
      expect(fs.writeFileSync).toBeCalledTimes(1);
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

      expect(consola.success).nthCalledWith(1, "Domain removed succesful.");
      expect(consola.success).nthCalledWith(2, "Updating proxy image.");

      expect(generateProxyImage).toBeCalled();
    });
  });
});
