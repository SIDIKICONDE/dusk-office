// Dusk Office landing — vanilla JS, zero dependencies.
// Renders the 27-variant gallery using each theme's actual editor.background,
// editor.foreground and accent color, so each card is a real mini-preview of
// the theme it represents. Click a card → the variant identifier is copied to
// the clipboard for direct paste into the VS Code picker.

(function () {
  "use strict";

  /**
   * Marketing niches stay here; colors come from generated
   * `docs/landing-themes.js` (`npm run build:bundle`) so they match themes/*.json.
   * Labels are assigned with textContent — do not interpolate untrusted HTML.
   */
  const NICHE_BY_NAME = {
    "Dusk Office": "Default · OLED-friendly dark",
    "Dusk Office Abyss": "Deep night · OLED-friendly",
    "Dusk Office Dawn": "Plum sunrise · warm dawn",
    "Dusk Office Bay": "Deep teal · calm waters",
    "Dusk Office Mist": "Cool slate · misty morning",
    "Dusk Office Ash": "Neutral grey · timeless",
    "Dusk Office Midnight": "Pure black · late night",
    "Dusk Office Nebula": "Cosmic violet",
    "Dusk Office Reef": "Aqua reef",
    "Dusk Office Nocturne": "Warm night · Monokai-like",
    "Dusk Office Audit": "Light · audit & compliance",
    "Dusk Office Vault": "Fintech · banking",
    "Dusk Office Sentinel": "Cybersecurity · SOC",
    "Dusk Office Steward": "ML · data · Python backend",
    "Dusk Office Voltage": "Modern web stacks",
    "Dusk Office Ledger": "Light · accounting",
    "Dusk Office Secure": "Security ops",
    "Dusk Office Finance": "Markets · trading",
    "Dusk Office Corporate": "Enterprise · neutral",
    "Dusk Office Neon": "Vivid pink · violet",
    "Dusk Office Luxe": "Gold · champagne",
    "Dusk Office Or": "Or · bronze profond",
    "Dusk Office Terminal": "CRT green · CLI vibes",
    "Dusk Office Light": "Light · daytime default",
    "Dusk Office Ivory": "Light · warm cream",
    "Dusk Office Dark Ivory": "Warm dark counterpart",
    "Dusk Office High Contrast": "HC · max accessibility",
  };

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function loadVariants() {
    const generated = globalThis.DUSK_OFFICE_LANDING_THEMES;
    if (!Array.isArray(generated)) return [];
    return generated
      .map((entry) => {
        const name = typeof entry?.name === "string" ? entry.name : "";
        return {
          label: name,
          niche: NICHE_BY_NAME[name] || "",
          bg: isHexColor(entry?.bg) ? entry.bg : "",
          fg: isHexColor(entry?.fg) ? entry.fg : "",
          accent: isHexColor(entry?.accent) ? entry.accent : "",
        };
      })
      .filter((variant) => variant.label && variant.bg && variant.fg && variant.accent);
  }

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
    const dot = document.createElement("span");
    dot.className = "vdot";
    dot.style.background = v.accent;
    dot.style.boxShadow = `0 0 12px ${v.accent}`;
    const label = document.createElement("span");
    label.className = "vlabel";
    label.textContent = v.label.replace("Dusk Office ", "").replace("Dusk Office", "Default");
    head.appendChild(dot);
    head.appendChild(label);

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
      // Copy name AND open marketplace — copy for picker, link for web visitors
      copyToClipboard(name)
        .then(() => flashCard(card, "Copied — paste into the picker"))
        .catch(() => flashCard(card, "Copy failed"));
      window.open("https://marketplace.visualstudio.com/items?itemName=dekidev.dusk-office", "_blank");
    });
  }

  function renderGrid() {
    const grid = document.getElementById("variant-grid");
    if (!grid) return;
    const frag = document.createDocumentFragment();
    for (const v of loadVariants()) {
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

  // Mobile hamburger toggle
  function attachNavToggle() {
    const btn = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!btn || !links) return;
    btn.addEventListener("click", () => {
      const open = links.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", String(open));
    });
    // Close nav when a link is clicked (mobile)
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("nav-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderGrid();
      attachSmoothScroll();
      attachNavToggle();
    });
  } else {
    renderGrid();
    attachSmoothScroll();
    attachNavToggle();
  }
})();
