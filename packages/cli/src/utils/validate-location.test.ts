import consola from "consola";
import shell from "shelljs";

import validateLocation from "./validate-location";

describe("Validate location", () => {
  describe("failures", () => {
    test("location has bad format", () => {
      expect(() => {
        validateLocation("foo");
      }).toThrow();

      expect(consola.error).toBeCalledWith(
        new Error("Location should start by /"),
      );
      expect(shell.exit).toBeCalledWith(1);
    });
  });

  describe("success", () => {
    test("location has a correct format", () => {
      validateLocation("/foo");

      expect(consola.error).not.toBeCalled();
    });
  });
});
