#!/usr/bin/env node
/**
 * Régénère themes/dusk.json à partir de `theme-sources/dusk.json` + `.vscode/settings.json`
 * (surcharges workbench / token / sémantique). Sans base, le fichier serait réduit aux seules
 * customisations et la validation du pipeline échouerait.
 *
 * Cherche la racine dans cet ordre :
 *   1) Monorepo Nythy : …/Nythy/.vscode/settings.json (3 niveaux au-dessus de scripts/)
 *   2) Repo autonome Dusk Office : …/Dusk-Office/.vscode/settings.json (1 niveau au-dessus de scripts/)
 *
 * Ajuste les foreground (TextMate + sémantique) pour viser un ratio de contraste WCAG 2.1
 * par rapport à `editor.background` (défaut #010203 si absent des customisations).
 * Seuil : variable d'environnement SYNC_MIN_CONTRAST (défaut 4.5 = AA corps de texte).
 *
 * Usage :
 *   node scripts/sync-from-workspace.mjs
 *   set SYNC_MIN_CONTRAST=7 && node scripts/sync-from-workspace.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseHexColor as parseColor, luminance, contrastRatio, composite } from "./color-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_EDITOR_BG = "#010203";

/** Valeurs par défaut si absentes du workspace (prévisualisation Markdown, hovers). */
const MARKDOWN_PREVIEW_DEFAULTS = {
  "textLink.foreground": "#00e5ff",
  "textLink.activeForeground": "#00bcd4",
  "textBlockQuote.background": "#d1e0e808",
  "textBlockQuote.border": "#00bcd444",
  "textCodeBlock.background": "#010203dd",
  "textPreformat.background": "#1a283855",
  "textPreformat.foreground": "#d1e0e8",
};
const MIN_CONTRAST = (() => {
  const n = Number(process.env.SYNC_MIN_CONTRAST);
  return Number.isFinite(n) && n >= 1 && n <= 21 ? n : 4.5;
})();

const standaloneRoot = path.resolve(__dirname, "..");
const monorepoRoot = path.resolve(__dirname, "..", "..", "..");
const nythyLayout = fs.existsSync(
  path.join(monorepoRoot, "extensions", "dusk-theme", "package.json"),
);

let repoRoot;
if (
  nythyLayout &&
  fs.existsSync(path.join(monorepoRoot, ".vscode", "settings.json"))
) {
  repoRoot = monorepoRoot;
} else if (
  fs.existsSync(path.join(standaloneRoot, ".vscode", "settings.json"))
) {
  repoRoot = standaloneRoot;
} else {
  console.warn(
    "Pas de .vscode/settings.json — sync ignoree (themes/dusk.json inchange).",
  );
  process.exit(0);
}

const settingsPath = path.join(repoRoot, ".vscode", "settings.json");
const themePath = path.join(__dirname, "..", "themes", "dusk.json");
const baseThemePath = path.join(standaloneRoot, "theme-sources", "dusk.json");

if (!fs.existsSync(baseThemePath)) {
  console.error(
    `sync-from-workspace: fichier base introuvable — ${baseThemePath}`,
  );
  process.exit(1);
}

const baseTheme = JSON.parse(fs.readFileSync(baseThemePath, "utf8"));
if (!baseTheme || typeof baseTheme.colors !== "object") {
  console.error(`sync-from-workspace: ${baseThemePath} — colors invalides.`);
  process.exit(1);
}

/**
 * Strips JSONC content (line `//` and block `/* *\/` comments + trailing commas) without
 * touching characters inside string literals. The previous regex `\/\/[^\n]*` corrupted
 * any URL embedded in a setting value (e.g. `"https://..."`).
 *
 * @param {string} input
 * @returns {string}
 */
function stripJsonc(input) {
  let out = "";
  let i = 0;
  const n = input.length;
  let inString = false;
  let stringQuote = "";
  let escape = false;

  while (i < n) {
    const ch = input[i];
    const next = i + 1 < n ? input[i + 1] : "";

    if (inString) {
      out += ch;
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === stringQuote) {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      out += ch;
      i++;
      continue;
    }

    if (ch === "/" && next === "/") {
      while (i < n && input[i] !== "\n") i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(input[i] === "*" && input[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  return out.replace(/,(\s*[\]}])/g, "$1");
}

const raw = fs.readFileSync(settingsPath, "utf8");
const s = stripJsonc(raw);
let j;
try {
  j = JSON.parse(s);
} catch (e) {
  console.error(
    `sync-from-workspace: JSON invalide dans ${settingsPath} — ${e.message}`,
  );
  process.exit(1);
}

const colors = {
  ...baseTheme.colors,
  ...MARKDOWN_PREVIEW_DEFAULTS,
  ...(j["workbench.colorCustomizations"] &&
  typeof j["workbench.colorCustomizations"] === "object"
    ? j["workbench.colorCustomizations"]
    : {}),
};
delete colors["outline.icons"];

const editorBackground =
  typeof colors["editor.background"] === "string"
    ? colors["editor.background"]
    : DEFAULT_EDITOR_BG;

/* luminance, contrastRatio, parseColor, composite — imported from color-utils.mjs (top of file) */

/** @param {{ r: number; g: number; b: number }} rgb */
function rgbToHex(rgb) {
  const x = (n) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${x(rgb.r)}${x(rgb.g)}${x(rgb.b)}`.toLowerCase();
}

/**
 * Mélange rgb vers blanc ou noir jusqu'au ratio minimal (plus petit déplacement possible).
 * @param {{ r: number; g: number; b: number }} rgb couleur effective (opaque ou déjà compositée)
 * @param {number} Lbg luminance du fond
 */
function nudgeForContrast(rgb, Lbg, minRatio) {
  const Lfg = luminance(rgb);
  if (contrastRatio(Lfg, Lbg) >= minRatio) return rgb;
  const lighter = Lfg > Lbg;
  const target = lighter ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const mix = (t) => ({
    r: Math.round(rgb.r + (target.r - rgb.r) * t),
    g: Math.round(rgb.g + (target.g - rgb.g) * t),
    b: Math.round(rgb.b + (target.b - rgb.b) * t),
  });
  if (contrastRatio(luminance(mix(1)), Lbg) < minRatio) return mix(1);

  let lo = 0;
  let hi = 1;
  let best = mix(1);
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const c = mix(mid);
    if (contrastRatio(luminance(c), Lbg) >= minRatio) {
      best = c;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

/**
 * @param {string} fgStr couleur utilisateur (#rgb, #rrggbb, #rrggbbaa)
 * @param {string} bgStr fond éditeur
 */
function ensureForegroundContrast(fgStr, bgStr) {
  const bg = parseColor(bgStr);
  if (!bg) return { value: fgStr, changed: false };

  const fgParsed = parseColor(fgStr);
  if (!fgParsed) return { value: fgStr, changed: false };

  let rgb;
  if (fgParsed.alpha != null) {
    const a = parseInt(fgParsed.alpha, 16) / 255;
    rgb = composite(
      { r: fgParsed.r, g: fgParsed.g, b: fgParsed.b },
      a,
      { r: bg.r, g: bg.g, b: bg.b },
    );
  } else {
    rgb = { r: fgParsed.r, g: fgParsed.g, b: fgParsed.b };
  }

  const Lbg = luminance({ r: bg.r, g: bg.g, b: bg.b });
  const next = nudgeForContrast(rgb, Lbg, MIN_CONTRAST);
  if (next.r === rgb.r && next.g === rgb.g && next.b === rgb.b)
    return { value: fgStr, changed: false };
  return { value: rgbToHex(next), changed: true };
}

const wsTextMate = j["editor.tokenColorCustomizations"]?.textMateRules;
const tokenColors = structuredClone(
  Array.isArray(wsTextMate) && wsTextMate.length > 0
    ? wsTextMate
    : baseTheme.tokenColors ?? [],
);

const semRules =
  j["editor.semanticTokenColorCustomizations"]?.rules ?? {};
const semanticTokenColors = structuredClone(baseTheme.semanticTokenColors ?? {});

let contrastAdjustCount = 0;

for (const [k, v] of Object.entries(semRules)) {
  if (typeof v === "string") {
    const { value, changed } = ensureForegroundContrast(v, editorBackground);
    if (changed) contrastAdjustCount++;
    semanticTokenColors[k] = value;
    continue;
  }
  const o = {};
  if (v.foreground) {
    const { value, changed } = ensureForegroundContrast(
      v.foreground,
      editorBackground,
    );
    if (changed) contrastAdjustCount++;
    o.foreground = value;
  }
  if (v.bold === true) o.bold = true;
  if (v.italic === true) o.italic = true;
  if (v.strikethrough === true) o.strikethrough = true;
  if (v.underline === true) o.underline = true;
  semanticTokenColors[k] =
    Object.keys(o).length === 1 && o.foreground ? o.foreground : o;
}

for (const rule of tokenColors) {
  const fg = rule?.settings?.foreground;
  if (typeof fg !== "string") continue;
  const { value, changed } = ensureForegroundContrast(fg, editorBackground);
  if (changed) contrastAdjustCount++;
  rule.settings.foreground = value;
}

const theme = {
  $schema: baseTheme.$schema ?? "vscode://schemas/color-theme",
  name: baseTheme.name ?? "Dusk Office",
  type: baseTheme.type ?? "dark",
  semanticHighlighting:
    baseTheme.semanticHighlighting !== undefined
      ? baseTheme.semanticHighlighting
      : true,
  colors,
  tokenColors,
  semanticTokenColors,
};

fs.writeFileSync(themePath, JSON.stringify(theme, null, 2) + "\n", "utf8");
const rel = path.relative(repoRoot, themePath);
console.log(
  "OK →",
  rel,
  `(racine: ${repoRoot}) | fond ${editorBackground} | contraste ≥ ${MIN_CONTRAST}:1 — ${contrastAdjustCount} foreground ajuste(s)`,
);
