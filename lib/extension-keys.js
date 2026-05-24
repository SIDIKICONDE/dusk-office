exports.PREVIOUS_THEME_KEY = "duskOffice.previousTheme";
exports.FAVORITE_THEME_KEY = "duskOffice.favoriteTheme";
exports.WORKSPACE_THEME_KEY = "duskOffice.workspaceTheme";
exports.WORKSPACE_ACTIVATION_PROMPT_KEY = "duskOffice.activationPromptShown";
/** Set once a fingerprint suggestion has been shown for the workspace (any decision: accept/dismiss/explore). */
exports.WORKSPACE_FINGERPRINT_KEY = "duskOffice.workspaceFingerprintShown";
/** Stored global `window.titleBarStyle` before forcing `custom`; `__unset__` = no user global (restore with undefined). */
exports.PREVIOUS_TITLE_BAR_GLOBAL_KEY = "duskOffice.previousTitleBarStyleGlobal";
exports.PREVIOUS_TITLE_BAR_GLOBAL_UNSET = "__duskOfficeUnset__";
/** Global `workbench.productIconTheme` before applying Dusk product icons; UNSET = was default / empty. */
exports.PREVIOUS_PRODUCT_ICON_KEY = "duskOffice.previousProductIconTheme";
exports.PREVIOUS_PRODUCT_ICON_UNSET = "__duskOfficeUnset__";

/** True after the Get Started walkthrough has been opened at least once (global, persists across workspaces). */
exports.WALKTHROUGH_SHOWN_KEY = "duskOffice.walkthroughShown";

exports.STATUS_BAR_PRIORITY = 100;
