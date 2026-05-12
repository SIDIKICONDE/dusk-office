# A theme that adapts to your rhythm 🌗

Most themes are static. Dusk Office **moves with you** — shifting palette based on the time of day and the language you're editing. Two automation layers, both optional, both 100% local.

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

For developers who context-switch all day — picks a variant based on your **active file language** and the **current hour**:

| You're editing… | Time | Dusk applies |
|---|---|---|
| Python / Jupyter | Day | **Steward** — data-viz warm tones |
| Python / Jupyter | Night | **Bay** — calm deep focus |
| SQL / audit context | Any | **Audit** — high-contrast review |
| TypeScript / React | Night | **Nocturne** — deep indigo |
| Terraform / Go | Any | **Terminal** — CLI-optimized |

### Late-night eye comfort

After 10 PM, Dusk Office can force an ultra-dark variant — protecting your eyes without you lifting a finger. Configure via `duskOffice.adaptiveFocus.lateNightStartHour`.

### Lock your favorite

Found the perfect combo? Use `duskOffice.adaptiveFocus.lockTheme` to freeze it.

---

Click **"Toggle Adaptive Focus"** below to enable, then **"Apply Adaptive Theme Now"** to watch it pick a variant for your current file in real time.
