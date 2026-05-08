#!/usr/bin/env node
/**
 * Vérifications pipeline thèmes Dusk Office — listes, clés alignées, cohérence pro des surfaces.
 *
 * - Palettes / syntaxe / fichiers attendus
 * - Même ensemble de clés `colors` pour les 11 variantes `merge-extended-ui`
 * - Luminance : `editor.background` dans l’enveloppe [panel, widget] (palette ou chrome effectif)
 *
 * Exclut `hc-black` : éditeur noir imposé, règle non applicable.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PALETTE_VARIANT_IDS, SYNTAX_MERGE_SLUGS } from "./theme-wins.mjs";
import { palettes } from "./syntax-variant-palettes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const themesDir = path.join(root, "themes");
const palettesPath = path.join(root, "scripts", "palettes-extended-ui.json");
const pkgPath = path.join(root, "package.json");

const TOL = 0.002;
const UNIFIED_TOL = TOL * 3;

/** Luminance relative sRGB (WCAG), hex #RRGGBB uniquement. */
function relLuminance(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** @param {string} hex */
function rgb6(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return null;
  const h = hex.length >= 7 ? hex.slice(0, 7) : null;
  if (!h || !/^#[0-9a-fA-F]{6}$/.test(h)) return null;
  return h;
}

/**
 * Couleurs effectives (chaîne `include`, dernier niveau gagne).
 * @param {string} file absolu
 * @param {Set<string>} chain
 */
function getEffectiveColors(file, chain = new Set()) {
  const rel = path.relative(root, file);
  if (chain.has(rel)) {
    throw new Error(`Chaîne include circulaire : ${[...chain, rel].join(" → ")}`);
  }
  chain.add(rel);
  const theme = JSON.parse(fs.readFileSync(file, "utf8"));
  let base = {};
  if (theme.include && typeof theme.include === "string") {
    const inc = path.normalize(path.join(path.dirname(file), theme.include));
    if (!fs.existsSync(inc)) {
      throw new Error(`Include introuvable : ${path.relative(root, inc)}`);
    }
    base = getEffectiveColors(inc, chain);
  }
  return { ...base, ...(theme.colors ?? {}) };
}

/**
 * @param {string} context ex. dusk-abime ou « Dusk Office Light »
 * @param {string} panelHex
 * @param {string} widgetHex
 * @param {string} editorHex
 */
function assertEditorBetweenChrome(context, panelHex, widgetHex, editorHex) {
  const Lp = relLuminance(rgb6(panelHex) ?? "");
  const Lw = relLuminance(rgb6(widgetHex) ?? "");
  const Le = relLuminance(rgb6(editorHex) ?? "");
  if (Lp == null || Lw == null || Le == null) {
    throw new Error(
      `${context} : cohérence chrome — panel.background, titleBar.activeBackground et editor.background requis en #RRGGBB.`,
    );
  }
  const lo = Math.min(Lp, Lw);
  const hi = Math.max(Lp, Lw);
  if (hi - lo < 1e-5) {
    if (Math.abs(Le - lo) > UNIFIED_TOL) {
      throw new Error(
        `${context} : panel et title bar ont la même luminance — editor.background doit s’aligner (|ΔL| ≤ ${UNIFIED_TOL}). ` +
          `L(chrome)=${lo.toFixed(4)} L(éditeur)=${Le.toFixed(4)}`,
      );
    }
  } else if (Le < lo - TOL || Le > hi + TOL) {
    throw new Error(
      `${context} : editor.background doit rester entre panel et title bar (surface pro, pas de « dalle » déconnectée). ` +
        `L(panel)=${Lp.toFixed(4)} L(widget)=${Lw.toFixed(4)} L(éditeur)=${Le.toFixed(4)}`,
    );
  }
}

function main() {
  const pe = JSON.parse(fs.readFileSync(palettesPath, "utf8"));
  const missPalette = PALETTE_VARIANT_IDS.filter((id) => !(id in pe));
  if (missPalette.length) {
    throw new Error(
      `palettes-extended-ui.json manque des entrées pour PALETTE_VARIANT_IDS: ${missPalette.join(", ")}`,
    );
  }

  const missSyntax = SYNTAX_MERGE_SLUGS.filter((s) => !(s in palettes));
  if (missSyntax.length) {
    throw new Error(
      `syntax-variant-palettes.mjs manque des palettes pour SYNTAX_MERGE_SLUGS: ${missSyntax.join(", ")}`,
    );
  }

  for (const slug of SYNTAX_MERGE_SLUGS) {
    const f = path.join(themesDir, `dusk-${slug}.json`);
    if (!fs.existsSync(f)) {
      throw new Error(`Thème attendu par merge-syntax: ${path.relative(root, f)}`);
    }
  }

  for (const id of PALETTE_VARIANT_IDS) {
    const f = path.join(themesDir, `${id}.json`);
    if (!fs.existsSync(f)) {
      throw new Error(`Thème attendu par merge-extended-ui: ${path.relative(root, f)}`);
    }
  }

  /** Après merge-extended-ui, toutes les variantes palette doivent partager le même ensemble de clés `colors`. */
  const union = new Set();
  /** @type {Map<string, Set<string>>} */
  const byId = new Map();
  for (const id of PALETTE_VARIANT_IDS) {
    const theme = JSON.parse(
      fs.readFileSync(path.join(themesDir, `${id}.json`), "utf8"),
    );
    const keys = new Set(Object.keys(theme.colors || {}));
    byId.set(id, keys);
    for (const k of keys) union.add(k);
  }
  for (const id of PALETTE_VARIANT_IDS) {
    const keys = byId.get(id);
    const missing = [...union].filter((k) => !keys.has(k)).sort();
    if (missing.length) {
      throw new Error(
        `Variantes palette: ${id}.json manque des clés colors présentes ailleurs: ${missing.join(", ")}`,
      );
    }
  }

  const extraPaletteKeys = Object.keys(pe).filter((k) => !PALETTE_VARIANT_IDS.includes(k));
  if (extraPaletteKeys.length) {
    console.warn(
      "WARN palettes-extended-ui.json a des clés non utilisées par merge-extended:",
      extraPaletteKeys.join(", "),
    );
  }

  for (const id of PALETTE_VARIANT_IDS) {
    const palette = pe[id];
    const theme = JSON.parse(
      fs.readFileSync(path.join(themesDir, `${id}.json`), "utf8"),
    );
    const ed = theme.colors?.["editor.background"];
    assertEditorBetweenChrome(id, palette.panel, palette.widget, typeof ed === "string" ? ed : "");
  }

  /** Tous les thèmes Marketplace : même rôle panel / title bar que le merge (hors HC). */
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const contributed = pkg?.contributes?.themes;
  if (!Array.isArray(contributed)) {
    throw new Error("package.json : contributes.themes attendu (tableau).");
  }

  for (const t of contributed) {
    if (!t?.path) continue;
    if (t.uiTheme === "hc-black") continue;

    const full = path.resolve(root, t.path);
    const base = path.basename(full);
    if (PALETTE_VARIANT_IDS.includes(base.replace(/\.json$/, ""))) continue;

    const colors = getEffectiveColors(full);
    const panel = colors["panel.background"] ?? colors["sideBar.background"];
    const widget = colors["titleBar.activeBackground"] ?? colors["activityBar.background"];
    const ed = colors["editor.background"];
    assertEditorBetweenChrome(
      t.label ? `${t.label} (${path.relative(root, full)})` : path.relative(root, full),
      typeof panel === "string" ? panel : "",
      typeof widget === "string" ? widget : "",
      typeof ed === "string" ? ed : "",
    );
  }

  console.log(
    "OK pipeline:",
    PALETTE_VARIANT_IDS.length,
    "variantes palette,",
    SYNTAX_MERGE_SLUGS.length,
    "slugs syntaxe,",
    "cohérence chrome : tous les thèmes Marketplace (hors HC)",
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
