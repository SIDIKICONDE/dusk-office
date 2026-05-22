#!/usr/bin/env node
/**
 * Create and push an annotated release tag from package.json version.
 * Uses the latest commit author when local git user.name/email are unset.
 *
 *   node scripts/release-tag.mjs
 *   node scripts/release-tag.mjs --dry-run
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function run(args, env = process.env) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env,
    shell: false,
  }).trim();
}

function runInherit(args, env = process.env) {
  execFileSync("git", args, {
    cwd: root,
    stdio: "inherit",
    env,
    shell: false,
  });
}

function hasGitIdentity() {
  try {
    run(["config", "user.name"]);
    run(["config", "user.email"]);
    return true;
  } catch {
    return false;
  }
}

function gitIdentityEnv() {
  const env = { ...process.env };
  if (hasGitIdentity()) return env;
  const name = run(["log", "-1", "--format=%an"]);
  const email = run(["log", "-1", "--format=%ae"]);
  if (!name || !email) {
    throw new Error(
      "Git identity missing. Set user.name/user.email or ensure HEAD has an author.",
    );
  }
  env.GIT_AUTHOR_NAME = name;
  env.GIT_AUTHOR_EMAIL = email;
  env.GIT_COMMITTER_NAME = name;
  env.GIT_COMMITTER_EMAIL = email;
  return env;
}

function tagExists(tag) {
  try {
    run(["rev-parse", tag]);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const version = pkg.version;
  if (!version) {
    throw new Error("package.json: version missing");
  }
  const tag = `v${version}`;

  if (tagExists(tag)) {
    throw new Error(
      `Tag ${tag} already exists locally. Bump package.json or delete the tag first.`,
    );
  }

  const env = gitIdentityEnv();
  console.log(`[INFO] Tagging ${tag} and pushing to origin...`);
  if (dryRun) {
    console.log(`[DRY] git tag -a ${tag} -m "Release ${tag}"`);
    console.log(`[DRY] git push origin ${tag}`);
    return;
  }

  runInherit(["tag", "-a", tag, "-m", `Release ${tag}`], env);
  runInherit(["push", "origin", tag], env);
  console.log("[OK] Tag pushed. GitHub Actions release workflow triggered.");
  console.log("     Watch with: make release-watch");
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
