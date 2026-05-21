#!/usr/bin/env node
/**
 * Check distinctiveness between all Dusk Office themes.
 * Flags theme pairs that are too similar in color identity.
 *
 * Metrics compared:
 *   - Surface fingerprint (editor bg, sidebar, panel, activityBar)
 *   - Accent fingerprint (class, keyword, string, comment, number, type)
 *   - Overall weighted distance
 *
 * Usage:
 *   node scripts/check-theme-distinctiveness.mjs
 *   node scripts/check-theme-distinctiveness.mjs --verbose
 *   node scripts/check-theme-distinctiveness.mjs --threshold 25
 *   node scripts/check-theme-distinctiveness.mjs --threshold=25
 *
 * Threshold guide (empirical, Dusk Office-specific):
 *   - < 30  : too similar, should usually be differentiated
 *   - 30-45 : close, worth a manual review
 *   - > 45  : usually distinct enough at a glance
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const VERBOSE = process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");
const DEFAULT_THRESHOLD = 30;
const WARNING_BAND = 15;
const THRESHOLD_EQ_ARG = process.argv.find(a => a.startsWith("--threshold="));
const THRESHOLD_INDEX = process.argv.findIndex(a => a === "--threshold");
const THRESHOLD_RAW = THRESHOLD_EQ_ARG
  ? THRESHOLD_EQ_ARG.split("=")[1]
  : (THRESHOLD_INDEX >= 0 ? process.argv[THRESHOLD_INDEX + 1] : undefined);
const THRESHOLD = THRESHOLD_RAW !== undefined ? parseFloat(THRESHOLD_RAW) : DEFAULT_THRESHOLD;

if (!Number.isFinite(THRESHOLD)) {
  console.error("check-theme-distinctiveness: invalid --threshold value %s", THRESHOLD_RAW);
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "themes");
const files = readdirSync(dir).filter(f => f.endsWith(".json") && f !== "dusk-hc.json").sort();

/** Build pipeline derivatives — allowed to sit closer than the global threshold. */
const STRICT_EXEMPT_PAIRS = new Set([
  pairKey("Dusk Office Light", "Dusk Office Ivory"),
  pairKey("Dusk Office Ash", "Dusk Office Dark Ivory"),
]);

function pairKey(a, b) {
  return [a, b].sort().join(" ↔ ");
}

function isStrictExempt(a, b) {
  return STRICT_EXEMPT_PAIRS.has(pairKey(a, b));
}

// --- Color utilities ---
const h2r = h => {
  h = h.replace("#", "");
  if (h.length > 6) h = h.slice(0, 6);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const S = h => (h && h.length > 7 ? h.slice(0, 7) : h) || "#000000";
const isHexColor = value => typeof value === "string" && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value);
const normalizeColor = value => (isHexColor(value) ? S(value) : null);
const tokenForeground = value => {
  if (typeof value === "string") return normalizeColor(value);
  if (value && typeof value === "object") return normalizeColor(value.foreground);
  return null;
};
const perceivedLightness = color => {
  const [r, g, b] = h2r(S(color));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Weighted RGB distance (perceptual weighting)
const colorDist = (a, b) => {
  const [r1, g1, b1] = h2r(S(a));
  const [r2, g2, b2] = h2r(S(b));
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  const rTerm = (2 + rMean / 256) * dr * dr;
  const gTerm = 4 * dg * dg;
  const bTerm = (2 + (255 - rMean) / 256) * db * db;
  return Math.sqrt(rTerm + gTerm + bTerm);
};

// --- Extract theme fingerprint ---
const extractFingerprint = (j) => {
  const c = j.colors || {};
  const s = j.semanticTokenColors || {};

  // Surface colors (identity of the chrome)
  const surfaces = {
    editorBg: normalizeColor(c["editor.background"]),
    sideBarBg: normalizeColor(c["sideBar.background"]),
    panelBg: normalizeColor(c["panel.background"]),
    activityBg: normalizeColor(c["activityBar.background"]),
    titleBg: normalizeColor(c["titleBar.activeBackground"]),
    tabBg: normalizeColor(c["tab.activeBackground"]),
    terminalBg: normalizeColor(c["terminal.background"]),
  };

  // Accent colors (identity of the syntax)
  const accents = {
    classFg: tokenForeground(s.class),
    keywordFg: tokenForeground(s.keyword),
    stringFg: tokenForeground(s.string),
    commentFg: tokenForeground(s.comment),
    numberFg: tokenForeground(s.number),
    typeFg: tokenForeground(s.type),
    funcFg: tokenForeground(s.function),
    variableFg: tokenForeground(s.variable),
  };

  return { surfaces, accents };
};

// --- Compute distance between two fingerprints ---
const averageDistance = (a, b) => {
  const keys = Object.keys(a);
  let total = 0, count = 0;
  for (const k of keys) {
    if (a[k] && b[k]) {
      total += colorDist(a[k], b[k]);
      count++;
    }
  }
  return {
    distance: count > 0 ? total / count : 0,
    samples: count,
    totalKeys: keys.length,
  };
};

const surfaceDistance = (a, b) => averageDistance(a, b);
const accentDistance = (a, b) => averageDistance(a, b);
const inferThemeType = (theme) => {
  if (theme.type) return theme.type;
  return perceivedLightness(theme.colors?.["editor.background"] || "#000000") >= 0.55 ? "light" : "dark";
};

// --- Load all themes ---
const themes = [];
for (const f of files) {
  const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const fp = extractFingerprint(j);
  themes.push({
    name: j.name || f.replace(".json", ""),
    file: f,
    type: inferThemeType(j),
    fp,
  });
}

// --- Compute pairwise distances ---
const pairs = [];
for (let i = 0; i < themes.length; i++) {
  for (let j = i + 1; j < themes.length; j++) {
    const a = themes[i], b = themes[j];
    const sDist = surfaceDistance(a.fp.surfaces, b.fp.surfaces);
    const aDist = accentDistance(a.fp.accents, b.fp.accents);
    // Weighted: accents matter more for perceived identity (60/40)
    const overall = aDist.distance * 0.6 + sDist.distance * 0.4;
    pairs.push({
      a: a.name, aType: a.type, aFile: a.file,
      b: b.name, bType: b.type, bFile: b.file,
      surface: Math.round(sDist.distance * 10) / 10,
      accent: Math.round(aDist.distance * 10) / 10,
      surfaceSamples: `${sDist.samples}/${sDist.totalKeys}`,
      accentSamples: `${aDist.samples}/${aDist.totalKeys}`,
      overall: Math.round(overall * 10) / 10,
    });
  }
}

// --- Sort by overall similarity (lowest distance = most similar) ---
pairs.sort((a, b) => a.overall - b.overall);

// --- Report ---
console.log(`THEME DISTINCTIVENESS CHECK — ${themes.length} themes, ${pairs.length} pairs`);
console.log(`Threshold: overall distance < ${THRESHOLD} = too similar (${THRESHOLD}-${THRESHOLD + WARNING_BAND} = review band)\n`);

const problems = pairs.filter(p => p.overall < THRESHOLD && !isStrictExempt(p.a, p.b));
const warnings = pairs.filter(p => p.overall >= THRESHOLD && p.overall < THRESHOLD + WARNING_BAND);
const exemptProblems = pairs.filter(p => p.overall < THRESHOLD && isStrictExempt(p.a, p.b));

if (exemptProblems.length > 0 && VERBOSE) {
  console.log("ℹ️  EXEMPT (pipeline derivatives, ignored under --strict):\n");
  for (const p of exemptProblems) {
    console.log(`  ${p.a} ↔ ${p.b} — overall: ${p.overall}`);
  }
  console.log();
}

if (problems.length > 0) {
  console.log("❌ TOO SIMILAR (need differentiation):\n");
  for (const p of problems) {
    const sameType = p.aType === p.bType ? "⚡ same type" : "✓ different type";
    console.log(`  ${p.a} ↔ ${p.b}`);
    console.log(`    overall: ${p.overall} | surface: ${p.surface} | accent: ${p.accent} | ${sameType}`);
    if (VERBOSE) {
      console.log(`    files: ${p.aFile} ↔ ${p.bFile}`);
      console.log(`    coverage: surfaces ${p.surfaceSamples}, accents ${p.accentSamples}`);
    }
    console.log();
  }
}

if (warnings.length > 0) {
  console.log("⚠️  CLOSE (worth reviewing):\n");
  for (const p of warnings.slice(0, 10)) {
    console.log(`  ${p.a} ↔ ${p.b} — overall: ${p.overall} | surface: ${p.surface} | accent: ${p.accent}`);
    if (VERBOSE) console.log(`    coverage: surfaces ${p.surfaceSamples}, accents ${p.accentSamples}`);
  }
  if (warnings.length > 10) console.log(`  ... and ${warnings.length - 10} more`);
  console.log();
}

if (problems.length === 0) {
  console.log("✅ ALL THEMES SUFFICIENTLY DISTINCT\n");
}

// --- Most unique and most clustered ---
console.log("--- Theme identity profile ---\n");

const themeAvgDist = themes.map(t => {
  const dists = pairs
    .filter(p => p.a === t.name || p.b === t.name)
    .map(p => p.overall);
  const avg = dists.length > 0 ? dists.reduce((s, v) => s + v, 0) / dists.length : 0;
  const min = dists.length > 0 ? Math.min(...dists) : 0;
  return { name: t.name, type: t.type, avg: Math.round(avg * 10) / 10, min: Math.round(min * 10) / 10 };
});

themeAvgDist.sort((a, b) => b.avg - a.avg);

console.log("Most unique (highest avg distance from others):");
for (const t of themeAvgDist.slice(0, 5)) {
  console.log(`  ${t.name} [${t.type}] — avg: ${t.avg}, closest: ${t.min}`);
}

console.log("\nMost clustered (lowest avg distance from others):");
for (const t of themeAvgDist.slice(-5)) {
  console.log(`  ${t.name} [${t.type}] — avg: ${t.avg}, closest: ${t.min}`);
}

// --- Summary ---
console.log(`\nSUMMARY: ${problems.length} too-similar pairs, ${warnings.length} close pairs, ${pairs.length} total pairs`);

if (STRICT && problems.length > 0) {
  console.error(
    `\ncheck-theme-distinctiveness: ${problems.length} pair(s) below threshold ${THRESHOLD} (--strict).`,
  );
  process.exit(1);
}
