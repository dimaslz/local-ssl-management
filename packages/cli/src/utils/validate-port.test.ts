import consola from "consola";

import { validatePort } from "@/utils";

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
      expect(() => {
        validatePort(port);
      }).toThrowError(
        Number(port)
          ? "Port (--port <port>) should be into the range 1025 to 65535"
          : "Port (--port <port>) should be a valid number",
      );
    });
  });
});
