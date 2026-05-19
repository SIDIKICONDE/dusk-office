const autoAdaptive = require("./auto-adaptive.js");
const { migrateFavoriteTheme } = require("./favorite-migrate.js");

async function initializeStartupBehavior(context) {
  await migrateFavoriteTheme(context);
  if (await autoAdaptive.applyAdaptiveFocusTheme(context)) return;
  if (await autoAdaptive.runAutoSwitch(context)) return;
  if (await autoAdaptive.restoreWorkspaceTheme(context)) return;
  await autoAdaptive.applyFavoriteOnStartup(context);
}

module.exports = { initializeStartupBehavior };
