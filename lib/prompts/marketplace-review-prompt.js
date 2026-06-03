const vscode = require("vscode");
const keys = require("../core/extension-keys.js");
const cfg = require("../core/configuration.js");
const { isDuskTheme } = require("../themes/theme-common.js");
const log = require("../core/log.js");

const MARKETPLACE_REVIEWS = [
  {
    id: "vscode",
    label: "VS Code Marketplace",
    description: "VS Code, Cursor, Windsurf",
    url: "https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office&ssr=false#review-details",
  },
  {
    id: "openvsx",
    label: "Open VSX",
    description: "VSCodium and other open builds",
    url: "https://open-vsx.org/extension/dekidev/dusk-office/reviews",
  },
  {
    id: "jetbrains",
    label: "JetBrains Marketplace",
    description: "IntelliJ, WebStorm, PyCharm, etc.",
    url: "https://plugins.jetbrains.com/plugin/31875-dusk-office-themes/reviews",
  },
];

const MIN_SESSION_COUNT = 3;
const MIN_USAGE_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function getMarketplaceReviewEnabled() {
  const extCfg = cfg.getExtensionConfig();
  const inspect = extCfg.inspect("marketplaceReview");
  if (inspect?.globalValue !== undefined || inspect?.workspaceValue !== undefined) {
    return extCfg.get("marketplaceReview", true);
  }
  return extCfg.get("marketplaceReviewPrompt", true);
}

function parseMajorVersion(version) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  return Number.isFinite(major) ? major : 0;
}

function getPreferredMarketplaceId(appName = "") {
  const name = String(appName).toLowerCase();
  if (
    name.includes("vscodium") ||
    name.includes("codium") ||
    name.includes("code - oss") ||
    name.includes("code-oss")
  ) {
    return "openvsx";
  }
  return "vscode";
}

function getEditorMarketplaceHint(appName = "") {
  const preferredId = getPreferredMarketplaceId(appName);
  if (preferredId === "openvsx") return "Open VSX";
  const name = String(appName).toLowerCase();
  if (name.includes("cursor")) {
    return "the VS Code Marketplace (where Cursor installs extensions)";
  }
  if (name.includes("windsurf")) {
    return "the VS Code Marketplace (where Windsurf installs extensions)";
  }
  return "the VS Code, Open VSX, or JetBrains Marketplace";
}

function getMarketplaceReviewById(id) {
  return MARKETPLACE_REVIEWS.find((entry) => entry.id === id) ?? MARKETPLACE_REVIEWS[0];
}

function resolvePromptThemeName(context) {
  const fromSetting = cfg.getFavoriteThemeSetting();
  if (isDuskTheme(fromSetting)) return fromSetting;
  const fromState = context?.globalState?.get(keys.FAVORITE_THEME_KEY);
  if (isDuskTheme(fromState)) return fromState;
  const current = cfg.getCurrentTheme();
  return isDuskTheme(current) ? current : "";
}

function buildReviewPromptMessage({ themeName = "", appName = "" } = {}) {
  const themePart = themeName ? `You're using ${themeName}. ` : "";
  const marketplaceHint = getEditorMarketplaceHint(appName);
  return `${themePart}Enjoying Dusk Office? A quick star rating on ${marketplaceHint} helps others discover these themes and improves recommendations.`;
}

function shouldShowMarketplaceReviewPrompt({
  enabled,
  sessionCount,
  firstActivationAt,
  completed,
  dismissedAt,
  now = Date.now(),
}) {
  if (!enabled) return false;
  if (completed) return false;
  if (sessionCount < MIN_SESSION_COUNT) return false;
  if (typeof firstActivationAt === "number" && now - firstActivationAt < MIN_USAGE_MS) return false;
  if (typeof dismissedAt === "number" && now - dismissedAt < DISMISS_COOLDOWN_MS) return false;
  if (dismissedAt === "permanent") return false;
  return true;
}

async function maybeResetReviewStateOnMajorUpgrade(context, extensionVersion) {
  const completedVersion = context.globalState.get(keys.MARKETPLACE_REVIEW_COMPLETED_VERSION_KEY);
  if (!completedVersion) return false;
  if (parseMajorVersion(extensionVersion) <= parseMajorVersion(completedVersion)) return false;

  await context.globalState.update(keys.MARKETPLACE_REVIEW_COMPLETED_KEY, undefined);
  await context.globalState.update(keys.MARKETPLACE_REVIEW_COMPLETED_VERSION_KEY, undefined);
  return true;
}

async function initializeMarketplaceReviewTracking(context) {
  try {
    const version = context.extension.packageJSON?.version || "0.0.0";
    await maybeResetReviewStateOnMajorUpgrade(context, version);

    const firstActivation = context.globalState.get(keys.MARKETPLACE_REVIEW_FIRST_ACTIVATION_KEY);
    if (typeof firstActivation !== "number") {
      await context.globalState.update(keys.MARKETPLACE_REVIEW_FIRST_ACTIVATION_KEY, Date.now());
    }

    const sessions = context.globalState.get(keys.MARKETPLACE_REVIEW_SESSION_COUNT_KEY) || 0;
    await context.globalState.update(keys.MARKETPLACE_REVIEW_SESSION_COUNT_KEY, sessions + 1);
    await maybeShowMarketplaceReviewPrompt(context);
  } catch (err) {
    log.error("initializeMarketplaceReviewTracking", err);
  }
}

async function openMarketplaceReviewUrl(url) {
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

async function openMarketplaceReviewPage(options = {}) {
  const preferredId = options.marketplaceId ?? getPreferredMarketplaceId(vscode.env.appName);
  const preferred = getMarketplaceReviewById(preferredId);

  const items = MARKETPLACE_REVIEWS.map((entry) => ({
    label: entry.label,
    description: entry.description,
    detail: entry.id === preferredId ? "Suggested for this editor" : "Leave a star rating",
    _entry: entry,
  }));

  // Note: showQuickPick has no `activeItems` option (that's a QuickPick property),
  // so a preferred entry cannot be pre-highlighted here without createQuickPick.
  const picked = await vscode.window.showQuickPick(items, {
    title: "Rate Dusk Office — choose a marketplace",
    placeHolder: "Pick where you installed Dusk Office to leave a star rating",
    matchOnDescription: true,
  });

  if (!picked?._entry) {
    if (options.fallbackToPreferred) {
      await openMarketplaceReviewUrl(preferred.url);
      return preferred.id;
    }
    return null;
  }

  await openMarketplaceReviewUrl(picked._entry.url);
  return picked._entry.id;
}

async function markMarketplaceReviewCompleted(context) {
  const version = context.extension.packageJSON?.version || "0.0.0";
  await context.globalState.update(keys.MARKETPLACE_REVIEW_COMPLETED_KEY, true);
  await context.globalState.update(keys.MARKETPLACE_REVIEW_COMPLETED_VERSION_KEY, version);
}

async function maybeShowMarketplaceReviewPrompt(context) {
  try {
    if (!getMarketplaceReviewEnabled()) return false;

    const sessionCount = context.globalState.get(keys.MARKETPLACE_REVIEW_SESSION_COUNT_KEY) || 0;
    const firstActivationAt = context.globalState.get(keys.MARKETPLACE_REVIEW_FIRST_ACTIVATION_KEY);
    const completed = context.globalState.get(keys.MARKETPLACE_REVIEW_COMPLETED_KEY) === true;
    const dismissedAt = context.globalState.get(keys.MARKETPLACE_REVIEW_DISMISSED_KEY);

    if (
      !shouldShowMarketplaceReviewPrompt({
        enabled: true,
        sessionCount,
        firstActivationAt,
        completed,
        dismissedAt,
      })
    ) {
      return false;
    }

    const rate = "Rate on Marketplace";
    const later = "Later";
    const never = "Don't ask again";
    const choice = await vscode.window.showInformationMessage(
      buildReviewPromptMessage({
        themeName: resolvePromptThemeName(context),
        appName: vscode.env.appName,
      }),
      rate,
      later,
      never,
    );

    if (choice === rate) {
      const marketplaceId = await openMarketplaceReviewPage();
      if (marketplaceId) {
        await markMarketplaceReviewCompleted(context);
      }
      return Boolean(marketplaceId);
    }
    if (choice === later) {
      await context.globalState.update(keys.MARKETPLACE_REVIEW_DISMISSED_KEY, Date.now());
      return true;
    }
    if (choice === never) {
      await context.globalState.update(keys.MARKETPLACE_REVIEW_DISMISSED_KEY, "permanent");
      await cfg.updateConfigValue(cfg.getExtensionConfig(), "marketplaceReview", false);
      return true;
    }
    return false;
  } catch (err) {
    log.error("maybeShowMarketplaceReviewPrompt", err);
    return false;
  }
}

module.exports = {
  MARKETPLACE_REVIEWS,
  MIN_SESSION_COUNT,
  MIN_USAGE_MS,
  DISMISS_COOLDOWN_MS,
  getMarketplaceReviewEnabled,
  parseMajorVersion,
  getPreferredMarketplaceId,
  getEditorMarketplaceHint,
  getMarketplaceReviewById,
  resolvePromptThemeName,
  buildReviewPromptMessage,
  shouldShowMarketplaceReviewPrompt,
  maybeResetReviewStateOnMajorUpgrade,
  initializeMarketplaceReviewTracking,
  openMarketplaceReviewUrl,
  openMarketplaceReviewPage,
  maybeShowMarketplaceReviewPrompt,
};
