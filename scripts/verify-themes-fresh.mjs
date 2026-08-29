#!/usr/bin/env node
/**
 * Regenerates themes via make:full and fails if themes/ would change in git.
 * Used in CI to catch drift between theme-sources/ and committed themes/*.json.
 */
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("npm run make:full", { cwd: root, stdio: "inherit" });
} catch {
  process.exit(1);
}

function failIfStale(relPath, label) {
  try {
    execSync(`git diff --ignore-cr-at-eol --quiet -- ${relPath}`, { cwd: root });
  } catch {
    console.error(`verify-themes-fresh: ${label} is out of sync with the pipeline.`);
    console.error("Run `npm run make:full` locally, review changes, then commit.");
    try {
      execSync(`git diff --ignore-cr-at-eol --stat -- ${relPath}`, {
        cwd: root,
        stdio: "inherit",
      });
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

failIfStale("themes/", "themes/");
failIfStale("lib/generated/themes-bundle.js", "lib/generated/themes-bundle.js");
failIfStale("docs/landing-themes.js", "docs/landing-themes.js");
console.log("verify-themes-fresh: OK — themes/, themes-bundle, and landing-themes match pipeline output");
