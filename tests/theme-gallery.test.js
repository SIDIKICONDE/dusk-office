const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { resolveGalleryRevertTheme, renderGalleryHtml } = require("../lib/ui/theme-gallery.js");

describe("resolveGalleryRevertTheme", () => {
  it("reverts to the theme active when the gallery opened", () => {
    assert.equal(resolveGalleryRevertTheme(null, "Dusk Office Midnight"), "Dusk Office Midnight");
  });

  it("keeps the last applied theme after Apply was clicked", () => {
    assert.equal(
      resolveGalleryRevertTheme("Dusk Office Vault", "Dusk Office Midnight"),
      "Dusk Office Vault",
    );
  });
});

describe("renderGalleryHtml", () => {
  it("includes hover preview wiring in the webview", () => {
    const html = renderGalleryHtml(undefined);
    assert.match(html, /mouseenter/);
    assert.match(html, /type: "preview"/);
    assert.match(html, /data-theme="/);
    assert.match(html, /Hover<\/strong> to preview/);
  });
});
