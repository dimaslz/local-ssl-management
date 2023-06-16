import shell from "shelljs";

const dockerExists = () => {
	if (!shell.which('docker')) {
		shell.echo('Sorry, this script requires "docker"');
		shell.exit(1);
	}
}

export default dockerExists;
