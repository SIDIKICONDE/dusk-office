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

function pendingTouchesWorkflow(statusText) {
  return statusText
    .split(/\r?\n/)
    .some((line) => /\.github\/workflows\//.test(line));
}

function lastCommitTouchesWorkflow() {
  try {
    const files = read(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]);
    return files.split(/\r?\n/).some((file) => file.startsWith(".github/workflows/"));
  } catch {
    return false;
  }
}

function getOriginUrl() {
  try {
    return read(["remote", "get-url", "origin"]);
  } catch {
    return "";
  }
}

/** https://github.com/owner/repo(.git) → git@github.com:owner/repo.git */
function githubHttpsToSsh(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?\/?$/i);
  if (!m) return null;
  return `git@github.com:${m[1]}/${m[2]}.git`;
}

function githubSshAvailable() {
  try {
    execFileSync("ssh", ["-T", "-o", "BatchMode=yes", "-o", "ConnectTimeout=5", "git@github.com"], {
      cwd: root,
      encoding: "utf8",
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch (err) {
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    return err.status === 1 && /successfully authenticated/i.test(out);
  }
}

function tryPush(args) {
  try {
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      shell: false,
      stdio: ["inherit", "pipe", "pipe"],
    });
    return { ok: true };
  } catch (err) {
    const detail = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;
    return { ok: false, detail };
  }
}

function isWorkflowScopePushError(detail) {
  return /workflow.*scope|without `workflow` scope/i.test(detail);
}

function pushMain(willTouchWorkflow) {
  const originUrl = getOriginUrl();
  const sshUrl = githubHttpsToSsh(originUrl);
  const preferSsh =
    (willTouchWorkflow || lastCommitTouchesWorkflow()) &&
    /^https:\/\/github\.com\//i.test(originUrl) &&
    sshUrl &&
    githubSshAvailable();

  if (preferSsh) {
    console.log("Pushing via SSH (GitHub workflow files need SSH or a token with the workflow scope).");
    const result = tryPush(["push", sshUrl, "main"]);
    if (result.ok) return;
    throw new Error(result.detail || "git push failed");
  }

  const result = tryPush(["push", "origin", "main"]);
  if (result.ok) return;

  if (isWorkflowScopePushError(result.detail) && sshUrl && githubSshAvailable()) {
    console.log("HTTPS push rejected (missing workflow scope); retrying via SSH…");
    const retry = tryPush(["push", sshUrl, "main"]);
    if (retry.ok) return;
    throw new Error(retry.detail || "git push failed");
  }

  if (isWorkflowScopePushError(result.detail)) {
    throw new Error(
      `${result.detail.trim()}\n\n` +
        "Fix: gh auth refresh -h github.com -s workflow\n" +
        "Or set up SSH: ssh -T git@github.com, then git remote set-url origin git@github.com:OWNER/REPO.git",
    );
  }

  throw new Error(result.detail || "git push failed");
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
try {
  pushMain(pendingTouchesWorkflow(status));
} catch (err) {
  console.error(err.message?.trim() || err);
  process.exit(1);
}

console.log(`OK pushed to main with message: "${message}"`);
