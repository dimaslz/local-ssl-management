import type { Config } from "@dimaslz/local-ssl-management-core";
import { getLocalIP, mkcert } from "@dimaslz/local-ssl-management-core";
import Table from "cli-table3";
import consola from "consola";
import fs from "fs";
import path from "path";
import shell from "shelljs";

import listContainer from "@/list-container";
import Templates from "@/templates";

const LOCAL_IP = getLocalIP();
const distPath = path.resolve(__dirname, "./");
const rootPath = `${distPath}/.local-ssl-management`;
const sslPath = `${rootPath}/ssl`;

const renderTable = (config: Config[]) => {
  const tablePing = new Table({
    head: ["domain", "app running"],
  });

  config.forEach((c: Config) => {
    c.domain
      .split(",")
      .map((d) => d.trim())
      .forEach((domain) => {
        const curl = `curl -s -o /dev/null -w "%{http_code}" https://${domain}`;
        const status = shell.exec(curl, { silent: true }).stdout;

        if (status === "200") {
          tablePing.push([`https://${domain}`, "yes"]);
        } else {
          tablePing.push([`https://${domain}`, "no"]);
        }
      });
  });

  shell.echo(`\n${tablePing.toString()}\n`);
};

export const generateProxyImage = (config: Config[]) => {
  if (!config.length) {
    consola.warn("Does not exists config to create reverse proxy");

    return;
  }

  const localhostCertExists = fs.existsSync(sslPath + "/localhost-cert.pem");
  const localhostKeyExists = fs.existsSync(sslPath + "/localhost-key.pem");

  if (!localhostCertExists || !localhostKeyExists) {
    mkcert("localhost", sslPath);
  }

  const certsUrl: { cert: string; key: string }[] = [];

  const serverConfigs: string[] = config.map((c: Config) => {
    const nginxConfServerTpl: string = Templates.nginxConfServer || "";

    const multipleDomains = c.domain.split(",").length > 1;
    const domain = multipleDomains
      ? c.domain.split(",").join(" ")
      : c.domain.trim();
    const certName = multipleDomains
      ? c.domain.split(",").join("_")
      : c.domain.trim();

    const certFileExists = fs.existsSync(`${sslPath}/${certName}-cert.pem`);
    const keyFileExists = fs.existsSync(`${sslPath}/${certName}-key.pem`);
    const shouldCreateCerts = !certFileExists || !keyFileExists;

    if (shouldCreateCerts) {
      mkcert(domain, sslPath);
    }

    certsUrl.push({
      cert: `ssl/${certName}-cert.pem`,
      key: `ssl/${certName}-key.pem`,
    });

    const nginxLocationTpl: string = Templates.nginxLocation;

    // setup location
    let locationConfigs = c.services
      .map((service) => {
        return nginxLocationTpl
          .replace("%LOCATION%", service.location)
          .replace("%LOCAL_IP%", LOCAL_IP);
      })
      .join("\n\n");

    // setup ports
    c.services.forEach((service) => {
      locationConfigs = locationConfigs.replace("%PORT%", String(service.port));
    });

    return nginxConfServerTpl
      .replace(/%APP_DOMAIN%/g, certName)
      .replace(
        "%SERVER_NAME%",
        c.domain
          .split(",")
          .map((i) => i.trim())
          .join(" "),
      )
      .replace("#--server-location--#", locationConfigs);
  });

  const nginxConfTpl = Templates.nginxConf;
  const nginxConf = nginxConfTpl.replace(
    /\t\t#--server-config--#/,
    `\t\t${serverConfigs.join("\n")}`,
  );

  const nginxConfDest = `${rootPath}/nginx.conf`;
  fs.writeFileSync(nginxConfDest, nginxConf);

  const dockerfileContent = Templates.dockerfile;
  const dockerfileDest = `${rootPath}/Dockerfile`;
  fs.writeFileSync(
    dockerfileDest,
    dockerfileContent
      .replace(
        "#-certs-#",
        certsUrl
          .map((d: { cert: string; key: string }) => {
            return `COPY ${d.key} /etc/nginx/
COPY ${d.cert} /etc/nginx/`;
          })
          .join("\n\n"),
      )
      .replace(/#-main-path-#/g, ""),
  );

  shell.exec(
    `NAME=local-ssl-management && \
docker rm -f $NAME && \
docker rmi -f $NAME && \
docker build --no-cache -t $NAME ${rootPath} && \
docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
    { silent: true },
  );

  listContainer();

  consola.success("SSL proxy running");

  renderTable(config);
};
