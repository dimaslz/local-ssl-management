import prompts from "prompts";
import semver from "semver";
import ncc from "@vercel/ncc";
import fs from "fs";
import cpy from "cpy";
import shell from "shelljs";
import { rimrafSync } from "rimraf";

import packageFile from "./package.json" assert {
	type: "json",
};
import path from "path";

const BRANCH = "main";

async function prompt(props, onCancel = null) {
	return await prompts(props, {
		onCancel: onCancel || (() => {
			console.log("\n🛑 Command release has been canceled.\n")

			shell.exit(1);
		})
	})
};

const run = async () => {
	await rimrafSync("publish");
	const { value: canRelease } = await prompt({
		type: 'confirm',
		name: 'value',
		message: 'Are you sure to release now?',
		initial: null
	});

	if (!canRelease) process.exit(1);

	const { value: releaseType } = await prompt({
		type: "select",
		name: "value",
		message: "Set the update type",
		choices: [
			{ title: 'major', description: '', value: 'major' },
			{ title: 'minor', description: '', value: 'minor' },
			{ title: 'patch', description: '', value: 'patch' },
			{ title: 'premajor', description: '', value: 'premajor' },
			{ title: 'preminor', description: '', value: 'preminor' },
			{ title: 'prepatch', description: '', value: 'prepatch' },
			{ title: 'prerelease', description: '', value: 'prerelease' },
		],
		initial: 0,
	});

	if (!releaseType) process.exit(1);

	const [version, prefix] = packageFile.version.split("-");
	const [type, n] = prefix.split(".");
	const newVersion = semver.inc(version, releaseType, type, +n + 1);

	shell.echo(`New version is ${newVersion}`);

	const { value: canCommit } = await prompt({
		type: 'confirm',
		name: 'value',
		message: 'Do you want to commit changes?',
		initial: true
	});

	if (canCommit) {
		shell.exec(`git add . && git commit -m "chore(tag): bump version to ${newVersion}"`);
	}

	const { value: canTag } = await prompt({
		type: 'confirm',
		name: 'value',
		message: 'Do you want to tag the package version?',
		initial: true
	});

	if (canTag) {
		shell.exec(`git add . && git tag ${newVersion} && git push -f --tags origin ${BRANCH}`);
	}

	const { value: canPublishPackage } = await prompt({
		type: 'confirm',
		name: 'value',
		message: 'Do you want to publish the package?',
		initial: true
	});

	if (canPublishPackage) {
		const pckg = packageFile;
		delete pckg.dependencies;
		delete pckg.devDependencies;
		delete pckg.scripts;
		pckg.version = newVersion;

		if (!fs.existsSync("publish")) {
			fs.mkdirSync("publish", { recursive: true });
		}

		if (fs.existsSync("dist/.local-ssl-management")) {
			await cpy("dist/.local-ssl-management/**/*", ".tmp-local-ssl-management");
		}

		rimrafSync("dist");
		shell.exec("yarn build");

		if (fs.existsSync("package.json")) {
			fs.writeFileSync("publish/package.json", JSON.stringify(pckg, null, 2));
		}

		if (fs.existsSync(".tmp-local-ssl-management")) {
			fs.mkdirSync("dist", { recursive: true });
			await cpy(".tmp-local-ssl-management/**/*", "dist/.local-ssl-management");
		}

		rimrafSync(".tmp-local-ssl-management");

		if (!fs.existsSync(".local-ssl-management/ssl")) {
			fs.mkdirSync("dist/.local-ssl-management/ssl", { recursive: true });
		}

		// shell.exec("npm publish --access public");
		shell.cd("publish");
		shell.exec(`npx np ${newVersion} --access public --branch main`);
		shell.cd("..");
	}

	console.log("🎉 Done!");
};

run();
