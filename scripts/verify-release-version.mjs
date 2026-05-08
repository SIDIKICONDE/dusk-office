#!/usr/bin/env node
/**
 * Ensures refs/tags/vX.Y.Z matches package.json "version".
 * Used by GitHub Actions Release. Locally:
 *   GITHUB_REF=refs/tags/v1.2.3 node scripts/verify-release-version.mjs
 */
import { readFileSync } from "fs";

const ref = process.env.GITHUB_REF || "";
const m = ref.match(/^refs\/tags\/v(.+)$/);
if (!m) {
  console.error(
    "verify-release-version: GITHUB_REF must be refs/tags/vX.Y.Z (got %s)",
    ref || "(empty)",
  );
  process.exit(1);
}

const tagVersion = m[1];
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

if (pkg.version !== tagVersion) {
  console.error(
    "verify-release-version: git tag v%s does not match package.json version %s — bump version, commit, then re-tag.",
    tagVersion,
    pkg.version,
  );
  process.exit(1);
}

if (!new RegExp(`^##\\s+${pkg.version.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "m").test(changelog)) {
  console.error(
    "verify-release-version: CHANGELOG.md is missing a heading for version %s.",
    pkg.version,
  );
  process.exit(1);
}

console.log("verify-release-version: OK — release %s", tagVersion);
