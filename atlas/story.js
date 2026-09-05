/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

function ymReduced() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ymSleep(ms) {
  return ymReduced() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));
}

function ymStorySvg(step, ctx) {
  const name = ymEsc((ctx.sc && ctx.sc.short_name) || "Maya Chen");
  const amount = ctx.amount || "$1,850.00";
  const payee = ymEsc((ctx.sc && ctx.sc.payment && ctx.sc.payment.payee_name) || "SYNTHETIC LANDLORD");
  const pScore = ctx.pScore ?? "—";
  const tScore = ctx.tScore ?? "—";
  const disp = ymEsc(ctx.disp || "");
  const scenes = {
    0: `<circle class="ym-core-glow" cx="450" cy="160" r="70"/><circle cx="450" cy="160" r="26" fill="#7ee0ff"/><text x="450" y="166" text-anchor="middle" fill="#071018" font-size="12">ATLAS</text>
      <text x="450" y="30" text-anchor="middle" fill="#d4b46a" font-size="14">A payment intelligence demonstration</text>`,
    1: `<circle cx="160" cy="150" r="28" fill="#d4b46a" class="ym-node-pop"/><text x="200" y="155" fill="#e8eef6" font-size="16">${name}</text>
      <text x="200" y="180" fill="#8b9bb0" font-size="12">Synthetic customer — not a real person</text>
      <circle cx="520" cy="90" r="12" fill="#6fd3b0"/><text x="542" y="94" fill="#8b9bb0" font-size="12">Bank account</text>
      <circle cx="520" cy="150" r="12" fill="#e0a45c"/><text x="542" y="154" fill="#8b9bb0" font-size="12">Device</text>
      <circle cx="520" cy="210" r="12" fill="#7eb6ff"/><text x="542" y="214" fill="#8b9bb0" font-size="12">Payee</text>`,
    2: `<circle class="ym-pay-card" cx="400" cy="150" r="92"/>
      <text x="400" y="125" text-anchor="middle" fill="#d4b46a" font-size="14">Payment request</text>
      <text x="400" y="155" text-anchor="middle" fill="#e8eef6" font-size="18">${ymEsc(amount)}</text>
      <text x="400" y="180" text-anchor="middle" fill="#8b9bb0" font-size="12">to ${payee}</text>
      <path class="ym-sig gold" d="M80 150 H308"/>`,
    3: `<circle class="ym-core-glow" cx="450" cy="160" r="48"/><circle cx="450" cy="160" r="20" fill="#7ee0ff"/>
      <path class="ym-sig" d="M80 50 C180 50, 280 160, 410 160"/><text x="70" y="44" fill="#8b9bb0" font-size="11">Identity</text>
      <path class="ym-sig gold" d="M80 250 C180 250, 280 160, 410 160"/><text x="70" y="268" fill="#8b9bb0" font-size="11">Income</text>
      <path class="ym-sig risk" d="M820 50 C720 50, 620 160, 490 160"/><text x="760" y="44" fill="#8b9bb0" font-size="11">Device</text>
      <path class="ym-sig" d="M820 250 C720 250, 620 160, 490 160"/><text x="730" y="268" fill="#8b9bb0" font-size="11">Payment history</text>
      <circle class="ym-packet" cx="180" cy="70" r="4"/><circle class="ym-packet" cx="700" cy="70" r="4"/>`,
    4: `<circle class="ym-pay-card" cx="230" cy="145" r="108"/><text x="230" y="95" text-anchor="middle" fill="#7ee0ff" font-size="13">Customer &amp; bank</text>
      <text x="230" y="128" text-anchor="middle" fill="#e8eef6" font-size="13">${name}</text>
      <text x="230" y="155" text-anchor="middle" fill="#8b9bb0" font-size="11">Synthetic identity</text>
      <text x="230" y="175" text-anchor="middle" fill="#8b9bb0" font-size="11">not a live bank login</text>
      <circle class="ym-pay-card" cx="670" cy="145" r="108"/><text x="670" y="95" text-anchor="middle" fill="#d4b46a" font-size="13">Market context</text>
      <text x="670" y="128" text-anchor="middle" fill="#e8eef6" font-size="13">${ymEsc((ctx.market && ctx.market.symbol) || "SPY")}</text>
      <text x="670" y="155" text-anchor="middle" fill="#8b9bb0" font-size="11">${ymEsc((ctx.market && ctx.market.available) ? "OpenBB quote — not bank data" : "Optional — risk continues without it")}</text>
      <text x="450" y="280" text-anchor="middle" fill="#8b9bb0" font-size="11">These lanes stay separate. Market data never becomes customer identity.</text>`,
    5: `<text x="450" y="28" text-anchor="middle" fill="#8b9bb0" font-size="12">Risk factors assemble</text>
      ${(ctx.reasons || []).slice(0, 4).map((r, i) => {
        const ym_cx = 120 + i * 220;
        return `<circle cx="${ym_cx}" cy="155" r="72" fill="#102033" stroke="${Number(r.contribution) > 0 ? "#e07a7a" : "#6fd3b0"}" stroke-width="1.4"/>
      <text x="${ym_cx}" y="160" text-anchor="middle" fill="#e8eef6" font-size="11">${ymEsc((r.plain || r.reason_code || "").slice(0, 42))}</text>`;
      }).join("")}`,
    6: `<circle class="ym-pay-card" cx="200" cy="150" r="88"/>
      <text x="200" y="110" text-anchor="middle" fill="#8b9bb0" font-size="12">Customer overall</text>
      <text x="200" y="155" text-anchor="middle" fill="#6fd3b0" font-size="36" class="ym-score-anim">${ymEsc(pScore)}</text>
      <text x="200" y="185" text-anchor="middle" fill="#8b9bb0" font-size="12">profile risk</text>
      <circle class="ym-pay-card" cx="700" cy="150" r="88"/>
      <text x="700" y="110" text-anchor="middle" fill="#8b9bb0" font-size="12">This payment</text>
      <text x="700" y="155" text-anchor="middle" fill="#e0a45c" font-size="36" class="ym-score-anim">${ymEsc(tScore)}</text>
      <text x="700" y="185" text-anchor="middle" fill="#8b9bb0" font-size="12">transaction risk</text>
      <path class="ym-sig" d="M288 150 H612"/>`,
    7: `<circle class="ym-pay-card" cx="450" cy="150" r="118"/>
      <text x="450" y="120" text-anchor="middle" fill="#d4b46a" font-size="16">Decision</text>
      <text x="450" y="158" text-anchor="middle" fill="#e8eef6" font-size="20">${disp || "Evaluating"}</text>
      <text x="450" y="188" text-anchor="middle" fill="#8b9bb0" font-size="12">Rules decide. AI does not send money.</text>`,
    8: `<text x="450" y="40" text-anchor="middle" fill="#d4b46a" font-size="14">Why</text>
      ${(ctx.reasons || []).slice(0, 3).map((r, i) => `<text x="80" y="${90 + i * 50}" fill="#e8eef6" font-size="14">${i + 1}. ${ymEsc(r.plain || "")}</text>`).join("")}`,
    9: `<circle class="ym-pay-card" cx="220" cy="140" r="58"/><text x="220" y="145" text-anchor="middle" fill="#e8eef6">Request 1</text>
      <circle class="ym-pay-card" cx="480" cy="140" r="58"/><text x="480" y="145" text-anchor="middle" fill="#e8eef6">Request 2</text>
      <path class="ym-stop" d="M700 110 l40 40 m0 -40 l-40 40"/>
      <text x="450" y="240" text-anchor="middle" fill="#8b9bb0" font-size="13">The second request is recognized as the same payment.</text>`,
    10: `<text x="200" y="120" fill="#8b9bb0">Approved amount ${ymEsc(amount)}</text>
      <text x="200" y="160" fill="#e07a7a">Changed amount — ten times larger</text>
      <path class="ym-stop" d="M700 110 l40 40 m0 -40 l-40 40"/>
      <text x="450" y="230" text-anchor="middle" fill="#8b9bb0" font-size="13">ATLAS notices the change and will not silently send the new amount.</text>`,
    11: `<text x="80" y="50" fill="#d4b46a" font-size="14">TRACE replay</text>
      <text x="80" y="100" fill="#e8eef6">1. Payment requested</text>
      <text x="80" y="140" fill="#e8eef6">2. Signals gathered</text>
      <text x="80" y="180" fill="#e8eef6">3. Rules applied — score ${ymEsc(tScore)}</text>
      <text x="80" y="220" fill="#6fd3b0">4. Same result on replay</text>`,
    12: `<text x="80" y="50" fill="#d4b46a" font-size="14">PROOF</text>
      <path class="ym-link-on" d="M120 120 H300"/><circle cx="120" cy="120" r="8" fill="#7eb6ff"/><text x="320" y="124" fill="#e8eef6">Each conclusion</text>
      <path class="ym-link-on" d="M120 180 H300"/><circle cx="120" cy="180" r="8" fill="#d4b46a"/><text x="320" y="184" fill="#e8eef6">links to evidence</text>
      <path class="ym-link-on" d="M120 240 H300"/><circle cx="120" cy="240" r="8" fill="#6fd3b0"/><text x="320" y="244" fill="#e8eef6">and declared rules</text>`,
    13: `<text x="450" y="120" text-anchor="middle" fill="#e8eef6" font-size="18">You can now open the workspace</text>
      <text x="450" y="160" text-anchor="middle" fill="#8b9bb0" font-size="13">Try the other five people. Each one teaches a different idea.</text>`,
  };
  return `<svg viewBox="0 0 900 300" role="img" aria-label="Guided demonstration scene">${scenes[step] || scenes[0]}</svg>`;
}

const YM_STORY_COPY = [
  { title: "What ATLAS is", body: "ATLAS looks at a made-up customer and a made-up payment, then decides whether that payment should continue. Nothing here is real money." },
  { title: "Who the customer is", body: "Meet the synthetic customer. ATLAS already has a picture of their account, devices, and usual payees." },
  { title: "What they are trying to pay", body: "This is the proposed payment — who it is for, how much, and how it would be sent." },
  { title: "Signals flowing in", body: "Identity, account, device, income, balance, and payment-history signals move into the ATLAS core. ATLAS does not guess; it uses these records." },
  { title: "Optional market context", body: "OpenBB can add public market or economic context. That lane is not customer identity and not a bank account. If it fails, the payment decision still proceeds." },
  { title: "Risk factors assemble", body: "Each signal either increases risk, reduces risk, or leaves it alone. Together they form an assessment." },
  { title: "Two different scores", body: "Profile risk is how the customer looks overall. Transaction risk is whether this specific payment looks suspicious. They can disagree." },
  { title: "The decision", body: "ATLAS allows, watches, asks for a closer look, holds, or stops the payment. A person can still review it. AI cannot send money." },
  { title: "Why", body: "These are the strongest reasons for the decision, in ordinary language." },
  { title: "Duplicate protection", body: "If the same payment is requested twice, ATLAS recognizes it and does not create a second payment." },
  { title: "Changed amount or payee", body: "If someone changes the amount or the payee after the decision, ATLAS notices. The old approval no longer applies." },
  { title: "TRACE reconstructs the decision", body: "TRACE is a replayable record of exactly how a decision was made. The same inputs and rules produce the same result." },
  { title: "PROOF shows the evidence", body: "PROOF connects each conclusion to supporting evidence so you can see that ATLAS followed its declared rules." },
  { title: "Continue in the workspace", body: "Skip into the working screens: customer, payment, fraud graph, TRACE, and PROOF." },
];

async function ymViewStory(demoKey) {
  const key = demoKey || "persona-stable-salaried";
  if (!YM_STATE.scenarios.length) await ymLoadScenarios();
  const sc = YM_STATE.scenarios.find((s) => s.demo_key === key) || YM_STATE.scenarios[0];
  if (!sc || !sc.profile_id) {
    ymSetView("Guided story", "Choose a scenario", ymChooseScenario("Pick a synthetic customer to walk through."));
    document.querySelectorAll(".persona").forEach((el) => {
      el.addEventListener("click", () => {
        ymSelectProfile(el.dataset.id, el.dataset.key);
        location.hash = "#/story/" + el.dataset.key;
      });
    });
    return;
  }
  ymSelectProfile(sc.profile_id, sc.demo_key);
  ymSetView("Guided demo · " + sc.short_name, "Preparing the story", `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <p>ATLAS is gathering this customer's signals and evaluating the demonstration payment…</p>
  `);
  const pay = sc.payment || {};
  let evalOut = null;
  let reasons = [];
  let disp = "";
  let tScore = "—";
  let pScore = sc.profile_risk_score;
  try {
    const created = await ymApi("/payment-intents", {
      method: "POST",
      json: {
        payer_profile_id: sc.profile_id,
        amount_minor: pay.amount_minor,
        currency: "USD",
        purpose: pay.purpose || "demo",
        requested_rail: pay.requested_rail || "ACH",
        speed: pay.speed || null,
        payee: { name: pay.payee_name, counterparty_id: pay.counterparty_id },
      },
    });
    YM_STATE.intentId = created.intent.id;
    evalOut = await ymApi("/payment-intents/" + YM_STATE.intentId + "/evaluate", { method: "POST" });
    YM_STATE.decisionId = evalOut.transaction_risk && evalOut.transaction_risk.id;
    ymPersist();
    const expl = await ymApi("/explain", { method: "POST", json: { profile_id: sc.profile_id, decision_id: YM_STATE.decisionId, intent_id: YM_STATE.intentId } });
    reasons = (expl.engine && expl.engine.transaction_risk && expl.engine.transaction_risk.reasons) || [];
    disp = (expl.engine && expl.engine.transaction_risk && expl.engine.transaction_risk.plain && expl.engine.transaction_risk.plain.headline) || (evalOut.transaction_risk || {}).disposition;
    tScore = (evalOut.transaction_risk || {}).score;
    pScore = (evalOut.profile_risk || {}).score;
  } catch (err) {
    reasons = [];
    disp = "Could not evaluate in this session";
  }
  let market = { available: false, symbol: "SPY", separated_from_customer_identity: true, separated_from_bank_data: true };
  try {
    market = await ymApi("/market/context?symbol=SPY");
  } catch (err) {
    market = { available: false, symbol: "SPY", note: "optional market context did not load; risk decision continues", separated_from_customer_identity: true, separated_from_bank_data: true };
  }
  const ctx = { sc, amount: ymMoney(pay.amount_minor), reasons, disp, tScore, pScore, market };
  let step = 0;
  let paused = false;
  let timer = null;
  const copy = YM_STORY_COPY.map((c, i) => {
    if (i === 1) return { ...c, body: (sc.goal || c.body) + " " + (sc.headline || "") };
    if (i === 2) return { ...c, body: `${sc.short_name} wants to send ${ymMoney(pay.amount_minor)} to ${pay.payee_name}. ${pay.requested_rail === "ACH" ? "ACH is an electronic bank-to-bank payment." : "This uses a simulated instant or same-day rail."}` };
    if (i === 7) return { ...c, body: disp + " " + (sc.operator_should || c.body) };
    if (i === 8) return { ...c, body: reasons.slice(0, 3).map((r) => r.plain).join(" ") || c.body };
    return c;
  });

  const paint = () => {
    const c = copy[step];
    document.getElementById("ym-story-stage").innerHTML = ymStorySvg(step, ctx);
    document.getElementById("ym-story-title").textContent = c.title;
    document.getElementById("ym-story-body").textContent = c.body;
    document.querySelectorAll(".ym-dots button").forEach((b, i) => b.classList.toggle("on", i === step));
    document.getElementById("btn-pause").textContent = paused ? "Resume" : "Pause";
  };

  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
  const startTimer = () => {
    stopTimer();
    if (ymReduced() || paused) return;
    timer = setInterval(() => { if (step < copy.length - 1) { step += 1; paint(); } else stopTimer(); }, 7000);
  };

  ymSetView("Guided demo · " + sc.short_name, "You control the pace", `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <div class="ym-story">
      <div class="ym-story__stage" id="ym-story-stage"></div>
      <div class="ym-story__copy">
        <h2 id="ym-story-title"></h2>
        <p id="ym-story-body"></p>
        <p class="ym-term"><b>ACH</b> — an electronic bank-to-bank payment. <b>TRACE</b> — a replayable record of exactly how a decision was made. <b>PROOF</b> — evidence that ATLAS followed its declared rules.</p>
      </div>
      <div class="ym-story__controls">
        <button type="button" class="ym-cta" id="btn-start" style="width:auto">Start</button>
        <button type="button" class="ym-btn ghost" id="btn-back">Back</button>
        <button type="button" class="ym-btn ghost" id="btn-next">Next</button>
        <button type="button" class="ym-btn ghost" id="btn-pause">Pause</button>
        <button type="button" class="ym-btn ghost" id="btn-replay">Replay</button>
        <button type="button" class="ym-btn syn" id="btn-skip">Skip to workspace</button>
        <button type="button" class="ym-btn ghost" id="btn-exit">Exit story</button>
        <div class="ym-dots">${copy.map((_, i) => `<button type="button" data-i="${i}" aria-label="Scene ${i + 1}"></button>`).join("")}</div>
      </div>
    </div>
  `);
  paint();
  document.getElementById("btn-start").addEventListener("click", () => { step = 0; paused = false; paint(); startTimer(); });
  document.getElementById("btn-next").addEventListener("click", () => { if (step < copy.length - 1) step += 1; paint(); });
  document.getElementById("btn-back").addEventListener("click", () => { if (step > 0) step -= 1; paint(); });
  document.getElementById("btn-pause").addEventListener("click", () => { paused = !paused; if (paused) stopTimer(); else startTimer(); paint(); });
  document.getElementById("btn-replay").addEventListener("click", () => { step = 0; paused = false; paint(); startTimer(); });
  document.getElementById("btn-skip").addEventListener("click", () => { stopTimer(); location.hash = "#/workspace/" + sc.profile_id; });
  document.getElementById("btn-exit").addEventListener("click", () => { stopTimer(); location.hash = "#/home"; });
  document.querySelectorAll(".ym-dots button").forEach((b) => b.addEventListener("click", () => { step = Number(b.dataset.i); paint(); }));
  if (!ymReduced()) startTimer();
}

window.ymViewStory = ymViewStory;
window.ymReduced = ymReduced;
window.ymSleep = ymSleep;
