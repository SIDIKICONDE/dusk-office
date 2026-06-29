/**
 * Hour resolution and boundary scheduling for Auto Switch / Adaptive Focus.
 * Supports machine-local time (default) or an IANA timezone (e.g. Europe/Paris).
 */

/**
 * @param {string} timezone
 * @returns {boolean}
 */
function isValidTimezone(timezone) {
  if (typeof timezone !== "string" || !timezone.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} value
 * @returns {string} IANA id or "" for machine-local
 */
function normalizeTimezone(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "local") return "";
  return isValidTimezone(trimmed) ? trimmed : "";
}

/**
 * @param {Date} date
 * @param {string} timezone
 */
function getZonedTimeParts(date, timezone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  /** @type {Record<string, string>} */
  const parts = {};
  for (const piece of fmt.formatToParts(date)) {
    if (piece.type !== "literal") parts[piece.type] = piece.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/**
 * @param {Date} now
 * @param {string} [timezone]
 * @returns {number} 0–23
 */
function resolveScheduleHour(now, timezone = "") {
  const tz = normalizeTimezone(timezone);
  if (!tz) return now.getHours();
  return getZonedTimeParts(now, tz).hour;
}

/**
 * @param {Date} now
 * @param {number} hour 0–23
 * @returns {Date}
 */
function nextOccurrenceOfLocalHour(now, hour) {
  const next = new Date(now.getTime());
  next.setMinutes(0, 0, 0);
  next.setHours(hour);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * @param {Date} now
 * @param {number} targetHour 0–23
 * @param {string} timezone
 * @returns {Date}
 */
function nextOccurrenceOfZonedHour(now, targetHour, timezone) {
  const tz = normalizeTimezone(timezone);
  if (!tz) return nextOccurrenceOfLocalHour(now, targetHour);

  const start = now.getTime();
  const firstMinute = Math.ceil(start / 60000) * 60000;
  const maxAheadMs = 26 * 60 * 60 * 1000;

  for (let t = firstMinute; t <= start + maxAheadMs; t += 60000) {
    const candidate = new Date(t);
    const parts = getZonedTimeParts(candidate, tz);
    if (parts.hour === targetHour && parts.minute === 0 && t > start) {
      return candidate;
    }
  }

  return new Date(start + maxAheadMs);
}

/**
 * @param {Date} now
 * @param {number[]} boundaryHours
 * @param {string} [timezone]
 * @returns {number | null}
 */
function msUntilNextHourBoundary(now, boundaryHours, timezone = "") {
  if (!Array.isArray(boundaryHours) || !boundaryHours.length) return null;

  const unique = [...new Set(boundaryHours.filter((h) => Number.isInteger(h) && h >= 0 && h <= 23))];
  if (!unique.length) return null;

  const tz = normalizeTimezone(timezone);
  let earliestMs = null;

  for (const hour of unique) {
    const at = tz
      ? nextOccurrenceOfZonedHour(now, hour, tz)
      : nextOccurrenceOfLocalHour(now, hour);
    const ms = at.getTime() - now.getTime();
    if (earliestMs === null || ms < earliestMs) earliestMs = ms;
  }

  return earliestMs;
}

module.exports = {
  isValidTimezone,
  normalizeTimezone,
  getZonedTimeParts,
  resolveScheduleHour,
  nextOccurrenceOfLocalHour,
  nextOccurrenceOfZonedHour,
  msUntilNextHourBoundary,
};
