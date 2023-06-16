import fs from 'fs';
import { r as run } from './run-fe9e8a93.js';
import 'path';
import 'shelljs';
import 'os';

const DELETE = async ({ params }) => {
  const { domain } = params;
  const data = JSON.parse(fs.readFileSync(`./config.json`, { encoding: "utf8" }) || "[]");
  const newData = data.filter((i) => i.localDomainName !== domain);
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

export { DELETE };
//# sourceMappingURL=_server.ts-a556d3d3.js.map
