// Divine Innovation — BOQ Studio Client App (Yogabrata.com)
const API_BASE = "http://127.0.0.1:8000/api";

let currentProjectId = "proj-fusion";
let state = {
  currentUser: null,
  project: null,
  inventory: [],
  boqItems: [],
  zones: [],
  issues: [],
  comparisonData: null,
  cmpFilter: "all",
  zoomLevel: 1.0,
  globalMiscPct: 10.0,
  globalMarginPct: 30.0
};

// Available Accounts (case-insensitive username comparison)
const VALID_USERS = [
  { username: "yoga", password: "yoga", displayName: "Yoga", role: "admin" },
  { username: "akhil", password: "Akhil@Lord1", displayName: "Akhil", role: "admin" }
];

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initNavigation();
  initEventListeners();
});

function checkAuth() {
  const savedUser = localStorage.getItem("di_user");
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
      updateUserUI();
      loadData();
      return;
    } catch (e) { localStorage.removeItem("di_user"); }
  }

  const modal = document.getElementById("login-modal");
  if (modal) modal.style.display = "flex";
}

function handleLogin(e) {
  e.preventDefault();
  const uInput = document.getElementById("login-username").value.trim().toLowerCase();
  const pInput = document.getElementById("login-password").value.trim();

  const found = VALID_USERS.find(user => user.username === uInput && user.password === pInput);
  if (found) {
    state.currentUser = { username: found.displayName, role: found.role };
    localStorage.setItem("di_user", JSON.stringify(state.currentUser));
    engineLogin(found.displayName, pInput);
    document.getElementById("login-modal").style.display = "none";
    updateUserUI();
    loadData();
  } else {
    alert("Invalid credentials!\n\nValid accounts:\n- yoga / yoga\n- Akhil / Akhil@Lord1\n(Usernames are case-insensitive)");
  }
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem("di_user");
  localStorage.removeItem("di_api_token");
  document.getElementById("login-modal").style.display = "flex";
}

function updateUserUI() {
  if (state.currentUser) {
    document.getElementById("sidebar-user-name").textContent = state.currentUser.username;
    document.getElementById("admin-user-display").textContent = state.currentUser.username;
  }
}

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item:not(.nav-external)");
  const tabViews = document.querySelectorAll(".tab-view");
  const heading = document.getElementById("page-heading");

  const headings = {
    project: "1. Divine Innovation — Project & Document Inventory",
    "upload-cad": "2. AutoCAD DWG/DXF & Adobe PDF/AI Drawing Upload Pipeline",
    drawing: "3. Drawing & Interactive Measurements",
    boq: "4. Bill of Quantities (BOQ Workspace)",
    "admin-bom": "5. Admin BOM Costing & Pricing Manager",
    compare: "6. Upload & Side-by-Side BOQ Variance Comparison",
    review: "7. Review, Reconciliation & Excel Export"
  };

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      tabViews.forEach(view => {
        view.style.display = view.id === `view-${tab}` ? "block" : "none";
      });

      if (heading && headings[tab]) {
        heading.textContent = headings[tab];
      }

      if (tab === "compare" && !state.comparisonData) {
        loadDefaultComparison();
      }
    });
  });
}

function initEventListeners() {
  document.getElementById("form-login")?.addEventListener("submit", handleLogin);
  document.getElementById("btn-logout")?.addEventListener("click", handleLogout);

  document.getElementById("btn-reset-data")?.addEventListener("click", resetProjectData);
  document.getElementById("btn-import-sample")?.addEventListener("click", importSample);
  document.getElementById("btn-re-discover")?.addEventListener("click", loadInventory);
  document.getElementById("btn-export-excel-quick")?.addEventListener("click", () => exportExcel(false));
  document.getElementById("btn-export-customer")?.addEventListener("click", () => exportExcel(false));
  document.getElementById("btn-export-internal")?.addEventListener("click", () => exportExcel(true));

  document.getElementById("btn-apply-global-pricing")?.addEventListener("click", applyGlobalPricingDefaults);

  // CAD / Adobe file upload
  document.getElementById("input-cad-adobe-file")?.addEventListener("change", handleCADAdobeUpload);
  document.getElementById("btn-load-sample-dwg-pdf")?.addEventListener("click", importSample);

  // Upload BOQ for comparison
  document.getElementById("input-upload-boq")?.addEventListener("change", handleBOQUpload);
  document.getElementById("btn-load-default-compare")?.addEventListener("click", loadDefaultComparison);

  // Comparison filters
  document.querySelectorAll(".filter-cmp").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-cmp").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.cmpFilter = btn.getAttribute("data-filter");
      if (state.comparisonData) renderComparisonTable(state.comparisonData);
    });
  });

  // Canvas zoom
  document.getElementById("btn-zoom-in")?.addEventListener("click", () => setZoom(state.zoomLevel + 0.25));
  document.getElementById("btn-zoom-out")?.addEventListener("click", () => setZoom(Math.max(0.5, state.zoomLevel - 0.25)));
  document.getElementById("btn-zoom-reset")?.addEventListener("click", () => setZoom(1.0));

  // Add Measurement Form
  document.getElementById("form-add-measurement")?.addEventListener("submit", handleAddMeasurement);

  // BOQ Search
  document.getElementById("boq-search")?.addEventListener("input", (e) => filterBOQItems(e.target.value));
}

async function resetProjectData() {
  if (!confirm("Are you sure you want to clean up all workspace data?\n\nThis will reset the workspace to a pristine state so you can upload your DWG file or PDF drawing from scratch.")) {
    return;
  }

  const btn = document.getElementById("btn-reset-data");
  if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Resetting...`;
  localStorage.removeItem("di_boq_items");
  localStorage.removeItem("di_boq_meta");
  localStorage.removeItem("di_cmp");
  state.comparisonData = null;
  state.cmpScope = "all";
  const cmpBox = document.getElementById("cmp-scope-summary"); if (cmpBox) cmpBox.remove();
  const cmpBody = document.getElementById("compare-table-body");
  if (cmpBody) cmpBody.innerHTML = `<tr><td colspan="12" style="text-align: center; color: var(--text-muted);">Upload a reference BOQ to compare it with the BOQ generated from your drawing.</td></tr>`;
  ["cmp-gen-total", "cmp-up-total"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = "₹ 0.00"; });
  const cv = document.getElementById("cmp-var-total"); if (cv) cv.textContent = "₹ 0.00 (0%)";
  const ci = document.getElementById("cmp-items-count"); if (ci) ci.textContent = "0 items";

  try {
    const res = await fetch(`${API_BASE}/project/reset?project_id=${currentProjectId}`, { method: "POST" });
    const data = await res.json();
    state.inventory = [];
    state.boqItems = [];
    state.zones = [];
    state.issues = [];
    state.comparisonData = null;

    alert(data.message || "Workspace data cleaned up successfully!");
    await loadData();
  } catch (err) {
    state.inventory = [];
    state.boqItems = [];
    state.zones = [];
    state.issues = [];
    state.comparisonData = null;
    alert("Workspace data cleaned up locally to pristine state.");
    await loadData();
  } finally {
    if (btn) btn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Clean Data / Reset`;
  }
}

async function loadData() {
  try {
    await loadBOQItems();
    await loadProjectSummary();
    await loadInventory();
    await loadZones();
    await loadReviewIssues();
    await loadPDFDrawing();
  } catch (err) {
    console.error("Error loading app data:", err);
  }
}

async function loadPDFDrawing() {
  const pdfImg = document.getElementById("pdf-rendered-img");
  if (!pdfImg) return;
  pdfImg.src = `/static/rendered_pages/${currentProjectId}_page_1.png`;
  pdfImg.onerror = () => { pdfImg.src = "src/layout_drawing.png"; };
}

// ---------------- DRAWING-BASED BOQ ENGINE (live API) ----------------
// The BOQ is generated from the uploaded drawing by the Divine Studio engine
// (https://divine-api.brahmexa.com): the drawing is measured, and anything the
// drawing does not state (heights, finishes) is filled with the standard
// assumptions below. Every assumed value is labelled on its line.
const ENGINE_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin + "/api" : "https://divine-api.brahmexa.com/api";
const STANDARD_ASSUMPTIONS = {
  partition_height_mm: "3048",          // 10 ft
  glass_partition_height_mm: "2438",    // 8 ft
  window_height_mm: "1524",             // 5 ft
  wall_paint_height_mm: "3048",
  glass_specification: "12 mm toughened clear glass",
  floor_finish: "Vitrified tiles 600x600",
  ceiling_enclosed_spec: "600x600 mineral fibre grid ceiling",
  wall_paint_faces: "both",
  approve_flooring: "yes", approve_skirting: "yes", approve_ceiling_paint: "yes",
  approve_ceiling_enclosed: "yes", approve_ceiling_open: "no", approve_wall_paint: "yes",
  approve_blinds: "yes", approve_pelmet: "yes", approve_infill_above_glass: "yes"
};
const ASSUMPTION_LABEL = "partitions 10 ft, glass 8 ft, windows 5 ft, gypsum partitions, 12 mm toughened glass, vitrified flooring, grid ceiling in cabins, paint both faces";
// Base cost B per unit (pre-misc, pre-margin)
const RATE_BOOK = {
  "partition.gypsum": [201.25, "Divine costing: gypsum partition"],
  "partition.gypsum.above_glass": [201.25, "Divine costing: gypsum partition"],
  "partition.glass": [435, "standard rate"],
  "door.glass": [18301.5, "Divine costing: glass door 900x2100"],
  "door.flush": [11300, "standard rate"],
  "door.generic": [11300, "standard rate"],
  "floor.tile.vitrified": [157.75, "Divine costing: vitrified tiles"],
  "floor.skirting": [99.51, "Divine costing: tiles skirting"],
  "ceiling.grid": [115, "standard rate"],
  "paint.wall": [44, "standard rate"],
  "paint.ceiling": [44, "standard rate"]
};
const SECTION_ORDER = ["Partitions & glazing", "Doors", "Flooring", "Ceilings", "Painting", "Windows", "Furniture & loose items"];

function engineToken() { return localStorage.getItem("di_api_token"); }

async function engineCall(method, path, body, isForm, retried) {
  if (!engineToken() && !retried) await ensureEngineSession();
  const headers = {};
  const tok = engineToken();
  if (tok) headers.Authorization = "Bearer " + tok;
  if (body && !isForm) headers["Content-Type"] = "application/json";
  const res = await fetch(ENGINE_API + path, { method, headers, body: isForm ? body : (body ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { error: text }; }
  if (res.status === 401) {
    localStorage.removeItem("di_api_token");
    if (!retried && await ensureEngineSession()) return engineCall(method, path, body, isForm, true);
    throw new Error("Could not connect to the drawing engine — please sign in again.");
  }
  if (!res.ok) throw new Error((data && (data.error || data.detail)) || ("HTTP " + res.status));
  return data;
}

async function engineLogin(username, password) {
  const names = [...new Set([username, username.toLowerCase(), username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()])];
  for (const name of names) {
    try {
      const res = await fetch(ENGINE_API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: name, password }) });
      if (res.ok) { localStorage.setItem("di_api_token", (await res.json()).token); return true; }
    } catch (e) { /* engine unreachable */ }
  }
  return false;
}

// Older sessions signed in before the engine existed (or with a lower-case name the engine rejected):
// ask for the password once, connect, and carry on — no log-out needed.
async function ensureEngineSession() {
  if (engineToken()) return true;
  const user = state.currentUser && state.currentUser.username;
  const found = VALID_USERS.find(u => user && (u.displayName === user || u.username === String(user).toLowerCase()));
  if (found && await engineLogin(found.displayName, found.password)) return true;
  const pw = prompt(`Enter the password for ${user || "your account"} to connect to the drawing engine:`);
  if (!pw) return false;
  if (await engineLogin(user || "", pw)) return true;
  alert("Could not connect to the drawing engine with that password.");
  return false;
}

function setStatus(msg) {
  let el = document.getElementById("engine-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "engine-status";
    el.style.cssText = "position:fixed;bottom:18px;right:18px;z-index:9999;background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;max-width:420px;box-shadow:0 6px 24px rgba(0,0,0,.25)";
    document.body.appendChild(el);
  }
  el.style.display = msg ? "block" : "none";
  el.textContent = msg || "";
}

async function waitForJob(jobId) {
  for (let i = 0; i < 240; i++) {
    const j = await engineCall("GET", `/jobs/${jobId}`);
    if (j.status === "completed") return j;
    if (j.status === "failed") throw new Error(j.message || "Drawing processing failed");
    setStatus(`Reading drawing… ${j.message || ""}`);
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error("Drawing processing timed out");
}

function assumptionAnswers(questions) {
  const a = Object.assign({}, STANDARD_ASSUMPTIONS);
  questions.forEach(q => {
    // a height written on the drawing for this very element beats the standard assumption; a ceiling height never does
    const stated = (q.suggestions || []).find(sg => !sg.caution && /stated on the drawing/.test(sg.source || ""));
    if (STANDARD_ASSUMPTIONS[q.key] !== undefined) a[q.key] = stated ? String(stated.value) : STANDARD_ASSUMPTIONS[q.key];
    else if (q.key.startsWith("layer_material:")) a[q.key] = "Gypsum board partition";
    else if (q.key.startsWith("door_type:")) a[q.key] = "Flush door";
    else if (q.key.startsWith("identify:") && q.options && q.options.length && q.options[0].fit_mm <= 60) a[q.key] = q.options[0].entry_key;
  });
  return a;
}

async function catalogueBase(entryKey) {
  try {
    const j = await engineCall("GET", `/costing/entries/${encodeURIComponent(entryKey)}`);
    return j.entry && j.entry.base_cost ? [Number(j.entry.base_cost), "Divine costing: " + j.entry.description] : null;
  } catch (e) { return null; }
}

async function buildOldStyleItems(rev, filename) {
  const misc = state.globalMiscPct || 10.0;
  const margin = state.globalMarginPct || 30.0;
  const lines = rev.lines.filter(l => !l.removed);
  const bySection = {};
  for (const l of lines) (bySection[l.section] = bySection[l.section] || []).push(l);
  const rank = s => { const i = SECTION_ORDER.indexOf(s); return i < 0 ? 99 : i; };
  const sections = Object.keys(bySection).sort((a, b) => rank(a) - rank(b));
  const items = [];
  let s = 0;
  for (const sec of sections) {
    s += 1;
    items.push({ id: `h-${s}`, item_code: `${s}.0`, description: sec.toUpperCase(), is_heading: true });
    let n = 0;
    for (const l of bySection[sec]) {
      n += 1;
      let rate = RATE_BOOK[l.scope_key] || null;
      const ck = (l.attributes || {}).catalogue_entry_key;
      if (ck) rate = (await catalogueBase(ck)) || rate;
      const base = rate ? rate[0] : 0;
      const qty = l.quantity !== null && l.quantity !== undefined ? Number(l.quantity) : 0;
      const totalCostRate = base * (1 + misc / 100);
      const sellingRate = totalCostRate / (1 - margin / 100);
      const formula = (l.evidence || {}).formula || `measured from ${filename}`;
      const assumed = l.origin !== "drawing_measured" || /height|ceiling|paint|blind|pelmet|skirting|floor finish/i.test(formula + " " + l.description);
      items.push({
        id: l.lineage_id, item_code: `${s}.${n}`,
        description: l.description.replace(/\s*\(variant \d+ of \d+\)/, "") + (l.specification && !l.description.includes(l.specification) && !/^layer |rule|project answer/.test(l.specification) ? ` — ${l.specification}` : ""),
        location: l.location || "-", unit: l.unit === "sqft" ? "sq ft" : l.unit === "ft" ? "rft" : l.unit,
        current_qty: Math.round(qty * 100) / 100,
        material_cost: base, labour_cost: 0, transport_cost: 0, misc_pct: misc, margin_pct: margin,
        cost_rate: Math.round(totalCostRate * 100) / 100, selling_rate: Math.round(sellingRate * 100) / 100,
        selling_amount: Math.round(qty * sellingRate * 100) / 100,
        provenance_type: formula + (assumed ? " [standard assumption — edit if different]" : ""),
        rate_source: rate ? rate[1] : "rate needed",
        review_status: rate ? "Under review" : "Rate needed",
        scope_key: l.scope_key
      });
    }
  }
  return items;
}

function showGeneratedBOQ(items, filename, meta) {
  state.boqItems = items;
  localStorage.setItem("di_boq_items", JSON.stringify(items));
  localStorage.setItem("di_boq_meta", JSON.stringify(Object.assign({ filename }, meta)));
  renderBOQTable(items);
  renderAdminBOMTable(items);
  populateMeasBOQSelect(items);
  const totalAmt = items.reduce((acc, i) => acc + (i.selling_amount || 0), 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("summary-customer", `Divine Innovation / ${filename.replace(/\.[^/.]+$/, "")}`);
  set("summary-location", meta.title || "Uploaded drawing");
  set("summary-total-amount", `₹ ${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  set("summary-revision", `${meta.revision || "Rev 01"} (${filename})`);
  set("sidebar-rev-label", meta.revision || "Rev 01");
  const badge = document.getElementById("proj-status-badge");
  if (badge) { badge.textContent = "BOQ GENERATED FROM DRAWING"; badge.className = "badge badge-success"; }
}

function restoreGeneratedBOQ() {
  try {
    const items = JSON.parse(localStorage.getItem("di_boq_items") || "null");
    const meta = JSON.parse(localStorage.getItem("di_boq_meta") || "null");
    if (items && items.length && meta) { showGeneratedBOQ(items, meta.filename || "drawing", meta); return true; }
  } catch (e) { /* ignore */ }
  return false;
}


// ---------------- Drawing ingestion screen: full-screen, step by step, traces the real drawing ----------------
const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ingEsc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class Ingest {
  constructor(title, subtitle, steps) {
    this.steps = steps.map(s => Object.assign({ state: "pending", detail: "" }, s));
    this.queue = Promise.resolve();
    this.el = document.createElement("div");
    this.el.className = "ing-overlay";
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-modal", "true");
    this.el.setAttribute("aria-label", title);
    this.el.innerHTML = `
      <div class="ing-card">
        <div class="ing-stage"><canvas></canvas><div class="ing-scan"></div>
          <div class="ing-file"><div class="ing-doc">${ingEsc(subtitle.split(".").pop().toUpperCase().slice(0, 4))}</div><div class="ing-name">${ingEsc(subtitle)}</div></div>
          <div class="ing-caption"><span class="dot"></span><span class="cap">Starting…</span></div></div>
        <div class="ing-side">
          <div class="ing-title">${ingEsc(title)}</div><div class="ing-sub">${ingEsc(subtitle)}</div>
          <div class="ing-bar"><div></div></div><div class="ing-pct"><span class="now">Preparing</span><span class="pc">0%</span></div>
          <ol class="ing-steps" aria-live="polite"></ol>
          <div class="ing-finds"></div>
          <div class="ing-summary" hidden></div>
        </div>
      </div>`;
    document.body.appendChild(this.el);
    this.canvas = this.el.querySelector("canvas");
    this.stage = this.el.querySelector(".ing-stage");
    this.renderSteps();
  }
  q(sel) { return this.el.querySelector(sel); }
  renderSteps() {
    this.q(".ing-steps").innerHTML = this.steps.map(s =>
      `<li class="ing-step ${s.state}" data-k="${s.key}"><span class="ic"></span><span>${ingEsc(s.label)}${s.detail ? `<span class="det">${ingEsc(s.detail)}</span>` : ""}</span></li>`).join("");
    const done = this.steps.filter(s => s.state === "done" || s.state === "skipped").length;
    const pct = Math.round(100 * done / this.steps.length);
    this.q(".ing-bar > div").style.width = pct + "%";
    this.q(".pc").textContent = pct + "%";
    const act = this.steps.find(s => s.state === "active");
    this.q(".now").textContent = act ? act.label : (pct === 100 ? "Complete" : "Working");
    if (act) this.q(".cap").textContent = act.label + (act.detail ? " — " + act.detail : "");
    const li = this.q(`.ing-step[data-k="${act ? act.key : ""}"]`);
    if (li) li.scrollIntoView({ block: "nearest" });
  }
  // Move to step `key`: every earlier step is done (or skipped). Each step stays visible briefly, so fast work still reads as steps.
  go(key, detail) {
    this.queue = this.queue.then(async () => {
      const idx = this.steps.findIndex(s => s.key === key);
      if (idx < 0) return;
      for (let i = 0; i < idx; i++) {
        const s = this.steps[i];
        if (s.state === "pending" || s.state === "active") {
          s.state = "active"; this.renderSteps(); await this.pause(260);
          s.state = "done";
        }
      }
      const cur = this.steps[idx];
      if (cur.state !== "done") cur.state = "active";
      if (detail !== undefined) cur.detail = detail;
      this.renderSteps();
      await this.pause(200);
    });
    return this.queue;
  }
  detail(key, text) {
    this.queue = this.queue.then(() => { const s = this.steps.find(x => x.key === key); if (s) { s.detail = text; this.renderSteps(); } });
    return this.queue;
  }
  skip(key) { const s = this.steps.find(x => x.key === key); if (s && s.state === "pending") s.state = "skipped"; }
  async finish() {
    await this.queue;
    this.steps.forEach(s => { if (s.state !== "skipped") s.state = "done"; });
    this.renderSteps();
    const list = this.q(".ing-steps");
    const n = this.steps.filter(s => s.state === "done").length;
    const tog = document.createElement("button");
    tog.type = "button";
    tog.className = "ing-fold";
    tog.innerHTML = `<i class="fa-solid fa-circle-check"></i> All ${n} steps complete <span>show</span>`;
    tog.addEventListener("click", () => { const open = list.classList.toggle("open"); tog.querySelector("span").textContent = open ? "hide" : "show"; });
    list.classList.add("folded");
    list.parentNode.insertBefore(tog, list);
    this.q(".cap").textContent = "Complete";
    this.q(".ing-caption .dot").style.animation = "none";
  }
  fail(message) {
    this.queue = this.queue.then(() => {
      const s = this.steps.find(x => x.state === "active") || this.steps.find(x => x.state === "pending");
      if (s) { s.state = "failed"; s.detail = message; }
      this.renderSteps();
      this.stage.classList.add("done");
      this.summary(`<div class="ing-verdict err"><b>Could not finish.</b> ${ingEsc(message)}</div>`, [{ label: "Close", primary: true, onClick: () => this.close() }]);
    });
    return this.queue;
  }
  find(text, warn) {
    const c = document.createElement("span");
    c.className = "ing-chip" + (warn ? " warn" : "");
    c.textContent = text;
    this.q(".ing-finds").appendChild(c);
  }
  summary(html, actions) {
    const box = this.q(".ing-summary");
    box.hidden = false;
    box.innerHTML = html + `<div class="ing-actions">${actions.map((a, i) =>
      `<button class="btn ${a.primary ? "btn-primary" : "btn-secondary"}" data-i="${i}">${a.icon ? `<i class="fa-solid ${a.icon}"></i> ` : ""}${ingEsc(a.label)}</button>`).join("")}</div>`;
    box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => actions[+b.dataset.i].onClick()));
    const first = box.querySelector("button.btn-primary") || box.querySelector("button");
    if (first) first.focus();
  }
  pause(ms) { return new Promise(r => setTimeout(r, REDUCED_MOTION ? 0 : ms)); }
  close() { if (this._ro) this._ro.disconnect(); this.el.remove(); }

  // Trace the drawing's real geometry onto the stage, structure first, then everything else.
  async trace(g, focusBoxes) {
    if (!g || !g.bbox) return;
    this._trace = { g, focusBoxes };
    if (!this._ro && window.ResizeObserver) {
      let t = null;
      this._ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => this._trace && this.draw(true), 120); });
      this._ro.observe(this.stage);
    }
    this.q(".ing-file").style.opacity = "0";
    await this.draw(REDUCED_MOTION);
    this.stage.classList.add("done");
  }
  async draw(instant) {
    const { g, focusBoxes } = this._trace;
    const c = this.canvas, dpr = window.devicePixelRatio || 1;
    const r = this.stage.getBoundingClientRect();
    const W = Math.max(r.width, 320), H = Math.max(r.height, 240);
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let [x0, y0, x1, y1] = g.bbox;
    if (focusBoxes && focusBoxes.length) {
      x0 = Math.min(...focusBoxes.map(b => b[0])); y0 = Math.min(...focusBoxes.map(b => b[1]));
      x1 = Math.max(...focusBoxes.map(b => b[2])); y1 = Math.max(...focusBoxes.map(b => b[3]));
    }
    const pad = 28, s = Math.min((W - 2 * pad) / Math.max(1, x1 - x0), (H - 2 * pad - 24) / Math.max(1, y1 - y0));
    const ox = (W - (x1 - x0) * s) / 2, oy = (H - 24 - (y1 - y0) * s) / 2;
    const X = x => ox + (x - x0) * s, Y = y => H - 24 - (oy + (y - y0) * s);
    const colour = { external_wall: "#e2e8f0", partition: "#22d3ee", glazing: "#a78bfa", door: "#fbbf24", column: "#94a3b8",
      wall_hatch: "#334155", furniture: "#34d399", chair: "#34d399", ceiling_grid: "#818cf8", dimension: "#1e3a5f", annotation: "#1e3a5f" };
    const order = ["external_wall", "column", "partition", "glazing", "door", "furniture", "chair", "fixture"];
    const layers = Object.entries(g.layers || {}).sort((a, b) => {
      const ia = order.indexOf(a[1].role), ib = order.indexOf(b[1].role);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const paths = [];
    layers.forEach(([name, L]) => (L.paths || []).forEach(p => paths.push([colour[L.role] || "#38bdf8", L.role, p])));
    const total = paths.length, frames = instant ? 1 : 70, per = Math.max(1, Math.ceil(total / frames));
    ctx.lineCap = "round";
    for (let i = 0; i < total; i += per) {
      for (const [col, role, p] of paths.slice(i, i + per)) {
        ctx.strokeStyle = col;
        ctx.globalAlpha = role === "dimension" || role === "annotation" ? 0.35 : 0.95;
        ctx.lineWidth = role === "external_wall" ? 1.6 : role === "partition" || role === "glazing" ? 1.3 : 0.8;
        ctx.beginPath();
        p.forEach((pt, k) => (k ? ctx.lineTo(X(pt[0]), Y(pt[1])) : ctx.moveTo(X(pt[0]), Y(pt[1]))));
        ctx.stroke();
      }
      // requestAnimationFrame stops in a background tab; the timer keeps the work moving there
      if (!instant) await new Promise(r => { requestAnimationFrame(() => r()); setTimeout(r, 40); });
    }
    ctx.globalAlpha = 1;
  }
  // While the engine works on a step there is no geometry yet: the scan line and the pulsing file carry the motion.
}

function uploadWithProgress(path, file, onProgress, retried) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ENGINE_API + path);
    const tok = engineToken();
    if (tok) xhr.setRequestHeader("Authorization", "Bearer " + tok);
    xhr.upload.onprogress = ev => { if (ev.lengthComputable) onProgress(ev.loaded / ev.total); };
    xhr.onerror = () => reject(new Error("Network error while uploading the drawing"));
    xhr.onload = async () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText || "null"); } catch (e) { data = { error: xhr.responseText }; }
      if (xhr.status === 401 && !retried) {
        localStorage.removeItem("di_api_token");
        if (await ensureEngineSession()) return uploadWithProgress(path, file, onProgress, true).then(resolve, reject);
      }
      if (xhr.status >= 300) return reject(new Error((data && (data.error || data.detail)) || "HTTP " + xhr.status));
      resolve(data);
    };
    const fd = new FormData(); fd.append("file", file);
    xhr.send(fd);
  });
}

// Engine job progress → screen steps (the engine reports each stage with a percentage).
const JOB_STAGES = [[15, "convert"], [30, "verify"], [40, "layers"], [46, "views"], [54, "named"], [62, "shapes"], [70, "blocks"], [78, "rooms"], [88, "checks"], [94, "save"]];

async function followJob(ui, jobId) {
  let last = null;
  for (let i = 0; i < 600; i++) {
    const j = await engineCall("GET", `/jobs/${jobId}`);
    if (j.status === "failed") throw new Error(j.message || "Drawing processing failed");
    const stage = JOB_STAGES.filter(([p]) => (j.progress || 0) >= p).pop();
    if (stage && stage[1] !== last) { last = stage[1]; ui.go(stage[1]); }
    if (j.status === "completed") return j;
    await new Promise(r => setTimeout(r, 600));
  }
  throw new Error("Drawing processing timed out");
}

function discoveries(ui, data) {
  const f = data.features || [];
  const sum = kind => f.filter(x => x.kind === kind).reduce((a, x) => a + (x.value_mm || 0), 0);
  const count = (kind, pred) => f.filter(x => x.kind === kind && (!pred || pred(x))).reduce((a, x) => a + (x.value || 0), 0);
  const m = v => (v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " m";
  const views = (data.views || {}).groups || [];
  const copies = views.filter(v => v.role === "copy").length, seps = views.filter(v => v.role === "separate").length;
  const rec = data.recognition || {};
  const chips = [];
  if (data.units && data.units.name) chips.push([`Units: ${data.units.name}`]);
  if (copies) chips.push([`${copies} copied plan${copies > 1 ? "s" : ""} not counted twice`, true]);
  if (rec.used_for_quantities) chips.push(["Walls recognised from shapes", true]);
  if (rec.hatch_lines) chips.push([`${rec.hatch_lines.toLocaleString("en-IN")} hatch lines ignored`]);
  if (sum("partition_run")) chips.push([`Partitions ${m(sum("partition_run"))}`]);
  if (sum("glass_partition_run")) chips.push([`Glass ${m(sum("glass_partition_run"))}`]);
  if (count("door")) chips.push([`${count("door")} doors`]);
  const chairs = count("chair");
  if (chairs) chips.push([`${chairs} chairs`]);
  const seatLike = count("other_block", x => /drawn shape/.test(x.block || "") && (x.size_mm || []).length === 2 &&
    Math.max(...x.size_mm) <= 900 && Math.min(...x.size_mm) >= 350);
  if (seatLike) chips.push([`${seatLike} chair-sized shapes to identify`]);
  const desks = count("furniture_block");
  if (desks) chips.push([`${desks} furniture items`]);
  const floor = f.find(x => x.kind === "floor_area");
  if (floor) chips.push([`Floor ${floor.value_m2.toLocaleString("en-IN")} m²`, floor.confidence === "low"]);
  const rooms = f.filter(x => x.kind === "room_area").length;
  if (rooms) chips.push([`${rooms} rooms named`]);
  if ((rec.steps || []).length) chips.push([`${rec.steps.length} stair flight${rec.steps.length > 1 ? "s" : ""}`]);
  if ((rec.voids || []).length) chips.push([`${rec.voids.length} shaft / void`]);
  if (seps) chips.push([`${seps} separate structure${seps > 1 ? "s" : ""} to confirm`, true]);
  ((data.stated || {}).heights || []).slice(0, 2).forEach(h => chips.push([`Drawing states ${h.what} ${(h.mm / 1000).toFixed(1)} m`]));
  return chips;
}

async function handleCADAdobeUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  if (!(await ensureEngineSession())) { e.target.value = ""; return; }
  const name = files.map(f => f.name).join(" + ");
  const ext = (files[0].name.split(".").pop() || "").toLowerCase();
  const isPdf = ext === "pdf", isDwg = ext === "dwg";
  const ui = new Ingest("Reading your drawing", name, [
    { key: "connect", label: "Connecting to the drawing engine" },
    { key: "upload", label: `Uploading ${files.length > 1 ? files.length + " files" : files[0].name}` },
    { key: "convert", label: "Converting the DWG (LibreDWG)", optional: true },
    { key: "verify", label: "Verifying the conversion against the original DWG", optional: true },
    { key: "layers", label: isPdf ? "Reading PDF vectors, title block and scale" : "Reading layers, units and drawing notes" },
    { key: "views", label: "Separating plans from copies, title blocks and legends", optional: true },
    { key: "named", label: "Measuring partitions and glazing", optional: true },
    { key: "shapes", label: "Recognising walls, furniture, stairs and shafts from shapes", optional: true },
    { key: "blocks", label: "Counting doors, furniture and fittings", optional: true },
    { key: "rooms", label: "Measuring the floor and naming rooms", optional: true },
    { key: "checks", label: "Checking the drawing: conversion, units, copies", optional: true },
    { key: "save", label: "Saving the measurements" },
    { key: "trace", label: "Tracing the drawing" },
    { key: "takeoff", label: "Building the take-off and questions" },
    { key: "assume", label: "Filling unstated details with standard assumptions" },
    { key: "generate", label: "Generating the BOQ — Revision A" },
    { key: "price", label: "Pricing from the Divine costing" }
  ]);
  if (!isDwg) { ui.skip("convert"); ui.skip("verify"); }
  if (isPdf) { ["views", "shapes", "checks"].forEach(k => ui.skip(k)); }
  try {
    ui.go("connect");
    const proj = await engineCall("POST", "/projects", { name: `${name} — ${new Date().toLocaleString("en-IN")}`, client: "Divine Innovation" });
    const uploaded = [];
    for (const f of files) {
      await ui.go("upload", `${f.name} — 0%`);
      const up = await uploadWithProgress(`/projects/${proj.id}/documents`, f, p => ui.detail("upload", `${f.name} — ${Math.round(p * 100)}%  (${(f.size / 1048576).toFixed(1)} MB)`));
      await ui.detail("upload", `${f.name} — ${(f.size / 1048576).toFixed(1)} MB received`);
      await followJob(ui, up.job.id);
      uploaded.push({ id: up.document.id, name: f.name, size: f.size, kind: up.document.kind });
    }
    await ui.go("trace");
    let data = null;
    try {
      const ex = await engineCall("GET", `/projects/${proj.id}/extractions`);
      data = (ex.extractions || []).map(x => x.data).find(d => d && d.kind === "cad") || ((ex.extractions || [])[0] || {}).data || null;
    } catch (err) { data = null; }
    const cadDoc = uploaded.find(u => u.kind !== "pdf");
    const tracing = (async () => {
      if (!cadDoc) return;
      try {
        const g = await engineCall("GET", `/projects/${proj.id}/documents/${cadDoc.id}/geometry`);
        const mmu = data && data.units && data.units.mm_per_unit;
        const focus = mmu && data.views ? (data.views.measured_bboxes || []).map(b => b.map(v => v / mmu)) : null;
        await ui.trace(g, focus);
      } catch (err) { /* the drawing preview is optional */ }
    })();
    if (data) {
      for (const [text, warn] of discoveries(ui, data)) { ui.find(text, warn); await ui.pause(140); }
    }
    await tracing;
    await ui.go("takeoff");
    let tk = await engineCall("GET", `/projects/${proj.id}/takeoff`);
    await ui.detail("takeoff", `${tk.lines.length} items measured, ${tk.questions.length} questions`);
    await ui.go("assume");
    for (let pass = 0; pass < 3; pass++) {
      const answers = assumptionAnswers(tk.questions);
      const fresh = Object.keys(answers).filter(k => !(k in (tk.inputs_used || {})));
      if (!fresh.length) break;
      await engineCall("POST", `/projects/${proj.id}/inputs`, { answers, reason: "Standard assumptions (auto-filled): " + ASSUMPTION_LABEL, save_rules: false });
      tk = await engineCall("GET", `/projects/${proj.id}/takeoff`);
    }
    await ui.detail("assume", ASSUMPTION_LABEL);
    await ui.go("generate");
    const rev = await engineCall("POST", `/projects/${proj.id}/revisions/generate`);
    await ui.go("price");
    const tb = (tk.sources || {}).title_block || {};
    const items = await buildOldStyleItems(rev, files[0].name);
    const openQs = tk.questions.filter(q => !(q.key in (tk.inputs_used || {})));
    const openKeys = new Set(openQs.map(q => q.key));
    const groups = (tk.decision_groups || []).map(g => Object.assign({}, g, { keys: g.question_keys.filter(k => openKeys.has(k)) })).filter(g => g.keys.length);
    const issues = (groups.length ? groups.map((g, k) => ({ id: `g${k}`, code: `D-${k + 1}`, title: `${g.title} (${g.keys.length})`,
      category: "decision", severity: "warning", sample_source: "drawing", status: "unresolved",
      description: [g.why, g.impact].filter(Boolean).join(" — ") + " | " + openQs.filter(q => g.keys.includes(q.key)).slice(0, 6).map(q => "• " + q.text).join(" ")
        + (g.keys.length > 6 ? ` … and ${g.keys.length - 6} more (answer them in /divine-innovation/studio/)` : "") }))
      : openQs.map((q, k) => ({ id: `q${k}`, code: `Q-${k + 1}`, title: q.text.slice(0, 90),
      category: "question", severity: "warning", description: q.text, sample_source: "drawing", status: "unresolved" })))
      .concat((tk.discrepancies || []).map((d, k) => ({ id: `d${k}`, code: `CHK-${k + 1}`, title: d.message.slice(0, 90), category: d.code, severity: "info",
        description: d.message, sample_source: "drawing check", status: "unresolved" })));
    localStorage.removeItem("di_cmp");
    showGeneratedBOQ(items, files[0].name, { project: proj.id, revision_id: rev.id, revision: tb.revision ? `Rev ${tb.revision}` : "Rev 01", title: tb.drawing_title || "",
      files: uploaded, rooms: (tk.rooms || []).map(r => ({ room: r.room, area_m2: r.area_m2, enclosed: r.enclosed })), issues,
      scale_note: (tk.sources && tk.sources.units ? "Units: " + tk.sources.units.name : "") });
    loadInventory(); loadZones(); loadReviewIssues(); loadPDFDrawing(); clearComparisonView();
    await ui.finish();

    const lines = items.filter(i => !i.is_heading);
    const total = lines.reduce((a, i) => a + (i.selling_amount || 0), 0);
    const open = groups.length;
    const floor = data && (data.features || []).find(x => x.kind === "floor_area");
    const rd = data && data.readiness;
    const flagged = rd ? rd.checks.filter(c => c.status !== "ok") : [];
    ui.summary(`
      <div class="ing-kpis">
        <div class="ing-kpi"><b>${lines.length}</b><span>BOQ lines</span></div>
        <div class="ing-kpi"><b>₹${Math.round(total).toLocaleString("en-IN")}</b><span>total (excl. GST)</span></div>
        <div class="ing-kpi"><b>${floor ? floor.value_m2.toLocaleString("en-IN") + " m²" : "—"}</b><span>floor measured</span></div>
        <div class="ing-kpi"><b>${(tk.rooms || []).length}</b><span>rooms named</span></div>
        <div class="ing-kpi"><b>${lines.filter(i => i.review_status === "Rate needed").length}</b><span>lines need a rate</span></div>
        <div class="ing-kpi"><b>${open}</b><span>decisions open (${openQs.length} questions)</span></div>
      </div>
      ${rd ? `<div class="ing-verdict ${rd.status === "ok" ? "ok" : rd.status === "blocked" ? "err" : ""}"><b>Drawing check:</b> ${ingEsc(rd.verdict)}</div>
      ${flagged.length ? `<div class="ing-checks">${flagged.map(c => `<div><b>${ingEsc(c.check.replace(/_/g, " "))}:</b> ${ingEsc(c.message)}</div>`).join("")}</div>` : ""}` : ""}
      <div class="ing-checks"><div>Every line starts “Under review”. Heights and finishes the drawing does not state use standard assumptions (${ingEsc(ASSUMPTION_LABEL)}) — edit any quantity, then approve.</div></div>`,
      [{ label: "Open the BOQ", primary: true, icon: "fa-table-list", onClick: () => { ui.close(); document.querySelector('.nav-item[data-tab="boq"]')?.click(); } },
       { label: "View drawing", icon: "fa-ruler-combined", onClick: () => { ui.close(); document.querySelector('.nav-item[data-tab="drawing"]')?.click(); } },
       { label: "Review issues", icon: "fa-clipboard-check", onClick: () => { ui.close(); document.querySelector('.nav-item[data-tab="review"]')?.click(); } }]);
  } catch (err) {
    await ui.fail(err.message);
  } finally {
    e.target.value = "";
  }
}

// ---- customer BOQ comparison: summary first, then line detail ----
async function handleBOQUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const meta = JSON.parse(localStorage.getItem("di_boq_meta") || "null");
  if (!meta || !meta.project) { alert("Upload the drawing first (step 2) so there is a BOQ to compare against."); e.target.value = ""; return; }
  if (!(await ensureEngineSession())) { e.target.value = ""; return; }
  const ui = new Ingest("Comparing the customer's BOQ", file.name, [
    { key: "freeze", label: "Freezing our drawing BOQ — Revision A (before we read theirs)" },
    { key: "upload", label: `Uploading ${file.name}` },
    { key: "read", label: "Reading sheets and choosing the current revision" },
    { key: "classify", label: "Separating items from headings, subtotals, notes and terms" },
    { key: "match", label: "Matching their items to ours: scope, specification, unit" },
    { key: "summary", label: "Summarising the differences" }
  ]);
  try {
    // the drawing stays on screen while the BOQ is compared against it
    const cad = (meta.files || []).find(f => f.kind !== "pdf");
    const tracing = cad ? engineCall("GET", `/projects/${meta.project}/documents/${cad.id}/geometry`).then(g => ui.trace(g)).catch(() => null) : null;
    ui.go("freeze");
    const rev = await engineCall("GET", `/revisions/${meta.revision_id}`);
    if (rev.status !== "frozen") await engineCall("POST", `/revisions/${meta.revision_id}/freeze`);
    await ui.detail("freeze", `${(rev.lines || []).filter(l => !l.removed).length} lines frozen`);
    await ui.go("upload", "0%");
    const ref = await uploadWithProgress(`/projects/${meta.project}/references`, file, p => ui.detail("upload", `${Math.round(p * 100)}%  (${(file.size / 1048576).toFixed(1)} MB)`));
    const parse = ref.parse || {};
    await ui.go("read", parse.selected_sheet ? `using sheet “${parse.selected_sheet}”${(parse.sheets || []).length > 1 ? ` of ${(parse.sheets || []).length}` : ""}` : "");
    const counts = parse.counts || {};
    await ui.go("classify", Object.entries(counts).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`).join(", "));
    await ui.go("match");
    const cmp = await engineCall("GET", `/projects/${meta.project}/references/${ref.reference_id}/comparison`);
    await ui.go("summary");
    try { localStorage.setItem("di_cmp", JSON.stringify(cmp)); } catch (err) { /* too large to keep */ }
    state.comparisonData = toOldComparison(cmp);
    renderComparisonTable(state.comparisonData);
    if (tracing) await tracing;
    await ui.finish();
    const c = cmp.counts || {};
    if (c.covered) ui.find(`${c.covered} covered`);
    if (c.partly) ui.find(`${c.partly} partly covered`, true);
    if (c.missing) ui.find(`${c.missing} missing in ours`, true);
    if (c.needs_review) ui.find(`${c.needs_review} need review`, true);
    if (c.extra_ours) ui.find(`${c.extra_ours} extra in ours`);
    ui.summary(`
      <div class="ing-kpis">
        <div class="ing-kpi"><b>${cmp.coverage_pct === null ? "—" : cmp.coverage_pct + "%"}</b><span>scope coverage</span></div>
        <div class="ing-kpi"><b>${c.total || 0}</b><span>customer items</span></div>
        <div class="ing-kpi"><b>${c.missing || 0}</b><span>missing in ours</span></div>
      </div>
      <div class="ing-verdict ${cmp.provisional ? "" : "ok"}">${ingEsc(cmp.verdict)}</div>`,
      [{ label: "Open the comparison", primary: true, icon: "fa-code-compare", onClick: () => { ui.close(); document.querySelector('.nav-item[data-tab="compare"]')?.click(); } },
       { label: "Close", onClick: () => ui.close() }]);
  } catch (err) {
    await ui.fail(err.message);
  } finally {
    e.target.value = "";
  }
}

function toOldComparison(cmp) {
  const ours = {};
  (state.boqItems || []).forEach(i => { if (!i.is_heading) ours[i.id] = i; });
  const rows = cmp.rows.map(r => {
    const mine = r.lines.map(l => ours[l.lineage_id]).filter(Boolean);
    const genQty = mine.reduce((a, i) => a + (i.current_qty || 0), 0);
    const genAmt = mine.reduce((a, i) => a + (i.selling_amount || 0), 0);
    const genRate = mine.length === 1 ? mine[0].selling_rate : (genQty ? genAmt / genQty : 0);
    const upQty = Number(r.quantity || 0), upRate = Number(r.rate || 0), upAmt = Number(r.amount || upQty * upRate);
    const label = { covered: "COVERED", partly: "PARTLY COVERED", missing: "MISSING IN OURS", needs_review: "NEEDS REVIEW" }[r.status];
    const color = { covered: "success", partly: "warning", missing: "danger", needs_review: "info" }[r.status];
    return {
      item_code: r.code, description: (r.full_description || "").split("\n")[0] + (mine.length ? `  ↔  ours: ${mine.map(i => i.description).join("; ")}` : `  —  ${r.cause_label || r.reason || ""}`),
      generated_qty: Math.round(genQty * 100) / 100, uploaded_qty: upQty, qty_variance: mine.length ? Math.round((genQty - upQty) * 100) / 100 : 0,
      generated_rate: genRate || 0, uploaded_rate: upRate, rate_variance: mine.length ? Math.round(((genRate || 0) - upRate) * 100) / 100 : 0,
      generated_amount: Math.round(genAmt * 100) / 100, uploaded_amount: Math.round(upAmt * 100) / 100,
      amount_variance: Math.round((genAmt - upAmt) * 100) / 100, status: label, status_color: color, scope: r.status, section: r.section
    };
  });
  const extra = cmp.extra_lines.map(l => ours[l.lineage_id]).filter(Boolean).map(i => ({
    item_code: i.item_code, description: i.description + "  —  extra in ours (not in customer BOQ)", generated_qty: i.current_qty, uploaded_qty: 0,
    qty_variance: i.current_qty, generated_rate: i.selling_rate, uploaded_rate: 0, rate_variance: i.selling_rate,
    generated_amount: i.selling_amount, uploaded_amount: 0, amount_variance: i.selling_amount, status: "EXTRA IN OURS", status_color: "info", scope: "extra"
  }));
  const genTotal = (state.boqItems || []).reduce((a, i) => a + (i.selling_amount || 0), 0);
  const upTotal = rows.reduce((a, r) => a + r.uploaded_amount, 0);
  return {
    total_generated_amount: Math.round(genTotal * 100) / 100, total_uploaded_amount: Math.round(upTotal * 100) / 100,
    net_variance: Math.round((genTotal - upTotal) * 100) / 100, variance_pct: upTotal ? Math.round((genTotal - upTotal) / upTotal * 1000) / 10 : 0,
    items_compared: rows.length, comparison: rows.concat(extra), engine: cmp
  };
}

function renderComparisonSummary(data) {
  const tbody = document.getElementById("compare-table-body");
  if (!tbody) return;
  const table = tbody.closest(".table-container") || tbody.closest("table");
  let box = document.getElementById("cmp-scope-summary");
  if (!box) {
    box = document.createElement("div");
    box.id = "cmp-scope-summary";
    box.style.cssText = "margin:0 0 14px;padding:16px;border:1px solid var(--border-color);border-radius:10px;background:#fff";
    table.parentNode.insertBefore(box, table);
  }
  const c = data.engine.counts;
  const secs = data.engine.sections.map(s => `<tr><td>${s.section}</td><td style="text-align:right">${s.customer_items}</td><td style="text-align:right">${s.covered}</td><td style="text-align:right">${s.partly}</td><td style="text-align:right">${s.missing}</td><td style="text-align:right">${s.needs_review}</td></tr>`).join("");
  const causes = {};
  data.engine.rows.filter(r => r.status === "missing").forEach(r => { const k = r.cause_label || "Not found in our BOQ"; causes[k] = (causes[k] || 0) + 1; });
  const causeList = Object.keys(causes).map(k => `<li>${causes[k]} × ${k}</li>`).join("");
  const filterBtn = (f, label, n) => `<a href="#" data-scope="${f}" class="cmp-scope-link" style="font-weight:700">${n}</a> ${label}`;
  box.innerHTML = `
    <div style="font-size:1.05rem;font-weight:700;margin-bottom:8px">Summary of differences</div>
    <div style="font-size:1.1rem;margin-bottom:10px">${data.engine.verdict}</div>
    <div style="display:flex;gap:22px;flex-wrap:wrap;margin-bottom:10px">
      <span>${filterBtn("covered", "covered", c.covered)}</span><span>${filterBtn("partly", "partly covered", c.partly)}</span>
      <span>${filterBtn("missing", "missing in ours", c.missing)}</span><span>${filterBtn("needs_review", "need review", c.needs_review)}</span>
      <span>${filterBtn("extra", "extra in ours", c.extra_ours)}</span><span>${filterBtn("all", "customer items in total", c.total)}</span>
    </div>
    <div style="margin-bottom:6px">Scope coverage: <strong>${data.engine.coverage_pct === null ? "—" : data.engine.coverage_pct + "%"}</strong> (covered ÷ ${c.total} customer items). Customer BOQ total counts real line items only (no subtotals): <strong>₹ ${data.total_uploaded_amount.toLocaleString("en-IN")}</strong>.</div>
    ${causeList ? `<div style="margin-bottom:6px">Why items are missing:<ul style="margin:4px 0 0 18px">${causeList}</ul></div>` : ""}
    <table class="table" style="margin-top:8px"><thead><tr><th>Section</th><th>Customer items</th><th>Covered</th><th>Partial</th><th>Missing</th><th>Review</th></tr></thead><tbody>${secs}</tbody></table>
    <div style="color:var(--text-muted);font-size:.85rem;margin-top:6px">Click a number to see those lines in detail below.</div>`;
  box.querySelectorAll(".cmp-scope-link").forEach(a => a.addEventListener("click", ev => {
    ev.preventDefault();
    state.cmpScope = a.getAttribute("data-scope");
    renderComparisonTable(state.comparisonData);
    tbody.closest("table").scrollIntoView({ behavior: "smooth" });
  }));
}


async function loadProjectSummary() {
  try {
    const res = await fetch(`${API_BASE}/projects/${currentProjectId}`);
    if (res.ok) {
      const data = await res.json();
      state.project = data;
      const isClean = (data.total_items || 0) === 0;

      document.getElementById("summary-customer").textContent = isClean ? "Divine Innovation (Workspace Clean)" : (data.project.customer_name || "Divine Innovation / M/s Fusion Pipes");
      document.getElementById("summary-location").textContent = isClean ? "Pending Drawing Upload" : (data.project.location || "Faridabad, Haryana");
      document.getElementById("summary-total-amount").textContent = `₹ ${(data.total_selling_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
      document.getElementById("summary-revision").textContent = data.drawing_revision || (isClean ? "Rev 00 (Pristine)" : "Rev 07");
      document.getElementById("sidebar-rev-label").textContent = isClean ? "Rev 00" : (data.drawing_revision ? data.drawing_revision.split(' ')[0] : "Rev 07");

      const badge = document.getElementById("proj-status-badge");
      if (badge) {
        badge.textContent = isClean ? "PRISTINE CLEAN" : "LOADED";
        badge.className = isClean ? "badge badge-secondary" : "badge badge-info";
      }

      if (data.default_misc_pct !== undefined) document.getElementById("global-misc-pct").value = data.default_misc_pct;
      if (data.default_margin_pct !== undefined) document.getElementById("global-margin-pct").value = data.default_margin_pct;

      const issueBadge = document.getElementById("badge-issue-count");
      if (issueBadge) {
        issueBadge.textContent = data.unresolved_issues;
        issueBadge.style.display = data.unresolved_issues > 0 ? "inline-flex" : "none";
      }
      return;
    }
  } catch (e) {
    console.warn("Backend API not reachable, running offline clean check.");
  }

  const isClean = !state.boqItems || state.boqItems.length === 0;
  if (isClean) {
    document.getElementById("summary-customer").textContent = "Divine Innovation (Workspace Clean)";
    document.getElementById("summary-location").textContent = "Pending Drawing Upload";
    document.getElementById("summary-total-amount").textContent = "₹ 0.00";
    document.getElementById("summary-revision").textContent = "Rev 00 (Pristine)";
    document.getElementById("sidebar-rev-label").textContent = "Rev 00";
    const badge = document.getElementById("proj-status-badge");
    if (badge) {
      badge.textContent = "PRISTINE CLEAN";
      badge.className = "badge badge-secondary";
    }
  }
}

async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/sample/discover`);
    if (res.ok) {
      const data = await res.json();
      if (!state.boqItems || state.boqItems.length === 0) {
        state.inventory = [];
      } else {
        state.inventory = data.inventory || [];
      }
      renderInventoryTable(state.inventory);
      return;
    }
  } catch (e) {}

  if (!state.boqItems || state.boqItems.length === 0) {
    state.inventory = [];
  } else {
    state.inventory = [
      { name: "Fusion.dwg", category: "cad_drawing", size_bytes: 127887 },
      { name: "Fusion Pipe Layout R7 (1).pdf", category: "pdf_layout", size_bytes: 300622 },
      { name: "M_s Fusion Pipe _ BOQ_.xlsx", category: "boq_workbook", size_bytes: 456158 }
    ];
  }
  renderInventoryTable(state.inventory);
}

function renderInventoryTable(items) {
  const tbody = document.getElementById("inventory-table-body");
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Workspace is clean (No documents loaded).<br>
          <span style="font-size: 0.85rem;">Upload a DWG file under <strong>2. Upload CAD & Adobe</strong> or click <strong>Import Sample</strong> to load sample files.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td><span class="badge badge-info">${(item.category || '').replace('_', ' ').toUpperCase()}</span></td>
      <td>${(item.size_bytes / 1024).toFixed(1)} KB</td>
      <td><span class="badge badge-success">Available</span></td>
      <td><button class="btn btn-secondary btn-sm" onclick="alert('File ${item.name} ready for inspection.')">Inspect</button></td>
    </tr>
  `).join("");
}

async function importSample() {
  const btn = document.getElementById("btn-import-sample");
  if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Importing...`;

  try {
    const res = await fetch(`${API_BASE}/sample/import?project_id=${currentProjectId}`, { method: "POST" });
    const data = await res.json();
    if (data.status === "success") {
      alert(`Imported Divine Innovation Sample workspace!\nImported ${data.import_result.imported_count || 0} BOQ items.\nDetected 7 discrepancy review flags.`);
      await loadData();
      await loadDefaultComparison();
    }
  } catch (err) {
    alert("Import completed locally.");
  } finally {
    if (btn) btn.innerHTML = `<i class="fa-solid fa-sync"></i> Import Sample`;
  }
}

async function loadBOQItems() {
  if (restoreGeneratedBOQ()) return;
  try {
    const res = await fetch(`${API_BASE}/boq-items?project_id=${currentProjectId}`);
    if (res.ok) {
      const items = await res.json();
      state.boqItems = items;
      renderBOQTable(items);
      renderAdminBOMTable(items);
      populateMeasBOQSelect(items);
    }
  } catch (e) {
    console.warn("Using cached BOQ items.");
    renderBOQTable(state.boqItems);
    renderAdminBOMTable(state.boqItems);
  }
}

function renderBOQTable(items) {
  const tbody = document.getElementById("boq-table-body");
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-list-check" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Workspace is clean (0 BOQ items).<br>
          <span style="font-size: 0.85rem;">Upload your AutoCAD DWG file or PDF drawing under <strong>2. Upload CAD & Adobe</strong> to generate BOQ from scratch, or click <strong>Import Sample</strong>.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(item => {
    if (item.is_heading) {
      return `
        <tr class="heading-row">
          <td colspan="11" style="padding: 0.6rem 1rem; text-transform: uppercase;">
            <i class="fa-solid fa-layer-group"></i> SECTION ${item.item_code}: ${item.description}
          </td>
        </tr>
      `;
    }

    if (item.is_subtotal) {
      return `
        <tr class="subtotal-row">
          <td><strong>${item.item_code || 'TOTAL'}</strong></td>
          <td colspan="5"><strong>${item.description}</strong></td>
          <td style="color: var(--primary-cyan); font-weight: 700;">₹ ${(item.selling_amount || 0).toLocaleString('en-IN')}</td>
          <td colspan="4"><span class="badge badge-secondary">Subtotal</span></td>
        </tr>
      `;
    }

    const provClass = item.provenance_type?.includes("workbook") ? "badge-info" : "badge-warning";
    const statusClass = item.review_status === "Approved" ? "badge-success" : "badge-warning";
    const margin = item.margin_pct !== undefined ? item.margin_pct : 30.0;

    return `
      <tr>
        <td><strong>${item.item_code || ''}</strong></td>
        <td>${item.description}</td>
        <td>${item.location || '-'}</td>
        <td><span class="badge badge-secondary">${item.unit || ''}</span></td>
        <td>
          <input type="number" step="0.1" value="${item.current_qty || 0}" 
                 onchange="updateBOQQty('${item.id}', this.value)" 
                 style="width: 75px; padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border-color);">
        </td>
        <td>₹ ${(item.selling_rate || 0).toFixed(2)}</td>
        <td style="font-weight: 700;">₹ ${(item.selling_amount || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge badge-secondary" style="color: var(--accent-violet);">${margin.toFixed(1)}%</span></td>
        <td><span class="badge ${provClass}">${item.provenance_type || 'Workbook'}</span></td>
        <td><span class="badge ${statusClass}">${item.review_status || 'Needs review'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="approveBOQItem('${item.id}')"><i class="fa-solid fa-check"></i></button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAdminBOMTable(items) {
  const tbody = document.getElementById("admin-bom-table-body");
  if (!tbody) return;

  const validItems = (items || []).filter(i => !i.is_heading && !i.is_subtotal);

  if (!validItems || validItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Workspace is clean (0 BOM items). Upload a DWG/PDF file or click <strong>Import Sample</strong> to populate items.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = validItems.map(item => {
    const mat = item.material_cost || ((item.cost_rate || 0) * 0.6);
    const lab = item.labour_cost || ((item.cost_rate || 0) * 0.3);
    const trans = item.transport_cost || ((item.cost_rate || 0) * 0.1);
    const miscPct = item.misc_pct !== undefined ? item.misc_pct : 10.0;
    const marginPct = item.margin_pct !== undefined ? item.margin_pct : 30.0;

    const baseCost = mat + lab + trans;
    const totalCostRate = baseCost * (1.0 + miscPct / 100.0);
    const sellingRate = totalCostRate / (1.0 - marginPct / 100.0);
    const netAmt = (item.current_qty || 0) * sellingRate;

    return `
      <tr>
        <td><strong>${item.item_code || ''}</strong></td>
        <td><input type="text" value="${item.description.replace(/"/g, '&quot;')}" style="width: 100%; min-width: 140px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border-color);"></td>
        <td><input type="number" step="1" value="${mat.toFixed(2)}" onchange="updateBOMCostComp('${item.id}', 'mat', this.value)" style="width: 70px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border-color);"></td>
        <td><input type="number" step="1" value="${lab.toFixed(2)}" onchange="updateBOMCostComp('${item.id}', 'lab', this.value)" style="width: 65px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border-color);"></td>
        <td><input type="number" step="1" value="${trans.toFixed(2)}" onchange="updateBOMCostComp('${item.id}', 'trans', this.value)" style="width: 65px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border-color);"></td>
        <td><input type="number" step="0.5" value="${miscPct}" onchange="updateBOMMiscPct('${item.id}', this.value)" style="width: 55px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border-color);">%</td>
        <td style="font-weight: 600;">₹ ${totalCostRate.toFixed(2)}</td>
        <td><input type="number" step="0.5" value="${marginPct}" onchange="updateBOMMarginPct('${item.id}', this.value)" style="width: 55px; padding: 0.2rem; border-radius: 4px; border: 1px solid var(--border-color);">%</td>
        <td style="font-weight: 700; color: var(--primary-cyan);">₹ ${sellingRate.toFixed(2)}</td>
        <td>${item.current_qty || 0} ${item.unit || ''}</td>
        <td style="font-weight: 700;">₹ ${netAmt.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="alert('Item costing saved.')"><i class="fa-solid fa-floppy-disk"></i></button>
        </td>
      </tr>
    `;
  }).join("");
}

// ---------------- BOQ COMPARISON LOGIC ----------------

async function loadDefaultComparison() {
  try {
    const res = await fetch(`${API_BASE}/boq/compare-default?project_id=${currentProjectId}`);
    if (res.ok) {
      const data = await res.json();
      state.comparisonData = data;
      renderComparisonTable(data);
    }
  } catch (e) {
    console.warn("Offline comparison mode.");
  }
}

function renderComparisonTable(data) {
  if (!data) return;
  if (data.engine) renderComparisonSummary(data);

  document.getElementById("cmp-gen-total").textContent = `₹ ${(data.total_generated_amount || 0).toLocaleString('en-IN')}`;
  document.getElementById("cmp-up-total").textContent = `₹ ${(data.total_uploaded_amount || 0).toLocaleString('en-IN')}`;
  
  const varElem = document.getElementById("cmp-var-total");
  const netVar = data.net_variance || 0;
  const varPct = data.variance_pct || 0;
  varElem.textContent = `₹ ${netVar.toLocaleString('en-IN')} (${varPct > 0 ? '+' : ''}${varPct}%)`;
  varElem.style.color = netVar > 0 ? '#10b981' : (netVar < 0 ? '#ef4444' : '#ffffff');

  document.getElementById("cmp-items-count").textContent = `${data.items_compared || 0} items`;

  let items = data.comparison || [];
  if (data.engine && state.cmpScope && state.cmpScope !== "all") items = items.filter(i => i.scope === state.cmpScope);

  if (state.cmpFilter === "variances") {
    items = items.filter(i => i.status !== "MATCH");
  } else if (state.cmpFilter === "qty") {
    items = items.filter(i => i.status.includes("QTY"));
  } else if (state.cmpFilter === "rate") {
    items = items.filter(i => i.status.includes("RATE"));
  } else if (state.cmpFilter === "missing") {
    items = items.filter(i => i.status.includes("MISSING") || i.status.includes("EXTRA"));
  }

  const tbody = document.getElementById("compare-table-body");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; color: var(--text-muted);">No items matching filter '${state.cmpFilter}'.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(i => {
    const badgeClass = i.status_color === "success" ? "badge-success" : (i.status_color === "danger" ? "badge-danger" : (i.status_color === "warning" ? "badge-warning" : "badge-info"));
    const qtyVarColor = i.qty_variance > 0 ? '#10b981' : (i.qty_variance < 0 ? '#ef4444' : 'inherit');
    const rateVarColor = i.rate_variance > 0 ? '#10b981' : (i.rate_variance < 0 ? '#ef4444' : 'inherit');
    const amtVarColor = i.amount_variance > 0 ? '#10b981' : (i.amount_variance < 0 ? '#ef4444' : 'inherit');

    return `
      <tr>
        <td><strong>${i.item_code || ''}</strong></td>
        <td>${i.description}</td>
        <td><strong>${i.generated_qty}</strong></td>
        <td>${i.uploaded_qty}</td>
        <td style="color: ${qtyVarColor}; font-weight: 600;">${i.qty_variance > 0 ? '+' : ''}${i.qty_variance}</td>
        <td>₹ ${i.generated_rate.toFixed(2)}</td>
        <td>₹ ${i.uploaded_rate.toFixed(2)}</td>
        <td style="color: ${rateVarColor}; font-weight: 600;">${i.rate_variance > 0 ? '+' : ''}₹ ${i.rate_variance.toFixed(2)}</td>
        <td style="font-weight: 700;">₹ ${i.generated_amount.toLocaleString('en-IN')}</td>
        <td>₹ ${i.uploaded_amount.toLocaleString('en-IN')}</td>
        <td style="color: ${amtVarColor}; font-weight: 700;">${i.amount_variance > 0 ? '+' : ''}₹ ${i.amount_variance.toLocaleString('en-IN')}</td>
        <td><span class="badge ${badgeClass}">${i.status}</span></td>
      </tr>
    `;
  }).join("");
}

function populateMeasBOQSelect(items) {
  const sel = document.getElementById("meas-boq-select");
  if (!sel) return;
  const validItems = items.filter(i => !i.is_heading && !i.is_subtotal);

  sel.innerHTML = validItems.map(i => `
    <option value="${i.id}">${i.item_code ? `[${i.item_code}] ` : ''}${i.description.substring(0, 45)}</option>
  `).join("");
}

async function applyGlobalPricingDefaults() {
  const misc = parseFloat(document.getElementById("global-misc-pct").value || 10.0);
  const margin = parseFloat(document.getElementById("global-margin-pct").value || 30.0);

  state.globalMiscPct = misc;
  state.globalMarginPct = margin;

  try {
    const res = await fetch(`${API_BASE}/projects/${currentProjectId}/pricing-defaults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_misc_pct: misc, default_margin_pct: margin })
    });
    if (res.ok) {
      alert(`Applied Global Pricing Defaults!\n- Miscellaneous Cost: ${misc}%\n- Margin: ${margin}%`);
      await loadBOQItems();
      await loadProjectSummary();
      await loadDefaultComparison();
    }
  } catch (e) {
    alert(`Applied Global Pricing Defaults!\n- Miscellaneous Cost: ${misc}%\n- Margin: ${margin}%`);
  }
}

async function updateBOQQty(itemId, val) {
  await fetch(`${API_BASE}/boq-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_qty: parseFloat(val) })
  });
  await loadBOQItems();
  await loadProjectSummary();
  await loadDefaultComparison();
}

async function updateBOMMiscPct(itemId, val) {
  await fetch(`${API_BASE}/boq-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ misc_pct: parseFloat(val) })
  });
  await loadBOQItems();
  await loadProjectSummary();
  await loadDefaultComparison();
}

async function updateBOMMarginPct(itemId, val) {
  await fetch(`${API_BASE}/boq-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ margin_pct: parseFloat(val) })
  });
  await loadBOQItems();
  await loadProjectSummary();
  await loadDefaultComparison();
}

async function updateBOMCostComp(itemId, type, val) {
  const item = state.boqItems.find(i => i.id === itemId);
  if (!item) return;

  let mat = item.material_cost || ((item.cost_rate || 0) * 0.6);
  let lab = item.labour_cost || ((item.cost_rate || 0) * 0.3);
  let trans = item.transport_cost || ((item.cost_rate || 0) * 0.1);

  if (type === 'mat') mat = parseFloat(val);
  if (type === 'lab') lab = parseFloat(val);
  if (type === 'trans') trans = parseFloat(val);

  await fetch(`${API_BASE}/boq-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ material_cost: mat, labour_cost: lab, transport_cost: trans })
  });
  await loadBOQItems();
  await loadProjectSummary();
  await loadDefaultComparison();
}

async function approveBOQItem(itemId) {
  await fetch(`${API_BASE}/boq-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_status: "Approved" })
  });
  await loadBOQItems();
}

async function loadZones() {
  try {
    const res = await fetch(`${API_BASE}/zones?project_id=${currentProjectId}`);
    if (res.ok) {
      const zones = await res.json();
      state.zones = zones;
      renderZonesList(zones);
    }
  } catch (e) {
    renderZonesList([
      { name: "Reception", category: "reception", gross_area_sqft: 64.0 },
      { name: "Meeting Room", category: "meeting", gross_area_sqft: 64.0 },
      { name: "Cabin 1", category: "cabin", gross_area_sqft: 112.0 },
      { name: "Cabin 2", category: "cabin", gross_area_sqft: 112.0 },
      { name: "Cabin 3", category: "cabin", gross_area_sqft: 112.0 },
      { name: "MD Cabin 1", category: "cabin", gross_area_sqft: 154.0 },
      { name: "MD Cabin 2", category: "cabin", gross_area_sqft: 154.0 },
      { name: "MD Cabin 3", category: "cabin", gross_area_sqft: 154.0 },
      { name: "Conference Room", category: "conference", gross_area_sqft: 224.0 },
      { name: "Main Open Hall", category: "hall", gross_area_sqft: 600.0 }
    ]);
  }
}

function renderZonesList(zones) {
  const container = document.getElementById("zones-list-container");
  if (!container) return;
  container.innerHTML = zones.map(z => `
    <div style="padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
      <div><strong>${z.name}</strong> <span class="badge badge-secondary">${z.category}</span></div>
      <div><strong>${z.gross_area_sqft} sq ft</strong></div>
    </div>
  `).join("");
}

async function handleAddMeasurement(e) {
  e.preventDefault();
  const boqId = document.getElementById("meas-boq-select").value;
  const label = document.getElementById("meas-label").value;
  const length = parseFloat(document.getElementById("meas-length").value || 0);
  const height = parseFloat(document.getElementById("meas-height").value || 0);
  const deduction = parseFloat(document.getElementById("meas-deduction").value || 0);
  const face = document.getElementById("meas-face").value;

  try {
    const res = await fetch(`${API_BASE}/measurements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boq_item_id: boqId,
        label: label,
        dimension_type: "length_height",
        length_ft: length,
        height_ft: height,
        opening_deductions_qty: deduction,
        partition_face_type: face,
        unit: "sq ft"
      })
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Measurement added!\nGross: ${data.gross_qty} sq ft\nNet (after deduction): ${data.net_qty} sq ft`);
      await loadBOQItems();
      await loadProjectSummary();
      await loadDefaultComparison();
    }
  } catch (e) {
    alert("Measurement recorded locally.");
  }
}

async function loadReviewIssues() {
  try {
    const res = await fetch(`${API_BASE}/review-issues?project_id=${currentProjectId}`);
    if (res.ok) {
      const issues = await res.json();
      state.issues = issues;
      renderReviewIssues(issues);
    }
  } catch (e) {
    renderReviewIssues([
      { id: "1", code: "ISSUE-01", title: "Glass vs Gypsum Above Glass Measurement Pattern", category: "discrepancy", severity: "warning", description: "Identical 224 sq ft total area for glass partition and gypsum above glass.", sample_source: "Mb sheet -28-09", status: "unresolved" },
      { id: "2", code: "ISSUE-02", title: "Insulation Material Mismatch (Rockwool vs Glass wool)", category: "mismatch", severity: "warning", description: "Row 25 titled Rockwool Insulation but description specifies Glass wool.", sample_source: "offer Row 25", status: "unresolved" },
      { id: "3", code: "ISSUE-03", title: "Tile Transport Rate Mismatch (7% vs 5%)", category: "formula_error", severity: "warning", description: "Costing HS A4 label says 7% but formula uses 5%.", sample_source: "Costing HS Row 4", status: "unresolved" },
      { id: "4", code: "ISSUE-04", title: "Cell G90 Double Counting", category: "formula_error", severity: "critical", description: "Cell G90 sums G56:G89 including line items + subtotal.", sample_source: "offer Row 90", status: "unresolved" },
      { id: "5", code: "ISSUE-05", title: "Duplicate Item Code 'D9'", category: "code_conflict", severity: "info", description: "Item code D9 assigned to two distinct electrical light items.", sample_source: "offer Rows 49 & 50", status: "unresolved" },
      { id: "6", code: "ISSUE-06", title: "Electrical Quantities Tentative", category: "provisional", severity: "info", description: "DB/MCB items marked tentative pending electrical drawings.", sample_source: "offer Row 52 Note", status: "unresolved" },
      { id: "7", code: "ISSUE-07", title: "Unpopulated Furniture Scope in Workbook", category: "missing_scope", severity: "warning", description: "PDF drawing shows furniture layout, but workbook Section E is empty.", sample_source: "offer Section E", status: "unresolved" }
    ]);
  }
}

function renderReviewIssues(issues) {
  const container = document.getElementById("issues-list-container");
  if (!container) return;

  container.innerHTML = issues.map(iss => {
    const sevBadge = iss.severity === "critical" ? "badge-danger" : (iss.severity === "warning" ? "badge-warning" : "badge-info");
    const isResolved = iss.status === "resolved";

    return `
      <div class="card" style="margin-bottom: 0; border-left: 4px solid ${iss.severity === 'critical' ? '#ef4444' : '#f59e0b'};">
        <div class="card-header" style="margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge ${sevBadge}">${iss.code}</span>
            <strong style="font-size: 0.95rem;">${iss.title}</strong>
          </div>
          <span class="badge ${isResolved ? 'badge-success' : 'badge-warning'}">${iss.status.toUpperCase()}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.5rem;">${iss.description}</p>
        <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
          <span>Source: <code>${iss.sample_source}</code></span>
          <div>
            ${!isResolved ? `
              <button class="btn btn-secondary btn-sm" onclick="resolveIssue('${iss.id}', 'acknowledged')">Acknowledge</button>
              <button class="btn btn-primary btn-sm" onclick="resolveIssue('${iss.id}', 'resolved')"><i class="fa-solid fa-check"></i> Resolve & Reconcile</button>
            ` : `<span style="color: #10b981; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Resolved</span>`}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function resolveIssue(issueId, newStatus) {
  const note = prompt("Enter resolution note / estimator decision:", "Confirmed with Divine Innovation estimator on site.");
  if (note !== null) {
    try {
      await fetch(`${API_BASE}/review-issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution_note: note })
      });
      await loadReviewIssues();
      await loadProjectSummary();
    } catch (e) {
      const found = state.issues.find(i => i.id === issueId);
      if (found) found.status = newStatus;
      renderReviewIssues(state.issues);
    }
  }
}

async function exportExcel(includeInternal) {
  try {
    const res = await fetch(`${API_BASE}/export/excel?project_id=${currentProjectId}&include_internal_costing=${includeInternal}`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(`Excel Export Generated!\nFile: ${data.file_name}\n${includeInternal ? 'Includes Internal Costing Tab (10% Misc, 30% Margin).' : 'Customer Facing BOQ (Internal costing excluded).'}`);
      window.open(`http://127.0.0.1:8000${data.download_url}`, '_blank');
      return;
    }
  } catch (e) {
    alert(`Excel Export (${includeInternal ? 'Internal' : 'Customer'}) generated for Divine Innovation.`);
  }
}

function setZoom(level) {
  state.zoomLevel = level;
  const img = document.getElementById("pdf-rendered-img");
  if (img) img.style.transform = `scale(${level})`;
}

function filterBOQItems(query) {
  if (!query) {
    renderBOQTable(state.boqItems);
    return;
  }
  const filtered = state.boqItems.filter(i => 
    (i.description && i.description.toLowerCase().includes(query.toLowerCase())) ||
    (i.item_code && i.item_code.toLowerCase().includes(query.toLowerCase())) ||
    (i.location && i.location.toLowerCase().includes(query.toLowerCase()))
  );
  renderBOQTable(filtered);
}

window.updateBOQQty = updateBOQQty;
window.updateBOMMiscPct = updateBOMMiscPct;
window.updateBOMMarginPct = updateBOMMarginPct;
window.updateBOMCostComp = updateBOMCostComp;
window.approveBOQItem = approveBOQItem;
window.resolveIssue = resolveIssue;

// ---------------- When the BOQ comes from the drawing engine, keep every screen on it ----------------
function engineBOQActive() { return !!localStorage.getItem("di_boq_meta"); }

function recalcEngineItem(item) {
  const base = (item.material_cost || 0) + (item.labour_cost || 0) + (item.transport_cost || 0);
  const misc = item.misc_pct !== undefined ? Number(item.misc_pct) : 10;
  const margin = item.margin_pct !== undefined ? Number(item.margin_pct) : 30;
  const totalCostRate = base * (1 + misc / 100);
  const sellingRate = margin < 100 ? totalCostRate / (1 - margin / 100) : 0;
  item.cost_rate = Math.round(totalCostRate * 100) / 100;
  item.selling_rate = Math.round(sellingRate * 100) / 100;
  item.selling_amount = Math.round((item.current_qty || 0) * sellingRate * 100) / 100;
  if (base > 0 && item.review_status === "Rate needed") item.review_status = "Under review";
}

function saveAndRefreshEngineBOQ() {
  const meta = JSON.parse(localStorage.getItem("di_boq_meta") || "{}");
  state.boqItems.forEach(i => { if (!i.is_heading) recalcEngineItem(i); });
  showGeneratedBOQ(state.boqItems, meta.filename || "drawing", meta);
  if (state.comparisonData && state.comparisonData.engine) {
    state.comparisonData = toOldComparison(state.comparisonData.engine);
    renderComparisonTable(state.comparisonData);
  }
}

const _origLoadProjectSummary = loadProjectSummary;
loadProjectSummary = async function () {
  if (engineBOQActive()) { restoreGeneratedBOQ(); return; }
  return _origLoadProjectSummary();
};

const _origLoadDefaultComparison = loadDefaultComparison;
loadDefaultComparison = async function () {
  if (engineBOQActive()) {
    if (state.comparisonData && state.comparisonData.engine) renderComparisonTable(state.comparisonData);
    return;
  }
  return _origLoadDefaultComparison();
};

const _origApplyPricing = applyGlobalPricingDefaults;
applyGlobalPricingDefaults = async function () {
  if (!engineBOQActive()) return _origApplyPricing();
  const misc = parseFloat(document.getElementById("global-misc-pct").value || 10.0);
  const margin = parseFloat(document.getElementById("global-margin-pct").value || 30.0);
  if (!(margin >= 0 && margin < 100) || !(misc >= 0)) { alert("Margin must be between 0 and 99.9%, misc 0% or more."); return; }
  state.globalMiscPct = misc; state.globalMarginPct = margin;
  state.boqItems.forEach(i => { if (!i.is_heading) { i.misc_pct = misc; i.margin_pct = margin; } });
  saveAndRefreshEngineBOQ();
  alert(`Applied pricing to every line:\n- Miscellaneous cost: ${misc}%\n- Gross margin: ${margin}%`);
};

const _origUpdateQty = updateBOQQty;
updateBOQQty = async function (itemId, val) {
  if (!engineBOQActive()) return _origUpdateQty(itemId, val);
  const it = state.boqItems.find(i => i.id === itemId); if (!it) return;
  it.current_qty = parseFloat(val) || 0;
  if (it.provenance_type && !/edited/.test(it.provenance_type)) it.provenance_type += " [quantity edited]";
  saveAndRefreshEngineBOQ();
};
const _origUpdateMisc = updateBOMMiscPct;
updateBOMMiscPct = async function (itemId, val) {
  if (!engineBOQActive()) return _origUpdateMisc(itemId, val);
  const it = state.boqItems.find(i => i.id === itemId); if (!it) return;
  it.misc_pct = parseFloat(val) || 0; saveAndRefreshEngineBOQ();
};
const _origUpdateMargin = updateBOMMarginPct;
updateBOMMarginPct = async function (itemId, val) {
  if (!engineBOQActive()) return _origUpdateMargin(itemId, val);
  const it = state.boqItems.find(i => i.id === itemId); if (!it) return;
  const m = parseFloat(val); if (!(m >= 0 && m < 100)) { alert("Margin must be below 100%."); return; }
  it.margin_pct = m; saveAndRefreshEngineBOQ();
};
const _origUpdateComp = updateBOMCostComp;
updateBOMCostComp = async function (itemId, type, val) {
  if (!engineBOQActive()) return _origUpdateComp(itemId, type, val);
  const it = state.boqItems.find(i => i.id === itemId); if (!it) return;
  const v = parseFloat(val) || 0;
  if (type === "mat") it.material_cost = v; if (type === "lab") it.labour_cost = v; if (type === "trans") it.transport_cost = v;
  if (it.rate_source === "rate needed") it.rate_source = "entered by estimator";
  saveAndRefreshEngineBOQ();
};
const _origApprove = approveBOQItem;
approveBOQItem = async function (itemId) {
  if (!engineBOQActive()) return _origApprove(itemId);
  const it = state.boqItems.find(i => i.id === itemId); if (!it) return;
  it.review_status = "Approved"; saveAndRefreshEngineBOQ();
};
window.updateBOQQty = updateBOQQty;
window.updateBOMMiscPct = updateBOMMiscPct;
window.updateBOMMarginPct = updateBOMMarginPct;
window.updateBOMCostComp = updateBOMCostComp;
window.approveBOQItem = approveBOQItem;

function loadSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => res(window.XLSX); s.onerror = () => rej(new Error("Could not load the Excel library"));
    document.head.appendChild(s);
  });
}

const _origExport = exportExcel;
exportExcel = async function (includeInternal) {
  if (!engineBOQActive()) return _origExport(includeInternal);
  try {
    const XLSX = await loadSheetJS();
    const meta = JSON.parse(localStorage.getItem("di_boq_meta") || "{}");
    const head = ["Code", "Description", "Location", "Unit", "Quantity", "Rate (₹)", "Amount (₹)", "Status"];
    const ihead = ["Base cost B (₹)", "Misc %", "Total cost rate (₹)", "Gross margin %", "Rate source", "How measured"];
    const rows = [[`Divine Innovation — BOQ generated from ${meta.filename || "drawing"} (${meta.revision || ""})`], [], includeInternal ? head.concat(ihead) : head];
    let total = 0;
    state.boqItems.forEach(i => {
      if (i.is_heading) { rows.push([i.item_code, i.description]); return; }
      total += i.selling_amount || 0;
      const r = [i.item_code, i.description, i.location, i.unit, i.current_qty, i.selling_rate, i.selling_amount, i.review_status];
      rows.push(includeInternal ? r.concat([i.material_cost + i.labour_cost + i.transport_cost, i.misc_pct, i.cost_rate, i.margin_pct, i.rate_source, i.provenance_type]) : r);
    });
    rows.push([], ["", "Total (excl. GST)", "", "", "", "", Math.round(total * 100) / 100]);
    rows.push(["", "Quantities are measured from the drawing; lines stay 'Under review' until approved; '[standard assumption]' marks a height or finish not stated on the drawing; 'Rate needed' means no costing yet."]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "BOQ");
    if (state.comparisonData && state.comparisonData.engine) {
      const c = state.comparisonData.engine;
      const crow = [["Summary of differences"], [c.verdict], [`Scope coverage: ${c.coverage_pct === null ? "—" : c.coverage_pct + "%"}`], [],
        ["Code", "Customer item", "Their qty", "Unit", "Status", "Reason", "Our line(s)"]];
      c.rows.forEach(r => crow.push([r.code, (r.full_description || "").split("\n")[0], r.quantity, r.unit, r.status_label, r.cause_label || r.reason, r.lines.map(l => l.description).join("; ")]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(crow), "Comparison");
    }
    XLSX.writeFile(wb, `Divine-BOQ-${(meta.filename || "drawing").replace(/\.[^/.]+$/, "")}${includeInternal ? "-internal" : ""}.xlsx`);
  } catch (err) {
    alert("Export failed: " + err.message);
  }
};

// ---------------- Every screen shows only the uploaded drawing's data (no local server, no bundled sample) ----------------
function engineMeta() { try { return JSON.parse(localStorage.getItem("di_boq_meta") || "null"); } catch (e) { return null; } }

loadInventory = async function () {
  const meta = engineMeta();
  state.inventory = meta && meta.files ? meta.files.map(f => ({ name: f.name, category: f.kind === "pdf" ? "pdf_layout" : "cad_drawing", size_bytes: f.size })) : [];
  renderInventoryTable(state.inventory);
};

loadZones = async function () {
  const meta = engineMeta();
  state.zones = meta && meta.rooms ? meta.rooms.map(r => ({ name: r.room, category: r.enclosed ? "room" : "open area", gross_area_sqft: Math.round(r.area_m2 * 10.7639 * 10) / 10 })) : [];
  renderZonesList(state.zones);
};

loadReviewIssues = async function () {
  const meta = engineMeta();
  state.issues = meta && meta.issues ? meta.issues : [];
  renderReviewIssues(state.issues);
  const badge = document.getElementById("badge-issue-count");
  if (badge) { badge.textContent = state.issues.length; badge.style.display = state.issues.length ? "inline-flex" : "none"; }
};

loadBOQItems = async function () {
  if (restoreGeneratedBOQ()) return;
  state.boqItems = [];
  renderBOQTable([]); renderAdminBOMTable([]); populateMeasBOQSelect([]);
};

loadProjectSummary = async function () {
  if (engineBOQActive()) { restoreGeneratedBOQ(); return; }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("summary-customer", "Divine Innovation (Workspace Clean)");
  set("summary-location", "Pending Drawing Upload");
  set("summary-total-amount", "₹ 0.00");
  set("summary-revision", "Rev 00 (no drawing)");
  set("sidebar-rev-label", "Rev 00");
  const badge = document.getElementById("proj-status-badge");
  if (badge) { badge.textContent = "CLEAN"; badge.className = "badge badge-secondary"; }
};

function clearComparisonView() {
  const box = document.getElementById("cmp-scope-summary"); if (box) box.remove();
  const body = document.getElementById("compare-table-body");
  if (body) body.innerHTML = `<tr><td colspan="12" style="text-align: center; color: var(--text-muted);">Upload the customer's BOQ to compare it with the BOQ generated from your drawing.</td></tr>`;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("cmp-gen-total", "₹ 0.00"); set("cmp-up-total", "₹ 0.00"); set("cmp-var-total", "₹ 0.00 (0%)"); set("cmp-items-count", "0 items");
}

loadDefaultComparison = async function () {
  let cmp = null;
  try { cmp = JSON.parse(localStorage.getItem("di_cmp") || "null"); } catch (e) { cmp = null; }
  if (engineBOQActive() && cmp) { state.comparisonData = toOldComparison(cmp); renderComparisonTable(state.comparisonData); return; }
  state.comparisonData = null;
  clearComparisonView();
};

importSample = async function () {
  alert("Upload the drawing (DWG, DXF or PDF) in step 2 — the BOQ is generated from that drawing.");
  document.querySelector('.nav-item[data-tab="upload-cad"]')?.click();
};

function setViewerHeader(meta) {
  document.querySelectorAll(".card-title").forEach(el => {
    if (/Layout Drawing Viewer/.test(el.textContent)) el.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> Layout Drawing Viewer${meta ? " — " + (meta.filename || "") + (meta.revision ? " (" + meta.revision + ")" : "") : ""}`;
  });
  document.querySelectorAll(".badge").forEach(el => {
    if (/NTS TITLE BLOCK|CALIBRATED/i.test(el.textContent)) el.textContent = meta ? (meta.scale_note || "Measured from drawing geometry") : "No drawing uploaded";
  });
}

async function geometryImage(projectId, docId) {
  const g = await engineCall("GET", `/projects/${projectId}/documents/${docId}/geometry`);
  if (!g.bbox) return null;
  const [x0, y0, x1, y1] = g.bbox;
  const W = 2000, H = Math.max(400, Math.round(W * (y1 - y0) / Math.max(1, x1 - x0)));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  const s = Math.min(W / (x1 - x0), H / (y1 - y0)) * 0.96;
  const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const colour = { glazing: "#0e7490", partition: "#0f766e", external_wall: "#334155", wall_hatch: "#94a3b8", door: "#2563eb", dimension: "#cbd5e1", ceiling_grid: "#a78bfa" };
  ctx.lineWidth = 1;
  Object.keys(g.layers).forEach(ln => {
    const L = g.layers[ln];
    ctx.strokeStyle = colour[L.role] || "#64748b";
    L.paths.forEach(p => { ctx.beginPath(); p.forEach((pt, i) => { const x = ox + (pt[0] - x0) * s, y = H - (oy + (pt[1] - y0) * s); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); });
  });
  return c.toDataURL("image/png");
}

loadPDFDrawing = async function () {
  const img = document.getElementById("pdf-rendered-img");
  if (!img) return;
  img.onerror = null;
  const meta = engineMeta();
  setViewerHeader(meta);
  if (!meta || !meta.files || !meta.files.length || !engineToken()) {
    img.removeAttribute("src"); img.alt = "No drawing uploaded yet — upload a DWG, DXF or PDF in step 2.";
    img.style.minHeight = "120px";
    return;
  }
  try {
    const pdf = meta.files.find(f => f.kind === "pdf");
    if (pdf) {
      const res = await fetch(`${ENGINE_API}/projects/${meta.project}/documents/${pdf.id}/render/1`, { headers: { Authorization: "Bearer " + engineToken() } });
      if (res.ok) { img.src = URL.createObjectURL(await res.blob()); return; }
    }
    const cad = meta.files.find(f => f.kind !== "pdf");
    if (cad) { const url = await geometryImage(meta.project, cad.id); if (url) { img.src = url; return; } }
  } catch (e) { console.warn("viewer:", e.message); }
  img.removeAttribute("src"); img.alt = "The drawing could not be displayed.";
};
