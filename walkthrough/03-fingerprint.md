# Let Dusk match your project automatically 🔍

Open a workspace and Dusk Office **scans top-level project files** to suggest the variant tuned for your context:

| If your project has… | Dusk suggests |
|---|---|
| `stripe`, `plaid`, `dwolla` (fintech) | **Vault** |
| `quickbooks`, `xero`, audit/SOX keywords | **Audit** |
| `helmet`, `jsonwebtoken`, `*.tf`, Vault, Falco | **Sentinel** |
| `numpy`, `pandas`, FastAPI, Django, Jupyter | **Steward** |
| Next, Astro, Vite, Bun, Deno | **Voltage** |
| React, Vue, Svelte, Tailwind, Storybook | **Nocturne** |
| Go, Rust+clap, Terraform, Makefile | **Terminal** |

**Privacy first:**

- Detection runs **entirely locally**, no network calls, no telemetry
- Reads only top-level manifests (capped at 256 KB), never recurses into your code
- The suggestion is shown **at most once per workspace**
- Opt-out anytime via `duskOffice.workspaceFingerprint.enabled`

Click **"Try the suggestion for this workspace"** below to see what Dusk Office thinks fits this project.
