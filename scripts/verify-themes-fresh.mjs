#!/usr/bin/env node
/**
 * Regenerates themes via make:full and fails if the generated artefacts would change
 * in git. Used in CI to catch drift between theme-sources/ and committed themes/*.json.
 *
 * Checks three things, because each was a real blind spot:
 *
 *  1. Unstaged worktree changes — `git diff --quiet` alone.
 *  2. **Staged** changes — same command, but once a generated file is staged the
 *     worktree matches the index and the old check passed while the commit was dirty.
 *  3. **Untracked** files under the watched paths — `git diff` never sees them, so a
 *     stray `themes/dusk-brandnew.json` was invisible.
 */
import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const skipBuild = process.argv.includes("--no-build");
if (!skipBuild) {
  try {
    execSync("npm run make:full", { cwd: root, stdio: "inherit" });
  } catch {
    process.exit(1);
  }
}

const WATCHED = ["themes/", "lib/generated/themes-bundle.js", "docs/landing-themes.js"];

function fail(message, hint) {
  console.error(`verify-themes-fresh: ${message}`);
  if (hint) console.error(hint);
  process.exit(1);
}

/** Untracked, non-ignored files under a directory (git ls-files --others). */
function untrackedUnder(relDir) {
  try {
    return execSync(`git ls-files --others --exclude-standard -- ${relDir}`, {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function hasUntrackedContent(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) {
    // An untracked file at an exact path means the tracked copy was deleted.
    const tracked = execSync(`git ls-files --error-unmatch -- ${relPath} 2>/dev/null || true`, {
      cwd: root,
      encoding: "utf8",
    }).trim();
    return tracked ? [] : untrackedUnder(relPath);
  }
  return untrackedUnder(relPath);
}

for (const relPath of WATCHED) {
  const label = relPath;

  // 1. Unstaged changes.
  try {
    execSync(`git diff --ignore-cr-at-eol --quiet -- ${relPath}`, { cwd: root });
  } catch {
    try {
      execSync(`git diff --ignore-cr-at-eol --stat -- ${relPath}`, {
        cwd: root,
        stdio: "inherit",
      });
    } catch {
      /* ignore */
    }
    fail(
      `${label} is out of sync with the pipeline (unstaged changes).`,
      "Run `npm run make:full` locally, review changes, then commit.",
    );
  }

  // 2. Staged changes. `--quiet` on an empty diff exits 0; we need "does the index
  //    differ from HEAD", which is `--cached --quiet` against HEAD.
  let stagedDiff = false;
  try {
    execSync(`git diff --cached --ignore-cr-at-eol --quiet -- ${relPath}`, { cwd: root });
  } catch {
    stagedDiff = true;
  }
  if (stagedDiff) {
    try {
      execSync(`git diff --cached --ignore-cr-at-eol --stat -- ${relPath}`, {
        cwd: root,
        stdio: "inherit",
      });
    } catch {
      /* ignore */
    }
    fail(
      `${label} has staged changes that the pipeline just regenerated.`,
      "The committed artefact does not match pipeline output. Re-run `npm run make:full` and stage the result.",
    );
  }

  // 3. Untracked files inside the watched paths.
  const untracked = hasUntrackedContent(relPath);
  if (untracked.length > 0) {
    for (const file of untracked) {
      console.error(`  untracked: ${relative(root, join(root, file))}`);
    }
    fail(
      `${label} contains untracked file(s) that git diff cannot see.`,
      "Generated artefacts must be tracked. Add or remove them so the tree matches the pipeline.",
    );
  }
}

console.log(
  "verify-themes-fresh: OK — themes/, themes-bundle and landing-themes match pipeline output " +
    "(worktree, index and untracked files all clean)",
);