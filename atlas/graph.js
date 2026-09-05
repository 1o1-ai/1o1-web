/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

function ymDrawInteractiveGraph(svg, map, opts) {
  if (!svg) return;
  const evidenceEl = (opts && opts.evidenceEl) || document.getElementById("g-ev");
  const nodes = (map && map.nodes) || [];
  const edges = (map && map.edges) || [];
  const w = 900;
  const h = 900;
  svg.setAttribute("viewBox", "0 0 " + w + " " + h);
  const cx = w / 2;
  const cy = h / 2;
  const person = nodes.find((n) => n.type === "Person") || nodes[0];
  const others = nodes.filter((n) => n !== person);
  const byType = { Account: [], Device: [], Counterparty: [], Other: [] };
  others.forEach((n) => {
    if (byType[n.type]) byType[n.type].push(n);
    else byType.Other.push(n);
  });
  const slots = [
    { type: "Account", x: 170, y: 190 },
    { type: "Device", x: 620, y: 190 },
    { type: "Counterparty", x: 190, y: 680 },
    { type: "Other", x: 620, y: 680 },
  ];
  if (person) { person._x = cx; person._y = cy; }
  slots.forEach((slot) => {
    const group = byType[slot.type] || [];
    group.forEach((n, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      n._x = slot.x + col * 170;
      n._y = slot.y + row * 70;
    });
  });
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const typePlain = {
    Person: "This is the customer.",
    Account: "A bank account belonging to this customer.",
    Device: "A phone or computer used with this account.",
    Counterparty: "Someone this customer sends money to, or receives money from.",
  };
  let html = "";
  edges.forEach((e, i) => {
    const a = byId[e.from_id];
    const b = byId[e.to_id];
    if (!a || !b) return;
    html += `<line class="ym-edge" data-from="${ymEsc(e.from_id)}" data-to="${ymEsc(e.to_id)}" x1="${a._x}" y1="${a._y}" x2="${b._x}" y2="${b._y}" stroke="rgba(126,182,255,0.35)" stroke-width="1.6" />`;
  });
  nodes.forEach((n) => {
    const r = n.type === "Person" ? 22 : 12;
    const fill = n.type === "Person" ? "#d4b46a" : n.type === "Device" ? "#e0a45c" : n.type === "Account" ? "#6fd3b0" : "#7eb6ff";
    const meta = n.meta || {};
    const days = meta.first_seen_days;
    const extra = days === 0 ? " · new" : "";
    html += `<g class="ym-gnode" data-id="${ymEsc(n.id)}" data-type="${ymEsc(n.type)}" data-label="${ymEsc(n.label)}" data-days="${ymEsc(days)}" transform="translate(${n._x},${n._y})">
      <circle r="${r}" fill="${fill}" class="ym-node-pop" />
      <text x="${r + 8}" y="4" fill="#e8eef6" font-size="12">${ymEsc(String(n.label || "").replace(" (synthetic)", "")).slice(0, 28)}${extra}</text>
    </g>`;
  });
  svg.innerHTML = html;
  const plainFor = (g) => {
    const type = g.getAttribute("data-type");
    const label = g.getAttribute("data-label");
    const days = g.getAttribute("data-days");
    let text = typePlain[type] || "A connected record in the ATLAS map.";
    if (type === "Device" && days === "0") text = "A device ATLAS has not seen with this customer before.";
    if (type === "Counterparty" && days === "0") text = "A payee this customer has not paid before.";
    return `<strong>${ymEsc(label)}</strong><p>${text}</p>`;
  };
  svg.querySelectorAll(".ym-gnode").forEach((g) => {
    g.style.cursor = "pointer";
    g.addEventListener("click", () => {
      const id = g.getAttribute("data-id");
      svg.querySelectorAll(".ym-edge").forEach((line) => {
        const on = line.getAttribute("data-from") === id || line.getAttribute("data-to") === id;
        line.setAttribute("stroke", on ? "#d4b46a" : "rgba(126,182,255,0.18)");
        line.setAttribute("stroke-width", on ? "2.4" : "1.2");
      });
      if (evidenceEl) evidenceEl.innerHTML = plainFor(g);
    });
  });
}

window.ymDrawInteractiveGraph = ymDrawInteractiveGraph;
