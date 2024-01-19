import consola from "consola";

import validatePort from "./validate-port";

describe("Validate port", () => {
  describe("success", () => {
    const ports = [["1025"], ["3000"], ["65535"]];
    test.each(ports)("Port %s is valid", (port) => {
      validatePort(port);

      expect(consola.error).not.toBeCalled();
    });
  });

  describe("invalid (port should be from 1025 to 65535", () => {
    const ports = [["foo"], ["333"], ["1024"], ["70000"]];

    test.each(ports)("Port %s is not valid", (port) => {
      validatePort(port);

      if (Number(port)) {
        expect(consola.error).toBeCalledWith(
          "Port (--port <port>) should be into the range 1025 to 65535",
        );
      } else {
        expect(consola.error).toBeCalledWith(
          "Port (--port <port>) should be a valid number",
        );
      }
    });
  });
});
