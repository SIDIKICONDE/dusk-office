#!/usr/bin/env node
/**
 * Génère themes/nyx-light.json à partir de nyx-abime.json (palette sombre → claire).
 * À relancer après refonte majeure d’Abîme.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Bases #RRGGBB (minuscules) très sombres → surfaces claires */
const DARK_BG_TO_LIGHT = {
  "000000": "#e2e8f0",
  "02060c": "#e8edf4",
  "030810": "#f1f5f9",
  "040a10": "#f8fafc",
  "040a12": "#f1f5f9",
  "040c10": "#eef2f7",
  "040c12": "#f1f5f9",
  "050e16": "#ffffff",
  "061018": "#f8fafc",
  "122030": "#cbd5e1",
  "1e3448": "#94a3b8",
  "285868": "#94a3b8",
  "2d5a78": "#64748b",
};

/** Texte / icônes clairs illisibles sur fond blanc (#RRGGBB ou #RRGGBBAA) */
const LIGHT_FG_TO_DARK = {
  cfe8f0: "#0f172a",
  cfe8f0aa: "#334155aa",
  cfe8f0cc: "#334155cc",
  cfe8f077: "#64748b77",
  cfe8f055: "#64748b55",
  cfe8f0bb: "#475569bb",
  cfe8f088: "#64748b88",
  cfe8f022: "#33415522",
  cfe8f012: "#33415512",
};

function luminance6(rgb) {
  const r = parseInt(rgb.slice(0, 2), 16) / 255;
  const g = parseInt(rgb.slice(2, 4), 16) / 255;
  const b = parseInt(rgb.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const R = lin(r),
    G = lin(g),
    B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** @param {string} s */
function mapHex(s, key) {
  if (typeof s !== "string" || !s.startsWith("#")) return s;
  const h = s.slice(1);
  if (h.length !== 6 && h.length !== 8) return s;
  const rgb = h.slice(0, 6).toLowerCase();
  const a = h.length === 8 ? h.slice(6).toLowerCase() : "";
  const fullLower = (rgb + a).toLowerCase();
  if (LIGHT_FG_TO_DARK[fullLower]) return LIGHT_FG_TO_DARK[fullLower];

  if (key.includes("shadow") && rgb === "000000") return "#64748b" + (a || "44");

  const rep = DARK_BG_TO_LIGHT[rgb];
  if (rep) {
    const out = rep.slice(1);
    return "#" + out + (a || "");
  }

  if (luminance6(rgb) < 0.08 && rgb !== "0a0a0a" && rgb !== "1e1e1e") {
    const fallback = "#f1f5f9";
    return "#" + fallback.slice(1) + (a || "");
  }

  return s;
}

function main() {
  const abime = JSON.parse(fs.readFileSync(path.join(root, "themes/nyx-abime.json"), "utf8"));
  /** @type {Record<string, string>} */
  const colors = {};
  for (const [k, v] of Object.entries(abime.colors || {})) {
    colors[k] = typeof v === "string" ? mapHex(v, k) : v;
  }

  const out = {
    $schema: "vscode://schemas/color-theme",
    name: "Nyx Clair",
    type: "light",
    include: "./nyx.json",
    colors,
    tokenColors: abime.tokenColors,
    semanticTokenColors: abime.semanticTokenColors,
  };

  const dest = path.join(root, "themes/nyx-light.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(colors).length, "couleurs");
}

main();
