# Maintenance — Dusk Office pack

Internal guide for theme rebuilds and releases.

## Script order (dark variants)

1. **`npm run variants:ui`** — merges extended workbench colors (`merge-extended-ui-colors.mjs`) into `dusk-*.json` (except `dusk.json`, `dusk-hc.json`, `dusk-light.json`).
2. **`npm run variants:syntax`** — updates `tokenColors` / `semanticTokenColors` for variants listed in the script.
3. **`npm run boost:borders`** *(optional)* — raises alpha on “border” keys. **Do not** chain `soften:borders` on the same files without restoring a known-good theme copy.
4. **`npm run dim:borders`** *(optional)* — lowers perceived border brightness (alpha −22, RGB ×0.88). Applies to dark variants + **Dusk Office Light**; not `dusk-hc.json`.

**Avoid:** stacking border scripts without a reset.

## Themes outside the dark pipeline

| File | Role |
|------|------|
| `themes/dusk.json` | Empty base (schema, dark type); `include` anchor. |
| `themes/dusk-hc.json` | `include` Abyss + high-contrast overrides — tweak by hand if needed. |
| `themes/dusk-light.json` | Built by **`npm run build:light`** from Abyss. |
| `themes/dusk-ivoire.json` | Built by **`npm run build:ivoire`** from **Dusk Office Light** (paper base **#F6EEDE**). |
| `themes/dusk-ivoire-sombre.json` | Built by **`npm run build:ivoire-sombre`** from **Dusk Office Ash** (warm dark palette, pairs with Ivory). |

## Pre-release checks

```bash
npm run validate
```

Checks JSON, `include` paths, and `contributes.themes` in `package.json`.

## Marketplace publishing

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
  - `npm run make:full` — sync + generate variants + build light/ivory + validate
  - `npm run make:release` — `make:full` + package + remove old `.vsix`
  - `npm run release:patch|minor|major` — bump + release pipeline
  - `npm run release:patch:install` — bump + package + install latest VSIX locally

- **Manual publish** (without Actions):

  ```bash
  npx @vscode/vsce login deki
  npm run package
  npx @vscode/vsce publish --no-dependencies
  ```

## Default settings (`configurationDefaults`)

Declared in `package.json` → `contributes.configurationDefaults`: **Dusk Office Midnight**, minimap, semantic highlighting, bracket guides, sticky scroll, highlights, explorer, etc. See the file for the current list. **User / workspace** settings override these.

For another Dusk Office variant as team default, set e.g. `"workbench.colorTheme": "Dusk Office Abyss"` in the workspace `settings.json`.

## Control Center runtime

`extension.js` provides a small command runtime:

- `Dusk Office: Control Center`
- `Dusk Office: Choose Theme`
- `Dusk Office: Previous Theme`
- `Dusk Office: Set Favorite`
- `Dusk Office: Favorite Theme`
- `Dusk Office: Toggle Icons`
- `Dusk Office: Settings`

State lives in `globalState` (favorite + previous theme). Keep the runtime minimal and avoid a TS build step unless the command surface grows.

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
