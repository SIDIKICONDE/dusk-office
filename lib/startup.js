const autoAdaptive = require("./auto-adaptive.js");
const { migrateFavoriteTheme } = require("./favorite-migrate.js");
const log = require("./log.js");

async function initializeStartupBehavior(context) {
  try {
    await migrateFavoriteTheme(context);
    if (await autoAdaptive.applyAdaptiveFocusTheme(context)) return;
    if (await autoAdaptive.runAutoSwitch(context)) return;
    if (await autoAdaptive.restoreWorkspaceTheme(context)) return;
    await autoAdaptive.applyFavoriteOnStartup(context);
  } catch (err) {
    log.error("initializeStartupBehavior", err);
  }
}

module.exports = { initializeStartupBehavior };
