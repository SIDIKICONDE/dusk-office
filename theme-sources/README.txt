Dusk Office — sources de thèmes (à éditer ici)

Ne pas modifier directement themes/*.json : le dossier themes/ est régénéré par le pipeline.

Commandes :
  npm run make:full          — sync theme-sources → themes, puis palettes, syntaxe, builds dérivés, validation
  npm run theme:sources:extract — reconstruit ce dossier depuis themes/ (après migration ou sauvetage)

Syntaxe (semantic + tokenColors) : générée pour toutes les variantes dusk-* listées dans scripts/theme-wins.mjs (SYNTAX_MERGE_SLUGS), même structure que Abyss.

dusk-hc.json : éditer theme-sources/dusk-hc.json — themes/dusk-hc.json est écrit par build-dusk-hc.mjs après Abyss (include), pas par le sync initial.

Thèmes entièrement générés (pas de fichier ici) :
  dusk-light.json, dusk-ivoire.json, dusk-ivoire-sombre.json — produits par scripts/build-dusk-*.mjs

dusk-ivoire-sombre est dérivé de dusk-cendre ; le modifier via dusk-cendre + build ou le script de build.
