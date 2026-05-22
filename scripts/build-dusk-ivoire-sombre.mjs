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

/** Aligné sur `merge-extended-ui-colors.mjs` : fond terminal = panel légèrement tiré vers l’éditeur. */
const TERMINAL_BLEND_TOWARD_EDITOR = 0.26;

/** Mélange sRGB de deux #RRGGBB (t=0 → a, t=1 → b). */
function mixHexRgb(a, b, t) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length < 7 ||
    b.length < 7 ||
    t <= 0
  )
    return a;
  if (t >= 1) return b.slice(0, 7);
  const ra = parseInt(a.slice(1, 3), 16);
  const ga = parseInt(a.slice(3, 5), 16);
  const ba = parseInt(a.slice(5, 7), 16);
  const rb = parseInt(b.slice(1, 3), 16);
  const gb = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const h = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  const r = Math.round(ra * (1 - t) + rb * t);
  const g = Math.round(ga * (1 - t) + gb * t);
  const bl = Math.round(ba * (1 - t) + bb * t);
  return `#${h(r)}${h(g)}${h(bl)}`;
}

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
  /** Dusk cyan / blue UI — remap to copper / cream (Dark Ivory) */
  "010203": "100d0c",
  "02060b": "100d0c",
  "020c14": "100d0c",
  "06b6d4": "a89888",
  "22d3ee": "c9b8a4",
  "38bdf8": "c98962",
  "304f60": "6b5e54",
  "23465d": "887b6c",
  "4b6c7a": "887b6c",
  "5a8fb0": "b87650",
  "5a9aaa": "c98962",
  "6a9ab8": "c98962",
  "7ab0c8": "c9b8a4",
  "7ab8c8": "c9b8a4",
  "8ab5c8": "c9b8a4",
  "9ccae0": "a89888",
  d1e0e8: "eee2d4",
  d0dce4: "eee2d4",
  cfe8f0: "eae0d2",
  /** Cool GitHub-style neutrals → warm cream */
  e6edf3: "eee2d4",
  f0f3f6: "f0e6d8",
  c9d1d9: "eae0d2",
  b1bac4: "c9b8a4",
  adb5bd: "ae9e8e",
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

function mapTokenColors(tokenColors) {
  if (!Array.isArray(tokenColors)) return tokenColors;
  return tokenColors.map((rule) => {
    const next = { ...rule };
    if (next.settings && typeof next.settings === "object") {
      next.settings = { ...next.settings };
      if (typeof next.settings.foreground === "string") {
        next.settings.foreground = mapColor(next.settings.foreground);
      }
      if (typeof next.settings.background === "string") {
        next.settings.background = mapColor(next.settings.background);
      }
    }
    return next;
  });
}

function mapSemanticTokenColors(semanticTokenColors) {
  if (!semanticTokenColors || typeof semanticTokenColors !== "object") {
    return semanticTokenColors;
  }
  const out = {};
  for (const [key, value] of Object.entries(semanticTokenColors)) {
    if (typeof value === "string") {
      out[key] = mapColor(value);
    } else if (value && typeof value === "object") {
      const mapped = { ...value };
      if (typeof mapped.foreground === "string") {
        mapped.foreground = mapColor(mapped.foreground);
      }
      if (typeof mapped.background === "string") {
        mapped.background = mapColor(mapped.background);
      }
      out[key] = mapped;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function main() {
  const src = JSON.parse(fs.readFileSync(path.join(root, "themes/dusk-cendre.json"), "utf8"));
  const colors = {};
  for (const [k, v] of Object.entries(src.colors || {})) {
    colors[k] = typeof v === "string" ? mapColor(v) : v;
  }

  /** Surfaces éditeur entre panel et title bar (cohérence chrome, voir verify-theme-pipeline). */
  const deep = {
    "editor.background": "#29241d",
    "editorGutter.background": "#26221a",
  };
  Object.assign(colors, deep);
  colors["editorCursor.background"] = colors["editor.background"];
  colors["sideBar.background"] = colors["editor.background"];

  /** Guides / segments: très discrets sur fond ivoire sombre */
  const softerSegments = {
    "editor.lineHighlightBackground": "#c9b8a406",
    "editor.lineHighlightBorder": "#c9b8a40c",
    "editorIndentGuide.activeBackground1": "#eee2d430",
    "editorIndentGuide.activeBackground2": "#c9b8a430",
    "editorIndentGuide.activeBackground3": "#eee2d41c",
    "editorIndentGuide.activeBackground4": "#c9b8a41c",
    "editorIndentGuide.background1": "#a8988824",
    "editorIndentGuide.background2": "#a8988816",
    "editorIndentGuide.background3": "#a898880e",
    "editorIndentGuide.background4": "#a8988808",
    "tree.indentGuidesStroke": "#887b6c16",
    "tree.inactiveIndentGuidesStroke": "#887b6c0a",
  };
  Object.assign(colors, softerSegments);

  /** Éditeur : remplace les accents cyan Dusk hérités de Cendre / dusk.json */
  const warmEditorUi = {
    "editor.selectionBackground": "#a8988844",
    "editor.selectionForeground": "#eee2d4",
    "editor.inactiveSelectionBackground": "#a8988822",
    "editor.selectionHighlightBackground": "#c9b8a422",
    "editor.selectionHighlightBorder": "#c9b8a42a",
    "editor.hoverHighlightBackground": "#c9b8a418",
    "editor.rangeHighlightBackground": "#a8988818",
    "editor.rangeHighlightBorder": "#a8988822",
    "editor.wordHighlightBackground": "#a8988818",
    "editor.wordHighlightBorder": "#a898882a",
    "editor.findMatchForeground": "#eee2d4",
    "editor.findMatchHighlightBackground": "#c9896233",
    "editor.findMatchHighlightBorder": "#c9896244",
    "editor.findMatchHighlightForeground": "#eee2d4cc",
    "editor.findRangeHighlightBackground": "#6b5e5455",
    "editor.findRangeHighlightBorder": "#6b5e5444",
    "editorGhostText.border": "#a8988822",
    "editorGhostText.foreground": "#eee2d444",
    "editorGutter.commentGlyphForeground": "#c9b8a4",
    "editorGutter.commentRangeForeground": "#a8988866",
    "editorGutter.foldingControlForeground": "#887b6c",
    "editorInlayHint.background": "#6b5e5466",
    "editorInlayHint.foreground": "#eee2d499",
    "editorInlayHint.typeBackground": "#c9896222",
    "editorInlayHint.typeForeground": "#c98962cc",
    "editorWhitespace.foreground": "#eee2d418",
    "merge.border": "#6b5e5455",
    "merge.commonContentBackground": "#eee2d412",
    "merge.commonHeaderBackground": "#eee2d422",
    "merge.currentContentBackground": "#c9896218",
    "merge.currentHeaderBackground": "#c9896233",
    "editorGroup.emptyBackground": deep["editor.background"],
  };
  Object.assign(colors, warmEditorUi);

  const panelBg = colors["panel.background"];
  const editorBg = colors["editor.background"];
  if (typeof editorBg === "string" && editorBg.length >= 7) {
    /** Aligné sur l’éditeur (comme Cendre : minimap = fond principal), pas #22262d froid non remappé. */
    colors["minimap.background"] = editorBg.slice(0, 7);
  }
  if (
    typeof panelBg === "string" &&
    typeof editorBg === "string" &&
    panelBg.length >= 7 &&
    editorBg.length >= 7
  ) {
    const terminalBg = mixHexRgb(
      panelBg.slice(0, 7),
      editorBg.slice(0, 7),
      TERMINAL_BLEND_TOWARD_EDITOR,
    );
    colors["terminal.background"] = terminalBg;
    colors["terminalStickyScroll.background"] = terminalBg;
  }

  const sorted = {};
  for (const k of Object.keys(colors).sort()) sorted[k] = colors[k];

  const out = {
    $schema: "vscode://schemas/color-theme",
    name: "Dusk Office Dark Ivory",
    include: "./dusk.json",
    colors: sorted,
    tokenColors: mapTokenColors(src.tokenColors),
    semanticTokenColors: mapSemanticTokenColors(src.semanticTokenColors),
  };

  const dest = path.join(root, "themes/dusk-ivoire-sombre.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("OK", dest, Object.keys(sorted).length, "colors");
}

main();
