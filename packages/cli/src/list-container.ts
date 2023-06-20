import Table from "cli-table";
import shell from "shelljs";
import chalk from "chalk";

const listContainer = () => {
	const containersList = shell.exec(
		"docker ps --format '{{.ID}} | {{.Names}} | {{.Ports}}'",
		{ silent: true }
	).stdout;

	const table = new Table({
		head: ["container id", "container image", "port"],
	});

	const containerData = containersList.split("\n").find((line) => /local-ssl-management/.test(line)) || "";

	if (!containerData) {
		shell.echo(chalk.red("[Error] - Something have been failure. Contact with the author."));
		shell.exit(1);

	}

	const [containerId, containerName, ports] = containerData.split("|").map(i => i.trim());
	table.push([containerId, containerName, ports]);

	shell.echo(chalk.green(
		`\nThe local ssl proxy is running.\n
		ℹ️ The local ssl proxy is running. Keep it mind that it is important to the local domains that works through HTTPS.\n`
	));
	shell.echo(`\n${table.toString()}\n`);
};

export default listContainer;