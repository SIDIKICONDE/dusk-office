#!/usr/bin/env node
/**
 * Validates theme JSON and include chain / package.json consistency.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const themesDir = path.join(root, "themes");
const pkgPath = path.join(root, "package.json");

const REQUIRED_COLOR_KEYS = [
  "editor.background",
  "editor.foreground",
  "focusBorder",
  "activityBar.background",
  "sideBar.background",
  "statusBar.background",
  "titleBar.activeBackground",
  "list.activeSelectionBackground",
  "list.activeSelectionForeground",
  "editor.selectionBackground",
  "editorCursor.foreground",
  "editorLineNumber.activeForeground",
  "editorSuggestWidget.border",
  "editorHoverWidget.border",
  "terminal.background",
  "terminal.foreground",
  "diffEditor.border",
  "notebook.cellBorderColor",
];

const REQUIRED_TOKEN_SCOPES = [
  "comment",
  "keyword",
  "string",
  "constant.numeric",
  "entity.name.function",
  "entity.name.type",
];

const REQUIRED_SEMANTIC_KEYS = [
  "variable",
  "function",
  "keyword",
  "string",
  "number",
  "type",
];

/** @param {string} file */
function readThemeJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${path.relative(root, file)}: invalid JSON — ${e.message}`);
  }
}

/** @param {string} fromFile */
function resolveInclude(fromFile, includePath) {
  const dir = path.dirname(fromFile);
  return path.normalize(path.join(dir, includePath));
}

/** @param {string} file */
function validateThemeFile(file, chain = new Set()) {
  const rel = path.relative(root, file);
  if (chain.has(rel)) {
    throw new Error(`Circular include chain: ${[...chain, rel].join(" → ")}`);
  }
  chain.add(rel);

  const theme = readThemeJson(file);
  if (!theme || typeof theme !== "object") throw new Error(`${rel}: invalid root`);
  if (typeof theme.name !== "string" || !theme.name.trim()) {
    throw new Error(`${rel}: missing or empty "name"`);
  }

  if (theme.include) {
    if (typeof theme.include !== "string") throw new Error(`${rel}: "include" must be a string`);
    const inc = resolveInclude(file, theme.include);
    if (!fs.existsSync(inc)) {
      throw new Error(`${rel}: include not found — ${path.relative(root, inc)}`);
    }
    validateThemeFile(inc, chain);
  }

  if (theme.colors != null && typeof theme.colors !== "object") {
    throw new Error(`${rel}: "colors" must be an object`);
  }

  const colors = theme.colors ?? {};
  const missingColorKeys = REQUIRED_COLOR_KEYS.filter((key) => !(key in colors));
  if (missingColorKeys.length > 0 && !theme.include) {
    throw new Error(`${rel}: missing required color keys: ${missingColorKeys.join(", ")}`);
  }

  if (theme.tokenColors != null && !Array.isArray(theme.tokenColors)) {
    throw new Error(`${rel}: "tokenColors" must be an array`);
  }
  if (theme.semanticTokenColors != null && typeof theme.semanticTokenColors !== "object") {
    throw new Error(`${rel}: "semanticTokenColors" must be an object`);
  }

  if (!theme.include) {
    const tokenScopes = new Set();
    for (const rule of theme.tokenColors ?? []) {
      const scope = rule?.scope;
      if (typeof scope === "string") tokenScopes.add(scope);
      if (Array.isArray(scope)) scope.forEach((s) => tokenScopes.add(s));
    }
    const missingScopes = REQUIRED_TOKEN_SCOPES.filter((scope) => !tokenScopes.has(scope));
    if (missingScopes.length > 0) {
      throw new Error(`${rel}: missing required token scopes: ${missingScopes.join(", ")}`);
    }

    const semantic = theme.semanticTokenColors ?? {};
    const missingSemanticKeys = REQUIRED_SEMANTIC_KEYS.filter((key) => !(key in semantic));
    if (missingSemanticKeys.length > 0) {
      throw new Error(`${rel}: missing required semantic token keys: ${missingSemanticKeys.join(", ")}`);
    }
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const themes = pkg?.contributes?.themes;
  if (!Array.isArray(themes) || themes.length === 0) {
    throw new Error("package.json: contributes.themes missing or empty");
  }

  const seen = new Set();
  for (const t of themes) {
    if (!t.path) throw new Error(`Theme without path: ${JSON.stringify(t.label)}`);
    const full = path.resolve(root, t.path);
    if (!fs.existsSync(full)) throw new Error(`Theme file not found: ${t.path}`);
    const key = path.relative(root, full).replace(/\\/g, "/");
    if (seen.has(key)) throw new Error(`Duplicate path: ${key}`);
    seen.add(key);
    validateThemeFile(full);
  }

  for (const f of fs.readdirSync(themesDir)) {
    if (!f.endsWith(".json")) continue;
    if (!/^dusk.*\.json$/i.test(f)) continue;
    const key = path.join("themes", f).replace(/\\/g, "/");
    if (!seen.has(key) && f !== "dusk.json") {
      console.warn("WARN theme not listed in package.json:", key);
    }
  }

  console.log("OK", themes.length, "Marketplace themes validated");
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
