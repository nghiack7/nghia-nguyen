// Generic [data-i18n] updater for elements OUTSIDE the chat panel.
// The chat panel has its own specialised handler in chat.js (placeholder,
// suggestions, welcome message). Anything else with a data-i18n="a.b.c"
// path is updated here on initial load and on every "lang-changed" event.

(function () {
  function getCurrentLang() {
    return localStorage.getItem("lang") || document.documentElement.lang || "en";
  }

  function resolvePath(obj, path) {
    if (!obj || typeof path !== "string") return undefined;
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function applyOnce() {
    const lang = getCurrentLang();
    const dict = window.CONTENT && window.CONTENT[lang];
    if (!dict) return false;

    const nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach((el) => {
      // Skip elements inside the chat panel — chat.js owns those.
      if (el.closest("#chat-panel")) return;
      const path = el.dataset.i18n;
      const value = resolvePath(dict, path);
      if (typeof value === "string") {
        el.textContent = value;
      }
    });
    return true;
  }

  function waitForContent() {
    if (applyOnce()) return;
    setTimeout(waitForContent, 50);
  }

  window.addEventListener("lang-changed", () => {
    applyOnce();
  });

  waitForContent();
})();
