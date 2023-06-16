import chalk from "chalk";
import shell from "shelljs";

const validatePort = (port: number) => {
	const portIsNumber = !isNaN(Number(port));
	if (!portIsNumber) {
		shell.echo(chalk.red("\n[Error] - Port (--port <port>) should be a valid number\n"));
		shell.exit(1);
	}

	const portIsValid = Number(port) > 1024 && Number(port) <= 65535;
	if (!portIsValid) {
		shell.echo(
			chalk.red("\n[Error] - Port (--port <port>) should be into the range 1025 to 65535\n")
		);
		shell.exit(1);
	}
}

export default validatePort;