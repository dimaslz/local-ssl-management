import fs from "fs/promises";

export async function domainExistsInHosts(domain: string) {
  const hostsContent = await fs.readFile("/etc/hosts", { encoding: "utf8" });

  const [alreadyExistsInHosts] =
    hostsContent.match(new RegExp(`\\d+.\\d+.\\d+.\\d+.*?${domain}$`, "mi")) ||
    [];

  return alreadyExistsInHosts;
}
