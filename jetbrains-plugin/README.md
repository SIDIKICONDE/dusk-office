# Dusk Office Themes — JetBrains plugin

> **27 professional themes for IntelliJ IDEA, PyCharm, WebStorm, Rider, CLion, GoLand, PhpStorm, RubyMine, DataGrip, AppCode, RustRover, Android Studio and the JetBrains platform** — dark, light and high-contrast variants tuned for **finance, fintech, audit, banking, cybersecurity, SOC monitoring, DevOps**, and long coding sessions. Full IDE UI themes + editor color schemes, terminal ANSI colors, diff/VCS colors, semantic token contrast, OLED-friendly palettes, WCAG-conscious contrast, colorblind-aware design.

Pack de **27 thèmes complets** pour IntelliJ IDEA, PyCharm, WebStorm, Rider, CLion, GoLand, PhpStorm, RubyMine, DataGrip, RustRover et Android Studio :

- **UI** : `.theme.json` (barres, onglets, tool windows, menus, listes, dialogs…)
- **Éditeur** : `.icls` (syntaxe, gutter, terminal ANSI, diff, VCS, debugger, breakpoints)

Générés depuis les thèmes VS Code du dépôt parent pour garder une identité visuelle cohérente entre **VS Code**, **Cursor**, **Windsurf**, **Open VSX** et les IDE **JetBrains**.

## SEO JetBrains Marketplace

- **Plugin name** : `Dusk Office Themes`
- **Plugin ID** : `com.dekidev.dusk.office`
- **Search intent** : JetBrains theme, IntelliJ theme, PyCharm theme, WebStorm theme, Rider theme, CLion theme, GoLand theme, PhpStorm theme, RubyMine theme, DataGrip theme, RustRover theme, Android Studio theme, dark theme, light theme, high contrast theme, accessible theme, finance theme, cybersecurity theme, DevOps theme
- **Positionnement** : suite professionnelle de thèmes UI + éditeur, lisible sur longues sessions, pensée pour environnements finance, audit, SOC, sécurité, data et développement
- **Cross-IDE identity** : même palette que la version VS Code/Cursor/Windsurf publiée sur le Marketplace et Open VSX

## Prérequis

- **JDK 17** pour lancer Gradle (le démon Gradle ne supporte pas encore Java 25 en local — la CI utilise Java 17)
- Thèmes exportés : `npm run export:ide` (depuis la racine du dépôt)

**Java 25 seul sur le système** — Gradle ne démarre pas avec Java 25. Deux options :

```bash
# Option A — paquet Fedora (sudo)
sudo dnf install -y java-17-openjdk java-17-openjdk-devel
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# Option B — JDK 17 local (sans sudo, déjà possible dans ~/.local/jdk-17)
export JAVA_HOME=$HOME/.local/jdk-17
export PATH="$JAVA_HOME/bin:$PATH"
```

Ajoute dans `~/.bashrc` : `export JAVA_HOME=$HOME/.local/jdk-17` si tu gardes l’option B.

### Erreur IntelliJ « Project source sets cannot be resolved » / Java 17

Gradle doit voir **JDK 17** (pas Java 25 seul) :

1. **IntelliJ** : **Settings → Build, Execution, Deployment → Build Tools → Gradle**
   - **Gradle JVM** → choisir **JDK 17** (`~/.local/jdk-17` ou `java-17-openjdk`)
2. Ou créer `jetbrains-plugin/local.properties` :
   ```properties
   org.gradle.java.home=/home/dekidev/.local/jdk-17
   ```
   (`npm run jetbrains:sync` le génère si `~/.local/jdk-17` existe)
3. Puis **Reload Gradle Project** (icône éléphant) ou **File → Invalidate Caches → Restart**
4. Le plugin **Foojay** dans `settings.gradle.kts` peut aussi télécharger JDK 17 automatiquement au premier sync Gradle en terminal.

## Build local

```bash
# Depuis la racine dusk-office/
npm run jetbrains:sync       # copie exports/jetbrains → colors/ + plugin.xml
npm run jetbrains:build      # ./gradlew buildPlugin → build/distributions/*.zip
npm run jetbrains:install    # copie le ZIP dans ~/…/JetBrains/…/plugins/
npm run jetbrains:upgrade    # build + install (comme make reinstall)
npm run jetbrains:full       # make:full + upgrade (comme make full)
```

Équivalent Make :

```bash
make jetbrains-reinstall          # build + install
make jetbrains-full               # régénère les thèmes + build + install
make jetbrains-install IDE=auto   # install seul (ZIP déjà construit)
node scripts/install-jetbrains-plugin.mjs --list
```

Tester dans une IDE (sandbox Gradle, sans installation système) :

```bash
cd jetbrains-plugin && ./gradlew runIde
```

**Thème complet (recommandé)** : **Settings → Appearance → Theme** → **Dusk Office …**

**Schéma éditeur seul** : **Settings → Editor → Color Scheme** → **Dusk Office …**

**Coins arrondis** : Dusk Office hérite du mode **Islands** (IntelliJ 2025.3+). Sur une version plus ancienne, l’UI reste en panneaux rectangulaires classiques — ce n’est pas configurable uniquement par les couleurs.

**Look 100% Dusk Office** : JetBrains affiche un **gradient de couleur par projet** sur la barre d’outils (le badge coloré près du nom de projet). Ce gradient est généré à partir du nom du projet et **n’est pas overridable par un thème** (c’est volontaire — ça aide à distinguer plusieurs fenêtres IDE ouvertes). Pour avoir un rendu Dusk Office uniforme :

- **Settings → Appearance & Behavior → Appearance** → décoche **"Show project gradient in toolbar"** (le label varie : *"Color the toolbar by project"* / *"Project Color"*).
- Sur les versions plus anciennes : **Help → Find Action → Registry…** → décoche `ide.colorful.toolbar`, puis redémarre l’IDE.

**Terminal (2025.2+)** : couleurs via `BLOCK_TERMINAL_*` dans chaque schéma. `editorScheme` = nom du schéma (`Dusk Office Finance`, `Dusk Office Terminal`, …).

**Important** : pas de `parentTheme: Islands Dark` (sinon l’éditeur et le terminal Reworked restent sur le schéma JetBrains « Islands Dark »). Les coins arrondis viennent des clés `Island.*` + `targetUi="islands"`.

Après changement de variante : redémarre l’IDE une fois, puis **Appearance → Theme** et **Editor → Color Scheme** doivent afficher le **même nom** (ex. **Dusk Office Terminal**).

## Publier sur JetBrains Marketplace

1. Compte [JetBrains Marketplace](https://plugins.jetbrains.com) + vendor **dekidev**
2. JetBrains Account → **Tokens** → token de publication
3. Secret GitHub du dépôt : `JETBRAINS_TOKEN` (ou variable d’environnement locale)
4. Sur un tag `v*` : le workflow `release.yml` publie aussi le plugin (si le secret est défini)

Publication manuelle :

```bash
export JETBRAINS_TOKEN="…"
npm run jetbrains:publish
```

Équivalent :

```bash
cd jetbrains-plugin && ./gradlew publishPlugin
```

5. Première upload : [Upload plugin](https://plugins.jetbrains.com/author/me/plugins) → fichier `build/distributions/dusk-office-jetbrains-*.zip`
6. Revue JetBrains (quelques jours) — page plugin : captures, description, licence **GPL-3.0-or-later**

## Fichiers générés (ne pas éditer à la main)

| Fichier | Source |
| --- | --- |
| `src/main/resources/colors/*.icls` | `exports/jetbrains/` via `jetbrains:sync` |
| `src/main/resources/META-INF/plugin.xml` | `scripts/sync-jetbrains-plugin.mjs` |
| `gradle.properties` (`pluginVersion`) | `package.json` |

Après modification des thèmes VS Code : `npm run export:ide && npm run jetbrains:sync` puis rebuild.

## ID du plugin

- **Plugin ID** : `com.dekidev.dusk.office`
- **Nom affiché** : Dusk Office
