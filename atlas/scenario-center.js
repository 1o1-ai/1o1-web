/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

function ymRunnerBand(ym_score) {
  const ym_value = Number(ym_score || 0);
  if (ym_value >= 80) return "CRITICAL";
  if (ym_value >= 60) return "HIGH";
  if (ym_value >= 40) return "ELEVATED";
  if (ym_value >= 25) return "WATCH";
  return "LOW";
}

function ymRunnerFactorRows(ym_factors, ym_limit) {
  return (ym_factors || [])
    .slice()
    .sort((ym_a, ym_b) => Math.abs(Number(ym_b.contribution || 0)) - Math.abs(Number(ym_a.contribution || 0)))
    .slice(0, ym_limit || 5);
}

function ymRunnerFactorsHtml(ym_factors) {
  const ym_rows = ymRunnerFactorRows(ym_factors, 5);
  if (!ym_rows.length) return "<p class=\"muted\">No adverse factor changed this assessment.</p>";
  return `<ul class="ym-runner-findings">${ym_rows.map((ym_factor) => {
    const ym_up = Number(ym_factor.contribution || 0) > 0;
    return `<li class="${ym_up ? "is-adverse" : "is-protective"}">
      <span aria-hidden="true">${ym_up ? "▲" : "▼"}</span>
      <span><strong>${ymEsc(ym_factor.reason_code || ym_factor.factor_code)}</strong><small>${ymEsc(ym_factor.plain || "")}</small></span>
      <b>${ym_up ? "+" : ""}${ymEsc(ym_factor.contribution)}</b>
    </li>`;
  }).join("")}</ul>`;
}

function ymRunnerMetric(ym_label, ym_value, ym_detail) {
  return `<div class="ym-runner-metric">
    <span>${ymEsc(ym_label)}</span>
    <strong>${ymEsc(ym_value)}</strong>
    ${ym_detail ? `<small>${ymEsc(ym_detail)}</small>` : ""}
  </div>`;
}

function ymRunnerSignalsVisual(ym_items, ym_core_label) {
  return `<div class="ym-runner-orbit" aria-label="${ymEsc(ym_core_label)}">
    <div class="ym-runner-orbit__core"><span>ATLAS</span><strong>${ymEsc(ym_core_label)}</strong></div>
    <div class="ym-runner-orbit__signals">${ym_items.map((ym_item, ym_index) => `
      <span class="ym-runner-signal" style="--ym-index:${ym_index}">${ymEsc(ym_item)}</span>`).join("")}</div>
  </div>`;
}

function ymRunnerPolicyVisual(ym_context) {
  const ym_profile = ym_context.profileRisk || {};
  const ym_transaction = ym_context.transactionRisk || {};
  const ym_policy = ym_context.policy || {};
  return `<div class="ym-decision-hierarchy" aria-label="ATLAS decision hierarchy">
    <article>
      <span>1 · Customer assessment</span>
      <strong>${ymEsc(ymRunnerBand(ym_profile.score))}</strong>
      <small>Profile risk ${ymEsc(ym_profile.score)} · ${ymEsc(ym_profile.disposition)}</small>
    </article>
    <span class="ym-hierarchy-arrow" aria-hidden="true">→</span>
    <article>
      <span>2 · Transaction assessment</span>
      <strong>${ymEsc(ymRunnerBand(ym_transaction.score))}</strong>
      <small>Transaction risk ${ymEsc(ym_transaction.score)} · ${ymEsc(ym_transaction.disposition)}</small>
    </article>
    <span class="ym-hierarchy-arrow" aria-hidden="true">→</span>
    <article class="is-final">
      <span>3 · Final payment decision</span>
      <strong>${ymEsc(ym_policy.final_disposition || ym_transaction.disposition)}</strong>
      <small>${ymEsc(ym_policy.payment_outcome || "")}</small>
    </article>
  </div>`;
}

function ymRunnerTechnicalHref(ym_stage, ym_context) {
  const ym_route = ym_stage.technical_route;
  if (ym_route === "workspace" || ym_route === "pay" || ym_route === "fraud") {
    return `#/${ym_route}/${encodeURIComponent(ym_context.sc.profile_id)}`;
  }
  if (ym_route === "trace") {
    return `#/trace/${encodeURIComponent(ym_context.decisionId || "")}`;
  }
  return `#/${ym_route || "technical"}`;
}

function ymRunnerStageModel(ym_stage, ym_context) {
  const ym_sc = ym_context.sc;
  const ym_profile = ym_context.profile || {};
  const ym_version = ym_profile.current_version || {};
  const ym_profile_risk = ym_context.profileRisk || {};
  const ym_transaction = ym_context.transactionRisk || {};
  const ym_policy = ym_context.policy || {};
  const ym_payment_fixture = ym_sc.payment || {};
  const ym_explain = (ym_context.explain || {}).engine || {};
  const ym_profile_plain = (ym_explain.profile_risk || {}).plain || {};
  const ym_transaction_plain = (ym_explain.transaction_risk || {}).plain || {};
  const ym_observations = (ym_context.evidence || {}).observations || [];
  const ym_conflicts = (ym_context.evidence || {}).conflicts || [];
  const ym_map = ym_context.map || {};
  const ym_trace = ym_context.trace || {};
  const ym_replay = ym_context.replay || {};
  const ym_replayed = ym_replay.replayed || {};
  const ym_outcome_payment = (ym_context.outcome || {}).payment || ym_context.payment || {};
  const ym_stage_index = (ym_sc.stages || []).findIndex((ym_item) => ym_item.id === ym_stage.id);
  const ym_next_stage = (ym_sc.stages || [])[ym_stage_index + 1];
  const ym_common = {
    doing: ym_stage.doing,
    matters: ym_stage.matters,
    next: ym_next_stage ? `Next: ${ym_next_stage.name}.` : "The scenario is complete. Inspect any technical module or replay the demonstration.",
  };

  if (ym_stage.id === "scenario") {
    return {
      ...ym_common,
      using: ["Synthetic persona", "Business question", "Proposed payment instruction"],
      found: "No decision has been revealed. ATLAS first separates the customer from the payment it has been asked to assess.",
      visual: ymRunnerSignalsVisual(
        [ym_sc.short_name, ymMoney(ym_payment_fixture.amount_minor), ym_payment_fixture.requested_rail, ym_payment_fixture.payee_name],
        "Business question",
      ),
      evidence: {
        demo_key: ym_sc.demo_key,
        scenario_name: ym_sc.scenario_name,
        business_question: ym_sc.business_question,
        synthetic: true,
        live_money: false,
      },
    };
  }

  if (ym_stage.id === "data_signals") {
    const ym_source_labels = (ym_sc.data_sources || []).map((ym_source) => ym_source.replace(/^synthetic-/, ""));
    return {
      ...ym_common,
      using: (ym_sc.data_sources || []).concat(["MAP relationships", "Source provenance"]),
      found: `${ym_observations.length} source observations, ${(ym_map.nodes || []).length} relationship nodes, and ${ym_conflicts.length} open evidence conflict${ym_conflicts.length === 1 ? "" : "s"} are available to this execution.`,
      visual: ymRunnerSignalsVisual(ym_source_labels.concat(["MAP graph"]), "Reconcile evidence"),
      evidence: {
        source_ids: ym_sc.data_sources,
        observation_count: ym_observations.length,
        conflict_count: ym_conflicts.length,
        fact_labels: (ym_context.evidence || {}).labels,
        graph_node_count: (ym_map.nodes || []).length,
        graph_edge_count: (ym_map.edges || []).length,
      },
    };
  }

  if (ym_stage.id === "customer_profile") {
    return {
      ...ym_common,
      using: ["Identity confidence", "Financial stability", "Payment reliability", "Historical behavior"],
      found: `Customer/Profile Risk is ${ymRunnerBand(ym_profile_risk.score)} (${ym_profile_risk.score}, ${ym_profile_risk.disposition}). ${ym_profile_plain.headline || ""}`,
      visual: `<div class="ym-runner-metrics">
        ${ymRunnerMetric("Customer/Profile Risk", `${ym_profile_risk.score} · ${ymRunnerBand(ym_profile_risk.score)}`, ym_profile_risk.disposition)}
        ${ymRunnerMetric("Identity confidence", ym_version.identity_confidence ?? "—", "Historical identity evidence")}
        ${ymRunnerMetric("Financial stability", ym_version.financial_stability ?? "—", "Income and balance behavior")}
        ${ymRunnerMetric("Payment reliability", ym_version.payment_reliability ?? "—", "Returns and completion history")}
      </div>${ymRunnerFactorsHtml(ym_profile_risk.factors)}`,
      evidence: {
        decision_type: "PROFILE",
        score: ym_profile_risk.score,
        band: ymRunnerBand(ym_profile_risk.score),
        disposition: ym_profile_risk.disposition,
        identity_confidence: ym_version.identity_confidence,
        financial_stability: ym_version.financial_stability,
        payment_reliability: ym_version.payment_reliability,
        factors: ymRunnerFactorRows(ym_profile_risk.factors, 6),
      },
    };
  }

  if (ym_stage.id === "payment_instruction") {
    const ym_intent = ym_context.intent || {};
    return {
      ...ym_common,
      using: ["Amount in integer minor units", "Rail and speed", "Beneficiary reference", "Purpose", "Payload digest"],
      found: `ATLAS created canonical PaymentIntent ${ym_intent.id || "—"} for ${ymMoney(ym_intent.amount_minor)} by ${ym_intent.requested_rail || "AUTO"}.`,
      visual: `<div class="ym-payment-intent-card">
        <span class="pill pill-engine">CANONICAL PAYMENTINTENT</span>
        <strong>${ymMoney(ym_intent.amount_minor)}</strong>
        <span>to ${ymEsc((ym_intent.payee || {}).name || ym_payment_fixture.payee_name)}</span>
        <div><b>${ymEsc(ym_intent.requested_rail)}</b><b>${ymEsc(ym_intent.speed || "STANDARD")}</b><b>${ymEsc(ym_intent.purpose)}</b></div>
        <small>Created as DRAFT · payload protected by digest · synthetic only</small>
      </div>`,
      evidence: {
        intent_id: ym_intent.id,
        amount_minor: ym_intent.amount_minor,
        currency: ym_intent.currency,
        requested_rail: ym_intent.requested_rail,
        speed: ym_intent.speed,
        purpose: ym_intent.purpose,
        payee_name: (ym_intent.payee || {}).name,
        payload_digest: ym_intent.payload_digest,
        initial_state: (ym_context.createdPayment || {}).state,
      },
    };
  }

  if (ym_stage.id === "transaction_analysis") {
    return {
      ...ym_common,
      using: ["Amount anomaly", "Device familiarity", "Beneficiary familiarity", "Velocity", "Returns", "Rail finality", "Relationship graph"],
      found: `Transaction Risk is ${ymRunnerBand(ym_transaction.score)} (${ym_transaction.score}, ${ym_transaction.disposition}). ${ym_transaction_plain.headline || ""}`,
      visual: `<div class="ym-transaction-focus">
        ${ymRunnerMetric("Customer/Profile Risk", `${ym_profile_risk.score} · ${ymRunnerBand(ym_profile_risk.score)}`, "Historical customer assessment")}
        <span class="ym-not-equal" aria-label="is assessed separately from">≠</span>
        ${ymRunnerMetric("Transaction Risk", `${ym_transaction.score} · ${ymRunnerBand(ym_transaction.score)}`, "This payment only")}
      </div>${ymRunnerFactorsHtml(ym_transaction.factors)}`,
      evidence: {
        decision_type: "TRANSACTION",
        score: ym_transaction.score,
        band: ymRunnerBand(ym_transaction.score),
        disposition: ym_transaction.disposition,
        policy_set_id: ym_transaction.policy_set_id,
        policy_version: ym_transaction.policy_version,
        factors: ymRunnerFactorRows(ym_transaction.factors, 8),
      },
    };
  }

  if (ym_stage.id === "policy_decision") {
    return {
      ...ym_common,
      using: ["Transaction assessment", "Policy thresholds", "Triggered deterministic rules", "Policy and feature versions"],
      found: `Final Payment Decision: ${ym_policy.final_disposition || ym_transaction.disposition}. ${ym_policy.required_next_action || ""}`,
      visual: `${ymRunnerPolicyVisual(ym_context)}
        <div class="ym-policy-ledger">
          <span>Policy</span><strong>${ymEsc(ym_policy.policy_set_id || ym_transaction.policy_set_id)} v${ymEsc(ym_policy.policy_version || ym_transaction.policy_version)}</strong>
          <span>Triggered rules</span><strong>${ymEsc((ym_policy.triggered_rules || []).length)}</strong>
          <span>Decision authority</span><strong>Deterministic rules</strong>
          <span>AI authority</span><strong>Explanation only</strong>
        </div>`,
      evidence: ym_policy,
    };
  }

  if (ym_stage.id === "human_control") {
    const ym_needs_checker = Boolean(ym_policy.maker_checker_required);
    const ym_is_blocked = ym_policy.final_disposition === "BLOCK_REVIEW";
    const ym_control_result = ym_is_blocked
      ? "The payment is rejected before routing. No creator or AI can self-approve it out of the terminal review state."
      : ym_needs_checker
        ? "An authorized independent approver is required; the creating operator is prohibited from approving this high-risk payment."
        : "This disposition does not require a human approval gate, but role checks, audit, and AI isolation still apply.";
    return {
      ...ym_common,
      using: ["Authenticated actor role", "Payment creator", "Disposition", "Dual-control configuration"],
      found: ym_control_result,
      visual: `<div class="ym-control-gate">
        <div><span>Maker</span><strong>Creates instruction</strong></div>
        <span aria-hidden="true">→</span>
        <div class="${ym_needs_checker || ym_is_blocked ? "is-locked" : "is-open"}"><span>Policy gate</span><strong>${ymEsc(ym_policy.final_disposition)}</strong></div>
        <span aria-hidden="true">→</span>
        <div><span>${ym_needs_checker ? "Independent checker" : ym_is_blocked ? "Investigator" : "State machine"}</span><strong>${ym_needs_checker ? "Required" : ym_is_blocked ? "Review only" : "Continues"}</strong></div>
      </div>
      <p class="ym-boundary-note"><strong>AI boundary:</strong> AI can explain and recommend. It cannot approve, override policy, release, or move money.</p>`,
      evidence: {
        human_review_required: ym_policy.human_review_required,
        approval_path_available: ym_policy.approval_path_available,
        maker_checker_required: ym_policy.maker_checker_required,
        creator_prohibited_from_approval: ym_policy.creator_prohibited_from_approval,
        ai_authoritative: ym_policy.ai_authoritative,
        current_user_role: YM_STATE.role,
      },
    };
  }

  if (ym_stage.id === "payment_outcome") {
    const ym_outcome_text = ym_context.outcomePending
      ? "ATLAS is applying the policy gate to the simulator…"
      : `${ym_policy.payment_outcome || "Policy applied"}. Current payment state: ${ym_outcome_payment.state || ym_policy.payment_state || "—"}.`;
    const ym_events = ((ym_context.paymentRecord || {}).events || []).map((ym_event) => ym_event.event_type);
    return {
      ...ym_common,
      using: ["Final disposition", "Payment state machine", "Simulation adapter", "No-live-money boundary"],
      found: ym_outcome_text,
      visual: `<div class="ym-state-flow">
        ${["DRAFT", "VALIDATED", "RISK_EVALUATING", ym_policy.payment_state, ym_outcome_payment.state]
          .filter((ym_state, ym_index, ym_all) => ym_state && ym_all.indexOf(ym_state) === ym_index)
          .map((ym_state) => `<span class="${ym_state === ym_outcome_payment.state ? "is-current" : ""}">${ymEsc(ym_state)}</span>`)
          .join("<b aria-hidden=\"true\">→</b>")}
      </div><p class="ym-boundary-note">Simulation only. No live rail or money movement is available.</p>`,
      evidence: {
        disposition: ym_policy.final_disposition,
        policy_outcome: ym_policy.payment_outcome,
        required_next_action: ym_policy.required_next_action,
        payment_state: ym_outcome_payment.state || ym_policy.payment_state,
        blocked_reason: (ym_context.outcome || {}).blocked_reason,
        event_types: ym_events,
        live_money: false,
      },
    };
  }

  if (ym_stage.id === "trace") {
    const ym_decision = ym_trace.decision || {};
    const ym_match = ym_replay.match === true
      || (ym_decision.score === ym_replayed.score && ym_decision.disposition === ym_replayed.disposition);
    return {
      ...ym_common,
      using: ["Persisted input digest", "Feature-set version", "Policy version", "Deterministic replay"],
      found: ym_match
        ? `TRACE replay matched: ${ym_replayed.score} and ${ym_replayed.disposition} were reproduced from the persisted inputs.`
        : "TRACE replay did not produce a verified match. Inspect the technical evidence.",
      visual: `<div class="ym-trace-replay">
        <article><span>Persisted</span><strong>${ymEsc(ym_decision.score)} · ${ymEsc(ym_decision.disposition)}</strong></article>
        <span class="${ym_match ? "is-match" : "is-mismatch"}" aria-label="${ym_match ? "matches" : "does not match"}">${ym_match ? "MATCH" : "MISMATCH"}</span>
        <article><span>Replayed</span><strong>${ymEsc(ym_replayed.score)} · ${ymEsc(ym_replayed.disposition)}</strong></article>
      </div>`,
      evidence: {
        decision_id: ym_context.decisionId,
        persisted_score: ym_decision.score,
        persisted_disposition: ym_decision.disposition,
        replayed_score: ym_replayed.score,
        replayed_disposition: ym_replayed.disposition,
        match: ym_match,
        feature_set_version: ym_decision.feature_set_version,
        policy_set_id: ym_decision.policy_set_id,
        policy_version: ym_decision.policy_version,
      },
    };
  }

  const ym_decision = ym_trace.decision || {};
  return {
    ...ym_common,
    using: ["Decision record", "Evidence provenance", "Policy declaration", "Audit and replay result", "AI isolation controls"],
    found: `PROOF links decision ${ym_context.decisionId || "—"} to ${ym_observations.length} source observations, policy ${ym_decision.policy_set_id || ym_policy.policy_set_id} v${ym_decision.policy_version || ym_policy.policy_version}, and a matching TRACE replay.`,
    visual: `<div class="ym-proof-links">
      <span>SOURCE FACTS</span><b aria-hidden="true">→</b><span>FEATURES</span><b aria-hidden="true">→</b>
      <span>POLICY</span><b aria-hidden="true">→</b><span>DECISION</span><b aria-hidden="true">→</b><span>REPLAY ✓</span>
    </div>
    <p class="ym-boundary-note"><strong>PROOF assurance:</strong> evidence-backed, replayable, synthetic, and no live money movement.</p>`,
    evidence: {
      decision_id: ym_context.decisionId,
      policy_set_id: ym_decision.policy_set_id || ym_policy.policy_set_id,
      policy_version: ym_decision.policy_version || ym_policy.policy_version,
      feature_set_version: ym_decision.feature_set_version,
      input_digest: ym_decision.input_digest,
      output_digest: ym_decision.output_digest,
      observation_count: ym_observations.length,
      audit_record_count: (ym_trace.audit || []).length,
      replay_match: ym_replay.match,
      watermark: ym_trace.watermark,
      ai_authoritative: false,
      live_money: false,
    },
  };
}

function ymRunnerSummaryHtml(ym_context, ym_step) {
  const ym_sc = ym_context.sc;
  const ym_payment = ym_sc.payment || {};
  const ym_profile_visible = ym_step >= 2;
  const ym_transaction_visible = ym_step >= 4;
  const ym_policy_visible = ym_step >= 5;
  const ym_outcome_visible = ym_step >= 7;
  const ym_profile = ym_context.profileRisk || {};
  const ym_transaction = ym_context.transactionRisk || {};
  const ym_policy = ym_context.policy || {};
  const ym_state = ((ym_context.outcome || {}).payment || ym_context.payment || {}).state;
  return `<div class="ym-runner-summary__grid">
    <div><span>Synthetic customer</span><strong>${ymEsc(ym_sc.short_name)}</strong></div>
    <div><span>Payment</span><strong>${ymMoney(ym_payment.amount_minor)} · ${ymEsc(ym_payment.requested_rail)}</strong></div>
    <div><span>Beneficiary</span><strong>${ymEsc(ym_payment.payee_name)}</strong></div>
    <div><span>Customer/Profile Risk</span><strong>${ym_profile_visible ? `${ymRunnerBand(ym_profile.score)} · ${ym_profile.score}` : "Pending"}</strong></div>
    <div><span>Transaction Risk</span><strong>${ym_transaction_visible ? `${ymRunnerBand(ym_transaction.score)} · ${ym_transaction.score}` : "Pending"}</strong></div>
    <div><span>Policy disposition</span><strong>${ym_policy_visible ? ymEsc(ym_policy.final_disposition) : "Pending"}</strong></div>
    <div><span>Payment state</span><strong>${ym_outcome_visible ? ymEsc(ym_state || ym_policy.payment_state) : "Not yet revealed"}</strong></div>
  </div>`;
}

async function ymRunnerPrepare(ym_sc) {
  const ym_profile_id = ym_sc.profile_id;
  const [ym_profile, ym_profile_risk, ym_evidence, ym_map] = await Promise.all([
    ymApi(`/profiles/${ym_profile_id}`),
    ymApi(`/profiles/${ym_profile_id}/risk`),
    ymApi(`/profiles/${ym_profile_id}/evidence`),
    ymApi(`/profiles/${ym_profile_id}/map`),
  ]);
  const ym_pay = ym_sc.payment || {};
  const ym_created = await ymApi("/payment-intents", {
    method: "POST",
    headers: { "Idempotency-Key": `scenario-${ym_sc.demo_key}-${Date.now()}` },
    json: {
      payer_profile_id: ym_profile_id,
      amount_minor: ym_pay.amount_minor,
      currency: ym_pay.currency || "USD",
      purpose: ym_pay.purpose || "demo",
      requested_rail: ym_pay.requested_rail || "ACH",
      speed: ym_pay.speed || null,
      payee: {
        name: ym_pay.payee_name,
        counterparty_id: ym_pay.counterparty_id,
      },
    },
  });
  const ym_evaluation = await ymApi(`/payment-intents/${ym_created.intent.id}/evaluate`, { method: "POST" });
  const ym_decision_id = (ym_evaluation.transaction_risk || {}).id;
  const ym_explain = await ymApi("/explain", {
    method: "POST",
    json: {
      profile_id: ym_profile_id,
      decision_id: ym_decision_id,
      intent_id: ym_created.intent.id,
      question: "Explain the customer assessment, transaction assessment, and final payment decision.",
    },
  });
  const [ym_trace, ym_replay] = await Promise.all([
    ymApi(`/proof/decisions/${ym_decision_id}`),
    ymApi(`/proof/decisions/${ym_decision_id}/replay`, { method: "POST" }),
  ]);
  const ym_actual = (ym_evaluation.policy || {}).final_disposition
    || (ym_evaluation.transaction_risk || {}).disposition;
  if (ym_sc.expected_policy_class && ym_actual !== ym_sc.expected_policy_class) {
    throw new Error(`Scenario integrity check failed: manifest expected ${ym_sc.expected_policy_class}, but policy ${ym_evaluation.policy.policy_set_id} returned ${ym_actual}.`);
  }
  YM_STATE.intentId = ym_created.intent.id;
  YM_STATE.decisionId = ym_decision_id;
  ymPersist();
  return {
    sc: ym_sc,
    profile: ym_profile,
    profileRisk: ym_evaluation.profile_risk || ym_profile_risk,
    transactionRisk: ym_evaluation.transaction_risk || {},
    policy: ym_evaluation.policy || {},
    intent: ym_created.intent,
    createdPayment: ym_created.payment,
    payment: ym_evaluation.payment,
    evidence: ym_evidence,
    map: ym_map,
    explain: ym_explain,
    trace: ym_trace,
    replay: ym_replay,
    decisionId: ym_decision_id,
    outcome: null,
    paymentRecord: null,
    outcomeStarted: false,
    outcomePending: false,
  };
}

async function ymRunnerApplyOutcome(ym_context, ym_paint) {
  if (ym_context.outcomeStarted) return;
  ym_context.outcomeStarted = true;
  ym_context.outcomePending = true;
  ym_paint();
  try {
    ym_context.outcome = await ymApi(`/payment-intents/${ym_context.intent.id}/simulate`, {
      method: "POST",
      json: {},
    });
    const ym_payment = (ym_context.outcome || {}).payment || ym_context.payment;
    if (ym_payment && ym_payment.id) {
      ym_context.paymentRecord = await ymApi(`/payments/${ym_payment.id}`);
    }
  } catch (ym_error) {
    ym_context.outcome = {
      payment: ym_context.payment,
      blocked_reason: ym_error.message,
    };
  } finally {
    ym_context.outcomePending = false;
    ym_paint();
  }
}

async function ymViewScenarioCenterStory(ym_demo_key, ym_stage_ref) {
  if (!YM_STATE.scenarios.length) await ymLoadScenarios();
  if (!ym_demo_key) {
    location.hash = "#/profiles";
    return;
  }
  const ym_sc = YM_STATE.scenarios.find((ym_item) => ym_item.demo_key === ym_demo_key);
  if (!ym_sc || !ym_sc.profile_id) {
    ymSetView("Scenario not found", "Scenario Demonstration Center", `<p class="block">This synthetic scenario is not available.</p><a class="ym-btn ghost" href="#/profiles">Return to scenarios</a>`);
    return;
  }
  ymSelectProfile(ym_sc.profile_id, ym_sc.demo_key);
  ymSetView(ym_sc.scenario_name, "Preparing authoritative ATLAS execution", `
    <span class="pill pill-syn">SYNTHETIC DEMO — NO REAL DATA OR MONEY</span>
    <div class="ym-runner-loading" role="status">
      <span class="ym-runner-loading__core">ATLAS</span>
      <p>Loading the synthetic fixture, creating the PaymentIntent, and asking the real deterministic policy engine…</p>
    </div>
  `);

  const ym_context = await ymRunnerPrepare(ym_sc);
  const ym_stages = ym_sc.stages || [];
  let ym_step = Math.max(0, ym_stages.findIndex((ym_stage) => ym_stage.id === ym_stage_ref));
  if (ym_step < 0) ym_step = 0;
  let ym_paused = false;
  let ym_timer = null;
  const ym_outcome_index = ym_stages.findIndex((ym_stage) => ym_stage.id === "payment_outcome");

  ymSetView(ym_sc.scenario_name, `${ym_sc.short_name} · Guided scenario`, `
    <section class="ym-runner" aria-label="${ymEsc(ym_sc.scenario_name)} guided demonstration">
      <div class="ym-runner-synthetic"><span class="pill pill-syn">SYNTHETIC CUSTOMER</span><strong>NO REAL DATA OR MONEY</strong></div>
      <header class="ym-runner-question">
        <span>${ymEsc(ym_sc.business_question)}</span>
        <p>${ymEsc(ym_sc.situation)}</p>
      </header>
      <aside class="ym-runner-summary" aria-label="Persistent scenario summary" id="ym-runner-summary"></aside>
      <div class="ym-runner-layout">
        <nav class="ym-runner-stepper" aria-label="Scenario stages">
          <ol>${ym_stages.map((ym_stage, ym_index) => `<li>
            <button type="button" data-ym-stage="${ym_index}">
              <span>${ym_index + 1}</span><strong>${ymEsc(ym_stage.name)}</strong>
            </button>
          </li>`).join("")}</ol>
        </nav>
        <section class="ym-runner-stage" aria-live="polite" aria-atomic="true">
          <div class="ym-runner-stage__heading">
            <span id="ym-runner-count"></span>
            <h2 id="ym-runner-title"></h2>
          </div>
          <div class="ym-runner-stage__visual" id="ym-runner-visual"></div>
          <div class="ym-runner-four">
            <article><h3>What is ATLAS doing?</h3><p id="ym-runner-doing"></p></article>
            <article><h3>What information is it using?</h3><ul id="ym-runner-using"></ul></article>
            <article><h3>What did it find?</h3><p id="ym-runner-found"></p></article>
            <article><h3>Why does this matter?</h3><p id="ym-runner-matters"></p></article>
          </div>
          <p class="ym-runner-next" id="ym-runner-next"></p>
          <details class="ym-tech">
            <summary>View technical evidence</summary>
            <pre class="out" id="ym-runner-evidence"></pre>
            <a class="ym-btn ghost" id="ym-runner-deep-link" href="#/technical">Open in Technical Explorer</a>
          </details>
        </section>
      </div>
      <div class="ym-story__controls ym-runner-controls" aria-label="Scenario playback controls">
        <button type="button" class="ym-btn ghost" id="ym-runner-back">Back</button>
        <button type="button" class="ym-cta" id="ym-runner-next-btn">Next</button>
        <button type="button" class="ym-btn ghost" id="ym-runner-pause">Pause</button>
        <button type="button" class="ym-btn ghost" id="ym-runner-replay">Replay</button>
        <button type="button" class="ym-btn syn" id="ym-runner-exit">Exit</button>
      </div>
    </section>
  `);

  const ym_stop_timer = () => {
    if (ym_timer) window.clearInterval(ym_timer);
    ym_timer = null;
  };
  window.ym_active_runner_stop = ym_stop_timer;
  const ym_start_timer = () => {
    ym_stop_timer();
    if (ymReduced() || ym_paused) return;
    ym_timer = window.setInterval(() => {
      if (ym_step < ym_stages.length - 1) {
        ym_step += 1;
        ym_paint();
      } else {
        ym_stop_timer();
      }
    }, 11000);
  };
  const ym_paint = () => {
    const ym_stage = ym_stages[ym_step];
    const ym_model = ymRunnerStageModel(ym_stage, ym_context);
    history.replaceState(
      null,
      "",
      `#/story/${encodeURIComponent(ym_context.sc.demo_key)}/${encodeURIComponent(ym_stage.id)}`
    );
    document.getElementById("ym-runner-summary").innerHTML = ymRunnerSummaryHtml(ym_context, ym_step);
    document.getElementById("ym-runner-count").textContent = `Stage ${ym_step + 1} of ${ym_stages.length}`;
    document.getElementById("ym-runner-title").textContent = ym_stage.name;
    document.getElementById("ym-runner-visual").innerHTML = ym_model.visual;
    document.getElementById("ym-runner-doing").textContent = ym_model.doing;
    document.getElementById("ym-runner-using").innerHTML = ym_model.using.map((ym_item) => `<li>${ymEsc(ym_item)}</li>`).join("");
    document.getElementById("ym-runner-found").textContent = ym_model.found;
    document.getElementById("ym-runner-matters").textContent = ym_model.matters;
    document.getElementById("ym-runner-next").textContent = ym_model.next;
    document.getElementById("ym-runner-evidence").textContent = JSON.stringify(ym_model.evidence, null, 2);
    document.getElementById("ym-runner-deep-link").href = ymRunnerTechnicalHref(ym_stage, ym_context);
    document.querySelectorAll("[data-ym-stage]").forEach((ym_button, ym_index) => {
      ym_button.classList.toggle("is-current", ym_index === ym_step);
      ym_button.classList.toggle("is-complete", ym_index < ym_step);
      if (ym_index === ym_step) ym_button.setAttribute("aria-current", "step");
      else ym_button.removeAttribute("aria-current");
    });
    document.getElementById("ym-runner-back").disabled = ym_step === 0;
    document.getElementById("ym-runner-next-btn").disabled = ym_step === ym_stages.length - 1;
    document.getElementById("ym-runner-pause").textContent = ym_paused ? "Resume" : "Pause";
    if (ym_outcome_index >= 0 && ym_step >= ym_outcome_index && !ym_context.outcomeStarted) {
      ymRunnerApplyOutcome(ym_context, ym_paint);
    }
  };

  document.querySelectorAll("[data-ym-stage]").forEach((ym_button) => {
    ym_button.addEventListener("click", () => {
      ym_step = Number(ym_button.dataset.ymStage);
      ym_paint();
    });
  });
  document.getElementById("ym-runner-back").addEventListener("click", () => {
    if (ym_step > 0) ym_step -= 1;
    ym_paint();
  });
  document.getElementById("ym-runner-next-btn").addEventListener("click", () => {
    if (ym_step < ym_stages.length - 1) ym_step += 1;
    ym_paint();
  });
  document.getElementById("ym-runner-pause").addEventListener("click", () => {
    ym_paused = !ym_paused;
    if (ym_paused) ym_stop_timer();
    else ym_start_timer();
    ym_paint();
  });
  document.getElementById("ym-runner-replay").addEventListener("click", () => {
    ym_step = 0;
    ym_paused = false;
    ym_paint();
    ym_start_timer();
  });
  document.getElementById("ym-runner-exit").addEventListener("click", () => {
    ym_stop_timer();
    location.hash = "#/profiles";
  });
  ym_paint();
  ym_start_timer();
}

window.ymViewStory = ymViewScenarioCenterStory;
window.ymRunnerBand = ymRunnerBand;
