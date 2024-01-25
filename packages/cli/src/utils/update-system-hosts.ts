import { spawn } from "child_process";
import chokidar from "chokidar";
import consola from "consola";
import path from "path";
import prompt from "prompt";

const distPath = path.resolve(__dirname, "./");
const runPath = `${distPath}/run`;

async function promptPassword() {
  prompt.start();
  prompt.message = "";
  prompt.delimiter = ":";
  const { password } = await prompt.get({
    properties: {
      password: {
        message: "Password",
        hidden: true,
      },
    },
  });
  return password;
}

export function updateSystemHosts(tmpHostsPath: string) {
  const sudoCommand = spawn("sudo", [
    "-S",
    "-k",
    "node",
    `${runPath}/index.js`,
    tmpHostsPath,
  ]);

  sudoCommand.stderr.on("data", async () => {
    const password = await promptPassword();
    sudoCommand.stdin.write(password + "\n");
  });

  const watchTmpHostsFile = chokidar.watch(tmpHostsPath).on("unlink", () => {
    watchTmpHostsFile.unwatch(tmpHostsPath);

    consola.info(`Your hosts has been updated. Type \`cat/etc/hosts\` in your terminal to see the last updates on LOCAL SSL block.
`);
  });
}
