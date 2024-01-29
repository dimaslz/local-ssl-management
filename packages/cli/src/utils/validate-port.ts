export function validatePort(port: string) {
  const portIsNumber = !isNaN(Number(port));
  if (!portIsNumber) {
    throw new Error("Port (--port <port>) should be a valid number");
  }

  const portIsValid = Number(port) > 1024 && Number(port) <= 65535;
  if (!portIsValid) {
    throw new Error(
      "Port (--port <port>) should be into the range 1025 to 65535",
    );
  }
}
