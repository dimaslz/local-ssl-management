#! /usr/bin/env node

import fs from "fs";

async function run() {
  const filename = process.argv[2];

  const data = await fs.readFileSync(filename, { encoding: "utf-8" });

  await fs.writeFileSync("/etc/hosts", data);
  await fs.unlinkSync(filename);
}

run();
