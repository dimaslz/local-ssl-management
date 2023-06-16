import shell from "shelljs";

const mkcert = (_domain: string, path: string) => {
	const domain = _domain.split(",").map(d => d.trim()).join(" ");
	const certName = domain.replace(/\s+/, "_");

	shell.exec(`mkcert -install \
	-key-file ${path}/${certName}-key.pem \
	-cert-file ${path}/${certName}-cert.pem \
	${domain} localhost 127.0.0.1 ::1`, { silent: true });
};

export default mkcert;