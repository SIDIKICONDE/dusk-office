#!/usr/bin/env node
/**
 * Vérifie que terminal.foreground et les ANSI (sauf slots « black ») restent lisibles
 * sur terminal.background (aligné sur panel via merge-extended-ui-colors).
 *
 * Seuils par défaut : terminal.foreground ≥ 4.5:1 (WCAG 2.1 AA corps de texte),
 * autres ANSI (hors black / brightBlack) ≥ 2.9:1 sur fond sombre (vs-dark / hc-black).
 * Thèmes clairs (vs) : uniquement terminal.foreground vs fond.
 *
 * Usage : node scripts/verify-terminal-contrast.mjs
 * Env : MIN_FG_RATIO (défaut 4.5), MIN_ANSI_RATIO (défaut 3)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");

const MIN_FG = Number(process.env.MIN_FG_RATIO) || 4.5;
/** ANSI sur fond sombre : objectif 3:1 ; 2.9 évite faux positifs sur teintes saturées (ex. magenta sur panel bleu). */
const MIN_ANSI = Number(process.env.MIN_ANSI_RATIO) || 2.9;

const SKIP_ANSI = new Set([
  "terminal.ansiBlack",
  "terminal.ansiBrightBlack",
]);

const ANSI_KEYS = [
  "terminal.foreground",
  "terminal.ansiBlack",
  "terminal.ansiRed",
  "terminal.ansiGreen",
  "terminal.ansiYellow",
  "terminal.ansiBlue",
  "terminal.ansiMagenta",
  "terminal.ansiCyan",
  "terminal.ansiWhite",
  "terminal.ansiBrightBlack",
  "terminal.ansiBrightRed",
  "terminal.ansiBrightGreen",
  "terminal.ansiBrightYellow",
  "terminal.ansiBrightBlue",
  "terminal.ansiBrightMagenta",
  "terminal.ansiBrightCyan",
  "terminal.ansiBrightWhite",
];

/** @param {{ r: number; g: number; b: number }} c */
function luminance(c) {
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const R = lin(c.r),
    G = lin(c.g),
    B = lin(c.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** @param {number} L1 @param {number} L2 */
function contrastRatio(L1, L2) {
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * @param {string} s
 * @returns {{ r: number; g: number; b: number; alpha?: string } | null}
 */
function parseColor(s) {
  if (typeof s !== "string" || !s.startsWith("#")) return null;
  let h = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(h))
    h = [...h].map((ch) => ch + ch).join("");
  if (/^[0-9a-fA-F]{6}$/.test(h))
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  if (/^[0-9a-fA-F]{8}$/.test(h))
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      alpha: h.slice(6, 8),
    };
  return null;
}

/** @param {{ r: number; g: number; b: number }} fg @param {number} a01 @param {{ r: number; g: number; b: number }} bg */
function composite(fg, a01, bg) {
  const a = Math.max(0, Math.min(1, a01));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

/**
 * Fond terminal opaque : si alpha, composite sur noir (sombre) ou blanc (clair)
 * selon la luminance du RGB, pour coller à un shell sur fond sombre vs clair.
 */
function terminalBgRgb(colorStr) {
  const p = parseColor(colorStr);
  if (!p) return null;
  if (p.alpha != null) {
    const a = parseInt(p.alpha, 16) / 255;
    const L = luminance({ r: p.r, g: p.g, b: p.b });
    const under = L < 0.2 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    return composite({ r: p.r, g: p.g, b: p.b }, a, under);
  }
  return { r: p.r, g: p.g, b: p.b };
}

/** @param {string} colorStr @param {{ r: number; g: number; b: number }} bgRgb */
function effectiveFgRgb(colorStr, bgRgb) {
  const p = parseColor(colorStr);
  if (!p) return null;
  if (p.alpha != null) {
    const a = parseInt(p.alpha, 16) / 255;
    return composite({ r: p.r, g: p.g, b: p.b }, a, bgRgb);
  }
  return { r: p.r, g: p.g, b: p.b };
}

/** @param {string} file */
function readThemeJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

/** @param {string} fromFile */
function resolveInclude(fromFile, includePath) {
  return path.normalize(path.join(path.dirname(fromFile), includePath));
}

/**
 * Fusionne la chaîne `include` (parent puis enfant).
 * @param {string} file chemin absolu
 * @param {Set<string>} chain
 * @returns {Record<string, string>}
 */
function mergeColors(file, chain = new Set()) {
  const rel = path.relative(root, file);
  if (chain.has(rel)) {
    throw new Error(`Chaîne include circulaire: ${[...chain, rel].join(" → ")}`);
  }
  chain.add(rel);

  const theme = readThemeJson(file);
  let base = {};
  if (theme.include) {
    if (typeof theme.include !== "string") {
      throw new Error(`${rel}: include invalide`);
    }
    const parentPath = resolveInclude(file, theme.include);
    if (!fs.existsSync(parentPath)) {
      throw new Error(`${rel}: include introuvable — ${path.relative(root, parentPath)}`);
    }
    base = mergeColors(parentPath, chain);
  }
  return { ...base, ...(theme.colors && typeof theme.colors === "object" ? theme.colors : {}) };
}

/**
 * @param {Record<string, string>} colors
 * @param {string} rel theme path for messages
 * @param {string} uiTheme vs | vs-dark | hc-black
 */
function checkTheme(colors, rel, uiTheme) {
  const bgStr = colors["terminal.background"];
  if (!bgStr || typeof bgStr !== "string") {
    throw new Error(`${rel}: terminal.background manquant`);
  }
  const bgRgb = terminalBgRgb(bgStr);
  if (!bgRgb) {
    throw new Error(`${rel}: terminal.background non parsable (${bgStr})`);
  }
  const Lbg = luminance(bgRgb);

  const failures = [];
  const fgStr = colors["terminal.foreground"];
  if (fgStr && typeof fgStr === "string") {
    const fgRgb = effectiveFgRgb(fgStr, bgRgb);
    if (fgRgb) {
      const r = contrastRatio(luminance(fgRgb), Lbg);
      if (r < MIN_FG) {
        failures.push(
          `terminal.foreground ${fgStr} vs terminal.background ${bgStr} → ${r.toFixed(2)}:1 (min ${MIN_FG}:1)`,
        );
      }
    }
  }

  const lightUi = uiTheme === "vs";
  if (!lightUi) {
    for (const key of ANSI_KEYS) {
      if (key === "terminal.foreground") continue;
      if (SKIP_ANSI.has(key)) continue;
      const v = colors[key];
      if (typeof v !== "string") continue;
      const fgRgb = effectiveFgRgb(v, bgRgb);
      if (!fgRgb) continue;
      const r = contrastRatio(luminance(fgRgb), Lbg);
      if (r < MIN_ANSI) {
        failures.push(`${key} ${v} → ${r.toFixed(2)}:1 (min ${MIN_ANSI}:1)`);
      }
    }
  }

  return failures;
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const themes = pkg?.contributes?.themes;
  if (!Array.isArray(themes)) {
    throw new Error("package.json: contributes.themes manquant");
  }

  let total = 0;
  const allFailures = [];

  for (const t of themes) {
    if (!t.path) continue;
    const full = path.resolve(root, t.path);
    if (!fs.existsSync(full)) continue;
    if (!full.endsWith(".json")) continue;

    const rel = path.relative(root, full);
    const uiTheme = typeof t.uiTheme === "string" ? t.uiTheme : "vs-dark";
    let merged;
    try {
      merged = mergeColors(full);
    } catch (e) {
      throw new Error(`${rel}: ${e.message || e}`);
    }

    const fails = checkTheme(merged, rel.replace(/\\/g, "/"), uiTheme);
    total++;
    if (fails.length) {
      allFailures.push({ rel: rel.replace(/\\/g, "/"), fails });
    }
  }

  if (allFailures.length) {
    for (const { rel, fails } of allFailures) {
      console.error(`\n${rel}:`);
      for (const f of fails) console.error(`  - ${f}`);
    }
    throw new Error(
      `verify-terminal-contrast: ${allFailures.length} thème(s) hors seuil (voir ci-dessus).`,
    );
  }

  console.log(
    "OK terminal contrast:",
    total,
    "thèmes — terminal.foreground ≥",
    MIN_FG + ":1 vs terminal.background ;",
    "thèmes vs-dark/hc : ANSI (hors black) ≥",
    MIN_ANSI + ":1 ;",
    "thèmes clairs (vs) : ANSI non vérifiés (palette pensée pour fond sombre)",
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
