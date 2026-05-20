/**
 * Résout un thème VS Code (include + tokenColors) pour export vers d'autres IDE.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { dirname, join, normalize, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const THEMES_DIR = join(__dirname, "..", "themes");

export function readThemeJson(themeFilePath) {
  return JSON.parse(readFileSync(themeFilePath, "utf8"));
}

/**
 * @param {string} themeFilePath
 * @param {Set<string>} [seen]
 * @returns {Record<string, string>}
 */
export function mergeThemeColors(themeFilePath, seen = new Set()) {
  const normalized = normalize(themeFilePath);
  if (seen.has(normalized)) {
    throw new Error(
      `Circular include chain: ${[...seen, normalized].join(" -> ")}`,
    );
  }
  seen.add(normalized);

  const themeJson = readThemeJson(themeFilePath);
  let baseColors = {};
  if (typeof themeJson.include === "string" && themeJson.include.length > 0) {
    const parentFilePath = resolve(
      dirname(themeFilePath),
      themeJson.include,
    );
    if (!existsSync(parentFilePath)) {
      throw new Error(`Missing include file: ${themeJson.include}`);
    }
    baseColors = mergeThemeColors(parentFilePath, seen);
  }
  return {
    ...baseColors,
    ...(themeJson.colors && typeof themeJson.colors === "object"
      ? themeJson.colors
      : {}),
  };
}

/**
 * @param {string} themeFilePath
 * @param {Set<string>} [seen]
 * @returns {import('./theme-export-palette.mjs').TokenColorRule[]}
 */
export function mergeThemeTokenColors(themeFilePath, seen = new Set()) {
  const normalized = normalize(themeFilePath);
  if (seen.has(normalized)) {
    throw new Error(
      `Circular include chain: ${[...seen, normalized].join(" -> ")}`,
    );
  }
  seen.add(normalized);

  const themeJson = readThemeJson(themeFilePath);
  let tokens = [];
  if (typeof themeJson.include === "string" && themeJson.include.length > 0) {
    const parentFilePath = resolve(
      dirname(themeFilePath),
      themeJson.include,
    );
    if (!existsSync(parentFilePath)) {
      throw new Error(`Missing include file: ${themeJson.include}`);
    }
    tokens = mergeThemeTokenColors(parentFilePath, seen);
  }
  const own = Array.isArray(themeJson.tokenColors) ? themeJson.tokenColors : [];
  return [...tokens, ...own];
}

/**
 * @param {string} themeFilePath
 * @param {Set<string>} [seen]
 */
export function mergeThemeSemanticTokenColors(themeFilePath, seen = new Set()) {
  const normalized = normalize(themeFilePath);
  if (seen.has(normalized)) {
    throw new Error(
      `Circular include chain: ${[...seen, normalized].join(" -> ")}`,
    );
  }
  seen.add(normalized);

  const themeJson = readThemeJson(themeFilePath);
  let semantic = {};
  if (typeof themeJson.include === "string" && themeJson.include.length > 0) {
    const parentFilePath = resolve(
      dirname(themeFilePath),
      themeJson.include,
    );
    semantic = mergeThemeSemanticTokenColors(parentFilePath, seen);
  }
  const own =
    themeJson.semanticTokenColors &&
    typeof themeJson.semanticTokenColors === "object"
      ? themeJson.semanticTokenColors
      : {};
  return { ...semantic, ...own };
}

/**
 * @param {string} themeFilePath
 * @returns {{
 *   file: string;
 *   slug: string;
 *   name: string;
 *   type: 'dark' | 'light';
 *   colors: Record<string, string>;
 *   tokenColors: import('./theme-export-palette.mjs').TokenColorRule[];
 *   semanticTokenColors: Record<string, unknown>;
 * }}
 */
export function resolveTheme(themeFilePath) {
  const themeJson = readThemeJson(themeFilePath);
  const base = themeJson.name ?? "Dusk Office";
  const slug = slugFromThemeFile(themeFilePath, base);
  const type =
    themeJson.type === "light" || themeJson.uiTheme === "vs"
      ? "light"
      : "dark";
  return {
    file: themeFilePath,
    slug,
    name: base,
    type,
    colors: mergeThemeColors(themeFilePath),
    tokenColors: mergeThemeTokenColors(themeFilePath),
    semanticTokenColors: mergeThemeSemanticTokenColors(themeFilePath),
  };
}

/** @returns {string[]} absolute paths */
export function listThemeFiles(dir = THEMES_DIR) {
  return readdirSync(dir)
    .filter((f) => /^dusk.*\.json$/i.test(f))
    .sort()
    .map((f) => join(dir, f));
}

/**
 * @param {string} themeFilePath
 * @param {string} [displayName]
 */
export function slugFromThemeFile(themeFilePath, displayName) {
  const base = themeFilePath.replace(/\\/g, "/").split("/").pop() ?? "";
  const stem = base.replace(/\.json$/i, "");
  if (stem === "dusk") return "dusk-office";
  const suffix = stem.replace(/^dusk-?/, "");
  if (suffix) return `dusk-office-${suffix}`;
  const label = (displayName ?? "")
    .replace(/^Dusk Office\s*/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return label ? `dusk-office-${label}` : "dusk-office";
}
