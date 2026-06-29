const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  nextOccurrenceOfHour,
  msUntilNextHourBoundary,
  getAutoSwitchBoundaryHours,
  getAdaptiveFocusBoundaryHours,
} = require("../lib/themes/hour-schedule.js");

describe("nextOccurrenceOfHour", () => {
  it("returns later today when the hour is still ahead", () => {
    const now = new Date(2025, 0, 1, 12, 30, 0);
    const next = nextOccurrenceOfHour(now, 18);
    assert.equal(next.getHours(), 18);
    assert.equal(next.getMinutes(), 0);
    assert.equal(next.getDate(), 1);
  });

  it("wraps to tomorrow when the hour already passed", () => {
    const now = new Date(2025, 0, 1, 20, 0, 0);
    const next = nextOccurrenceOfHour(now, 7);
    assert.equal(next.getHours(), 7);
    assert.equal(next.getDate(), 2);
  });

  it("wraps to tomorrow when now is exactly on the boundary", () => {
    const now = new Date(2025, 0, 1, 18, 0, 0);
    const next = nextOccurrenceOfHour(now, 18);
    assert.equal(next.getDate(), 2);
    assert.equal(next.getHours(), 18);
  });
});

describe("msUntilNextHourBoundary", () => {
  it("picks the nearest configured boundary", () => {
    const now = new Date(2025, 0, 1, 12, 30, 0);
    const ms = msUntilNextHourBoundary(now, [7, 18]);
    assert.equal(ms, 5.5 * 60 * 60 * 1000);
  });

  it("wraps to the next day after the last boundary", () => {
    const now = new Date(2025, 0, 1, 20, 0, 0);
    const ms = msUntilNextHourBoundary(now, [7, 18]);
    assert.equal(ms, 11 * 60 * 60 * 1000);
  });

  it("returns null for empty boundaries", () => {
    assert.equal(msUntilNextHourBoundary(new Date(), []), null);
  });

  it("schedules against an IANA timezone", () => {
    const now = new Date("2025-06-15T15:30:00Z");
    const ms = msUntilNextHourBoundary(now, [18], "Europe/Paris");
    assert.ok(ms > 0);
    assert.ok(ms <= 3 * 60 * 60 * 1000);
  });
});

describe("getAutoSwitchBoundaryHours", () => {
  it("returns both hours when enabled and distinct", () => {
    assert.deepEqual(
      getAutoSwitchBoundaryHours({ enabled: true, lightHour: 7, darkHour: 18 }),
      { hours: [7, 18], timezone: "" },
    );
  });

  it("returns empty when light and dark hour match", () => {
    assert.deepEqual(
      getAutoSwitchBoundaryHours({ enabled: true, lightHour: 18, darkHour: 18 }),
      { hours: [], timezone: "" },
    );
  });

  it("passes through a valid timezone", () => {
    assert.deepEqual(
      getAutoSwitchBoundaryHours({
        enabled: true,
        lightHour: 7,
        darkHour: 18,
        timezone: "Europe/Paris",
      }),
      { hours: [7, 18], timezone: "Europe/Paris" },
    );
  });
});

describe("getAdaptiveFocusBoundaryHours", () => {
  it("includes late-night hours when eye comfort is on", () => {
    assert.deepEqual(
      getAdaptiveFocusBoundaryHours({
        enabled: true,
        dayStartHour: 7,
        dayEndHour: 18,
        lateNightEyeComfort: true,
        lateNightStartHour: 22,
        lateNightEndHour: 5,
      }),
      { hours: [7, 18, 22, 5], timezone: "" },
    );
  });

  it("omits late-night hours when eye comfort is off", () => {
    assert.deepEqual(
      getAdaptiveFocusBoundaryHours({
        enabled: true,
        dayStartHour: 7,
        dayEndHour: 18,
        lateNightEyeComfort: false,
      }),
      { hours: [7, 18], timezone: "" },
    );
  });
});
