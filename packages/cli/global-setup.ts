import crypto from "crypto";
import fs from "fs";
import shell from "shelljs";
import { beforeEach, vi } from "vitest";

vi.mock("fs");
vi.mock("consola");
vi.mock("shelljs");

beforeEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
  vi.resetModules();

  vi.spyOn(crypto, "randomUUID")
    .mockImplementationOnce(() => "48d1a85c-377a-40ef-8a82-d1405f7a074f")
    .mockImplementationOnce(() => "da406b35-79b8-4909-9af1-07cfdcf37d00")
    .mockImplementationOnce(() => "39b9ad76-115f-47b3-a73d-7c3297eb4351");

  vi.spyOn(shell, "exit").mockImplementation(() => {
    throw new Error();
  });

  vi.mock("@dimaslz/local-ssl-management-core", () => {
    return {
      getLocalIP: () => "11.22.33.445",
      mkcert: vi.fn(),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.spyOn(fs, "readdirSync").mockImplementationOnce((): any[] => [
    "some-domain.com-cert.pem",
    "some-domain.com-key.pem",
  ]);
});
