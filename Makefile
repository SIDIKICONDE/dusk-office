# Dusk Office theme pack
# Usage: make help | make reinstall

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NPM  := npm
PKG  := dusk-office
ifeq ($(origin EDITOR),command line)
VSCODE_EDITOR := $(EDITOR)
else
VSCODE_EDITOR ?= auto
endif
IDE    ?= auto

.DEFAULT_GOAL := help

.PHONY: help install py-install validate sync theme-sources-sync variants-ui variants-syntax themes-regen package vsix build install-vsix reinstall upgrade full clean-old-vsix export-ide jetbrains-sync jetbrains-build jetbrains-install jetbrains-reinstall jetbrains-full jetbrains-publish push-main-auto push-main-safe pa ps rel rpi all make release release-tag release-status release-watch release-logs tag

help:
	@echo "Dusk Office — $(ROOT)"
	@echo ""
	@echo "  make install          install npm + Python dev dependencies"
	@echo "  make py-install       install Python package only (validate:pydantic / pytest)"
	@echo "  make validate         validate themes and manifest"
	@echo "  make sync             sync themes/dusk.json from .vscode/settings.json"
	@echo "  make theme-sources-sync  copy theme-sources/*.json → themes/ (run before full build)"
	@echo "  make variants-ui      merge extended workbench colors"
	@echo "  make variants-syntax  rebuild token and semantic colors"
	@echo "  make themes-regen     full pipeline: sync + UI + syntax + light/ivoire + validate"
	@echo "  make package          build $(PKG)-*.vsix (aliases: vsix, build)"
	@echo "  make install-vsix     install latest .vsix (VSCODE_EDITOR=$(VSCODE_EDITOR): auto|cursor|windsurf|code|code-insiders|codium)"
	@echo "  make reinstall        package + install-vsix (aliases: upgrade)"
	@echo "  make full             make:full + package + install-vsix (aliases: all)"
	@echo "  make clean-old-vsix   keep only the newest $(PKG)-*.vsix"
	@echo "  make export-ide       export themes to Neovim, Emacs, Zed, Helix, JetBrains, Base16, Ghostty, WezTerm, Warp, Windows Terminal, kitty"
	@echo "  make jetbrains-build      sync + Gradle buildPlugin (ZIP)"
	@echo "  make jetbrains-install    install latest ZIP (IDE=$(IDE): auto|flatpak-idea-ce|idea-ce|…)"
	@echo "  make jetbrains-reinstall  build + install (alias: jetbrains-upgrade)"
	@echo "  make jetbrains-full       make:full + jetbrains-reinstall"
	@echo "  make jetbrains-publish    build + publishPlugin (JETBRAINS_TOKEN)"
	@echo "  make push-main-auto   commit + push to origin/main (--yes, no prompt)"
	@echo "  make push-main-safe   show status, then confirm commit + push"
	@echo "  make pa / ps          aliases for push-main-auto / push-main-safe"
	@echo "  make rel / rpi        short aliases for release / release patch install"
	@echo ""
	@echo "Automated dual-marketplace release (via GitHub Actions):"
	@echo "  npm run make:release   bump patch + rebuild themes + package VSIX (run this first)"
	@echo "  make release           validate + push main + tag (triggers CI publish)"
	@echo "  make tag               tag-only (alias for release-tag) — when code is already pushed"
	@echo "  make release-tag      create vX.Y.Z tag from package.json version and push it"
	@echo "  make release-status   show the latest release workflow run status"
	@echo "  make release-watch    watch the latest release workflow run live"
	@echo "  make release-logs     show logs of the latest failed release workflow"
	@echo ""
	@echo "  Examples: make reinstall VSCODE_EDITOR=windsurf"
	@echo "            node scripts/install-vsix.mjs --list"

install:
	cd "$(ROOT)" && $(NPM) install
	cd "$(ROOT)" && $(NPM) run py:install

py-install:
	cd "$(ROOT)" && $(NPM) run py:install

validate:
	cd "$(ROOT)" && $(NPM) run validate

sync:
	cd "$(ROOT)" && $(NPM) run sync

theme-sources-sync:
	cd "$(ROOT)" && $(NPM) run theme:sources:sync

variants-ui:
	cd "$(ROOT)" && $(NPM) run variants:ui

variants-syntax:
	cd "$(ROOT)" && $(NPM) run variants:syntax

themes-regen:
	cd "$(ROOT)" && $(NPM) run themes:regen

package vsix build:
	cd "$(ROOT)" && $(NPM) run package

install-vsix:
	cd "$(ROOT)" && node scripts/install-vsix.mjs --editor=$(VSCODE_EDITOR)

reinstall upgrade:
	cd "$(ROOT)" && $(NPM) run upgrade

# make:full = theme-sources-sync + sync + variants:ui + variants:syntax + build:hc + build:light + build:ivoire* + validate
full all:
	cd "$(ROOT)" && $(NPM) run py:install && $(NPM) run make:full && $(NPM) run package && node scripts/install-vsix.mjs --editor=$(VSCODE_EDITOR)

# Allows `make full make` without failing.
make:
	@:

export-ide:
	cd "$(ROOT)" && $(NPM) run export:ide

jetbrains-sync:
	cd "$(ROOT)" && $(NPM) run jetbrains:sync

jetbrains-build:
	cd "$(ROOT)" && $(NPM) run jetbrains:build

jetbrains-install:
	cd "$(ROOT)" && node scripts/install-jetbrains-plugin.mjs --editor=$(IDE)

jetbrains-reinstall jetbrains-upgrade:
	cd "$(ROOT)" && $(NPM) run jetbrains:upgrade

jetbrains-full:
	cd "$(ROOT)" && $(NPM) run jetbrains:full

jetbrains-publish:
	cd "$(ROOT)" && $(NPM) run jetbrains:publish

clean-old-vsix:
	@cd "$(ROOT)" && ls -t $(PKG)-*.vsix 2>/dev/null | tail -n +2 | while IFS= read -r f; do rm -f "$$f"; done || true
	@echo "[OK] Old VSIX files removed (newest kept)."

push-main-auto:
	cd "$(ROOT)" && $(NPM) run push:main:auto

push-main-safe:
	cd "$(ROOT)" && $(NPM) run push:main:safe

pa: push-main-auto

ps: push-main-safe

rel:
	cd "$(ROOT)" && $(NPM) run rel

rpi:
	cd "$(ROOT)" && $(NPM) run rpi

# ---------------------------------------------------------------------------
# Automated dual-marketplace release (VS Marketplace + Open VSX via GitHub Actions)
# ---------------------------------------------------------------------------
# Read the version from package.json (no jq dependency).
RELEASE_VERSION := $(shell node -p "require('./package.json').version" 2>/dev/null)

release-tag tag:
	@cd "$(ROOT)" && node scripts/release-tag.mjs

release: validate push-main-auto release-tag
	@echo ""
	@echo "[OK] Release pipeline triggered for v$(RELEASE_VERSION)."
	@echo "     VS Marketplace + JetBrains + Open VSX publish runs in GitHub Actions."
	@echo "     Track: https://github.com/SIDIKICONDE/dusk-office/actions/workflows/release.yml"

release-status:
	@command -v gh >/dev/null 2>&1 || { echo "[ERR] gh CLI not installed."; exit 1; }
	@gh run list --repo SIDIKICONDE/dusk-office --workflow=release.yml --limit 5

release-watch:
	@command -v gh >/dev/null 2>&1 || { echo "[ERR] gh CLI not installed."; exit 1; }
	@RUN_ID=$$(gh run list --repo SIDIKICONDE/dusk-office --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId'); \
	if [ -z "$$RUN_ID" ]; then echo "[ERR] No release run found."; exit 1; fi; \
	echo "[INFO] Watching release run $$RUN_ID..."; \
	gh run watch --repo SIDIKICONDE/dusk-office "$$RUN_ID" --exit-status

release-logs:
	@command -v gh >/dev/null 2>&1 || { echo "[ERR] gh CLI not installed."; exit 1; }
	@RUN_ID=$$(gh run list --repo SIDIKICONDE/dusk-office --workflow=release.yml --limit 1 --json databaseId --jq '.[0].databaseId'); \
	if [ -z "$$RUN_ID" ]; then echo "[ERR] No release run found."; exit 1; fi; \
	gh run view --repo SIDIKICONDE/dusk-office "$$RUN_ID" --log-failed
