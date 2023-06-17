import fs from "fs";
import cpy from "cpy";
import shell from "shelljs";
import { rimrafSync } from "rimraf";

import packageFile from "./package.json";

const run = async () => {
  const newVersion = "0.0.0-beta.4"
  const pckg = packageFile;
  delete pckg.dependencies;
  delete pckg.devDependencies;
  delete pckg.scripts;

  if (fs.existsSync("dist")) {
    await cpy("dist/**/*", ".tmp-dist");
    rimrafSync("dist");
  }

  shell.exec("ncc build src/index.ts -m -o dist");

	if (fs.existsSync("package.json")) {
    fs.copyFileSync("package.json", ".tmp.package.json");
    fs.writeFileSync("package.json", JSON.stringify(pckg, null, 2));
	}

  // shell.exec("npm publish --access public");
  shell.exec(`npx np ${newVersion} --branch main`);
}

run();