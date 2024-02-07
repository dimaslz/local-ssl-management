import cpy from "cpy";
import fs from "fs";
import { dirname } from "path";
import prompts from "prompts";
import { rimrafSync } from "rimraf";
import semver from "semver";
import shell from "shelljs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const __here = __dirname;
const __root = __dirname + "/../..";

import packageFile from "./package.json" assert { type: "json" };

const BRANCH = "main";

async function prompt(props, onCancel = null) {
  return await prompts(props, {
    onCancel:
      onCancel ||
      (() => {
        console.log("\n🛑 Command release has been canceled.\n");

        shell.exit(1);
      }),
  });
}

const run = async () => {
  await rimrafSync(`${__here}/publish`, { recursive: true });

  const { value: canRelease } = await prompt({
    type: "confirm",
    name: "value",
    message: "Are you sure to release now?",
    initial: null,
  });

  if (!canRelease) process.exit(1);

  const { value: bumpVersion } = await prompt({
    type: "confirm",
    name: "value",
    message: "Do you want to bump the version?",
    initial: true,
  });

  let newVersion = packageFile.version;
  if (bumpVersion) {
    const { value: releaseType } = await prompt({
      type: "select",
      name: "value",
      message: "Set the update type",
      choices: [
        { title: "major", description: "", value: "major" },
        { title: "minor", description: "", value: "minor" },
        { title: "patch", description: "", value: "patch" },
        { title: "premajor", description: "", value: "premajor" },
        { title: "preminor", description: "", value: "preminor" },
        { title: "prepatch", description: "", value: "prepatch" },
        { title: "prerelease", description: "", value: "prerelease" },
      ],
      initial: 0,
    });

    const [version, prefix = ""] = packageFile.version.split("-");
    const [type, n] = prefix.split(".") || ["", ""];
    newVersion = semver.inc(version, releaseType, type, +n + 1);

    if (!releaseType) {
      process.exit(1);
    }
  }

  shell.echo(`New version is ${newVersion}`);

  const { value: canCommit } = await prompt({
    type: "confirm",
    name: "value",
    message: "Do you want to commit changes?",
    initial: true,
  });

  if (canCommit) {
    shell.exec(
      `git add . && git commit -m "chore(tag): bump version to ${newVersion}"`,
    );
  }

  const { value: canTag } = await prompt({
    type: "confirm",
    name: "value",
    message: "Do you want to tag the package version?",
    initial: true,
  });

  if (canTag) {
    shell.exec(
      `git add . && git tag ${newVersion} && git push -f --tags origin ${BRANCH}`,
    );
  }

  const { value: canPublishPackage } = await prompt({
    type: "confirm",
    name: "value",
    message: "Do you want to publish the package?",
    initial: true,
  });

  if (canPublishPackage) {
    const pckg = structuredClone(packageFile);
    delete pckg.dependencies;
    delete pckg.devDependencies;
    delete pckg.scripts;
    delete pckg.publishConfig;
    pckg.version = newVersion;

    // update package version
    packageFile.version = newVersion;
    fs.writeFileSync(
      `${__here}/package.json`,
      JSON.stringify(packageFile, null, 2) + "\n",
    );

    if (!fs.existsSync(`${__here}/publish`)) {
      fs.mkdirSync(`${__here}/publish`, { recursive: true });
    }

    fs.writeFileSync(
      `${__here}/publish/package.json`,
      JSON.stringify(pckg, null, 2),
    );

    shell.exec(`ncc build -m ${__here}/src/index.ts -o ${__here}/publish/dist`);
    shell.exec(
      `ncc build -m ${__here}/src/run.ts -o ${__here}/publish/dist/run`,
    );

    if (fs.existsSync(`${__here}/publish/package.json`)) {
      fs.writeFileSync(
        `${__here}/publish/package.json`,
        JSON.stringify(pckg, null, 2),
      );
    }

    // move readme.md
    await cpy(`${__root}/Readme.md`, `${__here}/publish`);

    // publish package
    shell.cd(`${__here}/publish`);
    shell.exec(`npm publish --access public`);
    shell.cd("..");
  }

  console.log("🎉 Done!");
};

run();
