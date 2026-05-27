const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  ENGAGEMENT_THRESHOLD,
  MIN_SESSION_COUNT,
  MIN_USAGE_MS,
  DISMISS_COOLDOWN_MS,
  getEngagementIncrement,
  getPreferredMarketplaceId,
  getEditorMarketplaceHint,
  getMarketplaceReviewById,
  parseMajorVersion,
  buildReviewPromptMessage,
  shouldShowMarketplaceReviewPrompt,
} = require("../lib/prompts/marketplace-review-prompt.js");

describe("marketplace-review-prompt", () => {
  describe("getEngagementIncrement", () => {
    it("weights favorite and quick setup higher than a single theme change", () => {
      assert.equal(getEngagementIncrement("favorite"), 2);
      assert.equal(getEngagementIncrement("quickSetup"), 2);
      assert.equal(getEngagementIncrement("themeConfirmed"), 1);
      assert.equal(getEngagementIncrement("fingerprintAccept"), 1);
      assert.equal(getEngagementIncrement("adaptiveFocusEnabled"), 1);
      assert.equal(getEngagementIncrement("autoSwitchEnabled"), 1);
    });

    it("returns 0 for unknown triggers", () => {
      assert.equal(getEngagementIncrement("unknown"), 0);
    });
  });

  describe("getPreferredMarketplaceId", () => {
    it("suggests Open VSX for VSCodium", () => {
      assert.equal(getPreferredMarketplaceId("VSCodium"), "openvsx");
      assert.equal(getPreferredMarketplaceId("Code - OSS"), "openvsx");
    });

    it("suggests VS Code Marketplace for other editors", () => {
      assert.equal(getPreferredMarketplaceId("Visual Studio Code"), "vscode");
      assert.equal(getPreferredMarketplaceId("Cursor"), "vscode");
      assert.equal(getPreferredMarketplaceId("Windsurf"), "vscode");
    });
  });

  describe("getEditorMarketplaceHint", () => {
    it("mentions Cursor-specific marketplace wording", () => {
      assert.match(getEditorMarketplaceHint("Cursor"), /Cursor installs extensions/);
    });

    it("mentions Open VSX for VSCodium", () => {
      assert.equal(getEditorMarketplaceHint("VSCodium"), "Open VSX");
    });
  });

  describe("buildReviewPromptMessage", () => {
    it("includes the active theme when provided", () => {
      assert.match(
        buildReviewPromptMessage({ themeName: "Dusk Office Midnight", appName: "Cursor" }),
        /Dusk Office Midnight/,
      );
    });
  });

  describe("parseMajorVersion", () => {
    it("extracts the major semver segment", () => {
      assert.equal(parseMajorVersion("1.3.6"), 1);
      assert.equal(parseMajorVersion("2.0.0"), 2);
    });
  });

  describe("getMarketplaceReviewById", () => {
    it("returns all three marketplace review destinations", () => {
      assert.equal(getMarketplaceReviewById("vscode").label, "VS Code Marketplace");
      assert.equal(getMarketplaceReviewById("openvsx").label, "Open VSX");
      assert.equal(getMarketplaceReviewById("jetbrains").label, "JetBrains Marketplace");
    });

    it("falls back to VS Code Marketplace for unknown ids", () => {
      assert.equal(getMarketplaceReviewById("unknown").id, "vscode");
    });
  });

  describe("shouldShowMarketplaceReviewPrompt", () => {
    const now = 10_000_000;
    const base = {
      enabled: true,
      engagementCount: ENGAGEMENT_THRESHOLD,
      sessionCount: MIN_SESSION_COUNT,
      firstActivationAt: now - MIN_USAGE_MS,
      completed: false,
      dismissedAt: undefined,
      now,
    };

    it("requires enough engagement before showing", () => {
      assert.equal(
        shouldShowMarketplaceReviewPrompt({ ...base, engagementCount: ENGAGEMENT_THRESHOLD - 1 }),
        false,
      );
      assert.equal(
        shouldShowMarketplaceReviewPrompt({ ...base, engagementCount: ENGAGEMENT_THRESHOLD }),
        true,
      );
    });

    it("requires enough sessions before showing", () => {
      assert.equal(
        shouldShowMarketplaceReviewPrompt({ ...base, sessionCount: MIN_SESSION_COUNT - 1 }),
        false,
      );
      assert.equal(
        shouldShowMarketplaceReviewPrompt({ ...base, sessionCount: MIN_SESSION_COUNT }),
        true,
      );
    });

    it("requires minimum usage time before showing", () => {
      assert.equal(
        shouldShowMarketplaceReviewPrompt({
          ...base,
          firstActivationAt: now - MIN_USAGE_MS + 1,
        }),
        false,
      );
      assert.equal(
        shouldShowMarketplaceReviewPrompt({
          ...base,
          firstActivationAt: now - MIN_USAGE_MS,
        }),
        true,
      );
    });

    it("respects disabled setting and completed state", () => {
      assert.equal(shouldShowMarketplaceReviewPrompt({ ...base, enabled: false }), false);
      assert.equal(shouldShowMarketplaceReviewPrompt({ ...base, completed: true }), false);
    });

    it("honors permanent dismiss", () => {
      assert.equal(
        shouldShowMarketplaceReviewPrompt({ ...base, dismissedAt: "permanent" }),
        false,
      );
    });

    it("honors Later cooldown then allows again", () => {
      assert.equal(
        shouldShowMarketplaceReviewPrompt({
          ...base,
          dismissedAt: now - DISMISS_COOLDOWN_MS + 1,
        }),
        false,
      );
      assert.equal(
        shouldShowMarketplaceReviewPrompt({
          ...base,
          dismissedAt: now - DISMISS_COOLDOWN_MS,
        }),
        true,
      );
    });
  });
});
