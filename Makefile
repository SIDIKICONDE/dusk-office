# Dusk Office theme pack
# Usage: make help | make reinstall

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NPM  := npm
PKG  := dusk-office
EDITOR ?= cursor

.DEFAULT_GOAL := help

.PHONY: help install validate sync variants-ui variants-syntax package vsix build install-vsix reinstall upgrade full clean-old-vsix push-main-auto push-main-safe pa ps rel rpi all make

help:
	@echo "Dusk Office — $(ROOT)"
	@echo ""
	@echo "  make install          install npm dependencies"
	@echo "  make validate         validate themes and manifest"
	@echo "  make sync             sync themes/dusk.json from .vscode/settings.json"
	@echo "  make variants-ui      merge extended workbench colors"
	@echo "  make variants-syntax  rebuild token and semantic colors"
	@echo "  make package          build $(PKG)-*.vsix (aliases: vsix, build)"
	@echo "  make install-vsix     install latest .vsix (EDITOR=$(EDITOR))"
	@echo "  make reinstall        package + install-vsix (aliases: upgrade)"
	@echo "  make full             rebuild, package, and install (aliases: all)"
	@echo "  make clean-old-vsix   keep only the newest $(PKG)-*.vsix"
	@echo "  make push-main-auto   auto commit + push to origin/main"
	@echo "  make push-main-safe   review status then confirm commit + push"
	@echo "  make pa / ps          short aliases for push-main-auto / push-main-safe"
	@echo "  make rel / rpi        short aliases for release / release patch install"
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

# Allows `make full make` without failing.
make:
	@:

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
