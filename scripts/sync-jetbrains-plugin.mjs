#!/usr/bin/env node
/**
 * Copie exports/jetbrains/*.icls, génère themes/*.theme.json (UI complète) + plugin.xml.
 *
 *   npm run jetbrains:sync
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  rmSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildJetBrainsLafTheme } from "../lib/jetbrains-laf-theme.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const EXPORTS_ICLS = join(ROOT, "exports", "jetbrains");
const EXPORTS_PALETTES = join(ROOT, "exports", "palettes");
const PLUGIN_ROOT = join(ROOT, "jetbrains-plugin");
const COLORS_DIR = join(PLUGIN_ROOT, "src", "main", "resources", "colors");
const THEMES_DIR = join(PLUGIN_ROOT, "src", "main", "resources", "themes");
const META = join(PLUGIN_ROOT, "src", "main", "resources", "META-INF");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function schemeNameFromIcls(content) {
  const m = content.match(/<scheme\s+name="([^"]+)"/);
  return m ? m[1] : null;
}

function extractLatestChangeNotes() {
  try {
    const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
    const lines = changelog.split(/\r?\n/);
    const out = [];
    let inFirst = false;
    for (const line of lines) {
      const h = line.match(/^##\s+/);
      if (h) {
        if (!inFirst) {
          inFirst = true;
          continue;
        }
        break;
      }
      if (inFirst) out.push(line);
    }
    const items = out
      .filter((l) => /^\s*[-*]\s+/.test(l))
      .slice(0, 8)
      .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean);
    if (items.length === 0) return null;
    return (
      "<ul>" +
      items
        .map((it) => `<li>${escapeXml(it.replace(/<[^>]+>/g, ""))}</li>`)
        .join("") +
      "</ul>"
    );
  } catch {
    return null;
  }
}

function resourceBaseName(fileName) {
  return fileName.replace(/\.(icls|json)$/i, "");
}

function main() {
  if (!existsSync(EXPORTS_ICLS)) {
    console.error(
      "exports/jetbrains/ introuvable. Lance d’abord : npm run export:ide",
    );
    process.exit(1);
  }
  if (!existsSync(EXPORTS_PALETTES)) {
    console.error(
      "exports/palettes/ introuvable. Lance d’abord : npm run export:ide",
    );
    process.exit(1);
  }

  const iclsFiles = readdirSync(EXPORTS_ICLS)
    .filter((f) => f.endsWith(".icls"))
    .sort();

  if (iclsFiles.length === 0) {
    console.error("Aucun fichier .icls dans exports/jetbrains/");
    process.exit(1);
  }

  mkdirSync(COLORS_DIR, { recursive: true });
  mkdirSync(THEMES_DIR, { recursive: true });
  mkdirSync(META, { recursive: true });

  for (const f of readdirSync(COLORS_DIR)) {
    if (f.endsWith(".icls")) rmSync(join(COLORS_DIR, f), { force: true });
  }
  for (const f of readdirSync(THEMES_DIR)) {
    if (f.endsWith(".theme.json")) rmSync(join(THEMES_DIR, f), { force: true });
  }

  /** @type {{ id: string; schemePath: string; themePath: string; slug: string }[]} */
  const themes = [];

  for (const file of iclsFiles) {
    const base = resourceBaseName(file);
    const palettePath = join(EXPORTS_PALETTES, `${base}.json`);
    if (!existsSync(palettePath)) {
      console.warn(`[warn] Palette manquante : ${palettePath}`);
      continue;
    }

    const palette = JSON.parse(readFileSync(palettePath, "utf8"));
    const iclsContent = readFileSync(join(EXPORTS_ICLS, file), "utf8");
    const schemeName = schemeNameFromIcls(iclsContent);
    if (!schemeName) {
      console.warn(`[warn] Nom de schéma introuvable dans ${file}`);
      continue;
    }

    const iclsDest = join(COLORS_DIR, `${base}.icls`);
    const xmlDest = join(COLORS_DIR, `${base}.xml`);
    copyFileSync(join(EXPORTS_ICLS, file), iclsDest);
    // theme.json editorScheme → /colors/<base>.xml (voir lib/jetbrains-laf-theme.mjs)
    copyFileSync(iclsDest, xmlDest);

    const laf = buildJetBrainsLafTheme(palette);
    const themeFile = `${base}.theme.json`;
    writeFileSync(
      join(THEMES_DIR, themeFile),
      `${JSON.stringify(laf, null, 2)}\n`,
      "utf8",
    );

    themes.push({
      id: schemeName,
      slug: base,
      schemePath: `colors/${base}`,
      themePath: `/themes/${themeFile}`,
    });
  }

  const extensionsXml = themes
    .map(
      (t) =>
        `    <bundledColorScheme path="${escapeXml(t.schemePath)}" id="${escapeXml(t.id)}"/>\n` +
        `    <themeProvider id="${escapeXml(t.id)}" path="${escapeXml(t.themePath)}" targetUi="islands"/>`,
    )
    .join("\n");

  const isFirstJetBrainsRelease = !existsSync(
    join(PLUGIN_ROOT, ".published-version"),
  );
  let changeNotesXml;
  if (isFirstJetBrainsRelease) {
    changeNotesXml = `  <change-notes><![CDATA[
    <p><strong>Dusk Office Themes ${escapeXml(PKG.version)} — Initial release on JetBrains Marketplace</strong></p>
    <ul>
      <li>27 complete IDE themes (UI + editor color scheme) ported from the VS Code / Cursor / Windsurf theme pack</li>
      <li>Full coverage: title bar, tool windows, tabs, menus, lists, dialogs, popups, gutters, diff/VCS, breakpoints, terminal ANSI</li>
      <li>Dark variants: Midnight, Abyss, Nocturne, Vault, Sentinel, Steward, Terminal, Voltage, Neon, Luxe, Finance, Corporate, Secure, Mist, Ash, Bay, Reef, Nebula, Dawn, Or, Dark Ivory</li>
      <li>Light variants: Light, Ivory, Ledger, Audit</li>
      <li>High contrast: Dusk Office High Contrast</li>
      <li>WCAG-conscious terminal contrast on every variant</li>
      <li>Colorblind-aware hue separation on critical UI signals</li>
      <li>OLED-friendly deep blacks on night variants</li>
    </ul>
    <p>Source: <a href="https://github.com/SIDIKICONDE/dusk-office">github.com/SIDIKICONDE/dusk-office</a></p>
  ]]></change-notes>

`;
  } else {
    const changeNotesHtml = extractLatestChangeNotes();
    changeNotesXml = changeNotesHtml
      ? `  <change-notes><![CDATA[
    <p><strong>Dusk Office Themes ${escapeXml(PKG.version)}</strong></p>
    ${changeNotesHtml}
    <p>Full changelog: <a href="https://github.com/SIDIKICONDE/dusk-office/blob/main/CHANGELOG.md">CHANGELOG.md</a></p>
  ]]></change-notes>

`
      : "";
  }

  const pluginXml = `<!-- Généré par scripts/sync-jetbrains-plugin.mjs — ne pas éditer à la main -->
<idea-plugin url="https://github.com/SIDIKICONDE/dusk-office">
  <id>com.dekidev.dusk.office</id>
  <name>Dusk Office Themes</name>
  <vendor email="dekidev@users.noreply.github.com" url="https://github.com/SIDIKICONDE/dusk-office">dekidev</vendor>
  <version>${escapeXml(PKG.version)}</version>

  <depends>com.intellij.modules.platform</depends>

  <description><![CDATA[
    <h2>Dusk Office Themes — 27 professional themes for JetBrains IDEs</h2>
    <p><strong>Dusk Office Themes</strong> is a professional theme suite for
    <strong>IntelliJ IDEA</strong>, <strong>PyCharm</strong>, <strong>WebStorm</strong>,
    <strong>Rider</strong>, <strong>CLion</strong>, <strong>GoLand</strong>,
    <strong>PhpStorm</strong>, <strong>RubyMine</strong>, <strong>DataGrip</strong>,
    <strong>RustRover</strong>, <strong>Android Studio</strong> and the wider JetBrains platform.</p>

    <p>27 carefully tuned variants — <strong>dark</strong>, <strong>light</strong> and
    <strong>high-contrast</strong> — designed for <em>finance, fintech, audit, banking,
    cybersecurity, SOC monitoring, DevOps</em> and long coding sessions.</p>

    <h3>What's inside</h3>
    <ul>
      <li><strong>Full IDE UI themes</strong> — title bar, tool windows, tabs, menus, dialogs, lists, popups</li>
      <li><strong>Editor color schemes</strong> — syntax, gutter, breakpoints, debugger, inspections</li>
      <li><strong>Terminal ANSI colors</strong> — WCAG-conscious foreground / background contrast on every variant</li>
      <li><strong>Diff &amp; VCS colors</strong> — readable change markers, blame, inline diff</li>
      <li><strong>Semantic token contrast</strong> — consistent accent palette across languages</li>
      <li><strong>OLED-friendly</strong> deep blacks for night-coding variants</li>
      <li><strong>Colorblind-aware</strong> hue separation on critical UI signals</li>
    </ul>

    <h3>Featured variants</h3>
    <ul>
      <li><strong>Dusk Office Midnight</strong> — OLED-friendly deep-focus dark</li>
      <li><strong>Dusk Office Vault</strong> — banking, treasury, executive operations</li>
      <li><strong>Dusk Office Sentinel</strong> — cybersecurity, SOC, monitoring</li>
      <li><strong>Dusk Office Audit</strong> — controls, long spreadsheet review</li>
      <li><strong>Dusk Office Finance</strong> — premium banking aesthetic</li>
      <li><strong>Dusk Office Ledger</strong> — soft finance light, reduced glare</li>
      <li><strong>Dusk Office Steward</strong> — professional dark for long sessions</li>
      <li><strong>Dusk Office Ivory</strong> — daytime light variant</li>
      <li><strong>Dusk Office High Contrast</strong> — accessibility-first</li>
    </ul>

    <h3>How to apply</h3>
    <p><em>Settings → Appearance &amp; Behavior → Appearance → Theme</em> for the complete IDE theme,
    or <em>Settings → Editor → Color Scheme</em> for syntax only.</p>

    <h3>Tip: 100% Dusk look</h3>
    <p>JetBrains adds a <strong>per-project color gradient</strong> on the main toolbar
    (the colored badge near your project name). It is generated from the project name and is
    intentionally <em>not overridable by themes</em> — it helps you tell apart multiple IDE windows.</p>
    <p>If you prefer a uniform Dusk Office look, disable it once in
    <em>Settings → Appearance &amp; Behavior → Appearance</em> →
    uncheck <strong>"Show project gradient in toolbar"</strong>
    (label varies: "Color the toolbar by project" / "Project Color"). On older builds,
    use <em>Help → Find Action → Registry…</em> and disable <code>ide.colorful.toolbar</code>.</p>

    <h3>Cross-IDE identity</h3>
    <p>Same palette as the <a href="https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office">VS Code Marketplace</a>
    and <a href="https://open-vsx.org/extension/dekidev/dusk-office">Open VSX</a> versions —
    use the exact same colors in <strong>VS Code</strong>, <strong>Cursor</strong>, <strong>Windsurf</strong>
    and your JetBrains IDE.</p>

    <p>License: GPL-3.0-or-later. Source &amp; issues:
    <a href="https://github.com/SIDIKICONDE/dusk-office">github.com/SIDIKICONDE/dusk-office</a>.</p>
  ]]></description>

${changeNotesXml}  <extensions defaultExtensionNs="com.intellij">
${extensionsXml}
  </extensions>
</idea-plugin>
`;

  writeFileSync(join(META, "plugin.xml"), pluginXml, "utf8");

  const jdk17 = join(process.env.HOME ?? "", ".local", "jdk-17");
  const javaHomeLine = existsSync(jdk17)
    ? `org.gradle.java.home=${jdk17}\n`
    : "# org.gradle.java.home=/chemin/vers/jdk-17\n";

  const gradleProps = `pluginGroup=dekidev
pluginVersion=${PKG.version}
pluginSinceBuild=242
pluginUntilBuild=
platformVersion=2024.2.5

org.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true

${javaHomeLine}`;
  writeFileSync(join(PLUGIN_ROOT, "gradle.properties"), gradleProps, "utf8");

  console.log(`[OK] ${themes.length} color schemes (.icls) → colors/`);
  console.log(`[OK] ${themes.length} UI themes (.theme.json) → themes/`);
  console.log(`[OK] plugin.xml + gradle.properties (version ${PKG.version})`);
  if (isFirstJetBrainsRelease) {
    console.log(
      `[INFO] First JetBrains release detected. After publishing, run:\n` +
        `       echo "${PKG.version}" > jetbrains-plugin/.published-version\n` +
        `       to switch to auto change-notes from CHANGELOG.md on next sync.`,
    );
  }
}

main();
