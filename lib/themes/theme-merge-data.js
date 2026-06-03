const fs = require("fs");
const path = require("path");

/**
 * Node-only theme-file flattening used by scripts, tests, and the build-time
 * themes-bundle generator. Kept separate from theme-data.js so the pure helpers
 * (scope matching, preview model) stay `fs`-free and bundle into the web host.
 * The runtime consumes pre-merged data from lib/generated/themes-bundle.js.
 */

function readThemeJson(themeFilePath) {
  return JSON.parse(fs.readFileSync(themeFilePath, "utf8"));
}

/**
 * Flatten a theme's `colors`, `tokenColors`, and `type` across its `include`
 * chain. Child `colors` override parent keys; child `tokenColors` are appended
 * after the parent's so later (more specific) rules win — matching VS Code.
 *
 * @param {string} themeFilePath absolute path to a theme JSON file
 * @returns {{ type: string|undefined, colors: Record<string,string>, tokenColors: Array<object> }}
 */
function mergeThemeData(themeFilePath, seen = new Set()) {
  const normalized = path.normalize(themeFilePath);
  if (seen.has(normalized)) {
    throw new Error(`Circular include chain detected: ${[...seen, normalized].join(" -> ")}`);
  }
  seen.add(normalized);

  const themeJson = readThemeJson(themeFilePath);
  let base = { type: undefined, colors: {}, tokenColors: [] };
  if (typeof themeJson.include === "string" && themeJson.include.length > 0) {
    const parentFilePath = path.resolve(path.dirname(themeFilePath), themeJson.include);
    if (!fs.existsSync(parentFilePath)) {
      throw new Error(`Missing include file: ${themeJson.include}`);
    }
    base = mergeThemeData(parentFilePath, seen);
  }

  return {
    type: typeof themeJson.type === "string" ? themeJson.type : base.type,
    colors: {
      ...base.colors,
      ...(themeJson.colors && typeof themeJson.colors === "object" ? themeJson.colors : {}),
    },
    tokenColors: [
      ...base.tokenColors,
      ...(Array.isArray(themeJson.tokenColors) ? themeJson.tokenColors : []),
    ],
  };
}

/**
 * Map every Dusk Office variant name (insignia stripped) to its theme file path
 * and uiTheme, read from `contributes.themes` in package.json.
 *
 * @param {object} packageJSON
 * @param {string} extensionPath
 * @param {(label:string)=>string} stripLabel
 * @returns {Map<string, {name:string, label:string, path:string, uiTheme:string}>}
 */
function getThemeFileMap(packageJSON, extensionPath, stripLabel) {
  const out = new Map();
  const themes = packageJSON?.contributes?.themes;
  if (!Array.isArray(themes)) return out;
  for (const theme of themes) {
    if (typeof theme?.path !== "string" || !theme.path.endsWith(".json")) continue;
    const label = typeof theme.label === "string" ? theme.label : "";
    const name = typeof stripLabel === "function" ? stripLabel(label) : label;
    if (!name) continue;
    out.set(name, {
      name,
      label,
      path: path.resolve(extensionPath, theme.path),
      uiTheme: typeof theme.uiTheme === "string" ? theme.uiTheme : "vs-dark",
    });
  }
  return out;
}

module.exports = { readThemeJson, mergeThemeData, getThemeFileMap };
