# Maintenance — Dusk Office pack

Internal guide for theme rebuilds and releases.

## Script order (dark variants)

1. **`npm run variants:ui`** — merges extended workbench colors (`merge-extended-ui-colors.mjs`) into `dusk-*.json` (except `dusk.json`, `dusk-hc.json`, `dusk-light.json`). Includes **Markdown preview** tokens (`textLink.*`, `textBlockQuote.*`, `textCodeBlock.*`, `textPreformat.*`, `markdownAlert.*`) derived from each palette.
2. **`npm run variants:syntax`** — updates `tokenColors` / `semanticTokenColors` for variants listed in the script.
3. **`node scripts/enhance-themes.mjs`** — adds advanced semantic tokens, Git colors, and terminal ANSI palette to all themes.
4. **`npm run boost:borders`** *(optional)* — raises alpha on “border” keys. **Do not** chain `soften:borders` on the same files without restoring a known-good theme copy.
5. **`npm run dim:borders`** *(optional)* — lowers perceived border brightness (alpha −22, RGB ×0.88). Applies to dark variants + **Dusk Office Light**; not `dusk-hc.json`.

**Avoid:** stacking border scripts without a reset.

## Theme enhancement script

`scripts/enhance-themes.mjs` adds six feature sets to all themes:

### 1. Advanced Semantic Tokens
- Variable kinds: `const` (bold/purple), `let` (normal), `var` (italic)
- Function modifiers: `async` (italic), `static` (italic), `private` (italic)
- Types: class, interface, struct, enum, type aliases, type parameters
- Decorators/attributes: orange italic
- Language-specific: Rust lifetimes, Python decorators, JSX/TSX tags

### 2. Git Integration Colors
- Gutter: `editorGutter.modifiedBackground`, `addedBackground`, `deletedBackground`
- Explorer: `gitDecoration.*` for file status
- SCM: graph colors, history additions/deletions
- Diff editor: inserted/removed backgrounds and borders
- Merge: current/incoming/common headers and content

### 3. Terminal ANSI Palette
- Standard: black, red, green, yellow, blue, magenta, cyan, white
- Bright: brightBlack through brightWhite
- Cursor: foreground, background
- Selection and find highlights

### 4. UI Colors
- Title bar: active/inactive backgrounds and foregrounds
- Sidebar: background, foreground, section headers, drop feedback
- Panel: background, borders, titles, section headers
- Notifications: background, foreground, icons, borders
- Status bar: background, items, debugging, remote, success/warning/error
- Activity bar: background, foreground, badges, drop feedback
- Tabs: active/inactive, hover, selected, drag and drop
- Breadcrumbs: background, foreground, selection
- Lists/trees: backgrounds, selections, highlights, indent guides
- Menus: background, selection, separators, disabled states
- Command center, quick input, inputs, dropdowns, checkboxes, buttons, badges, scrollbars

### 5. Editor Enhancements
- Line highlight: background and border
- Selection: active/inactive, highlight, line background
- Search: match and highlight backgrounds/borders
- Word highlight: normal, strong, text variants
- Occurrences and symbol highlight
- Indent guides: 4 levels with active variants
- Inlay hints: type and parameter colors
- Lightbulb: info, warning, error, auto-fix
- Ghost text, sticky scroll, whitespace

### 6. Workspace Trust Colors
- Trust indicators: background and foreground for trusted/untrusted/partial
- Banner: background, foreground, icon
- Editor trust: untrusted content banners and borders
- Extension icons: star, verified, pre-release, sponsor, private, installed, recommended, disabled
- Settings trust: modified item indicator, header, focused row

Run once after creating or modifying themes. Handles `include`-based themes (dusk-hc, dusk-ivoire, etc.) by only adding colors.

## Dusk Office Light (`build-dusk-light.mjs`)

**Dusk Office Light** is **generated**, not hand-edited in `theme-sources/`.

1. **Source of truth for workbench colors** is **`themes/dusk-abime.json`** (Dusk Office Abyss) after **`npm run variants:ui`** and **`npm run variants:syntax`** — so Light tracks the same structure as the dark variant.
2. **Mechanical remap** : every `colors` hex from Abyss is passed through `remapWorkbenchColor` — dark backgrounds → light surfaces (`DARK_BG_TO_LIGHT_SURFACE`), Abyss light foregrounds → slate (`ABYSS_LIGHT_FG_TO_SLATE`), near-black → `#f1f5f9`, etc.
3. **`include: "./dusk.json"`** : keys not present in Light’s `colors` still come from the base Dusk theme JSON.
4. **`LIGHT_UI_OVERRIDES`** : fixed block for contrast (sidebar text, title bar labels on white, tooltips, Markdown preview tokens, scrollbars, focus) that the pure remap does not fix.
5. **Syntax** : if `themes/dusk-light.json` already exists with non-empty `tokenColors` + `semanticTokenColors`, those are **preserved** (curated light syntax); otherwise they are copied from Abyss.
6. **Ivory** : `npm run build:ivoire` reads the output of step 5–6 and remaps to warm paper tones — edit Light first, then regen Ivory.

## Themes outside the dark pipeline

| File | Role |
|------|------|
| `themes/dusk.json` | Empty base (schema, dark type); `include` anchor. |
| `themes/dusk-hc.json` | **`theme-sources/dusk-hc.json`** → **`npm run build:hc`** copies to `themes/`. `include` Abyss + HC overrides: selection (`#264f78` + white text), **minimap** markers, **inline chat** / **inline edit**, **peek** view, **notebook** cell chrome, **editorOverviewRuler** inline-chat markers, **list** focus outline, **text** links. See README *High Contrast — contrast targets* for WCAG-oriented pairs. |
| `themes/dusk-light.json` | Built by **`npm run build:light`** (`scripts/build-dusk-light.mjs`) — see **Dusk Office Light** below. |
| `themes/dusk-ivoire.json` | Built by **`npm run build:ivoire`** from **Dusk Office Light** (paper base **#F6EEDE**). |
| `themes/dusk-ivoire-sombre.json` | Built by **`npm run build:ivoire-sombre`** from **Dusk Office Ash** (warm dark palette, pairs with Ivory). |

## Pre-release checks

```bash
npm run validate
```

Checks JSON, `include` paths, `contributes.themes` in `package.json`, pipeline lists, and **terminal vs panel** contrast (`verify-terminal-contrast.mjs` — `terminal.foreground` vs `terminal.background`; ANSI on dark themes only).

## Visual checks (Git + diff)

Before a release, spot-check in the editor:

1. **Gutter**: open a tracked file, change lines — modified (amber) and added (green) bars should read clearly on the gutter.
2. **Diff**: open a file diff from SCM — inserted / removed line backgrounds should be easy to see.

## Marketplace publishing

Two registries: **Visual Studio Marketplace** (`vsce`) and **Open VSX** (`ovsx`). Publish both if you want VS Code and Cursor-style clients to see the same version.

- **README screenshots**: the Extensions **Details** webview only keeps `img` sources with **`https:`** (relative `images/…` links are dropped by the markdown sanitizer). The README therefore uses **full `raw.githubusercontent.com/…` URLs**. Those files must exist on the **`main`** branch (commit + push `images/*.png`). If the GitHub repo is **private**, anonymous `raw` URLs return 404 for other machines — use a **public** repo for the theme sources, or host the PNGs on another HTTPS URL and update the README. `package.json` includes **`repository`** so `vsce` can validate links; `npm run package` is plain `vsce package --no-dependencies`.
- **GitHub Actions** (push these files to GitHub or workflows do nothing remotely)
  - **CI** (`.github/workflows/ci.yml`): push / PR to `main` or `master`, or **Run workflow** manually — `npm ci`, `validate`, **`package`**. Minimal `contents: read` permission.
  - **Release** (`.github/workflows/release.yml`): push a tag **`v*`** only.
    1. **`github-release` job**: `npm run release-check` — **fails** if `package.json` version ≠ tag (e.g. tag `v0.7.0` requires `"version": "0.7.0"`). Then `validate`, `package`, workflow **artifact** named `vsix-<version>`, **GitHub Release** with `.vsix` + generated notes (`softprops/action-gh-release`).
    2. **`marketplace` job**: runs **only if** secret **`VSCE_PAT`** is non-empty; second checkout + `package` + `vsce publish`. If the secret is missing, the job is **skipped** (Release still succeeds).
  - **Dependabot** (`.github/dependabot.yml`): weekly PRs for **npm** and **GitHub Actions** dependencies.
  - **One-time setup**: **Settings → Secrets and variables → Actions** → secret **`VSCE_PAT`** — [Azure DevOps PAT](https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate) with scope **Marketplace → Manage** (custom scope) for publisher `dekidev`.
  - **Local check before tagging**: `GITHUB_REF=refs/tags/v0.7.11 npm run release-check` (use the same version as in `package.json`).

  **Release commands** (recommended local workflow):

  ```bash
  npm run release:patch
  git add package.json package-lock.json CHANGELOG.md README.md MAINTENANCE.md extension.js
  git commit -m "release: 0.7.12"
  git push origin main
  git tag v0.7.12
  git push origin v0.7.12
  ```

  Available helpers:

  - `npm run bump:patch|minor|major` — updates `package.json`, `package-lock.json`, and `CHANGELOG.md`
  - `npm run make:full` — sync + UI merge + syntax merge + HC + light/ivory + validate
  - `npm run sync:aa` / `sync-from-workspace.mjs` — régénère `themes/dusk.json` depuis `.vscode/settings.json` ; fusionne des **valeurs par défaut** Markdown preview (`textLink`, `textBlockQuote`, `textCodeBlock`, `textPreformat`, `markdownAlert`) que le workspace peut surcharger.
  - `npm run package` — build the `.vsix` only (**does not** change the version; use for local installs / CI).
  - `npm run make:release` — `bump:patch` + `make:full` + `package:raw` + remove old `.vsix`
  - `npm run release:patch` — same as `make:release`
  - `npm run release:minor|major` — `bump:minor|major` + `make:full` + `package:raw` + clean (no extra patch bump)
  - `npm run release:patch:install` — `release:patch` + install latest VSIX locally

- **Manual publish** (without Actions):

  ```bash
  npx @vscode/vsce login dekidev
  npm run package
  npx @vscode/vsce publish --no-dependencies
  ```

### Open VSX (Cursor and other Open VSX clients)

- **One-time**: [Eclipse account](https://accounts.eclipse.org), **Publisher Agreement**, and a **namespace** on [open-vsx.org](https://open-vsx.org) (e.g. `dekidev`). Same extension id as in `package.json` (`name` / publisher).
- **Token**: create a **personal access token** in your Open VSX profile — **not** `VSCE_PAT` (Azure DevOps).
- **Publish** from the repo root after a successful `package` (or rely on `package.json` + `files` as `ovsx` does):

  ```bash
  npm run package
  npx ovsx publish -p <OVSX_PAT>
  ```

  Or set **`OVSX_PAT`** in the environment and run `npx ovsx publish`. See [Publishing extensions](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions).

- **CI**: optional second job with secret **`OVSX_PAT`** mirroring the `marketplace` job; keep versions in sync with `vsce publish`.

## Default settings (`configurationDefaults`)

Declared in `package.json` → `contributes.configurationDefaults`: **Dusk Office Midnight**, minimap, semantic highlighting, bracket guides, sticky scroll, highlights, explorer, etc. See the file for the current list. **User / workspace** settings override these.

For another Dusk Office variant as team default, set e.g. `"workbench.colorTheme": "Dusk Office Abyss"` in the workspace `settings.json`.

## Product icon theme

`package.json` contributes **`Dusk Office · Product`** (`product-icons/dusk-office-product-icon-theme.json` + `vscode-10.woff`, from the [product-icon-theme-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/product-icon-theme-sample)). Only the icons listed in that JSON use the bundled font; everything else inherits the built-in Codicons product-icon mapping. Users pick it under **Preferences: Product Icon Theme** (`workbench.productIconTheme`). Do **not** set `configurationDefaults` for `workbench.productIconTheme` unless you want to force the suite default for new profiles.

## Control Center runtime

`extension.js` provides a small command runtime:

- `Dusk Office: Control Center`
- `Dusk Office: Choose Theme`
- `Dusk Office: Previous Theme`
- `Dusk Office: Set Favorite`
- `Dusk Office: Favorite Theme`
- `Dusk Office: Toggle Activity Bar Position`
- `Dusk Office: Settings`

State lives in `globalState` (favorite + previous theme). Keep the runtime minimal and avoid a TS build step unless the command surface grows.

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
