/* Author: Yogabrata Mukhopadhyay | Organization: Brahmexa | Copyright: Copyright (c) 2026 Brahmexa. All rights reserved. */
/* Divine Innovation — CAD-to-BOQ Studio (browser client).
 * Every figure on screen comes from the API. When the API is unreachable the page
 * says so; it never substitutes sample or locally generated results. */
(function () {
  "use strict";
  var API = window.DIVINE_API || "";
  var S = { token: null, user: null, health: null, route: {}, checkFilter: { status: "", section: "", q: "", extra: false, qty: "", price: "" }, checkMode: "original" };
  try { S.token = localStorage.getItem("divine.token"); } catch (e) { S.token = null; }

  // ------------------------------------------------------------ helpers
  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "style") el.setAttribute("style", v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function $(id) { return document.getElementById(id); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  var INR = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var NUM = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  function money(v) { return v === null || v === undefined || v === "" ? "—" : "₹ " + INR.format(Number(v)); }
  function qty(v) { return v === null || v === undefined || v === "" ? "—" : NUM.format(Number(v)); }
  var UNIT = { sqft: "sq ft", sqm: "sq m", ft: "rft", m: "rmt", nos: "nos", kg: "kg", set: "set", ls: "LS", seat: "seat", cft: "cft", cum: "cum", mm: "mm" };
  function unit(u) { return u ? (UNIT[u] || u) : "—"; }
  var LABEL = {
    covered: "Covered", partly: "Partly covered", missing: "Missing from ours", needs_review: "Needs review",
    drawing_measured: "Measured from drawing", drawing_derived: "Drawing × input", inferred_user_approved: "Inferred · approved",
    customer_reference_user_assumption: "Customer reference / user assumption", manual: "Manual",
    matched: "Matched", needs_confirmation: "Needs confirmation", ambiguous: "Ambiguous", no_cost_found: "No cost found", manual_override: "Manual override",
    priced: "Priced", unpriced: "Unpriced", rate_only: "Rate only (qty pending)", usable: "Usable", inactive: "Inactive",
    in_boq: "In BOQ", unresolved: "Unresolved", awaiting_approval: "Awaiting approval", excluded: "Excluded", not_shown: "Not shown", note: "Note",
    frozen: "Frozen", draft: "Draft", queued: "Queued", running: "Running", completed: "Completed", failed: "Failed"
  };
  function badge(s, text) { return h("span", { class: "badge b-" + (s || "note") }, text || LABEL[s] || s || "—"); }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3500); }
  function banner(msg) { var b = $("banner"); if (!msg) { b.hidden = true; return; } b.hidden = false; b.textContent = msg; }
  function can(p) { return S.user && S.user.permissions.indexOf(p) >= 0; }

  function api(method, path, body, opts) {
    opts = opts || {};
    var init = { method: method, headers: {} };
    if (S.token) init.headers.Authorization = "Bearer " + S.token;
    if (body instanceof FormData) init.body = body;
    else if (body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
    return fetch(API + path, init).then(function (r) {
      if (r.status === 401 && !opts.noAuthPrompt) { S.token = null; S.user = null; showLogin(); throw new Error("Please sign in."); }
      if (opts.blob) { if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || j.detail || r.statusText); }); return r.blob(); }
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { j = { error: t }; }
        if (!r.ok) throw new Error((j && (j.error || j.detail)) || ("HTTP " + r.status));
        return j;
      });
    }, function () { throw new Error("The Studio server cannot be reached (" + (API || location.origin) + "). Nothing has been calculated."); });
  }
  function upload(path, file) { var fd = new FormData(); fd.append("file", file); return api("POST", path, fd); }
  function download(path, name) {
    return api("GET", path, undefined, { blob: true }).then(function (b) {
      var a = h("a", { href: URL.createObjectURL(b), download: name }); document.body.appendChild(a); a.click(); a.remove();
    }).catch(fail);
  }
  function fail(e) { toast(e.message || String(e)); throw e; }
  function softFail(e) { toast(e.message || String(e)); }
  function ask(text, dflt) { var v = window.prompt(text, dflt || ""); return v === null ? null : v.trim(); }

  // ------------------------------------------------------------ health, auth, nav
  function checkHealth() {
    var el = $("api-status");
    return fetch(API + "/api/health").then(function (r) { return r.json(); }).then(function (j) {
      S.health = j;
      var dwg = j.converter && j.converter.dwg2dxf;
      el.className = "api-status " + (dwg ? "ok" : "bad");
      el.textContent = "Server online" + (dwg ? " · DWG converter ready" : " · DWG converter missing");
      el.title = "API " + (API || location.origin) + " · version " + j.version + " · OCR " + (j.ocr ? "on" : "off");
      banner(null);
    }).catch(function () {
      S.health = null;
      el.className = "api-status bad"; el.textContent = "Server unreachable";
      banner("The Studio server (" + (API || location.origin) + ") is not reachable. Drawings cannot be processed and no BOQ is shown until it is back.");
    });
  }
  function showLogin() {
    var d = $("login");
    if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }
  }
  $("login-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = ev.target;
    api("POST", "/api/auth/login", { username: f.username.value, password: f.password.value }, { noAuthPrompt: true }).then(function (j) {
      S.token = j.token; S.user = j.user;
      try { localStorage.setItem("divine.token", j.token); } catch (e) { /* session only */ }
      f.password.value = ""; $("login-error").textContent = "";
      $("login").close(); renderUser(); route();
    }).catch(function (e) { $("login-error").textContent = e.message; });
  });
  function renderUser() {
    var box = clear($("user-box"));
    if (!S.user) return;
    add(box, [h("span", { text: S.user.display_name + " · " + S.user.role }),
      h("button", { class: "btn small", onclick: function () { api("POST", "/api/auth/logout").catch(function () {}); S.token = null; S.user = null; try { localStorage.removeItem("divine.token"); } catch (e) { /**/ } clear($("main")); showLogin(); } }, "Sign out")]);
  }
  var NAV = [["projects", "Projects"], ["costing", "Master Costing"], ["knowledge", "Knowledge"], ["settings", "Settings"]];
  function renderNav() {
    var nav = clear($("nav"));
    NAV.forEach(function (n) {
      if (n[0] === "costing" && !can("costing.view_internal")) return;
      nav.appendChild(h("button", { "aria-current": S.route.view === n[0] || (n[0] === "projects" && S.route.view === "project") ? "page" : null,
        onclick: function () { location.hash = "#/" + n[0]; } }, n[1]));
    });
  }
  function route() {
    var parts = (location.hash || "#/projects").replace(/^#\//, "").split("/");
    S.route = { view: parts[0] || "projects", pid: parts[1], step: parts[2] || "drawings" };
    renderNav();
    if (!S.user) return;
    closeDrawer();
    var main = clear($("main"));
    var v = S.route.view;
    var p = v === "project" ? viewProject(main) : v === "costing" ? viewCosting(main) : v === "knowledge" ? viewKnowledge(main) : v === "settings" ? viewSettings(main) : viewProjects(main);
    if (p && p.catch) p.catch(function (e) { add(main, h("div", { class: "card error" }, e.message)); });
  }
  window.addEventListener("hashchange", route);

  // ------------------------------------------------------------ drawer
  function openDrawer(title, body) {
    $("drawer-title").textContent = title;
    var b = clear($("drawer-body")); add(b, body);
    $("drawer").classList.add("open"); $("drawer").setAttribute("aria-hidden", "false");
    $("drawer-close").focus();
  }
  function closeDrawer() { $("drawer").classList.remove("open"); $("drawer").setAttribute("aria-hidden", "true"); }
  $("drawer-close").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  // ------------------------------------------------------------ evidence viewer
  var geomCache = {};
  function viewer(docId, kind, boxes, opts) {
    opts = opts || {};
    var wrap = h("div", { class: "viewer" });
    var canvas = h("canvas", { role: "img", "aria-label": "Drawing with highlighted evidence" });
    var tools = h("div", { class: "vtools" });
    wrap.appendChild(canvas); wrap.appendChild(tools);
    var pid = S.route.pid;
    var T = { s: 1, x: 0, y: 0 }, data = null, img = null, bbox = null;
    function fit() {
      var r = canvas.getBoundingClientRect(); var W = r.width || 600, H = r.height || 380;
      var b = bbox; if (!b) return;
      var bw = b[2] - b[0], bh = b[3] - b[1];
      T.s = Math.min(W / bw, H / bh) * 0.94; T.x = (W - bw * T.s) / 2 - b[0] * T.s; T.y = (H - bh * T.s) / 2 + (kind === "pdf" ? -b[1] * T.s : b[3] * T.s);
      draw();
    }
    function focusBoxes() {
      if (!boxes || !boxes.length) return fit();
      var b = boxes.reduce(function (a, x) { return [Math.min(a[0], x[0]), Math.min(a[1], x[1]), Math.max(a[2], x[2]), Math.max(a[3], x[3])]; }, [Infinity, Infinity, -Infinity, -Infinity]);
      var pad = Math.max(b[2] - b[0], b[3] - b[1]) * 0.6 + (kind === "pdf" ? 20 : 1500);
      var keep = bbox; bbox = [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]; fit(); bbox = keep;
    }
    function P(x, y) { return kind === "pdf" ? [x * T.s + T.x, y * T.s + T.y] : [x * T.s + T.x, -y * T.s + T.y]; }
    function draw() {
      var r = canvas.getBoundingClientRect(); var dpr = window.devicePixelRatio || 1;
      canvas.width = (r.width || 600) * dpr; canvas.height = (r.height || 380) * dpr;
      var c = canvas.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, r.width, r.height);
      if (kind === "pdf" && img) { var p0 = P(0, 0); c.drawImage(img, p0[0], p0[1], img.width / 2 * T.s, img.height / 2 * T.s); }
      if (kind !== "pdf" && data) {
        c.lineWidth = 0.8;
        Object.keys(data.layers).forEach(function (ln) {
          var L = data.layers[ln];
          c.strokeStyle = L.role === "glazing" ? "#0e7490" : L.role === "partition" ? "#0f766e" : L.role === "external_wall" || L.role === "wall_hatch" ? "#334155" : L.role === "dimension" ? "#cbd5e1" : "#94a3b8";
          L.paths.forEach(function (pts) {
            c.beginPath(); pts.forEach(function (pt, i) { var q = P(pt[0], pt[1]); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke();
          });
        });
      }
      (boxes || []).forEach(function (b) {
        var a = P(b[0], kind === "pdf" ? b[1] : b[3]), z = P(b[2], kind === "pdf" ? b[3] : b[1]);
        c.fillStyle = "rgba(234, 88, 12, .18)"; c.strokeStyle = "#c2410c"; c.lineWidth = 2;
        c.fillRect(a[0], a[1], z[0] - a[0], z[1] - a[1]); c.strokeRect(a[0], a[1], z[0] - a[0], z[1] - a[1]);
      });
    }
    var drag = null;
    canvas.addEventListener("pointerdown", function (e) { drag = [e.clientX, e.clientY, T.x, T.y]; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", function (e) { if (!drag) return; T.x = drag[2] + e.clientX - drag[0]; T.y = drag[3] + e.clientY - drag[1]; draw(); });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault(); var r = canvas.getBoundingClientRect(); var mx = e.clientX - r.left, my = e.clientY - r.top; var k = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      T.x = mx - (mx - T.x) * k; T.y = my - (my - T.y) * k; T.s *= k; draw();
    }, { passive: false });
    add(tools, [h("button", { class: "btn small", onclick: fit }, "Fit"), h("button", { class: "btn small", onclick: focusBoxes }, "Evidence")]);
    var load;
    if (kind === "pdf") {
      load = api("GET", "/api/projects/" + pid + "/documents/" + docId + "/render/" + (opts.page || 1), undefined, { blob: true }).then(function (b) {
        return new Promise(function (res) { img = new Image(); img.onload = function () { bbox = [0, 0, img.width / 2, img.height / 2]; res(); }; img.src = URL.createObjectURL(b); });
      });
    } else {
      load = (geomCache[docId] ? Promise.resolve(geomCache[docId]) : api("GET", "/api/projects/" + pid + "/documents/" + docId + "/geometry")).then(function (g) { geomCache[docId] = g; data = g; bbox = g.bbox; });
    }
    load.then(function () { setTimeout(focusBoxes, 30); }).catch(function (e) { wrap.appendChild(h("p", { class: "error", style: "padding:10px" }, "Viewer: " + e.message)); });
    return wrap;
  }

  // ------------------------------------------------------------ projects
  function viewProjects(main) {
    return api("GET", "/api/projects").then(function (j) {
      var list = h("div", { class: "card" }, h("div", { class: "row spread" }, h("h2", {}, "Projects"),
        can("project.edit") ? h("button", { class: "btn primary", onclick: newProject }, "New project") : null));
      if (!j.projects.length) list.appendChild(h("div", { class: "empty" }, "No projects yet. Create one and upload its drawings."));
      else {
        var t = h("table", {}, h("thead", {}, h("tr", {}, ["Project", "Client", "Location", "Drawings", "Revisions", "Created"].map(function (x) { return h("th", {}, x); }))));
        var tb = h("tbody");
        j.projects.forEach(function (p) {
          tb.appendChild(h("tr", { class: "clickable", tabindex: 0, onclick: function () { location.hash = "#/project/" + p.id + "/drawings"; },
            onkeydown: function (e) { if (e.key === "Enter") location.hash = "#/project/" + p.id + "/drawings"; } },
            h("td", {}, p.name, p.is_demo ? h("span", { class: "tag" }, "DEMO") : null), h("td", {}, p.client || "—"), h("td", {}, p.location || "—"),
            h("td", { class: "num" }, p.documents), h("td", {}, p.revisions.map(function (r) { return h("span", { style: "margin-right:4px" }, badge(r.status, "Rev " + r.label + " · " + LABEL[r.status])); })),
            h("td", {}, (p.created_at || "").slice(0, 10))));
        });
        t.appendChild(tb); list.appendChild(h("div", { class: "table-wrap" }, t));
      }
      add(main, [h("h1", {}, "Projects"), h("p", { class: "muted" }, "Each project starts empty at ₹0 and Rev 00. The master costing is shared across projects."), list]);
    });
  }
  function newProject() {
    var name = ask("Project name"); if (!name) return;
    var client = ask("Client (optional)") || ""; var loc = ask("Location (optional)") || "";
    api("POST", "/api/projects", { name: name, client: client, location: loc }).then(function (p) { location.hash = "#/project/" + p.id + "/drawings"; }).catch(softFail);
  }

  var STEPS = [["drawings", "Drawings"], ["takeoff", "Questions & ledger"], ["boq", "Drawing BOQ · Rev A"], ["customer", "Customer BOQ"], ["check", "BOQ Confidence Check"], ["review", "Reviewed BOQ"]];
  function viewProject(main) {
    var pid = S.route.pid;
    return api("GET", "/api/projects/" + pid).then(function (p) {
      S.project = p;
      var revA = p.revisions.filter(function (r) { return r.kind === "drawing"; })[0];
      var reviewed = p.revisions.filter(function (r) { return r.kind !== "drawing"; });
      var done = { drawings: p.documents.some(function (d) { return !d.superseded; }), boq: revA && revA.status === "frozen", customer: p.references.length > 0, review: reviewed.some(function (r) { return r.status === "frozen"; }) };
      var head = h("div", { class: "row spread" },
        h("div", {}, h("h1", {}, p.name, p.is_demo ? h("span", { class: "tag" }, "DEMO") : null),
          h("div", { class: "muted" }, [p.client, p.location].filter(Boolean).join(" · ") || "—", " · ",
            revA ? (revA.title + " (" + LABEL[revA.status] + ")") : "Rev 00 — no BOQ yet"),
          can("users.manage") ? h("div", { class: "row", style: "margin-top:6px" },
            h("button", { class: "btn small", onclick: function () { resetProject(p); } }, "Reset outputs"),
            h("button", { class: "btn small danger", onclick: function () { deleteProject(p); } }, "Delete project")) : null),
        pricingBox(p));
      var steps = h("nav", { class: "steps", "aria-label": "Workflow steps" });
      STEPS.forEach(function (s, i) {
        steps.appendChild(h("button", { class: "step" + (done[s[0]] ? " done" : ""), "aria-current": S.route.step === s[0] ? "step" : null,
          onclick: function () { location.hash = "#/project/" + pid + "/" + s[0]; } }, h("span", { class: "num" }, done[s[0]] ? "✓" : String(i + 1)), s[1]));
      });
      add(main, [head, steps]);
      var body = h("div"); main.appendChild(body);
      var fn = { drawings: stepDrawings, takeoff: stepTakeoff, boq: stepBoq, customer: stepCustomer, check: stepCheck, review: stepReview }[S.route.step] || stepDrawings;
      return fn(body, p);
    });
  }
  function pricingBox(p) {
    var box = h("div", { class: "card", style: "margin:0;padding:10px 12px" });
    var misc = h("input", { type: "number", step: "0.1", min: "0", value: p.misc_pct || "", placeholder: "10", style: "width:70px", "aria-label": "Additional misc %" });
    var margin = h("input", { type: "number", step: "0.1", min: "0", max: "99.9", value: p.margin_pct || "", placeholder: "30", style: "width:70px", "aria-label": "Gross selling margin %" });
    add(box, h("div", { class: "row" }, h("label", {}, "Misc % (on cost)", misc), h("label", {}, "Gross margin %", margin),
      can("pricing.edit") ? h("button", { class: "btn small", onclick: function () {
        api("PATCH", "/api/projects/" + p.id + "/pricing", { misc_pct: misc.value, margin_pct: margin.value }).then(function () { toast("Pricing settings saved. Draft revisions reprice when you click Reprice; frozen revisions keep their snapshot."); route(); }).catch(softFail);
      } }, "Save") : null));
    add(box, h("div", { class: "muted small" }, "Blank = system default (10% misc, 30% gross margin). Selling rate = cost × (1+misc) ÷ (1−margin)."));
    return box;
  }

  // ---- step 1: drawings
  function stepDrawings(body, p) {
    var file = h("input", { type: "file", accept: ".dwg,.dxf,.pdf", multiple: true, "aria-label": "Choose drawings" });
    var go = h("button", { class: "btn primary", onclick: function () {
      if (!file.files.length) return toast("Choose DWG, DXF or PDF files first.");
      go.disabled = true;
      Array.prototype.reduce.call(file.files, function (pr, f) { return pr.then(function () { return upload("/api/projects/" + p.id + "/documents", f); }); }, Promise.resolve())
        .then(function () { toast("Uploaded. Processing runs on the server."); route(); }).catch(softFail).then(function () { go.disabled = false; });
    } }, "Upload & process");
    var card = h("div", { class: "card" }, h("h2", {}, "Upload drawings"),
      h("p", { class: "muted" }, "DWG (converted on the server with LibreDWG), DXF, or AutoCAD-exported PDF. A DWG and PDF of the same revision are linked: the CAD file is measured and the PDF cross-checks it — they are never added together."),
      can("project.edit") ? h("div", { class: "row" }, file, go) : h("p", { class: "muted" }, "Your role can view only."),
      S.health && S.health.converter && !S.health.converter.dwg2dxf ? h("p", { class: "error" }, "The DWG converter is not available on this server; DWG files will fail with an explicit error.") : null);
    var docs = h("div", { class: "card" }, h("h2", {}, "Drawings and processing"));
    var live = p.documents.filter(function (d) { return !d.superseded; });
    if (!live.length) docs.appendChild(h("div", { class: "empty" }, "No drawings yet."));
    var t = h("table", {}, h("thead", {}, h("tr", {}, ["File", "Type", "SHA-256", "Uploaded", "Processing", ""].map(function (x) { return h("th", {}, x); }))));
    var tb = h("tbody"); t.appendChild(tb);
    var pending = false;
    live.forEach(function (d) {
      var job = p.jobs.filter(function (j) { return j.input_hash.indexOf(d.id + ":") === 0; })[0];
      if (job && (job.status === "queued" || job.status === "running")) pending = true;
      tb.appendChild(h("tr", {}, h("td", {}, d.filename), h("td", {}, d.kind.toUpperCase()), h("td", { class: "small muted" }, d.sha256.slice(0, 12) + "…"),
        h("td", { class: "small" }, d.uploaded_at.replace("T", " ").slice(0, 16)),
        h("td", {}, job ? [badge(job.status), " ", h("span", { class: "small muted" }, job.message || ""), job.status === "running" ? h("div", { class: "progress" }, h("span", { style: "width:" + job.progress + "%" })) : null] : "—"),
        h("td", {}, can("project.edit") ? [h("button", { class: "btn small", onclick: function () { api("POST", "/api/projects/" + p.id + "/documents/" + d.id + "/retry").then(function () { toast("Reprocessing started."); route(); }).catch(softFail); } }, "Retry"), " ",
          h("button", { class: "btn small danger", onclick: function () { if (confirm("Remove this drawing from the project? Earlier revisions keep their record of it.")) api("DELETE", "/api/projects/" + p.id + "/documents/" + d.id).then(route).catch(softFail); } }, "Remove")] : null)));
    });
    if (live.length) docs.appendChild(h("div", { class: "table-wrap" }, t));
    add(body, [card, docs]);
    if (pending) setTimeout(function () { if (S.route.view === "project" && S.route.step === "drawings") route(); }, 2500);
    return api("GET", "/api/projects/" + p.id + "/extractions").then(function (j) {
      j.extractions.forEach(function (x) { body.appendChild(extractionCard(p, x)); });
    });
  }
  function extractionCard(p, x) {
    var d = x.data, card = h("div", { class: "card" });
    add(card, h("h2", {}, x.filename, " ", badge("info", x.kind.toUpperCase())));
    if (x.kind === "pdf") {
      d.pages.forEach(function (pg) {
        var tb = pg.title_block || {};
        add(card, [h("p", {}, "Page " + pg.number + ": " + (pg.scanned ? "scanned image" : pg.vector_paths + " vector paths, " + pg.words + " words, " + (pg.layers || []).length + " CAD layers")),
          h("dl", { class: "kv" }, ["revision", "drawing_no", "date", "scale_text", "drawing_title", "client"].map(function (k) { return tb[k] ? [h("dt", {}, k.replace("_", " ")), h("dd", {}, tb[k])] : null; }),
            pg.scale ? [h("dt", {}, "scale found"), h("dd", {}, pg.scale.mm_per_pt ? (pg.scale.mm_per_pt + " mm per pt — " + pg.scale.dimensions_agreeing + " of " + pg.scale.dimensions_tested + " dimensions agree (" + pg.scale.confidence + ")") : pg.scale.method)] : null),
          pg.note ? h("p", { class: "error" }, pg.note) : null,
          featureTable(pg.features || []), h("div", { style: "margin-top:8px" }, viewer(x.document_id, "pdf", [], { page: pg.number }))]);
      });
    } else {
      add(card, [h("dl", { class: "kv" }, h("dt", {}, "units"), h("dd", {}, d.units.name + " (" + d.units.basis + ")"),
        h("dt", {}, "converter"), h("dd", {}, d.conversion ? d.conversion.converter + " " + (d.conversion.version || "") : "DXF read directly"),
        h("dt", {}, "layers"), h("dd", {}, d.layers.map(function (l) { return l.name + (l.role ? " → " + l.role : ""); }).join(" · ")),
        h("dt", {}, "duplicates"), h("dd", {}, (d.duplicates_excluded || []).length + " identical entities counted once")),
      (d.warnings || []).map(function (w) { return h("p", { class: "muted small" }, "⚠ " + w); }),
      featureTable(d.features || []), h("div", { style: "margin-top:8px" }, viewer(x.document_id, "cad", []))]);
    }
    if (d && d.readiness) {
      var rd = d.readiness;
      add(card, h("details", { open: rd.status !== "ok" ? "" : null }, h("summary", {}, "Drawing check: ", badge(rd.status === "ok" ? "ok" : rd.status === "blocked" ? "bad" : "warn", rd.status), " ", rd.verdict),
        h("ul", {}, rd.checks.map(function (c) { return h("li", { class: "small" }, badge(c.status === "ok" ? "ok" : c.status === "blocked" ? "bad" : c.status === "not_checked" ? "note" : "warn", c.check.replace(/_/g, " ")), " ", c.message); }))));
    }
    if (can("project.edit")) {
      var rows = [0, 1].map(function () { return { u: h("input", { type: "number", min: "0", placeholder: x.kind === "pdf" ? "length in PDF points" : "length in drawing units", style: "width:170px" }),
        mm: h("input", { type: "number", min: "0", placeholder: "true length in mm", style: "width:150px" }), what: h("input", { placeholder: "what (e.g. room width)", style: "width:170px" }) }; });
      add(card, h("details", {}, h("summary", {}, "Calibrate the scale from two known dimensions"),
        h("p", { class: "small muted" }, "For a drawing that is not to scale or has no units: give two dimensions you know. They must agree within 1 % or the calibration is refused; the drawing is then re-read at that scale and the basis is recorded."),
        rows.map(function (r) { return h("div", { class: "row" }, r.u, r.mm, r.what); }),
        h("button", { class: "btn small", onclick: function () {
          var ms = rows.map(function (r) { return { units: r.u.value, mm: r.mm.value, what: r.what.value }; }).filter(function (m) { return m.units && m.mm; });
          api("POST", "/api/projects/" + p.id + "/documents/" + x.document_id + "/calibrate", { measurements: ms }).then(function (res) { toast("Calibrated: " + res.mm_per_unit + " mm per unit — re-reading the drawing."); route(); }).catch(softFail);
        } }, "Calibrate and re-read")));
    }
    return card;
  }
  function featureTable(fs) {
    if (!fs.length) return h("p", { class: "muted" }, "No measurable features.");
    var t = h("table", {}, h("thead", {}, h("tr", {}, ["Measured element", "Value", "Confidence"].map(function (x) { return h("th", {}, x); }))));
    var tb = h("tbody"); t.appendChild(tb);
    fs.forEach(function (f) {
      var v = f.value_mm != null ? NUM.format(f.value_mm / 1000) + " m (" + NUM.format(f.value_mm / 304.8) + " ft)" : f.value_m2 != null ? NUM.format(f.value_m2) + " m² (" + NUM.format(f.value_m2 * 10.7639104) + " sq ft)" : f.value + " nos";
      tb.appendChild(h("tr", {}, h("td", {}, f.label), h("td", { class: "num" }, v), h("td", {}, f.confidence || "—")));
    });
    return h("div", { class: "table-wrap", style: "max-height:300px" }, t);
  }

  // ---- step 2: takeoff questions & ledger
  function stepTakeoff(body, p) {
    return api("GET", "/api/projects/" + p.id + "/takeoff").then(function (tk) {
      var revA = p.revisions.filter(function (r) { return r.kind === "drawing"; })[0];
      var frozen = revA && revA.status === "frozen";
      var groups = tk.decision_groups || [{ key: "all", title: "Questions", why: "", bulk: false, question_keys: tk.questions.map(function (q) { return q.key; }), open: tk.questions.length, total: tk.questions.length }];
      var openTotal = groups.reduce(function (a, g) { return a + (g.open ? 1 : 0); }, 0);
      var qcard = h("div", { class: "card" }, h("h2", {}, "Decisions for the estimator (" + openTotal + " open of " + groups.length + ")"),
        h("p", { class: "muted" }, tk.questions.length + " questions grouped into " + groups.length + " decisions, most quantity-affecting first. Missing information is asked, never guessed; answers are stored with your name. Groups marked “one answer for all” accept a single answer that you can still override per item."));
      if (frozen) qcard.appendChild(h("p", { class: "muted" }, "Revision A is frozen; answers now apply to the reviewed revision."));
      var inputs = {};
      var byKey = {}; tk.questions.forEach(function (q) { byKey[q.key] = q; });
      function renderQ(q, box) {
        var cur = (p.inputs[q.key] || {}).value || "";
        var field;
        if (q.kind === "yesno") field = h("select", {}, h("option", { value: "" }, "— not answered —"), h("option", { value: "yes", selected: cur === "yes" ? "" : null }, "Yes — include"), h("option", { value: "no", selected: cur === "no" ? "" : null }, "No — not in scope"));
        else if (q.kind === "choice") { field = h("select", {}, h("option", { value: "" }, "—")); q.options.forEach(function (o) { field.appendChild(h("option", { value: o, selected: cur === o ? "" : null }, o)); }); }
        else if (q.kind === "identify") {
          field = h("select", {}, h("option", { value: "" }, "— choose or type below —"), h("option", { value: "exclude", selected: cur === "exclude" ? "" : null }, "Exclude (not scope)"));
          (q.options || []).forEach(function (o) { field.appendChild(h("option", { value: o.entry_key, selected: cur === o.entry_key ? "" : null }, o.description + " · fits within " + o.fit_mm + " mm" + (o.units_per_block > 1 ? " · " + o.units_per_block + " per block" : "") + (o.status !== "usable" ? " · cost needs review" : ""))); });
          var free = h("input", { placeholder: "…or describe it", value: cur && !/^furn-|^exclude$/.test(cur) ? cur : "" });
          inputs[q.key] = { get: function () { return free.value.trim() || field.value; } };
          box.appendChild(h("div", { class: "question" }, h("div", { class: "q" }, q.text), h("div", { class: "row" }, field, free)));
          return;
        } else field = h("input", { type: q.kind === "number" ? "number" : "text", value: cur, placeholder: q.unit ? "in " + q.unit : "", style: "min-width:260px" });
        inputs[q.key] = { get: function () { return field.value.trim(); } };
        var sugg = (q.suggestions || []).map(function (sg) {
          return h("div", { class: "suggestion" + (sg.caution ? " caution" : "") },
            h("button", { class: "btn small", onclick: function () { field.value = sg.value; } }, "Use " + sg.value + (q.unit ? " " + q.unit : "")),
            h("span", { class: "small" }, " " + sg.source + (sg.caution ? " — ⚠ " + sg.caution : "")));
        });
        box.appendChild(h("div", { class: "question" }, h("div", { class: "q" }, q.text), h("div", { class: "row" }, field, q.unit ? h("span", { class: "muted small" }, q.unit) : null), sugg));
      }
      var bulkInputs = [];
      groups.forEach(function (g, gi) {
        var qs = g.question_keys.map(function (k) { return byKey[k]; }).filter(Boolean);
        var head = h("div", { class: "decision-head" },
          h("div", {}, h("strong", {}, (gi + 1) + ". " + g.title), " ", g.open ? badge("unresolved", g.open + " open") : badge("ok", "answered")),
          h("div", { class: "muted small" }, [g.why, g.impact].filter(Boolean).join(" — ")));
        var box = h("div", { class: "decision" }, head);
        if (g.bulk && can("project.edit")) {
          var allField = h("input", { placeholder: g.key.indexOf("identify") === 0 ? "One answer for all " + qs.length + " (e.g. exclude, or a description)" : "One answer for all " + qs.length, style: "min-width:320px" });
          bulkInputs.push({ field: allField, keys: g.question_keys });
          box.appendChild(h("div", { class: "row" }, allField, h("span", { class: "muted small" }, "applies to every unanswered item below; per-item answers win")));
        }
        var list = h("div", {});
        qs.forEach(function (q) { renderQ(q, list); });
        if (qs.length > 3) box.appendChild(h("details", { open: gi < 2 ? "" : null }, h("summary", {}, "Show the " + qs.length + " questions"), list));
        else box.appendChild(list);
        qcard.appendChild(box);
      });
      if (can("project.edit") && tk.questions.length) qcard.appendChild(h("div", { class: "row" }, h("button", { class: "btn primary", onclick: function () {
        var answers = {};
        bulkInputs.forEach(function (b) { var v = b.field.value.trim(); if (v) b.keys.forEach(function (k) { answers[k] = v; }); });
        Object.keys(inputs).forEach(function (k) { var v = inputs[k].get(); if (v) answers[k] = v; });
        if (!Object.keys(answers).length) return toast("Nothing answered yet.");
        var reason = ask("Source of these answers (e.g. site survey, client brief):", "estimator"); if (reason === null) return;
        api("POST", "/api/projects/" + p.id + "/inputs", { answers: answers, reason: reason }).then(function () { toast("Answers saved."); route(); }).catch(softFail);
      } }, "Save answers")));
      var led = h("div", { class: "card" }, h("h2", {}, "Scope ledger"), h("p", { class: "muted" }, "Every drawn element maps to a BOQ line or an explicit unresolved / excluded entry. Measured, inferred and approved scope are kept apart."));
      var lt = h("table", {}, h("thead", {}, h("tr", {}, ["Discipline", "Element", "Location", "Status", "Note"].map(function (x) { return h("th", {}, x); }))));
      var ltb = h("tbody"); lt.appendChild(ltb);
      tk.ledger.forEach(function (e) { ltb.appendChild(h("tr", {}, h("td", {}, e.discipline), h("td", {}, e.element), h("td", { class: "small" }, e.location || "—"), h("td", {}, badge(e.status)), h("td", { class: "small muted" }, e.note || ""))); });
      led.appendChild(h("div", { class: "table-wrap" }, lt));
      var chk = h("div", { class: "card" }, h("h2", {}, "Fit-out checklist (inspection only)"), h("p", { class: "muted" }, "The checklist prompts inspection. It never adds standard items that the drawing does not show."));
      var ct = h("table", {}, h("thead", {}, h("tr", {}, ["Discipline", "Shown in drawing", "BOQ lines", "Pending", "Evidence / note"].map(function (x) { return h("th", {}, x); }))));
      var ctb = h("tbody"); ct.appendChild(ctb);
      tk.checklist.forEach(function (c) { ctb.appendChild(h("tr", {}, h("td", {}, c.label), h("td", {}, c.shown_in_drawing ? badge("ok", "Yes") : badge("not_shown")), h("td", { class: "num" }, c.boq_lines), h("td", { class: "num" }, c.pending), h("td", { class: "small muted" }, c.note || c.evidence_terms.join(", ")))); });
      chk.appendChild(ct);
      var cross = h("div", { class: "card" }, h("h2", {}, "Second-pass checks"),
        tk.cross_check.length ? h("ul", {}, tk.cross_check.map(function (c) { return h("li", {}, c.what + ": CAD vs PDF agreement " + c.agreement_pct + "% — " + c.note); })) : h("p", { class: "muted" }, "No paired PDF to cross-check against."),
        tk.discrepancies.length ? h("ul", {}, tk.discrepancies.map(function (d) { return h("li", {}, "⚠ " + d.message); })) : null);
      var src = tk.sources;
      var srcCard = h("div", { class: "card" }, h("h2", {}, "Sources"), h("dl", { class: "kv" },
        h("dt", {}, "Measured from"), h("dd", {}, src.primary.filename + " (" + src.primary.kind + ", sha " + src.primary.sha256.slice(0, 12) + ")"),
        h("dt", {}, "Cross-checked with"), h("dd", {}, src.cross_check ? src.cross_check.filename : "—"),
        h("dt", {}, "Title block"), h("dd", {}, src.title_block ? ["Rev " + (src.title_block.revision || "?"), src.title_block.drawing_no, src.title_block.date, "Scale " + (src.title_block.scale_text || "?")].filter(Boolean).join(" · ") : "—"),
        h("dt", {}, "Units"), h("dd", {}, src.units ? src.units.name : (src.scale ? "from dimension annotations" : "—"))));
      var mbCard = h("div", { class: "card" }, h("h2", {}, "Measurement book"), h("p", { class: "muted" }, "Loading…"));
      add(body, [h("div", { class: "grid two" }, qcard, h("div", {}, srcCard, cross)), mbCard, led, chk]);
      measurementBook(mbCard, p);
    }).catch(function (e) { add(body, h("div", { class: "card" }, h("p", { class: "error" }, e.message))); });
  }

  // ---- measurement book: exact geometry → your conventions → billable, every line
  function measurementBook(card, p) {
    api("GET", "/api/projects/" + p.id + "/measurement-book").then(function (mb) {
      clear(card);
      card.appendChild(h("div", { class: "row spread" }, h("h2", {}, "Measurement book (" + mb.source + ")"),
        h("button", { class: "btn small", onclick: function () { download("/api/projects/" + p.id + "/measurement-book.xlsx", p.name + "-measurement-book.xlsx"); } }, "Download .xlsx")));
      card.appendChild(h("p", { class: "muted" }, "Exact = measured from the drawing. Adjustments are only the conventions you set below; billable is what gets priced. Nothing is rounded, deducted or wasted unless you choose it."));
      var av = mb.available, cur = mb.conventions, fields = {};
      function sel(key) {
        var d = av[key], f = h("select", {});
        d.options.forEach(function (o) { f.appendChild(h("option", { value: o, selected: (cur[key] || d.default) === o ? "" : null }, o.replace(/_/g, " "))); });
        fields[key] = f; return h("label", { class: "small" }, d.label, h("br"), f);
      }
      var dh = h("input", { type: "number", value: cur.conv_door_height_mm || "", placeholder: "mm", style: "width:110px" }); fields.conv_door_height_mm = dh;
      var waste = h("div", { class: "row" });
      av.conv_wastage_pct.disciplines.forEach(function (d) {
        var f = h("input", { type: "number", min: "0", step: "0.5", value: cur["conv_wastage_pct:" + d] || "", placeholder: "0", style: "width:70px" });
        fields["conv_wastage_pct:" + d] = f; waste.appendChild(h("label", { class: "small" }, d, h("br"), f, " %"));
      });
      var form = h("div", { class: "row", style: "align-items:flex-end;gap:14px;flex-wrap:wrap" }, sel("conv_deduct_door_openings"),
        h("label", { class: "small" }, av.conv_door_height_mm.label, h("br"), dh), sel("conv_rounding"), sel("conv_order"));
      card.appendChild(form);
      card.appendChild(h("p", { class: "muted small" }, av.conv_rounding.help));
      card.appendChild(h("div", { class: "small", style: "margin:6px 0" }, "Wastage by trade:"));
      card.appendChild(waste);
      if (can("project.edit")) card.appendChild(h("div", { class: "row" }, h("button", { class: "btn", onclick: function () {
        var answers = {}; Object.keys(fields).forEach(function (k) { var v = String(fields[k].value || "").trim(); if (v !== "" || cur[k]) answers[k] = v || (k.indexOf("wastage") > 0 ? "0" : ""); });
        Object.keys(answers).forEach(function (k) { if (answers[k] === "") delete answers[k]; });
        api("POST", "/api/projects/" + p.id + "/inputs", { answers: answers, reason: "measurement conventions", save_rules: false }).then(function () { toast("Conventions saved."); route(); }).catch(softFail);
      } }, "Apply conventions")));
      var t = h("table", {}, h("thead", {}, h("tr", {}, ["#", "Item", "Floor / location", "Unit", "Exact", "Adjustments", "Billable", "How measured"].map(function (x) { return h("th", {}, x); }))));
      var tb = h("tbody"); t.appendChild(tb);
      mb.rows.forEach(function (r) {
        tb.appendChild(h("tr", {}, h("td", {}, String(r.line_no || "")), h("td", {}, r.description),
          h("td", { class: "small" }, r.location || "—"), h("td", {}, r.unit || ""),
          h("td", { class: "num" }, r.exact != null ? NUM.format(+r.exact) : "awaiting"),
          h("td", { class: "small" }, r.adjustments.length ? r.adjustments.join("; ") : "none"),
          h("td", { class: "num" }, r.billable != null ? h("strong", {}, NUM.format(+r.billable)) : "—"),
          h("td", { class: "small muted" }, (r.formula || "") + (r.evidence_items ? " · " + r.evidence_items + " drawn item(s)" : ""))));
      });
      card.appendChild(h("div", { class: "table-wrap", style: "max-height:420px" }, t));
    }).catch(function (e) { clear(card); card.appendChild(h("p", { class: "error" }, "Measurement book unavailable: " + e.message)); });
  }

  // ------------------------------------------------------------ knowledge: what the system learned, and proof that it helps
  var KSTATUS = { proposed: "review", active: "ok", trusted: "covered", suspended: "warn", withdrawn: "excluded" };
  function viewKnowledge(main) {
    return Promise.all([api("GET", "/api/knowledge"), api("GET", "/api/evaluation/cases"), api("GET", "/api/evaluation/runs"), api("GET", "/api/projects")]).then(function (r) {
      var k = r[0], cases = r[1].cases, runs = r[2].runs, projs = r[3].projects || r[3];
      var head = h("div", { class: "card" }, h("h1", {}, "Knowledge"),
        h("p", { class: "muted" }, "Every answer and correction is recorded. Answers that recur across projects become rules: proposed → active (shown as a suggestion with its track record) → trusted (filled in automatically and labelled). A rule never creates a quantity. Trusting needs " +
          "3 agreeing projects, no contradiction, and no regression in the latest validation run; a contradiction suspends a trusted rule. Knowledge version " + k.knowledge_hash + "."),
        h("button", { class: "btn small", onclick: function () { download("/api/knowledge/export", "knowledge-" + k.knowledge_hash + ".json"); } }, "Export knowledge (.json)"));
      var t = h("table", {}, h("thead", {}, h("tr", {}, ["Rule", "Value", "Status", "Track record", "Gate", ""].map(function (x) { return h("th", {}, x); }))));
      var tb = h("tbody"); t.appendChild(tb);
      if (!k.rules.length) tb.appendChild(h("tr", {}, h("td", { colspan: 6, class: "muted" }, "Nothing learned yet. Answers on projects (not auto-filled assumptions) and corrections to reviewed BOQs appear here.")));
      k.rules.forEach(function (ru) {
        var acts = h("div", { class: "row" });
        function decide(status, needReason) {
          var reason = needReason ? ask("Reason for marking this rule " + status + ":") : "";
          if (needReason && !reason) return;
          api("POST", "/api/knowledge/" + ru.id + "/decision", { status: status, reason: reason }).then(function () { toast("Rule " + status + "."); route(); }).catch(softFail);
        }
        if (can("costing.edit")) {
          if (ru.status === "proposed" || ru.status === "suspended") acts.appendChild(h("button", { class: "btn small", onclick: function () { decide("active", false); } }, "Approve as suggestion"));
          if (ru.status === "active") acts.appendChild(h("button", { class: "btn small primary", disabled: ru.gate.ok ? null : "", title: ru.gate.reasons.join("; "), onclick: function () { decide("trusted", true); } }, "Trust (apply automatically)"));
          if (ru.status === "trusted" || ru.status === "active") acts.appendChild(h("button", { class: "btn small", onclick: function () { decide("suspended", true); } }, "Suspend"));
          acts.appendChild(h("button", { class: "btn small danger", onclick: function () { decide("withdrawn", true); } }, "Withdraw"));
        }
        tb.appendChild(h("tr", {}, h("td", { class: "small" }, ru.kind === "scope_prompt" ? "Prompt: " + ru.key : ru.key),
          h("td", {}, ru.value), h("td", {}, badge(KSTATUS[ru.status] || "note", ru.status)),
          h("td", { class: "small" }, ru.confirmations + " agree · " + ru.contradictions + " disagree · " + ru.project_count + " project(s)"),
          h("td", { class: "small muted" }, ru.gate.ok ? "can be trusted" : ru.gate.reasons.join("; ")), h("td", {}, acts)));
      });
      var rulesCard = h("div", { class: "card" }, h("h2", {}, "Rules (" + k.rules.length + ")"), h("div", { class: "table-wrap" }, t));
      // evaluation
      var ev = h("div", { class: "card" }, h("h2", {}, "Evaluation — does the knowledge help?"),
        h("p", { class: "muted" }, "Mark finished projects (with their customer BOQ) as training, validation or test. Validation and test projects never teach. A run regenerates each case from its drawing alone — once without knowledge, once with the active and trusted rules — and scores both against the case's BOQ, which the generator never sees. Keep the test split for occasional independent checks; tuning against it turns it into validation."));
      var ct = h("table", {}, h("thead", {}, h("tr", {}, ["Project", "Split"].map(function (x) { return h("th", {}, x); }))));
      var ctb = h("tbody"); ct.appendChild(ctb);
      cases.forEach(function (c) { ctb.appendChild(h("tr", {}, h("td", {}, c.project_name), h("td", {}, badge(c.split === "test" ? "warn" : "note", c.split)))); });
      if (!cases.length) ctb.appendChild(h("tr", {}, h("td", { colspan: 2, class: "muted" }, "No evaluation cases yet.")));
      ev.appendChild(ct);
      if (can("costing.edit")) {
        var withRefs = (projs || []).filter(function (p) { return true; });
        var psel = h("select", {}, withRefs.map(function (p) { return h("option", { value: p.id }, p.name); }));
        var ssel = h("select", {}, ["validation", "test", "training", "none"].map(function (x) { return h("option", { value: x }, x); }));
        ev.appendChild(h("div", { class: "row", style: "margin-top:8px" }, psel, ssel, h("button", { class: "btn small", onclick: function () {
          api("GET", "/api/projects/" + psel.value).then(function (pr) {
            var ref = (pr.references || [])[0];
            if (!ref && ssel.value !== "none") return toast("That project has no customer BOQ yet.");
            return api("POST", "/api/evaluation/cases", { project_id: psel.value, reference_id: ref ? ref.id : null, split: ssel.value }).then(function () { toast("Saved."); route(); });
          }).catch(softFail);
        } }, "Set split")));
        ev.appendChild(h("div", { class: "row", style: "margin-top:8px" },
          h("button", { class: "btn primary", onclick: function () { api("POST", "/api/evaluation/runs", { split: "validation" }).then(function () { toast("Validation run complete."); route(); }).catch(softFail); } }, "Run validation"),
          h("button", { class: "btn", onclick: function () { if (!confirm("Run the sealed test split? Use it rarely — repeated tuning against it makes it a validation set.")) return; api("POST", "/api/evaluation/runs", { split: "test" }).then(function () { toast("Test run complete."); route(); }).catch(softFail); } }, "Run blind test")));
      }
      var rt = h("table", {}, h("thead", {}, h("tr", {}, ["When", "Split", "Cases", "Scope recall without → with", "Questions without → with", "Qty error (median) without → with", "Knowledge"].map(function (x) { return h("th", {}, x); }))));
      var rtb = h("tbody"); rt.appendChild(rtb);
      runs.forEach(function (x) { var m = x.metrics;
        rtb.appendChild(h("tr", {}, h("td", { class: "small" }, (x.created_at || "").slice(0, 16).replace("T", " ")), h("td", {}, x.split), h("td", { class: "num" }, m.cases),
          h("td", { class: "num" }, (m.scope_recall_without ?? "—") + "% → " + (m.scope_recall_with ?? "—") + "%"),
          h("td", { class: "num" }, (m.questions_without ?? "—") + " → " + (m.questions_with ?? "—")),
          h("td", { class: "num" }, (m.quantity_error_without ?? "—") + "% → " + (m.quantity_error_with ?? "—") + "%"), h("td", { class: "small muted" }, x.knowledge_hash))); });
      if (!runs.length) rtb.appendChild(h("tr", {}, h("td", { colspan: 7, class: "muted" }, "No runs yet.")));
      ev.appendChild(h("h3", { style: "margin-top:12px" }, "Runs"));
      ev.appendChild(h("div", { class: "table-wrap" }, rt));
      add(main, [head, rulesCard, ev]);
    });
  }

  // ---- step 3: Drawing BOQ (Rev A)
  function stepBoq(body, p) {
    var revA = p.revisions.filter(function (r) { return r.kind === "drawing"; })[0];
    var actions = h("div", { class: "row" });
    if (can("project.edit") && (!revA || revA.status === "draft") && !p.references.length) {
      actions.appendChild(h("button", { class: "btn primary", onclick: function () { api("POST", "/api/projects/" + p.id + "/revisions/generate").then(function () { toast("Drawing BOQ generated from the drawings and your answers."); route(); }).catch(softFail); } }, revA ? "Regenerate draft from drawings" : "Generate Drawing BOQ — Revision A"));
    }
    add(body, h("div", { class: "card" }, h("h2", {}, "Drawing BOQ — Revision A"),
      h("p", { class: "muted" }, "Generated only from the drawings and your answers. Save (freeze) it before the customer's BOQ is uploaded — the comparison is always against this frozen revision."), actions));
    if (!revA) { body.appendChild(h("div", { class: "empty" }, "No Drawing BOQ yet.")); return Promise.resolve(); }
    return api("GET", "/api/revisions/" + revA.id).then(function (rev) {
      if (rev.status === "draft" && can("project.edit")) {
        actions.appendChild(h("button", { class: "btn", onclick: function () { api("POST", "/api/revisions/" + rev.id + "/reprice").then(function () { toast("Repriced with the current master costing."); route(); }).catch(softFail); } }, "Reprice draft"));
        actions.appendChild(h("button", { class: "btn primary", onclick: function () {
          if (!confirm("Freeze Revision A? It can never change afterwards; the customer BOQ can then be uploaded.")) return;
          api("POST", "/api/revisions/" + rev.id + "/freeze").then(function () { toast("Revision A saved and frozen."); location.hash = "#/project/" + p.id + "/customer"; }).catch(softFail);
        } }, "Save & freeze Revision A"));
      }
      body.appendChild(revisionTable(rev, p));
    });
  }
  function revisionTable(rev, p) {
    var card = h("div", { class: "card" });
    var g = rev.generation || {};
    add(card, h("div", { class: "row spread" }, h("h2", {}, rev.title, " ", badge(rev.status)),
      h("div", { class: "row" }, h("span", { class: "muted small" }, (g.generated_at ? "generated " + g.generated_at.replace("T", " ").slice(0, 16) : "") + (rev.frozen_at ? " · frozen " + rev.frozen_at.replace("T", " ").slice(0, 16) : "")),
        h("button", { class: "btn small", onclick: function () { download("/api/revisions/" + rev.id + "/export?draft=" + (rev.totals.complete ? "false" : "true"), "BOQ-Rev" + rev.label + ".xlsx"); } }, "Customer XLSX" + (rev.totals.complete ? "" : " (draft)")),
        can("export.internal") ? h("button", { class: "btn small", onclick: function () { download("/api/revisions/" + rev.id + "/export?internal=true&draft=" + (rev.totals.complete ? "false" : "true"), "BOQ-Rev" + rev.label + "-internal.xlsx"); } }, "Internal XLSX") : null)));
    var t = h("table", {}, h("thead", {}, h("tr", {}, ["#", "Description", "Location", "Qty", "Unit", "Origin", "Cost match", "Rate", "Amount", ""].map(function (x, i) { return h("th", { class: i === 3 || i > 6 ? "num" : null }, x); }))));
    var tb = h("tbody"); t.appendChild(tb);
    rev.lines.forEach(function (l) {
      if (l.removed) return;
      var pr = l.priced || {};
      tb.appendChild(h("tr", { class: "clickable", tabindex: 0, onclick: function () { lineDrawer(rev, l, p); }, onkeydown: function (e) { if (e.key === "Enter") lineDrawer(rev, l, p); } },
        h("td", {}, l.line_no), h("td", {}, l.description, l.missing_inputs.length ? h("div", { class: "small error" }, "awaiting: " + l.missing_inputs.join(", ")) : null),
        h("td", { class: "small" }, l.location || "—"), h("td", { class: "num" }, qty(l.quantity)), h("td", {}, unit(l.unit)), h("td", {}, badge(l.origin)),
        h("td", {}, badge((l.cost_match || {}).state)), h("td", { class: "num" }, pr.selling_rate_display ? money(pr.selling_rate_display) : "—"),
        h("td", { class: "num" }, pr.status === "priced" ? money(pr.selling_amount) : badge(pr.status)), h("td", {}, "›")));
    });
    card.appendChild(h("div", { class: "table-wrap" }, t));
    var tt = rev.totals;
    card.appendChild(h("div", { class: "sticky-total" }, h("span", {}, h("strong", {}, "Priced subtotal: " + money(tt.selling_total))), h("span", {}, tt.priced_lines + " priced"),
      h("span", { class: tt.unpriced_lines ? "error" : "" }, tt.unpriced_lines + " unresolved/unpriced line(s)" + (tt.unpriced_lines ? " — estimate incomplete" : "")),
      can("costing.view_internal") ? h("span", { class: "muted" }, "cost " + money(tt.cost_total) + " · profit " + money(tt.profit_total)) : null));
    if (rev.change_log && rev.change_log.length) {
      var cl = h("details", {}, h("summary", {}, "Change log (" + rev.change_log.length + ")"));
      var ct = h("table", {}, h("thead", {}, h("tr", {}, ["When", "Line", "Field", "Old", "New", "Reason"].map(function (x) { return h("th", {}, x); }))));
      var ctb = h("tbody"); ct.appendChild(ctb);
      rev.change_log.forEach(function (c) { ctb.appendChild(h("tr", {}, h("td", { class: "small" }, (c.at || "").replace("T", " ").slice(0, 16)), h("td", {}, c.line || "—"), h("td", {}, c.field), h("td", {}, String(c.old === null || c.old === undefined ? "—" : c.old)), h("td", {}, String(c.new === null || c.new === undefined ? "—" : c.new)), h("td", { class: "small" }, c.reason))); });
      cl.appendChild(ct); card.appendChild(cl);
    }
    return card;
  }
  function lineDrawer(rev, l, p) {
    var ev = l.evidence || {}, pr = l.priced || {}, cm = l.cost_match || {};
    var boxes = (ev.items || []).map(function (i) { return i.bbox; }).filter(Boolean);
    var parts = [
      h("dl", { class: "kv" }, h("dt", {}, "Origin"), h("dd", {}, badge(l.origin)), h("dt", {}, "Quantity"), h("dd", {}, qty(l.quantity) + " " + unit(l.unit) + " · " + (l.quantity_status || "")),
        h("dt", {}, "How measured"), h("dd", {}, ev.formula || "—"), h("dt", {}, "Method"), h("dd", { class: "small" }, ev.method || "—"),
        h("dt", {}, "Source"), h("dd", {}, (ev.filename || "—") + (ev.sha256 ? " · sha " + ev.sha256.slice(0, 12) : "")),
        h("dt", {}, "Confidence"), h("dd", {}, ev.confidence || "—"),
        ev.cross_check ? [h("dt", {}, "Cross-check"), h("dd", {}, ev.cross_check.map(function (c) { return "PDF " + (c.pdf_value_mm ? NUM.format(c.pdf_value_mm) + " mm" : "") + " vs CAD " + (c.cad_value_mm ? NUM.format(c.cad_value_mm) + " mm" : "") + " → " + c.agreement_pct + "%"; }).join("; "))] : null,
        l.missing_inputs.length ? [h("dt", {}, "Awaiting"), h("dd", { class: "error" }, l.missing_inputs.join(", "))] : null,
        h("dt", {}, "Cost match"), h("dd", {}, badge(cm.state), " ", cm.reason || ""),
        h("dt", {}, "Price"), h("dd", {}, pr.status === "priced" || pr.status === "rate_only" ? (money(pr.selling_rate_display) + " per " + unit(l.unit) + (pr.selling_amount ? " · " + money(pr.selling_amount) : "") + (can("costing.view_internal") && pr.base_cost ? " (base " + money(pr.base_cost) + " + misc " + pr.misc_pct + "% [" + pr.misc_source + "] → margin " + pr.margin_pct + "% [" + pr.margin_source + "])" : "")) : (pr.reason || "—")),
        pr.base_source && pr.base_source.fallback ? [h("dt", {}, "Rate source"), h("dd", {}, badge("warn", "Divine default (fallback)"), " " + (pr.base_source.description || ""))] : null,
        pr.unit_conversion ? [h("dt", {}, "Unit conversion"), h("dd", {}, pr.unit_conversion)] : null)];
    if (ev.document_id && boxes.length) parts.push(h("h3", { style: "margin-top:12px" }, "Drawing evidence"), viewer(ev.document_id, ev.source === "pdf" ? "pdf" : "cad", boxes, { page: (ev.items[0] || {}).page }));
    if (rev.status === "draft" && can("project.edit")) {
      var acts = h("div", { class: "row", style: "margin-top:12px" });
      if (cm.state === "needs_confirmation") acts.appendChild(h("button", { class: "btn primary", onclick: function () { editLine(rev, l, { cost_match_confirm: true }, "Confirm the proposed costing item"); } }, "Confirm cost match"));
      if (cm.candidates && cm.candidates.length) {
        var sel = h("select", {}, cm.candidates.map(function (c) { return h("option", { value: c.entry_key }, c.description + " · " + unit(c.unit) + " · " + (c.status === "usable" ? money(c.base_cost) : "needs review")); }));
        acts.appendChild(h("span", { class: "row" }, sel, h("button", { class: "btn", onclick: function () { editLine(rev, l, { cost_match_entry: sel.value }, "Choose costing item"); } }, "Use this cost")));
      }
      acts.appendChild(h("button", { class: "btn", onclick: function () { var v = ask("New quantity (" + unit(l.unit) + ")", l.quantity || ""); if (v === null) return; editLine(rev, l, { quantity: v }, "Correct the measured quantity"); } }, "Override quantity"));
      if (can("pricing.edit")) acts.appendChild(h("button", { class: "btn", onclick: function () { var v = ask("Line misc % (blank = project/system)", l.misc_pct_override || ""); if (v === null) return; var m = ask("Line gross margin % (blank = project/system)", l.margin_pct_override || ""); if (m === null) return; editLine(rev, l, { misc_pct_override: v, margin_pct_override: m }, "Line pricing override"); } }, "Misc / margin"));
      if (rev.kind !== "drawing") acts.appendChild(h("button", { class: "btn danger", onclick: function () { editLine(rev, l, { removed: true }, "Remove line"); } }, "Remove line"));
      parts.push(acts);
    }
    openDrawer("Line " + l.line_no + " — " + l.description, parts);
  }
  var CAUSES = [["recognition", "a drawn item was misread"], ["missing_object", "something was not measured"], ["geometry_repair", "the drawing geometry needed repair"],
    ["height", "the height was different"], ["measurement_convention", "a measuring convention (faces, openings)"], ["revision", "the drawing revision changed"],
    ["billing_unit", "billed in a different unit"], ["wastage", "wastage / allowance"], ["commercial_scope", "a commercial scope decision"], ["other", "other"]];
  function editLine(rev, l, changes, prompt) {
    var cause = null;
    if (changes.quantity !== undefined) {
      var pick = ask("Why did the quantity change? (the cause is what the system learns from — the number itself is never reused)\n" +
        CAUSES.map(function (c, i) { return (i + 1) + " = " + c[1]; }).join("\n"), "");
      if (pick === null) return;
      var c = CAUSES[parseInt(pick, 10) - 1]; if (!c) return toast("Choose a number from the list.");
      cause = c[0];
    }
    var reason = ask(prompt + " — reason (kept in the change log):"); if (!reason) return;
    api("PATCH", "/api/revisions/" + rev.id + "/lines/" + l.id, { changes: changes, reason: reason, cause: cause }).then(function () { toast("Saved."); closeDrawer(); route(); }).catch(softFail);
  }

  // ---- step 4: customer BOQ
  function stepCustomer(body, p) {
    var revA = p.revisions.filter(function (r) { return r.kind === "drawing"; })[0];
    if (!revA || revA.status !== "frozen") { body.appendChild(h("div", { class: "card" }, h("h2", {}, "Customer BOQ"), h("p", { class: "error" }, "Save and freeze Drawing BOQ — Revision A first. The customer's BOQ must not influence the generated BOQ."))); return Promise.resolve(); }
    var file = h("input", { type: "file", accept: ".xlsx,.xlsm,.csv" });
    add(body, h("div", { class: "card" }, h("h2", {}, "Upload the customer's existing BOQ"),
      h("p", { class: "muted" }, "Used only as a comparison reference against frozen " + revA.title + ". Its prices are never copied into master costs."),
      can("project.edit") ? h("div", { class: "row" }, file, h("button", { class: "btn primary", onclick: function () {
        if (!file.files[0]) return toast("Choose the customer BOQ file.");
        upload("/api/projects/" + p.id + "/references", file.files[0]).then(function (r) { toast(r.duplicate ? "This file was already uploaded." : "Customer BOQ parsed."); route(); }).catch(softFail);
      } }, "Upload & parse")) : null));
    var chain = Promise.resolve();
    p.references.forEach(function (ref) {
      chain = chain.then(function () { return api("GET", "/api/projects/" + p.id + "/references/" + ref.id + "/rows"); }).then(function (j) {
        var counts = {}; j.rows.forEach(function (r) { counts[r.classification] = (counts[r.classification] || 0) + 1; });
        var card = h("div", { class: "card" }, h("div", { class: "row spread" }, h("h2", {}, ref.filename), h("button", { class: "btn primary", onclick: function () { location.hash = "#/project/" + p.id + "/check"; } }, "Open BOQ Confidence Check →")),
          h("p", { class: "muted" }, "Uploaded " + ref.uploaded_at.replace("T", " ").slice(0, 16) + " · sha " + ref.sha256.slice(0, 12) + " · " + j.rows.length + " rows accounted for: " + Object.keys(counts).map(function (k) { return counts[k] + " " + k.replace("_", " "); }).join(", ")));
        var t = h("table", {}, h("thead", {}, h("tr", {}, ["Row", "Code", "Description", "Unit", "Qty", "Classification", "Why"].map(function (x) { return h("th", {}, x); }))));
        var tb = h("tbody"); t.appendChild(tb);
        j.rows.forEach(function (r) {
          var sel = h("select", { "aria-label": "classification", disabled: can("project.edit") ? null : true, onchange: function () {
            var reason = ask("Why is row " + r.row + " " + sel.value + "?"); if (!reason) { sel.value = r.classification; return; }
            api("PATCH", "/api/projects/" + p.id + "/references/" + ref.id + "/rows/" + r.id, { classification: sel.value, reason: reason }).then(function () { toast("Reclassified and logged."); route(); }).catch(softFail);
          } }, ["scope", "heading", "subtotal", "note", "exclusion", "terms", "rate_only", "ambiguous"].map(function (c) { return h("option", { value: c, selected: c === r.classification ? "" : null }, c); }));
          tb.appendChild(h("tr", {}, h("td", { class: "small" }, r.sheet.slice(0, 12) + " " + r.row), h("td", {}, r.code || ""), h("td", { class: "small" }, (r.description || "").slice(0, 160)), h("td", {}, unit(r.unit) || r.raw_unit || ""), h("td", { class: "num" }, qty(r.quantity)), h("td", {}, sel), h("td", { class: "small muted" }, r.classification_reason || "")));
        });
        card.appendChild(h("details", { open: counts.ambiguous ? "" : null }, h("summary", {}, "Parsed rows"), h("div", { class: "table-wrap" }, t)));
        body.appendChild(card);
      });
    });
    return chain;
  }

  // ---- step 5: BOQ Confidence Check
  function stepCheck(body, p) {
    if (!p.references.length) { body.appendChild(h("div", { class: "card" }, h("p", {}, "Upload the customer BOQ first."))); return Promise.resolve(); }
    var ref = p.references[p.references.length - 1];
    var toggle = h("div", { class: "row" }, ["original", "reviewed"].map(function (m) {
      return h("button", { class: "chip", "aria-pressed": S.checkMode === m ? "true" : "false", onclick: function () { S.checkMode = m; route(); } }, m === "original" ? "Original drawing BOQ coverage" : "Reviewed scope reconciliation");
    }));
    body.appendChild(toggle);
    return api("GET", "/api/projects/" + p.id + "/references/" + ref.id + "/comparison?mode=" + S.checkMode).then(function (res) {
      if (res.empty) { body.appendChild(h("div", { class: "card" }, h("p", {}, res.message))); return; }
      renderCheck(body, p, ref, res);
    });
  }
  function renderCheck(body, p, ref, res) {
    var F = S.checkFilter;
    var c = res.counts;
    var head = h("div", { class: "card" }, h("h1", {}, "BOQ Confidence Check"),
      h("p", { class: "muted" }, (res.mode === "original" ? "Original drawing BOQ coverage" : "Reviewed scope reconciliation") + " — " + res.revision.title + " (" + LABEL[res.revision.status] + (res.revision.frozen_at ? ", frozen " + res.revision.frozen_at.replace("T", " ").slice(0, 16) : "") + ") vs customer BOQ “" + res.reference.filename + "” (uploaded " + res.reference.uploaded_at.replace("T", " ").slice(0, 16) + ")."),
      h("p", { class: "verdict" }, res.verdict),
      res.provisional ? h("p", { class: "error" }, "Provisional: " + c.awaiting_classification + " parsed row(s) await classification (see below). Coverage is not claimed against unclassified rows.") : null,
      res.mode === "original" ? h("p", { class: "muted small" }, "This view never includes reviewer decisions: it measures what the frozen drawing BOQ covered on its own.") : h("p", { class: "muted small" }, "Includes reviewer decisions. Completing scope after seeing the customer BOQ does not prove the original generation was complete."));
    var sumT = h("table", { class: "summary-table" }, h("thead", {}, h("tr", {}, h("th", {}, "Scope result"), h("th", { class: "num" }, "Customer items"), h("th", {}, "Action"))));
    var stb = h("tbody"); sumT.appendChild(stb);
    [["covered", "View matches"], ["partly", "Inspect missing scope"], ["missing", "Review omissions"], ["needs_review", "Resolve uncertainty"]].forEach(function (x) {
      stb.appendChild(h("tr", {}, h("td", {}, badge(x[0])), h("td", { class: "num" }, h("button", { class: "linkish", onclick: function () { setF({ status: x[0], section: "", extra: false, qty: "", price: "" }); } }, String(c[x[0]]))), h("td", {}, h("button", { class: "linkish", onclick: function () { setF({ status: x[0], section: "", extra: false, qty: "", price: "" }); } }, x[1]))));
    });
    stb.appendChild(h("tr", {}, h("td", {}, "Total customer scope items"), h("td", { class: "num" }, h("button", { class: "linkish", onclick: function () { setF({ status: "", section: "", extra: false, qty: "", price: "" }); } }, String(c.total))), h("td", {}, h("button", { class: "linkish", onclick: function () { setF({ status: "", section: "", extra: false, qty: "", price: "" }); } }, "View all"))));
    var kpis = h("div", { class: "grid four" },
      h("div", { class: "kpi" }, h("div", { class: "v" }, res.coverage_pct === null ? "—" : res.coverage_pct + "%"), h("div", { class: "l" }, "Scope coverage = " + c.covered + " covered ÷ " + c.total + " applicable customer items")),
      h("button", { class: "kpi", style: "text-align:left;cursor:pointer", onclick: function () { setF({ extra: true, status: "", section: "", qty: "", price: "" }); } }, h("div", { class: "v" }, String(c.extra_ours)), h("div", { class: "l" }, "Extra items in ours (outside the denominator)")),
      h("button", { class: "kpi", style: "text-align:left;cursor:pointer", onclick: function () { setF({ qty: "compared", status: "", section: "", extra: false, price: "" }); } }, h("div", { class: "v" }, res.quantity_summary.compared + " compared"), h("div", { class: "l" }, "Quantities: " + res.quantity_summary.within_tolerance + " within 2%, " + res.quantity_summary.ours_more + " ours more, " + res.quantity_summary.ours_less + " ours less, " + res.quantity_summary.not_comparable + " not comparable")),
      h("button", { class: "kpi", style: "text-align:left;cursor:pointer", onclick: function () { setF({ price: "compared", status: "", section: "", extra: false, qty: "" }); } }, h("div", { class: "v" }, res.price_summary.compared + " compared"), h("div", { class: "l" }, "Prices (separate from scope): " + res.price_summary.ours_higher + " ours higher, " + res.price_summary.ours_lower + " ours lower, " + res.price_summary.not_comparable + " not comparable")));
    var secT = h("table", {}, h("thead", {}, h("tr", {}, ["Section", "Customer items", "Covered", "Partial", "Missing", "Review"].map(function (x, i) { return h("th", { class: i ? "num" : null }, x); }))));
    var sectb = h("tbody"); secT.appendChild(sectb);
    res.sections.forEach(function (s) {
      function cell(n, st) { return h("td", { class: "num" }, n ? h("button", { class: "linkish", onclick: function () { setF({ section: s.section, status: st || "", extra: false, qty: "", price: "" }); } }, String(n)) : "0"); }
      sectb.appendChild(h("tr", {}, h("td", {}, h("button", { class: "linkish", onclick: function () { setF({ section: s.section, status: "", extra: false, qty: "", price: "" }); } }, s.section)), cell(s.customer_items), cell(s.covered, "covered"), cell(s.partly, "partly"), cell(s.missing, "missing"), cell(s.needs_review, "needs_review")));
    });
    var top = h("div", { class: "grid two" }, h("div", { class: "card" }, h("h2", {}, "Summary"), sumT), h("div", { class: "card" }, h("h2", {}, "By section"), secT));
    var detail = h("div", { class: "card", id: "check-detail" });
    var exportBtn = h("button", { class: "btn small", onclick: function () { download("/api/projects/" + p.id + "/references/" + ref.id + "/comparison.xlsx?mode=" + res.mode, "BOQ-Confidence-Check-" + res.mode + ".xlsx"); } }, "Export report (XLSX)");
    add(body, [head, kpis, top, detail]);
    if (res.awaiting.length) body.appendChild(h("div", { class: "card" }, h("h2", {}, "Parsed rows awaiting classification (" + res.awaiting.length + ")"), h("ul", {}, res.awaiting.map(function (r) { return h("li", {}, (r.code || "") + " " + r.description + " — " + r.reason + " ", h("button", { class: "linkish", onclick: function () { location.hash = "#/project/" + p.id + "/customer"; } }, "classify")); }))));
    function setF(f) { Object.assign(F, f); drawDetail(); detail.scrollIntoView({ behavior: "smooth", block: "start" }); }
    function drawDetail() {
      clear(detail);
      var q = h("input", { placeholder: "Search customer items…", value: F.q, oninput: function () { F.q = q.value; drawRows(); } });
      var filt = h("div", { class: "filters" }, q,
        ["", "covered", "partly", "missing", "needs_review"].map(function (s) { return h("button", { class: "chip", "aria-pressed": F.status === s && !F.extra ? "true" : "false", onclick: function () { F.status = s; F.extra = false; F.qty = ""; F.price = ""; drawDetail(); } }, s ? LABEL[s] : "All"); }),
        F.section ? h("button", { class: "chip", "aria-pressed": "true", onclick: function () { F.section = ""; drawDetail(); } }, "Section: " + F.section + " ✕") : null,
        F.qty ? h("button", { class: "chip", "aria-pressed": "true", onclick: function () { F.qty = ""; drawDetail(); } }, "Quantity comparable ✕") : null,
        F.price ? h("button", { class: "chip", "aria-pressed": "true", onclick: function () { F.price = ""; drawDetail(); } }, "Price comparable ✕") : null, exportBtn);
      var holder = h("div");
      add(detail, [h("h2", {}, F.extra ? "Extra items in ours" : "Customer items"), filt, holder]);
      function drawRows() {
        clear(holder);
        if (F.extra) {
          var et = h("table", {}, h("thead", {}, h("tr", {}, ["#", "Our line", "Qty", "Unit", "Origin"].map(function (x) { return h("th", {}, x); }))));
          var etb = h("tbody"); et.appendChild(etb);
          res.extra_lines.forEach(function (l) { etb.appendChild(h("tr", {}, h("td", {}, l.line_no), h("td", {}, l.description), h("td", { class: "num" }, qty(l.quantity)), h("td", {}, unit(l.unit)), h("td", {}, badge(l.origin)))); });
          holder.appendChild(res.extra_lines.length ? h("div", { class: "table-wrap" }, et) : h("div", { class: "empty" }, "None."));
          holder.appendChild(h("p", { class: "muted small" }, "Extra items never offset missing customer items."));
          return;
        }
        var rows = res.rows.filter(function (r) {
          if (F.status && r.status !== F.status) return false;
          if (F.section && (r.section_code ? r.section_code + " · " : "") + r.section !== F.section) return false;
          if (F.qty && !r.qty_variance.comparable) return false;
          if (F.price && !r.price_variance.comparable) return false;
          if (F.q && (r.full_description + " " + (r.code || "")).toLowerCase().indexOf(F.q.toLowerCase()) < 0) return false;
          return true;
        });
        var t = h("table", {}, h("thead", {}, h("tr", {}, ["Code", "Customer item", "Their qty", "Status", "Reason", "Our line(s)", "Qty difference"].map(function (x, i) { return h("th", { class: i === 2 || i === 6 ? "num" : null }, x); }))));
        var tb = h("tbody"); t.appendChild(tb);
        rows.forEach(function (r) {
          var qv = r.qty_variance;
          tb.appendChild(h("tr", { class: "clickable", tabindex: 0, onclick: function () { rowDrawer(p, ref, res, r); }, onkeydown: function (e) { if (e.key === "Enter") rowDrawer(p, ref, res, r); } },
            h("td", {}, r.code || "—"), h("td", { class: "small" }, (r.full_description || "").slice(0, 120)), h("td", { class: "num" }, qty(r.quantity) + " " + unit(r.unit)),
            h("td", {}, badge(r.status), r.cause_label ? h("div", { class: "small muted" }, r.cause_label) : null), h("td", { class: "small" }, (r.reason || "").slice(0, 140)),
            h("td", { class: "small" }, r.lines.length ? r.lines.map(function (l) { return h("div", {}, l.line_no + ". " + l.description); }) : "—"),
            h("td", { class: "num small" }, qv.comparable ? (Number(qv.diff) > 0 ? "+" : "") + qty(qv.diff) + " " + unit(qv.unit) + (qv.pct !== null ? " (" + qv.pct + "%)" : "") : "n/a")));
        });
        holder.appendChild(rows.length ? h("div", { class: "table-wrap" }, t) : h("div", { class: "empty" }, "No items match these filters."));
      }
      drawRows();
    }
    drawDetail();
  }
  function rowDrawer(p, ref, res, r) {
    var qv = r.qty_variance, pv = r.price_variance;
    var parts = [
      h("p", {}, badge(r.status), " ", r.reason || ""),
      h("h3", {}, "Customer item"),
      h("dl", { class: "kv" }, h("dt", {}, "Code / row"), h("dd", {}, (r.code || "—") + " · " + r.sheet + " row " + r.row), h("dt", {}, "Section"), h("dd", {}, r.section),
        h("dt", {}, "Description"), h("dd", { style: "white-space:pre-wrap" }, r.full_description), h("dt", {}, "Location"), h("dd", {}, r.location || "—"),
        h("dt", {}, "Quantity"), h("dd", {}, qty(r.quantity) + " " + unit(r.unit)), h("dt", {}, "Their rate"), h("dd", {}, money(r.rate))),
      h("h3", { style: "margin-top:12px" }, "Our line(s)" + (r.group_kind && r.group_kind !== "1:1" ? " — mapping " + r.group_kind + (r.group_size > 1 ? " (" + r.group_size + " customer rows share this group)" : "") : ""))];
    if (!r.lines.length) parts.push(h("p", { class: "error" }, "No generated line covers this. " + (r.cause_label ? "Cause: " + r.cause_label + "." : "")));
    r.lines.forEach(function (l) { parts.push(h("div", { class: "question" }, h("div", { class: "q" }, l.line_no + ". " + l.description + " — " + qty(l.quantity) + " " + unit(l.unit), " ", badge(l.origin)), h("div", { class: "small muted" }, l.evidence_formula || ""), l.missing_inputs.length ? h("div", { class: "small error" }, "awaiting: " + l.missing_inputs.join(", ")) : null)); });
    parts.push(h("h3", { style: "margin-top:12px" }, "Differences (separate from scope)"),
      h("dl", { class: "kv" }, h("dt", {}, "Quantity"), h("dd", {}, qv.comparable ? "ours " + qty(qv.ours) + " vs theirs " + qty(qv.theirs) + " " + unit(qv.unit) + " → " + (Number(qv.diff) > 0 ? "+" : "") + qty(qv.diff) + (qv.pct !== null ? " (" + qv.pct + "%)" : "") + (qv.conversion && qv.conversion.length ? " · " + qv.conversion.join("; ") : "") + (qv.grouped ? " · compared as a group" : "") : qv.note),
        h("dt", {}, "Price"), h("dd", {}, pv.comparable ? "ours " + money(pv.ours) + " vs theirs " + money(pv.theirs) + " per " + unit(pv.unit) + " → " + money(pv.diff) + (pv.pct ? " (" + pv.pct + "%)" : "") : pv.note),
        r.spec_conflicts.length ? [h("dt", {}, "Specification conflict"), h("dd", { class: "error" }, r.spec_conflicts.join("; "))] : null,
        r.missing_part ? [h("dt", {}, "Missing part"), h("dd", {}, r.missing_part)] : null));
    var withEv = r.lines.filter(function (l) { return l.evidence && l.evidence.document_id && l.evidence.boxes.length; });
    if (withEv.length) {
      var evl = withEv[0];
      parts.push(h("h3", { style: "margin-top:12px" }, "Drawing evidence — " + evl.description), h("p", { class: "small muted" }, (evl.evidence.filename || "") + " · " + (evl.evidence_formula || "")),
        viewer(evl.evidence.document_id, evl.evidence.source === "pdf" ? "pdf" : "cad", evl.evidence.boxes, { page: evl.evidence.page }));
    } else if (!r.lines.length) {
      parts.push(h("p", { class: "small muted" }, "There is no drawing evidence because no generated line covers this item."));
    }
    if (can("project.edit")) {
      var acts = h("div", { class: "row", style: "margin-top:12px" });
      if (r.lines.length && r.status !== "covered") acts.appendChild(h("button", { class: "btn primary", onclick: function () { decide(p, ref, r, "covered", r.lines.map(function (l) { return l.lineage_id; }), "Confirm the suggested match"); } }, "Confirm match"));
      acts.appendChild(h("button", { class: "btn", onclick: function () { pickLines(p, ref, r); } }, "Select better match…"));
      acts.appendChild(h("button", { class: "btn", onclick: function () { var part = ask("What part of the customer scope is missing from ours?"); if (!part) return; decide(p, ref, r, "partly", r.lines.map(function (l) { return l.lineage_id; }), "Partly covered", null, part); } }, "Partly covered…"));
      acts.appendChild(h("button", { class: "btn", onclick: function () {
        var cause = ask("Cause: missed_extraction / wrong_mapping / absent_detail / not_in_drawing / allowance / unresolved", r.cause || "not_in_drawing"); if (!cause) return;
        decide(p, ref, r, "missing", [], "Confirmed missing", cause);
      } }, "Confirm missing…"));
      if (r.status !== "covered") acts.appendChild(h("button", { class: "btn", onclick: function () {
        var reason = ask("Add this as a 'Customer reference / user assumption' line in the reviewed revision. Reason:"); if (!reason) return;
        var q = ask("Quantity (" + unit(r.unit) + "). Leave as is to take the customer's quantity, labelled as such:", r.quantity || "");
        api("POST", "/api/projects/" + p.id + "/references/" + ref.id + "/rows/" + r.ref_row_id + "/add-to-boq", { reason: reason, quantity: q === r.quantity ? null : q }).then(function () { toast("Added to the reviewed revision with origin 'Customer reference / user assumption'."); S.checkMode = "reviewed"; closeDrawer(); route(); }).catch(softFail);
      } }, "Add as allowance / reference item"));
      parts.push(acts, h("p", { class: "muted small" }, "Decisions apply to the reviewed revision only. The original drawing BOQ and its coverage stay unchanged."));
    }
    openDrawer((r.code ? r.code + " · " : "") + LABEL[r.status], parts);
  }
  function decide(p, ref, r, status, lines, prompt, cause, missingPart) {
    var reason = ask(prompt + " — reason (logged):"); if (!reason) return;
    api("POST", "/api/projects/" + p.id + "/references/" + ref.id + "/decisions", { ref_row_ids: [r.ref_row_id], status: status, line_lineage_ids: lines, reason: reason, cause: cause, missing_part: missingPart })
      .then(function () { toast("Decision saved in the reviewed revision."); S.checkMode = "reviewed"; closeDrawer(); route(); }).catch(softFail);
  }
  function pickLines(p, ref, r) {
    api("POST", "/api/projects/" + p.id + "/revisions/review").then(function (rev) {
      var boxes = [];
      var list = h("div", {}, rev.lines.filter(function (l) { return !l.removed; }).map(function (l) {
        var cb = h("input", { type: "checkbox", value: l.lineage_id, checked: r.lines.some(function (x) { return x.lineage_id === l.lineage_id; }) ? "" : null }); boxes.push(cb);
        return h("label", { style: "display:flex;gap:8px;align-items:flex-start;color:inherit" }, cb, h("span", {}, l.line_no + ". " + l.description + " — " + qty(l.quantity) + " " + unit(l.unit)));
      }));
      openDrawer("Select our line(s) for " + (r.code || "this item"), [h("p", { class: "muted" }, "A line can belong to only one mapping group (no double allocation). For one customer row covered by several of our lines, tick them all."), list,
        h("div", { class: "row", style: "margin-top:10px" }, h("button", { class: "btn primary", onclick: function () {
          var sel = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
          if (!sel.length) return toast("Tick at least one line.");
          decide(p, ref, r, "covered", sel, "Map to the selected line(s)");
        } }, "Save mapping"), h("button", { class: "btn", onclick: function () { rowDrawer(p, ref, null, r); } }, "Cancel"))]);
    }).catch(softFail);
  }

  // ---- step 6: reviewed revision
  function stepReview(body, p) {
    var reviewed = p.revisions.filter(function (r) { return r.kind !== "drawing"; });
    var frozenAny = p.revisions.filter(function (r) { return r.status === "frozen"; });
    var actions = h("div", { class: "row" });
    if (can("project.edit") && frozenAny.length && !reviewed.some(function (r) { return r.status === "draft"; })) actions.appendChild(h("button", { class: "btn", onclick: function () { api("POST", "/api/projects/" + p.id + "/revisions/review").then(function () { toast("Reviewed draft created from the latest frozen revision."); route(); }).catch(softFail); } }, "Start a reviewed revision"));
    add(body, h("div", { class: "card" }, h("h2", {}, "Reviewed BOQ"), h("p", { class: "muted" }, "Corrections, approved allowances and mapping decisions are saved here with old value, new value, reason and author. Revision A stays unchanged."), actions));
    var chain = Promise.resolve();
    reviewed.slice().reverse().forEach(function (r) {
      chain = chain.then(function () { return api("GET", "/api/revisions/" + r.id); }).then(function (rev) {
        var bar = h("div", { class: "row", style: "margin-bottom:8px" });
        if (rev.status === "draft" && can("project.edit")) {
          bar.appendChild(h("button", { class: "btn", onclick: function () { api("POST", "/api/revisions/" + rev.id + "/reprice").then(function () { toast("Draft repriced with the current master costing."); route(); }).catch(softFail); } }, "Reprice draft"));
          bar.appendChild(h("button", { class: "btn", onclick: function () { addManual(rev); } }, "Add line…"));
          bar.appendChild(h("button", { class: "btn primary", onclick: function () { if (confirm("Freeze " + rev.title + "?")) api("POST", "/api/revisions/" + rev.id + "/freeze").then(function () { toast("Frozen."); route(); }).catch(softFail); } }, "Save & freeze"));
        }
        if (rev.status === "frozen" && can("project.edit")) bar.appendChild(h("button", { class: "btn", onclick: function () {
          api("GET", "/api/revisions/" + rev.id + "/reprice-preview").then(function (pv) {
            openDrawer("Reprice with latest master costs", [h("p", {}, pv.count + " line(s) would change rate or status. Quantities and scope are not touched; " + rev.title + " stays frozen."),
              h("table", {}, h("tbody", {}, pv.changes.map(function (c) { return h("tr", {}, h("td", {}, c.line_no + ". " + c.description), h("td", { class: "num" }, money(c.old_rate) + " → " + money(c.new_rate)), h("td", { class: "num" }, money(c.old_amount) + " → " + money(c.new_amount))); }))),
              h("button", { class: "btn primary", disabled: pv.count ? null : true, onclick: function () { api("POST", "/api/revisions/" + rev.id + "/reprice-new").then(function () { toast("New repriced revision created."); closeDrawer(); route(); }).catch(softFail); } }, "Create repriced revision")]);
          }).catch(softFail);
        } }, "Reprice with latest master costs…"));
        body.appendChild(bar); body.appendChild(revisionTable(rev, p));
      });
    });
    var revA = p.revisions.filter(function (r) { return r.kind === "drawing"; })[0];
    if (revA) chain = chain.then(function () { return api("GET", "/api/revisions/" + revA.id); }).then(function (rev) { var d = h("details", {}, h("summary", {}, "Revision A (frozen original) for reference")); d.appendChild(revisionTable(rev, p)); body.appendChild(d); });
    return chain;
  }
  function addManual(rev) {
    var d = ask("Description of the line"); if (!d) return;
    var u = ask("Unit (sqft, rft, nos, sqm, m, kg, LS)", "nos"); if (u === null) return;
    var q = ask("Quantity (blank if unknown)", ""); if (q === null) return;
    var reason = ask("Reason / source (logged)"); if (!reason) return;
    api("POST", "/api/revisions/" + rev.id + "/lines", { line: { description: d, unit: u, quantity: q, origin: "manual" }, reason: reason }).then(function () { toast("Line added."); route(); }).catch(softFail);
  }

  // ------------------------------------------------------------ master costing
  var costF = { q: "", status: "", category: "" };
  function viewCosting(main) {
    return Promise.all([api("GET", "/api/costing/summary"), api("GET", "/api/costing/entries")]).then(function (res) {
      var s = res[0], all = res[1].entries;
      var cats = Array.from(new Set(all.map(function (e) { return e.category || ""; }))).sort();
      add(main, [h("h1", {}, "Master Costing"), h("p", { class: "muted" }, "Base cost B is the approved pre-misc, pre-profit unit cost. Defaults come from the supplied “Divine Innovation Costing.xlsx” as a dated baseline, not current supplier pricing. User uploads and edits override them and are never overwritten by the default seed.")]);
      add(main, h("div", { class: "grid four" },
        h("div", { class: "kpi" }, h("div", { class: "v" }, s.counts.usable), h("div", { class: "l" }, "usable items")),
        h("div", { class: "kpi" }, h("div", { class: "v" }, s.counts.needs_review), h("div", { class: "l" }, "need review (kept, not priced)")),
        h("div", { class: "kpi" }, h("div", { class: "v" }, s.counts.from_master), h("div", { class: "l" }, "maintained by users")),
        h("div", { class: "kpi" }, h("div", { class: "v" }, s.default_version ? "v" + s.default_version.version_no : "—"), h("div", { class: "l" }, "default seed " + (s.seed && s.seed.sha256 ? "sha " + s.seed.sha256.slice(0, 10) + " · " + (s.seed.at || "").slice(0, 10) : "not loaded")),
          s.master_version ? h("div", { class: "l" }, "master costing v" + s.master_version.version_no + " · " + (s.master_version.created_at || "").slice(0, 16).replace("T", " ")) : null)));
      if (!s.default_version && can("users.manage")) {
        var seedFile = h("input", { type: "file", accept: ".xlsx" });
        main.appendChild(h("div", { class: "card" }, h("h2", {}, "Load the Divine Innovation default costing"),
          h("p", { class: "muted" }, "No default price list is loaded on this server. Upload “Divine Innovation Costing.xlsx” once; it becomes the dated baseline and is never re-imported over user prices."),
          h("div", { class: "row" }, seedFile, h("button", { class: "btn primary", onclick: function () {
            if (!seedFile.files[0]) return toast("Choose the workbook.");
            upload("/api/costing/default-seed", seedFile.files[0]).then(function (r) { toast(r.seeded ? "Default costing loaded: " + r.stats.entries + " items (" + r.stats.usable + " usable)." : r.reason); route(); }).catch(softFail);
          } }, "Load default costing"))));
      }
      if (can("costing.edit")) main.appendChild(uploadCard());
      var rules = Object.keys(s.bulk_rules || {});
      if (rules.length) {
        var rc = h("div", { class: "card" }, h("h2", {}, "Workbook-wide decisions"));
        rules.forEach(function (k) {
          var r = s.bulk_rules[k];
          rc.appendChild(h("div", { class: "question" }, h("div", { class: "q" }, r.title + " — " + r.affected + " items" + (r.undecided ? ", " + r.undecided + " undecided" : ", decided: " + r.decided.join(", "))),
            can("costing.edit") ? h("div", { class: "row" }, Object.keys(r.options).map(function (o) { return h("button", { class: "btn small" + (r.decided.indexOf(o) >= 0 ? " primary" : ""), onclick: function () { if (confirm(r.options[o] + "?\nApplies to " + r.affected + " items; creates a new master-costing version.")) api("POST", "/api/costing/bulk-rule", { rule: k, choice: o }).then(function () { toast("Applied."); route(); }).catch(softFail); } }, r.options[o]); })) : null));
        });
        main.appendChild(rc);
      }
      var card = h("div", { class: "card" });
      var q = h("input", { placeholder: "Search description, code, alias…", value: costF.q });
      var st = h("select", {}, [["", "All statuses"], ["usable", "Usable"], ["needs_review", "Needs review"], ["inactive", "Inactive"]].map(function (o) { return h("option", { value: o[0], selected: costF.status === o[0] ? "" : null }, o[1]); }));
      var ca = h("select", {}, h("option", { value: "" }, "All categories"), cats.map(function (c) { return h("option", { value: c, selected: costF.category === c ? "" : null }, c || "(none)"); }));
      var holder = h("div");
      function draw() {
        costF.q = q.value; costF.status = st.value; costF.category = ca.value;
        var list = all.filter(function (e) {
          return (!costF.status || e.status === costF.status) && (!costF.category || (e.category || "") === costF.category) &&
            (!costF.q || (e.description + " " + (e.item_code || "") + " " + (e.aliases || []).join(" ")).toLowerCase().indexOf(costF.q.toLowerCase()) >= 0);
        });
        clear(holder);
        var t = h("table", {}, h("thead", {}, h("tr", {}, ["Item", "Category", "Unit", "Base cost (B)", "Historical selling", "Status", "Source", "Updated"].map(function (x, i) { return h("th", { class: i === 3 || i === 4 ? "num" : null }, x); }))));
        var tb = h("tbody"); t.appendChild(tb);
        list.forEach(function (e) {
          tb.appendChild(h("tr", { class: "clickable", tabindex: 0, onclick: function () { entryDrawer(e.entry_key); }, onkeydown: function (ev) { if (ev.key === "Enter") entryDrawer(e.entry_key); } },
            h("td", {}, e.description, e.kind === "assembly" ? h("span", { class: "tag" }, "assembly") : null, e.specification && e.specification !== e.description ? h("div", { class: "small muted" }, e.specification.slice(0, 90)) : null),
            h("td", { class: "small" }, e.category || "—"), h("td", {}, unit(e.unit)), h("td", { class: "num" }, e.base_cost ? money(e.base_cost) : badge("unresolved", "no cost")),
            h("td", { class: "num small muted" }, e.historical_selling_rate ? money(e.historical_selling_rate) : "—"), h("td", {}, badge(e.status)),
            h("td", { class: "small" }, e.origin === "default" ? "Divine default" : (e.origin_label || "Master")), h("td", { class: "small" }, (e.updated_at || "").slice(0, 10))));
        });
        holder.appendChild(h("p", { class: "muted small" }, list.length + " of " + all.length + " items"));
        holder.appendChild(h("div", { class: "table-wrap" }, t));
      }
      [q, st, ca].forEach(function (x) { x.addEventListener(x === q ? "input" : "change", draw); });
      add(card, [h("div", { class: "row spread" }, h("h2", {}, "Price list"), h("button", { class: "btn small", onclick: function () { download("/api/costing/template.csv", "divine-costing-template.csv"); } }, "Download template")), h("div", { class: "filters" }, q, st, ca), holder]);
      main.appendChild(card);
      draw();
      main.appendChild(versionsCard());
    });
  }
  function entryDrawer(key) {
    api("GET", "/api/costing/entries/" + encodeURIComponent(key)).then(function (j) {
      var e = j.entry;
      var parts = [h("p", {}, badge(e.status), " ", e.origin === "default" ? "Divine default (dated baseline)" : (e.origin_label || "Master costing"), " · v" + e.version_no),
        h("dl", { class: "kv" }, h("dt", {}, "Description"), h("dd", {}, e.description), h("dt", {}, "Specification"), h("dd", {}, e.specification || "—"),
          h("dt", {}, "Unit"), h("dd", {}, unit(e.unit) + (e.raw_unit ? " (source: " + e.raw_unit + ")" : "")), h("dt", {}, "Rate type"), h("dd", {}, e.rate_type),
          h("dt", {}, "Base cost B"), h("dd", {}, e.base_cost ? money(e.base_cost) : "—"),
          h("dt", {}, "Historical selling"), h("dd", {}, e.historical_selling_rate ? money(e.historical_selling_rate) + (e.historical_markup_pct ? " (markup " + e.historical_markup_pct + "% — reference only, never re-added)" : "") : "—"),
          h("dt", {}, "Included charges"), h("dd", {}, Object.keys(e.inclusion || {}).map(function (k) { return k + ": " + e.inclusion[k]; }).join(" · ") || "—"),
          h("dt", {}, "Scope"), h("dd", {}, e.scope_key || "—"), h("dt", {}, "Notes"), h("dd", { class: "small" }, e.notes || "—"))];
      var open = (e.review_reasons || []).filter(function (r) { return !r.resolved; });
      if (e.review_reasons && e.review_reasons.length) parts.push(h("h3", { style: "margin-top:12px" }, "Review"), h("ul", {}, e.review_reasons.map(function (r) {
        var opt = (e.resolution_options || []).filter(function (o) { return o.code === r.code; })[0];
        return h("li", {}, r.resolved ? h("s", {}, r.message) : r.message, r.resolved ? h("span", { class: "small muted" }, " — " + r.resolved.how) : null,
          !r.resolved && can("costing.edit") ? h("div", { class: "row" }, opt ? Object.keys(opt.options).map(function (o) { return h("button", { class: "btn small", onclick: function () { costEdit(e, { resolve: (function () { var x = {}; x[r.code] = o; return x; })() }, opt.options[o].label + " → B = " + opt.options[o].base_cost); } }, opt.options[o].label + " (B " + money(opt.options[o].base_cost) + ")"); })
            : (["unit_missing", "unit_unknown", "no_title", "duplicate_variants"].indexOf(r.code) < 0 ? h("button", { class: "btn small", onclick: function () { costEdit(e, { confirm: [r.code] }, "Confirm: " + r.message); } }, "Confirm reviewed") : null),
            r.code === "duplicate_variants" ? h("button", { class: "btn small", onclick: function () { costEdit(e, { confirm: [r.code] }, "Keep this variant active"); } }, "Keep this variant") : null) : null);
      })));
      if (e.components && e.components.length) {
        var ct = h("table", {}, h("thead", {}, h("tr", {}, ["Component", "Kind", "Amount", "Source"].map(function (x) { return h("th", {}, x); }))));
        var ctb = h("tbody"); ct.appendChild(ctb);
        e.components.forEach(function (c) { ctb.appendChild(h("tr", {}, h("td", {}, c.label), h("td", { class: "small" }, c.kind), h("td", { class: "num" }, c.amount ? qty(c.amount) : "—"), h("td", { class: "small muted" }, (c.ref || "") + (c.formula ? " " + c.formula : "")))); });
        parts.push(h("h3", { style: "margin-top:12px" }, e.kind === "assembly" ? "Assembly components (included scope)" : "Cost build-up"), h("div", { class: "table-wrap", style: "max-height:260px" }, ct));
      }
      if (can("costing.edit")) {
        var bc = h("input", { type: "number", step: "0.01", min: "0", value: e.base_cost || "", placeholder: "base cost B" });
        var un = h("input", { value: e.unit || "", placeholder: "unit" });
        var ds = h("input", { value: e.description, style: "min-width:280px" });
        var sp = h("input", { value: e.specification || "", style: "min-width:280px", placeholder: "specification" });
        parts.push(h("h3", { style: "margin-top:12px" }, "Edit"), h("div", { class: "grid two" }, h("label", {}, "Description", ds), h("label", {}, "Specification", sp), h("label", {}, "Unit", un), h("label", {}, "Base cost B (₹, pre-misc, pre-profit)", bc)),
          h("div", { class: "row", style: "margin-top:8px" }, h("button", { class: "btn primary", onclick: function () {
            var ch = {};
            if (ds.value !== e.description) ch.description = ds.value;
            if (sp.value !== (e.specification || "")) ch.specification = sp.value;
            if (un.value !== (e.unit || "")) ch.unit = un.value;
            if (bc.value !== (e.base_cost || "")) ch.base_cost = bc.value;
            if (!Object.keys(ch).length) return toast("Nothing changed.");
            costEdit(e, ch, "Edit");
          } }, "Save changes"),
          e.kind !== "assembly" ? h("button", { class: "btn", onclick: function () {
            var m = ask("Material (₹)"); if (m === null) return; var l = ask("Labour (₹)"); if (l === null) return; var t = ask("Transport (₹)"); if (t === null) return;
            costEdit(e, { components: [{ kind: "material", label: "Material", amount: m || 0 }, { kind: "labour", label: "Labour", amount: l || 0 }, { kind: "transport", label: "Transport", amount: t || 0 }] }, "Set material / labour / transport");
          } }, "Set M / L / T") : null,
          h("button", { class: "btn danger", onclick: function () { costEdit(e, { active: e.status === "inactive" }, e.status === "inactive" ? "Reactivate" : "Deactivate"); } }, e.status === "inactive" ? "Reactivate" : "Deactivate")));
      }
      if (j.changes.length) parts.push(h("h3", { style: "margin-top:12px" }, "History"), h("ul", { class: "small" }, j.changes.map(function (c) { return h("li", {}, (c.at || "").replace("T", " ").slice(0, 16) + " · " + (c.username || c.by_user || "") + " · " + c.change + (c.field ? " " + c.field : "") + (c.old_value || c.new_value ? ": " + (c.old_value || "—") + " → " + (c.new_value || "—") : "") + (c.reason ? " (" + c.reason + ")" : "")); })));
      openDrawer(e.description, parts);
    }).catch(softFail);
  }
  function costEdit(e, changes, what) {
    var reason = ask(what + " — reason (kept with the price history):"); if (!reason) return;
    api("PATCH", "/api/costing/entries/" + encodeURIComponent(e.entry_key), { changes: changes, reason: reason }).then(function () { toast("Saved as a new master-costing version."); entryDrawer(e.entry_key); }).catch(softFail);
  }
  function uploadCard() {
    var file = h("input", { type: "file", accept: ".xlsx,.xlsm,.csv" });
    var out = h("div");
    var card = h("div", { class: "card" }, h("h2", {}, "Upload costing sheet"), h("p", { class: "muted" }, "XLSX or CSV. Divine's own costing workbook is recognised automatically; other price lists are mapped column by column. You see new, changed, duplicate, unchanged and invalid items before anything is activated."),
      h("div", { class: "row" }, file, h("button", { class: "btn primary", onclick: function () {
        if (!file.files[0]) return toast("Choose a file.");
        upload("/api/costing/uploads", file.files[0]).then(function (sess) { showSession(sess, out); }).catch(softFail);
      } }, "Upload & inspect")), out);
    return card;
  }
  function showSession(sess, out) {
    clear(out);
    if (sess.kind === "flat" && sess.status === "needs_mapping") {
      var sheets = sess.parsed.sheets;
      var sheetSel = h("select", {}, sheets.map(function (s) { return h("option", { value: s.name }, s.name + (s.header_row ? " (header row " + s.header_row + ")" : " (no header found)")); }));
      var hdr = h("input", { type: "number", min: "1", value: sheets[0].header_row || 1, style: "width:80px" });
      var maps = {}, grid = h("div", { class: "grid four" });
      function fill() {
        clear(grid); var sh = sheets.filter(function (s) { return s.name === sheetSel.value; })[0];
        sess.parsed.fields.forEach(function (f) {
          var sel = h("select", {}, h("option", { value: "" }, "—"), sh.header.map(function (c, i) { return h("option", { value: i, selected: sh.proposed_mapping[f] === i ? "" : null }, c || "(col " + (i + 1) + ")"); }));
          maps[f] = sel; grid.appendChild(h("label", {}, f.replace(/_/g, " "), sel));
        });
      }
      sheetSel.addEventListener("change", fill); fill();
      add(out, [h("h3", {}, "Map columns"), h("div", { class: "row" }, h("label", {}, "Sheet", sheetSel), h("label", {}, "Header row", hdr)), grid,
        h("button", { class: "btn primary", style: "margin-top:8px", onclick: function () {
          var m = {}; Object.keys(maps).forEach(function (k) { if (maps[k].value !== "") m[k] = Number(maps[k].value); });
          api("POST", "/api/costing/uploads/" + sess.id + "/mapping", { sheet: sheetSel.value, header_row: Number(hdr.value), mapping: m }).then(function (s2) { showSession(s2, out); }).catch(softFail);
        } }, "Apply mapping")]);
      return;
    }
    var mode = h("select", {}, h("option", { value: "merge" }, "Merge / update the active price list"), h("option", { value: "replace" }, "Replace the active price list"));
    var holder = h("div");
    function load() {
      api("GET", "/api/costing/uploads/" + sess.id + "/preview?mode=" + mode.value).then(function (pv) {
        clear(holder);
        var excl = {};
        function section(name, items, cols, withExclude) {
          if (!items.length) return null;
          var t = h("table", {}, h("tbody", {}, items.slice(0, 300).map(function (x) {
            var cb = withExclude ? h("input", { type: "checkbox", checked: "", "aria-label": "apply" }) : null;
            if (cb) excl[x.entry_key] = cb;
            return h("tr", {}, cb ? h("td", {}, cb) : null, cols.map(function (c) { return h("td", { class: "small" }, c(x)); }));
          })));
          return h("details", { open: name === "Changed prices" ? "" : null }, h("summary", {}, name + " (" + items.length + ")"), h("div", { class: "table-wrap", style: "max-height:260px" }, t));
        }
        var diffTxt = function (x) { return Object.keys(x.diffs || {}).map(function (k) { return k + ": " + (x.diffs[k].old || "—") + " → " + (x.diffs[k].new || "—"); }).join("; "); };
        add(holder, [h("p", {}, Object.keys(pv.counts).map(function (k) { return pv.counts[k] + " " + k.replace(/_/g, " "); }).join(" · ")),
          section("New items", pv.new, [function (x) { return x.description; }, function (x) { return unit(x.unit); }, function (x) { return x.base_cost ? money(x.base_cost) : "no cost"; }, function (x) { return badge(x.status); }], true),
          section("Changed prices", pv.changed, [function (x) { return x.description; }, diffTxt], true),
          section("Unchanged", pv.unchanged, [function (x) { return x.description; }]),
          section("Duplicates inside the upload (skipped)", pv.duplicates, [function (x) { return x.description; }, function (x) { return money(x.base_cost); }]),
          section("Kept existing price (upload was blank)", pv.kept_existing_price, [function (x) { return x.description; }, function (x) { return money(x.base_cost); }]),
          section("Need review after import (kept, not priced)", pv.needs_review, [function (x) { return x.description; }, function (x) { return x.reasons.join("; "); }]),
          section("Removed by replacement", pv.removed, [function (x) { return x.description; }]),
          section("Rejected rows", pv.rejected, [function (x) { return "row " + x.row; }, function (x) { return x.reason; }]),
          section("Not imported (headings, totals, project quantities, terms)", pv.ignored, [function (x) { return x.sheet + " " + x.range; }, function (x) { return x.reason; }]),
          pv.flags.length ? h("ul", {}, pv.flags.map(function (f) { return h("li", { class: "small" }, "⚠ " + f.message); })) : null]);
        var conf = h("input", { type: "checkbox" });
        add(holder, [h("label", { style: "display:flex;gap:8px;align-items:center;color:inherit;margin-top:8px" }, conf, "I have reviewed these changes. Activate them as a new master-costing version (" + mode.value + "). Existing quotes keep their snapshot."),
          h("button", { class: "btn primary", onclick: function () {
            if (!conf.checked) return toast("Tick the confirmation first.");
            var exclude = Object.keys(excl).filter(function (k) { return !excl[k].checked; });
            api("POST", "/api/costing/uploads/" + sess.id + "/activate", { mode: mode.value, exclude: exclude, confirm: true }).then(function (r) { toast(r.applied + " item(s) activated."); route(); }).catch(softFail);
          } }, "Activate")]);
      }).catch(softFail);
    }
    mode.addEventListener("change", load);
    add(out, [h("h3", {}, "Preview — " + sess.filename), h("label", {}, "Mode", mode), holder]);
    load();
  }
  function versionsCard() {
    var card = h("div", { class: "card" }, h("h2", {}, "Versions"));
    api("GET", "/api/costing/versions").then(function (j) {
      var t = h("table", {}, h("thead", {}, h("tr", {}, ["Catalogue", "Version", "Status", "Source", "When", "Entries", ""].map(function (x) { return h("th", {}, x); }))));
      var tb = h("tbody"); t.appendChild(tb);
      j.versions.forEach(function (v) {
        tb.appendChild(h("tr", {}, h("td", {}, v.catalogue_id === "cat-default" ? "Divine default" : "Master"), h("td", {}, "v" + v.version_no), h("td", {}, badge(v.status === "active" ? "ok" : "note", v.status)),
          h("td", { class: "small" }, v.source_kind + (v.source_filename ? " · " + v.source_filename : "") + (v.notes ? " · " + v.notes : "")), h("td", { class: "small" }, (v.created_at || "").replace("T", " ").slice(0, 16)),
          h("td", { class: "num" }, (v.stats || {}).entries), h("td", {}, v.catalogue_id === "cat-master" && v.status !== "active" && can("costing.edit") ? h("button", { class: "btn small", onclick: function () { if (confirm("Roll master costing back to v" + v.version_no + "? This creates a new version; history is kept.")) api("POST", "/api/costing/rollback", { version_id: v.id }).then(function () { toast("Rolled back."); route(); }).catch(softFail); } }, "Roll back to this") : null)));
      });
      card.appendChild(h("div", { class: "table-wrap", style: "max-height:300px" }, t));
    }).catch(function (e) { card.appendChild(h("p", { class: "error" }, e.message)); });
    return card;
  }

  // ------------------------------------------------------------ settings
  function describe(pre) {
    return Object.keys(pre).filter(function (k) { return k !== "project" && k !== "files_folder"; }).map(function (k) {
      var v = pre[k]; return "• " + k.replace(/_/g, " ") + ": " + (Array.isArray(v) ? (v.length ? v.map(function (x) { return x.key || x.name || JSON.stringify(x); }).join(", ") : "none") : (v && typeof v === "object" ? JSON.stringify(v) : v));
    }).join("\n");
  }
  function deleteProject(p) {
    api("GET", "/api/projects/" + p.id + "/delete-preview").then(function (pre) {
      var name = ask("Delete “" + p.name + "” and everything below? This cannot be undone here (a backup is written first).\n\n" + describe(pre) + "\n\nType the project name to confirm:");
      if (name === null) return;
      return api("DELETE", "/api/projects/" + p.id, { confirm: name }).then(function (r) { toast("Deleted. " + r.retention); location.hash = "#/projects"; });
    }).catch(softFail);
  }
  function resetProject(p) {
    if (!confirm("Reset “" + p.name + "”? Revisions, the customer BOQ, comparisons and the evaluation mark are removed; drawings, measurements and answers are kept. A backup is written first.")) return;
    api("POST", "/api/projects/" + p.id + "/reset", { keep_answers: true }).then(function () { toast("Outputs reset — regenerate the BOQ from the drawing."); route(); }).catch(softFail);
  }
  function resetScope(scope, label) {
    api("GET", "/api/admin/reset-preview?scope=" + scope).then(function (pre) {
      var msg = "Reset " + label + "? A backup is written first.\n\n" + describe(pre);
      var body = { scope: scope };
      if (scope === "all") { var c = ask(msg + "\n\nType RESET EVERYTHING to confirm:"); if (c === null) return; body.confirm = c; }
      else if (!confirm(msg)) return;
      return api("POST", "/api/admin/reset", body).then(function (r) { toast(label + " reset. " + (r.retention || "")); route(); });
    }).catch(softFail);
  }
  function viewSettings(main) {
    var api_in = h("input", { value: API || location.origin, style: "min-width:320px" });
    add(main, [h("h1", {}, "Settings"), h("div", { class: "card" }, h("h2", {}, "Server"),
      h("dl", { class: "kv" }, h("dt", {}, "API"), h("dd", {}, API || location.origin), h("dt", {}, "Status"), h("dd", {}, S.health ? "online · version " + S.health.version : "unreachable"),
        h("dt", {}, "DWG converter"), h("dd", {}, S.health && S.health.converter.dwg2dxf ? S.health.converter.version : "not available"),
        h("dt", {}, "OCR for scanned PDFs"), h("dd", {}, S.health && S.health.ocr ? "available (title-block text only; scans are never measured)" : "not available"),
        h("dt", {}, "Pricing defaults"), h("dd", {}, "10% additional misc on cost, then 30% gross selling margin (editable per project and per line)")),
      h("div", { class: "row", style: "margin-top:10px" }, api_in, h("button", { class: "btn", onclick: function () { location.search = "?api=" + encodeURIComponent(api_in.value); } }, "Use this API"), h("button", { class: "btn ghost", onclick: function () { location.search = "?api=reset"; } }, "Reset"))),
      h("div", { class: "card" }, h("h2", {}, "Your account"), h("p", {}, S.user.display_name + " · role " + S.user.role), h("p", { class: "small muted" }, "Permissions: " + S.user.permissions.join(", "))),
      can("users.manage") ? h("div", { class: "card" }, h("h2", {}, "Clean up"),
        h("p", { class: "muted" }, "Each action shows exactly what it affects before you confirm, and writes a database backup first. Knowledge and costing reset independently of projects."),
        h("div", { class: "row" },
          h("button", { class: "btn", onclick: function () { resetScope("knowledge", "learned knowledge"); } }, "Reset learned knowledge"),
          h("button", { class: "btn", onclick: function () { resetScope("costing", "master costing"); } }, "Reset master costing"),
          h("button", { class: "btn danger", onclick: function () { resetScope("all", "the whole workspace"); } }, "Full reset (pilot demo)"))) : null]);
    return Promise.resolve();
  }

  // ------------------------------------------------------------ boot
  checkHealth().then(function () {
    if (!S.token) { showLogin(); return; }
    return api("GET", "/api/auth/me").then(function (u) { S.user = u; renderUser(); route(); }).catch(function () { showLogin(); });
  });
  setInterval(checkHealth, 60000);
})();
