# Your project, your palette — automatically 🔍

Here's the magic moment: open any workspace and Dusk Office **reads your project's DNA** to suggest the perfect variant. No setup, no config — it just works.

### How it detects your context

| Your project signals… | Suggested variant | Why |
|---|---|---|
| Stripe, Plaid, Dwolla, payment SDKs | **Vault** | Financial data deserves a secure-feeling palette |
| QuickBooks, Xero, SOX/audit keywords | **Audit** | High-contrast for regulatory code review |
| Helmet, JWT, `*.tf`, Falco, security tools | **Sentinel** | Alert-ready colors for threat monitoring |
| NumPy, Pandas, FastAPI, Jupyter notebooks | **Steward** | Warm tones that work with data visualization |
| Next.js, Astro, Vite, Bun, Deno | **Voltage** | Energetic palette for modern runtimes |
| React, Vue, Svelte, Tailwind, Storybook | **Nocturne** | Deep indigo that pairs with component previews |
| Go, Rust+clap, Terraform, Makefile-heavy | **Terminal** | CLI-optimized, terminal-first contrast |

### Built on trust, not tracking

This is **not** analytics. This is a local heuristic that respects your privacy:

- **100% offline** — reads only top-level manifests (capped at 256 KB)
- **Never recurses** into your source code
- **Fires once** per workspace — never nags
- **Opt-out** anytime: `duskOffice.workspaceFingerprint.enabled → false`

---

Click **"Try the suggestion for this workspace"** — watch Dusk Office read your project and recommend a variant in under a second.
