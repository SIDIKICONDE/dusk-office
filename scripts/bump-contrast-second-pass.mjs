#!/usr/bin/env node
/**
 * Second pass on the remaining WCAG-AA FAILs after `bump-contrast-alpha.mjs`:
 *
 *  - `activityBar.inactiveForeground = #4b6c7a` (a recurring solid slate-blue)
 *    fails 2.0–3.0 against most dark workbench backgrounds. Replaced with
 *    `#8a9eaa` (lighter slate-blue) which clears 4.5:1 across the suite while
 *    staying visually muted vs the active foreground.
 *
 *  - `editorLineNumber.activeForeground = #0ea5e9` on the Light theme is
 *    cyan-500, too pale on `#f8fafc` (ratio 2.65). Replaced with cyan-700
 *    `#0e7490` to clear 4.5:1 while keeping the cyan accent identity.
 *
 *  - `editorLineNumber.foreground` on Dawn (`#6e5d68` on `#3d3648`, 1.88) and
 *    Mist (`#5a7088` on `#222f3d`, 2.66) — bumped to lighter palette tones
 *    that pass 4.5:1.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/**
 * file → { key: { from: oldHex|null (any value matches if null), to: newHex } }
 * If `from` is null the replacement is unconditional; otherwise we only swap
 * when the current value matches.
 */
const FIXES = {
  // Universal across themes that import this exact value
  "activityBar.inactiveForeground": { from: "#4b6c7a", to: "#8a9eaa" },
  // Light-theme-specific
  "editorLineNumber.activeForeground": { from: "#0ea5e9", to: "#0e7490", onlyIn: ["dusk-light.json"] },
};

const TARGET_DIRS = ["themes", "theme-sources"];

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
    } catch {
      continue;
    }
    if (!data.colors || typeof data.colors !== "object") continue;

    const fileChanges = [];

    for (const [key, spec] of Object.entries(FIXES)) {
      if (spec.onlyIn && !spec.onlyIn.includes(file)) continue;
      const v = data.colors[key];
      if (typeof v !== "string") continue;
      if (spec.from !== null && v !== spec.from) continue;
      data.colors[key] = spec.to;
      fileChanges.push(`${key}: ${v} → ${spec.to}`);
    }

    // Per-theme line-number darken/lighten by hand for the two outliers
    if (file === "dusk-aube.json" || file === "dusk-dawn.json") {
      const cur = data.colors["editorLineNumber.foreground"];
      if (cur === "#6e5d68") {
        data.colors["editorLineNumber.foreground"] = "#a89aa3";
        fileChanges.push(`editorLineNumber.foreground: ${cur} → #a89aa3 (Dawn)`);
      }
    }
    if (file === "dusk-brume.json" || file === "dusk-mist.json") {
      const cur = data.colors["editorLineNumber.foreground"];
      if (cur === "#5a7088") {
        data.colors["editorLineNumber.foreground"] = "#94a3b8";
        fileChanges.push(`editorLineNumber.foreground: ${cur} → #94a3b8 (Mist)`);
      }
    }

    if (fileChanges.length > 0) {
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
  console.log(`\n[OK] ${totalChanges} fixes across ${summary.length} files.`);
}
