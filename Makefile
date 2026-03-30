# Nyx — pack de thèmes Cursor / VS Code
# Appel depuis la racine : make nyx-theme-reinstall

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NPM  := npm
PKG  := theme
EDITOR ?= cursor

.DEFAULT_GOAL := help

.PHONY: help install sync variants-syntax package vsix install-vsix reinstall upgrade full clean-old-vsix

help:
	@echo "Nyx ($(ROOT))"
	@echo ""
	@echo "  make install          deps npm (vsce, etc.)"
	@echo "  make sync             themes/nyx.json <- ../../.vscode/settings.json"
	@echo "  make variants-syntax  regenerer tokenColors / semantic des variantes"
	@echo "  make package / vsix   construire $(PKG)-*.vsix"
	@echo "  make install-vsix     installer le dernier .vsix (EDITOR=$(EDITOR))"
	@echo "  make reinstall        package + install-vsix"
	@echo "  make upgrade          alias reinstall"
	@echo "  make full             variants-syntax + package + install-vsix"
	@echo "  make clean-old-vsix   supprimer les $(PKG)-*.vsix sauf le plus recent"
	@echo ""
	@echo "  make reinstall EDITOR=code"

install:
	cd "$(ROOT)" && $(NPM) install

sync:
	cd "$(ROOT)" && $(NPM) run sync

variants-syntax:
	cd "$(ROOT)" && $(NPM) run variants:syntax

package vsix:
	cd "$(ROOT)" && $(NPM) run package

install-vsix:
	cd "$(ROOT)" && node scripts/install-vsix.mjs --editor=$(EDITOR)

reinstall upgrade:
	cd "$(ROOT)" && $(NPM) run upgrade

full: variants-syntax package install-vsix

clean-old-vsix:
	@cd "$(ROOT)" && ls -t $(PKG)-*.vsix 2>/dev/null | tail -n +2 | while IFS= read -r f; do rm -f "$$f"; done || true
	@echo "[OK] Anciens VSIX supprimes (le plus recent est conserve)."
