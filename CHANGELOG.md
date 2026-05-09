# Changelog — Dusk Office

## 0.9.27 — 9 May 2026

- **Fixed**: **Header / activity bar / title bar icons on the four light themes**. Several icon-related foregrounds inherited the dark-base values (`#d1e0e8` near-white) and produced contrast as low as **1.03:1** on the light chrome — chrome icons (gear, search, branch, …) were effectively invisible.
  - **Dusk Office Audit & Ledger** — `icon.foreground` was `#d1e0e8cc` (1.09 / 1.10 ❌). Now overridden to `editor.foreground` (`#25313a` / `#24313a`, ratio ≥ 9). Also fixes `titleBar.activeForeground` (Ledger 1.13 ❌), `titleBar.inactiveForeground` (1.03 / 2.93 ❌), `activityBar.foreground`, and `activityBar.inactiveForeground` (≤ 2.79 ❌).
  - **Dusk Office Light** — `activityBar.foreground` was the inherited cyan `#22d3ee` (1.81 ❌ on white activity bar). Replaced with cyan-700 `#0e7490` (clears 4.5:1).
  - **Dusk Office Ivory** — same `activityBar.foreground` issue (1.57 ❌). Replaced with amber-700 `#92400e` to match the warm palette.
- **Added** for Audit, Ledger, Light and Ivory: `activityBar.activeBorder`, `activityBar.activeBackground`, `editorActionList.foreground`/`background`, `settings.headerForeground`, `settings.modifiedItemIndicator`, `toolbar.hoverBackground`, `toolbar.activeBackground` — so the editor and settings toolbars share the same chrome contrast as the rest of the workbench.

## 0.9.26 — 9 May 2026

- **Fixed**: **Hover surfaces on all four light themes** (`Dusk Office Light`, `Ivory`, `Audit`, `Ledger`). Several keys inherited from the dark `dusk.json` base produced **invisible or jarring hover states** on light backgrounds:
  - `tab.hoverBackground` was `#010203aa` (near-black, ~67% alpha) — caused a dark flash when hovering a tab on a light theme.
  - `list.hoverForeground` was `#d1e0e8` (almost white) — hovered items in the explorer / Quick Pick had near-invisible text.
  - `list.hoverBackground` was either `#304f600f` (6% alpha, imperceptible) or `#d9d3ca14` (8%, sand on sand).
- **Each light theme now uses a palette-coherent hover tint** at 13–20% alpha:
  - **Light** → cyan accent `#06b6d4` (matches the active line number / focus border)
  - **Ivory** → warm amber `#c98962` (matches the cream palette)
  - **Audit** → slate-blue `#556f83`
  - **Ledger** → slate-blue `#658297`
- Each theme also sets `tab.unfocusedHoverBackground`, `list.focusBackground`, and `menubar.selectionBackground` consistently so hovers, focus rings, and menubar selection share the same visual language.
- The build scripts (`scripts/build-dusk-light.mjs`, `scripts/build-dusk-ivoire.mjs`) and the Audit / Ledger theme files are updated, so regeneration preserves these values.

## 0.9.25 — 9 May 2026

- **Fixed**: **Light theme contrast — major WCAG AA cleanup across the four light variants** (`Dusk Office Light`, `Ivory`, `Audit`, `Ledger`). Several foreground colors used very low alpha (`55`, `66`, `88`, `8c`) on light backgrounds, producing contrast ratios as low as **1.23:1** (e.g. white selection text on light slate background) — WCAG AA requires ≥ 4.5:1 for normal text. Now every checked key reaches ≥ 4.9:1.
  - **Dusk Office Light** — `editor.selectionForeground` (was `#d1e0e8`, ratio 1.29 ❌) → `#0f172a`; `editorLineNumber.foreground` (1.53 ❌) → slate-600 `dd`; `panelTitle.inactiveForeground` (2.03 ❌); `input.placeholderForeground` and `inlineChatInput.placeholderForeground` (2.09 ❌) → slate-600 `ee`; `tab.inactiveForeground` (3.68 ⚠️) → slate-600 `dd`; `sideBarTitle.foreground` switched from amber `#b45309` to slate-700 `#334155` for visual coherence.
  - **Dusk Office Ivory** — same alpha pattern fixed for `editorLineNumber.foreground`, `tab.inactiveForeground`, `input.placeholderForeground`, `inlineChatInput.placeholderForeground`.
  - **Dusk Office Audit** and **Ledger** — `editor.selectionForeground` (was `#ffffff` on light slate / sand, ratio 1.23 ❌, selected text invisible) now matches `editor.foreground`. `editorLineNumber.foreground`, `panelTitle.inactiveForeground`, `tab.inactiveForeground`, `input.placeholderForeground` and `inlineChatInput.placeholderForeground` all bumped from alpha `66`/`88` to `dd`.
- **Updated**: `scripts/build-dusk-light.mjs` and `scripts/build-dusk-ivoire.mjs` so the WCAG-correct values are now part of the build pipeline (no risk of regression at the next regeneration).

## 0.9.24 — 9 May 2026

- **Changed**: Variant picker title and placeholder updated to clarify that live preview is **keyboard-driven** — use **↑/↓ arrows or type to filter** for live preview. Mouse click commits the highlighted variant directly (this is a VS Code QuickPick API constraint: hover does not emit any event, so we can't preview on mouse hover).
- **No functional change** since 0.9.23 — only the on-screen guidance is clearer.

## 0.9.23 — 9 May 2026

- **Changed**: **Variant picker is now a live preview**. `Dusk Office: Set Theme Variant` (and the entry in the Control Center) now opens an interactive Quick Pick where moving the selection (arrow keys, type-to-filter) **applies the highlighted variant in real time**, so you can see the editor and workbench in each theme before committing. Press **Enter** to confirm or **Escape** to revert to the variant active before opening the picker.
- **Why**: previously you had to commit each variant one by one to compare them. With 26 variants, that was painful. Live preview makes browsing and choosing instant.
- **Behavior**: workspace memory, previous-theme tracking, and title-bar synchronization only run on accept — preview itself produces no side effects beyond the visible color change.

## 0.9.22 — 9 May 2026

- **Added**: **"Get Started with Dusk Office" walkthrough** — VS Code now opens an interactive 6-step tour the first time the extension activates after install:
  1. **Welcome** — apply the default Dusk Office theme.
  2. **Try one of 26 variants** — open the variant picker.
  3. **Let Dusk match your project automatically** — discover Workspace Fingerprint.
  4. **Adapt to your day, night, and language** — toggle Adaptive Focus / Auto Day/Night.
  5. **Your Control Center** — open the unified Quick Pick.
  6. **Make it yours** — settings shortcut and reset path.
- **Why**: 90% of Dusk Office's automation (Adaptive Focus, Workspace Fingerprint, Control Center, Auto Switch) used to be invisible to new users. The walkthrough surfaces these features at first launch with one-click commands and rich markdown content for each step.
- **Discoverable anytime** via *Help → Walkthroughs → Get Started with Dusk Office*.

## 0.9.21 — 9 May 2026

- **Changed**: **Relicensed from MIT to GNU General Public License v3 (or later).** Dusk Office remains fully open source, but **derivative works (forks, modifications, redistributions) must also be published under GPL v3**. This protects the project from being absorbed into closed-source commercial products while keeping it 100% free for individual use, contribution, and study. SPDX identifier in `package.json` updated to `GPL-3.0-or-later`. Full license text in `LICENSE`.
- **Updated**: README badge, marketing playbook (`PROMOTION.md`), and `package-lock.json` license metadata to reflect the new license.

## 0.9.20 — 9 May 2026

- **Added**: **Workspace Fingerprint** — on first open of a workspace, Dusk Office now scans top-level project files (`package.json`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `go.mod`, `composer.json`, plus the root file listing) and suggests the most relevant variant via a one-time notification:
  - **Vault** for fintech / banking projects (Stripe, Plaid, Dwolla, payment / wallet keywords).
  - **Audit** for accounting / compliance projects (QuickBooks, Xero, audit / ledger / SOX / GAAP / IFRS keywords).
  - **Sentinel** for cybersecurity / SOC / DevSecOps projects (helmet, passport, jsonwebtoken, Vault / Falco / OWASP, `*.tf`).
  - **Steward** for data science / ML / Python backend projects (numpy, pandas, scikit-learn, FastAPI, Django, Flask, Jupyter).
  - **Voltage** for modern web stacks (Next, Astro, Vite, Bun, Deno, Hono, Elysia).
  - **Nocturne** for frontend / design-system projects (React, Vue, Svelte, Tailwind, Storybook).
  - **Terminal** for CLI / infra / DevOps tooling (Go, Rust+clap, Terraform, Makefile / Dockerfile).
- **Added**: command **"Dusk Office: Suggest Variant for This Workspace"** to manually re-run the suggestion.
- **Added**: setting **`duskOffice.workspaceFingerprint.enabled`** (default: `true`) to opt out.
- **Privacy**: detection runs entirely locally — no telemetry, no network calls, file reads capped at 256 KB and never recurse into the project. The suggestion is shown at most once per workspace (state stored in `workspaceState`).

## 0.9.19 — 9 May 2026

- **Added**: GitHub Actions **CI** workflow (`.github/workflows/ci.yml`) — runs `node --check`, `npm run validate` (themes, pipeline, terminal contrast), and a packaging smoke test on every push and pull request to `main`.
- **Added**: GitHub Actions **Release** workflow (`.github/workflows/release.yml`) — on push of a `v*` tag, validates that the tag matches `package.json`, packages the VSIX, publishes to **VS Marketplace** (when `VSCE_PAT` secret is set) and **Open VSX** (when `OVSX_PAT` secret is set), then creates a GitHub Release with the changelog section attached.
- **Added**: npm scripts `publish:vsce`, `publish:ovsx`, `publish:all`, and `tag:release` for manual publishing.
- **Added**: CI badge in the README.
- **Added**: `ovsx` as a dev dependency.
- **Note**: This is the first version published via the new automated dual-marketplace pipeline.

## 0.9.18 — 9 May 2026

- **Changed**: `displayName` rewritten to highlight the niche positioning — *"Dusk Office — 26 Themes for Finance, Audit, Cybersecurity & DevOps"* — improving Marketplace SEO and signaling the professional context the variants were designed for (Audit, Vault, Sentinel, Steward, Ledger, etc.).
- **Changed**: `description` rewritten to describe the actual use cases (finance, audit, banking, fintech, SOC monitoring, DevOps, long coding sessions) instead of listing generic features.
- **Changed**: `keywords` rebalanced — removed redundant generic terms, added high-intent niche keywords (`finance theme`, `audit theme`, `banking theme`, `fintech theme`, `cybersecurity theme`, `soc theme`, `devops theme`, `professional theme`, `adaptive theme`).

## 0.9.17 — 9 May 2026

- **Changed**: **Relicensed under the MIT License.** Dusk Office is now fully open source. Anyone can use, modify, fork, redistribute, and create derivative works freely.
- **Removed**: Outdated mention of bundled third-party extensions (Material Icon Theme, Markdown All in One) from the LICENSE — they are not part of this extension's manifest.
- **Changed**: `package.json` SPDX `license` field switched from `SEE LICENSE IN LICENSE` to `MIT`.

## 0.9.16 — 8 May 2026

- **Fixed**: Startup chain no longer overwrites the saved workspace theme with the favorite when the current theme already matches the auto-switch / adaptive-focus / workspace-memory decision.
- **Fixed**: Auto-switch and adaptive-focus no longer overwrite the user's manual workspace-memory choice on every minute tick (`applyTheme` persists workspace memory only for `manual` source).
- **Fixed**: Removed the two adaptive-focus icons from `editor/title` that appeared in every editor tab (commands stay available in Command Palette and Control Center).
- **Fixed**: `scripts/sync-from-workspace.mjs` JSONC parsing rewrote to a string-aware stripper — URLs (`https://...`) and other characters inside JSON strings are no longer corrupted.
- **Fixed**: `Reset All Settings` survives read-only or absent settings keys per scope, and skips Workspace updates when no workspace folder is open.
- **Fixed**: `updateGlobalTitleBarStyle` debounce window widened (0 → 200 ms) to reliably ignore the echoed `onDidChangeConfiguration` event.
- **Fixed**: `getAutoSwitchTheme` handles `lightHour === darkHour` deterministically.
- **Fixed**: Status bar fallback label is `Dusk` consistently when no theme name is reported.
- **Fixed**: `cleanPickedLabel` trims trailing whitespace to be robust against future icon prefixes.
- **Fixed**: `scripts/auto-push-main.mjs` refuses to push when the current branch is not `main`.

## 0.9.12 — 15 April 2026

- **Fixed**: Sponsor link updated to `buymeacoffee.com/dekidev`.

## 0.9.11 — 15 April 2026

- **Changed**: Audit surfaces shifted to cooler blue-white (`#eef2f8`) for stronger analytical identity; all remaining warm beige removed.
- **Added**: Buy Me a Coffee sponsor link in manifest.

## 0.9.10 — 15 April 2026

- **Changed**: Patch version bump.

## 0.9.9 — 14 April 2026

- **Added**: **Dusk Office Vault** — banking / treasury dark theme with executive-grade gold focus and boardroom calm.
- **Added**: **Dusk Office Audit** — audit-focused light theme tuned for long spreadsheet and control-review sessions.
- **Added**: **Dusk Office Sentinel** — cybersecurity dark theme with watchful teal guidance and stable SOC-style monitoring contrast.
- **Changed**: **Theme distinctiveness pass** — all 25 themes now pass the distinctiveness checker (0 too-similar pairs). Surface and accent palettes differentiated for: Secure (teal-protection), Sentinel (steel-blue/icy cyan), Vault (deep navy + rich gold), Audit (cool analytical blue-gray), Dark Ivory (copper/amber), Midnight (deeper navy-night), Ivory (warm copper/famber).
- **Fixed**: **Audit residual amber** — removed all inherited warm beige and gold colors from Audit surfaces, minimap, overview ruler, find match, inlay hints, peek view, and tokenColors; replaced with cool blue-slate analytical palette.
- **Fixed**: **Terminal backgrounds** — Ledger terminal darkened from near-white (`#faf5ef` → `#e8e2d9`), Audit terminal darkened (`#f4f8fb` → `#e3e8ec`), Ivory terminal lightened (`#efe6d8` → `#f6eede`, then reverted by user).
- **Fixed**: **Tooltip backgrounds** — 16 dark themes now explicitly set `editorSuggestWidget.background` and `editorHoverWidget.background` instead of inheriting the near-black base default (`#02060b`), eliminating visual rupture on light themes and dark-theme tooltip glare.
- **Fixed**: **Sidebar / editor surface alignment** — sidebars now match `editor.background` exactly in Steward, Ledger, Secure, Vault, Audit, and Sentinel, removing the luminance gap that created a framing effect and visual fatigue.
- **Fixed**: **Panel / editor surface gap** — panel backgrounds in Light, Ivory, Ledger, and Audit moved closer to editor luminance, reducing the framing effect on light themes.
- **Added**: `scripts/analyze-themes.mjs` — deep contrast, surface, and token coverage analysis for all themes.
- **Added**: `scripts/fix-tooltips-and-surfaces.mjs` — automated tooltip and surface gap correction with `--dry-run` support.
- **Added**: `scripts/check-theme-distinctiveness.mjs` — perceptual color-distance checker with surface/accent fingerprinting and threshold reporting.
- **Added**: `scripts/differentiate-colliding-themes.mjs` — automated theme palette differentiation script.

## 0.9.8 — 13 April 2026

- **Added**: **Dusk Office Voltage** — graphite-dark variant with electric lime focus, aqua signals, and coral alerts.
- **Added**: **Dusk Office Neon** — cyberpunk variant with hot magenta keywords, electric blue strings, and dark purple-black surfaces.
- **Added**: **Dusk Office Luxe** — luxury futuriste variant with champagne gold accents, rose gold highlights, and obsidian base.
- **Added**: **Dusk Office Terminal** — hacker variant with phosphor green on black, amber warnings, and CRT-style monochrome energy.
- **Added**: **Dusk Office Steward** — dark professional theme tuned for long sessions, with muted gold focus and restrained corporate contrast.
- **Added**: **Dusk Office Ledger** — soft finance-inspired light theme with paper-like surfaces and reduced glare.
- **Added**: **Dusk Office Secure** — calm security-oriented dark theme with desaturated teal guidance and low-fatigue monitoring contrast.
- **Changed**: **Public product copy** — tightened the README and Marketplace-facing wording to better highlight Dusk Office’s value proposition, trust-first behavior, optional companion tools, and automation features.

## 0.9.7 — 13 April 2026

- **Fixed**: **Adaptive Focus preview** — `Dusk Office: Apply Adaptive Theme Now` now works even when `duskOffice.adaptiveFocus.enabled` is off, matching the command behavior exposed in the Control Center and command palette.
- **Fixed**: **Automatic mode conflict** — enabling **Auto Switch** now disables **Adaptive Focus**, and enabling **Adaptive Focus** disables **Auto Switch**, so only one automatic theme mode controls the runtime at a time.
- **Fixed**: **Workspace override handling** — theme, product icon, activity bar, and Dusk Office settings commands now update the effective scope when a Workspace override exists instead of silently writing only to Global settings.
- **Fixed**: **Title bar sync release** — if `window.titleBarStyle` is explicitly set in Workspace settings, Dusk Office now releases its managed global override instead of leaving stale title-bar state behind.
- **Changed**: **Companion extensions** — removed `extensionPack`, so Dusk Office no longer auto-installs Material Icon Theme or Markdown All in One; both are now optional user choices.
- **Changed**: **Marketplace metadata** — refined the manifest description and keywords so listing copy better matches the current product (optional product icons, UI polish, terminal contrast care, and accessibility-oriented discoverability).
- **Changed**: **Release/package hygiene** — release verification now also checks that `CHANGELOG.md` contains the current package version, and VSIX packaging excludes `analysis_options.yaml` plus local screenshot assets that are not used at runtime.

## 0.9.5 — 13 April 2026

- **Added**: **Adaptive Focus runtime** (100% local) — automatic theme adaptation by active editor language + time, with late-night eye-comfort forcing (`Dusk Office Midnight`), optional lock theme, Dusk-only guard, startup apply, editor-change listener, and periodic re-check.
- **Added**: **Adaptive Focus commands** — `Dusk Office: Toggle Adaptive Focus` and `Dusk Office: Apply Adaptive Theme Now`; both are publicly contributed and available in the Control Center, command palette, and editor title menu.
- **Added**: **Adaptive Focus settings** — new `duskOffice.adaptiveFocus.*` keys in `contributes.configuration` (`enabled`, `onlyWhenDuskThemeActive`, `lateNightEyeComfort`, `lateNightStartHour`, `lateNightEndHour`, `lockTheme`).
- **Changed**: **Control Center visibility** — dedicated Adaptive Focus actions (toggle/apply/settings) and status bar indicator (`$(sparkle)`) when adaptive mode is active.
- **Changed**: **Reset All Settings** — now fully resets both global/workspace scopes for Dusk Office settings (including Adaptive Focus and Auto Switch), restores stored title bar style safely, and clears runtime state coherently.
- **Changed**: **Terminal contrast command** — `Dusk Office: Verify Terminal Contrast` now performs real checks on packaged themes (merged `include` chains), validates thresholds, and can open a detailed markdown report.
- **Changed**: **Developer script output language** — `scripts/verify-terminal-contrast.mjs` terminal output and error strings are now in English.
- **Docs**: Updated `README`, `QUICKSTART-LONG`, and `MAINTENANCE` for Adaptive Focus, terminal verification details, and reset coverage.

## 0.9.2 — 12 April 2026

- **Fixed**: **Title bar sync** — respects explicit user changes to `window.titleBarStyle` while a Dusk theme is active; previous global value is stored once and restored when leaving Dusk or disabling alignment; listener now includes `window.titleBarStyle`; guards against read-only settings and avoids self-trigger loops when updating settings.
- **Fixed**: **Product Icon Theme toggle** — uses the contributed `contributes.productIconThemes[].id`; restores the previous value or clears the setting to return to the default product icons (proper handling of VS Code's default/unset state).
- **Fixed**: **Previous Theme & Control Center** — Dusk→Dusk restore goes through the theme runtime to keep workspace memory coherent; Control Center accurately displays the previous theme even when it's not a Dusk variant.
- **Changed**: **Activation at startup** — ensured with `onStartupFinished` so status bar, auto-switch, workspace theme restore, and title bar sync all run on launch.
- **Docs**: **README**, **QUICKSTART-LONG**, **MAINTENANCE** aligned with the current runtime and manifest; theme count corrected to **16**; added **Windsurf** as a supported editor; improved public intro and feature bullets; maintainer notes clarify that `configurationDefaults` does not force a color theme and list all current commands/state keys.
- **Added**: Control Center actions — Toggle Title Bar Align, Toggle Status Bar Button, Clear Workspace Theme Memory, Configure Auto Switch (themes & hours).
- **Manifest**: strengthened `description`, switched `homepage` to public docs, and broadened `keywords` for Marketplace/Open VSX discoverability (e.g. `vs code theme`, `cursor theme`, `windsurf theme`, `product icon theme`, `auto switch`).

## 0.9.0 — 12 April 2026

- **Fixed**: **VS Code theme schema** — removed `colors` keys not declared by the built-in Git extension (`gitDecoration.outgoingRenamedResourceForeground`, `stageAdded`, `copied`, `incomingRenamed`), which triggered editor “not allowed” warnings; those states now rely on supported keys (`added`, `renamed`, etc.).
- **Changed**: **Untracked Git files** — `gitDecoration.untrackedResourceForeground` now uses each palette’s **info** tint (often blue / cyan) instead of low-opacity main text, so labels stand out from gray filenames in the explorer.
- **Changed**: **Dusk Office Dark Ivory** — after remap from Ash (Cendre), **terminal background** is recomputed like other variants (`panel` blended toward `editor`, same ratio as `merge-extended-ui-colors`); **minimap** uses the **editor background** so no cold blue-gray strip remains.
- **Added**: **Debugging** — `editor.stackFrameHighlightBackground` and `editor.focusedStackFrameHighlightBackground` in base `dusk.json` for readable call-stack highlights in the editor; High Contrast adds `editor.stackFrameHighlightBackground`.
- **Added**: **Samples** — `samples/theme-preview-en.{ts,c,cpp}` (syntax preview), `samples/stack-color-preview.mjs` (debugger stack), large samples moved under **`samples/tzst/`** (deep paths for tree testing).
- **Changed**: **merge UI**, **validation** (`validate-themes`, `verify-theme-pipeline`, terminal contrast), **Light / Ivory / Dark Ivory** builds, and **theme-wins** (diff colors driven by merge) aligned with this pipeline.

## 0.8.3 — 12 April 2026

- **Changed**: version bump.
- **Docs**: README links to the changelog file; public copy on [dusk-office-docs](https://github.com/SIDIKICONDE/dusk-office-docs).
- **Docs**: internal maintainer guide is versioned again (removed from `.gitignore`).

## 0.8.0 — 11 April 2026

- **Changed**: version bump.

User-facing changes only.
- **Added**: complete UI color coverage — titleBar, sidebar, panel, notifications, status bar, activity bar, tabs, breadcrumbs, lists, menus, command center, quick input, buttons, badges, scrollbar.
- **Added**: editor enhancements — line highlight, selection highlight, search match colors, word highlight, occurrences highlight, symbol highlight, indent guides, inlay hints, lightbulb colors.
- **Added**: workspace trust colors — trust indicators, untrusted content banners, extension icons, settings trust indicators.
- **Changed**: `enhance-themes.mjs` now adds 6 feature sets (semantic tokens, Git colors, terminal colors, UI colors, editor enhancements, workspace trust).

## 0.7.65 — 3 April 2026

- **Fixed**: **Dusk Office Light / Ivory** — explicit `breadcrumb.background` (light surface); without it, the breadcrumb under tabs inherited `dusk.json` (`#02060b`) and showed a black band between tabs and the editor.

- **Changed**: **Tooltips** — `tooltip.background`, `tooltip.foreground`, and `tooltip.border` set in themes (merge UI, `dusk.json` / `theme-sources`, Light, Ivory, HC) to avoid the default black tooltip background (e.g. Extensions panel).

- **Changed**: **Title bar** — `window.titleBarStyle` is set to **custom** at runtime when a Dusk Office theme is active (`extension.js`), so the title bar follows `titleBar.*` theme colors (macOS **native** title bar often stays dark with a light theme). When you leave a Dusk theme or turn off `duskOffice.titleBar.alignWithTheme`, the previous global `window.titleBarStyle` is restored so the setting is not left forced. Optional: `duskOffice.titleBar.alignWithTheme` (default `true`); explicit `window.titleBarStyle`: `native` in User/Workspace is left unchanged.

- **Removed**: **Focus** variants (`Dusk Office … Focus`) and `npm run build:focus` — darkened chrome was so close to palette themes (already very dark surfaces) that the visual delta did not justify eleven extra themes.

- **Added**: optional **product icon theme** — `Dusk Office · Product` (`contributes.productIconThemes`), same extension as the color themes; a small set of activity-bar / folding glyphs uses the Microsoft sample `vscode-10.woff` font, with all other icons resolved from the default Codicons mapping.

- **Changed**: **extensionPack** — **Markdown All in One** (`yzhang.markdown-all-in-one`) is bundled **with** Dusk Office (like Material Icon Theme): Markdown editing (shortcuts, snippets, TOC, lists) ships with the pack; uninstall the extension if you do not want it.

- **Changed**: **Dusk Office High Contrast** — stronger editor / terminal / list selection (`#264f78` with white text), **widget** borders, **minimap** highlights, **inline chat** and **inline edit** (borders + input focus), **peek** editor/result, **notebook** cell borders and backgrounds, **editorOverviewRuler** inline-chat markers, **editorMinimap** inline-chat insert, **text** link colors, **list** focus outline; **README** documents WCAG **AA** / **AAA** targets for critical pairs.

## 0.7.41 — 3 April 2026

- **Added**: advanced semantic tokens for all themes — const/let/var differentiation, async functions (italic), static members, decorators, type parameters, Rust lifetimes, Python decorators, JSX/TSX tags.
- **Added**: complete Git integration colors — gutter decorations, explorer file status, SCM graph colors, diff editor backgrounds, merge conflict highlights.
- **Added**: full terminal ANSI color palette — standard 8 colors, bright 8 colors, cursor styling, selection and find highlights.
- **Added**: `scripts/enhance-themes.mjs` for batch theme enhancement.
- **Added**: advanced code samples in 18 languages (Dart, Flutter, Kotlin, Swift, PHP, HTML, YAML, JSON Schema, GraphQL, TOML, and more).

- **Changed**: removed all custom icon themes (Product Icons and File Icons).
- **Changed**: Material Icon Theme is now installed automatically as an extension pack for file/folder icons.
- **Removed**: `Dusk Office: Toggle Icons` command.
- **Removed**: fantasticon and @vscode/codicons dependencies.
- **Docs**: updated README, LICENSE, and maintainer notes to reflect icon changes.

- **Changed**: stronger Git gutter (primary stripes) and diff editor tints (lines, unchanged hints, shadow).
- **Docs**: optional secondary SCM gutter colors via user `workbench.colorCustomizations` (not in theme JSON — schema); visual checks documented for maintainers.

## 0.7.16 — 1 April 2026

- **Changed**: version bump.

## 0.7.15 — 1 April 2026

- **Changed**: version bump.

## 0.7.14 — 31 March 2026

- **Changed**: version bump.

## 0.7.13 — 31 March 2026

- **Changed**: version bump.
- **Added**: auto switch by hour with configurable light and dark Dusk Office variants.
- **Added**: startup favorite restore, per-workspace theme memory, and a status bar button for the Control Center.

## 0.7.12 — 31 March 2026

- **Changed**: version bump.

## 0.7.11 — 31 March 2026

- **Added**: **Control Center** with quick actions for themes, icons, and settings.
- **Added**: commands for previous and favorite themes.

## 0.7.10 — 31 March 2026

- **Changed**: Control Center quick pick now shows current theme and icon-theme status for faster decisions.

## 0.7.9 — 31 March 2026

- **Added**: lightweight extension runtime (`extension.js`) and command-palette integration for Dusk Office actions.

## 0.7.8 — 31 March 2026

- **Changed**: local release workflow now supports one-command bump / package / install helpers.

## 0.7.7 — 31 March 2026

- **Changed**: release packaging now removes outdated `.vsix` files automatically and keeps only the current artifact.

## 0.7.6 — 31 March 2026

- **Changed**: release and build scripts were consolidated (`make:full`, `make:release`, install helpers) for faster local iteration.

## 0.7.5 — 31 March 2026

- **Improved**: **Dusk Office Light** and **Dusk Office Ivory** — stronger UI contrast (secondary text, scrollbars, focus, sidebar text) and clearer syntax highlighting; ivory syntax derived from light with warm paper–friendly colors. Build scripts preserve curated light tokens and apply ivory syntax mapping.

## 0.6.4 — 31 March 2026

- **Changed**: extension **`displayName`** to **Dusk Office by DEKI**.

## 0.6.3 — 31 March 2026

- **Changed**: package `name` to **`dusk-office`** (Marketplace id **`dekidev.dusk-office`**).

## 0.6.2 — 31 March 2026

- **Changed**: extension package naming was aligned with the Dusk Office Marketplace identifier.

## 0.6.1 — 31 March 2026

- **Fixed**: README screenshots in the packaged extension — images use **relative** `images/…` paths in the VSIX (no rewrite to remote URLs), so all four screenshots display in the Extensions view after install.
- **Changed**: README includes four Marketplace screenshots with stable English filenames.

## 0.6.0 — 30 March 2026

- **Breaking change**: theme **display names** and the `name` field in theme JSON are now **English** (e.g. **Dusk Office Midnight** instead of *Nyx Minuit*). If your `settings.json` still uses the old French `workbench.colorTheme` value, VS Code will fall back until you pick the theme again or set the new name (default preset uses **Dusk Office Midnight**).
- **Changed**: README and Marketplace copy aligned with English names.

## 0.5.11 — 30 March 2026

- **Fixed**: screenshot images on the Marketplace listing.
- **Changed**: README tightened for install and daily use (no developer-only section).

## 0.5.10 — 30 March 2026

- **Changed**: product docs state **proprietary** distribution only (no public repository field in the manifest).

## 0.5.9 — 30 March 2026

- **Added**: **Dusk Office Dark Ivory** theme — warm dark UI, cream text, deep background.

## 0.5.8 — 30 March 2026

- **Added**: **Dusk Office Ivory** theme — warm light UI, **#F6EEDE** paper base, copper and amber accents.

## 0.5.7 — 30 March 2026

- **Changed**: richer suggested defaults (semantic highlighting, brackets, guides, sticky scroll, highlights, minimap, explorer). Default color theme: **Dusk Office Midnight**.

## 0.5.6 — 30 March 2026

- **Added**: minimap enabled and **Dusk Office Midnight** as default suggestion (overridable in settings).

## 0.5.5 — 30 March 2026

- **Added**: **Dusk Office High Contrast** for clearer borders and focus.
- **Added**: **Dusk Office Light** (light UI).
- **Added**: Marketplace banner and Q&A.

## 0.5.4 — 30 March 2026

- **Changed**: slightly stronger borders on dark variants.
- **Changed**: **Dusk Office Midnight** — borders easier to see on very dark backgrounds.

## Earlier than 0.5.4

- Prior history maintained by **DEKI**; install the latest release for the full theme list.
