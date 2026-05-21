#!/usr/bin/env node
/**
 * Cross-platform Gradle wrapper runner (Windows + Unix).
 *
 *   node scripts/run-gradle.mjs buildPlugin --no-daemon
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "jetbrains-plugin");
const isWin = process.platform === "win32";
const gradlew = join(pluginRoot, isWin ? "gradlew.bat" : "gradlew");

if (!existsSync(gradlew)) {
  console.error(`run-gradle: wrapper not found at ${gradlew}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("run-gradle: pass Gradle tasks, e.g. buildPlugin --no-daemon");
  process.exit(1);
}

const result = spawnSync(gradlew, args, {
  cwd: pluginRoot,
  stdio: "inherit",
  shell: isWin,
});

process.exit(result.status ?? 1);
