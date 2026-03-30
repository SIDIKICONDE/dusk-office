# Nyx — VS Code / Cursor theme pack (standalone project)
# Usage: make help | make reinstall

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NPM  := npm
PKG  := nyx-color-themes
EDITOR ?= cursor

.DEFAULT_GOAL := help

.PHONY: help install validate sync variants-ui variants-syntax package vsix build install-vsix reinstall upgrade full clean-old-vsix all make

help:
	@echo "Nyx — $(ROOT)"
	@echo ""
	@echo "  make install          npm dependencies (vsce, etc.)"
	@echo "  make validate         validate theme JSON + manifest (npm run validate)"
	@echo "  make sync             themes/nyx.json <- .vscode/settings.json (repo root)"
	@echo "  make variants-ui      merge extended workbench colors (scripts/merge-extended-ui-colors.mjs)"
	@echo "  make variants-syntax  regenerate variant tokenColors / semantic tokens"
	@echo "  make package          build $(PKG)-*.vsix (aliases: vsix, build)"
	@echo "  make install-vsix     install latest .vsix (EDITOR=$(EDITOR))"
	@echo "  make reinstall        package + install-vsix (aliases: upgrade)"
	@echo "  make full             variants-ui + variants-syntax + package + install-vsix (aliases: all)"
	@echo "  make clean-old-vsix   remove $(PKG)-*.vsix except the newest"
	@echo ""
	@echo "  Example: make reinstall EDITOR=code"

install:
	cd "$(ROOT)" && $(NPM) install

validate:
	cd "$(ROOT)" && $(NPM) run validate

sync:
	cd "$(ROOT)" && $(NPM) run sync

variants-ui:
	cd "$(ROOT)" && $(NPM) run variants:ui

variants-syntax:
	cd "$(ROOT)" && $(NPM) run variants:syntax

package vsix build:
	cd "$(ROOT)" && $(NPM) run package

install-vsix:
	cd "$(ROOT)" && node scripts/install-vsix.mjs --editor=$(EDITOR)

reinstall upgrade:
	cd "$(ROOT)" && $(NPM) run upgrade

full all: variants-ui variants-syntax package install-vsix

# Absorbs typo `make full make` (2nd target is a no-op; avoids "No rule to make target make").
make:
	@:

clean-old-vsix:
	@cd "$(ROOT)" && ls -t $(PKG)-*.vsix 2>/dev/null | tail -n +2 | while IFS= read -r f; do rm -f "$$f"; done || true
	@echo "[OK] Old VSIX files removed (newest kept)."
