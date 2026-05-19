# A theme that adapts to your rhythm 🌗

Most themes are static. Dusk Office **moves with you** — shifting palette based on the time of day and the language you're editing. Two automation layers, both optional, both 100% local.

> **Note:** Enabling one disables the other — **Auto Day/Night** and **Adaptive Focus** cannot run at the same time.

## Auto Day/Night Switch

Your screen should match the light around you. Set once, forget forever:

```jsonc
"duskOffice.autoSwitch.enabled": true,
"duskOffice.autoSwitch.lightTheme": "Dusk Office Ivory",
"duskOffice.autoSwitch.lightHour": 8,
"duskOffice.autoSwitch.darkTheme": "Dusk Office Midnight",
"duskOffice.autoSwitch.darkHour": 18
```

8 AM — your editor brightens. 6 PM — it deepens. No manual switching.

## Adaptive Focus

Picks a variant from the **active editor language** and the **current hour**. Logic lives in **`lib/theme-common.js`** (`ADAPTIVE_LANGUAGE_RULES`). Configure day hours, defaults, and per-language overrides in Settings (`duskOffice.adaptiveFocus.*`).

### How a theme is chosen (priority order)

1. **`lockTheme`** — if set to a Dusk Office variant, always use it.
2. **Late-night eye comfort** — between `lateNightStartHour` (default **22**) and `lateNightEndHour` (default **5**), forces **Dusk Office Midnight**.
3. **Language rule** — see table below.
4. **Default** — **Ivory** during the day window, **Midnight** at night.

**Day window:** hours **7–17** (7:00 inclusive → 18:00 exclusive). Outside that window counts as night for language rules.

### Examples

| You're editing… | Time | Dusk applies |
|---|---|---|
| Python | Day (7h–17h) | **Ivory** — warm paper-like light |
| Python | Night | **Abyss** — deep blue focus |
| TypeScript / JavaScript | Night | **Nebula** — purple-violet accents |
| SQL / Bash / Zsh | Night | **Finance** — banking-style dark |
| Go | Night | **Reef** — cyan lagoon |
| Rust | Night | **Corporate** — restrained executive dark |
| Markdown | Night | **Nocturne** — warm vintage terminal |
| (any language, 22h–5h) | Late night | **Midnight** — eye comfort override |
| Unknown language | Day | **Ivory** |
| Unknown language | Night | **Midnight** |

### Full language map

| Language ID | Day (7h–17h) | Night |
|---|---|---|
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

Languages not listed fall back to **Ivory** (day) or **Midnight** (night).

> **Workspace Fingerprint** (first open) uses different rules — it suggests a variant from project files (`package.json`, `pyproject.toml`, etc.), not from the active editor language. See the fingerprint walkthrough step.

### Settings

| Setting | Default | Role |
|---|---|---|
| `duskOffice.adaptiveFocus.enabled` | `false` | Turn adaptive focus on |
| `duskOffice.adaptiveFocus.onlyWhenDuskThemeActive` | `true` | Only apply when a Dusk theme is already active |
| `duskOffice.adaptiveFocus.lateNightEyeComfort` | `true` | Force Midnight during late hours |
| `duskOffice.adaptiveFocus.lateNightStartHour` | `22` | Start of late-night window (0–23) |
| `duskOffice.adaptiveFocus.lateNightEndHour` | `5` | End of late-night window (0–23) |
| `duskOffice.adaptiveFocus.lockTheme` | `""` | Freeze one variant (empty = no lock) |

### Lock your favorite

Found the perfect combo? Set `duskOffice.adaptiveFocus.lockTheme` to any Dusk Office variant name (e.g. `"Dusk Office Steward"`) to freeze it.

---

Click **"Toggle Adaptive Focus"** below to enable, then **"Apply Adaptive Theme Now"** to watch it pick a variant for your current file in real time (works even when adaptive focus is off — preview only).
