import { r as run } from './run-fe9e8a93.js';
import 'fs';
import 'path';
import 'shelljs';
import 'os';

const POST = async () => {
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

export { POST };
//# sourceMappingURL=_server.ts-f8c953e5.js.map
