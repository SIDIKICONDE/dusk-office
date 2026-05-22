#!/usr/bin/env node
/** Publie le VSIX sur Open VSX (OVSX_PAT). */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

loadEnvLocal();
const pat = requireEnv("OVSX_PAT");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const vsix = path.join(root, `dusk-office-${pkg.version}.vsix`);
if (!fs.existsSync(vsix)) {
  console.error(`VSIX introuvable : ${path.relative(root, vsix)} — lancez npm run package d'abord.`);
  process.exit(1);
}

const ovsxBin = path.join(root, "node_modules", "ovsx", "bin", "ovsx");
const args = ["publish", vsix, "-p", pat];
const cmd = fs.existsSync(ovsxBin) ? process.execPath : "npx";
const execArgs = fs.existsSync(ovsxBin) ? [ovsxBin, ...args] : ["--no-install", "ovsx", ...args];
const result = spawnSync(cmd, execArgs, { stdio: "inherit", cwd: root });
process.exit(result.status ?? 1);
