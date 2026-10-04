# Dusk Office — Extended guide

**Dusk Office** is a theme suite for **Visual Studio Code**, **Cursor**, and **Windsurf** with **27 dark, light, and high-contrast themes**, **semantic highlighting**, **full UI theming**, and an optional **product icon theme**.

**Public copy of this guide:** [dusk-office-docs/QUICKSTART-LONG.md](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/QUICKSTART-LONG.md).

**Main readme** (install, switch theme, quick settings, Marketplace): **[README.md](./README.md)** · [mirror](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md).

**Extension source:** [SIDIKICONDE/dusk-office](https://github.com/SIDIKICONDE/dusk-office).

**Open VSX:** [dekidev.dusk-office](https://open-vsx.org/extension/dekidev/dusk-office)

◆ Dream in color ◆

## Overview

`Dusk Office` is a polished theme suite with clean contrast, readable syntax, OLED-friendly dark variants, daytime-friendly light options, and coherent workbench colors.

It includes dark, light, warm, and high-contrast variants for daily use, plus workspace memory, auto switch, adaptive focus, and a matching optional product icon theme.

**Note:** Dusk Office does **not** auto-install other extensions. If you want companion tools, you can add **Material Icon Theme** for Explorer icons and [**Markdown All in One**](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) for Markdown shortcuts, snippets, TOC, and list helpers. Theme **colors** for the Markdown preview (`textLink`, `markdownAlert`, etc.) still come from Dusk Office's color themes.

**macOS — title bar:** the **system menu bar** (Apple menu) always follows macOS appearance. The **window** title bar can be switched to **custom** so it matches `titleBar.*` in the theme (native title bars often stay dark with a light editor theme). This is **off by default** — enable **`duskOffice.titleBar.alignWithTheme`**, or set **`window.titleBarStyle`**: `native` yourself if you prefer the native bar.

## Highlights

- **Dark themes** for daily work
- **Complete UI theming** — title bar, sidebar, panel, tabs, notifications, status bar, activity bar
- **Markdown preview** — `textLink`, block quotes, fenced code (`textCodeBlock` / `textPreformat`), and GFM **markdownAlert** (note / tip / important / warning / caution) aligned with each variant's palette; if you install **Markdown All in One**, it adds shortcuts, snippets, and list/table helpers for `.md` files
- **Advanced semantic tokens** — const/let/var differentiation, async functions, decorators, type parameters
- **Full Git integration** — gutter decorations, file status colors, diff editor, merge conflicts
- **Complete terminal palette** — ANSI 16 colors with cursor styling
- **Editor enhancements** — line highlight, selection, search matches, word highlight, indent guides
- **Workspace trust indicators** — untrusted content warnings, extension icons
- Control Center for quick theme actions
- Auto switch by hour
- Favorite theme on startup
- Per-workspace theme memory
- Status bar switcher
- Semantic highlighting and TextMate token styling
- Variants for dark, light, warm, and high-contrast setups
- Visual **Theme Gallery** (in-card preview of every variant; Apply to switch) and **editor/UI contrast verification**
- **Web extension** support — full runtime activates on vscode.dev / github.dev, not just desktop
- Good editor defaults

## Included Themes

| Theme | Style |
| ------ | ------ |
| **Dusk Office** | Core dark theme with cyan and pink accents. |
| **Dusk Office Abyss** | Deep blue night palette with vivid cyan highlights. |
| **Dusk Office Dawn** | Brighter dark surfaces with bold syntax contrast. |
| **Dusk Office Bay** | Lagoon-inspired green tones and fresh chrome. |
| **Dusk Office Mist** | Slate blue-gray palette with balanced contrast. |
| **Dusk Office Ash** | Neutral gray theme with a clean console feel. |
| **Dusk Office Midnight** | Very dark variant, ideal for OLED-style setups. |
| **Dusk Office Nebula** | Purple and mauve accents with a richer atmosphere. |
| **Dusk Office Reef** | Bright cyan neon energy and stronger borders. |
| **Dusk Office Nocturne** | Warm vintage terminal aesthetic with amber and copper accents. |
| **Dusk Office Finance** | Premium banking aesthetic with gold, deep green and navy accents. |
| **Dusk Office Corporate** | Sophisticated burgundy-wine theme with refined gold touches. |
| **Dusk Office Voltage** | Graphite-dark theme with electric lime focus, glacial aqua signals, and coral alert accents. |
| **Dusk Office Neon** | Cyberpunk neon — hot magenta keywords, electric blue strings, dark purple-black base. |
| **Dusk Office Luxe** | Luxury futuriste — champagne gold accents, rose gold highlights, obsidian surfaces, platinum info. |
| **Dusk Office Or** | Deep bronze-gold — antique gold accents on obsidian, warm parchment text, treasury-grade calm. |
| **Dusk Office Terminal** | Hacker terminal — phosphor green on black, amber warnings, CRT-style monochrome energy. |
| **Dusk Office Steward** | Professional dark theme for long sessions — muted gold focus, steel-blue signals, and calm corporate contrast. |
| **Dusk Office Ledger** | Soft finance light theme — paper-like surfaces, blue-gray structure, and reduced glare for prolonged reading. |
| **Dusk Office Secure** | Calm security / SOC dark theme — desaturated teal guidance, restrained amber warnings, and low-fatigue monitoring contrast. |
| **Dusk Office Vault** | Banking / treasury dark theme — executive-grade gold focus, slate-blue structure, and premium boardroom calm. |
| **Dusk Office Audit** | Audit-focused light theme — reduced glare, analytical blue-gray structure, and clean spreadsheet-friendly scanning. |
| **Dusk Office Sentinel** | Cybersecurity dark theme — watchful teal guidance, disciplined alerts, and stable SOC-style monitoring contrast. |
| **Dusk Office Light** | Cool, neutral light theme for daytime work. **Built** from Dusk Office Abyss (`npm run build:light`) — mechanical light remap + UI overrides. |
| **Dusk Office Ivory** | Warm paper-like light theme with copper accents. |
| **Dusk Office Dark Ivory** | Warm dark companion to Ivory with cream text. |
| **Dusk Office High Contrast** | Stronger separation and clearer focus states. |

### High Contrast — contrast targets

**Dusk Office High Contrast** is tuned for **WCAG 2.1**-style contrast on critical UI pairs (normal text **≥ 4.5:1** AA; where possible **≥ 7:1** AAA for primary reading and selection):

| Pair | Target |
| ------ | -------- |
| Default editor text / background | `#ffffff` on `#000000` (ratio **≥ 21:1**) |
| Selection text / selection fill | `#ffffff` on `#264f78` (aim **≥ 7:1** — AAA for body-sized text) |
| Focus rings (`focusBorder`, list focus) | **Yellow** (`#ffff00`) or **cyan** on black for keyboard / focus visibility |
| Inline chat & inline edit panels | **Yellow** widget border on black; **white** input border; **yellow** focus border on the input |

The theme still **`include`s** Dusk Office Abyss for syntax; non-overridden chrome may show Abyss tints. Adjust with `workbench.colorCustomizations` if your environment needs stricter uniformity.

## Installation

See **[README — Install](./README.md#install)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#install) (Marketplace and VSIX).

## Usage

Enable a theme and daily workflow: **[README — Switch Theme](./README.md#switch-theme)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#switch-theme).

The extension also ships editor-friendly defaults (semantic highlighting, minimap, guides, sticky scroll); user and workspace settings can override them.

### Control Center

Open the Command Palette and run `Dusk Office: Control Center`, or use the status bar entry when enabled, to:

- switch theme variants
- go back to the previous theme
- save and restore a favorite theme
- toggle auto switch
- toggle adaptive focus
- apply adaptive theme immediately
- open adaptive focus settings
- check the saved workspace theme
- toggle activity bar position
- toggle **Dusk Office · Product** icons (same as command below)
- toggle title bar align with theme
- open the **Theme Gallery** (visual cards; Apply to switch)
- verify **terminal contrast** and **editor & UI contrast**
- toggle the status bar button
- clear the workspace theme memory
- configure auto switch (themes and hours)
- open settings

### Command IDs

Registered in `package.json` → `contributes.commands`. Use these IDs in `keybindings.json`, tasks, or automation.

| Command ID | Palette title |
| ------------ | ---------------- |
| `duskOffice.openControlCenter` | Dusk Office: Control Center |
| `duskOffice.switchThemeVariant` | Dusk Office: Choose Theme |
| `duskOffice.openThemeGallery` | Dusk Office: Theme Gallery |
| `duskOffice.quickSetup` | Dusk Office: Quick Setup |
| `duskOffice.switchToPreviousTheme` | Dusk Office: Previous Theme |
| `duskOffice.setFavoriteTheme` | Dusk Office: Set Favorite |
| `duskOffice.switchToFavoriteTheme` | Dusk Office: Favorite Theme |
| `duskOffice.toggleActivityBarLocation` | Dusk Office: Toggle Activity Bar Position |
| `duskOffice.toggleProductIconTheme` | Dusk Office: Toggle Product Icon Theme |
| `duskOffice.toggleAutoSwitch` | Dusk Office: Toggle Auto Switch |
| `duskOffice.toggleAdaptiveFocus` | Dusk Office: Toggle Adaptive Focus |
| `duskOffice.applyAdaptiveFocusTheme` | Dusk Office: Apply Adaptive Theme Now |
| `duskOffice.openSettings` | Dusk Office: Settings |
| `duskOffice.verifyTerminalContrast` | Dusk Office: Verify Terminal Contrast |
| `duskOffice.verifyEditorContrast` | Dusk Office: Verify Editor & UI Contrast |
| `duskOffice.resetTheme` | Dusk Office: Reset All Settings |
| `duskOffice.clearWorkspaceFingerprint` | Dusk Office: Reset Workspace Fingerprint |
| `duskOffice.toggleEditorAnsi` | Dusk Office: Toggle ANSI in Editor |
| `duskOffice.enableEditorAnsi` | Dusk Office: Enable ANSI in Editor |
| `duskOffice.disableEditorAnsi` | Dusk Office: Disable ANSI in Editor |
| `duskOffice.openEditorAnsiSettings` | Dusk Office: ANSI in Editor Settings |
| `duskOffice.suggestVariantForWorkspace` | Dusk Office: Suggest Variant for This Workspace |

### Settings

Defined in `package.json` → `contributes.configuration` (`duskOffice.*`).

| Key | Default | Description |
| ----- | --------- | ------------- |
| `duskOffice.favoriteTheme` | `""` | Favorite variant (Settings Sync–friendly; synced with **Set Favorite**). |
| `duskOffice.applyFavoriteOnStartup` | `false` | Apply the favorite theme on startup. |
| `duskOffice.marketplaceReview` | `true` | Ask for a Marketplace star rating after sufficient use. |
| `duskOffice.workspaceFingerprint.enabled` | `true` | Suggest a variant once per workspace from project signals. |
| `duskOffice.rememberWorkspaceTheme` | `false` | Remember the last Dusk Office theme for each workspace, and re-apply it when that workspace opens. Opt-in: while it is on, a remembered theme overrides the one you picked in VS Code until you change the theme again. |
| `duskOffice.statusBar.enabled` | `true` | Show the Dusk Office status bar button. |
| `duskOffice.titleBar.alignWithTheme` | `false` | When enabled and a Dusk Office color theme is active, set `window.titleBarStyle` to `custom` so the title bar follows the theme (helps a light editor avoid a stuck-dark native bar on macOS). When you leave Dusk themes or disable this, the previous global title bar style is restored. Does not override if you set `window.titleBarStyle` to `native` yourself in User or Workspace settings. |
| `duskOffice.autoSwitch.enabled` | `false` | Switch between light and dark Dusk Office themes by hour. |
| `duskOffice.autoSwitch.lightTheme` | `Dusk Office Light` | Theme during light hours (enum matches Dusk variants in settings UI). |
| `duskOffice.autoSwitch.darkTheme` | `Dusk Office Midnight` | Theme during dark hours (same enum). |
| `duskOffice.autoSwitch.lightHour` | `7` | Hour (0–23) to start the light theme. |
| `duskOffice.autoSwitch.darkHour` | `18` | Hour (0–23) to start the dark theme. |
| `duskOffice.adaptiveFocus.enabled` | `false` | Auto-adapt theme from active editor language + time. |
| `duskOffice.adaptiveFocus.onlyWhenDuskThemeActive` | `true` | Only auto-apply adaptive focus when a Dusk Office theme is already active. |
| `duskOffice.adaptiveFocus.lateNightEyeComfort` | `true` | Force ultra-dark late-night behavior for eye comfort. |
| `duskOffice.adaptiveFocus.lateNightStartHour` | `22` | Start hour (0–23) for late-night eye comfort mode. |
| `duskOffice.adaptiveFocus.lateNightEndHour` | `5` | End hour (0–23) for late-night eye comfort mode. |
| `duskOffice.adaptiveFocus.dayStartHour` | `7` | Start of day period for language rules (inclusive, 0–23). |
| `duskOffice.adaptiveFocus.dayEndHour` | `18` | End of day period (exclusive). |
| `duskOffice.adaptiveFocus.defaultLightTheme` | `Dusk Office Ivory` | Fallback when no language rule matches (day). |
| `duskOffice.adaptiveFocus.defaultDarkTheme` | `Dusk Office Midnight` | Fallback when no language rule matches (night). |
| `duskOffice.adaptiveFocus.languageOverrides` | `{}` | Per-language `{ light, dark }` overrides merged onto built-in rules. |
| `duskOffice.adaptiveFocus.lockTheme` | `""` | Force one theme when adaptive focus runs (empty = no lock). |
| `duskOffice.editorAnsi.enabled` | `true` | ANSI coloring in editor for logs and escape literals. |
| `duskOffice.editorAnsi.allLanguages` | `false` | Apply ANSI in any language when sequences are detected (opt-in; default is `editorAnsi.languageIds` only). |
| `duskOffice.editorAnsi.dimEscapeSequences` | `true` | Fade raw ESC sequences in log files. |
| `duskOffice.editorAnsi.languageIds` | `log`, `ansi` | Language IDs when `allLanguages` is false. |
| `duskOffice.editorAnsi.maxLineCount` | `12000` | Max lines to colorize per file (0 = unlimited). |
| `duskOffice.editorAnsi.maxLineLength` | `32768` | Skip longer lines (0 = unlimited). |

**Adaptive Focus** and **Auto Day/Night** are mutually exclusive — turning one on disables the other.

#### Adaptive Focus — language rules (runtime)

Source of truth: [`lib/themes/theme-common.js`](./lib/themes/theme-common.js) → `ADAPTIVE_LANGUAGE_RULES`. Day = hours **7–17**; night = all other hours (unless late-night comfort forces **Midnight**, default **22h–5h**).

| Language ID | Day | Night |
| --- | --- | --- |
| `markdown`, `mdx` | Ivory | Nocturne |
| `dart`, `flutter` | Light | Bay |
| `typescript`, `javascript` | Ivory | Nebula |
| `json`, `yaml`, `yml` | Ivory | Ash |
| `shellscript`, `shell`, `bash`, `zsh` | Ivory | Finance |
| `python` | Ivory | Abyss |
| `go` | Ivory | Reef |
| `rust` | Ivory | Corporate |
| `html` | Ivory | Dawn |
| `css` | Ivory | Nebula |
| `sql` | Ivory | Finance |
| `ruby` | Ivory | Nocturne |
| `java` | Light | Corporate |
| `cpp`, `c` | Light | Reef |
| `swift` | Ivory | Midnight |
| `kotlin` | Light | Bay |
| *(other)* | Ivory | Midnight |

CLI preview (same rules): `node scripts/adaptive-focus-mode.mjs --language python --hour 14`

### Source of truth (repo)

| What | Where |
| ------ | -------- |
| Color theme list & JSON paths | [`package.json`](./package.json) → `contributes.themes` (**27** themes) |
| Product icon theme | [`package.json`](./package.json) → `contributes.productIconThemes` (`dusk-office-product` → **Dusk Office · Product**) |
| Theme names & Adaptive Focus rules | [`lib/themes/theme-common.js`](./lib/themes/theme-common.js) → `THEME_VARIANTS`, `ADAPTIVE_LANGUAGE_RULES` (CLI: `scripts/adaptive-focus-mode.mjs`) |
| Runtime state keys | [`lib/core/extension-keys.js`](./lib/core/extension-keys.js) + orchestration in [`extension.js`](./extension.js) |
| Build & theme pipeline | Internal maintainer documentation only (not published). |

### Optional: secondary Git gutter (staged)

The theme JSON schema does not allow `editorGutter.*SecondaryBackground` keys. To still color **staged** stripes differently from **unstaged**, add `workbench.colorCustomizations` for your active theme label, for example **Dusk Office**:

```json
"workbench.colorCustomizations": {
  "[Dusk Office]": {
    "editorGutter.modifiedSecondaryBackground": "#fbbf2499",
    "editorGutter.addedSecondaryBackground": "#22c55e99",
    "editorGutter.deletedSecondaryBackground": "#ef444499"
  }
}
```

Use matching accent hexes if you use another variant.

## Terminal Colors

The integrated terminal derives its colours from each variant's entry in `scripts/palettes-extended-ui.json`, but `merge-extended-ui-colors.mjs` does **not** write them verbatim: `terminal.background` is `panel` blended 26 % toward `editor.background` (`TERMINAL_BLEND_TOWARD_EDITOR` in that script), and the syntax layer is remapped for light surfaces. `fix:ui-contrast` may then adjust a value that sits below its ratio floor.

The table below is therefore generated from the **built** `themes/*.json`, not from the palette source.

### Dark variants — terminal background and foreground

| Variant | `terminal.background` | `terminal.foreground` |
| --------- | ------------------------ | -------------------------- |
| Midnight | `#050a12` | `#d0dce4` |
| Abyss | `#020c14` | `#d0dce4` |
| Reef | `#002129` | `#d0dce8` |
| Bay | `#081410` | `#e0ebe4` |
| Dawn | `#2a2436` | `#e8e0de` |
| Mist | `#212d3b` | `#e4e8ec` |
| Ash | `#1f2329` | `#e5e7eb` |
| Nebula | `#0d071a` | `#e0dae8` |
| Nocturne | `#1e1912` | `#f0e4d0` |
| Finance | `#0b111a` | `#d4d0c8` |
| Corporate | `#1d1f21` | `#c8c4c0` |
| Luxe | `#0a080c` | `#f0ece8` |
| Secure | `#0c1816` | `#e3eaed` |
| Sentinel | `#081019` | `#e2eaed` |
| Steward | `#18161f` | `#e7edf1` |
| Terminal | `#060606` | `#b8c8b8` |
| Vault | `#0e141c` | `#e6ebef` |
| Voltage | `#181d1a` | `#edf6ee` |
| Or | `#0a0800` | `#e8d5a3` |
| Neon | `#08040f` | `#e0dae8` |

Light surfaces for the light variants:

| Variant | `terminal.background` | `terminal.foreground` |
| --------- | ------------------------ | ------------------------ |
| Light | `#f1f5f9` | `#0f172a` |
| Ivory | `#efe6d8` | `#2a2420` |
| Ledger | `#e8e2d9` | `#24313a` |
| Audit | `#edf1f5` | `#25313a` |
| Dark Ivory | `#25211a` | `#eee2d4` |

ANSI slots follow the same palette. On light variants they stay tuned for dark shells, so `npm run verify:terminal` — not this table — is the authority on contrast.

### ANSI mapping — Dusk Office (base theme)

All 27 variants ship a complete 16-slot ANSI palette. These are the **base theme** (`◑ Dusk Office · Base`) values; each variant remaps them, often only in the cyan/green families. Finance for instance uses a gold `#c9a227` where the base uses `#c9a85c`, and Sentinel moves every slot to its rust/teal identity.

| Color | Standard | Bright |
| ------- | ---------- | -------- |
| Black | `#1e1e1e` | `#6b7280` |
| Red | `#c97565` | `#c09898` |
| Green | `#5a9a6a` | `#8ab898` |
| Yellow | `#c9a85c` | `#d0b868` |
| Blue | `#6a9ab8` | `#7a98b0` |
| Magenta | `#9a8ab8` | `#a090a8` |
| Cyan | `#7ab0c8` | `#8ab5c8` |
| White | `#e5e5e5` | `#fafafa` |

Read the exact values for a specific variant from `themes/<slug>.json` under `colors["terminal.ansi*"]`, or run `Dusk Office: Verify Terminal Contrast`. Terminal cursor and selection colours match the active theme accent.

### Check contrast

**For users (public):**
Run the built-in VS Code command:

- `Cmd/Ctrl + Shift + P` -> `Dusk Office: Verify Terminal Contrast`

This displays contrast ratios for all Dusk Office themes and confirms WCAG AA compliance (4.5:1 minimum).
It runs real checks on packaged themes, merges `include` chains, and can open a detailed markdown report from the command result.

**For developers (local source):**
After regenerating themes, run:

```bash
npm run verify:terminal
```

This verifies **`terminal.foreground`** vs **`terminal.background`** (WCAG **4.5:1** for default text) and, for **`vs-dark`** / **`hc-black`** themes, ANSI colors (except black slots) at **≥ 2.9:1** vs the terminal background. **Light** themes (`uiTheme: vs`) only check the default terminal text contrast — ANSI checks are skipped because the same hexes target dark terminal backgrounds.

### Reset everything

**For users (public):**
Run the built-in VS Code command:

- `Cmd/Ctrl + Shift + P` -> `Dusk Office: Reset All Settings`

This completely resets all Dusk Office settings and returns to VS Code defaults, including themes, product icons, activity bar position, auto switch, adaptive focus settings, and all stored preferences.

**For developers (local source):**
If you need to reset development settings or clear corrupted state, you can also run the same command - it works identically for both users and developers.

Quick “if you want…” picks and the full theme table: **[README — Pick a Variant](./README.md#pick-a-variant)** · [GitHub](https://github.com/SIDIKICONDE/dusk-office-docs/blob/main/README.md#pick-a-variant) and [Included Themes](#included-themes) above.
