/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

function ymIsYogabrataPagesClone() {
  const ym_host = String((typeof location !== "undefined" && location.hostname) || "");
  if (/(^|\.)yogabrata\.com$/i.test(ym_host)) return true;
  const ym_path = String((typeof location !== "undefined" && location.pathname) || "");
  if (/\/atlas\/ui(\/|$)/.test(ym_path)) return false;
  const ym_norm = ym_path.replace(/\/index\.html$/, "/");
  return /\/atlas\/?$/.test(ym_norm) || /\/atlas\/proof\//.test(ym_path);
}

function ymResolveApiBase() {
  if (ymIsYogabrataPagesClone()) {
    return "https://brahmexa.com/saas/atlas-api.php";
  }
  return "/atlas/api/v1";
}

function ymApiUrl(path) {
  if (String(YM_API).indexOf("atlas-api.php") !== -1) {
    const ym_q = path.indexOf("?");
    const ym_only = ym_q >= 0 ? path.slice(0, ym_q) : path;
    const ym_qs = ym_q >= 0 ? path.slice(ym_q + 1) : "";
    return YM_API + "?path=" + encodeURIComponent(ym_only) + (ym_qs ? "&" + ym_qs : "");
  }
  return YM_API + path;
}

const YM_API = ymResolveApiBase();
const YM_STATE = {
  token: sessionStorage.getItem("atlas_token") || "",
  profileId: sessionStorage.getItem("atlas_profile_id") || "",
  demoKey: sessionStorage.getItem("atlas_demo_key") || "",
  decisionId: sessionStorage.getItem("atlas_decision_id") || "",
  intentId: sessionStorage.getItem("atlas_intent_id") || "",
  role: sessionStorage.getItem("atlas_role") || "",
  scenarios: [],
};

const YM_GLOSSARY = {
  ACH: "an electronic bank-to-bank payment",
  RTP: "a very fast bank payment that is hard to reverse once sent",
  "payment reliability": "how likely the payment is to complete successfully",
  "identity confidence": "how confident ATLAS is that the person is genuine",
  "financial stability": "whether income, spending, and balances appear sustainable",
  "transaction risk": "whether this specific payment looks suspicious, even if the customer normally looks safe",
  "profile risk": "how risky the customer looks overall, based on their history",
  TRACE: "a replayable record of exactly how a decision was made",
  PROOF: "evidence that ATLAS followed its declared rules",
};

function ymAuth() {
  return YM_STATE.token ? { Authorization: "Bearer " + YM_STATE.token } : {};
}

function ymPersist() {
  sessionStorage.setItem("atlas_token", YM_STATE.token || "");
  sessionStorage.setItem("atlas_profile_id", YM_STATE.profileId || "");
  sessionStorage.setItem("atlas_demo_key", YM_STATE.demoKey || "");
  sessionStorage.setItem("atlas_decision_id", YM_STATE.decisionId || "");
  sessionStorage.setItem("atlas_intent_id", YM_STATE.intentId || "");
  sessionStorage.setItem("atlas_role", YM_STATE.role || "");
}

function ymSelectProfile(id, demoKey) {
  YM_STATE.profileId = id || "";
  if (demoKey) YM_STATE.demoKey = demoKey;
  ymPersist();
}

async function ymApi(path, opts = {}) {
  const ym_headers = { ...(opts.headers || {}), ...ymAuth() };
  if (opts.json) ym_headers["Content-Type"] = "application/json";
  const ym_resp = await fetch(ymApiUrl(path), {
    method: opts.method || "GET",
    headers: ym_headers,
    body: opts.json ? JSON.stringify(opts.json) : opts.body,
  });
  const ym_text = await ym_resp.text();
  let ym_data = null;
  try { ym_data = ym_text ? JSON.parse(ym_text) : null; } catch { ym_data = { raw: ym_text }; }
  if (!ym_resp.ok) throw new Error((ym_data && ym_data.error && ym_data.error.message) || ym_text || ym_resp.status);
  return ym_data;
}

function ymEsc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function ymIsYogabrataSurface() {
  return document.documentElement.getAttribute("data-ym-surface") === "yogabrata";
}

function ymApplyBrandChrome() {
  const ym_line = ymIsYogabrataSurface() ? "Yogabrata · Brahmexa" : "KAI247 Finance Agent";
  document.querySelectorAll("[data-ym-brand]").forEach((el) => {
    el.textContent = ym_line;
  });
}

function ymMoney(minor) {
  const n = Number(minor || 0) / 100;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function ymScoreClass(n) {
  if (n >= 80) return "block";
  if (n >= 40) return "hold";
  return "allow";
}

function ymRiskWord(n) {
  if (n >= 80) return "HIGH";
  if (n >= 40) return "MODERATE";
  return "LOW";
}

function ymDispClass(code) {
  const c = String(code || "").toUpperCase();
  if (c === "ALLOW" || c === "ALLOW_MONITOR") return "allow";
  if (c === "STEP_UP" || c === "HOLD") return "hold";
  return "block";
}

function ymTip(term) {
  const plain = YM_GLOSSARY[term];
  if (!plain) return ymEsc(term);
  return `<abbr class="ym-term" title="${ymEsc(plain)}"><b>${ymEsc(term)}</b> — ${ymEsc(plain)}</abbr>`;
}

function ymHash() {
  const raw = (location.hash || "#/home").replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  return { view: parts[0] || "home", id: parts[1] || "", extra: parts.slice(2).join("/") };
}

function ymSetView(title, eyebrow, html) {
  document.getElementById("view-title").textContent = title;
  document.getElementById("view-eyebrow").textContent = eyebrow;
  document.getElementById("view").innerHTML = html;
  const h = location.hash || "#/home";
  document.querySelectorAll(".atlas-nav a").forEach((a) => {
    const href = a.getAttribute("href");
    a.classList.toggle("is-on", h === href || h.startsWith(href + "/"));
  });
}

function ymTech(obj, label) {
  return `<details class="ym-tech"><summary>${ymEsc(label || "Technical evidence")}</summary>
    <pre class="out">${ymEsc(JSON.stringify(obj, null, 2))}</pre></details>`;
}

function ymScenarioById(id) {
  return (YM_STATE.scenarios || []).find((s) => s.profile_id === id || s.demo_key === id);
}

function ymPortalShell(inner, extraClass, attrs) {
  return `<button type="button" class="portal portal--atlas persona ${extraClass || ""}" ${attrs || ""}>
    <span class="portal-ring" aria-hidden="true"></span>
    <span class="portal-orbit" aria-hidden="true"></span>
    <span class="portal-core">${inner}</span>
  </button>`;
}

function ymChooseScenario(reason) {
  const cards = (YM_STATE.scenarios || []).map((s) => ymPortalShell(
    `<span class="pill pill-syn">SYNTHETIC</span>
      <span class="portal-title">${ymEsc(s.short_name)}</span>
      <span class="portal-sub">${ymEsc(s.capability)}</span>
      <span class="portal-sub">${ymEsc(s.headline)}</span>`,
    "",
    `data-id="${ymEsc(s.profile_id)}" data-key="${ymEsc(s.demo_key)}"`,
  )).join("");
  return `<div class="ym-choose">
    <h2>Choose a scenario</h2>
    <p class="muted">${ymEsc(reason || "This screen needs a customer. Pick one of the six synthetic people.")}</p>
    <div class="portal-grid">${cards || "<p class='muted'>Scenarios are still loading.</p>"}</div>
  </div>`;
}

function ymBindChoose(nextHash) {
  document.querySelectorAll(".persona").forEach((el) => {
    el.addEventListener("click", () => {
      ymSelectProfile(el.dataset.id, el.dataset.key);
      location.hash = nextHash.replace(":id", el.dataset.id);
    });
  });
}

function ymNeedProfile(reason, nextHash) {
  ymSetView("Choose a scenario", "Synthetic demo", ymChooseScenario(reason));
  ymBindChoose(nextHash);
}

async function ymLoadScenarios() {
  const data = await ymApi("/demo/scenarios");
  YM_STATE.scenarios = data.scenarios || [];
  return YM_STATE.scenarios;
}

async function ymEnsureSession() {
  const status = document.getElementById("login-status");
  const trySet = (out) => {
    YM_STATE.token = out.access_token;
    YM_STATE.role = out.role || "";
    ymPersist();
    status.textContent = (out.user_id || "demo") + " · synthetic demo";
  };
  if (YM_STATE.token) {
    try {
      await ymApi("/demo/scenarios");
      status.textContent = (YM_STATE.role || "session") + " · synthetic demo";
      return true;
    } catch {
      YM_STATE.token = "";
      ymPersist();
    }
  }
  try {
    trySet(await ymApi("/auth/login", { method: "POST", json: { username: "yoga", password: "yoga" } }));
    return true;
  } catch { /* try open demo session */ }
  try {
    trySet(await ymApi("/auth/demo-session", { method: "POST", json: {} }));
    return true;
  } catch (err) {
    status.textContent = "Sign in to continue (" + err.message + ")";
    return false;
  }
}

async function ymLogin(ev) {
  ev.preventDefault();
  const ym_fd = new FormData(ev.target);
  const ym_out = await ymApi("/auth/login", {
    method: "POST",
    json: { username: ym_fd.get("username"), password: ym_fd.get("password") },
  });
  YM_STATE.token = ym_out.access_token;
  YM_STATE.role = ym_out.role || "";
  ymPersist();
  document.getElementById("login-status").textContent = ym_out.user_id + " · " + ym_out.role;
  ymRoute();
}

function ymAskBox() {
  return `<div class="ym-ask" id="ym-ask">
    <h3>Ask ATLAS</h3>
    <p class="muted">Answers use ATLAS evidence. The engine decides; AI only explains.</p>
    <div class="ask-list">
      <button type="button" data-q="Why did ATLAS reach this decision?">Why this decision?</button>
      <button type="button" data-q="How is profile risk different from transaction risk?">Profile vs payment risk</button>
      <button type="button" data-q="Can AI move money?">Can AI move money?</button>
      <button type="button" data-q="What should the operator do?">What should I do?</button>
    </div>
    <form id="ask-form"><input name="q" placeholder="Ask in ordinary language…" aria-label="Question" /><button type="submit">Ask</button></form>
    <div class="ym-chat" id="ask-out"></div>
  </div>`;
}

function ymRenderExplain(out) {
  const engine = out.engine || {};
  const ai = out.ai || {};
  const txn = engine.transaction_risk || {};
  const reasons = (txn.reasons || (engine.profile_risk || {}).reasons || []).slice(0, 3);
  return `<article class="ym-bubble engine">
      <span class="pill pill-engine">ATLAS engine</span>
      <p>${ymEsc((txn.plain && txn.plain.headline) || engine.goal || "")}</p>
      <ul>${reasons.map((r) => `<li>${ymEsc(r.plain)} <span class="muted">(${ymEsc(r.effect)})</span></li>`).join("")}</ul>
      <p class="muted">${ymEsc(engine.profile_vs_transaction || "")}</p>
      <p><strong>What a person should do:</strong> ${ymEsc(engine.operator_should || "")}</p>
    </article>
    <article class="ym-bubble ai">
      <span class="pill pill-ai">AI explanation</span>
      <p class="muted">${ymEsc(ai.notice || "")}</p>
      <p>${ymEsc(ai.text || "")}</p>
    </article>`;
}

function ymBindAsk() {
  const box = document.getElementById("ym-ask");
  if (!box) return;
  const run = async (q) => {
    const out = await ymApi("/explain", {
      method: "POST",
      json: { profile_id: YM_STATE.profileId || null, decision_id: YM_STATE.decisionId || null, intent_id: YM_STATE.intentId || null, question: q },
    });
    document.getElementById("ask-out").innerHTML = ymRenderExplain(out);
  };
  box.querySelectorAll("[data-q]").forEach((btn) => btn.addEventListener("click", () => run(btn.dataset.q).catch((e) => {
    document.getElementById("ask-out").innerHTML = `<p class="block">${ymEsc(e.message)}</p>`;
  })));
  document.getElementById("ask-form").addEventListener("submit", (e) => {
    e.preventDefault();
    run(new FormData(e.target).get("q")).catch((err) => {
      document.getElementById("ask-out").innerHTML = `<p class="block">${ymEsc(err.message)}</p>`;
    });
  });
}

function ymViewHome() {
  ymSetView("Watch ATLAS think out loud", "Synthetic guided demo", `
    <div class="ym-hero">
      <div>
        <p>ATLAS is a demonstration of how a payment can be understood before any money moves.
        You will meet a made-up customer, watch ATLAS gather signals, and see whether a payment is allowed, reviewed, held, or stopped — and why.</p>
        <p class="ym-term">${ymTip("TRACE")}. ${ymTip("PROOF")}.</p>
        <p class="muted">AI can explain the result. AI cannot send money.</p>
        <div class="ym-actions">
          <a class="ym-cta" href="#/story" style="display:inline-block;width:auto;text-decoration:none;">Start Guided Demo</a>
          <a class="ym-btn ghost" href="#/profiles" style="display:inline-block;text-decoration:none;">Browse six scenarios</a>
        </div>
      </div>
      <svg viewBox="0 0 420 420" role="img" aria-label="Signals flowing into ATLAS">
        <circle class="ym-core-glow" cx="210" cy="210" r="64" />
        <circle cx="210" cy="210" r="24" fill="#7ee0ff" />
        <text x="210" y="216" text-anchor="middle" fill="#071018" font-size="11">ATLAS</text>
        <path class="ym-sig" d="M50 80 C130 80, 150 210, 186 210" />
        <path class="ym-sig gold" d="M50 340 C130 340, 150 210, 186 210" />
        <path class="ym-sig risk" d="M370 80 C290 80, 270 210, 234 210" />
        <path class="ym-sig" d="M370 340 C290 340, 270 210, 234 210" />
        <circle cx="50" cy="80" r="7" fill="#7eb6ff"/>
        <circle cx="50" cy="340" r="7" fill="#d4b46a"/>
        <circle cx="370" cy="80" r="7" fill="#e0a45c"/>
        <circle cx="370" cy="340" r="7" fill="#6fd3b0"/>
        <text x="50" y="62" text-anchor="middle" fill="#8b9bb0" font-size="11">Identity</text>
        <text x="50" y="368" text-anchor="middle" fill="#8b9bb0" font-size="11">Income</text>
        <text x="370" y="62" text-anchor="middle" fill="#8b9bb0" font-size="11">Device</text>
        <text x="370" y="368" text-anchor="middle" fill="#8b9bb0" font-size="11">History</text>
      </svg>
    </div>
  `);
}

async function ymViewProfiles() {
  const list = YM_STATE.scenarios.length ? YM_STATE.scenarios : await ymLoadScenarios();
  const cards = list.map((s) => ymPortalShell(
    `<span class="pill pill-syn">SYNTHETIC</span>
      <span class="portal-title">${ymEsc(s.short_name)}</span>
      <span class="portal-sub">${ymEsc(s.profile_risk_score ?? "—")} ${ymTip("profile risk")}</span>
      <span class="portal-sub">${ymEsc(s.headline)}</span>`,
    "",
    `data-id="${ymEsc(s.profile_id)}" data-key="${ymEsc(s.demo_key)}"`,
  )).join("");
  ymSetView("Six synthetic people", "Each one teaches a different ATLAS idea", `<div class="portal-grid">${cards}</div>`);
  document.querySelectorAll(".persona").forEach((el) => {
    el.addEventListener("click", () => {
      ymSelectProfile(el.dataset.id, el.dataset.key);
      location.hash = "#/workspace/" + el.dataset.id;
    });
  });
}

function ymMeters(p, risk) {
  const v = p.current_version || {};
  return `<div class="score-row">
    <div class="meter ${ymScoreClass(risk.score)}"><b class="ym-score-anim">${risk.score ?? "—"}</b> Profile risk <span class="risk-text">${ymRiskWord(risk.score)}</span></div>
    <div class="meter"><b>${risk.data_confidence ?? "—"}</b> How complete the data is</div>
    <div class="meter"><b>${v.identity_confidence ?? "—"}</b> Identity confidence</div>
    <div class="meter"><b>${v.financial_stability ?? "—"}</b> Financial stability</div>
    <div class="meter"><b>${v.payment_reliability ?? "—"}</b> Payment reliability</div>
    <div class="meter ${ymScoreClass(v.fraud_risk)}"><b>${v.fraud_risk ?? "—"}</b> Abuse / fraud signs</div>
  </div>
  <p class="ym-term">${ymTip("identity confidence")}. ${ymTip("financial stability")}. ${ymTip("payment reliability")}.</p>`;
}

function ymReasonList(factors) {
  const items = (factors || []).slice().sort((a, b) => Math.abs(Number(b.contribution || 0)) - Math.abs(Number(a.contribution || 0))).slice(0, 6);
  if (!items.length) return "<p class='muted'>No scored factors.</p>";
  return `<div class="ym-reasons">${items.map((f) => {
    const up = Number(f.contribution) > 0;
    return `<div class="ym-reason ${up ? "up" : "down"}">
      <span>${up ? "▲" : "▼"}</span>
      <span>${ymEsc(f.plain || f.reason_code || f.factor_code)}</span>
      <span class="delta">${up ? "+" : ""}${ymEsc(f.contribution)}</span>
    </div>`;
  }).join("")}</div>`;
}

async function ymViewWorkspace(id) {
  const pid = id || YM_STATE.profileId;
  if (!pid) return ymNeedProfile("Open a customer workspace by choosing a scenario.", "#/workspace/:id");
  ymSelectProfile(pid);
  const [p, risk, ev, map, explain] = await Promise.all([
    ymApi("/profiles/" + pid),
    ymApi("/profiles/" + pid + "/risk"),
    ymApi("/profiles/" + pid + "/evidence"),
    ymApi("/profiles/" + pid + "/map"),
    ymApi("/explain", { method: "POST", json: { profile_id: pid, question: "Summarize this customer." } }),
  ]);
  const sc = ymScenarioById(p.demo_key) || (explain.scenario || {});
  YM_STATE.demoKey = p.demo_key || YM_STATE.demoKey;
  ymPersist();
  const disp = (explain.engine && explain.engine.profile_risk && explain.engine.profile_risk.plain) || {};
  ymSetView(sc.short_name || p.display_name, "Customer workspace", `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <p>${ymEsc(sc.goal || p.display_name)}</p>
    <p class="muted">${ymEsc(sc.headline || "")}</p>
    ${ymMeters(p, risk)}
    <div class="ym-split">
      <article>
        <h3>What this person is trying to do</h3>
        <p>${ymEsc(sc.goal || "A synthetic demonstration payment.")}</p>
        <p><strong>What this scenario proves:</strong> ${ymEsc(sc.proves || "")}</p>
      </article>
      <article>
        <h3>ATLAS view of the customer</h3>
        <p class="${ymDispClass(risk.disposition)}"><strong>${ymEsc(disp.label || risk.disposition || "")}</strong></p>
        <p>${ymEsc(disp.detail || "")}</p>
      </article>
    </div>
    <h3>Why the customer looks this way</h3>
    ${ymReasonList((explain.engine && explain.engine.profile_risk && explain.engine.profile_risk.reasons) || risk.factors)}
    <h3>People, accounts, devices, and payees</h3>
    <p class="muted">This is a map of how ATLAS connects this person to accounts, devices, and payees. Click a circle.</p>
    <div class="ym-graph-wrap"><svg class="ym-graph" id="g" role="img" aria-label="Relationship graph"></svg></div>
    <div class="ym-graph-card" id="g-ev">Click a node to see what it means.</div>
    <p class="ym-actions">
      <a class="ym-cta" href="#/pay/${ymEsc(pid)}" style="display:inline-block;width:auto;text-decoration:none;">Simulate this payment</a>
      <a class="ym-btn ghost" href="#/fraud/${ymEsc(pid)}" style="display:inline-block;text-decoration:none;">Inspect fraud graph</a>
      <a class="ym-btn ghost" href="#/story/${ymEsc(p.demo_key || "")}" style="display:inline-block;text-decoration:none;">Replay guided story</a>
    </p>
    ${ymAskBox()}
    ${ymTech({ profile_id: pid, conflicts: ev.conflicts, observations: (ev.observations || []).length, disposition: risk.disposition }, "Technical evidence")}
  `);
  if (window.ymDrawInteractiveGraph) window.ymDrawInteractiveGraph(document.getElementById("g"), map, { evidenceEl: document.getElementById("g-ev") });
  ymBindAsk();
}

async function ymViewPay(id) {
  const pid = id || YM_STATE.profileId;
  if (!pid) return ymNeedProfile("The payment simulator needs a customer first.", "#/pay/:id");
  ymSelectProfile(pid);
  const p = await ymApi("/profiles/" + pid);
  if (!YM_STATE.scenarios.length) await ymLoadScenarios();
  const sc = ymScenarioById(p.demo_key) || {};
  const pay = sc.payment || { amount_minor: 85000, payee_name: "SYNTHETIC VENDOR", counterparty_id: "cp_new_sim", requested_rail: "ACH", speed: "STANDARD", purpose: "vendor_payment" };
  YM_STATE.demoKey = p.demo_key || "";
  ymPersist();
  ymSetView("Payment simulator", "SIMULATED / SANDBOX — no live money", `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <p>${ymEsc(sc.short_name || p.display_name)} is trying to send ${ymMoney(pay.amount_minor)} to ${ymEsc(pay.payee_name)} using ${ymEsc(pay.requested_rail)} — ${pay.requested_rail === "ACH" ? YM_GLOSSARY.ACH : "a simulated bank rail"}.</p>
    <div class="ym-pipeline" id="flow">
      <div class="step">Request</div><div class="step">Understand</div><div class="step">Score</div>
      <div class="step">Decide</div><div class="step">Protect</div><div class="step">Complete or hold</div>
    </div>
    <form class="stack" id="pay">
      <input type="hidden" name="payer_profile_id" value="${ymEsc(pid)}" />
      <label>Payee <input name="payee_name" value="${ymEsc(pay.payee_name)}" /></label>
      <label>Payee id <input name="counterparty_id" value="${ymEsc(pay.counterparty_id)}" /></label>
      <label>Amount in cents <input name="amount_minor" type="number" value="${ymEsc(pay.amount_minor)}" /></label>
      <label>How it is sent <select name="requested_rail">
        <option${pay.requested_rail === "ACH" ? " selected" : ""}>ACH</option>
        <option${pay.requested_rail === "RTP" ? " selected" : ""}>RTP</option>
        <option>SAME_DAY_ACH</option><option>FEDNOW</option><option>AUTO</option>
      </select></label>
      <label>Speed <select name="speed"><option${pay.speed === "STANDARD" ? " selected" : ""}>STANDARD</option><option${pay.speed === "INSTANT" ? " selected" : ""}>INSTANT</option><option>SAME_DAY</option></select></label>
      <button type="submit">Evaluate this payment</button>
    </form>
    <div class="ym-actions">
      <button type="button" class="ym-btn ghost" id="btn-dup">Try the same payment twice</button>
      <button type="button" class="ym-btn ghost" id="btn-mutate">Change the amount after the decision</button>
    </div>
    <div id="pay-result"></div>
    ${ymAskBox()}
  `);
  const mark = (n, extra) => {
    document.querySelectorAll("#flow .step").forEach((el, i) => {
      el.classList.toggle("on", i < n);
      if (extra && i === n - 1) el.classList.add(extra);
    });
  };
  document.getElementById("pay").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    mark(2);
    const created = await ymApi("/payment-intents", {
      method: "POST",
      json: {
        payer_profile_id: fd.get("payer_profile_id"),
        amount_minor: Number(fd.get("amount_minor")),
        currency: "USD",
        purpose: pay.purpose || "vendor_payment",
        requested_rail: fd.get("requested_rail"),
        speed: fd.get("speed") || null,
        payee: { name: fd.get("payee_name"), counterparty_id: fd.get("counterparty_id") },
      },
    });
    YM_STATE.intentId = created.intent.id;
    mark(3);
    const evl = await ymApi("/payment-intents/" + YM_STATE.intentId + "/evaluate", { method: "POST" });
    YM_STATE.decisionId = evl.transaction_risk && evl.transaction_risk.id;
    ymPersist();
    mark(4);
    let sim = null;
    try { sim = await ymApi("/payment-intents/" + YM_STATE.intentId + "/simulate", { method: "POST", json: {} }); }
    catch (err) { sim = { note: String(err) }; }
    const tr = evl.transaction_risk || {};
    const pr = evl.profile_risk || {};
    const held = ["HOLD", "STEP_UP", "BLOCK_REVIEW"].includes(tr.disposition);
    mark(6, held ? (tr.disposition === "BLOCK_REVIEW" ? "stop" : "held") : "");
    const explain = await ymApi("/explain", { method: "POST", json: { profile_id: pid, decision_id: YM_STATE.decisionId, intent_id: YM_STATE.intentId, question: "Why this payment decision?" } });
    const reasons = ((explain.engine && explain.engine.transaction_risk && explain.engine.transaction_risk.reasons) || []).slice(0, 3);
    const headline = (explain.engine && explain.engine.transaction_risk && explain.engine.transaction_risk.plain && explain.engine.transaction_risk.plain.headline) || tr.disposition;
    document.getElementById("pay-result").innerHTML = `
      <div class="ym-split">
        <article>
          <h3>Customer overall</h3>
          <p class="${ymScoreClass(pr.score)}">Profile risk ${ymEsc(pr.score)} · ${ymEsc(pr.disposition)}</p>
          <p class="muted">${ymTip("profile risk")}</p>
        </article>
        <article>
          <h3>This payment</h3>
          <p class="${ymDispClass(tr.disposition)}"><strong>${ymEsc(headline)}</strong></p>
          <p>Transaction risk ${ymEsc(tr.score)} — ${ymTip("transaction risk")}</p>
        </article>
      </div>
      <h3>The three strongest reasons</h3>
      ${ymReasonList(reasons)}
      <p><strong>Operator:</strong> ${ymEsc((explain.engine && explain.engine.operator_should) || sc.operator_should || "")}</p>
      <p class="muted">Simulated state: ${ymEsc((sim.payment || evl.payment || {}).state || "")} · ${ymEsc(sim.blocked_reason || sim.note || "sandbox only")}</p>
      ${ymTech({ profile_risk: pr.score, transaction_risk: tr.score, disposition: tr.disposition, intent: YM_STATE.intentId, decision: YM_STATE.decisionId, state: (sim.payment || {}).state }, "Technical evidence")}
    `;
  });
  document.getElementById("btn-dup").addEventListener("click", async () => {
    const key = "DEMO-" + pid.slice(0, 8) + "-" + Date.now();
    const body = { payer_profile_id: pid, amount_minor: pay.amount_minor, requested_rail: pay.requested_rail, payee: { name: pay.payee_name, counterparty_id: pay.counterparty_id } };
    const headers = { ...ymAuth(), "Content-Type": "application/json", "Idempotency-Key": key };
    const first = await fetch(ymApiUrl("/payment-intents"), { method: "POST", headers, body: JSON.stringify(body) }).then((r) => r.json());
    const second = await fetch(ymApiUrl("/payment-intents"), { method: "POST", headers, body: JSON.stringify(body) }).then((r) => r.json());
    document.getElementById("pay-result").innerHTML = `<p>ATLAS treated the second request as the same payment. First id ${ymEsc((first.intent || {}).id)} · second id ${ymEsc((second.intent || {}).id)} — they match, so a duplicate was not created.</p>${ymTech({ first, second }, "Technical evidence")}`;
  });
  document.getElementById("btn-mutate").addEventListener("click", async () => {
    if (!YM_STATE.intentId) {
      document.getElementById("pay-result").innerHTML = "<p class='hold'>Evaluate a payment first, then try changing it.</p>";
      return;
    }
    try {
      const out = await ymApi("/payment-intents/" + YM_STATE.intentId + "/simulate", { method: "POST", json: { mutated_intent: { amount_minor: Number(pay.amount_minor) * 10 } } });
      document.getElementById("pay-result").innerHTML = `<p>ATLAS compared the changed amount with the original decision. Simulated state: ${ymEsc((out.payment || {}).state || out.blocked_reason || "see technical evidence")}</p>${ymTech(out, "Technical evidence")}`;
    } catch (err) {
      document.getElementById("pay-result").innerHTML = `<p class="hold">The change was detected. ${ymEsc(err.message)}</p>`;
    }
  });
  ymBindAsk();
}

async function ymViewFraud(id) {
  const pid = id || YM_STATE.profileId;
  if (!pid) return ymNeedProfile("Fraud Investigator needs a customer. It will not open the ACH Inspector.", "#/fraud/:id");
  ymSelectProfile(pid);
  const [p, map, risk, explain] = await Promise.all([
    ymApi("/profiles/" + pid),
    ymApi("/profiles/" + pid + "/map"),
    ymApi("/profiles/" + pid + "/risk"),
    ymApi("/explain", { method: "POST", json: { profile_id: pid, question: "What connected activity should an investigator notice?" } }),
  ]);
  const sc = ymScenarioById(p.demo_key) || explain.scenario || {};
  ymSetView("Fraud investigator", sc.short_name || p.display_name, `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <p>This is the relationship view — not the ACH file inspector. It shows how the person, account, devices, and payees connect.</p>
    <p>${ymEsc(sc.headline || "")}</p>
    <div class="ym-graph-wrap"><svg class="ym-graph" id="g" role="img" aria-label="Fraud relationship graph"></svg></div>
    <div class="ym-graph-card" id="g-ev">Click a node. Connected lines stay lit so you can see the cluster.</div>
    <h3>What an investigator should notice</h3>
    ${ymReasonList((explain.engine && explain.engine.profile_risk && explain.engine.profile_risk.reasons) || risk.factors)}
    <p><strong>Operator:</strong> ${ymEsc(sc.operator_should || "")}</p>
    ${ymAskBox()}
    ${ymTech({ profile_id: pid, nodes: (map.nodes || []).length, edges: (map.edges || []).length }, "Technical evidence")}
  `);
  if (window.ymDrawInteractiveGraph) window.ymDrawInteractiveGraph(document.getElementById("g"), map, { evidenceEl: document.getElementById("g-ev"), highlight: true });
  ymBindAsk();
}

function ymViewAch() {
  ymSetView("ACH Inspector", "Electronic bank-to-bank files", `
    <p>${ymTip("ACH")}. ATLAS reads the file with a parser — not an AI. A broken file is rejected with an exact reason.</p>
    <input type="file" id="achf" accept=".ach,.txt" />
    <p class="muted">Or load a built-in demonstration file:</p>
    <div class="ask-list">
      <button type="button" data-demo="valid_one_batch_credit">Valid credit file</button>
      <button type="button" data-demo="invalid_record_93">Broken 93-character record</button>
    </div>
    <div class="pipe" id="achp"></div>
    <div id="ach-human"></div>
    <details class="ym-tech"><summary>Technical evidence</summary><pre class="out" id="ach-out"></pre></details>
  `);
  const show = (data) => {
    const steps = ["File header", "Batch", "Entries", "Controls", data.valid ? "Accepted" : "Rejected"];
    document.getElementById("achp").innerHTML = steps.map((s) => `<span class="node">${s}</span>`).join("<span class='arrow'>→</span>");
    document.querySelectorAll("#achp .node").forEach((el) => el.classList.add("is-on"));
    const finding = (data.findings || [])[0];
    document.getElementById("ach-human").innerHTML = data.valid
      ? `<p class="allow">This file is structurally valid. Batches ${ymEsc(data.batch_count)} · entries ${ymEsc(data.entry_count)}.</p>`
      : `<p class="block">Rejected. ${ymEsc((finding && finding.code) || "The file did not match the bank-file rules.")}</p>`;
    document.getElementById("ach-out").textContent = JSON.stringify({ valid: data.valid, findings: data.findings, batch_count: data.batch_count, entry_count: data.entry_count }, null, 2);
  };
  document.getElementById("achf").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append("file", file);
    const resp = await fetch(ymApiUrl("/files/ach/parse"), { method: "POST", headers: ymAuth(), body: fd });
    show(await resp.json());
  });
  document.querySelectorAll("[data-demo]").forEach((btn) => {
    btn.addEventListener("click", async () => show(await ymApi("/proof/ach-demo/" + btn.dataset.demo)));
  });
}

async function ymViewTrace(id) {
  const decisionId = id || YM_STATE.decisionId;
  ymSetView("TRACE", "Replay the exact decision", `
    <p>${ymTip("TRACE")}. If a payment was just evaluated, ATLAS can run the same inputs through the same rules again.</p>
    <form class="stack" id="tr">
      <label>Decision to replay <input name="decision_id" value="${ymEsc(decisionId)}" placeholder="Evaluate a payment first if this is empty" /></label>
      <button type="submit">Replay</button>
    </form>
    <div class="timeline" id="tr-human"></div>
    <div id="tr-out"></div>
  `);
  document.getElementById("tr").addEventListener("submit", async (e) => {
    e.preventDefault();
    const did = new FormData(e.target).get("decision_id");
    if (!did) {
      document.getElementById("tr-out").innerHTML = "<p class='hold'>Evaluate a payment in the simulator first, then replay it here.</p>";
      return;
    }
    YM_STATE.decisionId = did;
    ymPersist();
    const proof = await ymApi("/proof/decisions/" + did);
    const replay = await ymApi("/proof/decisions/" + did + "/replay", { method: "POST" });
    const d = proof.decision || proof;
    const r = replay.replayed || replay;
    const match = replay.match === true || d.score === r.score;
    document.getElementById("tr-human").innerHTML = `
      <li>Original decision: score ${ymEsc(d.score)} · ${ymEsc(d.disposition)}</li>
      <li>Replay using the same rules: score ${ymEsc(r.score)} · ${ymEsc(r.disposition)}</li>
      <li class="${match ? "allow" : "block"}">${match ? "MATCH — ATLAS reconstructed the same decision." : "The replay did not match. See technical evidence."}</li>
    `;
    document.getElementById("tr-out").innerHTML = ymTech({ proof, replay }, "Technical evidence");
  });
}

async function ymViewSources() {
  const data = await ymApi("/proof/source-health");
  ymSetView("Where the information comes from", "Nothing here is a live bank", `
    <div class="portal-grid">${(data.sources || []).map((s) => `
      <article class="portal portal--atlas portal--source ym-card">
        <span class="portal-ring" aria-hidden="true"></span>
        <span class="portal-orbit" aria-hidden="true"></span>
        <span class="portal-core">
          <span class="pill pill-syn">${ymEsc(s.mode)}</span>
          <span class="portal-title">${ymEsc(s.provider_name)}</span>
          <span class="portal-sub"><b>${ymEsc(s.status)}</b></span>
          <span class="portal-sub">${ymEsc(s.limitations)}</span>
        </span>
      </article>`).join("")}</div>
  `);
}

function ymViewNew() {
  ymSetView("New profile", "Still synthetic", `
    <p class="muted">This builds another made-up customer. It does not open a real bank account.</p>
    <form class="stack" id="np">
      <label>Full name <input name="display_name" required /></label>
      <label>City <input name="address" placeholder="Austin, TX" /></label>
      <label>Email <input name="email" type="email" /></label>
      <label>Account tenure (days) <input name="account_tenure_days" type="number" value="400" /></label>
      <label>Typical monthly inflow (cents) <input name="monthly_inflow_minor" type="number" value="500000" /></label>
      <label>Typical monthly outflow (cents) <input name="monthly_outflow_minor" type="number" value="320000" /></label>
      <button type="submit">Build profile</button>
    </form>
    <div class="timeline" id="build"></div>
  `);
  document.getElementById("np").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    ["account_tenure_days", "monthly_inflow_minor", "monthly_outflow_minor"].forEach((k) => { body[k] = Number(body[k]); });
    const out = await ymApi("/profiles", { method: "POST", json: body });
    ymSelectProfile(out.id);
    document.getElementById("build").innerHTML = ["Input accepted", "Sensitive fields tokenized when present", "Customer record created", "Risk calculated"].map((s) => `<li>✓ ${s}</li>`).join("");
    location.hash = "#/workspace/" + out.id;
  });
}

let YM_ROUTE_SEQ = 0;

async function ymRoute() {
  const seq = ++YM_ROUTE_SEQ;
  const stale = () => seq !== YM_ROUTE_SEQ;
  const ok = await ymEnsureSession();
  if (stale()) return;
  if (!ok) {
    ymSetView("ATLAS synthetic demo", "Sign in", `<p>Use <code>yoga</code> / <code>yoga</code>. This demo has no real customers or money.</p>`);
    return;
  }
  try {
    if (!YM_STATE.scenarios.length) await ymLoadScenarios();
  } catch (err) {
    if (stale()) return;
    ymSetView("ATLAS", "Could not load scenarios", `<p class="block">${ymEsc(err.message)}</p>`);
    return;
  }
  if (stale()) return;
  const h = ymHash();
  try {
    if (h.view === "story") {
      if (window.ymViewStory) await window.ymViewStory(h.id);
      else ymViewHome();
    } else if (h.view === "workspace") await ymViewWorkspace(h.id);
    else if (h.view === "new") ymViewNew();
    else if (h.view === "pay") await ymViewPay(h.id);
    else if (h.view === "ach") ymViewAch();
    else if (h.view === "fraud") await ymViewFraud(h.id);
    else if (h.view === "trace") await ymViewTrace(h.id);
    else if (h.view === "sources") await ymViewSources();
    else if (h.view === "proof") {
      if (window.ymViewProof) await window.ymViewProof();
    } else if (h.view === "profiles") await ymViewProfiles();
    else ymViewHome();
  } catch (err) {
    if (stale()) return;
    ymSetView("ATLAS", "Something went wrong", `<p class="block">${ymEsc(err.message)}</p>`);
  }
}

document.getElementById("login-form").addEventListener("submit", (ev) => {
  ymLogin(ev).catch((e) => { document.getElementById("login-status").textContent = e.message; });
});
document.getElementById("btn-guided").addEventListener("click", () => { location.hash = "#/story"; });
window.addEventListener("hashchange", ymRoute);
ymApplyBrandChrome();