# Maintenance — Nyx pack

Internal guide to regenerate themes without breaking the release pipeline.

## Script order (dark variants)

1. **`npm run variants:ui`** — merges extended workbench colors (`merge-extended-ui-colors.mjs`) into `nyx-*.json` (except `nyx.json`, `nyx-hc.json`, `nyx-light.json`).
2. **`npm run variants:syntax`** — updates `tokenColors` / `semanticTokenColors` for variants listed in the script.
3. **`npm run boost:borders`** *(optional)* — raises alpha on “border” keys. **Do not** chain `soften:borders` on the same files without restoring a known-good theme copy.
4. **`npm run dim:borders`** *(optional)* — lowers perceived border brightness (alpha −22, RGB ×0.88). Applies to dark variants + **Nyx Light**; not `nyx-hc.json`.

**Avoid:** `soften:borders` then `boost:borders` twice in a row without reset — alpha stacks.

## Themes outside the dark pipeline

| File | Role |
|------|------|
| `themes/nyx.json` | Empty base (schema, dark type); `include` anchor. |
| `themes/nyx-hc.json` | `include` Abyss + high-contrast overrides — tweak by hand if needed. |
| `themes/nyx-light.json` | Built by **`npm run build:light`** from Abyss. |
| `themes/nyx-ivoire.json` | Built by **`npm run build:ivoire`** from **Nyx Light** (paper base **#F6EEDE**). |
| `themes/nyx-ivoire-sombre.json` | Built by **`npm run build:ivoire-sombre`** from **Nyx Ash** (warm dark palette, pairs with Ivory). |

## Pre-release checks

```bash
npm run validate
```

Validates JSON, `include` paths, and `contributes.themes` in `package.json`.

## Marketplace publishing

- **README screenshots**: the Extensions **Details** webview only keeps `img` sources with **`https:`** (relative `images/…` links are dropped by the markdown sanitizer). The README therefore uses **full `raw.githubusercontent.com/…` URLs**. Those files must exist on the **`main`** branch (commit + push `images/*.png`). If the GitHub repo is **private**, anonymous `raw` URLs return 404 for other machines — use a **public** repo for the theme sources, or host the PNGs on another HTTPS URL and update the README. `package.json` includes **`repository`** so `vsce` can validate links; `npm run package` is plain `vsce package --no-dependencies`.
- **GitHub Actions** (push these files to GitHub or workflows do nothing remotely)
  - **CI** (`.github/workflows/ci.yml`): push / PR to `main` or `master`, or **Run workflow** manually — `npm ci`, `validate`, **`package`**. Minimal `contents: read` permission.
  - **Release** (`.github/workflows/release.yml`): push a tag **`v*`** only.
    1. **`github-release` job**: `npm run release-check` — **fails** if `package.json` version ≠ tag (e.g. tag `v0.7.0` requires `"version": "0.7.0"`). Then `validate`, `package`, workflow **artifact** named `vsix-<version>`, **GitHub Release** with `.vsix` + generated notes (`softprops/action-gh-release`).
    2. **`marketplace` job**: runs **only if** secret **`VSCE_PAT`** is non-empty; second checkout + `package` + `vsce publish`. If the secret is missing, the job is **skipped** (Release still succeeds).
  - **Dependabot** (`.github/dependabot.yml`): weekly PRs for **npm** and **GitHub Actions** dependencies.
  - **One-time setup**: **Settings → Secrets and variables → Actions** → secret **`VSCE_PAT`** — [Azure DevOps PAT](https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate) with scope **Marketplace → Manage** (custom scope) for publisher `deki`.
  - **Local check before tagging**: `GITHUB_REF=refs/tags/v0.6.4 npm run release-check` (use the same version as in `package.json`).

  **Release commands** (bump `version` in `package.json` + `package-lock.json` + `CHANGELOG.md` first):

  ```bash
  git add package.json package-lock.json CHANGELOG.md
  git commit -m "Release 0.6.5"
  git push origin main
  git tag v0.6.5
  git push origin v0.6.5
  ```

- **Manual publish** (without Actions):

  ```bash
  npx @vscode/vsce login deki
  npm run package
  npx @vscode/vsce publish --no-dependencies
  ```

## Default settings (`configurationDefaults`)

Declared in `package.json` → `contributes.configurationDefaults`: **Nyx Midnight**, minimap, semantic highlighting, bracket guides, sticky scroll, highlights, explorer, etc. See the file for the current list. **User / workspace** settings override these.

For another Nyx variant as team default, set e.g. `"workbench.colorTheme": "Nyx Abyss"` in the workspace `settings.json`.

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
