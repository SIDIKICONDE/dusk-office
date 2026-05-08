#!/usr/bin/env node
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const dir = new URL("../themes", import.meta.url).pathname;
const files = readdirSync(dir).filter(f => f.endsWith(".json") && f !== "dusk-hc.json").sort();

const h2r = h => { h = h.replace("#",""); if(h.length>6) h=h.slice(0,6); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
const L = rgb => 0.2126*((rgb[0]/255)<=0.03928?rgb[0]/255/12.92:Math.pow((rgb[0]/255+0.055)/1.055,2.4)) + 0.7152*((rgb[1]/255)<=0.03928?rgb[1]/255/12.92:Math.pow((rgb[1]/255+0.055)/1.055,2.4)) + 0.0722*((rgb[2]/255)<=0.03928?rgb[2]/255/12.92:Math.pow((rgb[2]/255+0.055)/1.055,2.4));
const CR = (a,b) => { const l1=L(h2r(a)),l2=L(h2r(b)); return Math.round(((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05))*100)/100; };
const S = h => h.length > 7 ? h.slice(0,7) : h;

const basic = ["class","function","variable","keyword","string","comment","number","type","interface","namespace"];
const results = [];

for (const f of files) {
  const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const c = j.colors || {}, s = j.semanticTokenColors || {}, t = j.tokenColors || [];
  const nm = j.name || f;
  const tp = j.type || (L(h2r(S(c["editor.background"]||"#000"))) > 0.4 ? "light" : "dark");
  const eb = S(c["editor.background"]||"#000"), ef = S(c["editor.foreground"]||"#fff");
  const sb = S(c["sideBar.background"]||""), pb = S(c["panel.background"]||"");
  const sug = c["editorSuggestWidget.background"] ? S(c["editorSuggestWidget.background"]) : "";
  const hov = c["editorHoverWidget.background"] ? S(c["editorHoverWidget.background"]) : "";
  const cr = CR(ef, eb);
  const sbD = sb ? Math.abs(L(h2r(eb)) - L(h2r(sb))) : 0;
  const pbD = pb ? Math.abs(L(h2r(eb)) - L(h2r(pb))) : 0;
  const semK = Object.keys(s);
  const hasSem = basic.every(k => semK.includes(k));
  const missTT = !sug || !hov;
  const is = [], st = [];

  if (cr >= 7) st.push("AAA(" + cr + ")");
  else if (cr >= 4.5) st.push("AA(" + cr + ")");
  else is.push("LOW(" + cr + ")");

  if (sbD < 0.005) st.push("sb=ed");
  else if (sbD > 0.02) is.push("sbGap(" + Math.round(sbD*1000)/10 + "%)");

  if (!missTT) st.push("ttSet");
  else is.push("noTT");

  if (hasSem) st.push("fullSem");
  else is.push("partSem");

  if (t.length >= 25) st.push("richTM(" + t.length + ")");
  else if (t.length < 15) is.push("sparseTM(" + t.length + ")");

  if (pbD < 0.015) st.push("panelOk");
  else if (pbD > 0.03) is.push("panelGap(" + Math.round(pbD*1000)/10 + "%)");

  results.push({ nm, tp, cr, is, st, sc: semK.length, tc: t.length });
}

results.sort((a,b) => a.is.length - b.is.length || b.st.length - a.st.length);

console.log("DEEP ANALYSIS — " + files.length + " THEMES\n");
for (const r of results) {
  const ic = r.is.length === 0 ? "✅" : r.is.length <= 2 ? "⚠️" : "❌";
  console.log(ic + " " + r.nm + " [" + r.tp + "] CR:" + r.cr + " sem:" + r.sc + " tm:" + r.tc);
  if (r.st.length) console.log("  + " + r.st.join(" | "));
  if (r.is.length) console.log("  - " + r.is.join(" | "));
}

const p = results.filter(r => r.is.length === 0).length;
const w = results.filter(r => r.is.length > 0 && r.is.length <= 2).length;
const b = results.filter(r => r.is.length > 2).length;
console.log("\nSUMMARY: ✅" + p + " ⚠️" + w + " ❌" + b);
