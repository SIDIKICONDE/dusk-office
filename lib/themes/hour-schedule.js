/**
 * Schedule helpers for day/night automation — fire at exact hour boundaries
 * instead of polling every minute.
 */

const {
  normalizeTimezone,
  msUntilNextHourBoundary,
  nextOccurrenceOfLocalHour,
} = require("./schedule-time.js");

/** @deprecated Use schedule-time exports directly in new code. */
function nextOccurrenceOfHour(now, hour) {
  return nextOccurrenceOfLocalHour(now, hour);
}

/** @param {{ enabled?: boolean; lightHour?: number; darkHour?: number; timezone?: string }} autoSwitch */
function getAutoSwitchBoundaryHours(autoSwitch) {
  if (!autoSwitch?.enabled) return { hours: [], timezone: "" };
  if (autoSwitch.lightHour === autoSwitch.darkHour) {
    return { hours: [], timezone: normalizeTimezone(autoSwitch.timezone) };
  }
  return {
    hours: [autoSwitch.lightHour, autoSwitch.darkHour],
    timezone: normalizeTimezone(autoSwitch.timezone),
  };
}

/** @param {{ enabled?: boolean; dayStartHour?: number; dayEndHour?: number; lateNightEyeComfort?: boolean; lateNightStartHour?: number; lateNightEndHour?: number; timezone?: string }} adaptiveCfg */
function getAdaptiveFocusBoundaryHours(adaptiveCfg) {
  if (!adaptiveCfg?.enabled) return { hours: [], timezone: "" };
  const hours = [adaptiveCfg.dayStartHour, adaptiveCfg.dayEndHour];
  if (adaptiveCfg.lateNightEyeComfort) {
    hours.push(adaptiveCfg.lateNightStartHour, adaptiveCfg.lateNightEndHour);
  }
  return {
    hours,
    timezone: normalizeTimezone(adaptiveCfg.timezone),
  };
}

module.exports = {
  nextOccurrenceOfHour,
  msUntilNextHourBoundary,
  getAutoSwitchBoundaryHours,
  getAdaptiveFocusBoundaryHours,
};