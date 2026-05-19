const THEME_VARIANTS = [
  "Dusk Office",
  "Dusk Office Abyss",
  "Dusk Office Dawn",
  "Dusk Office Bay",
  "Dusk Office Mist",
  "Dusk Office Ash",
  "Dusk Office Midnight",
  "Dusk Office Nebula",
  "Dusk Office Reef",
  "Dusk Office High Contrast",
  "Dusk Office Light",
  "Dusk Office Ivory",
  "Dusk Office Dark Ivory",
  "Dusk Office Nocturne",
  "Dusk Office Finance",
  "Dusk Office Corporate",
  "Dusk Office Voltage",
  "Dusk Office Neon",
  "Dusk Office Luxe",
  "Dusk Office Or",
  "Dusk Office Terminal",
  "Dusk Office Steward",
  "Dusk Office Ledger",
  "Dusk Office Secure",
  "Dusk Office Vault",
  "Dusk Office Audit",
  "Dusk Office Sentinel",
];

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

function isDuskTheme(theme) {
  return typeof theme === "string" && THEME_VARIANTS.includes(theme);
}

function isThemeName(theme) {
  return typeof theme === "string" && theme.trim().length > 0;
}

function cleanPickedLabel(label) {
  return label.replace(/^\$\(check\)\s+/, "").trim();
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
  return typeof theme === "string" ? theme.replace(/^Dusk Office\s*/, "") || "Dusk" : "Dusk";
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
  THEME_VARIANTS,
  ADAPTIVE_LANGUAGE_RULES,
  isDuskTheme,
  isThemeName,
  cleanPickedLabel,
  getThemeShortLabel,
  normalizeLanguageId,
  isHourInRange,
  isAdaptiveLightPeriod,
  resolveAdaptiveLanguageRules,
  computeAutoSwitchTheme,
  computeAdaptiveFocusTheme,
  previewAdaptiveFocusTheme,
};
