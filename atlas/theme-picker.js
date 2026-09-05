/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

(function () {
  "use strict";

  var STORAGE_KEY = "brahmexa_cosmic_theme";
  var LEGACY_KEY = "manjulab_cosmic_theme";
  var YM_THEMES = [
    { id: "eden", label: "Eden" },
    { id: "cosmic", label: "Cosmic" },
    { id: "ember", label: "Ember" },
    { id: "violet", label: "Violet" },
    { id: "slate", label: "Slate" },
    { id: "aurora", label: "Aurora" },
    { id: "dawn", label: "Dawn" },
    { id: "paper", label: "Paper" },
    { id: "noir", label: "Noir" },
    { id: "ivory", label: "Ivory" },
  ];

  var ym_panel = null;
  var ym_toggle = null;

  function ymIsLightTheme(id) {
    return id === "dawn" || id === "paper" || id === "ivory";
  }

  function ymSyncLegacyTheme(id) {
    var ym_mode = ymIsLightTheme(id) ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", ym_mode);
    try { localStorage.setItem("brahmexa-theme", ym_mode); } catch (e) { /* ignore */ }
  }

  function ymApplyTheme(id) {
    if (!id) return;
    document.documentElement.setAttribute("data-cosmic-theme", id);
    ymSyncLegacyTheme(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
    document.querySelectorAll(".cosmic-theme-swatch").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-theme") === id);
    });
  }

  function ymSetOpen(open) {
    if (!ym_panel || !ym_toggle) return;
    ym_panel.hidden = !open;
    ym_toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function ymMount() {
    if (document.getElementById("cosmicThemePicker")) {
      ym_panel = document.getElementById("cosmicThemePanel");
      ym_toggle = document.querySelector("#cosmicThemePicker .cosmic-theme-picker-toggle");
      return;
    }

    var ym_wrap = document.createElement("div");
    ym_wrap.id = "cosmicThemePicker";
    ym_wrap.className = "cosmic-theme-picker";
    ym_wrap.innerHTML =
      '<button type="button" class="cosmic-theme-picker-toggle" aria-expanded="false" aria-controls="cosmicThemePanel" title="Color palette">🎨</button>' +
      '<div id="cosmicThemePanel" class="cosmic-theme-picker-panel" hidden>' +
      "<h4>Brahmexa palette</h4>" +
      '<div class="cosmic-theme-picker-grid">' +
      YM_THEMES.map(function (t) {
        return '<button type="button" class="cosmic-theme-swatch" data-theme="' + t.id + '">' + t.label + "</button>";
      }).join("") +
      "</div></div>";

    document.body.appendChild(ym_wrap);
    ym_toggle = ym_wrap.querySelector(".cosmic-theme-picker-toggle");
    ym_panel = ym_wrap.querySelector(".cosmic-theme-picker-panel");

    ym_toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      ymSetOpen(!!ym_panel.hidden);
    });
    ym_wrap.querySelectorAll(".cosmic-theme-swatch").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        ymApplyTheme(btn.getAttribute("data-theme"));
        ymSetOpen(false);
      });
    });
    document.addEventListener("click", function (ev) {
      if (!ev.target || ym_wrap.contains(ev.target)) return;
      ymSetOpen(false);
    });
  }

  window.BrahmexaTheme = { applyTheme: ymApplyTheme, themes: YM_THEMES };

  document.addEventListener("DOMContentLoaded", function () {
    var ym_saved = "eden";
    try {
      ym_saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY) || "eden";
    } catch (e) { /* ignore */ }
    ymApplyTheme(ym_saved);
    ymMount();
  });
})();
