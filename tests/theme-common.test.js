const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  THEME_BASE,
  THEME_VARIANTS,
  ALL_DUSK_THEMES,
  isDuskTheme,
  isThemeName,
  cleanPickedLabel,
  getThemeDisplayLabel,
  stripThemeDisplayLabel,
  isLightThemeVariant,
  isDarkThemeVariant,
  getThemeShortLabel,
  resolveEffectiveColorTheme,
  normalizeLanguageId,
  isHourInRange,
  isAdaptiveLightPeriod,
  resolveAdaptiveLanguageRules,
  computeAutoSwitchTheme,
  computeAdaptiveFocusTheme,
  coerceBoolean,
  coerceHour,
  coerceDuskTheme,
  coerceOptionalDuskTheme,
  coerceLanguageOverrides,
  sanitizeAutoSwitchConfig,
  sanitizeAdaptiveFocusConfig,
} = require("../lib/themes/theme-common.js");

// ---------------------------------------------------------------------------
// isDuskTheme
// ---------------------------------------------------------------------------
describe("isDuskTheme", () => {
  it("returns true for every known variant and the base palette", () => {
    for (const v of ALL_DUSK_THEMES) {
      assert.equal(isDuskTheme(v), true, `expected true for "${v}"`);
    }
  });

  it("excludes the base palette from picker variants", () => {
    assert.equal(THEME_VARIANTS.includes(THEME_BASE), false);
  });

  it("returns false for non-Dusk themes", () => {
    assert.equal(isDuskTheme("Default Dark+"), false);
    assert.equal(isDuskTheme(""), false);
    assert.equal(isDuskTheme(null), false);
    assert.equal(isDuskTheme(undefined), false);
    assert.equal(isDuskTheme(42), false);
  });

  it("accepts badged Marketplace labels", () => {
    assert.equal(isDuskTheme("◑ Dusk Office Midnight"), true);
    assert.equal(isDuskTheme("◒ Dusk Office Light"), true);
    assert.equal(isDuskTheme("◑ Dusk Office · Base"), true);
    assert.equal(isDuskTheme("$(check) ◑ Dusk Office Vault"), true);
  });
});

// ---------------------------------------------------------------------------
// isThemeName
// ---------------------------------------------------------------------------
describe("isThemeName", () => {
  it("returns true for non-empty strings", () => {
    assert.equal(isThemeName("Dusk Office"), true);
    assert.equal(isThemeName("Default Dark+"), true);
  });

  it("returns false for blanks and non-strings", () => {
    assert.equal(isThemeName(""), false);
    assert.equal(isThemeName("   "), false);
    assert.equal(isThemeName(null), false);
    assert.equal(isThemeName(undefined), false);
  });
});

// ---------------------------------------------------------------------------
// cleanPickedLabel
// ---------------------------------------------------------------------------
describe("cleanPickedLabel", () => {
  it("strips $(check) prefix", () => {
    assert.equal(cleanPickedLabel("$(check) Dusk Office Midnight"), "Dusk Office Midnight");
  });

  it("leaves plain labels untouched", () => {
    assert.equal(cleanPickedLabel("Dusk Office Abyss"), "Dusk Office Abyss");
  });
});

// ---------------------------------------------------------------------------
// light theme insignia
// ---------------------------------------------------------------------------
describe("theme insignia", () => {
  it("marks light variants with ◒ (sorts after ◑ in VS Code)", () => {
    assert.equal(getThemeDisplayLabel("Dusk Office Light"), "◒ Dusk Office Light");
    assert.equal(getThemeDisplayLabel("Dusk Office Midnight"), "◑ Dusk Office Midnight");
  });

  it("strips ◒, ◐, ◑ and · Base from display labels", () => {
    assert.equal(stripThemeDisplayLabel("◒ Dusk Office Audit"), "Dusk Office Audit");
    assert.equal(stripThemeDisplayLabel("◐ Dusk Office Audit"), "Dusk Office Audit");
    assert.equal(stripThemeDisplayLabel("$(check) ◒ Dusk Office Ivory"), "Dusk Office Ivory");
    assert.equal(stripThemeDisplayLabel("◑ Dusk Office Midnight"), "Dusk Office Midnight");
    assert.equal(stripThemeDisplayLabel("◑ Dusk Office · Base"), "Dusk Office");
  });

  it("does not double-badge an already-badged label", () => {
    assert.equal(getThemeDisplayLabel("◑ Dusk Office Midnight"), "◑ Dusk Office Midnight");
    assert.equal(getThemeDisplayLabel("◑ Dusk Office · Base"), "◑ Dusk Office · Base");
  });

  it("identifies light and dark variants", () => {
    assert.equal(isLightThemeVariant("Dusk Office Ledger"), true);
    assert.equal(isLightThemeVariant("Dusk Office Dark Ivory"), false);
    assert.equal(isDarkThemeVariant("Dusk Office Dark Ivory"), true);
    assert.equal(isDarkThemeVariant("Dusk Office Light"), false);
  });
});

// ---------------------------------------------------------------------------
// getThemeShortLabel
// ---------------------------------------------------------------------------
describe("getThemeShortLabel", () => {
  it("strips the 'Dusk Office' prefix", () => {
    assert.equal(getThemeShortLabel("Dusk Office Midnight"), "◑ Midnight");
    assert.equal(getThemeShortLabel("Dusk Office"), "◑ Base");
  });

  it("adds ◒ or ◑ for light and dark variants", () => {
    assert.equal(getThemeShortLabel("Dusk Office Light"), "◒ Light");
    assert.equal(getThemeShortLabel("Dusk Office Midnight"), "◑ Midnight");
  });

  it("returns 'Dusk' for non-string input", () => {
    assert.equal(getThemeShortLabel(null), "Dusk");
    assert.equal(getThemeShortLabel(undefined), "Dusk");
  });
});

describe("resolveEffectiveColorTheme", () => {
  const K = { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 };

  it("returns colorTheme when auto-detect is off", () => {
    assert.equal(
      resolveEffectiveColorTheme({
        autoDetectColorScheme: false,
        colorTheme: "Dusk Office Vault",
        preferredLightColorTheme: "Dusk Office Light",
        activeThemeKind: K.Light,
        ColorThemeKind: K,
      }),
      "Dusk Office Vault",
    );
  });

  it("returns preferredLightColorTheme when OS is light", () => {
    assert.equal(
      resolveEffectiveColorTheme({
        autoDetectColorScheme: true,
        colorTheme: "Dusk Office Vault",
        preferredLightColorTheme: "Dusk Office Light",
        activeThemeKind: K.Light,
        ColorThemeKind: K,
      }),
      "Dusk Office Light",
    );
  });

  it("returns preferredDarkColorTheme when set and OS is dark", () => {
    assert.equal(
      resolveEffectiveColorTheme({
        autoDetectColorScheme: true,
        colorTheme: "Dusk Office Vault",
        preferredDarkColorTheme: "Dusk Office Midnight",
        activeThemeKind: K.Dark,
        ColorThemeKind: K,
      }),
      "Dusk Office Midnight",
    );
  });

  it("falls back to colorTheme when preferred dark is empty", () => {
    assert.equal(
      resolveEffectiveColorTheme({
        autoDetectColorScheme: true,
        colorTheme: "Dusk Office Vault",
        preferredDarkColorTheme: "",
        activeThemeKind: K.Dark,
        ColorThemeKind: K,
      }),
      "Dusk Office Vault",
    );
  });
});

// ---------------------------------------------------------------------------
// normalizeLanguageId
// ---------------------------------------------------------------------------
describe("normalizeLanguageId", () => {
  it("maps aliases to canonical ids", () => {
    assert.equal(normalizeLanguageId("ts"), "typescript");
    assert.equal(normalizeLanguageId("tsx"), "typescript");
    assert.equal(normalizeLanguageId("js"), "javascript");
    assert.equal(normalizeLanguageId("jsx"), "javascript");
    assert.equal(normalizeLanguageId("sh"), "shellscript");
  });

  it("lowercases and trims", () => {
    assert.equal(normalizeLanguageId("  Python  "), "python");
  });

  it("returns empty string for non-strings", () => {
    assert.equal(normalizeLanguageId(null), "");
    assert.equal(normalizeLanguageId(undefined), "");
    assert.equal(normalizeLanguageId(42), "");
  });
});

// ---------------------------------------------------------------------------
// isHourInRange
// ---------------------------------------------------------------------------
describe("isHourInRange", () => {
  it("handles simple range (start < end)", () => {
    assert.equal(isHourInRange(10, 7, 18), true);
    assert.equal(isHourInRange(6, 7, 18), false);
    assert.equal(isHourInRange(18, 7, 18), false);
    assert.equal(isHourInRange(7, 7, 18), true);
  });

  it("handles wrap-around range (start > end)", () => {
    assert.equal(isHourInRange(23, 22, 5), true);
    assert.equal(isHourInRange(3, 22, 5), true);
    assert.equal(isHourInRange(5, 22, 5), false);
    assert.equal(isHourInRange(12, 22, 5), false);
  });

  it("returns true when start === end", () => {
    assert.equal(isHourInRange(0, 12, 12), true);
    assert.equal(isHourInRange(12, 12, 12), true);
  });
});

// ---------------------------------------------------------------------------
// computeAutoSwitchTheme
// ---------------------------------------------------------------------------
describe("computeAutoSwitchTheme", () => {
  const base = {
    enabled: true,
    darkTheme: "Dusk Office Midnight",
    lightTheme: "Dusk Office Light",
    darkHour: 18,
    lightHour: 7,
  };

  it("returns null when disabled", () => {
    assert.equal(computeAutoSwitchTheme({ ...base, enabled: false }), null);
  });

  it("returns null for invalid theme names", () => {
    assert.equal(computeAutoSwitchTheme({ ...base, darkTheme: "Not A Theme" }), null);
  });

  it("returns dark theme at night", () => {
    const night = new Date(2025, 0, 1, 22, 0);
    assert.equal(computeAutoSwitchTheme(base, night), "Dusk Office Midnight");
  });

  it("returns light theme during the day", () => {
    const day = new Date(2025, 0, 1, 12, 0);
    assert.equal(computeAutoSwitchTheme(base, day), "Dusk Office Light");
  });

  it("returns dark at boundary (darkHour)", () => {
    const boundary = new Date(2025, 0, 1, 18, 0);
    assert.equal(computeAutoSwitchTheme(base, boundary), "Dusk Office Midnight");
  });

  it("returns light at boundary (lightHour)", () => {
    const boundary = new Date(2025, 0, 1, 7, 0);
    assert.equal(computeAutoSwitchTheme(base, boundary), "Dusk Office Light");
  });

  it("returns darkTheme when lightHour === darkHour", () => {
    assert.equal(computeAutoSwitchTheme({ ...base, lightHour: 18, darkHour: 18 }), "Dusk Office Midnight");
  });
});

// ---------------------------------------------------------------------------
// computeAdaptiveFocusTheme
// ---------------------------------------------------------------------------
describe("computeAdaptiveFocusTheme", () => {
  const baseCfg = {
    enabled: true,
    onlyWhenDuskThemeActive: false,
    lateNightEyeComfort: true,
    lateNightStartHour: 22,
    lateNightEndHour: 5,
    lockTheme: "",
    dayStartHour: 7,
    dayEndHour: 18,
    defaultLightTheme: "Dusk Office Ivory",
    defaultDarkTheme: "Dusk Office Midnight",
    languageOverrides: {},
  };

  it("returns null when disabled and not forced", () => {
    assert.equal(computeAdaptiveFocusTheme("javascript", new Date(), {}, { ...baseCfg, enabled: false }), null);
  });

  it("returns locked theme when set", () => {
    const result = computeAdaptiveFocusTheme("javascript", new Date(), {}, { ...baseCfg, lockTheme: "Dusk Office Abyss" });
    assert.equal(result.theme, "Dusk Office Abyss");
    assert.ok(result.reason.includes("Lock"));
  });

  it("returns Midnight during late-night hours", () => {
    const lateNight = new Date(2025, 0, 1, 23, 0);
    const result = computeAdaptiveFocusTheme("javascript", lateNight, {}, baseCfg);
    assert.equal(result.theme, "Dusk Office Midnight");
    assert.ok(result.reason.includes("Late-night"));
  });

  it("returns language-specific theme during daytime", () => {
    const day = new Date(2025, 0, 1, 14, 0);
    const result = computeAdaptiveFocusTheme("python", day, {}, { ...baseCfg, lateNightEyeComfort: false });
    assert.equal(result.theme, "Dusk Office Ivory");
    assert.ok(result.reason.includes("python"));
  });

  it("returns language-specific dark theme at night (before late-night)", () => {
    const evening = new Date(2025, 0, 1, 20, 0);
    const result = computeAdaptiveFocusTheme("python", evening, {}, { ...baseCfg, lateNightEyeComfort: false });
    assert.equal(result.theme, "Dusk Office Abyss");
    assert.ok(result.reason.includes("python"));
  });

  it("returns default light/dark when no language rule matches", () => {
    const day = new Date(2025, 0, 1, 10, 0);
    const result = computeAdaptiveFocusTheme("unknownlang", day, {}, { ...baseCfg, lateNightEyeComfort: false });
    assert.equal(result.theme, "Dusk Office Ivory");
    assert.ok(result.reason.includes("Default light"));
  });

  it("returns default dark when no language rule and night", () => {
    const night = new Date(2025, 0, 1, 20, 0);
    const result = computeAdaptiveFocusTheme("", night, {}, { ...baseCfg, lateNightEyeComfort: false });
    assert.equal(result.theme, "Dusk Office Midnight");
    assert.ok(result.reason.includes("Default dark"));
  });

  it("respects custom day window", () => {
    const cfg = { ...baseCfg, lateNightEyeComfort: false, dayStartHour: 9, dayEndHour: 17 };
    const morning = new Date(2025, 0, 1, 8, 0);
    const result = computeAdaptiveFocusTheme("unknownlang", morning, {}, cfg);
    assert.equal(result.theme, "Dusk Office Midnight");
  });

  it("applies languageOverrides over built-in rules", () => {
    const day = new Date(2025, 0, 1, 12, 0);
    const rules = resolveAdaptiveLanguageRules({
      python: { light: "Dusk Office Ledger", dark: "Dusk Office Terminal" },
    });
    assert.equal(rules.python.light, "Dusk Office Ledger");
    const result = computeAdaptiveFocusTheme(
      "python",
      day,
      {},
      {
        ...baseCfg,
        lateNightEyeComfort: false,
        languageOverrides: { python: { light: "Dusk Office Ledger", dark: "Dusk Office Terminal" } },
      },
    );
    assert.equal(result.theme, "Dusk Office Ledger");
  });
});

describe("isAdaptiveLightPeriod", () => {
  it("uses dayStartHour and dayEndHour", () => {
    const cfg = { dayStartHour: 9, dayEndHour: 17 };
    assert.equal(isAdaptiveLightPeriod(10, cfg), true);
    assert.equal(isAdaptiveLightPeriod(8, cfg), false);
  });
});

// ---------------------------------------------------------------------------
// coerceBoolean
// ---------------------------------------------------------------------------
describe("coerceBoolean", () => {
  it("passes through booleans", () => {
    assert.equal(coerceBoolean(true, false), true);
    assert.equal(coerceBoolean(false, true), false);
  });

  it("coerces string 'true' / 'false'", () => {
    assert.equal(coerceBoolean("true", false), true);
    assert.equal(coerceBoolean("false", true), false);
  });

  it("returns fallback for anything else", () => {
    assert.equal(coerceBoolean(undefined, true), true);
    assert.equal(coerceBoolean(null, false), false);
    assert.equal(coerceBoolean(0, true), true);
    assert.equal(coerceBoolean("yes", false), false);
    assert.equal(coerceBoolean({}, true), true);
  });
});

// ---------------------------------------------------------------------------
// coerceHour
// ---------------------------------------------------------------------------
describe("coerceHour", () => {
  it("passes valid integers", () => {
    assert.equal(coerceHour(0, 7), 0);
    assert.equal(coerceHour(23, 7), 23);
    assert.equal(coerceHour(12, 7), 12);
  });

  it("truncates floats", () => {
    assert.equal(coerceHour(7.9, 0), 7);
    assert.equal(coerceHour(22.1, 0), 22);
  });

  it("clamps out-of-range values", () => {
    assert.equal(coerceHour(-1, 7), 0);
    assert.equal(coerceHour(24, 7), 23);
    assert.equal(coerceHour(100, 7), 23);
  });

  it("coerces string numbers", () => {
    assert.equal(coerceHour("18", 7), 18);
    assert.equal(coerceHour("0", 7), 0);
  });

  it("returns fallback for non-numeric", () => {
    assert.equal(coerceHour("abc", 7), 7);
    assert.equal(coerceHour(undefined, 18), 18);
    assert.equal(coerceHour(null, 5), 0);
    assert.equal(coerceHour(NaN, 22), 22);
    assert.equal(coerceHour(Infinity, 7), 7);
  });
});

// ---------------------------------------------------------------------------
// coerceDuskTheme / coerceOptionalDuskTheme
// ---------------------------------------------------------------------------
describe("coerceDuskTheme", () => {
  it("passes valid Dusk themes", () => {
    assert.equal(coerceDuskTheme("Dusk Office Midnight", "Dusk Office Light"), "Dusk Office Midnight");
  });

  it("returns fallback for invalid themes", () => {
    assert.equal(coerceDuskTheme("Not A Theme", "Dusk Office Light"), "Dusk Office Light");
    assert.equal(coerceDuskTheme("", "Dusk Office Midnight"), "Dusk Office Midnight");
    assert.equal(coerceDuskTheme(null, "Dusk Office Midnight"), "Dusk Office Midnight");
    assert.equal(coerceDuskTheme(42, "Dusk Office Light"), "Dusk Office Light");
  });

  it("normalizes badged labels to the plain name", () => {
    assert.equal(coerceDuskTheme("◑ Dusk Office Midnight", "Dusk Office Light"), "Dusk Office Midnight");
    assert.equal(coerceOptionalDuskTheme("◒ Dusk Office Ivory"), "Dusk Office Ivory");
  });
});

describe("coerceOptionalDuskTheme", () => {
  it("passes valid Dusk themes", () => {
    assert.equal(coerceOptionalDuskTheme("Dusk Office Abyss"), "Dusk Office Abyss");
  });

  it("returns empty string for anything invalid", () => {
    assert.equal(coerceOptionalDuskTheme("Not A Theme"), "");
    assert.equal(coerceOptionalDuskTheme(""), "");
    assert.equal(coerceOptionalDuskTheme(null), "");
    assert.equal(coerceOptionalDuskTheme(undefined), "");
  });
});

// ---------------------------------------------------------------------------
// coerceLanguageOverrides
// ---------------------------------------------------------------------------
describe("coerceLanguageOverrides", () => {
  it("passes valid overrides with normalised keys", () => {
    const result = coerceLanguageOverrides({
      ts: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
    });
    assert.deepEqual(result, {
      typescript: { light: "Dusk Office Ivory", dark: "Dusk Office Nebula" },
    });
  });

  it("drops entries with no valid theme", () => {
    const result = coerceLanguageOverrides({
      python: { light: "Bad", dark: "Also Bad" },
    });
    assert.deepEqual(result, {});
  });

  it("keeps partial entries (only light or dark valid)", () => {
    const result = coerceLanguageOverrides({
      go: { light: "Dusk Office Ivory", dark: "nope" },
    });
    assert.deepEqual(result, { go: { light: "Dusk Office Ivory" } });
  });

  it("returns {} for non-objects", () => {
    assert.deepEqual(coerceLanguageOverrides(null), {});
    assert.deepEqual(coerceLanguageOverrides("string"), {});
    assert.deepEqual(coerceLanguageOverrides([1, 2]), {});
    assert.deepEqual(coerceLanguageOverrides(undefined), {});
  });
});

// ---------------------------------------------------------------------------
// sanitizeAutoSwitchConfig
// ---------------------------------------------------------------------------
describe("sanitizeAutoSwitchConfig", () => {
  it("returns safe defaults from empty/garbage input", () => {
    const result = sanitizeAutoSwitchConfig(null);
    assert.deepEqual(result, {
      enabled: false,
      darkTheme: "Dusk Office Midnight",
      lightTheme: "Dusk Office Light",
      darkHour: 18,
      lightHour: 7,
      timezone: "",
    });
  });

  it("clamps hours and rejects bad theme names", () => {
    const result = sanitizeAutoSwitchConfig({
      enabled: "true",
      darkTheme: "Unknown",
      lightTheme: "Also Unknown",
      darkHour: 99,
      lightHour: -5,
    });
    assert.equal(result.enabled, true);
    assert.equal(result.darkTheme, "Dusk Office Midnight");
    assert.equal(result.lightTheme, "Dusk Office Light");
    assert.equal(result.darkHour, 23);
    assert.equal(result.lightHour, 0);
  });

  it("passes through valid values unchanged", () => {
    const input = {
      enabled: true,
      darkTheme: "Dusk Office Abyss",
      lightTheme: "Dusk Office Ivory",
      darkHour: 20,
      lightHour: 6,
      timezone: "Europe/Paris",
    };
    assert.deepEqual(sanitizeAutoSwitchConfig(input), input);
  });
});

// ---------------------------------------------------------------------------
// sanitizeAdaptiveFocusConfig
// ---------------------------------------------------------------------------
describe("sanitizeAdaptiveFocusConfig", () => {
  it("returns safe defaults from empty/garbage input", () => {
    const result = sanitizeAdaptiveFocusConfig(undefined);
    assert.deepEqual(result, {
      enabled: false,
      onlyWhenDuskThemeActive: true,
      lateNightEyeComfort: true,
      lateNightStartHour: 22,
      lateNightEndHour: 5,
      lockTheme: "",
      dayStartHour: 7,
      dayEndHour: 18,
      defaultLightTheme: "Dusk Office Ivory",
      defaultDarkTheme: "Dusk Office Midnight",
      languageOverrides: {},
      timezone: "",
    });
  });

  it("inherits auto-switch timezone when adaptive timezone is unset", () => {
    const result = sanitizeAdaptiveFocusConfig({ enabled: true }, "Europe/Paris");
    assert.equal(result.timezone, "Europe/Paris");
  });

  it("clamps hours, rejects bad themes, coerces booleans", () => {
    const result = sanitizeAdaptiveFocusConfig({
      enabled: "false",
      onlyWhenDuskThemeActive: 1,
      lateNightEyeComfort: "true",
      lateNightStartHour: "abc",
      lateNightEndHour: 30,
      lockTheme: "Not A Theme",
      dayStartHour: NaN,
      dayEndHour: -1,
      defaultLightTheme: 42,
      defaultDarkTheme: "",
      languageOverrides: "bad",
    });
    assert.equal(result.enabled, false);
    assert.equal(result.onlyWhenDuskThemeActive, true);
    assert.equal(result.lateNightEyeComfort, true);
    assert.equal(result.lateNightStartHour, 22);
    assert.equal(result.lateNightEndHour, 23);
    assert.equal(result.lockTheme, "");
    assert.equal(result.dayStartHour, 7);
    assert.equal(result.dayEndHour, 0);
    assert.equal(result.defaultLightTheme, "Dusk Office Ivory");
    assert.equal(result.defaultDarkTheme, "Dusk Office Midnight");
    assert.deepEqual(result.languageOverrides, {});
  });

  it("preserves valid lockTheme and languageOverrides", () => {
    const result = sanitizeAdaptiveFocusConfig({
      enabled: true,
      lockTheme: "Dusk Office Vault",
      languageOverrides: { python: { dark: "Dusk Office Abyss" } },
    });
    assert.equal(result.lockTheme, "Dusk Office Vault");
    assert.deepEqual(result.languageOverrides, { python: { dark: "Dusk Office Abyss" } });
  });
});
