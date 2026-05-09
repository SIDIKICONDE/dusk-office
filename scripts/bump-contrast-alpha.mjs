#!/usr/bin/env node
/**
 * Bulk fix for the most common WCAG-AA contrast violations across all themes.
 *
 * Targets two systemic patterns shared by the entire theme suite:
 *
 *  - `editorLineNumber.foreground`     "#XXXXXX55" (~33% alpha) → "#XXXXXXcc" (80%)
 *  - `input.placeholderForeground`     "#XXXXXX55" (~33% alpha) → "#XXXXXXcc" (80%)
 *  - `inlineChatInput.placeholderForeground` same pattern
 *
 * On light themes only:
 *  - `sideBarSectionHeader.foreground` "#d1e0e8" inherited near-white → editor.foreground
 *
 * Walks `themes/*.json` (source-of-truth files for shipped themes) and
 * `theme-sources/*.json` (inputs for the build pipeline) so the next regen
 * also produces the corrected values.
 *
 * Run: node scripts/bump-contrast-alpha.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ALPHA_55_KEYS = [
  "editorLineNumber.foreground",
  "input.placeholderForeground",
  "inlineChatInput.placeholderForeground",
  "editor.foldPlaceholderForeground",
];

const NEW_ALPHA = "cc"; // ~80% — clears 4.5:1 against typical dark/light bgs

const TARGET_DIRS = ["themes", "theme-sources"];

/** Returns true if hex looks like #RRGGBBAA where alpha < target. */
function shouldBump(hex) {
  if (typeof hex !== "string") return false;
  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return false;
  const alpha = parseInt(m[2], 16);
  // Bump anything below 0xa0 (~63%) — values from 55, 66, 88, 8c
  return alpha < 0xa0;
}

function bumpAlpha(hex) {
  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return hex;
  return `#${m[1]}${NEW_ALPHA}`;
}

let totalChanges = 0;
const summary = [];

for (const dir of TARGET_DIRS) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs)) {
    if (!file.endsWith(".json")) continue;
    const p = path.join(abs, file);
    const raw = fs.readFileSync(p, "utf8");
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.warn(`[skip] ${dir}/${file}: ${e.message}`);
      continue;
    }
    if (!data.colors || typeof data.colors !== "object") continue;

    const fileChanges = [];

    for (const key of ALPHA_55_KEYS) {
      const v = data.colors[key];
      if (shouldBump(v)) {
        const newV = bumpAlpha(v);
        data.colors[key] = newV;
        fileChanges.push(`${key}: ${v} → ${newV}`);
      }
    }

    // Light-theme-only: sideBarSectionHeader.foreground inherited from dark base
    const isLight = data.type === "light";
    if (isLight && data.colors["sideBarSectionHeader.foreground"] === "#d1e0e8") {
      const editorFg = data.colors["editor.foreground"];
      if (typeof editorFg === "string" && /^#[0-9a-fA-F]{6}$/.test(editorFg)) {
        const old = data.colors["sideBarSectionHeader.foreground"];
        data.colors["sideBarSectionHeader.foreground"] = editorFg;
        fileChanges.push(`sideBarSectionHeader.foreground: ${old} → ${editorFg}`);
      }
    }

    if (fileChanges.length > 0) {
      // Preserve trailing newline if the original had one
      const trailing = raw.endsWith("\n") ? "\n" : "";
      fs.writeFileSync(p, JSON.stringify(data, null, 2) + trailing);
      totalChanges += fileChanges.length;
      summary.push({ file: `${dir}/${file}`, changes: fileChanges });
    }
  }
}

if (summary.length === 0) {
  console.log("[OK] No changes needed.");
} else {
  for (const { file, changes } of summary) {
    console.log(`\n${file}`);
    for (const c of changes) console.log(`  ${c}`);
  }
  console.log(`\n[OK] ${totalChanges} alpha bumps across ${summary.length} files.`);
}
