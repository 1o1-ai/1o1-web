/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

(function () {
  "use strict";

  function ymFlatten(ym_arch) {
    var ym_nodes = [];
    (ym_arch.layers || []).forEach(function (ym_layer) {
      (ym_layer.nodes || []).forEach(function (ym_node) {
        ym_nodes.push({
          layerId: ym_layer.id,
          layerLabel: ym_layer.label,
          layerSummary: ym_layer.summary || "",
          node: ym_node
        });
      });
    });
    return ym_nodes;
  }

  function ymDetailHtml(ym_entry) {
    var ym_n = ym_entry.node;
    return (
      "<p class=\"eyebrow\">" + JsiYm.esc(ym_entry.layerLabel) + "</p>" +
      "<h3>" + JsiYm.esc(ym_n.label) + "</h3>" +
      JsiYm.badge(ym_n.status) +
      "<p style=\"margin-top:12px\">" + JsiYm.esc(ym_n.role) + "</p>" +
      "<p><strong>Data boundary.</strong> " + JsiYm.esc(ym_n.boundary) + "</p>" +
      "<p class=\"jsi-loc\">Runs: " + JsiYm.esc(ym_n.runs) + "</p>"
    );
  }

  function ymMount(ym_arch) {
    var ym_stack = document.getElementById("ym-arch-stack");
    var ym_detail = document.getElementById("ym-arch-detail");
    if (!ym_stack || !ym_detail) return;

    var ym_flat = ymFlatten(ym_arch);
    var ym_html = "";
    var ym_index = 0;
    (ym_arch.layers || []).forEach(function (ym_layer) {
      ym_html += '<section class="jsi-arch-layer">';
      ym_html += "<h3>" + JsiYm.esc(ym_layer.label) + "</h3>";
      if (ym_layer.summary) {
        ym_html += "<p>" + JsiYm.esc(ym_layer.summary) + "</p>";
      }
      ym_html += '<div class="jsi-arch-nodes">';
      (ym_layer.nodes || []).forEach(function (ym_node) {
        ym_html +=
          '<button type="button" class="jsi-node" data-ym-index="' + ym_index + '"' +
          ' aria-pressed="' + (ym_index === 0 ? "true" : "false") + '">' +
          JsiYm.esc(ym_node.label) +
          "</button>";
        ym_index += 1;
      });
      ym_html += "</div></section>";
    });
    ym_stack.innerHTML = ym_html;
    if (ym_flat[0]) ym_detail.innerHTML = ymDetailHtml(ym_flat[0]);

    ym_stack.addEventListener("click", function (ym_ev) {
      var ym_btn = ym_ev.target.closest(".jsi-node");
      if (!ym_btn) return;
      var ym_sel = Number(ym_btn.getAttribute("data-ym-index"));
      ym_stack.querySelectorAll(".jsi-node").forEach(function (ym_n) {
        ym_n.setAttribute("aria-pressed", ym_n === ym_btn ? "true" : "false");
      });
      ym_detail.innerHTML = ymDetailHtml(ym_flat[ym_sel]);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("ym-arch-stack")) return;
    JsiYm.fetchJson("architecture.json").then(ymMount).catch(function (ym_err) {
      document.getElementById("ym-arch-detail").textContent = "Architecture data could not load.";
      console.error(ym_err);
    });
  });
})();
