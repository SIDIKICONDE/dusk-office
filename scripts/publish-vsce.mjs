#!/usr/bin/env node
/** Publie le VSIX sur Visual Studio Marketplace (VSCE_PAT / Azure DevOps). */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

loadEnvLocal();
requireEnv("VSCE_PAT");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const vsix = path.join(root, `dusk-office-${pkg.version}.vsix`);
if (!fs.existsSync(vsix)) {
  console.error(`VSIX introuvable : ${path.relative(root, vsix)} — lancez npm run package d'abord.`);
  process.exit(1);
}

const vsceBin = path.join(root, "node_modules", "@vscode", "vsce", "vsce");
const args = ["publish", "--packagePath", vsix, "--no-dependencies"];
const cmd = fs.existsSync(vsceBin) ? process.execPath : "npx";
const execArgs = fs.existsSync(vsceBin) ? [vsceBin, ...args] : ["--no-install", "@vscode/vsce", ...args];
const result = spawnSync(cmd, execArgs, { stdio: "inherit", cwd: root, env: process.env });
process.exit(result.status ?? 1);
