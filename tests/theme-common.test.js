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
} = require("../lib/theme-common.js");

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
