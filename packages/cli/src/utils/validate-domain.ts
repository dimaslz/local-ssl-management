import chalk from "chalk";
import isUrlHttp from "is-url-http";
import shell from "shelljs";

const validateDomain = (value: string) => {
	const domains = value.split(",").map(d => `https://${d.trim()}`);

	domains.forEach((domainItem) => {
		let domain = domainItem;

		// include validate domains like .local or .test
		if (/\.local$|\.test$/g.test(domainItem)) {
			domain = domain.replace(/\.local$|\.test$/, ".com");
		}

		if (!isUrlHttp(domain)) {
			shell.echo(chalk.red(`\n[Error] - Domain (${domainItem})format is not valid\n`));
			shell.exit(1);
		}
	});
};

export default validateDomain;