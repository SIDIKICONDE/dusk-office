# Promotion playbook — Dusk Office

> Internal copy-paste reference for community posts. Not shipped in the VSIX (add to `.vscodeignore` if needed).

---

## 1. Reddit — `/r/vscode`

**Subreddit rules**: keep it useful, link the Marketplace, don't be salesy. Mods remove low-effort posts. Always include a screenshot.

### Title (pick one)

- `I open-sourced my VS Code theme pack: 26 dark/light/HC variants tuned for finance, audit, cybersecurity & DevOps work [GPL v3]`
- `26 themes for long coding sessions — WCAG-verified contrast, semantic highlighting, adaptive focus [Dusk Office, GPL v3]`
- `Just open-sourced "Dusk Office" — a 26-variant theme pack designed for professional contexts (audit, banking, SOC, DevOps)`

### Body (Markdown)

```markdown
Hey r/vscode 👋

After ~6 months of iteration, I just open-sourced **Dusk Office** under GPL v3. It's a theme pack with **26 variants** — dark, light, and high-contrast — designed for professional contexts where you spend 8+ hours staring at code: finance, audit, banking, fintech, SOC monitoring, DevOps.

**Marketplace**: https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office
**Open VSX** (Cursor / VSCodium / Theia): https://open-vsx.org/extension/dekidev/dusk-office
**GitHub** (GPL v3): https://github.com/SIDIKICONDE/dusk-office

### What makes it different from "yet another theme pack"

- **One coherent family** — 26 variants share the same chrome philosophy, no random skins
- **Niche variants by name**: `Audit`, `Vault`, `Sentinel`, `Steward`, `Ledger`, `Treasury`, `Nocturne`, `Voltage`, etc. — each tuned for a context
- **WCAG-verified terminal contrast** — every theme passes 4.5:1 on `terminal.foreground` and 2.9:1 on ANSI colors (except black). Yes I wrote a script that fails CI if you regress this.
- **Semantic highlighting** fully covered, not just TextMate scopes
- **Adaptive focus** — switches theme based on language + time of day (lockable, fully optional, runs locally)
- **Auto day/night switch** — set `lightHour`/`darkHour` in settings, done
- **Workspace memory** — remembers your theme per workspace
- **No companion installs**, no telemetry, no network calls — everything local
- **Reset All Settings** command if you want to undo everything (rare in theme extensions)

### What it looks like

[Insert your best screenshot here — show 2-3 variants side by side ideally]

### Why open source now?

It was originally proprietary. After hitting 2,700 downloads on Open VSX I figured the community would benefit more if anyone could fork, contribute language-specific tweaks, fix bugs, and add their own variants. License is now GPL v3 — meaning forks must stay open source too.

### Want a specific niche variant?

Open an issue on the GitHub repo. The build pipeline (theme-sources → variant generators → WCAG validators) is fully automated, so adding a new variant takes ~10 minutes.

Happy coding 🌒
```

### Best time to post
- **Tuesday or Wednesday, 9–11 AM ET** (peak r/vscode activity)
- Avoid Friday afternoon and weekends (low engagement)

### After posting
- **Don't delete and re-post** if it doesn't perform — Reddit penalizes repeats
- **Engage with every comment in the first 2 hours** — the algorithm rewards velocity
- **Don't link your own product in comments**, mods will remove it as self-promotion. The Marketplace link in the body is fine.

---

## 2. Reddit — `/r/cursor`

### Title

- `Free open-source theme pack for Cursor: 26 variants tuned for professional work (finance, audit, SOC, DevOps)`

### Body (Markdown)

```markdown
For folks looking for something beyond the default Cursor theme — I just open-sourced **Dusk Office**, a 26-variant theme pack on Open VSX (so it works natively in Cursor without sideloading).

**Open VSX**: https://open-vsx.org/extension/dekidev/dusk-office
**Source** (GPL v3): https://github.com/SIDIKICONDE/dusk-office

Install: Cursor → Extensions → search `Dusk Office` → Install. Then `Cmd+K Cmd+T` to pick a variant.

Designed for the kind of work where readability matters: long audit sessions, financial systems, SOC dashboards. Every theme passes WCAG terminal contrast (4.5:1) and semantic highlighting is fully covered.

26 variants:
- **Dark**: Dusk Office, Abyss, Dawn, Bay, Mist, Ash, Midnight, Nebula, Reef, Audit, Vault, Sentinel, Steward, Ledger, Treasury, Nocturne, Voltage, Recif, Secure, Terminal, Neon, Dark Ivory
- **Light**: Light, Ivory, Audit Light
- **High contrast**: Dusk Office HC

Includes adaptive focus (switches theme based on language) and auto day/night switch if you want it. All optional.

Free + GPL v3. Feedback welcome.
```

---

## 3. dev.to / Hashnode article

### Title

- `Building a 26-variant VS Code theme pack: lessons from validating WCAG terminal contrast in CI`

### Angle

Don't write "look at my pretty theme". Write a **technical article** about the engineering challenges:

1. How VS Code themes work (color keys, TextMate scopes, semantic tokens)
2. The "26 variants from one source" pipeline (theme-sources → merge scripts → output JSON)
3. Why WCAG terminal contrast matters and how to verify it programmatically
4. Adaptive focus implementation (active editor language → theme mapping)
5. The boring-but-important: workspace memory, title bar style restoration, race conditions

End with: "Source is GPL v3, fork it: github.com/SIDIKICONDE/dusk-office"

This converts because:
- Devs learn something
- The theme link feels earned, not salesy
- Cross-posts naturally to Hacker News

### Length
- 800–1500 words
- 1 hero screenshot
- 2-3 code snippets from the actual repo

---

## 4. Hacker News (Show HN)

### Title

- `Show HN: Dusk Office – 26 GPL v3 VS Code themes for finance, audit, cybersecurity work`

### Body

Short. HN hates marketing.

```
After ~6 months of iteration, I open-sourced my VS Code/Cursor theme pack
under GPL v3. 26 variants — dark/light/HC — with WCAG-verified terminal
contrast, semantic highlighting, and an adaptive focus mode that switches
theme based on the active language.

Built for professional contexts: audit, banking, SOC monitoring, DevOps.
Every variant share the same chrome philosophy so they feel like a family
rather than random skins.

Free, no telemetry, no companion installs, runs entirely locally.

Marketplace: https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office
Open VSX: https://open-vsx.org/extension/dekidev/dusk-office
Source: https://github.com/SIDIKICONDE/dusk-office

Happy to answer questions about the validation pipeline, theme generation,
or adaptive focus implementation.
```

### Best time
- **Weekdays 8–10 AM ET** (HN front page voting peak)

---

## 5. Twitter/X thread

```
🌒 Just open-sourced Dusk Office under GPL v3.

26 VS Code / Cursor / Windsurf themes designed for the kind of work you
actually do at a job: finance, audit, banking, SOC, DevOps.

WCAG-verified terminal contrast. Semantic highlighting. Adaptive focus.

🧵 1/8
```

```
What it actually looks like: [screenshot grid 2x2]
2/8
```

```
Why 26 variants?

Each one is tuned for a specific context. "Audit" uses cooler blues for
analytical work. "Vault" leans toward institutional banking aesthetics.
"Sentinel" uses higher saturation for SOC dashboard fatigue.

Same chrome philosophy across all 26. Not random skins.
3/8
```

```
The non-obvious feature: WCAG validation in CI.

Every theme has its terminal foreground tested against the background
for 4.5:1 contrast (WCAG 2.1 AA). ANSI colors get 2.9:1 minimum
(except black on dark, which is intentionally low-contrast).

If a PR regresses this, the build fails.
4/8
```

```
Adaptive focus mode (optional, off by default):

Detects the active editor language and time of day, switches theme
accordingly. Useful if you context-switch between SQL audit work in
the morning and Python ML in the evening.

Runs entirely locally. No telemetry.
5/8
```

```
Why GPL v3?

Was proprietary. Hit 2,700 downloads on Open VSX as proprietary.
Went open source so the community can contribute, fork, add
language-specific tweaks. Picked GPL v3 (not MIT) so forks must
stay open source — no one can close it back into a paid product.

Free to use, free to modify, but stays free for everyone.
6/8
```

```
Install:

VS Code: marketplace.visualstudio.com/items?itemName=dekidev.dusk-office
Cursor / VSCodium: open-vsx.org/extension/dekidev/dusk-office
Source: github.com/SIDIKICONDE/dusk-office

7/8
```

```
If you want a niche variant for your specific stack (Rust, R, Solidity,
etc.) open an issue. The build pipeline is automated so adding a new
variant is fast.

8/8 ⊡
```

---

## 6. Pre-flight checklist before posting

- [ ] Take **3-5 high-quality screenshots** at 2560x1440, showing real code (TypeScript, Python, JSON, terminal)
- [ ] Pick **3 different variants** to show: 1 dark mainstream (Dusk Office), 1 niche (Vault or Sentinel), 1 light (Ivory)
- [ ] Each screenshot should show: editor + minimap + integrated terminal + sidebar with file tree
- [ ] Make sure your code samples don't contain any NDA / private repo content
- [ ] Verify the Marketplace listing renders correctly (icons, banner color, screenshots)
- [ ] **Don't post all platforms the same day** — spread over a week to keep momentum and not look spammy

---

## 7. Order recommended

1. **Day 1**: Reddit r/vscode + r/cursor (both same day OK, different subreddits)
2. **Day 2**: Twitter/X thread
3. **Day 3-4**: dev.to article (more effort, schedule it)
4. **Day 5**: Hacker News (Show HN)
5. **Always-on**: Reply to anyone who comments on the GitHub repo

Track which platform sends the most traffic via the Marketplace's built-in stats (publisher dashboard).
