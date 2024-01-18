import shell from "shelljs";
import { beforeEach, vi } from "vitest";

vi.mock("fs");
vi.mock("consola");
vi.mock("shelljs");

beforeEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
  vi.resetModules();

  vi.spyOn(shell, "exit").mockImplementation(() => {
    throw new Error();
  });

  vi.mock("@dimaslz/local-ssl-management-core", () => {
    return {
      getLocalIP: () => "11.22.33.445",
      mkcert: vi.fn(),
    };
  });
});
