#!/usr/bin/env node
/**
 * Create and push an annotated release tag from package.json version.
 * Uses the latest commit author when local git user.name/email are unset.
 *
 *   node scripts/release-tag.mjs
 *   node scripts/release-tag.mjs --dry-run
 *   node scripts/release-tag.mjs --retag   # move an existing local tag to HEAD, then push --force
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const retag = process.argv.includes("--retag");

function run(args, env = process.env, stdio = "pipe") {
  const result = execFileSync("git", args, {
    cwd: root,
    encoding: stdio === "pipe" ? "utf8" : undefined,
    env,
    shell: false,
    stdio,
  });
  return stdio === "pipe" ? String(result).trim() : "";
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
    run(["rev-parse", tag], process.env, ["ignore", "pipe", "ignore"]);
    return true;
  } catch {
    return false;
  }
}

function tagCommit(tag) {
  return run(["rev-list", "-n", "1", tag]);
}

function remoteTagCommit(tag) {
  try {
    const out = run(["ls-remote", "--tags", "origin", `refs/tags/${tag}`]);
    if (!out) return null;
    return out.split(/\s+/)[0];
  } catch {
    return null;
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const version = pkg.version;
  if (!version) {
    throw new Error("package.json: version missing");
  }
  const tag = `v${version}`;
  const head = run(["rev-parse", "HEAD"]);
  const env = gitIdentityEnv();

  if (tagExists(tag)) {
    const localCommit = tagCommit(tag);
    const remoteCommit = remoteTagCommit(tag);

    if (localCommit === head && remoteCommit === localCommit) {
      console.log(`[OK] Tag ${tag} already points to HEAD and is on origin. Nothing to do.`);
      console.log("     Watch with: make release-watch");
      return;
    }

    if (localCommit === head && remoteCommit !== localCommit) {
      console.log(`[INFO] Tag ${tag} exists locally on HEAD; pushing to origin...`);
      if (dryRun) {
        console.log(`[DRY] git push origin ${tag}`);
        return;
      }
      runInherit(["push", "origin", tag], env);
      console.log("[OK] Tag pushed. GitHub Actions release workflow triggered.");
      return;
    }

    if (retag) {
      console.log(`[INFO] Retagging ${tag} on HEAD (${head.slice(0, 7)})...`);
      if (dryRun) {
        console.log(`[DRY] git tag -f -a ${tag} -m "Release ${tag}"`);
        console.log(`[DRY] git push --force origin ${tag}`);
        return;
      }
      runInherit(["tag", "-f", "-a", tag, "-m", `Release ${tag}`], env);
      runInherit(["push", "--force", "origin", tag], env);
      console.log("[OK] Tag moved and pushed. GitHub Actions release workflow triggered.");
      return;
    }

    throw new Error(
      `Tag ${tag} already exists on ${localCommit.slice(0, 7)} but HEAD is ${head.slice(0, 7)}. ` +
        "Bump package.json for a new release, or rerun with --retag to move the tag to HEAD.",
    );
  }

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
