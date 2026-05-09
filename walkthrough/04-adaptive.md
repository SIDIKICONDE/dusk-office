# Adapt to your day, your night, your language 🌗

Dusk Office offers **two automation layers** — both fully optional, both running locally.

## Auto Day & Night Switch

Switches your theme between a light and a dark variant based on the time:

```jsonc
"duskOffice.autoSwitch.enabled": true,
"duskOffice.autoSwitch.lightHour": 8,
"duskOffice.autoSwitch.darkHour": 18
```

## Adaptive Focus

A finer-grained mode that switches theme based on the **active editor language** plus the time of day. Useful if you context-switch between SQL audits in the morning and Python ML in the evening.

For example:

- `python` + daytime → `Dusk Office Steward`
- `python` + nighttime → `Dusk Office Bay`
- `sql` + audit context → `Dusk Office Audit`

Configurable via `duskOffice.adaptiveFocus.*` settings — including a **late-night eye-comfort mode** and a **theme lock** when you find a setup you love.

Click **"Toggle Adaptive Focus"** below to enable, and **"Apply Adaptive Theme Now"** to see it pick a variant for your current file.
