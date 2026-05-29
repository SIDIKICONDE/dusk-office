/**
 * Encapsulated extension state. Replaces bare mutable exports with a single
 * object that can be reset (hot-reload, tests) without stale references.
 */
const state = {
  /** Set in activate from `contributes.productIconThemes[].id`. */
  duskProductIconThemeId: "",
  /** Counter: each title-bar write increments; the config listener only ignores
   *  events while the count is > 0. Replaces the old boolean flag to prevent
   *  race conditions when overlapping writes reset the flag prematurely. */
  _titleBarIgnoreCount: 0,
  /**
   * Timestamp of the last manual theme change. Auto-switch and adaptive focus
   * respect this by skipping their next cycle if the manual override is recent
   * (within MANUAL_OVERRIDE_GRACE_MS). This prevents automation from immediately
   * undoing a user-initiated theme pick (fingerprint suggestion, favorite, variant picker).
   */
  lastManualThemeApplyTime: 0,
  MANUAL_OVERRIDE_GRACE_MS: 5000,
  /** True while a theme Quick Pick is open — prevents auto-switch / adaptive
   *  focus from changing the theme mid-preview. */
  isQuickPickOpen: false,
  /** Reset all mutable state to defaults (useful for tests / hot-reload). */
  reset() {
    state.duskProductIconThemeId = "";
    state._titleBarIgnoreCount = 0;
    state.lastManualThemeApplyTime = 0;
    state.isQuickPickOpen = false;
  },
};

module.exports = state;
