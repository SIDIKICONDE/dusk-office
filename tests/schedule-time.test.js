const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeTimezone,
  resolveScheduleHour,
  getZonedTimeParts,
  msUntilNextHourBoundary,
} = require("../lib/themes/schedule-time.js");
const { computeAutoSwitchTheme } = require("../lib/themes/theme-common.js");

describe("normalizeTimezone", () => {
  it("returns empty for local aliases", () => {
    assert.equal(normalizeTimezone(""), "");
    assert.equal(normalizeTimezone("local"), "");
    assert.equal(normalizeTimezone("LOCAL"), "");
  });

  it("accepts valid IANA ids", () => {
    assert.equal(normalizeTimezone("Europe/Paris"), "Europe/Paris");
    assert.equal(normalizeTimezone(" America/New_York "), "America/New_York");
  });

  it("rejects invalid ids", () => {
    assert.equal(normalizeTimezone("Not/A_Real_Zone"), "");
  });
});

describe("resolveScheduleHour", () => {
  it("uses machine-local hour when timezone is empty", () => {
    const now = new Date(2025, 0, 1, 9, 30, 0);
    assert.equal(resolveScheduleHour(now, ""), 9);
  });

  it("uses the configured IANA timezone", () => {
    const now = new Date("2025-06-15T15:00:00Z");
    assert.equal(getZonedTimeParts(now, "Europe/Paris").hour, 17);
    assert.equal(resolveScheduleHour(now, "Europe/Paris"), 17);
  });
});

describe("computeAutoSwitchTheme with timezone", () => {
  const base = {
    enabled: true,
    darkTheme: "Dusk Office Midnight",
    lightTheme: "Dusk Office Light",
    darkHour: 18,
    lightHour: 7,
    timezone: "Europe/Paris",
  };

  it("picks light theme before the Paris dark hour", () => {
    const now = new Date("2025-06-15T15:00:00Z");
    assert.equal(computeAutoSwitchTheme(base, now), "Dusk Office Light");
  });

  it("picks dark theme once Paris reaches darkHour", () => {
    const now = new Date("2025-06-15T16:00:00Z");
    assert.equal(computeAutoSwitchTheme(base, now), "Dusk Office Midnight");
  });
});

describe("msUntilNextHourBoundary with timezone", () => {
  it("finds the next boundary in the target timezone", () => {
    const now = new Date("2025-06-15T15:30:00Z");
    const ms = msUntilNextHourBoundary(now, [18], "Europe/Paris");
    assert.equal(ms, 30 * 60 * 1000);
  });
});
