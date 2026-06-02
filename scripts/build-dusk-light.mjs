#!/usr/bin/env node
/**
 * Dusk Office Light — génération de `themes/dusk-light.json`
 *
 * Principe
 * --------
 * Le thème clair n’est pas édité à la main couleur par couleur : il est **dérivé**
 * de **Dusk Office Abyss** (`themes/dusk-abime.json`), lui-même produit par le
 * pipeline sombre (`theme:sources` → sync → `variants:ui` → `variants:syntax`).
 * Ainsi Light reste **aligné** sur la même grammaire de couleurs qu’Abyss, avec
 * des surfaces et des textes adaptés au fond clair.
 *
 * Étapes
 * ------
 * 1. Charger Abyss (JSON complet : `colors`, `tokenColors`, `semanticTokenColors`).
 * 2. Pour chaque entrée de `colors`, remapper les hex : fonds très sombres → gris /
 *    blancs cassés ; teintes « texte clair Abyss » (#cfe8f0…) → texte ardoise ;
 *    ombres noires → gris ; très faible luminance → fallback clair.
 * 3. Construire le thème : `type: "light"`, `include: "./dusk.json"` (hérite des
 *    clés non surchargées du socle Dusk), `colors` = résultat du remap.
 * 4. Syntaxe : si `themes/dusk-light.json` existe déjà avec des `tokenColors` /
 *    `semanticTokenColors` non vides, les **réutiliser** (affinages manuels ou
 *    itérations précédentes) ; sinon copier celles d’Abyss.
 * 5. Appliquer `LIGHT_UI_OVERRIDES` : contrastes UI (sidebar, tabs, titleBar,
 *    Markdown preview, etc.) qui ne sortent pas correctement du seul remap mécanique.
 * 6. Écrire `themes/dusk-light.json`.
 *
 * Quand lancer
 * ------------
 * `npm run build:light` — idéalement après `variants:ui` et `variants:syntax`
 * (voir `make:full`). Ivory (`build-dusk-ivoire.mjs`) part ensuite de ce fichier.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { luminanceFromHex } from "./color-utils.mjs";
import { normalizeLightSyntax } from "./fix-light-syntax.mjs";
import { applyLightTerminalAnsi } from "./light-terminal-ansi.mjs";
import { LIGHT_CHROME_UI, LIGHT_SETTINGS_UI, LIGHT_TAB_UI } from "./light-settings-ui.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ABYSS_PATH = path.join(root, "themes", "dusk-abime.json");
const LIGHT_OUT_PATH = path.join(root, "themes", "dusk-light.json");

/** Fonds sombres typiques d’Abyss (#RRGGBB) → surfaces claires */
const DARK_BG_TO_LIGHT_SURFACE = {
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

/**
 * Texte / icônes clairs d’Abyss (#cfe8f0 + variantes alpha) → lisibles sur blanc.
 * Clés = rgb(+aa) en minuscules, sans #.
 */
const ABYSS_LIGHT_FG_TO_SLATE = {
  cfe8f0: "#0f172a",
  cfe8f0aa: "#334155aa",
  cfe8f0cc: "#334155cc",
  cfe8f077: "#64748b77",
  cfe8f055: "#64748b55",
  cfe8f0bb: "#475569bb",
  cfe8f088: "#64748b88",
  cfe8f022: "#33415522",
  cfe8f012: "#33415512",
  d0dce4: "#0f172a",
  d0dce4aa: "#334155aa",
  d0dce4cc: "#334155cc",
  d0dce477: "#64748b77",
  d0dce455: "#64748b55",
  d0dce4bb: "#475569bb",
  d0dce488: "#64748b88",
  d0dce422: "#33415522",
  d0dce412: "#33415512",
  d1e0e8: "#0f172a",
  d1e0e8aa: "#334155aa",
  d1e0e8cc: "#334155cc",
  d1e0e877: "#64748b77",
  d1e0e855: "#64748b55",
  d1e0e8bb: "#475569bb",
  d1e0e888: "#64748b88",
  d1e0e822: "#33415522",
  d1e0e812: "#33415512",
};

function srgbLuminance(rgb6) {
  return luminanceFromHex("#" + rgb6) ?? 0;
}

/**
 * @param {string} value
 * @param {string} colorKey clé `colors` (pour règles contextuelles, ex. shadow)
 */
function remapWorkbenchColor(value, colorKey) {
  if (typeof value !== "string" || !value.startsWith("#")) return value;
  const h = value.slice(1);
  if (h.length !== 6 && h.length !== 8) return value;
  const rgb = h.slice(0, 6).toLowerCase();
  const alpha = h.length === 8 ? h.slice(6).toLowerCase() : "";
  const rgbWithAlpha = (rgb + alpha).toLowerCase();

  if (ABYSS_LIGHT_FG_TO_SLATE[rgbWithAlpha]) return ABYSS_LIGHT_FG_TO_SLATE[rgbWithAlpha];

  if (colorKey.includes("shadow") && rgb === "000000") return "#64748b" + (alpha || "44");

  const surface = DARK_BG_TO_LIGHT_SURFACE[rgb];
  if (surface) {
    const body = surface.slice(1);
    return "#" + body + (alpha || "");
  }

  if (srgbLuminance(rgb) < 0.08 && rgb !== "0a0a0a" && rgb !== "1e1e1e") {
    return "#f1f5f9" + (alpha || "");
  }

  return value;
}

/**
 * Surcharges UI / Markdown preview / titleBar après le remap global.
 * Sans cela, `include` dusk.json laisserait certains textes ou bordures illisibles.
 */
const LIGHT_UI_OVERRIDES = {
  descriptionForeground: "#334155dd",
  "icon.foreground": "#334155eb",
  "widget.border": "#4d5a6b73",
  "editor.foldPlaceholderForeground": "#64748b99",
  "editorGhostText.foreground": "#94a3b878",
  "editorWhitespace.foreground": "#94a3b838",
  // CodeLens « Run | Debug » — hérité de dusk.json (#d1e0e888) → ~1.2:1 sur fond clair
  "editorCodeLens.foreground": "#475569cc",
  // Rouge bien visible sur fond clair (soulignement diagnostics).
  "editorError.foreground": "#e11d48",
  "editorInlayHint.foreground": "#475569dd",
  // WCAG AA: slate-600 ee → ~5.7:1 sur #f8fafc (anciennement slate-500 8c → 2.09 ❌)
  "inlineChatInput.placeholderForeground": "#475569ee",
  "breadcrumb.foreground": "#475569de",
  /** Sinon hérité de dusk.json (#02060b) — bande noire sous les onglets en thème clair */
  "breadcrumb.background": "#ffffff",
  // WCAG AA: slate-600 dd → ~4.9:1 (anciennement slate-600 b8 → 3.68 ⚠️)
  "tab.inactiveForeground": "#475569dd",
  "statusBar.foreground": "#1e293bee",
  // WCAG AA: slate-600 ee → ~5.7:1 (anciennement slate-500 8c → 2.09 ❌)
  "input.placeholderForeground": "#475569ee",
  "activityBar.inactiveForeground": "#64748b",
  "tree.indentGuidesStroke": "#64748b22",
  "tree.inactiveIndentGuidesStroke": "#64748b14",
  "editor.lineHighlightBackground": "#e8edf3",
  "editor.lineHighlightBorder": "#cbd5e166",
  "editorIndentGuide.background1": "#64748b22",
  "editorIndentGuide.background2": "#64748b16",
  "editorIndentGuide.background3": "#64748b0e",
  "editorIndentGuide.background4": "#64748b08",
  "editorIndentGuide.activeBackground1": "#0ea5e930",
  "editorIndentGuide.activeBackground2": "#0284c730",
  "editorIndentGuide.activeBackground3": "#0ea5e91c",
  "editorIndentGuide.activeBackground4": "#0284c71c",
  "sideBarSectionHeader.foreground": "#334155",
  // Match secondary text style (slate-700) instead of standalone amber for visual coherence
  "sideBarTitle.foreground": "#334155",
  // WCAG AA: slate-600 dd → ~4.9:1 (anciennement slate-500 88 → 2.03 ❌, titres de panel invisibles)
  "panelTitle.inactiveForeground": "#475569dd",
  "panel.border": "#94a3b8b8",
  "panelSectionHeader.border": "#94a3b8b8",
  "panelInput.border": "#94a3b8b8",
  "panelTitle.border": "#64748baa",
  "panelTitle.activeBorder": "#0ea5e9cc",
  "terminal.border": "#94a3b8aa",
  "terminalStickyScroll.border": "#94a3b8aa",
  "terminal.tab.activeBorder": "#0369a1",
  // WCAG AA: slate-600 dd → ~4.9:1 (anciennement slate-500 55 → 1.53 ❌, numéros de ligne illisibles)
  "editorLineNumber.foreground": "#475569dd",
  // Active line number stays bright cyan to mark the cursor line
  "editorLineNumber.activeForeground": "#0369a1",
  // Hover surfaces — replace the dark-theme inherited values that produced
  // invisible (alpha 0f) or near-black (#010203aa) hovers on light backgrounds.
  // Cyan accent at 13–20% alpha gives a clearly visible but subtle highlight.
  "list.hoverBackground": "#06b6d422",
  "list.hoverForeground": "#0f172a",
  "list.focusBackground": "#06b6d433",
  "tab.hoverBackground": "#06b6d422",
  "tab.unfocusedHoverBackground": "#06b6d418",
  "menubar.selectionBackground": "#06b6d433",
  // Active activity-bar icons — dark cyan-700 instead of inherited #22d3ee
  // (which produced 1.81:1 against the white activity bar = invisible).
  "activityBar.foreground": "#0e7490",
  "activityBar.activeBorder": "#0e7490",
  "activityBar.activeBackground": "#06b6d422",
  "scrollbarSlider.background": "#94a3b88f",
  "scrollbarSlider.hoverBackground": "#64748bbb",
  focusBorder: "#0ea5e9b3",
  "sideBar.foreground": "#1e293b",
  "titleBar.activeForeground": "#0f172a",
  "titleBar.inactiveForeground": "#64748b",
  "panelTitle.border": "#0ea5e94d",
  /** Absentes d’Abyss : héritées de `include` dusk.json → fonds #02060b sur UI claire */
  "editorSuggestWidget.background": "#ffffff",
  "editorHoverWidget.background": "#ffffff",
  "editorHoverWidget.statusBarBackground": "#f1f5f9",
  "textLink.foreground": "#0284c7",
  "textLink.activeForeground": "#0369a1",
  "textBlockQuote.background": "#f1f5f9",
  "textBlockQuote.border": "#22d3ee55",
  "textCodeBlock.background": "#f8fafc",
  "textPreformat.background": "#e2e8f0",
  "textPreformat.foreground": "#1e293b",

  /** Modern VS Code 1.85+ keys — light-theme tuned. */
  // Copilot Chat (panel) — sky accent border + cyan-700 slash command badge
  "chat.requestBorder": "#0ea5e944",
  "chat.slashCommandBackground": "#06b6d422",
  "chat.slashCommandForeground": "#0369a1",
  // Diff editor — unchanged region collapsed bar
  // Action bar toggled (filter / layout buttons in active state)
  "actionBar.toggledBackground": "#06b6d433",
  // Testing UI — saturated WCAG AA colors on white
  "testing.iconFailed": "#e11d48",
  "testing.iconErrored": "#e11d48",
  "testing.iconPassed": "#16a34a",
  "testing.iconQueued": "#64748b",
  "testing.iconSkipped": "#64748b",
  "testing.iconUnset": "#94a3b8",
  "testing.runAction": "#16a34a",
  "testing.peekBorder": "#0ea5e966",
  "testing.peekHeaderBackground": "#f1f5f9ee",
  // Comments view (Comments panel)
  "commentsView.resolvedIcon": "#16a34a",
  "commentsView.unresolvedIcon": "#d97706",
  // SCM Graph — verts hérités (#6a9a78, #5a9a6a) trop pâles sur fond clair (contrastes ~2.5–3:1)
  "scmGraph.foreground5": "#355e47",
  "scmGraph.historyItemHoverAdditionsForeground": "#166534",
  // Status bar item — offline state

  /** Settings UI — dusk.json `settings.*` is dark-only; without overrides, reopening
   *  Settings with a focused enum row hides dropdown text (inherited #d1e0e8 on white). */
  ...LIGHT_SETTINGS_UI,
  /** Chat panel header menus — commandCenter / editorActionList inherit #d1e0e8 from dusk.json. */
  ...LIGHT_CHROME_UI,
  /** Tab hover text — dusk.json tab.hoverForeground is #d1e0e8 (invisible on light hover bg). */
  ...LIGHT_TAB_UI,
};

/** @param {Record<string, string>} abyssColors */
function mapAbyssColorsToLight(abyssColors) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, val] of Object.entries(abyssColors)) {
    out[key] = typeof val === "string" ? remapWorkbenchColor(val, key) : val;
  }
  return out;
}

/** @param {unknown} theme */
function applyLightUiOverrides(theme) {
  if (!theme.colors || typeof theme.colors !== "object") return;
  Object.assign(theme.colors, LIGHT_UI_OVERRIDES);

  // dusk.json (the dark base inherited via `include`) sets selection foregrounds to #d1e0e8,
  // which made selected text invisible on light surfaces. Force them to the deep-navy
  // editor.foreground so selected text stays high-contrast and readable.
  theme.colors["editor.selectionForeground"] = "#0f172a";
  theme.colors["menu.selectionForeground"] = "#0f172a";
  theme.colors["menubar.selectionForeground"] = "#0f172a";

  const ed = theme.colors["editor.background"];
  if (typeof ed === "string" && ed.startsWith("#")) {
    theme.colors["sideBar.background"] = ed;
  }

  const sem = theme.semanticTokenColors;
  if (sem && typeof sem === "object") {
    if (sem.comment && typeof sem.comment === "object") sem.comment.foreground = "#475569";
    if (typeof sem.variable === "string") sem.variable = "#1e293b";
    // Modules / espaces de noms (ex. __future__ en Python) — cyan 500 trop pâle sur #f8fafc
    if (typeof sem.namespace === "string") sem.namespace = "#0e7490";
    if (typeof sem.module === "string") sem.module = "#0e7490";
    if (typeof sem["variable.defaultLibrary"] === "string") {
      sem["variable.defaultLibrary"] = "#92400e";
    }
  }

  const tokens = theme.tokenColors;
  if (!Array.isArray(tokens)) return;
  for (const block of tokens) {
    if (!block.settings || typeof block.settings !== "object") continue;
    const scopes = block.scope;
    const sc = Array.isArray(scopes)
      ? scopes.join(" ")
      : typeof scopes === "string"
        ? scopes
        : "";
    if (typeof sc !== "string") continue;
    if (sc.includes("comment")) {
      block.settings.foreground = "#475569";
    }
    // dusk.json sets #d1e0e8 for bold/italic markdown — unreadable on light editor.bg
    if (sc.includes("markup.bold") || sc.includes("markup.italic")) {
      block.settings.foreground = "#0f172a";
    }
    // __future__, typing, etc. — amber 600 (~2.9:1 sur blanc) → amber 700 WCAG
    if (sc.includes("support.type.python") || sc.includes("support.class.python")) {
      block.settings.foreground = "#b45309";
    }
  }

  // Propriétés d'interface (`host`, `port`…) : scope TextMate souvent
  // `variable.other.readwrite` sans règle light → le motif large `variable` de dusk.json
  // (#b8d4e4) s'applique et disparaît sur fond clair. Renforcer aussi les blocs
  // `meta.interface.declaration` (#0891b2 trop faible sur #f8fafc dans les .md).
  tokens.push(
    {
      scope: ["variable", "variable.other.php"],
      settings: { foreground: "#0f172a" },
    },
    {
      scope: [
        "punctuation.definition.variable",
        "punctuation.definition.variable.php",
      ],
      settings: { foreground: "#0f172a" },
    },
    {
      scope: ["variable.other.readwrite"],
      settings: { foreground: "#0f172a" },
    },
    {
      scope: ["meta.type.declaration", "meta.interface.declaration"],
      settings: { foreground: "#0e7490" },
    },
    {
      scope: [
        "entity.name.namespace",
        "entity.name.namespace.python",
        "support.type.python",
        "support.class.python",
      ],
      settings: { foreground: "#92400e" },
    },
  );
}

/**
 * Garde la coloration syntaxique déjà curée dans dusk-light.json si présente,
 * sinon reprend Abyss (première génération).
 */
function loadSyntaxLayerFromExistingLightOrAbyss(abyssTheme) {
  try {
    const raw = fs.readFileSync(LIGHT_OUT_PATH, "utf8");
    const prev = JSON.parse(raw);
    if (Array.isArray(prev.tokenColors) && prev.tokenColors.length && prev.semanticTokenColors) {
      return {
        tokenColors: structuredClone(prev.tokenColors),
        semanticTokenColors: structuredClone(prev.semanticTokenColors),
      };
    }
  } catch {
    /* fichier absent ou invalide */
  }
  return {
    tokenColors: structuredClone(abyssTheme.tokenColors),
    semanticTokenColors: structuredClone(abyssTheme.semanticTokenColors),
  };
}

function main() {
  const abyss = JSON.parse(fs.readFileSync(ABYSS_PATH, "utf8"));
  const syntax = loadSyntaxLayerFromExistingLightOrAbyss(abyss);

  const theme = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Light",
    type: "light",
    include: "./dusk.json",
    colors: mapAbyssColorsToLight(abyss.colors || {}),
    tokenColors: syntax.tokenColors,
    semanticTokenColors: syntax.semanticTokenColors,
  };

  applyLightUiOverrides(theme);
  normalizeLightSyntax(theme);
  applyLightTerminalAnsi(theme.colors);

  fs.writeFileSync(LIGHT_OUT_PATH, JSON.stringify(theme, null, 2) + "\n", "utf8");
  console.log("OK", LIGHT_OUT_PATH, Object.keys(theme.colors).length, "couleurs");
}

main();
