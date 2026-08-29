/**
 * Compact landing-card swatches from the same preview model as the Theme Gallery.
 * Used by the themes-bundle generator and the validate safety net.
 */
const { buildThemePreviewModel } = require("./theme-data.js");

function toRgbHex(value, fallback = "#808080") {
  if (typeof value !== "string") return fallback;
  const m = /^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(value.trim());
  if (!m) return fallback;
  return `#${m[1].toLowerCase()}`;
}

function buildLandingThemeEntry(themeEntry) {
  const preview = buildThemePreviewModel(themeEntry || {});
  return {
    name: typeof themeEntry?.name === "string" ? themeEntry.name : "",
    bg: toRgbHex(preview.editorBackground),
    fg: toRgbHex(preview.editorForeground),
    accent: toRgbHex(preview.accent, toRgbHex(preview.editorForeground)),
  };
}

module.exports = { toRgbHex, buildLandingThemeEntry };
