const { describe, it } = require("node:test");
const { doesNotMatch, match } = require("node:assert/strict");

const { renderGalleryHtml } = require("../lib/ui/theme-gallery.js");

describe("renderGalleryHtml", () => {
  it("renders apply buttons and does not wire hover preview", () => {
    const html = renderGalleryHtml(undefined);
    match(html, /type: "apply"/);
    match(html, /data-theme="/);
    match(html, /<strong>Apply<\/strong>/);
    doesNotMatch(html, /mouseenter/);
    doesNotMatch(html, /type: "preview"/);
  });
});
