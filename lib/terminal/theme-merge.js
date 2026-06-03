const fs = require("fs");
const path = require("path");

/**
 * Node-only theme-file readers. Kept separate from terminal-contrast.js so the
 * contrast math stays free of `fs`/`path` and can be bundled into the web
 * extension host (which has no Node filesystem). Scripts, tests, and the
 * build-time themes-bundle generator use these; the runtime reads pre-merged
 * data from lib/generated/themes-bundle.js instead.
 */

function readThemeJson(themeFilePath) {
  return JSON.parse(fs.readFileSync(themeFilePath, "utf8"));
}

/** Flatten a theme's `colors` across its `include` chain (child overrides parent). */
function mergeThemeColors(themeFilePath, seen = new Set()) {
  const normalized = path.normalize(themeFilePath);
  if (seen.has(normalized)) {
    throw new Error(`Circular include chain detected: ${[...seen, normalized].join(" -> ")}`);
  }
  seen.add(normalized);

  const themeJson = readThemeJson(themeFilePath);
  let baseColors = {};
  if (typeof themeJson.include === "string" && themeJson.include.length > 0) {
    const parentFilePath = path.resolve(path.dirname(themeFilePath), themeJson.include);
    if (!fs.existsSync(parentFilePath)) {
      throw new Error(`Missing include file: ${themeJson.include}`);
    }
    baseColors = mergeThemeColors(parentFilePath, seen);
  }
  return {
    ...baseColors,
    ...(themeJson.colors && typeof themeJson.colors === "object" ? themeJson.colors : {}),
  };
}

module.exports = { readThemeJson, mergeThemeColors };
