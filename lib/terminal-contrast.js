const fs = require("fs");
const path = require("path");

const MIN_TERMINAL_FG_RATIO = 4.5;
const MIN_TERMINAL_ANSI_RATIO = 2.9;
const SKIP_ANSI_KEYS = new Set(["terminal.ansiBlack", "terminal.ansiBrightBlack"]);
const TERMINAL_ANSI_KEYS = [
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

function luminance(rgb) {
  const linear = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const red = linear(rgb.r);
  const green = linear(rgb.g);
  const blue = linear(rgb.b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(l1, l2) {
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function parseColor(colorValue) {
  if (typeof colorValue !== "string" || !colorValue.startsWith("#")) return null;
  let hex = colorValue.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = [...hex].map((ch) => ch + ch).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      alpha: hex.slice(6, 8),
    };
  }
  return null;
}

function compositeColor(fg, alpha, bg) {
  const a = Math.max(0, Math.min(1, alpha));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function terminalBackgroundRgb(colorValue) {
  const parsed = parseColor(colorValue);
  if (!parsed) return null;
  if (parsed.alpha != null) {
    const alpha = parseInt(parsed.alpha, 16) / 255;
    const colorLum = luminance({ r: parsed.r, g: parsed.g, b: parsed.b });
    const under = colorLum < 0.2 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    return compositeColor({ r: parsed.r, g: parsed.g, b: parsed.b }, alpha, under);
  }
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

function effectiveForegroundRgb(colorValue, bgRgb) {
  const parsed = parseColor(colorValue);
  if (!parsed) return null;
  if (parsed.alpha != null) {
    const alpha = parseInt(parsed.alpha, 16) / 255;
    return compositeColor({ r: parsed.r, g: parsed.g, b: parsed.b }, alpha, bgRgb);
  }
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

function readThemeJson(themeFilePath) {
  return JSON.parse(fs.readFileSync(themeFilePath, "utf8"));
}

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

function checkTerminalContrast(colors, uiTheme) {
  const failures = [];
  const bgValue = colors["terminal.background"];
  if (typeof bgValue !== "string") {
    failures.push("terminal.background is missing");
    return failures;
  }

  const bgRgb = terminalBackgroundRgb(bgValue);
  if (!bgRgb) {
    failures.push(`terminal.background is invalid (${bgValue})`);
    return failures;
  }
  const bgLum = luminance(bgRgb);

  const fgValue = colors["terminal.foreground"];
  if (typeof fgValue === "string") {
    const fgRgb = effectiveForegroundRgb(fgValue, bgRgb);
    if (fgRgb) {
      const ratio = contrastRatio(luminance(fgRgb), bgLum);
      if (ratio < MIN_TERMINAL_FG_RATIO) {
        failures.push(
          `terminal.foreground ${fgValue} vs terminal.background ${bgValue}: ${ratio.toFixed(2)}:1 (min ${MIN_TERMINAL_FG_RATIO}:1)`,
        );
      }
    }
  }

  for (const key of TERMINAL_ANSI_KEYS) {
    if (key === "terminal.foreground" || SKIP_ANSI_KEYS.has(key)) continue;
    const colorValue = colors[key];
    if (typeof colorValue !== "string") continue;
    const fgRgb = effectiveForegroundRgb(colorValue, bgRgb);
    if (!fgRgb) continue;
    const ratio = contrastRatio(luminance(fgRgb), bgLum);
    if (ratio < MIN_TERMINAL_ANSI_RATIO) {
      failures.push(`${key} ${colorValue}: ${ratio.toFixed(2)}:1 (min ${MIN_TERMINAL_ANSI_RATIO}:1)`);
    }
  }

  return failures;
}

module.exports = {
  MIN_TERMINAL_FG_RATIO,
  MIN_TERMINAL_ANSI_RATIO,
  mergeThemeColors,
  checkTerminalContrast,
};
