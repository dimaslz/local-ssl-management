import type { Config } from "@dimaslz/local-ssl-management-core";
import Table from "cli-table3";
import shell from "shelljs";

export const listConfigs = (config: Config[]) => {
  const table = new Table({
    head: ["id", "key", "domains", "location", "port", "ping"],
  });

  config.forEach(({ id, domain, services }) => {
    table.push([
      id,
      domain
        .split(",")
        .map((i) => i.trim())
        .join("_"),
      domain
        .split(",")
        .map((d) => `https://${d.trim()}`)
        .join(", "),
      "",
      "",
    ]);

    services.forEach((service) => {
      const curl = `curl -s -o /dev/null -w "%{http_code}" https://${domain}${service.location}`;
      const status = shell.exec(curl, { silent: true }).stdout;

      table.push([
        "",
        "",
        "",
        `${service.location}`,
        `${service.port}`,
        status,
      ]);
    });
  });

  shell.echo(`\n${table.toString()}\n`);
};
