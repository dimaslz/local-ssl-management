import consola from "consola";
import fs from "fs";
import path from "path";

import { HOSTS_END, HOSTS_START } from "@/constants";
import { updateSystemHosts } from "@/utils";

const distPath = path.resolve(__dirname, "./");
const tmpHostsPath = `${distPath}/.tmp-hosts`;

export async function getContentFromHosts(): Promise<string> {
  const hostsContent = await fs.readFileSync("/etc/hosts", {
    encoding: "utf8",
  });

  const [, localSSLHosts = ""] =
    hostsContent.match(new RegExp(`${HOSTS_START}([^#]+)${HOSTS_END}`, "im")) ||
    [];

  return localSSLHosts?.trim();
}

export async function setContentToHosts(content: string): Promise<string> {
  const hostsContent = await fs.readFileSync("/etc/hosts", {
    encoding: "utf8",
  });
  const [, localSSLHosts = ""] =
    hostsContent.match(new RegExp(`${HOSTS_START}([^#]+)${HOSTS_END}`, "im")) ||
    [];

  let newContent = "";
  if (!localSSLHosts) {
    newContent = `${hostsContent}\n\n${HOSTS_START}\n${content}\n${HOSTS_END}\n`;
  } else {
    newContent = hostsContent.replace(
      new RegExp(`${HOSTS_START}[^#]+${HOSTS_END}`, "im"),
      `${HOSTS_START}\n${content}\n${HOSTS_END}`,
    );
  }

  consola.info(`The following peace of text is what you need to update in your \`/etc/hosts\`. You can do it manually or, if you want to do it now, type your password to have permission to update the hosts.

${HOSTS_START}\n${content}\n${HOSTS_END}
`);

  const answer = await consola.prompt("Do you want to update your hosts now?", {
    type: "confirm",
  });

  if (answer) {
    await fs.writeFileSync(tmpHostsPath, newContent);
    updateSystemHosts(tmpHostsPath);
  }

  return newContent;
}

export async function updateHosts(domain: string) {
  const hostsContent = await fs.readFileSync("/etc/hosts", {
    encoding: "utf8",
  });
  const currentLocalSSLHosts = await getContentFromHosts();

  const [alreadyExistsInLocalSSLHosts] =
    currentLocalSSLHosts.match(
      new RegExp(`\\d+.\\d+.\\d+.\\d+.*?${domain}$`, "mi"),
    ) || [];

  if (alreadyExistsInLocalSSLHosts) {
    return;
  }

  const [alreadyExists] =
    hostsContent.match(new RegExp(`\\d+.\\d+.\\d+.\\d+.*?${domain}$`, "mi")) ||
    [];

  let hosts = "";
  if (alreadyExists) {
    const hostsContentCleaned = hostsContent.replace(
      new RegExp(`\\d+.\\d+.\\d+.\\d+.*?${domain}$`, "mi"),
      "",
    );

    try {
      await fs.writeFileSync(tmpHostsPath, `\n${hostsContentCleaned.trim()}\n`);
      updateSystemHosts(tmpHostsPath);
    } catch (error) {
      // silent
    }
    hosts = `${currentLocalSSLHosts}\n${alreadyExists.trim()}`;
  } else {
    const [alreadyExists] =
      currentLocalSSLHosts.match(
        new RegExp(`\\d+.\\d+.\\d+.\\d+.*?${domain}$`, "mi"),
      ) || [];
    if (!alreadyExists) {
      hosts = `${currentLocalSSLHosts}\n127.0.0.1               ${domain}`;
    }
  }

  return await setContentToHosts(hosts);
}
