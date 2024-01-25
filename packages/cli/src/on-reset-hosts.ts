import fs from "fs";
import path from "path";

import { HOSTS_END, HOSTS_START } from "@/constants";
import { updateSystemHosts } from "@/utils";

const distPath = path.resolve(__dirname, "./");
const tmpHostsPath = `${distPath}/.tmp-hosts`;

const onResetHosts = async () => {
  const hostsContent = await fs.readFileSync("/etc/hosts", {
    encoding: "utf8",
  });
  const [, localSSLHosts = ""] =
    hostsContent.match(new RegExp(`${HOSTS_START}([^#]+)${HOSTS_END}`, "im")) ||
    [];

  let newContent = "";
  if (!localSSLHosts) {
    newContent = `${hostsContent}\n\n${HOSTS_START}\n[^\n]+\n${HOSTS_END}\n`;
  } else {
    newContent = hostsContent.replace(
      new RegExp(`${HOSTS_START}[^#]+${HOSTS_END}`, "im"),
      newContent,
    );
  }

  await fs.writeFileSync(tmpHostsPath, newContent);

  updateSystemHosts(tmpHostsPath);
};

export default onResetHosts;
