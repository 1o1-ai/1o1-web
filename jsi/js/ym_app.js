/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

(function (ym_root) {
  "use strict";

  var YM_BASE = "/jsi/";

  function ymEsc(ym_value) {
    return String(ym_value == null ? "" : ym_value).replace(/[&<>"']/g, function (ym_ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ym_ch];
    });
  }

  function ymFetchJson(ym_name) {
    return fetch(YM_BASE + "data/" + ym_name, { cache: "no-cache" }).then(function (ym_res) {
      if (!ym_res.ok) throw new Error("Could not load " + ym_name);
      return ym_res.json();
    });
  }

  function ymStatusLabel(ym_id) {
    var ym_map = {
      available: "Available",
      pilot: "Pilot",
      proposed: "Proposed integration",
      demonstration: "Demonstration",
      "in-flight": "In Flight"
    };
    return ym_map[ym_id] || ym_id;
  }

  function ymBadge(ym_id) {
    return '<span class="jsi-badge" data-status="' + ymEsc(ym_id) + '">' + ymEsc(ymStatusLabel(ym_id)) + "</span>";
  }

  function ymBindMenu() {
    var ym_toggle = document.getElementById("jsi-menu-toggle");
    var ym_nav = document.getElementById("jsi-nav");
    if (!ym_toggle || !ym_nav) return;
    ym_toggle.addEventListener("click", function () {
      var ym_open = !ym_nav.classList.contains("is-open");
      ym_nav.classList.toggle("is-open", ym_open);
      ym_toggle.setAttribute("aria-expanded", ym_open ? "true" : "false");
    });
    document.addEventListener("keydown", function (ym_ev) {
      if (ym_ev.key === "Escape") {
        ym_nav.classList.remove("is-open");
        ym_toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function ymMarkCurrentNav() {
    var ym_path = location.pathname.replace(/index\.html$/, "");
    if (!ym_path.endsWith("/")) ym_path += "/";
    document.querySelectorAll("#jsi-nav a").forEach(function (ym_a) {
      var ym_href = ym_a.getAttribute("href") || "";
      if (ym_href.indexOf("#") !== -1 && ym_href.indexOf("/jsi/#") === 0 && /\/jsi\/?$/.test(ym_path)) {
        return;
      }
      var ym_clean = ym_href.split("#")[0];
      if (ym_clean && ym_path.indexOf(ym_clean) === 0 && ym_clean !== "/jsi/") {
        ym_a.setAttribute("aria-current", "page");
      }
    });
  }

  function ymParagraphs(ym_list) {
    return (ym_list || []).map(function (ym_p) {
      return "<p>" + ymEsc(ym_p) + "</p>";
    }).join("");
  }

  function ymBullets(ym_list) {
    if (!ym_list || !ym_list.length) return "";
    return "<ul>" + ym_list.map(function (ym_item) {
      return "<li>" + ymEsc(ym_item) + "</li>";
    }).join("") + "</ul>";
  }

  function ymRenderSolution(ym_item) {
    var ym_host = document.getElementById("ym-solution");
    if (!ym_host || !ym_item) return;
    var ym_html = "";
    ym_html += '<p class="eyebrow">Solution · ' + ymEsc(ymStatusLabel(ym_item.status)) + "</p>";
    ym_html += "<h1>" + ymEsc(ym_item.title) + "</h1>";
    ym_html += '<div class="jsi-status-row" style="justify-content:flex-start">' + ymBadge(ym_item.status) + "</div>";
    ym_html += '<p class="lede" style="margin-left:0">' + ymEsc(ym_item.lede) + "</p>";
    ym_html += '<div class="jsi-prose">';
    (ym_item.sections || []).forEach(function (ym_sec) {
      ym_html += "<h3>" + ymEsc(ym_sec.heading) + "</h3>";
      ym_html += ymParagraphs(ym_sec.paragraphs);
      ym_html += ymBullets(ym_sec.bullets);
    });
    ym_html += "</div>";
    if (ym_item.technical) {
      ym_html += '<details class="jsi-details"><summary>' + ymEsc(ym_item.technical.summary) + "</summary>";
      ym_html += '<div class="jsi-prose">' + ymParagraphs(ym_item.technical.paragraphs) + "</div></details>";
    }
    ym_html += '<p class="launch-row" style="margin-top:28px">';
    ym_html += '<a class="btn-primary" href="/jsi/see-ai-at-work/">See AI at work</a>';
    ym_html += '<a class="btn-secondary" href="/jsi/#contact">Discuss your deployment</a>';
    ym_html += "</p>";
    ym_host.innerHTML = ym_html;
  }

  function ymInitSolutionPage() {
    var ym_page = document.body.getAttribute("data-ym-page");
    if (!ym_page || ym_page === "home" || ym_page === "demo") return;
    ymFetchJson("solutions.json").then(function (ym_data) {
      var ym_item = (ym_data.items || []).filter(function (ym_s) {
        return ym_s.id === ym_page;
      })[0];
      ymRenderSolution(ym_item);
    }).catch(function (ym_err) {
      var ym_host = document.getElementById("ym-solution");
      if (ym_host) ym_host.innerHTML = "<p>This solution page could not load its content file.</p>";
      console.error(ym_err);
    });
  }

  ym_root.JsiYm = {
    base: YM_BASE,
    esc: ymEsc,
    fetchJson: ymFetchJson,
    badge: ymBadge,
    statusLabel: ymStatusLabel
  };

  function ymBindNexus() {
    document.addEventListener("click", function (ym_ev) {
      var ym_trigger = ym_ev.target.closest && ym_ev.target.closest("[data-nexus-open]");
      if (!ym_trigger) return;
      ym_ev.preventDefault();
      var ym_api = window.BrahmexaNexus;
      var ym_ask = ym_trigger.getAttribute("data-nexus-ask");
      if (ym_api && typeof ym_api.ask === "function" && ym_ask) {
        ym_api.ask(ym_ask);
        return;
      }
      if (ym_api && typeof ym_api.open === "function") {
        ym_api.open();
        return;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ymBindMenu();
    ymMarkCurrentNav();
    ymInitSolutionPage();
    ymBindNexus();
  });
})(window);
