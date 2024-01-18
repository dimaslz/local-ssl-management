import cpy from "cpy";
import fs from "fs";
import { rimrafSync } from "rimraf";

const prebuild = async () => {
  if (fs.existsSync("dist/.local-ssl-management")) {
    await cpy("dist/.local-ssl-management/**/*", ".tmp-local-ssl-management");
  }

  rimrafSync("dist");

  if (fs.existsSync(".tmp-local-ssl-management")) {
    fs.mkdirSync("dist", { recursive: true });
    await cpy(".tmp-local-ssl-management/**/*", "dist/.local-ssl-management");
  }

  rimrafSync(".tmp-local-ssl-management");

  if (!fs.existsSync(".local-ssl-management/ssl")) {
    fs.mkdirSync("dist/.local-ssl-management/ssl", { recursive: true });
  }

  if (!fs.existsSync(".local-ssl-management/config.json")) {
    fs.writeFileSync(
      "dist/.local-ssl-management/config.json",
      JSON.stringify([], null, 2),
    );
  }
};

if (process.env.CI) {
  rimrafSync("dist");
} else {
  prebuild();
}
