/** Set in activate from `contributes.productIconThemes[].id`. */
exports.duskProductIconThemeId = "";
exports.ignoreTitleBarStyleConfigChange = false;
/**
 * Timestamp of the last manual theme change. Auto-switch and adaptive focus
 * respect this by skipping their next cycle if the manual override is recent
 * (within MANUAL_OVERRIDE_GRACE_MS). This prevents automation from immediately
 * undoing a user-initiated theme pick (fingerprint suggestion, favorite, variant picker).
 */
exports.lastManualThemeApplyTime = 0;
exports.MANUAL_OVERRIDE_GRACE_MS = 5000;
