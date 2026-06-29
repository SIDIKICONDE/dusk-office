#!/usr/bin/env node
/**
 * Idempotent marketplace publish for CI release workflow.
 * Skips (exit 0) when the current package.json version is already published.
 *
 *   node scripts/publish-release.mjs vsce [--package path/to.vsix]
 *   node scripts/publish-release.mjs ovsx [--package path/to.vsix]
 *   node scripts/publish-release.mjs jetbrains
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const SKIP_PATTERNS = [
  /already exists/i,
  /already published/i,
  /duplicate version/i,
  /version .* already/i,
  /isn't active and therefore not visible/i,
  /cannot republish/i,
  /plugin version .* exists/i,
];

function parseArgs(argv) {
  const target = argv[0];
  let packagePath = path.join(root, `dusk-office-${pkg.version}.vsix`);
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === "--package" && argv[i + 1]) {
      packagePath = path.resolve(root, argv[++i]);
    }
  }
  return { target, packagePath };
}

function isAlreadyPublished(output) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(output));
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    ...options,
  });
}

function publishOrSkip(label, result) {
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if ((result.status ?? 1) === 0) {
    console.log(`[OK] ${label} published.`);
    return;
  }
  if (isAlreadyPublished(output)) {
    console.log(`::warning::${label}: v${pkg.version} already published — skipping.`);
    if (output) console.log(output);
    return;
  }
  if (output) {
    console.error(output);
  }
  process.exit(result.status ?? 1);
}

function requireSecret(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`::error::${name} secret is not set; refusing to publish without ${labelFor(name)}.`);
    process.exit(1);
  }
  return value;
}

function labelFor(secret) {
  if (secret === "VSCE_PAT") return "VS Marketplace";
  if (secret === "OVSX_PAT") return "Open VSX";
  if (secret === "JETBRAINS_TOKEN") return "JetBrains Marketplace";
  return secret;
}

function publishVsce(packagePath) {
  requireSecret("VSCE_PAT");
  if (!fs.existsSync(packagePath)) {
    console.error(`::error::VSIX not found: ${packagePath}`);
    process.exit(1);
  }
  const vsceBin = path.join(root, "node_modules", "@vscode", "vsce", "vsce");
  const args = ["publish", "--packagePath", packagePath];
  const cmd = fs.existsSync(vsceBin) ? process.execPath : "npx";
  const execArgs = fs.existsSync(vsceBin)
    ? [vsceBin, ...args]
    : ["--no-install", "@vscode/vsce", ...args];
  publishOrSkip("VS Marketplace", run(cmd, execArgs, { env: process.env }));
}

function publishOvsx(packagePath) {
  const pat = process.env.OVSX_PAT?.trim();
  if (!pat) {
    console.log("::warning::OVSX_PAT not set — skipping Open VSX.");
    return;
  }
  if (!fs.existsSync(packagePath)) {
    console.error(`::error::VSIX not found: ${packagePath}`);
    process.exit(1);
  }
  const ovsxBin = path.join(root, "node_modules", "ovsx", "bin", "ovsx");
  const args = ["publish", packagePath, "-p", pat];
  const cmd = fs.existsSync(ovsxBin) ? process.execPath : "npx";
  const execArgs = fs.existsSync(ovsxBin)
    ? [ovsxBin, ...args]
    : ["--no-install", "ovsx", ...args];
  publishOrSkip("Open VSX", run(cmd, execArgs, { env: process.env }));
}

function publishJetBrains() {
  requireSecret("JETBRAINS_TOKEN");
  const result = run(process.execPath, [
    path.join(root, "scripts", "run-gradle.mjs"),
    "publishPlugin",
    "--no-daemon",
  ]);
  publishOrSkip("JetBrains Marketplace", result);
}

const { target, packagePath } = parseArgs(process.argv.slice(2));
if (!target || !["vsce", "ovsx", "jetbrains"].includes(target)) {
  console.error("Usage: node scripts/publish-release.mjs <vsce|ovsx|jetbrains> [--package path.vsix]");
  process.exit(1);
}

if (target === "vsce") publishVsce(packagePath);
else if (target === "ovsx") publishOvsx(packagePath);
else publishJetBrains();
