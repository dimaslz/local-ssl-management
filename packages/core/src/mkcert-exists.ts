import chalk from "chalk";
import shell from "shelljs";

const mkcertExists = () => {
	if (!shell.which('mkcert')) {
		shell.echo(chalk.red('This script requires "mkcert"'));
		shell.exit(1);
	}
}

export default mkcertExists;
