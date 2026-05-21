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

try {
  execSync("git diff --ignore-cr-at-eol --quiet -- themes/", { cwd: root });
  console.log("verify-themes-fresh: OK — themes/ matches pipeline output");
} catch {
  console.error(
    "verify-themes-fresh: themes/ is out of sync with theme-sources/ pipeline.",
  );
  console.error("Run `npm run make:full` locally, review changes, then commit.");
  try {
    execSync("git diff --ignore-cr-at-eol --stat -- themes/", {
      cwd: root,
      stdio: "inherit",
    });
  } catch {
    /* ignore */
  }
  process.exit(1);
}
