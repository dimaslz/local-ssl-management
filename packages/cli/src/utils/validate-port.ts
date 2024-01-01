import chalk from "chalk";
import shell from "shelljs";

const validatePort = (port: string) => {
  const portIsNumber = !isNaN(Number(port));
  if (!portIsNumber) {
    shell.echo(
      chalk.red("\n[Error] - Port (--port <port>) should be a valid number\n"),
    );
    shell.exit(1);
    // throw new Error("\n[Error] - Port (--port <port>) should be a valid number\n");
  }

  const portIsValid = Number(port) > 1024 && Number(port) <= 65535;
  if (!portIsValid) {
    shell.echo(
      chalk.red(
        "\n[Error] - Port (--port <port>) should be into the range 1025 to 65535\n",
      ),
    );
    shell.exit(1);
    // throw new Error("\n[Error] - Port (--port <port>) should be into the range 1025 to 65535\n");
  }
};

export default validatePort;
