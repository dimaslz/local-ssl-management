import chalk from "chalk";
import isUrlHttp from "is-url-http";
import shell from "shelljs";

const validateDomain = (domain: string) => {
	const domains = domain.split(",").map(d => `https://${d.trim()}`);

	domains.forEach((_domain) => {
		if (!isUrlHttp(_domain)) {
			shell.echo(chalk.red(`\n[Error] - Domain (${_domain})format is not valid\n`));
			shell.exit(1);
		}
	});
};

export default validateDomain;