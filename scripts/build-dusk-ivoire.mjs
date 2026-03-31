#!/usr/bin/env node
/**
 * Writes themes/dusk-ivoire.json from dusk-light.json.
 * Warm paper base #F6EEDE, cream surfaces, copper / amber accents.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Remap #RRGGBB - UI neutrals & blues -> cream / earth tones */
const RGB_MAP = {
  ffffff: "f6eede",
  f8fafc: "f6eede",
  fafafa: "f6eede",
  f1f5f9: "efe6d8",
  eef2f7: "ebe3d6",
  e8edf4: "e5dccf",
  e2e8f0: "ddd3c4",
  cbd5e1: "d4c9b8",
  cfe8f0: "ddd0c4",
  e5e5e5: "e0d6c8",
  "0f172a": "2c2620",
  "334155": "4a4238",
  "475569": "514838",
  "64748b": "6b5d4a",
  "94a3b8": "8b7d6a",
  "6b7280": "7a6c5c",
  "727e8f": "918374",
  "4d5a6b": "9a8b78",
  "30556a": "6e6256",
  "40c8e8": "b87650",
  "67e8f9": "c98962",
  "38bdf8": "a67c52",
  "319bb4": "b5695a",
  "50b4c1": "c17f59",
  "2b92c0": "9d6b4a",
  "1aa4b8": "8a6248",
  "318fa7": "7d5a42",
  "00b2c5": "b45309",
  "00e5ff": "c06030",
  "50d0f0": "ca8a56",
  "9566c3": "8b6b9e",
  c084fc: "9d7ab8",
  "816bc2": "766494",
  "4a80c2": "5a7898",
  "7298c4": "6d8090",
  "978cc4": "8b7a95",
  "39ac63": "3d8f55",
  "68b985": "5a916e",
  "1a9849": "1f7a40",
  bd3049: "a83845",
  bd588d: "a8577a",
  c05757: "b04a4a",
  c25767: "b85a5e",
  "0a0a0a": "2c2620",
  "1e1e1e": "2a2420",
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
  const light = JSON.parse(fs.readFileSync(path.join(root, "themes/dusk-light.json"), "utf8"));
  const colors = {};
  for (const [k, v] of Object.entries(light.colors || {})) {
    colors[k] = typeof v === "string" ? mapColor(v) : v;
  }

  const out = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Ivory",
    type: "light",
    include: "./dusk.json",
    colors,
    tokenColors: light.tokenColors,
    semanticTokenColors: light.semanticTokenColors,
  };

  const dest = path.join(root, "themes/dusk-ivoire.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(colors).length, "couleurs");
}

main();
