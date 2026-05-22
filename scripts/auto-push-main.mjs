#!/usr/bin/env node
/**
 * Commit + push local changes to `main`.
 *
 * By default, shows git status and asks for confirmation (safe).
 * Pass --yes to skip the prompt (CI / deliberate one-shot automation only).
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const skipConfirm = process.argv.includes("--yes");

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

/** Identité pour ce commit uniquement — ne modifie pas git config. */
function resolveGitIdentity() {
  const name =
    process.env.GIT_AUTHOR_NAME?.trim() ||
    process.env.DUSK_OFFICE_GIT_NAME?.trim() ||
    "";
  const email =
    process.env.GIT_AUTHOR_EMAIL?.trim() ||
    process.env.DUSK_OFFICE_GIT_EMAIL?.trim() ||
    "";
  if (name && email) return { name, email };

  try {
    const login = execFileSync("gh", ["api", "user", "-q", ".login"], {
      cwd: root,
      encoding: "utf8",
      shell: false,
    }).trim();
    if (login) {
      return { name: login, email: `${login}@users.noreply.github.com` };
    }
  } catch {
    /* gh absent ou non connecté */
  }

  try {
    const ident = read(["var", "GIT_AUTHOR_IDENT_STRING"]);
    if (ident) {
      const m = ident.match(/^(.*)\s+<([^>]+)>$/);
      if (m) return { name: m[1].trim(), email: m[2].trim() };
    }
  } catch {
    /* git config user.name/email absent */
  }

  return null;
}

function runCommit(message, identity) {
  const args = ["commit", "-m", message];
  if (identity) {
    run(["-c", `user.name=${identity.name}`, "-c", `user.email=${identity.email}`, ...args]);
    return;
  }
  run(args);
}

const currentBranch = read(["rev-parse", "--abbrev-ref", "HEAD"]);
if (currentBranch !== "main") {
  console.error(
    `Refusing to push: current branch is "${currentBranch}", expected "main". ` +
      "Switch to main (git checkout main) before running this script.",
  );
  process.exit(1);
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

async function confirmUnlessYes() {
  if (skipConfirm) return true;
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

const confirmed = await confirmUnlessYes();
if (!confirmed) {
  console.log("Cancelled.");
  process.exit(0);
}

run(["add", "-A"]);
const identity = resolveGitIdentity();
if (!identity) {
  console.error(
    "Git identity missing. Set once (no global git config required):\n" +
      "  $env:GIT_AUTHOR_NAME=\"Your Name\"\n" +
      "  $env:GIT_AUTHOR_EMAIL=\"you@example.com\"\n" +
      "Or log in with gh auth login (uses GitHub noreply email automatically).",
  );
  process.exit(1);
}
runCommit(message, identity);
run(["push", "origin", "main"]);

console.log(`OK pushed to main with message: "${message}"`);
