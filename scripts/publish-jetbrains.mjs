#!/usr/bin/env node
/** Build + publishPlugin JetBrains (JETBRAINS_TOKEN). */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

loadEnvLocal();
requireEnv("JETBRAINS_TOKEN");

function runNpm(script) {
  const result = spawnSync("npm", ["run", script], { stdio: "inherit", cwd: root, shell: true, env: process.env });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

runNpm("jetbrains:build");
const gradle = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "run-gradle.mjs"), "publishPlugin", "--no-daemon"],
  { stdio: "inherit", cwd: root, env: process.env },
);
process.exit(gradle.status ?? 1);
