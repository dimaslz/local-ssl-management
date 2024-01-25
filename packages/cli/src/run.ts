#! /usr/bin/env node

import fs from "fs/promises";

async function run() {
  const filename = process.argv[2];

  const data = await fs.readFile(filename, { encoding: "utf-8" });

  await fs.writeFile("/etc/hosts", data);
  await fs.unlink(filename);
}

run();
