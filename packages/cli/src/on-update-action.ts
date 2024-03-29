import { Config } from "@dimaslz/local-ssl-management-core";
import consola from "consola";
import fs from "fs";
import path from "path";

import { generateProxyImage, validatePort } from "@/utils";

const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const configPath = `${rootPath}/config.json`;

type Options = { port?: string; location?: string };

const onUpdateAction = (domain: string, options: Options) => {
  try {
    const config: Config[] = JSON.parse(
      fs.readFileSync(configPath, { encoding: "utf8" }) || "[]",
    );

    const v4 = new RegExp(
      /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
    );
    const isUUID = v4.test(domain);

    const exists = isUUID
      ? config.some((c) => c.id === domain)
      : config.some((c) => c.domain === domain);

    if (!exists) {
      if (isUUID) {
        throw new Error(`Domain with key "${domain}" does not exists`);
      } else {
        throw new Error(`Domain "${domain}" does not exists`);
      }
    }

    let { port } = options;
    const { location } = options;

    if (!location) {
      throw new Error(`Location is mandatory`);
    }

    const domainIndex = config.findIndex(
      (c) => (isUUID && c.id === domain) || c.domain === domain,
    );

    if (location.includes(",")) {
      const [oldLocation] = location.split(",");

      if (!port) {
        port = config[domainIndex].services.find(
          (service) => service.location === oldLocation,
        )?.port;
      }

      const oldLocationExists = config[domainIndex].services.some(
        (service) => service.location === oldLocation,
      );

      if (!oldLocationExists) {
        throw new Error(`Location "${oldLocation}" does not exists`);
      }
    } else {
      const locationExists = config[domainIndex].services.some(
        (service) => service.location === location,
      );

      if (!locationExists) {
        throw new Error(`Location "${location}" does not exists`);
      }
    }

    if (port) {
      validatePort(port);
    }

    const newConfig = config.map((c, cIndex) => {
      if (domainIndex === cIndex) {
        c.services.map((service) => {
          if (location?.includes(",")) {
            const [oldLocation, newLocation] = location.split(",");

            if (service.location === oldLocation) {
              service.location = newLocation;
              service.port = port || service.port;
            }
          }

          if (service.location === location && port) {
            service.port = port;
          }
        });
      }

      return c;
    });

    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

    consola.success("Domain updated succesful");
    consola.success("Updating proxy image");

    generateProxyImage(newConfig);
  } catch (error) {
    consola.error((error as Error).message);
  }
};

export default onUpdateAction;
