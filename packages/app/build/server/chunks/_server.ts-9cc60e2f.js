import fs from 'fs';
import shell from 'shelljs';
import path from 'path';
import { r as run } from './run-fe9e8a93.js';
import 'os';

const GET = async () => {
  const configPath = path.resolve(`.`, "config.json");
  const data = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }) || "[]");
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
const POST = async ({ request }) => {
  const { domain, port } = await request.json();
  const data = JSON.parse(fs.readFileSync(`./config.json`, { encoding: "utf8" }) || "[]");
  const exists = data.find((d) => d.localDomainName === domain);
  if (exists) {
    return new Response(
      JSON.stringify({}),
      {
        status: 409,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  shell.exec(`mkcert -install 	-key-file ssl/${domain}-key.pem 	-cert-file ssl/${domain}-cert.pem 	${domain} localhost 127.0.0.1 ::1 > /dev/null`);
  const newData = [...data, {
    localDomainName: domain,
    port,
    ssl: { cert: `./ssl/${domain}-cert.pem`, key: `./ssl/${domain}-key.pem` },
    nginxConf: null
  }];
  fs.writeFileSync("./config.json", JSON.stringify(newData, null, 2));
  run();
  return new Response(
    JSON.stringify({}),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};

export { GET, POST };
//# sourceMappingURL=_server.ts-9cc60e2f.js.map
