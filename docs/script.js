// Dusk Office landing — vanilla JS, zero dependencies.
// Click a variant card to copy its full identifier (e.g. "Dusk Office Vault")
// to the clipboard, with a small visual confirmation.

(function () {
  "use strict";

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

  function flashLabel(button, message) {
    const tag = button.querySelector(".vtag");
    if (!tag) return;
    const original = tag.textContent;
    tag.textContent = message;
    tag.style.color = "#67e8f9";
    setTimeout(() => {
      tag.textContent = original;
      tag.style.color = "";
    }, 1400);
  }

  document.querySelectorAll(".variant").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name");
      if (!name) return;
      copyToClipboard(name)
        .then(() => flashLabel(btn, "Copied — paste into the picker"))
        .catch(() => flashLabel(btn, "Copy failed"));
    });
  });

  // Smooth scroll for in-page nav links
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
})();
