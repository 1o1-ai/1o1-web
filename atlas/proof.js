/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

function ymReduced() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ymSleep(ms) {
  return ymReduced() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));
}

async function ymLightPipe(selector, delay) {
  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i += 1) {
    nodes.forEach((el, idx) => el.classList.toggle("is-on", idx <= i));
    await ymSleep(delay);
  }
  if (ymReduced()) nodes.forEach((el) => el.classList.add("is-on"));
}

async function ymViewProof() {
  const [ym_ov, ym_q] = await Promise.all([
    ymApi("/proof/overview"),
    ymApi("/proof/questions"),
  ]);
  const ym_tests = ym_ov.tests || {};
  const ym_parser = ym_ov.parser || {};
  ymSetView("ATLAS PROOF", "Evidence that ATLAS followed its rules", `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <p class="proof-hero">PROOF is evidence that ATLAS followed its declared rules — not a marketing claim.</p>
    <p>Click a question. Each answer is built from live ATLAS records. AI did not invent these results, and AI cannot move money.</p>
    <p class="muted">ACH parser ${ymEsc(ym_parser.parser_version)} · valid demo files ${ymEsc(ym_parser.valid_count)} · invalid demo files ${ymEsc(ym_parser.invalid_count)} · AI does not parse ACH files</p>
    <p class="muted">${ymEsc(ym_tests.label)}${ym_tests.available ? ` · passed ${ym_tests.passed} failed ${ym_tests.failed}` : ""}</p>
    <div class="proof-q" id="pq">
      ${(ym_q.questions || []).map((q) => `<button type="button" class="portal portal--atlas portal--compact" data-id="${ymEsc(q.id)}">
        <span class="portal-ring" aria-hidden="true"></span>
        <span class="portal-orbit" aria-hidden="true"></span>
        <span class="portal-core"><span class="portal-title">${ymEsc(q.title)}</span></span>
      </button>`).join("")}
    </div>
    <div id="proof-stage" class="atlas-view" aria-live="polite"></div>
  `);
  document.querySelectorAll("#pq button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll("#pq button").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      await ymRunProof(btn.dataset.id);
    });
  });
}

async function ymRunProof(id) {
  const stage = document.getElementById("proof-stage");
  const run = {
    provenance: ymProofProvenance,
    score: ymProofPreflight,
    ai: ymProofAi,
    ach: ymProofAchValid,
    parser: ymProofParser,
    conflict: ymProofConflict,
    freshness: ymProofSources,
    tamper: ymProofTamper,
    duplicate: ymProofIdempotency,
    approver: ymProofMaker,
    timeout: ymProofTimeout,
    replay: ymProofReplay,
    tokenize: ymProofTokenize,
    whatif: ymProofWhatIf,
  }[id] || ymProofProvenance;
  stage.innerHTML = "<p class='muted'>Loading live ATLAS state…</p>";
  try {
    await run(stage);
  } catch (err) {
    stage.innerHTML = `<p class="block">${ymEsc(err.message)}</p>`;
  }
}

async function ymProofProvenance(stage) {
  const list = await ymApi("/profiles");
  const p = list.profiles.find((x) => x.demo_key === "persona-stable-salaried") || list.profiles[0];
  const chain = await ymApi("/proof/provenance/" + p.id);
  const steps = chain.chain || [];
  stage.innerHTML = `
    <h3>Provenance</h3>
    <p class="muted">Profile ${ymEsc(p.display_name)} · version ${ymEsc(chain.profile_version_id)} · score ${ymEsc(chain.score)}</p>
    <div class="pipe" id="prov">${steps.map((s, i) => `<span class="node" data-i="${i}">${ymEsc(s)}</span><span class="arrow">↓</span>`).join("")}</div>
    <p id="prov-d" class="muted">Click a node for evidence.</p>
    <ul>${(chain.nodes || []).slice(0, 8).map((n) => `<li><span class="pill">${ymEsc(n.kind)}</span> ${ymEsc(n.source)} · ${ymEsc(n.fact_type)} · evidence ${ymEsc(n.evidence_id)}</li>`).join("")}</ul>
  `;
  await ymLightPipe("#prov .node", 180);
  document.querySelectorAll("#prov .node").forEach((el) => {
    el.addEventListener("click", () => {
      const n = (chain.nodes || [])[Number(el.dataset.i)] || chain.nodes[0];
      document.getElementById("prov-d").textContent = JSON.stringify(n || chain.nodes[0], null, 2);
    });
  });
}

async function ymProofTokenize(stage) {
  stage.innerHTML = `
    <h3>Tokenization boundary</h3>
    <p class="muted">Synthetic demo value only. Raw digits are not sent to an LLM.</p>
    <div class="pipe" id="tok">
      <span class="node">123456789012</span><span class="arrow">↓</span>
      <span class="node">********9012</span><span class="arrow">↓</span>
      <span class="node">acct_&lt;opaque&gt;</span>
    </div>
    <p>RAW INPUT BOUNDARY → TOKENIZATION → DATABASE / AGENT SAFE CONTEXT</p>
    <p class="muted">Agent context may include account_token, account_masked, derived features — never the raw value.</p>
  `;
  await ymLightPipe("#tok .node", 220);
}

async function ymProofAi(stage) {
  const cap = await ymApi("/capabilities");
  stage.innerHTML = `
    <h3>AI isolation</h3>
    <div class="pipe" id="ai">
      <span class="node">NEXUS / AGENT recommend HOLD</span><span class="arrow">↓</span>
      <span class="node">DETERMINISTIC BOUNDARY</span><span class="arrow">↓</span>
      <span class="node">GUARD ${ymEsc(cap.policy_set_id)}</span><span class="arrow">↓</span>
      <span class="node">AUTHORIZATION GATE</span>
    </div>
    <p><strong>LLM CAN:</strong> ${(cap.llm_can || []).map(ymEsc).join(" · ")}</p>
    <p><strong>LLM CANNOT:</strong> ${(cap.llm_cannot || []).map(ymEsc).join(" · ")}</p>
    <p class="muted">money_movement=${ymEsc(cap.money_movement)} · llm_authoritative_scoring=${ymEsc(cap.llm_authoritative_scoring)}</p>
  `;
  await ymLightPipe("#ai .node", 200);
}

async function ymSelectPersona(demoKey) {
  const list = await ymApi("/profiles");
  return list.profiles.find((x) => x.demo_key === demoKey) || list.profiles[0];
}

async function ymProofPreflight(stage) {
  const priya = await ymSelectPersona("persona-ato");
  const created = await ymApi("/payment-intents", {
    method: "POST",
    json: {
      payer_profile_id: priya.id,
      amount_minor: 2500000,
      currency: "USD",
      purpose: "vendor_payment",
      requested_rail: "RTP",
      speed: "INSTANT",
      payee: { name: "SYNTHETIC LANDLORD", counterparty_id: "cp_priya_new_landlord" },
    },
  });
  const intent = created.intent.id;
  const ev = await ymApi("/payment-intents/" + intent + "/evaluate", { method: "POST" });
  const tr = ev.transaction_risk || {};
  YM_STATE.intentId = intent;
  YM_STATE.decisionId = tr.id;
  const factors = tr.factors || [];
  stage.innerHTML = `
    <h3>Fraud pre-flight · ${ymEsc(priya.display_name)}</h3>
    <p class="muted">$25,000 instant · SYNTHETIC</p>
    <div class="pipe" id="sig">
      <span class="node allow">Established identity</span>
      <span class="node allow">Long tenure</span>
      <span class="node allow">Stable payroll</span>
      <span class="node block">New device</span>
      <span class="node block">New / elevated beneficiary</span>
      <span class="node block">Credential change</span>
      <span class="node block">Amount anomaly</span>
    </div>
    <div class="ledger" id="led">
      ${factors.map((f) => `<div><span>${ymEsc(f.factor_code)}</span><span>${ymEsc(f.contribution)}</span></div>`).join("")}
      <div><strong>TRANSACTION SCORE</strong><strong>${ymEsc(tr.score)}</strong></div>
      <div><span>Disposition</span><span>${ymEsc(tr.disposition)}</span></div>
    </div>
    <p class="muted">decision ${ymEsc(tr.id)} · policy ${ymEsc(tr.policy_set_id)} v${ymEsc(tr.policy_version)} · digest ${ymEsc(ev.payment && ev.payment.payload_digest)}</p>
  `;
  await ymLightPipe("#sig .node", 160);
}

async function ymProofAchValid(stage) {
  const parsed = await ymApi("/proof/ach-demo/valid_one_batch_credit");
  stage.innerHTML = `
    <h3>ACH deconstruction</h3>
    <div class="pipe" id="achp">
      ${["File Header","Batch Header","Entry","Addenda","Batch Control","File Control","Padding"].map((s) => `<span class="node">${s}</span>`).join("<span class='arrow'>↓</span>")}
    </div>
    <p>94-character records · batches ${ymEsc(parsed.batch_count)} · entries ${ymEsc(parsed.entry_count)} · hash ${ymEsc(parsed.entry_hash)}</p>
    <p>debit ${ymEsc(parsed.total_debit_minor)} · credit ${ymEsc(parsed.total_credit_minor)} · blocking ${ymEsc(parsed.block_count)} · parser ${ymEsc(parsed.parser_version)}</p>
    <pre class="out">${ymEsc(JSON.stringify(parsed.batches, null, 2))}</pre>
  `;
  await ymLightPipe("#achp .node", 140);
}

async function ymProofParser(stage) {
  const st = await ymApi("/proof/parser-status");
  const bad = await ymApi("/proof/ach-demo/invalid_record_93");
  const f = (bad.findings || [])[0] || {};
  stage.innerHTML = `
    <h3>Parser conformance</h3>
    <p>ATLAS ACH Parser ${ymEsc(st.parser_version)} · LLM parsing NO</p>
    <p>VALID CORPUS ${ymEsc(st.valid_count)} · INVALID CORPUS ${ymEsc(st.invalid_count)}</p>
    <p>${ymEsc((st.tests || {}).label)}</p>
    <h4>Malformed example: 93-character record</h4>
    <p>RECORD ${ymEsc(f.record_number)} · expected ${ymEsc(f.expected)} · actual ${ymEsc(f.actual_safe)}</p>
    <p class="block">✕ ${ymEsc(f.code)} · FILE REJECTED=${ymEsc(!bad.valid)}</p>
    <label>Other invalid corpus
      <select id="bad-sel">${(st.invalid_corpus || []).map((n) => `<option>${ymEsc(n)}</option>`).join("")}</select>
    </label>
    <pre class="out" id="bad-out"></pre>
  `;
  document.getElementById("bad-sel").addEventListener("change", async (e) => {
    const out = await ymApi("/proof/ach-demo/" + e.target.value);
    document.getElementById("bad-out").textContent = JSON.stringify(out.findings, null, 2);
  });
}

async function ymProofConflict(stage) {
  const alex = await ymSelectPersona("persona-identity-conflict");
  const ev = await ymApi("/profiles/" + alex.id + "/evidence");
  stage.innerHTML = `
    <h3>Conflicting sources · ${ymEsc(alex.display_name)}</h3>
    <p class="muted">LOW DATA CONFIDENCE — conflicts are retained, never silently overwritten.</p>
    <pre class="out">${ymEsc(JSON.stringify({ conflicts: ev.conflicts, observation_count: (ev.observations || []).length }, null, 2))}</pre>
  `;
}

async function ymProofSources(stage) {
  const health = await ymApi("/proof/source-health");
  stage.innerHTML = `<h3>Source health / freshness</h3>
    <div class="portal-grid">${(health.sources || []).map((s) => `
      <article class="portal portal--atlas portal--source persona">
        <span class="portal-ring" aria-hidden="true"></span>
        <span class="portal-orbit" aria-hidden="true"></span>
        <span class="portal-core">
          <span class="pill">${ymEsc(s.mode)}</span>
          <span class="portal-title">${ymEsc(s.provider_name)}</span>
          <span class="portal-sub"><b>${ymEsc(s.status)}</b> · ${ymEsc(s.read_write_capability || "READ")}</span>
          <span class="portal-sub">${ymEsc(s.limitations)}</span>
        </span>
      </article>`).join("")}</div>`;
}

async function ymProofTamper(stage) {
  const priya = await ymSelectPersona("persona-ato");
  const created = await ymApi("/payment-intents", {
    method: "POST",
    json: {
      payer_profile_id: priya.id,
      amount_minor: 2500000,
      requested_rail: "RTP",
      speed: "INSTANT",
      payee: { name: "SYNTHETIC LANDLORD", counterparty_id: "cp_priya_new_landlord" },
    },
  });
  const intent = created.intent.id;
  await ymApi("/payment-intents/" + intent + "/evaluate", { method: "POST" });
  let approve;
  try {
    approve = await ymApi("/payment-intents/" + intent + "/approve", { method: "POST" });
  } catch (e) {
    approve = { note: String(e) };
  }
  const oldDigest = (approve.payment || created.payment || {}).approved_payload_digest
    || (created.payment || {}).payload_digest;
  let tamper;
  try {
    tamper = await ymApi("/payment-intents/" + intent + "/simulate", {
      method: "POST",
      json: { mutated_intent: { amount_minor: 25000000 } },
    });
  } catch (e) {
    tamper = { error: String(e) };
  }
  stage.innerHTML = `
    <h3>Payment tamper</h3>
    <p>$25,000 → $250,000</p>
    <p>OLD DIGEST ${ymEsc(oldDigest)}</p>
    <pre class="out">${ymEsc(JSON.stringify(tamper, null, 2))}</pre>
  `;
}

async function ymProofIdempotency(stage) {
  const maya = await ymSelectPersona("persona-stable-salaried");
  const key = "DEMO-INV-98217-" + Date.now();
  const body = {
    payer_profile_id: maya.id,
    amount_minor: 12000,
    requested_rail: "ACH",
    payee: { name: "SYNTHETIC VENDOR", counterparty_id: "cp_idemp" },
  };
  const first = await fetch(ymApiUrl("/payment-intents"), {
    method: "POST",
    headers: { ...ymAuth(), "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  }).then((r) => r.json());
  const second = await fetch(ymApiUrl("/payment-intents"), {
    method: "POST",
    headers: { ...ymAuth(), "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  }).then((r) => r.json());
  const thirdResp = await fetch(ymApiUrl("/payment-intents"), {
    method: "POST",
    headers: { ...ymAuth(), "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify({ ...body, amount_minor: 99000 }),
  });
  const third = await thirdResp.json();
  stage.innerHTML = `
    <h3>Idempotency</h3>
    <p>Key ${ymEsc(key)}</p>
    <p>First ${ymEsc((first.intent || first.payment || {}).id)}</p>
    <p>Second same id ${ymEsc((second.intent || second.payment || {}).id)}</p>
    <p>Third status ${ymEsc(thirdResp.status)} ${ymEsc(JSON.stringify(third.error || third))}</p>
  `;
}

async function ymProofMaker(stage) {
  const priya = await ymSelectPersona("persona-ato");
  const created = await ymApi("/payment-intents", {
    method: "POST",
    json: {
      payer_profile_id: priya.id,
      amount_minor: 2500000,
      requested_rail: "RTP",
      speed: "INSTANT",
      payee: { name: "SYNTHETIC LANDLORD", counterparty_id: "cp_priya_new_landlord" },
    },
  });
  const intent = created.intent.id;
  await ymApi("/payment-intents/" + intent + "/evaluate", { method: "POST" });
  const makerTry = await fetch(ymApiUrl("/payment-intents/" + intent + "/approve"), {
    method: "POST",
    headers: ymAuth(),
  });
  const checker = await fetch(ymApiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "ap-1", password: "atlas-test-password" }),
  }).then((r) => r.json());
  const ok = await fetch(ymApiUrl("/payment-intents/" + intent + "/approve"), {
    method: "POST",
    headers: { Authorization: "Bearer " + checker.access_token },
  });
  stage.innerHTML = `
    <h3>Maker / checker</h3>
    <p>Actor A operator create → approve: ${ymEsc(makerTry.status)} ${makerTry.status === 403 ? "DENIED" : ""}</p>
    <p>Actor B approver: ${ymEsc(ok.status)} ${ok.ok ? "MAKER ✓ CHECKER ✓" : ""}</p>
  `;
}

async function ymProofTimeout(stage) {
  const maya = await ymSelectPersona("persona-stable-salaried");
  const created = await ymApi("/payment-intents", {
    method: "POST",
    json: {
      payer_profile_id: maya.id,
      amount_minor: 8000,
      requested_rail: "ACH",
      payee: { name: "SYNTHETIC PAYROLL", counterparty_id: "cp_payroll" },
    },
  });
  const intent = created.intent.id;
  const ev = await ymApi("/payment-intents/" + intent + "/evaluate", { method: "POST" });
  if (["STEP_UP_REQUIRED", "HELD"].includes((ev.payment || {}).state)) {
    const tok = await fetch(ymApiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "ap-1", password: "atlas-test-password" }),
    }).then((r) => r.json());
    await fetch(ymApiUrl("/payment-intents/" + intent + "/approve"), {
      method: "POST",
      headers: { Authorization: "Bearer " + tok.access_token },
    });
  }
  const sim = await ymApi("/payment-intents/" + intent + "/simulate", { method: "POST", json: { force_timeout: true } });
  stage.innerHTML = `
    <h3>Provider timeout</h3>
    <p><strong>${ymEsc((sim.payment || {}).state)}</strong></p>
    <p>${ymEsc(sim.note || "DO NOT BLIND RETRY")}</p>
    <pre class="out">${ymEsc(JSON.stringify({ payment_id: (sim.payment || {}).id, provider_ref: (sim.payment || {}).provider_payment_ref }, null, 2))}</pre>
  `;
}

async function ymProofReplay(stage) {
  if (!YM_STATE.decisionId) await ymProofPreflight(stage);
  const proof = await ymApi("/proof/decisions/" + YM_STATE.decisionId);
  const replay = await ymApi("/proof/decisions/" + YM_STATE.decisionId + "/replay", { method: "POST" });
  const match = (proof.decision || proof).score === (replay.replayed || replay).score;
  stage.innerHTML = `
    <h3>TRACE replay</h3>
    <p>persisted ${(proof.decision || proof).score} / ${(proof.decision || proof).disposition}</p>
    <p>replayed ${(replay.replayed || replay).score} / ${(replay.replayed || replay).disposition}</p>
    <p>${match ? "MATCH ✓" : "compare fields in JSON"}</p>
    <pre class="out">${ymEsc(JSON.stringify({ proof, replay }, null, 2))}</pre>
  `;
}

async function ymProofWhatIf(stage) {
  if (!YM_STATE.decisionId) await ymProofPreflight(stage);
  const out = await ymApi("/risk/what-if", {
    method: "POST",
    json: { decision_id: YM_STATE.decisionId, overrides: { amount_minor: 250000 } },
  });
  stage.innerHTML = `
    <h3>What-if</h3>
    <p class="pill">SIMULATION — NOT AUTHORITATIVE PAYMENT DECISION</p>
    <p>CURRENT ${ymEsc(out.current && out.current.score)} ${ymEsc(out.current && out.current.disposition)}</p>
    <p>WHAT-IF ${ymEsc(out.what_if && out.what_if.score)} ${ymEsc(out.what_if && out.what_if.disposition)}</p>
    <pre class="out">${ymEsc(JSON.stringify(out.changed_inputs, null, 2))}</pre>
  `;
}

window.ymViewProof = ymViewProof;
