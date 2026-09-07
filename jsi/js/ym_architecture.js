/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

(function () {
  "use strict";

  var YM_RADIUS = {
    interfaces: "42%",
    orchestration: "31%",
    "models-knowledge": "20%",
    compute: "10%"
  };

  function ymFlatten(ym_arch) {
    var ym_nodes = [];
    (ym_arch.layers || []).forEach(function (ym_layer) {
      (ym_layer.nodes || []).forEach(function (ym_node, ym_idx) {
        ym_nodes.push({
          layerId: ym_layer.id,
          layerLabel: ym_layer.label,
          count: ym_layer.nodes.length,
          index: ym_idx,
          node: ym_node
        });
      });
    });
    return ym_nodes;
  }

  function ymAngle(ym_entry) {
    if (ym_entry.layerId === "compute") {
      if (ym_entry.count === 1) return 0;
      return -90 + (ym_entry.index * (180 / Math.max(ym_entry.count - 1, 1)));
    }
    var ym_step = 360 / ym_entry.count;
    var ym_offset = { interfaces: -20, orchestration: 40, "models-knowledge": 10 }[ym_entry.layerId] || 0;
    return ym_offset + ym_entry.index * ym_step;
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
    var ym_orbit = document.getElementById("ym-arch-orbit");
    var ym_detail = document.getElementById("ym-arch-detail");
    if (!ym_orbit || !ym_detail) return;

    var ym_html = "";
    ["interfaces", "orchestration", "models-knowledge", "compute"].forEach(function (ym_id) {
      ym_html += '<div class="jsi-ring" data-layer="' + ym_id + '" aria-hidden="true"></div>';
    });

    var ym_flat = ymFlatten(ym_arch);
    ym_flat.forEach(function (ym_entry, ym_i) {
      var ym_deg = ymAngle(ym_entry);
      var ym_r = YM_RADIUS[ym_entry.layerId];
      ym_html +=
        '<button type="button" class="jsi-node" data-ym-index="' + ym_i + '"' +
        ' style="--ym-angle:' + ym_deg + "deg;--ym-radius:" + ym_r + ';"' +
        ' aria-pressed="' + (ym_i === 0 ? "true" : "false") + '">' +
        JsiYm.esc(ym_entry.node.label) +
        "</button>";
    });
    ym_orbit.innerHTML = ym_html;
    ym_detail.innerHTML = ymDetailHtml(ym_flat[0]);

    ym_orbit.addEventListener("click", function (ym_ev) {
      var ym_btn = ym_ev.target.closest(".jsi-node");
      if (!ym_btn) return;
      var ym_index = Number(ym_btn.getAttribute("data-ym-index"));
      ym_orbit.querySelectorAll(".jsi-node").forEach(function (ym_n) {
        ym_n.setAttribute("aria-pressed", ym_n === ym_btn ? "true" : "false");
      });
      ym_detail.innerHTML = ymDetailHtml(ym_flat[ym_index]);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("ym-arch-orbit")) return;
    JsiYm.fetchJson("architecture.json").then(ymMount).catch(function (ym_err) {
      document.getElementById("ym-arch-detail").textContent = "Architecture data could not load.";
      console.error(ym_err);
    });
  });
})();
