import fs from "fs";

export async function domainExistsInHosts(domain: string) {
  const hostsContent = await fs.readFileSync("/etc/hosts", {
    encoding: "utf8",
  });

  const [alreadyExistsInHosts = false] =
    hostsContent.match(new RegExp(`\\d+.\\d+.\\d+.\\d+.*?${domain}$`, "mi")) ||
    [];

  return Boolean(alreadyExistsInHosts);
}
