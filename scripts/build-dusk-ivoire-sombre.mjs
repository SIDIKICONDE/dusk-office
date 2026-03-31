#!/usr/bin/env node
/**
 * Writes themes/dusk-ivoire-sombre.json from dusk-cendre.json.
 * Same spirit as Dusk Office Ivory (#F6EEDE) but dark: deep warm browns, cream text, copper accents.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Remap #RRGGBB - cool grays -> warm; UI blues -> copper / amber */
const RGB_MAP = {
  "000000": "100d0c",
  "0a0a0a": "14110f",
  "14161c": "1a1714",
  "181b20": "1f1c17",
  "1e1e1e": "1a1614",
  "1e2228": "242019",
  "22262c": "28241e",
  "22262e": "2a251f",
  "262a32": "2e2822",
  "2a2e36": "322c26",
  "2d3139": "363028",
  "3a424d": "3a332c",
  "3d424c": "3d362f",
  "4b5563": "6b5e54",
  "535863": "5c5249",
  "6b7280": "887b6c",
  "727e8f": "9d8f7f",
  "797e88": "8a7d72",
  "9ca3af": "a89888",
  "9ea5ae": "aa9a8a",
  a2a5aa: "ae9e8e",
  d1d5db: "c9b8a4",
  e5e5e5: "eae0d2",
  e5e7eb: "eee2d4",
  fafafa: "f0e6d8",
  ffffff: "f6eede",
  "23a594": "b87650",
  "49b5a5": "c17f59",
  "61a4c3": "c98962",
  "90b2c4": "9d8f82",
  "60a5fa": "d4a574",
  "67e8f9": "e8b87a",
  "93c5fd": "c9a882",
  "978cc4": "9d8a7a",
  "4a80c2": "b87650",
  "816bc2": "9d7ab8",
  a78bfa: "c4a8e8",
  ba84c3: "c49abf",
  c182a5: "b88a9d",
};

/** @param {string} str */
function mapColor(str) {
  if (typeof str !== "string" || !str.startsWith("#")) return str;
  const m = str.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/i);
  if (!m) return str;
  const rgb = m[1].toLowerCase();
  const a = m[2] || "";
  const next = RGB_MAP[rgb];
  if (next) return `#${next}${a}`;
  return str;
}

function main() {
  const src = JSON.parse(fs.readFileSync(path.join(root, "themes/dusk-cendre.json"), "utf8"));
  const colors = {};
  for (const [k, v] of Object.entries(src.colors || {})) {
    colors[k] = typeof v === "string" ? mapColor(v) : v;
  }

  /** Deeper editor surfaces (espresso / dark ivory) */
  const deep = {
    "editor.background": "#1f1c18",
    "editorCursor.background": "#1f1c18",
    "editorGutter.background": "#1c1916",
  };
  Object.assign(colors, deep);

  const out = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Dark Ivory",
    include: "./dusk.json",
    colors,
    tokenColors: src.tokenColors,
    semanticTokenColors: src.semanticTokenColors,
  };

  const dest = path.join(root, "themes/dusk-ivoire-sombre.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(colors).length, "colors");
}

main();
