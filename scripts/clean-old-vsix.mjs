#!/usr/bin/env node
import { readdirSync, readFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const current = `${pkg.name}-${pkg.version}.vsix`;
const re = new RegExp(`^${pkg.name}-.*\\.vsix$`, "i");

let removed = 0;
for (const file of readdirSync(root)) {
  if (!re.test(file) || file === current) continue;
  rmSync(join(root, file), { force: true });
  removed++;
}

console.log(`OK vsix cleanup: kept ${current}, removed ${removed} old file(s)`);
