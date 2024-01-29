import { validateLocation } from "@/utils";

describe("Validate location", () => {
  describe("failures", () => {
    test("location has bad format", () => {
      expect(() => {
        validateLocation("foo");
      }).toThrowError("Location should start by /");
    });
  });

  describe("success", () => {
    test("location has a correct format", () => {
      expect(() => {
        validateLocation("/foo");
      }).not.toThrowError();
    });
  });
});
