import consola from "consola";

const validatePort = (port: string) => {
  const portIsNumber = !isNaN(Number(port));
  if (!portIsNumber) {
    consola.error("Port (--port <port>) should be a valid number");

    return;
  }

  const portIsValid = Number(port) > 1024 && Number(port) <= 65535;
  if (!portIsValid) {
    consola.error(
      "Port (--port <port>) should be into the range 1025 to 65535",
    );

    return;
  }
};

export default validatePort;
