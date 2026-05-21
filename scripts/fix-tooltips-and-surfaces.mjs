#!/usr/bin/env node
/**
 * Fix missing tooltip backgrounds and panel/sidebar surface gaps
 * across all Dusk Office theme files.
 *
 * Usage:  node scripts/fix-tooltips-and-surfaces.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const DRY = process.argv.includes("--dry-run");
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "themes");
const files = readdirSync(dir).filter(f => f.endsWith(".json") && f !== "dusk-hc.json").sort();

const h2r = h => { h = h.replace("#",""); if(h.length>6) h=h.slice(0,6); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
const L = rgb => 0.2126*((rgb[0]/255)<=0.03928?rgb[0]/255/12.92:Math.pow((rgb[0]/255+0.055)/1.055,2.4)) + 0.7152*((rgb[1]/255)<=0.03928?rgb[1]/255/12.92:Math.pow((rgb[1]/255+0.055)/1.055,2.4)) + 0.0722*((rgb[2]/255)<=0.03928?rgb[2]/255/12.92:Math.pow((rgb[2]/255+0.055)/1.055,2.4));
const S = h => h.length > 7 ? h.slice(0,7) : h;

let tooltipFixed = 0, panelFixed = 0, sidebarFixed = 0;

for (const f of files) {
  const fp = join(dir, f);
  const j = JSON.parse(readFileSync(fp, "utf8"));
  const c = j.colors;
  let changed = false;

  // --- FIX 1: Missing tooltip backgrounds ---
  if (!c["editorSuggestWidget.background"] && c["activityBar.background"]) {
    const ttBg = c["activityBar.background"];
    c["editorSuggestWidget.background"] = ttBg;
    c["editorHoverWidget.background"] = ttBg;
    tooltipFixed++;
    changed = true;
    console.log(`  [tooltip] ${f}: set suggest+hover bg = ${ttBg}`);
  }

  // --- FIX 2: Sidebar gap (>2% luminance diff from editor) ---
  const eb = S(c["editor.background"] || "#000");
  const sb = S(c["sideBar.background"] || "");
  if (sb) {
    const sbD = Math.abs(L(h2r(eb)) - L(h2r(sb)));
    if (sbD > 0.02) {
      c["sideBar.background"] = eb;
      sidebarFixed++;
      changed = true;
      console.log(`  [sidebar] ${f}: ${sb} → ${eb} (gap was ${(sbD*100).toFixed(1)}%)`);
    }
  }

  // --- FIX 3: Panel gap (>3% luminance diff from editor) ---
  const pb = S(c["panel.background"] || "");
  if (pb) {
    const pbD = Math.abs(L(h2r(eb)) - L(h2r(pb)));
    if (pbD > 0.03) {
      // Move panel closer: average of editor and current panel
      const ebRgb = h2r(eb), pbRgb = h2r(pb);
      const mid = ebRgb.map((v, i) => Math.round(v * 0.6 + pbRgb[i] * 0.4));
      const midHex = "#" + mid.map(v => v.toString(16).padStart(2, "0")).join("");
      c["panel.background"] = midHex;
      panelFixed++;
      changed = true;
      console.log(`  [panel] ${f}: ${pb} → ${midHex} (gap was ${(pbD*100).toFixed(1)}%)`);
    }
  }

  if (changed && !DRY) {
    writeFileSync(fp, JSON.stringify(j, null, 2) + "\n");
  }
}

console.log(`\nDone: tooltips=${tooltipFixed} sidebars=${sidebarFixed} panels=${panelFixed}` + (DRY ? " (DRY RUN)" : ""));
