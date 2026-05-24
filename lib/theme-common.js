/** Palette parente (`themes/dusk.json`) — incluse par les variantes, pas un choix « niche ». */
const THEME_BASE = "Dusk Office";

/** Variantes sélectionnables (quick pick Dusk Office) — sans la base. */
const THEME_VARIANTS = [
  "Dusk Office Finance",
  "Dusk Office Abyss",
  "Dusk Office Bay",
  "Dusk Office High Contrast",
  "Dusk Office Midnight",
  "Dusk Office Secure",
  "Dusk Office Sentinel",
  "Dusk Office Steward",
  "Dusk Office Terminal",
  "Dusk Office Vault",
  "Dusk Office Voltage",
  "Dusk Office Dawn",
  "Dusk Office Mist",
  "Dusk Office Ash",
  "Dusk Office Nebula",
  "Dusk Office Reef",
  "Dusk Office Dark Ivory",
  "Dusk Office Nocturne",
  "Dusk Office Corporate",
  "Dusk Office Neon",
  "Dusk Office Luxe",
  "Dusk Office Or",
  "Dusk Office Light",
  "Dusk Office Ivory",
  "Dusk Office Ledger",
  "Dusk Office Audit",
];

const ALL_DUSK_THEMES = [THEME_BASE, ...THEME_VARIANTS];

/** Thèmes clairs (uiTheme `vs`) — insigne ◒ (tri après ◑ dans le sélecteur VS Code). */
const LIGHT_THEME_VARIANTS = new Set([
  "Dusk Office Light",
  "Dusk Office Ivory",
  "Dusk Office Ledger",
  "Dusk Office Audit",
]);

/** ◑ sombre · ◒ clair — ◒ (U+25D2) doit trier après ◑ (U+25D1) : VS Code classe les labels A→Z. */
const LIGHT_THEME_INSIGNIA = "◒";
const DARK_THEME_INSIGNIA = "◑";
/** Ancien insigne clair (compat stripThemeDisplayLabel). */
const LEGACY_LIGHT_THEME_INSIGNIA = "◐";

function isLightThemeVariant(theme) {
  return typeof theme === "string" && LIGHT_THEME_VARIANTS.has(theme);
}

function isDarkThemeVariant(theme) {
  return isDuskTheme(theme) && !isLightThemeVariant(theme);
}

function getThemeInsignia(theme) {
  if (isLightThemeVariant(theme)) return LIGHT_THEME_INSIGNIA;
  if (isDarkThemeVariant(theme)) return DARK_THEME_INSIGNIA;
  return "";
}

function getThemeDisplayLabel(theme) {
  if (isThemeBase(theme)) return `${DARK_THEME_INSIGNIA} ${theme} · Base`;
  const insignia = getThemeInsignia(theme);
  return insignia ? `${insignia} ${theme}` : theme;
}

function getThemeKindLabel(theme) {
  if (isLightThemeVariant(theme)) return "Light";
  if (isDarkThemeVariant(theme)) return "Dark";
  return "";
}

const ADAPTIVE_LANGUAGE_RULES = {
  markdown: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
  mdx: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
  dart: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
  flutter: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
  typescript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
  javascript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
  json: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
  yaml: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
  yml: { light: "Dusk Office Ivory", dark: "Dusk Office Ash" },
  shellscript: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  shell: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  bash: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  zsh: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  python: { light: "Dusk Office Ivory", dark: "Dusk Office Abyss" },
  go: { light: "Dusk Office Ivory", dark: "Dusk Office Reef" },
  rust: { light: "Dusk Office Ivory", dark: "Dusk Office Corporate" },
  html: { light: "Dusk Office Ivory", dark: "Dusk Office Dawn" },
  css: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
  sql: { light: "Dusk Office Ivory", dark: "Dusk Office Finance" },
  ruby: { light: "Dusk Office Ivory", dark: "Dusk Office Nocturne" },
  java: { light: "Dusk Office Light", dark: "Dusk Office Corporate" },
  cpp: { light: "Dusk Office Light", dark: "Dusk Office Reef" },
  c: { light: "Dusk Office Light", dark: "Dusk Office Reef" },
  swift: { light: "Dusk Office Ivory", dark: "Dusk Office Midnight" },
  kotlin: { light: "Dusk Office Light", dark: "Dusk Office Bay" },
};

function isThemeBase(theme) {
  return theme === THEME_BASE;
}

function isDuskTheme(theme) {
  return typeof theme === "string" && ALL_DUSK_THEMES.includes(theme);
}

function isThemeName(theme) {
  return typeof theme === "string" && theme.trim().length > 0;
}

function cleanPickedLabel(label) {
  return label.replace(/^\$\(check\)\s+/, "").trim();
}

function stripThemeDisplayLabel(label) {
  let cleaned = cleanPickedLabel(label);
  for (const insignia of [LIGHT_THEME_INSIGNIA, LEGACY_LIGHT_THEME_INSIGNIA, DARK_THEME_INSIGNIA]) {
    if (cleaned.startsWith(`${insignia} `)) {
      cleaned = cleaned.slice(insignia.length + 1);
      break;
    }
  }
  if (cleaned.endsWith(" · Base")) {
    cleaned = cleaned.slice(0, -" · Base".length);
  }
  return cleaned;
}

function normalizeLanguageId(languageId) {
  if (typeof languageId !== "string") return "";
  const value = languageId.toLowerCase().trim();
  if (value === "ts" || value === "tsx") return "typescript";
  if (value === "js" || value === "jsx") return "javascript";
  if (value === "sh") return "shellscript";
  return value;
}

function isHourInRange(hour, start, end) {
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

/** @param {number} hour @param {{ dayStartHour?: number; dayEndHour?: number }} cfg */
function isAdaptiveLightPeriod(hour, cfg) {
  const start = cfg.dayStartHour ?? 7;
  const end = cfg.dayEndHour ?? 18;
  return isHourInRange(hour, start, end);
}

/**
 * Merges user overrides onto built-in ADAPTIVE_LANGUAGE_RULES.
 * @param {Record<string, { light?: string; dark?: string }> | undefined} languageOverrides
 */
function resolveAdaptiveLanguageRules(languageOverrides) {
  const merged = { ...ADAPTIVE_LANGUAGE_RULES };
  if (!languageOverrides || typeof languageOverrides !== "object" || Array.isArray(languageOverrides)) {
    return merged;
  }
  for (const [rawLang, rule] of Object.entries(languageOverrides)) {
    if (!rule || typeof rule !== "object") continue;
    const lang = normalizeLanguageId(rawLang);
    if (!lang) continue;
    const base = merged[lang] ? { ...merged[lang] } : { light: "", dark: "" };
    if (isDuskTheme(rule.light)) base.light = rule.light;
    if (isDuskTheme(rule.dark)) base.dark = rule.dark;
    if (isDuskTheme(base.light) || isDuskTheme(base.dark)) {
      merged[lang] = base;
    }
  }
  return merged;
}

function getThemeShortLabel(theme) {
  if (typeof theme !== "string") return "Dusk";
  if (isThemeBase(theme)) return `${DARK_THEME_INSIGNIA} Base`;
  const base = theme.replace(/^Dusk Office\s*/, "") || "Dusk";
  const insignia = getThemeInsignia(theme);
  return insignia ? `${insignia} ${base}` : base;
}

/**
 * Thème réellement affiché quand `window.autoDetectColorScheme` bascule entre
 * `workbench.preferredLightColorTheme` / `preferredDarkColorTheme` et `colorTheme`.
 * @param {{
 *   autoDetectColorScheme?: boolean;
 *   activeThemeKind?: number;
 *   colorTheme?: string;
 *   preferredLightColorTheme?: string;
 *   preferredDarkColorTheme?: string;
 *   ColorThemeKind?: { Light?: number; Dark?: number; HighContrast?: number; HighContrastLight?: number };
 * }} opts
 */
function resolveEffectiveColorTheme(opts) {
  const fallback = typeof opts.colorTheme === "string" ? opts.colorTheme : "";
  if (!opts.autoDetectColorScheme) return fallback;

  const K = opts.ColorThemeKind ?? {};
  const Light = K.Light ?? 1;
  const Dark = K.Dark ?? 2;
  const HighContrast = K.HighContrast ?? 3;
  const HighContrastLight = K.HighContrastLight ?? 4;
  const kind = opts.activeThemeKind;

  if (kind === Light || kind === HighContrastLight) {
    const light = opts.preferredLightColorTheme;
    return typeof light === "string" && light.length > 0 ? light : fallback;
  }
  if (kind === Dark || kind === HighContrast) {
    const dark = opts.preferredDarkColorTheme;
    return typeof dark === "string" && dark.length > 0 ? dark : fallback;
  }
  return fallback;
}

/* -------------------------------------------------------------------------- *
 * Sanitizers — accept any raw VS Code setting value and return a safe value.  *
 * Used by `lib/configuration.js` so the rest of the extension can trust the   *
 * shape of every theme option even if a user hand-edited settings.json with   *
 * a wrong type, an unknown theme name, or an out-of-range hour.               *
 * -------------------------------------------------------------------------- */

function coerceBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function coerceHour(value, fallback) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < 0) return 0;
  if (i > 23) return 23;
  return i;
}

function coerceDuskTheme(value, fallback) {
  return isDuskTheme(value) ? value : fallback;
}

function coerceOptionalDuskTheme(value) {
  return isDuskTheme(value) ? value : "";
}

function coerceLanguageOverrides(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [rawLang, rule] of Object.entries(value)) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) continue;
    const lang = normalizeLanguageId(rawLang);
    if (!lang) continue;
    const entry = {};
    if (isDuskTheme(rule.light)) entry.light = rule.light;
    if (isDuskTheme(rule.dark)) entry.dark = rule.dark;
    if (entry.light || entry.dark) out[lang] = entry;
  }
  return out;
}

function sanitizeAutoSwitchConfig(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: coerceBoolean(src.enabled, false),
    darkTheme: coerceDuskTheme(src.darkTheme, "Dusk Office Midnight"),
    lightTheme: coerceDuskTheme(src.lightTheme, "Dusk Office Light"),
    darkHour: coerceHour(src.darkHour, 18),
    lightHour: coerceHour(src.lightHour, 7),
  };
}

function sanitizeAdaptiveFocusConfig(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: coerceBoolean(src.enabled, false),
    onlyWhenDuskThemeActive: coerceBoolean(src.onlyWhenDuskThemeActive, true),
    lateNightEyeComfort: coerceBoolean(src.lateNightEyeComfort, true),
    lateNightStartHour: coerceHour(src.lateNightStartHour, 22),
    lateNightEndHour: coerceHour(src.lateNightEndHour, 5),
    lockTheme: coerceOptionalDuskTheme(src.lockTheme),
    dayStartHour: coerceHour(src.dayStartHour, 7),
    dayEndHour: coerceHour(src.dayEndHour, 18),
    defaultLightTheme: coerceDuskTheme(src.defaultLightTheme, "Dusk Office Ivory"),
    defaultDarkTheme: coerceDuskTheme(src.defaultDarkTheme, "Dusk Office Midnight"),
    languageOverrides: coerceLanguageOverrides(src.languageOverrides),
  };
}

function computeAutoSwitchTheme(autoSwitch, now = new Date()) {
  if (!autoSwitch.enabled) return null;
  if (!isDuskTheme(autoSwitch.darkTheme) || !isDuskTheme(autoSwitch.lightTheme)) {
    return null;
  }
  if (autoSwitch.lightHour === autoSwitch.darkHour) {
    return autoSwitch.darkTheme;
  }
  const hour = now.getHours();
  const useDark =
    autoSwitch.lightHour < autoSwitch.darkHour
      ? hour >= autoSwitch.darkHour || hour < autoSwitch.lightHour
      : hour >= autoSwitch.darkHour && hour < autoSwitch.lightHour;
  return useDark ? autoSwitch.darkTheme : autoSwitch.lightTheme;
}

function computeAdaptiveFocusTheme(languageId, now = new Date(), options = {}, cfg) {
  if (!cfg.enabled && !options.force) return null;

  if (cfg.lockTheme && isDuskTheme(cfg.lockTheme)) {
    return { theme: cfg.lockTheme, reason: `Lock theme (${cfg.lockTheme})` };
  }

  const hour = now.getHours();
  if (
    cfg.lateNightEyeComfort &&
    isHourInRange(hour, cfg.lateNightStartHour, cfg.lateNightEndHour)
  ) {
    return { theme: "Dusk Office Midnight", reason: "Late-night eye comfort" };
  }

  const period = isAdaptiveLightPeriod(hour, cfg) ? "light" : "dark";
  const lang = normalizeLanguageId(languageId);
  const rules = resolveAdaptiveLanguageRules(cfg.languageOverrides);
  const byLanguage = lang ? rules[lang] : null;
  if (byLanguage && isDuskTheme(byLanguage[period])) {
    return { theme: byLanguage[period], reason: `Language rule (${lang})` };
  }

  const lightDefault = isDuskTheme(cfg.defaultLightTheme) ? cfg.defaultLightTheme : "Dusk Office Ivory";
  const darkDefault = isDuskTheme(cfg.defaultDarkTheme) ? cfg.defaultDarkTheme : "Dusk Office Midnight";

  return {
    theme: period === "light" ? lightDefault : darkDefault,
    reason: `Default ${period} period`,
  };
}

/**
 * CLI / tests: same resolution as the extension without VS Code config.
 * @param {object} opts
 * @param {number} opts.hour 0–23
 * @param {string} [opts.languageId]
 * @param {string} [opts.lockTheme]
 * @param {boolean} [opts.lateNightEyeComfort]
 * @param {number} [opts.lateNightStartHour]
 * @param {number} [opts.lateNightEndHour]
 */
function previewAdaptiveFocusTheme(opts) {
  const hour = opts.hour ?? new Date().getHours();
  const now = new Date();
  now.setHours(hour, 0, 0, 0);
  const cfg = {
    enabled: true,
    lockTheme: opts.lockTheme || "",
    lateNightEyeComfort: opts.lateNightEyeComfort !== false,
    lateNightStartHour: opts.lateNightStartHour ?? 22,
    lateNightEndHour: opts.lateNightEndHour ?? 5,
    dayStartHour: opts.dayStartHour ?? 7,
    dayEndHour: opts.dayEndHour ?? 18,
    defaultLightTheme: opts.defaultLightTheme || "Dusk Office Ivory",
    defaultDarkTheme: opts.defaultDarkTheme || "Dusk Office Midnight",
    languageOverrides: opts.languageOverrides,
  };
  return computeAdaptiveFocusTheme(opts.languageId || "", now, { force: true }, cfg);
}

module.exports = {
  THEME_BASE,
  THEME_VARIANTS,
  ALL_DUSK_THEMES,
  LIGHT_THEME_VARIANTS,
  LIGHT_THEME_INSIGNIA,
  DARK_THEME_INSIGNIA,
  ADAPTIVE_LANGUAGE_RULES,
  isDuskTheme,
  isThemeBase,
  isLightThemeVariant,
  isDarkThemeVariant,
  isThemeName,
  cleanPickedLabel,
  getThemeInsignia,
  getThemeDisplayLabel,
  getThemeKindLabel,
  stripThemeDisplayLabel,
  getThemeShortLabel,
  resolveEffectiveColorTheme,
  normalizeLanguageId,
  isHourInRange,
  isAdaptiveLightPeriod,
  resolveAdaptiveLanguageRules,
  computeAutoSwitchTheme,
  computeAdaptiveFocusTheme,
  previewAdaptiveFocusTheme,
  coerceBoolean,
  coerceHour,
  coerceDuskTheme,
  coerceOptionalDuskTheme,
  coerceLanguageOverrides,
  sanitizeAutoSwitchConfig,
  sanitizeAdaptiveFocusConfig,
};
