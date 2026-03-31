#!/usr/bin/env node
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const yes = process.argv.includes("--yes");
const safe = process.argv.includes("--safe");

function run(args) {
  execFileSync("git", args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
}

function read(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  }).trim();
}

const status = read(["status", "--short"]);
if (!status) {
  console.log("Nothing to commit.");
  process.exit(0);
}

const blocked = status
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => /(^|[\\/])(\.env|secrets?|credentials?|id_rsa|.*\.pem|.*\.key)(\.|$)/i.test(line));

if (blocked.length > 0) {
  console.error("Blocked potentially sensitive files:");
  for (const line of blocked) console.error(`- ${line}`);
  process.exit(1);
}

const message = `chore: sync local changes for ${pkg.version}`;

async function confirmSafeMode() {
  if (!safe || yes) return true;
  console.log("Pending changes:\n");
  console.log(status);
  console.log(`\nCommit message: ${message}\n`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) =>
    rl.question("Continue commit + push to main? (yes/no) ", resolve),
  );
  rl.close();
  return String(answer).trim().toLowerCase() === "yes";
}

const confirmed = await confirmSafeMode();
if (!confirmed) {
  console.log("Cancelled.");
  process.exit(0);
}

run(["add", "-A"]);
run(["commit", "-m", message]);
run(["push", "origin", "main"]);

console.log(`OK pushed to main with message: "${message}"`);
