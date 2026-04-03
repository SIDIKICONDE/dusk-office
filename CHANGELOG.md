# Changelog — Dusk Office

User-facing changes only.
- **Added**: complete UI color coverage — titleBar, sidebar, panel, notifications, status bar, activity bar, tabs, breadcrumbs, lists, menus, command center, quick input, buttons, badges, scrollbar.
- **Added**: editor enhancements — line highlight, selection highlight, search match colors, word highlight, occurrences highlight, symbol highlight, indent guides, inlay hints, lightbulb colors.
- **Added**: workspace trust colors — trust indicators, untrusted content banners, extension icons, settings trust indicators.
- **Changed**: `enhance-themes.mjs` now adds 6 feature sets (semantic tokens, Git colors, terminal colors, UI colors, editor enhancements, workspace trust).

## 0.7.65 — 3 April 2026

- **Removed**: variantes **Focus** (`Dusk Office … Focus`) et `npm run build:focus` — le chrome assombri était si proche des thèmes palette (surfaces déjà très sombres) que l’écart visuel ne justifiait pas onze thèmes de plus.

- **Added**: optional **product icon theme** — `Dusk Office · Product` (`contributes.productIconThemes`), same extension as the color themes; a small set of activity-bar / folding glyphs uses the Microsoft sample `vscode-10.woff` font, with all other icons resolved from the default Codicons mapping.

- **Changed**: **extensionPack** — **Markdown All in One** (`yzhang.markdown-all-in-one`) est installé **avec** Dusk Office (comme Material Icon Theme) : édition Markdown (raccourcis, snippets, TOC, listes) obligatoire côté pack ; désinstaller l’extension si besoin.

- **Changed**: **Dusk Office High Contrast** — stronger editor / terminal / list selection (`#264f78` with white text), **widget** borders, **minimap** highlights, **inline chat** and **inline edit** (borders + input focus), **peek** editor/result, **notebook** cell borders and backgrounds, **editorOverviewRuler** inline-chat markers, **editorMinimap** inline-chat insert, **text** link colors, **list** focus outline; **README** / **MAINTENANCE** document WCAG **AA** / **AAA** targets for critical pairs.

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
- **Docs**: updated README, LICENSE, and MAINTENANCE.md to reflect icon changes.

- **Changed**: stronger Git gutter (primary stripes) and diff editor tints (lines, unchanged hints, shadow).
- **Docs**: optional secondary SCM gutter colors via user `workbench.colorCustomizations` (not in theme JSON — schema); visual checks in `MAINTENANCE.md`.

## 0.7.16 — 1 April 2026

- **Changed**: version bump.

## 0.7.15 — 1 April 2026

- **Changed**: version bump.

## 0.7.14 — 31 March 2026

- **Changed**: version bump.

## 0.7.13 — 31 March 2026

- **Changed**: version bump.

## 0.7.13 — 31 March 2026

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
