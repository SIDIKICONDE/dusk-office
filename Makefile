# Nyx — pack de thèmes VS Code / Cursor (dépôt autonome)
# Usage : make help | make reinstall

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
NPM  := npm
PKG  := theme
EDITOR ?= cursor

.DEFAULT_GOAL := help

.PHONY: help install validate sync variants-ui variants-syntax package vsix build install-vsix reinstall upgrade full clean-old-vsix all make

help:
	@echo "Nyx — $(ROOT)"
	@echo ""
	@echo "  make install          installer les dépendances npm (vsce, etc.)"
	@echo "  make validate         valider JSON + manifeste des thèmes (npm run validate)"
	@echo "  make sync             themes/nyx.json <- .vscode/settings.json (racine du dépôt)"
	@echo "  make variants-ui      fusionner les couleurs workbench étendues (scripts/merge-extended-ui-colors.mjs)"
	@echo "  make variants-syntax  régénérer tokenColors / sémantique des variantes"
	@echo "  make package          construire $(PKG)-*.vsix (alias : vsix, build)"
	@echo "  make install-vsix     installer le dernier .vsix (EDITOR=$(EDITOR))"
	@echo "  make reinstall        package + install-vsix (alias : upgrade)"
	@echo "  make full             variants-ui + variants-syntax + package + install-vsix (alias : all)"
	@echo "  make clean-old-vsix   supprimer les $(PKG)-*.vsix sauf le plus récent"
	@echo ""
	@echo "  Exemple : make reinstall EDITOR=code"

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

# Absorbe la typo « make full make » (2ᵉ cible sans effet, évite l’erreur « No rule to make target make »).
make:
	@:

clean-old-vsix:
	@cd "$(ROOT)" && ls -t $(PKG)-*.vsix 2>/dev/null | tail -n +2 | while IFS= read -r f; do rm -f "$$f"; done || true
	@echo "[OK] Anciens VSIX supprimés (le plus récent est conservé)."
