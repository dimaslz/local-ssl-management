import consola from "consola";
import shell from "shelljs";

const validatePort = (port: string) => {
  const portIsNumber = !isNaN(Number(port));
  if (!portIsNumber) {
    consola.error(new Error("Port (--port <port>) should be a valid number"));
    shell.exit(1);
  }

  const portIsValid = Number(port) > 1024 && Number(port) <= 65535;
  if (!portIsValid) {
    consola.error(
      new Error("Port (--port <port>) should be into the range 1025 to 65535"),
    );
    shell.exit(1);
  }
};

export default validatePort;
