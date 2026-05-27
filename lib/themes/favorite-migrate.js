const { isDuskTheme } = require("./theme-common.js");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const themes = require("./themes.js");
const log = require("../core/log.js");

/** Sync favoriteTheme setting ↔ globalState (one-time migration from pre-1.2.1 state). */
async function migrateFavoriteTheme(context) {
  try {
    const fromSetting = cfg.getFavoriteThemeSetting();
    const fromState = context.globalState.get(keys.FAVORITE_THEME_KEY);

    if (isDuskTheme(fromSetting)) {
      if (fromState !== fromSetting) {
        await context.globalState.update(keys.FAVORITE_THEME_KEY, fromSetting);
      }
      return;
    }
    if (isDuskTheme(fromState)) {
      await themes.persistFavoriteTheme(context, fromState);
    }
  } catch (err) {
    log.error("migrateFavoriteTheme", err);
  }
}

module.exports = { migrateFavoriteTheme };
