import consola from "consola";

import validateLocation from "./validate-location";

describe("Validate location", () => {
  describe("failures", () => {
    test("location has bad format", () => {
      validateLocation("foo");

      expect(consola.error).toBeCalledWith("Location should start by /");
    });
  });

  describe("success", () => {
    test("location has a correct format", () => {
      validateLocation("/foo");

      expect(consola.error).not.toBeCalled();
    });
  });
});
