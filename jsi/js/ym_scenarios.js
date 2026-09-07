/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

(function () {
  "use strict";

  var ym_data = null;
  var ym_reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ymEl(ym_html) {
    var ym_wrap = document.createElement("div");
    ym_wrap.innerHTML = ym_html.trim();
    return ym_wrap.firstElementChild;
  }

  function ymById(ym_id) {
    return (ym_data.items || []).filter(function (ym_item) { return ym_item.id === ym_id; })[0];
  }

  function ymCitationButtons(ym_ids, ym_sources) {
    return (ym_ids || []).map(function (ym_id) {
      var ym_src = ym_sources[ym_id];
      if (!ym_src) return "";
      return '<button type="button" class="jsi-cite" data-ym-cite="' + JsiYm.esc(ym_id) +
        '" aria-expanded="false">' + JsiYm.esc(ym_src.title) + "</button>";
    }).join(" ");
  }

  function ymBindCitations(ym_root, ym_sources) {
    ym_root.querySelectorAll(".jsi-cite").forEach(function (ym_btn) {
      ym_btn.addEventListener("click", function () {
        var ym_id = ym_btn.getAttribute("data-ym-cite");
        var ym_src = ym_sources[ym_id];
        var ym_open = ym_btn.getAttribute("aria-expanded") === "true";
        ym_root.querySelectorAll(".jsi-cite").forEach(function (ym_other) {
          ym_other.setAttribute("aria-expanded", "false");
        });
        var ym_slot = ym_root.querySelector("[data-ym-excerpt]");
        if (ym_open) {
          if (ym_slot) ym_slot.hidden = true;
          return;
        }
        ym_btn.setAttribute("aria-expanded", "true");
        if (!ym_slot) return;
        ym_slot.hidden = false;
        ym_slot.innerHTML = "<strong>" + JsiYm.esc(ym_src.title) + " · " + JsiYm.esc(ym_src.locator) +
          "</strong><p>" + JsiYm.esc(ym_src.excerpt) + "</p>";
      });
    });
  }

  function ymRenderStages(ym_stages, ym_active) {
    return '<ol class="jsi-stages">' + ym_stages.map(function (ym_stage, ym_i) {
      var ym_cls = "jsi-stage";
      if (ym_i < ym_active) ym_cls += " is-done";
      if (ym_i === ym_active) ym_cls += " is-active";
      return '<li class="' + ym_cls + '"><span class="jsi-stage-mark" aria-hidden="true"></span><div><strong>' +
        JsiYm.esc(ym_stage.label) + "</strong><p>" + JsiYm.esc(ym_stage.detail) +
        "</p><p class=\"jsi-loc\">" + JsiYm.esc(ym_stage.actor) + "</p></div><span class=\"jsi-loc\">" +
        JsiYm.esc(ym_stage.runs) + "</span></li>";
    }).join("") + "</ol>";
  }

  function ymPlay(ym_host, ym_stages, ym_onDone) {
    var ym_active = ym_reduce ? ym_stages.length - 1 : 0;
    function ymPaint() {
      ym_host.innerHTML = ymRenderStages(ym_stages, ym_active);
      if (ym_active >= ym_stages.length - 1) {
        ym_onDone();
        return;
      }
      ym_active += 1;
      window.setTimeout(ymPaint, 520);
    }
    ymPaint();
  }

  function ymClassroom(ym_item, ym_body) {
    var ym_pack = ym_item.materials[0];
    var ym_q = ym_pack.questions[0];
    ym_body.innerHTML =
      '<p>' + JsiYm.esc(ym_item.problem) + "</p>" +
      '<div class="jsi-controls">' +
      '<label class="jsi-field">Sample curriculum<select id="ym-pack"></select></label>' +
      '<label class="jsi-field">Question from the board<select id="ym-q"></select></label>' +
      "</div>" +
      '<p class="jsi-loc">Interface: ' + JsiYm.esc(ym_item.interface) + " · " + JsiYm.esc(ym_data.disclaimer) + "</p>" +
      '<p class="launch-row"><button type="button" class="btn-primary" id="ym-run">Ask from the board</button></p>' +
      '<div id="ym-flow"></div>' +
      '<div id="ym-out" hidden></div>';

    var ym_packSel = ym_body.querySelector("#ym-pack");
    var ym_qSel = ym_body.querySelector("#ym-q");
    ym_item.materials.forEach(function (ym_m) {
      ym_packSel.appendChild(ymEl("<option value=\"" + JsiYm.esc(ym_m.id) + "\">" + JsiYm.esc(ym_m.label) + "</option>"));
    });
    function ymFillQ() {
      ym_pack = ym_item.materials.filter(function (ym_m) { return ym_m.id === ym_packSel.value; })[0];
      ym_qSel.innerHTML = "";
      ym_pack.questions.forEach(function (ym_question) {
        ym_qSel.appendChild(ymEl("<option value=\"" + JsiYm.esc(ym_question.id) + "\">" + JsiYm.esc(ym_question.label) + "</option>"));
      });
    }
    ymFillQ();
    ym_packSel.addEventListener("change", ymFillQ);

    ym_body.querySelector("#ym-run").addEventListener("click", function () {
      ym_pack = ym_item.materials.filter(function (ym_m) { return ym_m.id === ym_packSel.value; })[0];
      ym_q = ym_pack.questions.filter(function (ym_question) { return ym_question.id === ym_qSel.value; })[0];
      var ym_out = ym_body.querySelector("#ym-out");
      ym_out.hidden = true;
      ymPlay(ym_body.querySelector("#ym-flow"), ym_q.stages, function () {
        var ym_quiz = ym_q.quiz.map(function (ym_itemQ, ym_i) {
          return "<fieldset><legend>" + JsiYm.esc(ym_itemQ.prompt) + "</legend>" +
            ym_itemQ.choices.map(function (ym_c, ym_j) {
              return "<label><input type=\"radio\" name=\"ym-quiz-" + ym_i + "\" value=\"" + ym_j + "\"> " +
                JsiYm.esc(ym_c) + "</label>";
            }).join("") + "</fieldset>";
        }).join("");
        ym_out.hidden = false;
        ym_out.innerHTML =
          '<div class="jsi-answer"><h3>Explanation (synthetic draft)</h3><p>' + JsiYm.esc(ym_q.answer.text) +
          "</p><p>" + ymCitationButtons(ym_q.answer.citations, ym_item.sources) +
          '</p><div class="jsi-excerpt" data-ym-excerpt hidden></div></div>' +
          '<div class="jsi-quiz"><h3>Proposed quiz — review before sharing</h3>' + ym_quiz +
          '<p class="launch-row"><button type="button" class="btn-secondary" id="ym-share">Share to class (simulated)</button></p>' +
          '<p id="ym-share-note" hidden>' + JsiYm.esc(ym_item.shareNote) + "</p></div>";
        ymBindCitations(ym_out, ym_item.sources);
        ym_out.querySelector("#ym-share").addEventListener("click", function () {
          ym_out.querySelector("#ym-share-note").hidden = false;
        });
      });
    });
  }

  function ymKnowledge(ym_item, ym_body) {
    ym_body.innerHTML =
      "<p>" + JsiYm.esc(ym_item.problem) + "</p>" +
      '<label class="jsi-field">Sample question<select id="ym-kq">' +
      ym_item.prompts.map(function (ym_p) {
        return "<option value=\"" + JsiYm.esc(ym_p.id) + "\">" + JsiYm.esc(ym_p.label) + "</option>";
      }).join("") + "</select></label>" +
      '<p class="jsi-loc">' + JsiYm.esc(ym_item.excludedNote) + " · " + JsiYm.esc(ym_data.disclaimer) + "</p>" +
      '<p class="launch-row"><button type="button" class="btn-primary" id="ym-run">Ask the assistant</button></p>' +
      '<div id="ym-flow"></div><div id="ym-out" hidden></div>';

    ym_body.querySelector("#ym-run").addEventListener("click", function () {
      var ym_id = ym_body.querySelector("#ym-kq").value;
      var ym_p = ym_item.prompts.filter(function (ym_x) { return ym_x.id === ym_id; })[0];
      var ym_out = ym_body.querySelector("#ym-out");
      ym_out.hidden = true;
      ymPlay(ym_body.querySelector("#ym-flow"), ym_p.stages, function () {
        ym_out.hidden = false;
        ym_out.innerHTML = '<div class="jsi-answer"><h3>' +
          (ym_p.kind === "insufficient" ? "Insufficient evidence" : "Answer with citations") +
          "</h3><p>" + JsiYm.esc(ym_p.answer.text) + "</p><p>" +
          ymCitationButtons(ym_p.answer.citations, ym_item.sources) +
          '</p><div class="jsi-excerpt" data-ym-excerpt hidden></div></div>';
        ymBindCitations(ym_out, ym_item.sources);
      });
    });
  }

  function ymWorkflow(ym_item, ym_body) {
    var ym_approved = false;
    ym_body.innerHTML =
      "<p>" + JsiYm.esc(ym_item.problem) + "</p>" +
      '<div class="jsi-tabs" role="tablist">' +
      ym_item.runs.map(function (ym_run, ym_i) {
        return '<button type="button" class="jsi-tab" role="tab" aria-selected="' + (ym_i === 0) +
          '" data-ym-run="' + JsiYm.esc(ym_run.id) + '">' + JsiYm.esc(ym_run.label) + "</button>";
      }).join("") + "</div>" +
      '<p class="jsi-loc">Interface: ' + JsiYm.esc(ym_item.interface) + " · " + JsiYm.esc(ym_data.disclaimer) + "</p>" +
      '<pre id="ym-req" style="white-space:pre-wrap;color:var(--text);font:inherit;margin:12px 0"></pre>' +
      '<p class="launch-row"><button type="button" class="btn-primary" id="ym-run">Run this path</button></p>' +
      '<div id="ym-flow"></div><div id="ym-out" hidden></div>';

    var ym_current = ym_item.runs[0];
    function ymSetRun(ym_id) {
      ym_current = ym_item.runs.filter(function (ym_r) { return ym_r.id === ym_id; })[0];
      ym_body.querySelector("#ym-req").textContent = "Incoming request (synthetic):\n" + ym_current.request;
      ym_body.querySelectorAll(".jsi-tab").forEach(function (ym_tab) {
        ym_tab.setAttribute("aria-selected", ym_tab.getAttribute("data-ym-run") === ym_id ? "true" : "false");
      });
    }
    ymSetRun(ym_current.id);
    ym_body.querySelectorAll(".jsi-tab").forEach(function (ym_tab) {
      ym_tab.addEventListener("click", function () { ymSetRun(ym_tab.getAttribute("data-ym-run")); });
    });

    ym_body.querySelector("#ym-run").addEventListener("click", function () {
      var ym_out = ym_body.querySelector("#ym-out");
      ym_out.hidden = true;
      ym_approved = false;
      ymPlay(ym_body.querySelector("#ym-flow"), ym_current.stages, function () {
        ym_out.hidden = false;
        var ym_html = '<div class="jsi-answer"><h3>' + JsiYm.esc(ym_current.outcome.title) + "</h3><p>" +
          JsiYm.esc(ym_current.outcome.text) + "</p>";
        if (ym_current.procedureCitation) {
          ym_html += "<p>" + ymCitationButtons([ym_current.procedureCitation], ym_item.sources) + "</p>";
          ym_html += '<div class="jsi-excerpt" data-ym-excerpt hidden></div>';
        }
        ym_html += "</div>";
        if (ym_current.id === "ok") {
          ym_html += '<div class="jsi-task" id="ym-gate"><p>Approval checkpoint: facilities lead must accept before n8n continues.</p>' +
            '<p class="launch-row"><button type="button" class="btn-primary" id="ym-approve">Approve (simulated)</button></p></div>' +
            '<div id="ym-after" hidden></div>';
        }
        ym_out.innerHTML = ym_html;
        ymBindCitations(ym_out, ym_item.sources);
        var ym_approve = ym_out.querySelector("#ym-approve");
        if (ym_approve) {
          ym_approve.addEventListener("click", function () {
            if (ym_approved) return;
            ym_approved = true;
            var ym_after = ym_out.querySelector("#ym-after");
            ym_after.hidden = false;
            ym_after.innerHTML =
              '<div class="jsi-task"><h3>Simulated n8n outputs</h3><p><strong>Task ' +
              JsiYm.esc(ym_current.task.id) + ".</strong> " + JsiYm.esc(ym_current.task.title) +
              " · " + JsiYm.esc(ym_current.task.owner) + " · " + JsiYm.esc(ym_current.task.due) +
              "</p><p><strong>Notification.</strong> " + JsiYm.esc(ym_current.notification.channel) +
              " — " + JsiYm.esc(ym_current.notification.body) + "</p></div>";
          });
        }
      });
    });
  }

  function ymShow(ym_id, ym_body) {
    var ym_item = ymById(ym_id);
    if (ym_id === "classroom") ymClassroom(ym_item, ym_body);
    else if (ym_id === "knowledge") ymKnowledge(ym_item, ym_body);
    else ymWorkflow(ym_item, ym_body);
  }

  function ymMount(ym_json) {
    ym_data = ym_json;
    var ym_root = document.getElementById("ym-scenarios");
    if (!ym_root) return;
    ym_root.innerHTML =
      '<div class="jsi-demo-shell">' +
      '<div class="jsi-demo-head"><div><strong>' + JsiYm.esc(ym_data.disclaimer) +
      "</strong><p class=\"lede\" style=\"margin:8px 0 0\">" + JsiYm.esc(ym_data.notice) +
      "</p></div></div>" +
      '<div class="jsi-tabs" role="tablist" id="ym-scenario-tabs"></div>' +
      '<div class="jsi-demo-body" id="ym-scenario-body"></div></div>';

    var ym_tabs = ym_root.querySelector("#ym-scenario-tabs");
    var ym_body = ym_root.querySelector("#ym-scenario-body");
    ym_data.items.forEach(function (ym_item, ym_i) {
      var ym_btn = ymEl('<button type="button" class="jsi-tab" role="tab" aria-selected="' +
        (ym_i === 0) + '" data-ym-id="' + JsiYm.esc(ym_item.id) + '">' + JsiYm.esc(ym_item.title) + "</button>");
      ym_tabs.appendChild(ym_btn);
    });
    ym_tabs.addEventListener("click", function (ym_ev) {
      var ym_btn = ym_ev.target.closest(".jsi-tab");
      if (!ym_btn) return;
      ym_tabs.querySelectorAll(".jsi-tab").forEach(function (ym_t) {
        ym_t.setAttribute("aria-selected", ym_t === ym_btn ? "true" : "false");
      });
      ymShow(ym_btn.getAttribute("data-ym-id"), ym_body);
    });
    ymShow(ym_data.items[0].id, ym_body);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("ym-scenarios")) return;
    JsiYm.fetchJson("scenarios.json").then(ymMount).catch(function (ym_err) {
      document.getElementById("ym-scenarios").innerHTML = "<p>Scenario data could not load.</p>";
      console.error(ym_err);
    });
  });
})();
