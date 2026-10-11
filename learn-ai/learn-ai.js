/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved.
   Learn AI — orbit, path, and one-word lessons. */
(function () {
  const ym_bank = window.YM_LEARN_AI;
  const ym_storage_key = "ym_learn_ai_progress";
  const ym_words = ym_bank.words;
  const ym_orbits = ym_bank.orbits;
  let ym_return_view = "orbit";
  let ym_query = "";

  function ym_esc(ym_text) {
    return String(ym_text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ym_load() {
    try {
      const ym_raw = JSON.parse(localStorage.getItem(ym_storage_key) || "{}");
      return {
        held: Array.isArray(ym_raw.held) ? ym_raw.held : [],
        seen: Array.isArray(ym_raw.seen) ? ym_raw.seen : []
      };
    } catch (ym_err) {
      return { held: [], seen: [] };
    }
  }

  function ym_save(ym_progress) {
    localStorage.setItem(ym_storage_key, JSON.stringify(ym_progress));
  }

  function ym_word(ym_id) {
    return ym_words.find(function (ym_item) { return ym_item.id === ym_id; });
  }

  function ym_orbit(ym_ring) {
    return ym_orbits[ym_ring] || ym_orbits[0];
  }

  function ym_next_unheld(ym_progress) {
    return ym_words.find(function (ym_item) {
      return ym_progress.held.indexOf(ym_item.id) === -1;
    }) || ym_words[0];
  }

  function ym_parse() {
    const ym_hash = (location.hash || "").replace(/^#/, "");
    if (ym_hash === "path") return { view: "path" };
    if (ym_hash.indexOf("w/") === 0) {
      return { view: "lesson", id: decodeURIComponent(ym_hash.slice(2)) };
    }
    return { view: "orbit" };
  }

  function ym_paint_progress() {
    const ym_progress = ym_load();
    const ym_label = document.getElementById("laiProgress");
    if (ym_label) {
      ym_label.textContent = ym_progress.held.length + " of " + ym_words.length + " words you can say";
    }
    document.querySelectorAll(".lai-planet").forEach(function (ym_el) {
      const ym_id = ym_el.getAttribute("data-id");
      ym_el.classList.toggle("is-held", ym_progress.held.indexOf(ym_id) !== -1);
    });
    document.querySelectorAll(".lai-step").forEach(function (ym_el) {
      const ym_id = ym_el.getAttribute("data-id");
      const ym_mark = ym_el.querySelector(".lai-mark");
      if (ym_mark) {
        ym_mark.textContent = ym_progress.held.indexOf(ym_id) === -1 ? "" : "You can say this";
      }
    });
    const ym_sun = document.getElementById("laiSun");
    if (ym_sun) {
      const ym_next = ym_next_unheld(ym_progress);
      ym_sun.querySelector("strong").textContent = ym_progress.held.length ? "Continue" : "Start here";
      ym_sun.querySelector("em").textContent = ym_next.short;
      ym_sun.setAttribute("data-id", ym_next.id);
      ym_sun.setAttribute("aria-label", (ym_progress.held.length ? "Continue with " : "Start with ") + ym_next.term);
    }
  }

  function ym_open(ym_id) {
    location.hash = "w/" + encodeURIComponent(ym_id);
  }

  function ym_render_orbit() {
    const ym_stage = document.getElementById("laiStage");
    const ym_dirs = ["normal", "reverse", "normal"];
    const ym_body_dirs = ["reverse", "normal", "reverse"];
    const ym_rings = ym_orbits.map(function (ym_orbit_item, ym_index) {
      const ym_members = ym_words.filter(function (ym_item) { return ym_item.ring === ym_index; });
      const ym_planets = ym_members.map(function (ym_item, ym_slot) {
        const ym_angle = -Math.PI / 2 + (ym_slot / ym_members.length) * Math.PI * 2;
        const ym_left = 50 + 50 * Math.cos(ym_angle);
        const ym_top = 50 + 50 * Math.sin(ym_angle);
        return (
          '<button type="button" class="lai-planet" data-id="' + ym_esc(ym_item.id) + '"' +
          ' style="left:' + ym_left.toFixed(3) + '%;top:' + ym_top.toFixed(3) + '%"' +
          ' aria-label="' + ym_esc(ym_item.term) + '. ' + ym_esc(ym_item.sentence) + '">' +
          '<span class="lai-planet-body">' +
          '<span class="lai-face"><span class="lai-emblem" aria-hidden="true">' + ym_esc(ym_item.emblem) + '</span>' +
          '<span class="lai-short">' + ym_esc(ym_item.short) + "</span></span>" +
          '<span class="lai-expanded"><b>' + ym_esc(ym_item.term) + "</b>" +
          "<small>" + ym_esc(ym_item.short) + "</small></span>" +
          "</span></button>"
        );
      }).join("");
      return (
        '<div class="lai-ring" style="width:' + (ym_orbit_item.rx * 2) + "px;height:" + (ym_orbit_item.ry * 2) + "px;" +
        "--ring-tint:" + ym_orbit_item.tint + ";--ring-spin:" + ym_orbit_item.spin + ";" +
        "--ring-dir:" + ym_dirs[ym_index] + ";--body-dir:" + ym_body_dirs[ym_index] + '">' +
        '<div class="lai-ring-guide"></div><div class="lai-ring-spin">' + ym_planets + "</div></div>"
      );
    }).join("");
    ym_stage.innerHTML =
      '<button type="button" class="lai-sun" id="laiSun"><strong>Start here</strong><em>Artificial intelligence</em></button>' +
      ym_rings;
    ym_stage.querySelectorAll(".lai-planet, .lai-sun").forEach(function (ym_el) {
      ym_el.addEventListener("click", function () {
        ym_return_view = "orbit";
        ym_open(ym_el.getAttribute("data-id"));
      });
    });
    const ym_legend = document.getElementById("laiLegend");
    ym_legend.innerHTML = ym_orbits.map(function (ym_orbit_item) {
      return '<span><i class="lai-swatch" style="background:' + ym_orbit_item.tint + ";color:" + ym_orbit_item.tint + '"></i>' +
        ym_esc(ym_orbit_item.name) + "</span>";
    }).join("");
  }

  function ym_render_path() {
    const ym_root = document.getElementById("laiPath");
    ym_root.innerHTML = ym_orbits.map(function (ym_orbit_item, ym_index) {
      const ym_members = ym_words.filter(function (ym_item) { return ym_item.ring === ym_index; });
      const ym_steps = ym_members.map(function (ym_item) {
        const ym_number = ym_words.indexOf(ym_item) + 1;
        return (
          '<li><button type="button" class="lai-step" data-id="' + ym_esc(ym_item.id) + '" style="--group-tint:' + ym_orbit_item.tint + '">' +
          '<span class="lai-step-orb" aria-hidden="true">' + ym_esc(ym_item.emblem) + "</span>" +
          "<span><b>" + ym_number + ". " + ym_esc(ym_item.term) + "</b>" +
          "<small>" + ym_esc(ym_item.sentence) + "</small></span>" +
          '<span class="lai-mark"></span></button></li>'
        );
      }).join("");
      return '<section class="lai-group"><h2 style="color:' + ym_orbit_item.tint + '">' + ym_esc(ym_orbit_item.name) + "</h2><ol class=\"lai-steps\">" + ym_steps + "</ol></section>";
    }).join("");
    ym_root.querySelectorAll(".lai-step").forEach(function (ym_el) {
      ym_el.addEventListener("click", function () {
        ym_return_view = "path";
        ym_open(ym_el.getAttribute("data-id"));
      });
    });
  }

  function ym_lesson_html(ym_item, ym_progress) {
    const ym_orbit_item = ym_orbit(ym_item.ring);
    const ym_index = ym_words.indexOf(ym_item);
    const ym_held = ym_progress.held.indexOf(ym_item.id) !== -1;
    const ym_nearby = ym_item.nearby.map(function (ym_id) {
      const ym_near = ym_word(ym_id);
      if (!ym_near) return "";
      return '<button type="button" class="lai-near" data-id="' + ym_esc(ym_near.id) + '">' + ym_esc(ym_near.term) + "</button>";
    }).join("");
    const ym_choices = ym_item.check.choices.map(function (ym_choice, ym_choice_index) {
      const ym_right = ym_held && ym_choice_index === ym_item.check.answer;
      return '<button type="button" class="lai-choice' + (ym_right ? " is-right" : "") + '" data-choice="' + ym_choice_index + '"' +
        (ym_held ? " disabled" : "") + ">" + ym_esc(ym_choice) + "</button>";
    }).join("");
    return (
      '<div class="lai-lesson-head" style="--ring-tint:' + ym_orbit_item.tint + '">' +
      '<div class="lai-lesson-orb" aria-hidden="true">' + ym_esc(ym_item.emblem) + "</div>" +
      '<p class="lai-kicker">' + ym_esc(ym_orbit_item.name) + "</p>" +
      "<h1>" + ym_esc(ym_item.term) + "</h1>" +
      '<p class="lai-count">Word ' + (ym_index + 1) + " of " + ym_words.length +
      (ym_held ? " · You can say this one" : "") + "</p></div>" +
      '<section class="lai-card"><h2>In one sentence</h2><p>' + ym_esc(ym_item.sentence) + "</p></section>" +
      '<section class="lai-card"><h2>Like this</h2><p>' + ym_esc(ym_item.analogy) + "</p></section>" +
      '<section class="lai-card"><h2>Where you meet it</h2><p>' + ym_esc(ym_item.meet) + "</p></section>" +
      '<section class="lai-card lai-say"><h2>Say it simply</h2><p>' + ym_esc(ym_item.say) + "</p></section>" +
      '<section class="lai-card"><h2>Words nearby</h2><div class="lai-nearby">' + ym_nearby + "</div></section>" +
      '<section class="lai-card"><h2>One check</h2><p>' + ym_esc(ym_item.check.prompt) + "</p>" +
      '<div class="lai-choices">' + ym_choices + "</div>" +
      '<p class="lai-feedback" id="laiFeedback">' + (ym_held ? ym_esc(ym_item.check.why) : "") + "</p></section>" +
      '<div class="lai-nav"><button type="button" id="laiPrev"' + (ym_index === 0 ? " disabled" : "") + ">Previous</button>" +
      '<button type="button" id="laiBack">Back to the sky</button>' +
      '<button type="button" id="laiNext"' + (ym_index === ym_words.length - 1 ? " disabled" : "") + ">Next word</button></div>"
    );
  }

  function ym_bind_lesson(ym_item) {
    const ym_root = document.getElementById("laiLesson");
    ym_root.querySelectorAll(".lai-near").forEach(function (ym_el) {
      ym_el.addEventListener("click", function () { ym_open(ym_el.getAttribute("data-id")); });
    });
    ym_root.querySelectorAll(".lai-choice").forEach(function (ym_el) {
      ym_el.addEventListener("click", function () {
        const ym_pick = Number(ym_el.getAttribute("data-choice"));
        const ym_feedback = document.getElementById("laiFeedback");
        ym_root.querySelectorAll(".lai-choice").forEach(function (ym_choice_el) {
          ym_choice_el.classList.remove("is-right", "is-miss");
        });
        if (ym_pick === ym_item.check.answer) {
          ym_el.classList.add("is-right");
          ym_feedback.textContent = ym_item.check.why;
          ym_root.querySelectorAll(".lai-choice").forEach(function (ym_choice_el) { ym_choice_el.disabled = true; });
          const ym_progress = ym_load();
          if (ym_progress.held.indexOf(ym_item.id) === -1) ym_progress.held.push(ym_item.id);
          ym_save(ym_progress);
          ym_paint_progress();
          const ym_count = ym_root.querySelector(".lai-count");
          if (ym_count && ym_count.textContent.indexOf("You can say this") === -1) {
            ym_count.textContent += " · You can say this one";
          }
        } else {
          ym_el.classList.add("is-miss");
          ym_feedback.textContent = "Try another. " + ym_item.check.why;
        }
      });
    });
    const ym_index = ym_words.indexOf(ym_item);
    document.getElementById("laiPrev").addEventListener("click", function () {
      if (ym_index > 0) ym_open(ym_words[ym_index - 1].id);
    });
    document.getElementById("laiNext").addEventListener("click", function () {
      if (ym_index < ym_words.length - 1) ym_open(ym_words[ym_index + 1].id);
    });
    document.getElementById("laiBack").addEventListener("click", function () {
      location.hash = ym_return_view === "path" ? "#path" : "#";
    });
    const ym_title = ym_root.querySelector("h1");
    if (ym_title) ym_title.setAttribute("tabindex", "-1");
    if (ym_title) ym_title.focus();
  }

  function ym_show() {
    const ym_route = ym_parse();
    const ym_orbit_el = document.getElementById("laiOrbit");
    const ym_path_el = document.getElementById("laiPath");
    const ym_lesson_el = document.getElementById("laiLesson");
    const ym_intro = document.getElementById("laiIntro");
    const ym_tab_orbit = document.getElementById("laiTabOrbit");
    const ym_tab_path = document.getElementById("laiTabPath");
    ym_orbit_el.hidden = ym_route.view !== "orbit";
    ym_path_el.hidden = ym_route.view !== "path";
    ym_lesson_el.hidden = ym_route.view !== "lesson";
    ym_intro.hidden = ym_route.view === "lesson";
    ym_tab_orbit.setAttribute("aria-selected", ym_route.view === "orbit" ? "true" : "false");
    ym_tab_path.setAttribute("aria-selected", ym_route.view === "path" ? "true" : "false");
    if (ym_route.view === "lesson") {
      const ym_item = ym_word(ym_route.id);
      if (!ym_item) {
        location.hash = "#";
        return;
      }
      const ym_progress = ym_load();
      if (ym_progress.seen.indexOf(ym_item.id) === -1) {
        ym_progress.seen.push(ym_item.id);
        ym_save(ym_progress);
      }
      ym_lesson_el.innerHTML = ym_lesson_html(ym_item, ym_progress);
      ym_bind_lesson(ym_item);
      ym_lesson_el.scrollIntoView({ block: "start" });
    }
    ym_paint_progress();
    if (ym_route.view === "orbit") ym_apply_query();
  }

  function ym_apply_query() {
    const ym_q = ym_query.trim().toLowerCase();
    const ym_hits = ym_q ? ym_words.filter(function (ym_item) {
      return (ym_item.term + " " + ym_item.short + " " + ym_item.sentence).toLowerCase().indexOf(ym_q) !== -1;
    }) : [];
    document.querySelectorAll(".lai-planet").forEach(function (ym_el) {
      if (!ym_q) {
        ym_el.classList.remove("is-dim", "is-focus");
        return;
      }
      const ym_id = ym_el.getAttribute("data-id");
      const ym_hit = ym_hits.some(function (ym_item) { return ym_item.id === ym_id; });
      ym_el.classList.toggle("is-dim", !ym_hit);
      ym_el.classList.toggle("is-focus", ym_hits.length === 1 && ym_hit);
    });
  }

  function ym_search_list(ym_q) {
    const ym_list = document.getElementById("laiSearchResults");
    if (!ym_q) {
      ym_list.hidden = true;
      ym_list.innerHTML = "";
      return;
    }
    const ym_hits = ym_words.filter(function (ym_item) {
      const ym_hay = (ym_item.term + " " + ym_item.short + " " + ym_item.sentence).toLowerCase();
      return ym_hay.indexOf(ym_q) !== -1;
    }).slice(0, 8);
    if (!ym_hits.length) {
      ym_list.hidden = false;
      ym_list.innerHTML = "<li><span>Keep typing — the word will surface.</span></li>";
      return;
    }
    ym_list.hidden = false;
    ym_list.innerHTML = ym_hits.map(function (ym_item) {
      return '<li><button type="button" data-id="' + ym_esc(ym_item.id) + '">' + ym_esc(ym_item.term) +
        "<small>" + ym_esc(ym_item.sentence) + "</small></button></li>";
    }).join("");
    ym_list.querySelectorAll("button").forEach(function (ym_el) {
      ym_el.addEventListener("click", function () {
        ym_return_view = ym_parse().view === "path" ? "path" : "orbit";
        document.getElementById("laiSearch").value = "";
        ym_query = "";
        ym_list.hidden = true;
        ym_open(ym_el.getAttribute("data-id"));
      });
    });
  }

  function ym_fit() {
    const ym_stage = document.getElementById("laiStage");
    const ym_fit_el = document.getElementById("laiFit");
    if (!ym_stage || !ym_fit_el) return;
    const ym_top = document.querySelector(".lai-top");
    const ym_bar = document.querySelector(".lai-toolbar");
    const ym_intro = document.getElementById("laiIntro");
    const ym_used =
      (ym_top ? ym_top.offsetHeight : 64) +
      (ym_bar ? ym_bar.offsetHeight : 52) +
      (ym_intro && !ym_intro.hidden ? ym_intro.offsetHeight : 0) +
      78;
    const ym_avail_w = Math.min(window.innerWidth - 24, 960);
    const ym_avail_h = Math.max(280, window.innerHeight - ym_used);
    const ym_scale = Math.min(ym_avail_w, ym_avail_h) / 960;
    ym_stage.style.transform = "scale(" + ym_scale + ")";
    ym_fit_el.style.height = Math.ceil(960 * ym_scale) + "px";
  }

  function ym_boot() {
    ym_render_orbit();
    ym_render_path();
    ym_fit();
    window.addEventListener("resize", ym_fit);
    window.addEventListener("hashchange", ym_show);
    document.getElementById("laiTabOrbit").addEventListener("click", function () { location.hash = "#"; });
    document.getElementById("laiTabPath").addEventListener("click", function () { location.hash = "#path"; });
    document.getElementById("laiSearch").addEventListener("input", function (ym_event) {
      ym_query = ym_event.target.value || "";
      ym_search_list(ym_query.trim().toLowerCase());
      if (ym_parse().view === "orbit") ym_apply_query();
    });
    document.addEventListener("keydown", function (ym_event) {
      if (ym_event.key === "Escape") {
        document.getElementById("laiSearchResults").hidden = true;
        if (ym_parse().view === "lesson") {
          location.hash = ym_return_view === "path" ? "#path" : "#";
        }
      }
    });
    ym_show();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ym_boot);
  } else {
    ym_boot();
  }
})();
