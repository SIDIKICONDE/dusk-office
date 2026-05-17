// Dusk Office landing — vanilla JS, zero dependencies.
// Renders the 27-variant gallery using each theme's actual editor.background,
// editor.foreground and accent color, so each card is a real mini-preview of
// the theme it represents. Click a card → the variant identifier is copied to
// the clipboard for direct paste into the VS Code picker.

(function () {
  "use strict";

  /**
   * @type {Array<{
   *   label: string, niche: string, bg: string, fg: string, accent: string
   * }>}
   *
   * Colors mirror the actual editor.background / editor.foreground / accent
   * shipped in themes/*.json, extracted via scripts and pinned here.
   */
  const VARIANTS = [
    { label: "Dusk Office", niche: "Default · OLED-friendly dark", bg: "#040a10", fg: "#cfe8f0", accent: "#22d3ee" },
    { label: "Dusk Office Abyss", niche: "Deep night · OLED-friendly", bg: "#020c14", fg: "#cfe8f0", accent: "#5a9aaa" },
    { label: "Dusk Office Dawn", niche: "Plum sunrise · warm dawn", bg: "#2a2436", fg: "#e8e0de", accent: "#ffb38a" },
    { label: "Dusk Office Bay", niche: "Deep teal · calm waters", bg: "#081410", fg: "#ecfdf5", accent: "#6a9a78" },
    { label: "Dusk Office Mist", niche: "Cool slate · misty morning", bg: "#222f3d", fg: "#f4f9fc", accent: "#7dd3fc" },
    { label: "Dusk Office Ash", niche: "Neutral grey · timeless", bg: "#22262d", fg: "#e5e7eb", accent: "#a3b8cc" },
    { label: "Dusk Office Midnight", niche: "Pure black · late night", bg: "#020304", fg: "#d1e0e8", accent: "#22d3ee" },
    { label: "Dusk Office Nebula", niche: "Cosmic violet", bg: "#10081f", fg: "#f3e8ff", accent: "#c084fc" },
    { label: "Dusk Office Reef", niche: "Aqua reef", bg: "#002830", fg: "#cffafe", accent: "#4ab8c8" },
    { label: "Dusk Office Nocturne", niche: "Warm night · Monokai-like", bg: "#24201c", fg: "#f8f8f2", accent: "#ff9d40" },
    { label: "Dusk Office Audit", niche: "Light · audit & compliance", bg: "#e3e8ec", fg: "#25313a", accent: "#556f83" },
    { label: "Dusk Office Vault", niche: "Fintech · banking", bg: "#1a1814", fg: "#e6ebef", accent: "#dcc894" },
    { label: "Dusk Office Sentinel", niche: "Cybersecurity · SOC", bg: "#121a22", fg: "#e2eaed", accent: "#8fbfc0" },
    { label: "Dusk Office Steward", niche: "ML · data · Python backend", bg: "#16141e", fg: "#e7edf1", accent: "#dec692" },
    { label: "Dusk Office Voltage", niche: "Modern web stacks", bg: "#151a17", fg: "#edf6ee", accent: "#d5ff88" },
    { label: "Dusk Office Ledger", niche: "Light · accounting", bg: "#ece7de", fg: "#24313a", accent: "#658297" },
    { label: "Dusk Office Secure", niche: "Security ops", bg: "#0a1e1c", fg: "#e3eaed", accent: "#8fbdbc" },
    { label: "Dusk Office Finance", niche: "Markets · trading", bg: "#0d1520", fg: "#e8e6e3", accent: "#22d3ee" },
    { label: "Dusk Office Corporate", niche: "Enterprise · neutral", bg: "#1d1f21", fg: "#c5c8c6", accent: "#8a6f4a" },
    { label: "Dusk Office Neon", niche: "Vivid pink · violet", bg: "#0a0612", fg: "#f0e6ff", accent: "#ff6eb4" },
    { label: "Dusk Office Luxe", niche: "Gold · champagne", bg: "#0c0a0e", fg: "#f0ece8", accent: "#e8c4a0" },
    { label: "Dusk Office Or", niche: "Or · bronze profond", bg: "#0a0800", fg: "#e8d5a3", accent: "#ffd700" },
    { label: "Dusk Office Terminal", niche: "CRT green · CLI vibes", bg: "#0a0a0a", fg: "#b8ffb0", accent: "#66ff33" },
    { label: "Dusk Office Light", niche: "Light · daytime default", bg: "#f8fafc", fg: "#0f172a", accent: "#0e7490" },
    { label: "Dusk Office Ivory", niche: "Light · warm cream", bg: "#f6eede", fg: "#2a2420", accent: "#92400e" },
    { label: "Dusk Office Dark Ivory", niche: "Warm dark counterpart", bg: "#29241d", fg: "#eee2d4", accent: "#c89c5e" },
    { label: "Dusk Office High Contrast", niche: "HC · max accessibility", bg: "#000000", fg: "#ffffff", accent: "#22d3ee" },
  ];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(el);
      }
    });
  }

  /** WCAG relative luminance from "#rrggbb" → 0..1. */
  function luminance(hex) {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return 0.5;
    const v = m[1];
    const c = (s) => {
      const x = parseInt(s, 16) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(v.slice(0, 2)) + 0.7152 * c(v.slice(2, 4)) + 0.0722 * c(v.slice(4, 6));
  }

  function isLight(hex) {
    return luminance(hex) > 0.55;
  }

  /** Soft secondary text color = the foreground at 60% opacity over bg. */
  function muted(fg) {
    return fg + "99";
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function renderCard(v) {
    const card = document.createElement("button");
    card.className = "variant";
    card.setAttribute("data-name", v.label);
    card.setAttribute("aria-label", `Copy "${v.label}" to clipboard`);
    card.style.background = v.bg;
    card.style.color = v.fg;
    card.style.borderColor = isLight(v.bg)
      ? "rgba(0,0,0,0.10)"
      : "rgba(255,255,255,0.08)";

    // Mini preview line — fake 3-token code styled as the theme would render
    // a small snippet: keyword (accent), function name (fg), string (muted).
    const preview = document.createElement("div");
    preview.className = "vpreview";
    preview.innerHTML =
      '<span class="kw">const</span> ' +
      '<span class="fn">app</span> = ' +
      '<span class="str">"office"</span>';
    preview.style.color = muted(v.fg);
    preview.querySelector(".kw").style.color = v.accent;
    preview.querySelector(".fn").style.color = v.fg;
    preview.querySelector(".str").style.color = v.accent;
    preview.querySelector(".str").style.opacity = "0.85";

    const head = document.createElement("div");
    head.className = "vhead";
    head.innerHTML =
      '<span class="vdot"></span>' +
      `<span class="vlabel">${v.label.replace("Dusk Office ", "").replace("Dusk Office", "Default")}</span>`;
    head.querySelector(".vdot").style.background = v.accent;
    head.querySelector(".vdot").style.boxShadow = `0 0 12px ${v.accent}`;

    const tag = document.createElement("div");
    tag.className = "vtag";
    tag.textContent = v.niche;
    tag.style.color = muted(v.fg);

    card.appendChild(head);
    card.appendChild(preview);
    card.appendChild(tag);
    return card;
  }

  function flashCard(card, message) {
    const tag = card.querySelector(".vtag");
    if (!tag) return;
    const original = tag.textContent;
    const originalColor = tag.style.color;
    tag.textContent = message;
    tag.style.color = card.style.color;
    setTimeout(() => {
      tag.textContent = original;
      tag.style.color = originalColor;
    }, 1400);
  }

  function attachClickToCopy(card) {
    card.addEventListener("click", () => {
      const name = card.getAttribute("data-name");
      if (!name) return;
      copyToClipboard(name)
        .then(() => flashCard(card, "Copied — paste into the picker"))
        .catch(() => flashCard(card, "Copy failed"));
    });
  }

  function renderGrid() {
    const grid = document.getElementById("variant-grid");
    if (!grid) return;
    const frag = document.createDocumentFragment();
    for (const v of VARIANTS) {
      const card = renderCard(v);
      attachClickToCopy(card);
      frag.appendChild(card);
    }
    grid.appendChild(frag);
  }

  // Smooth scroll for in-page nav
  function attachSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id && id.length > 1) {
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderGrid();
      attachSmoothScroll();
    });
  } else {
    renderGrid();
    attachSmoothScroll();
  }
})();
