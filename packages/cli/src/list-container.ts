import Table from "cli-table3";
import consola from "consola";
import shell from "shelljs";

const isTest = process.env.NODE_ENV === "test";

const listContainer = () => {
  const containersList = shell.exec(
    "docker ps --format '{{.ID}} | {{.Names}} | {{.Ports}}'",
    { silent: true },
  ).stdout;

  const table = new Table({
    head: ["container id", "container image", "port"],
    ...(isTest
      ? {
          style: {
            head: [], //disable colors in header cells
            border: [], //disable colors for the border
          },
        }
      : {}),
  });

  const containerData =
    containersList
      .split("\n")
      .find((line) => /local-ssl-management/.test(line)) || "";

  if (!containerData) {
    throw new Error("Something have been failure. Contact with the author.");
  }

  const [containerId, containerName, ports] = containerData
    .split("|")
    .map((i) => i.trim());
  table.push([containerId, containerName, ports]);

  consola.info("The local ssl proxy is running.");
  consola.box(
    "The local ssl proxy is running. Keep it mind that it is important to the local domains that works through HTTPS.",
  );

  shell.echo(`\n${table.toString()}\n`);
};

export default listContainer;
