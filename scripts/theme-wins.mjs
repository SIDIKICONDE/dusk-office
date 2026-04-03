/**
 * Clés `colors` où la variante garde la priorité sur `buildExtended` (merge-extended-ui-colors).
 * Export partagé avec extract-theme-sources.mjs.
 * @param {string} k
 */
export function themeWinsForKey(k) {
  if (k.startsWith("editorGroup.")) return false;
  if (k.startsWith("editorStickyScroll")) return false;
  if (k.startsWith("editorSuggestWidget")) return false;
  if (k.startsWith("editorHoverWidget")) return false;
  if (k.startsWith("editor.")) return true;
  if (k.startsWith("editorLineNumber")) return true;
  if (k.startsWith("editorGutter.")) return true;
  if (k.startsWith("editorBracket")) return true;
  if (k.startsWith("editorInlayHint")) return true;
  if (k.startsWith("editorGhost")) return true;
  if (k.startsWith("editorWhitespace")) return true;
  if (k.startsWith("editorOverviewRuler")) return true;
  if (k.startsWith("minimap.")) return true;
  if (k.startsWith("diffEditor.")) return true;
  if (k.startsWith("merge.")) return true;
  if (k.startsWith("inlineChat")) return true;
  if (k.startsWith("inlineEdit")) return true;
  if (k.startsWith("peekView")) return true;
  if (k.startsWith("notebook.")) return true;
  if (k.startsWith("welcomePage.")) return true;
  return false;
}

/** Fichiers dusk-*.json traités par merge-extended-ui-colors (id sans .json). */
export const PALETTE_VARIANT_IDS = [
  "dusk-minuit",
  "dusk-abime",
  "dusk-recif",
  "dusk-baie",
  "dusk-aube",
  "dusk-brume",
  "dusk-cendre",
  "dusk-nebuleuse",
  "dusk-nocturne",
  "dusk-finance",
  "dusk-corporate",
];

/** Slugs avec semantic/token générés par merge-syntax-into-variants.mjs */
export const SYNTAX_MERGE_SLUGS = [
  "abime",
  "aube",
  "baie",
  "brume",
  "cendre",
  "corporate",
  "finance",
  "minuit",
  "nebuleuse",
  "nocturne",
  "recif",
];

/** @param {string} fileBase ex. dusk-abime */
export function idToSyntaxSlug(fileBase) {
  return fileBase.replace(/^dusk-/, "");
}
