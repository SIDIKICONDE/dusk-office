#!/usr/bin/env node
/**
 * Apply LIGHT_TERMINAL_ANSI to all Marketplace themes with uiTheme "vs".
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { applyLightTerminalAnsi } from "./light-terminal-ansi.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

for (const entry of pkg.contributes?.themes ?? []) {
  if (entry.uiTheme !== "vs" || !entry.path) continue;
  const file = path.join(root, entry.path);
  const theme = JSON.parse(fs.readFileSync(file, "utf8"));
  theme.colors = theme.colors ?? {};
  applyLightTerminalAnsi(theme.colors);
  fs.writeFileSync(file, JSON.stringify(theme, null, 2) + "\n", "utf8");
  console.log("OK", path.relative(root, file));
}
