import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import os from 'os';

const n = os.networkInterfaces();
function getLocalIP() {
  for (const k in n) {
    const inter = n[k];
    for (const j in inter)
      if (inter[j].family === "IPv4" && !inter[j].internal)
        return inter[j].address;
  }
}
const { pathname: __dirname } = new URL("../../../../", import.meta.url);
const fileExists = (file) => {
  return JSON.parse(shell.exec(`if [[ -f ${file} ]]; then echo 'true'; else echo 'false'; fi;`).stdout.trim());
};
const LOCAL_IP = getLocalIP();
const toReplace = "#--server-config--#";
if (!shell.which("mkcert")) {
  shell.echo('Sorry, this script requires "mkcert"');
  shell.exit(1);
}
if (!shell.which("git")) {
  shell.echo('Sorry, this script requires "docker"');
  shell.exit(1);
}
const run = () => {
  const configPath = path.resolve(__dirname, "config.json");
  if (!fileExists(configPath)) {
    console.log("Sorry, config.json does not exists.");
  }
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");
  const nginxConfServerTplPath = path.resolve(__dirname, "assets/nginx.conf.server.tpl");
  const certsUrl = [];
  const serverConfigs = config.map((c) => {
    if (!fileExists(nginxConfServerTplPath)) {
      console.log("Sorry, is not possible to find './nginx.conf.server.tpl' file.");
    }
    const nginxConfServerTpl = fs.readFileSync(nginxConfServerTplPath, { encoding: "utf8" });
    if (c.nginxConf) {
      return nginxConf;
    }
    certsUrl.push({
      cert: c.ssl.cert,
      key: c.ssl.key
    });
    return nginxConfServerTpl.replaceAll("%APP_DOMAIN%", c.localDomainName).replace("%LOCAL_IP%", LOCAL_IP).replace("%PORT%", c.port);
  });
  const nginxConfTplPath = path.resolve(__dirname, "assets/nginx.conf.tpl");
  if (!fileExists(nginxConfTplPath)) {
    console.log("Sorry, is not possible to find 'nginx.conf.tpl' file.");
  }
  const nginxConfTpl = fs.readFileSync(nginxConfTplPath, { encoding: "utf8" });
  const nginxConf = nginxConfTpl.replace(toReplace, serverConfigs.join("\n"));
  const nginxConfDest = path.resolve(__dirname, "nginx.conf");
  fs.writeFileSync(nginxConfDest, nginxConf);
  const dockerfileTplPath = path.resolve(__dirname, "Dockerfile.tpl");
  const dockerfileContent = fs.readFileSync(dockerfileTplPath, { encoding: "utf8" });
  const dockerfileDest = path.resolve(__dirname, "Dockerfile");
  fs.writeFileSync(dockerfileDest, dockerfileContent.replace(
    "#-certs-#",
    certsUrl.map((d) => {
      return `COPY ${d.key} /etc/nginx/
COPY ${d.cert} /etc/nginx/`;
    }).join("\n")
  ));
  shell.exec(`NAME=local-443-proxy && 	docker rm -f $NAME && 	docker rmi -f $NAME && 	docker build --no-cache -t $NAME . && 	docker run --name $NAME -p 80:80 -p 443:443 -d $NAME && 	docker ps`);
  config.forEach((c) => {
    const curl = `curl -s -o /dev/null -w "%{http_code}" https://${c.localDomainName}`;
    const status = shell.exec(curl).stdout;
    if (status === "200") {
      console.log(` - https://${c.localDomainName} ✅`);
    } else {
      console.log(` - https://${c.localDomainName} ❌`);
    }
  });
};

export { run as r };
//# sourceMappingURL=run-fe9e8a93.js.map
