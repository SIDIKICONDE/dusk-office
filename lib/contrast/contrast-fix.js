const { luminance, contrastRatio, parseColor } = require("../terminal/terminal-contrast.js");

/**
 * Deterministic, hue-preserving color nudges used by scripts/fix-ui-contrast.mjs
 * to lift failing pairs to a target WCAG ratio. Kept pure and dependency-light so
 * the same math is unit-tested and reused by the build pass (single source of
 * truth with lib/contrast/ui-contrast.js).
 *
 * Strategy: move a color's luminance by scaling its channels toward white
 * (lighten) or toward black (darken). Scaling toward black preserves hue exactly;
 * scaling toward white desaturates slightly but keeps the family. We step in
 * small increments and stop as soon as the *measured* ratio clears the target,
 * so the result is stable under re-measurement (idempotent: a passing pair is
 * never revisited by the checker).
 */

const STEP = 0.02;
const MARGIN = 0.12; // clear the threshold by a hair so the checker agrees

function clamp8(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex({ r, g, b }) {
  const h = (n) => clamp8(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Parse to opaque RGB (drops any alpha — used when baking translucent chips). */
function toRgb(hex) {
  const parsed = parseColor(hex);
  if (!parsed) return null;
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

function lighten(rgb, t) {
  return { r: rgb.r + (255 - rgb.r) * t, g: rgb.g + (255 - rgb.g) * t, b: rgb.b + (255 - rgb.b) * t };
}

function darken(rgb, t) {
  return { r: rgb.r * (1 - t), g: rgb.g * (1 - t), b: rgb.b * (1 - t) };
}

/**
 * Return a hex color whose contrast against `bgRgb` reaches `minRatio` (+margin),
 * preferring to move in `prefer` direction ("auto" picks the side the color
 * already leans relative to the background). Returns the original hex if it
 * already passes or if no direction can reach the target.
 *
 * @param {string} hex source color (#RGB/#RRGGBB/#RRGGBBAA — alpha dropped)
 * @param {{r:number,g:number,b:number}} bgRgb opaque background
 * @param {number} minRatio target contrast ratio
 * @param {"auto"|"lighter"|"darker"} [prefer]
 */
function adjustColorForContrast(hex, bgRgb, minRatio, prefer = "auto") {
  const rgb = toRgb(hex);
  if (!rgb || !bgRgb) return hex;
  const bgL = luminance(bgRgb);
  const target = minRatio + MARGIN;
  if (contrastRatio(luminance(rgb), bgL) >= target) return hex;

  const direction = prefer === "auto" ? (luminance(rgb) >= bgL ? "lighter" : "darker") : prefer;
  const order = direction === "lighter" ? ["lighter", "darker"] : ["darker", "lighter"];

  for (const dir of order) {
    let last = rgb;
    for (let t = STEP; t <= 1 + 1e-9; t += STEP) {
      const candidate = dir === "lighter" ? lighten(rgb, t) : darken(rgb, t);
      last = candidate;
      if (contrastRatio(luminance(candidate), bgL) >= target) {
        return rgbToHex(candidate);
      }
    }
    // Even the extreme of this direction was not enough — try the other side.
    if (contrastRatio(luminance(last), bgL) >= minRatio) {
      return rgbToHex(last);
    }
  }
  return hex;
}

/**
 * Fix a translucent / muddy component background (badge, activity-bar badge) so
 * its ink `fgHex` reads. First bakes the chip opaque (translucency is what kills
 * these), then, if still short, nudges the background away from the ink color.
 *
 * @param {string} bgHex chip background (often #RRGGBBAA)
 * @param {string} fgHex ink color rendered on the chip
 * @param {number} minRatio target ratio
 */
function fixComponentBackground(bgHex, fgHex, minRatio) {
  const fgRgb = toRgb(fgHex);
  const opaque = toRgb(bgHex);
  if (!fgRgb || !opaque) return bgHex;
  const opaqueHex = rgbToHex(opaque);
  if (contrastRatio(luminance(opaque), luminance(fgRgb)) >= minRatio + MARGIN) {
    return opaqueHex;
  }
  // Push the chip away from the ink: lighten for dark ink, darken for light ink.
  const prefer = luminance(fgRgb) < 0.5 ? "lighter" : "darker";
  return adjustColorForContrast(opaqueHex, fgRgb, minRatio, prefer);
}

module.exports = {
  MARGIN,
  rgbToHex,
  toRgb,
  adjustColorForContrast,
  fixComponentBackground,
};
