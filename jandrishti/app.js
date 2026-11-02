/* Brahmexa JanDrishti — buildless constituency dashboard.
 * Data lives in ./data; nothing here is a source of truth for a fact.
 * Routes: #/state · #/ac/<n>[/<module>][?j=<jurisdiction>]
 */
(() => {
  'use strict';

  // Stamped with the git commit by scripts/deploy-jandrishti.sh so code and data URLs change together.
  const BUILD = 'executive-ui-1';
  // Data is served only by the JanDrishti API Worker, behind sign-in (apps/jandrishti/api).
  const API = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8792' : 'https://jandrishti-api.brahmexa.com';
  const SESSION_KEY = 'jandrishti_session';

  const MODULES = [
    { id: 'overview', label: 'Overview', ico: '◉' },
    { id: 'people', label: 'People & elections', ico: '◎', intro: 'Aggregate electoral and population records. Electors, votes and Census population are separate concepts and are never added together. No individual voter data is stored or shown.' },
    { id: 'projects', label: 'Projects & funds', ico: '◌', intro: 'Every public work from tender to maintenance. A tender is not an award, and an award is not spend — each stage needs its own record.' },
    { id: 'cleanliness', label: 'Cleanliness & environment', ico: '✳', intro: 'Service evidence and repeat-location tracking. No cleanliness score is computed: there is no defined method or current input data yet.' },
    { id: 'health', label: 'Healthcare', ico: '✚', intro: 'Facility directory from published sources. Staffing, capacity, hours and stock need department confirmation.' },
    { id: 'education', label: 'Education', ico: '⌑', intro: 'Institutions and programmes at aggregate level only. Named student records never enter this dashboard.' },
    { id: 'infrastructure', label: 'Water, roads & housing', ico: '⌂', intro: 'Asset and works register across the municipal wards and three gram panchayats.' },
    { id: 'issues', label: 'Public issues', ico: '✉', intro: 'One accountable issue register for MLA-office intake and agency follow-up. No real register is connected yet — every issue below is MOCK.' },
    { id: 'reach', label: 'REACH · Public Service Updates', ico: '✦', intro: 'DEMO ONLY. Simulated Facebook and Instagram pages for factual, nonpartisan public-service updates. Nothing is connected to Meta; publish and schedule only change this browser’s demo state.' },
    { id: 'sources', label: 'Sources & freshness', ico: '↗', intro: 'Every non-mock value traces to a record here: publisher, exact URL, reference date, geography, retrieval date, verification and refresh cadence.' }
  ];

  const STATUS = {
    'Verified': { cls: 'st-verified', def: 'Re-read against the primary source on the retrieval date, with arithmetic checks where possible.' },
    'Source-reported': { cls: 'st-source', def: 'Stated by an official or corroborated source; not independently confirmed in the field.' },
    'Historical': { cls: 'st-historical', def: 'Accurate for a past reference period (e.g. Census 2011) — not a current value.' },
    'Estimated': { cls: 'st-estimated', def: 'Derived by a stated method from other figures.' },
    'Mock': { cls: 'st-mock', def: 'Invented demo data. Never use for decisions.' },
    'Needs confirmation': { cls: 'st-confirm', def: 'Secondary source, contradiction, or unreachable primary — confirm before use.' }
  };

  const STALE_DAYS = 90;
  const NEWS_REFRESH_MS = 4 * 60 * 60 * 1000;
  const NEWS_AUTO_KEY = 'jandrishti_news_auto_refresh';
  let newsTimerStarted = false;
  const S = { seats: [], seatMeta: {}, sources: {}, sourceMeta: {}, profiles: {}, route: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- helpers ----------
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => typeof n === 'number' ? n.toLocaleString('en-IN') : esc(n);
  const inr = n => '₹' + Number(n).toLocaleString('en-IN');
  const val = f => f.unit && f.unit.startsWith('INR') ? inr(f.value) : fmt(f.value);
  const badge = st => `<span class="badge ${(STATUS[st] || STATUS['Needs confirmation']).cls}" title="${esc((STATUS[st] || {}).def)}">${esc(st === 'Mock' ? 'MOCK' : st)}</span>`;
  const statusOf = r => r.mock ? 'Mock' : r.status;
  const daysSince = iso => Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00+05:30')) / 864e5));
  const modLabel = id => (MODULES.find(m => m.id === id) || {}).label || id;

  function freshness(src) {
    if (!src) return '';
    const d = daysSince(src.retrieved);
    const dead = /^unavailable/.test(src.availability);
    const stale = d > STALE_DAYS || /not re-checked/.test(src.availability);
    const cls = dead ? 'dead' : stale ? 'stale' : '';
    const txt = dead ? 'URL unavailable' : stale ? (d > STALE_DAYS ? `stale · ${d} d` : 'not re-checked') : `checked ${d === 0 ? 'today' : d + ' d ago'}`;
    return `<span class="fresh ${cls}"><i></i>${esc(txt)}</span>`;
  }

  function srcLink(id, label) {
    const s = S.sources[id];
    if (!s) return '';
    return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(label || s.publisher)} ↗</a>`;
  }

  function href(ac, module, j) {
    let h = `#/ac/${ac}`;
    if (module && module !== 'overview') h += `/${module}`;
    if (j) h += `?j=${encodeURIComponent(j)}`;
    return h;
  }

  function toast(t) {
    const el = $('#toast');
    el.textContent = t;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ---------- session ----------
  class AuthError extends Error {}
  let memorySession = null;
  function session() {
    let v = memorySession;
    try { v = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') || v; } catch (e) { /* storage blocked */ }
    return v && v.expires > Date.now() ? v : null;
  }
  function saveSession(v) {
    memorySession = v;
    try { v ? localStorage.setItem(SESSION_KEY, JSON.stringify(v)) : localStorage.removeItem(SESSION_KEY); } catch (e) { /* in-memory only */ }
  }

  // ---------- data ----------
  async function getJSON(name) {
    const s = session();
    if (!s) throw new AuthError('Sign in required');
    const r = await fetch(`${API}/data/${name}?v=${BUILD}`, { cache: 'no-cache', headers: { Authorization: `Bearer ${s.token}` } });
    if (r.status === 401) throw new AuthError('Session expired — please sign in again');
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return r.json();
  }

  async function profile(ac) {
    if (!(ac in S.profiles)) {
      S.profiles[ac] = S.seatMeta.onboarded.includes(ac) ? await getJSON(`ac/${ac}.json`) : null;
    }
    return S.profiles[ac];
  }

  // Every record in a profile that a user can open, with a uniform shape.
  function records(p) {
    const out = [];
    p.facts.forEach(f => out.push({ kind: 'fact', ...f }));
    p.projects.forEach(r => out.push({ kind: 'project', label: r.title, ...r }));
    p.facilities.forEach(r => out.push({ kind: 'facility', label: r.name, ...r }));
    p.issues.forEach(r => out.push({ kind: 'issue', label: r.title, status: 'Mock', ...r }));
    p.programme_claims.forEach((r, i) => out.push({ kind: 'claim', id: `claim-${i}`, label: r.topic, ...r }));
    return out;
  }
  const findRecord = (p, id) => records(p).find(r => r.id === id);
  const inJ = (r, j) => !j || !r.jurisdiction || r.jurisdiction === j;

  // ---------- drawer ----------
  function openDrawer(html) {
    $('#drawerContent').innerHTML = html;
    const m = $('#detailMask');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    $('#drawerClose').focus();
  }
  function closeDrawer() {
    const m = $('#detailMask');
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  }

  function sourceBlock(id, title = 'Source') {
    const s = S.sources[id];
    if (!s) return `<div class="drawer-block"><h4>${esc(title)}</h4><div>No source — ${badge('Mock')} record.</div></div>`;
    return `<div class="drawer-block"><h4>${esc(title)}</h4>
      <dl class="kv">
        <dt>Publisher</dt><dd>${esc(s.publisher)}</dd>
        <dt>Record</dt><dd>${esc(s.record_title)}</dd>
        <dt>URL</dt><dd>${srcLink(id, s.url)}</dd>
        <dt>Reference date</dt><dd>${esc(s.reference_date)}</dd>
        <dt>Geography</dt><dd>${esc(s.geography)}</dd>
        <dt>Kind</dt><dd>${esc(s.kind)}</dd>
        <dt>Retrieved</dt><dd>${esc(s.retrieved)} ${freshness(s)}</dd>
        <dt>Availability</dt><dd>${esc(s.availability)}</dd>
        <dt>Verification</dt><dd>${esc(s.verification)}</dd>
        <dt>Refresh</dt><dd>${esc(s.refresh_cadence)}</dd>
        <dt>Caveats</dt><dd>${esc(s.caveats)}</dd>
      </dl></div>`;
  }

  function recordDrawer(p, r) {
    const st = statusOf(r);
    const rows = [];
    if (r.kind === 'fact') {
      rows.push(['Value', `${val(r)} ${esc(r.unit || '')}`], ['Period', r.period], ['Geography', r.geography]);
      if (r.method) rows.push(['Method', r.method]);
    }
    if (r.kind === 'project') {
      rows.push(['Agency', r.agency], ['Stage', `${r.stage}${r.stage_date ? ' · ' + r.stage_date : ''}`]);
      if (r.scheme) rows.push(['Scheme', r.scheme]);
      if (r.tender_id) rows.push(['Tender ID', r.tender_id]);
      if (r.wards) rows.push(['Wards', r.wards.join(', ')]);
      if (r.estimated_value) rows.push(['Estimated value', inr(r.estimated_value) + ' (put to tender)']);
      if (r.progress != null) rows.push(['Progress', `${r.progress}% (MOCK)`]);
    }
    if (r.kind === 'facility') {
      rows.push(['Type', r.type], ['Address', r.address]);
      (r.contacts || []).forEach(([k, v]) => rows.push([k, v]));
    }
    if (r.kind === 'issue') rows.push(['Workflow status', r.workflow_status || 'Not recorded'], ['Priority', r.priority], ['Owner', r.owner], ['Opened', r.opened], ['Signal sources', (r.source_channels || []).join(' · ') || 'Not recorded'], ['Evidence state', r.evidence_status || 'Not recorded']);
    const j = p.jurisdictions.find(x => x.id === r.jurisdiction);
    if (j) rows.push(['Jurisdiction', j.name]);
    rows.push(['Module', modLabel(r.module)]);

    openDrawer(`
      <h2 id="drawerTitle">${esc(r.label)}</h2>
      <div>${badge(st)} <span class="pill">${esc(r.kind)}</span></div>
      ${st === 'Mock' ? `<div class="notice">⚠ MOCK — invented demo record. It does not describe a real complaint, work or service. Replace with a verified register entry.</div>` : ''}
      ${r.claim ? `<div class="drawer-block"><h4>Exact claim from the source</h4><blockquote>${esc(r.claim)}</blockquote></div>` : ''}
      ${r.detail ? `<div class="drawer-block"><h4>Detail</h4><div>${esc(r.detail)}</div></div>` : ''}
      <div class="drawer-block"><h4>Record</h4><dl class="kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
      ${r.items ? `<div class="drawer-block"><h4>Line items</h4><ul>${r.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>` : ''}
      ${r.unknown ? `<div class="drawer-block"><h4>Not yet evidenced</h4><div>${r.unknown.map(esc).join(' · ')}</div></div>` : ''}
      ${r.caveat ? `<div class="drawer-block"><h4>Caveat</h4><div>${esc(r.caveat)}</div></div>` : ''}
      ${sourceBlock(r.source)}
      ${(r.corroboration || []).map(c => `<div class="drawer-block"><h4>Corroboration</h4><div>${srcLink(c, S.sources[c]?.publisher)} — ${esc(S.sources[c]?.verification || '')}</div></div>`).join('')}
      <div class="drawer-block"><h4>Status definition</h4><div>${esc((STATUS[st] || {}).def)}</div></div>`);
  }

  function sourceDrawer(p, id) {
    const s = S.sources[id];
    const used = p ? records(p).filter(r => r.source === id || (r.corroboration || []).includes(id)) : [];
    openDrawer(`
      <h2 id="drawerTitle">${esc(s.record_title)}</h2>
      <div>${freshness(s)}</div>
      ${sourceBlock(id, 'Source record')}
      <div class="drawer-block"><h4>Values derived from this source (${used.length})</h4>
        ${used.length ? `<ul>${used.map(r => `<li>${badge(statusOf(r))} ${esc(r.label)}${r.kind === 'fact' ? ' — ' + val(r) + ' ' + esc(r.unit || '') : ''}</li>`).join('')}</ul>` : '<div>None in this constituency profile.</div>'}
      </div>`);
  }

  function wardDrawer(p, ward) {
    const w = p.ward_population.rows.find(r => r[0] === ward);
    const works = p.projects.filter(x => (x.wards || []).includes(ward));
    const share = (w[1] / p.ward_population.totals[0] * 100).toFixed(1);
    openDrawer(`
      <h2 id="drawerTitle">Ward ${ward} · Uttarpara-Kotrung</h2>
      <div>${badge('Historical')} <span class="pill">Census 2011</span></div>
      <div class="drawer-block"><h4>Population (Census 2011)</h4><dl class="kv">
        <dt>Total</dt><dd>${fmt(w[1])} (${share}% of municipality)</dd><dt>Male</dt><dd>${fmt(w[2])}</dd><dt>Female</dt><dd>${fmt(w[3])}</dd>
        <dt>Females per 1,000 males</dt><dd>${Math.round(w[3] / w[2] * 1000)} <small class="muted">(computed)</small></dd></dl></div>
      <div class="drawer-block"><h4>Works referencing this ward (${works.length})</h4>
        ${works.length ? `<ul>${works.map(x => `<li>${badge(statusOf(x))} ${esc(x.title)} — ${esc(x.stage)}${x.estimated_value ? ', lot ' + inr(x.estimated_value) : ''}</li>`).join('')}</ul>` : '<div>No sourced works found for this ward yet.</div>'}
      </div>
      <div class="drawer-block"><h4>Not available at ward level yet</h4><div>Current population · electors by polling station · service registers · complaint history · ward councillor contact.</div></div>
      ${sourceBlock(p.ward_population.source)}`);
  }

  function jurisdictionDrawer(p, id) {
    const j = p.jurisdictions.find(x => x.id === id);
    const rs = records(p).filter(r => r.jurisdiction === id);
    const pop = j.population;
    openDrawer(`
      <h2 id="drawerTitle">${esc(j.name)}</h2>
      <div><span class="pill">${esc(j.type)}</span> ${badge(j.membership.status)} <small class="muted">part of AC 185</small></div>
      <div class="drawer-block"><h4>Population</h4><div>${fmt(pop.value)} · ${esc(pop.period)} ${badge(pop.status)}${pop.scope_note ? `<br><b>Scope:</b> ${esc(pop.scope_note)}` : ''}</div></div>
      <div class="drawer-block"><h4>Notes</h4><div>${esc(j.notes)}</div></div>
      <div class="drawer-block"><h4>Records for this area (${rs.length})</h4>${rs.length ? `<ul>${rs.map(r => `<li>${badge(statusOf(r))} ${esc(r.label)}</li>`).join('')}</ul>` : '<div>Nothing onboarded yet — see data gaps.</div>'}</div>
      ${sourceBlock(pop.source, 'Population source')}
      ${sourceBlock(j.membership.source, 'Membership source')}
      <div class="drawer-block"><a class="outline-btn" href="${href(p.ac, S.route.module === 'overview' ? 'people' : S.route.module, id)}">Filter dashboard to ${esc(j.short)} →</a></div>`);
  }

  // ---------- shared fragments ----------
  function metricCard(r) {
    const s = S.sources[r.source];
    return `<button class="metric" data-rec="${esc(r.id)}">
      <div class="metric-label">${esc(r.label)} ${badge(statusOf(r))}</div>
      <div class="metric-value">${val(r)}${r.unit && !r.unit.startsWith('INR') && !/persons|votes|electors/.test(r.unit) ? `<small>${esc(r.unit)}</small>` : ''}</div>
      <div class="metric-foot">${esc(r.period)} · ${esc(s ? s.publisher.split(' (')[0] : 'no source')}</div>
    </button>`;
  }

  function recordRow(r) {
    const sub = r.kind === 'project' ? `${r.agency} · ${r.stage}${r.estimated_value ? ' · ' + inr(r.estimated_value) : ''}`
      : r.kind === 'facility' ? `${r.type} · ${r.address}`
      : r.kind === 'issue' ? `${r.detail} · owner ${r.owner}`
      : r.kind === 'claim' ? r.claim
      : `${val(r)} ${r.unit || ''} · ${r.period}`;
    return `<button class="row" data-rec="${esc(r.id)}"><div><strong>${esc(r.label)}</strong><small>${esc(sub)}</small></div>
      <div class="right">${badge(statusOf(r))}${r.source ? freshness(S.sources[r.source]) : ''}</div></button>`;
  }

  function jFilter(p, module) {
    const j = S.route.j;
    return `<div class="chip-row" role="group" aria-label="Filter by local body">
      <a class="chip ${!j ? 'on' : ''}" href="${href(p.ac, module)}">All 5 areas</a>
      ${p.jurisdictions.map(x => `<a class="chip ${j === x.id ? 'on' : ''}" href="${href(p.ac, module, x.id)}">${esc(x.short)}</a>`).join('')}
    </div>`;
  }

  function crumbs(p, module) {
    const j = p.jurisdictions.find(x => x.id === S.route.j);
    return `<div class="bread"><a href="#/state">West Bengal</a><span class="sep">/</span><a href="${href(p.ac)}">${esc(p.name)} · AC ${p.ac}</a>
      ${module !== 'overview' ? `<span class="sep">/</span><b>${esc(modLabel(module))}</b>` : ''}${j ? `<span class="sep">/</span><b>${esc(j.short)}</b>` : ''}</div>`;
  }

  function gapsPanel(p, module) {
    const gaps = p.data_gaps.filter(g => !module || g.module === module);
    if (!gaps.length) return '';
    return `<div class="panel"><div class="panel-head"><div><h3>Data gaps · ${gaps.length}</h3><p>What is missing, and where to get it. A gap is not a claim that a service is absent.</p></div></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Priority</th><th>Needed</th><th>Where</th>${module ? '' : '<th>Module</th>'}</tr></thead>
      <tbody>${gaps.map(g => `<tr class="nolink"><td>${esc(g.priority)}</td><td style="white-space:normal">${esc(g.need)}</td><td style="white-space:normal">${esc(g.where)}</td>${module ? '' : `<td>${esc(modLabel(g.module))}</td>`}</tr>`).join('')}</tbody></table></div></div>`;
  }

  function sourcesPanel(p, ids, title = 'References for this view') {
    const list = [...new Set(ids)].filter(id => S.sources[id]);
    if (!list.length) return '';
    return `<div class="panel"><div class="panel-head"><div><h3>${esc(title)}</h3><p>Open the evidence record, or the original document</p></div></div>
      <div class="list">${list.map(id => { const s = S.sources[id]; return `<button class="row" data-src="${esc(id)}"><div><strong>${esc(s.record_title)}</strong><small>${esc(s.publisher)} · ${esc(s.reference_date)} · ${esc(s.kind)}</small></div><div class="right">${freshness(s)}</div></button>`; }).join('')}</div></div>`;
  }

  // ---------- landing-page models ----------
  // Service areas that compete for "needs attention". People/elections and the issue
  // channel are summarised but not ranked: they are not service areas.
  const SERVICE_AREAS = ['projects', 'cleanliness', 'health', 'education', 'infrastructure'];
  const W = { gapHigh: 3, gapMedium: 1.5, issue: { High: 3, Medium: 2, Review: 1 }, contradiction: 2, retender: 1, noCurrent: 2 };

  // Attention score per area — a stated formula over the profile, never a free-form judgement.
  function attention(p) {
    const rs = records(p);
    return SERVICE_AREAS.map(id => {
      const inArea = r => id === 'projects' ? (r.kind === 'project' || r.module === 'projects') : r.module === id;
      const drivers = [];
      let score = 0;
      const add = (pts, text, mock) => { score += pts; drivers.push({ pts, text, mock: !!mock }); };
      p.data_gaps.filter(g => g.module === id).forEach(g => add(g.priority === 'High' ? W.gapHigh : W.gapMedium, `Data gap (${g.priority.toLowerCase()}): ${g.need}`));
      rs.filter(r => r.kind === 'issue' && inArea(r)).forEach(r => add(W.issue[r.priority] || 1, `${r.title} — ${r.detail}`, true));
      (p.contradictions || []).filter(c => c.module === id).forEach(c => add(W.contradiction, `Contradiction: ${c.title}`));
      const retendered = new Set(rs.filter(r => r.kind === 'project' && !r.mock && inArea(r) && /2nd call/i.test(r.stage)).map(r => r.source));
      retendered.forEach(s => add(W.retender, `Tender re-issued (2nd call); award not evidenced — ${S.sources[s]?.record_title || s}`));
      const current = rs.some(r => inArea(r) && !r.mock && ['Verified', 'Source-reported'].includes(r.status));
      if (!current) add(W.noCurrent, 'No current sourced record — only historical or no data');
      drivers.sort((a, b) => b.pts - a.pts);
      return { id, score, drivers, usesMock: drivers.some(d => d.mock) };
    }).sort((a, b) => b.score - a.score);
  }

  // Weighted Beta-binomial approval estimate; see approval_model.method in the profile.
  // Each parameter: prior (vote share × weight) + its own approve/disapprove feedback.
  // Overall = Σ wᵢ·meanᵢ; variance = Σ wᵢ²·varᵢ (parameters treated as independent).
  function approval(p) {
    const m = p.approval_model;
    const a0 = m.prior.share * m.prior.weight, b0 = (1 - m.prior.share) * m.prior.weight;
    const params = m.parameters.map(x => {
      const a = a0 + x.approve, b = b0 + x.disapprove;
      const mean = a / (a + b);
      const v = a * b / ((a + b) ** 2 * (a + b + 1));
      return { ...x, a, b, mean, v, n: x.approve + x.disapprove + x.neutral };
    });
    const mean = params.reduce((s, x) => s + x.weight * x.mean, 0);
    const sd = Math.sqrt(params.reduce((s, x) => s + x.weight ** 2 * x.v, 0));
    const lo = Math.max(0, mean - 1.2816 * sd), hi = Math.min(1, mean + 1.2816 * sd);
    const mock = m.real_responses === 0 || params.some(x => x.mock);
    return { m, a0, b0, params, mean, lo, hi, mock };
  }

  function sentimentPanel(p) {
    const params = p.approval_model.parameters || [];
    const counts = params.reduce((a, x) => {
      a.supportive += Number(x.approve) || 0;
      a.neutral += Number(x.neutral) || 0;
      a.concern += Number(x.disapprove) || 0;
      return a;
    }, { supportive: 0, neutral: 0, concern: 0 });
    const total = counts.supportive + counts.neutral + counts.concern;
    const pct = n => total ? (n * 100 / total).toFixed(1) : '0.0';
    const rows = params.map(x => {
      const a = Number(x.approve) || 0, n = Number(x.neutral) || 0, d = Number(x.disapprove) || 0;
      const t = a + n + d || 1;
      const ap = (a * 100 / t).toFixed(1), np = (n * 100 / t).toFixed(1), dp = (d * 100 / t).toFixed(1);
      const label = `${x.label}: supportive ${a}, neutral ${n}, concern ${d} demo responses`;
      return `<div class="mood-row">
        <span class="mood-topic">${esc(x.label)}</span>
        <span class="mood-stack" role="img" aria-label="${esc(label)}"><i class="mood-supportive" style="width:${ap}%"></i><i class="mood-neutral" style="width:${np}%"></i><i class="mood-concern" style="width:${dp}%"></i></span>
        <small>${ap}% · ${np}% · ${dp}%</small>
      </div>`;
    }).join('');
    const tableRows = params.map(x => `<tr><td>${esc(x.label)}</td><td class="num">${Number(x.approve) || 0}</td><td class="num">${Number(x.neutral) || 0}</td><td class="num">${Number(x.disapprove) || 0}</td><td>${badge('Mock')}</td></tr>`).join('');
    return `<section class="panel mood-panel" aria-labelledby="moodTitle">
      <div class="panel-head mood-head"><div><h3 id="moodTitle">Resident service sentiment ${(p.approval_model.real_responses || 0) === 0 ? '<span class="chart-demo">DEMO</span>' : ''}</h3><p>Aggregate issue-topic feedback · dashboard summary</p></div>
        <div class="mood-controls" role="group" aria-label="Sentiment display"><button type="button" class="chip on" data-sentiment-view="chart" aria-pressed="true">Chart</button><button type="button" class="chip" data-sentiment-view="table" aria-pressed="false">Table</button></div>
      </div>
      <div class="mood-kpis">
        <div><small>Supportive</small><b>${pct(counts.supportive)}%</b><i class="mood-supportive"></i></div>
        <div><small>Neutral</small><b>${pct(counts.neutral)}%</b><i class="mood-neutral"></i></div>
        <div><small>Concern</small><b>${pct(counts.concern)}%</b><i class="mood-concern"></i></div>
        <div><small>Demo response entries</small><b>${total}</b><i class="mood-total"></i></div>
      </div>
      <details class="insight-details"><summary>Sources &amp; method <span>View evidence</span></summary><dl class="chart-meta chart-meta-row">
        <dt>Date range</dt><dd>Not recorded — demo responses carry no dates</dd>
        <dt>Geography</dt><dd>Uttarpara AC 185 · no locality per response</dd>
        <dt>Sample</dt><dd>${total} topic-response entries · one person may answer several topics, so these are <b>not unique respondents</b></dd>
        <dt>Source mix</dt><dd>Demo feedback model only · citizen reports, social posts and protests are <b>not</b> counted here</dd>
        <dt>Verification</dt><dd>${badge('Mock')} ${p.approval_model.real_responses || 0} real responses</dd>
      </dl></details>
      <div id="sentimentChart" class="mood-chart"><div class="mood-legend"><span><i class="mood-supportive"></i>Supportive</span><span><i class="mood-neutral"></i>Neutral</span><span><i class="mood-concern"></i>Concern</span></div>${rows}</div>
      <div id="sentimentTable" class="table-wrap" hidden><table class="data-table"><caption class="chart-caption">Resident service sentiment by topic · ${total} demo entries ${(p.approval_model.real_responses || 0) === 0 ? '<span class="chart-demo">DEMO</span>' : ''}</caption><thead><tr><th>Service topic</th><th class="num">Supportive</th><th class="num">Neutral</th><th class="num">Concern</th><th>Data status</th></tr></thead><tbody>${tableRows}</tbody></table></div>
      <p class="demo-caption">MOCK · ${p.approval_model.real_responses || 0} real responses · synthetic topic entries, not a representative poll.</p>
      
    </section>`;
  }

  function operationsPanel(p) {
    const issues = p.issues || [];
    const actions = (p.office_actions && p.office_actions.field_actions) || [];
    const open = issues.filter(x => !['Resolved', 'Closed'].includes(x.workflow_status));
    const high = open.filter(x => x.priority === 'High').length;
    const needsCheck = open.filter(x => /pending|unverified|needs|not verified|not attached|not recorded/i.test(x.evidence_status || '')).length;
    const verifiedClosed = issues.filter(x => ['Resolved', 'Closed'].includes(x.workflow_status) && x.closure_verified).length;
    const departments = new Map();
    open.forEach(x => {
      const key = x.owner || 'Unassigned department';
      if (!departments.has(key)) departments.set(key, { name: key, issues: [], module: x.module || 'issues' });
      departments.get(key).issues.push(x);
    });
    const deptRows = [...departments.values()].map(d => {
      const urgent = d.issues.filter(x => x.priority === 'High').length;
      const channels = [...new Set(d.issues.flatMap(x => x.source_channels || []))];
      const proof = [...new Set(d.issues.map(x => x.evidence_status || 'Evidence not recorded'))];
      return `<tr><td><strong>${esc(d.name)}</strong><small>${d.issues.map(x => esc(x.title)).join('<br>')}</small></td>
        <td class="num">${d.issues.length}</td><td>${urgent ? `<span class="badge st-confirm">${urgent} high</span>` : '<span class="pill">Routine</span>'}</td>
        <td style="white-space:normal">${channels.map(esc).join(' · ') || 'Source channel missing'}<br><small>${proof.map(esc).join(' · ')}</small></td>
        <td><span class="badge st-confirm">Response SLA not measured</span><br><a href="${href(p.ac, d.module)}">Open service area →</a></td></tr>`;
    }).join('');
    const actionRows = actions.map(x => {
      const due = x.due ? new Date(x.due + 'T12:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not set';
      return `<tr><td><strong>${esc(x.worker)}</strong><small>${esc(x.role || 'Field follow-up · MOCK')}</small></td>
        <td style="white-space:normal">${esc(x.task)}<small>${esc(x.area)} · ${esc(x.department)}</small></td>
        <td>${badge('Mock')}<br>${esc(x.status)}</td><td>${esc(due)}</td>
        <td>${esc(x.evidence_status || 'Not attached')}<br><a href="${href(p.ac, x.module || 'issues')}">Open area →</a></td></tr>`;
    }).join('');
    const demo = issues.some(x => x.mock) || actions.length > 0;
    return `<section class="panel ops-panel" aria-labelledby="opsTitle">
      <div class="panel-head"><div><h3 id="opsTitle">Service delivery &amp; office follow-up</h3><p>One action register across citizen reports, field checks, social signals, protests and official service records.</p></div>${demo ? badge('Mock') : '<span class="pill">Operations</span>'}</div>
      <div class="ops-kpis">
        <div><small>Open issue clusters</small><b>${open.length}</b></div>
        <div><small>High-priority clusters</small><b>${high}</b></div>
        <div><small>Evidence to verify</small><b>${needsCheck}</b></div>
        <div><small>Field tasks assigned</small><b>${actions.length}</b></div>
        <div><small>Closures with verified proof</small><b>${verifiedClosed}</b></div>
      </div>
      <details class="insight-details"><summary>Department &amp; team queues <span>Open workspace</span></summary><div class="ops-signal-note"><strong>How signals are handled:</strong> group repeated posts and complaints into one place-based issue; preserve each source; treat social posts and protests as leads until corroborated by a field check, agency record or direct resident confirmation. A protest is an event to respond to, not a constituency-wide opinion poll.</div>
      <h4 class="ops-subhead">Department &amp; agency queue</h4>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Owner / issue cluster</th><th>Open</th><th>Priority</th><th>Signal sources / evidence</th><th>Response</th></tr></thead>
        <tbody>${deptRows || '<tr><td colspan="5">No open service clusters.</td></tr>'}</tbody></table></div>
      <h4 class="ops-subhead">Field team · assigned follow-ups</h4>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Assigned worker</th><th>Action</th><th>Status</th><th>Due</th><th>Evidence / area</th></tr></thead>
        <tbody>${actionRows || '<tr><td colspan="5">No field tasks assigned.</td></tr>'}</tbody></table></div>
      <div class="ops-measures"><strong>Department measures to build from real timestamps:</strong> acknowledgement within target · median time to resolve · closure verified by resident/field evidence · repeat reports by location · service coverage and quality. Worker view: assigned, due, updated, evidence submitted, hand-off accepted. No individual voter profiles or political-preference fields.</div>
      <div class="notice"><span>ⓘ</span><span>${demo ? 'MOCK workflow only. Current sample records do not contain reliable acknowledgement or closure timestamps, so service-level performance is not scored.' : 'Service performance is shown only where the source, period, geography and denominator are recorded.'}</span></div>
    </details></section>`;
  }

  function gauge(est) {
    const r = 44, c = 2 * Math.PI * r;
    const arc = (from, to, cls, w) => `<circle class="${cls}" cx="52" cy="52" r="${r}" fill="none" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${(to - from) * c} ${c}" stroke-dashoffset="${-from * c}"/>`;
    return `<div class="gauge" aria-hidden="true"><svg viewBox="0 0 104 104">${arc(0, 1, 'track', 9)}${arc(est.lo, est.hi, 'band', 9)}${arc(0, est.mean, 'val', 5)}</svg>
      <div class="gauge-num"><div><b>${Math.round(est.mean * 100)}%</b><small>APPROVAL</small></div></div>${est.mock ? '<span class="stamp">DEMO</span>' : ''}</div>`;
  }

  function approvalDrawer(p) {
    const e = approval(p), m = e.m, pct = x => (x * 100).toFixed(1) + '%';
    const ranked = [...e.params].sort((x, y) => y.mean - x.mean);
    openDrawer(`
      <h2 id="drawerTitle">Approval estimate · ${esc(p.representative.name)}</h2>
      <div>${badge(e.mock ? 'Mock' : 'Estimated')} <span class="pill">Weighted Bayesian model</span> <span class="pill">${e.params.length} parameters</span></div>
      ${e.mock ? `<div class="notice">⚠ <span><b>Demonstration only.</b> ${m.real_responses} real resident responses have been collected. Every parameter score below comes from a DEMO feedback sample and does not measure public opinion.</span></div>` : ''}
      <div class="drawer-block"><h4>Overall</h4><div class="calc">Estimate <b>${pct(e.mean)}</b> · approximate 80% model interval ${pct(e.lo)} – ${pct(e.hi)}</div></div>
      <div class="drawer-block"><h4>How to read this estimate</h4><ul>
        <li>It is a weighted summary of eight service and responsiveness topics. It is not the MLA’s vote share, an election forecast, or a representative poll result.</li>
        <li>For each topic, approval is calculated from approve and disapprove entries; neutral entries are excluded from this approval calculation.</li>
        <li>The 2026 winner vote share is used only as a weak starting prior, worth 20 pseudo-responses for each topic. Topic weights determine each topic’s contribution.</li>
        <li>The interval is an approximate model range based on the current assumptions. It is not a survey margin of error.</li>
      </ul></div>
      <div class="drawer-block"><h4>Parameters · highest to lowest</h4>
        <div class="params">${ranked.map(x => `<div class="param">
          <div class="param-head"><strong>${esc(x.label)}</strong><span class="param-score">${Math.round(x.mean * 100)}%</span></div>
          <div class="bar" title="${pct(x.mean)}"><span style="width:${(x.mean * 100).toFixed(1)}%"></span></div>
          <div class="param-meta">Weight ${Math.round(x.weight * 100)}% · ${x.approve} approve · ${x.disapprove} disapprove · ${x.neutral} neutral ${badge(x.mock ? 'Mock' : x.status)}</div>
          <div class="param-q">${esc(x.question)}</div>
          <div class="param-ev"><b>Evidence we hold:</b> ${esc(x.evidence)} <a href="${href(p.ac, x.module)}">Open ${esc(modLabel(x.module))} →</a></div>
        </div>`).join('')}</div></div>
      <div class="drawer-block"><h4>Method</h4><div>${esc(m.method)}</div></div>
      <div class="drawer-block"><h4>Calculation</h4><div class="calc">
        Prior per parameter: α₀ = ${m.prior.share} × ${m.prior.weight} = ${e.a0.toFixed(2)}, β₀ = ${e.b0.toFixed(2)} ${badge(m.prior.status)}<br>
        Parameter estimate = (α₀ + approve) / (α₀ + β₀ + approve + disapprove)<br>
        ${e.params.map(x => `${esc(x.label)}: ${Math.round(x.weight * 100)}% × ${pct(x.mean)}`).join('<br>')}<br>
        <b>Overall = Σ weight × estimate = ${pct(e.mean)}</b></div></div>
      <div class="drawer-block"><h4>Inputs</h4><dl class="kv"><dt>Feedback</dt><dd>${esc(m.feedback_channel)}</dd><dt>Real responses</dt><dd>${m.real_responses}</dd></dl></div>
      <div class="drawer-block"><h4>Caveat</h4><div>${esc(m.caveat)}</div></div>
      ${sourceBlock(m.prior.source, 'Prior source')}`);
  }

  function attentionDrawer(p, id) {
    const all = attention(p);
    const list = id ? all.filter(a => a.id === id) : all;
    openDrawer(`
      <h2 id="drawerTitle">${id ? esc(modLabel(id)) + ' · attention score' : 'How areas are ranked'}</h2>
      <div><span class="pill">Formula, not opinion</span></div>
      <div class="drawer-block"><h4>Scoring</h4><div>High-priority data gap +${W.gapHigh} · medium gap +${W.gapMedium} · resident issue +3 / +2 / +1 by priority (currently all MOCK) · contradiction between sources +${W.contradiction} · tender re-issued without evidenced award +${W.retender} · no current sourced record +${W.noCurrent}.</div></div>
      ${list.map(a => `<div class="drawer-block"><h4>${esc(modLabel(a.id))} · score ${a.score}</h4><ul>${a.drivers.map(d => `<li>+${d.pts} ${d.mock ? badge('Mock') + ' ' : ''}${esc(d.text)}</li>`).join('') || '<li>No drivers</li>'}</ul></div>`).join('')}
      <div class="drawer-block"><h4>Read this as</h4><div>Where the MLA office has the least evidence and the most unresolved signals. A high score is a reason to look, not proof that a service is failing.</div></div>`);
  }

  function newsAutoEnabled() {
    try { return localStorage.getItem(NEWS_AUTO_KEY) === '1'; } catch (e) { return false; }
  }

  function newsPanel() {
    const enabled = newsAutoEnabled();
    return `
      <section class="panel news-panel" id="newsPanel" aria-labelledby="newsTitle" aria-busy="true">
        <div class="panel-head news-head"><div><h3 id="newsTitle">Constituency news · Uttarpara</h3><p>Collected local coverage, official notices and live source searches for Uttarpara, Konnagar, Hindmotor and nearby localities.</p></div>
          <label class="news-switch"><input type="checkbox" id="newsAutoToggle" role="switch" ${enabled ? 'checked' : ''}><span>Auto-refresh</span><small id="newsAutoState">${enabled ? 'On · every 4 hours' : 'Off by default'}</small></label>
        </div>
        <div class="news-toolbar"><span id="newsStatus" class="muted" role="status">Loading snapshot…</span><button class="outline-btn" id="newsReload" type="button">Refresh latest snapshot</button></div>
        <div class="news-source-area"><h4>Collected sources · click to filter</h4><div id="newsSourceFilters" class="chip-row" role="group" aria-label="Filter collected news by source"></div>
          <h4>Live searches · latest matching results</h4><div id="newsLiveSources" class="chip-row" aria-label="Open source-specific locality searches"></div>
          <small class="muted">Live searches open news results restricted to one publisher and these constituency localities. They are separate from the collected snapshot.</small></div>
        <div id="newsItems" class="news-grid"><div class="empty">Loading constituency news…</div></div>
      </section>`;
  }

  function safeNewsUrl(value) {
    try { const u = new URL(value, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch (e) { return ''; }
  }

  function newsLiveSources() {
    const q = '(Uttarpara OR Konnagar OR Hindmotor OR Makhla OR Bhadrakali OR Kanaipur)';
    const sources = [
      ['ABP Ananda', 'bengali.abplive.com'],
      ['Anandabazar Patrika', 'anandabazar.com'],
      ['Public App · local', 'public.app'],
      ['Ei Samay', 'eisamay.com'],
      ['The Times of India', 'timesofindia.indiatimes.com'],
      ['India Today', 'indiatoday.in'],
      ['Zee News', 'zeenews.india.com'],
      ['Bartaman', 'bartamanpatrika.com'],
      ['Sangbad Pratidin', 'sangbadpratidin.in'],
      ['TV9 Bangla', 'tv9bangla.com'],
      ['News18 Bangla', 'bengali.news18.com'],
      ['Zee 24 Ghanta', 'zee24ghanta.com'],
      ['Republic Bangla', 'bangla.republicworld.com']
    ];
    return sources.map(([name, domain]) => {
      if (name === 'Anandabazar Patrika') return [name, 'https://www.anandabazar.com/topic/uttarpara'];
      const search = new URL('https://www.google.com/search');
      search.searchParams.set('tbm', 'nws');
      search.searchParams.set('q', `site:${domain} ${q}`);
      return [name, search.href];
    });
  }

  function renderNewsSnapshot(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const active = renderNewsSnapshot.activeFilter || 'all';
    const filtered = active === 'all' ? items : items.filter(item => item.source_id === active);
    $('#newsSourceFilters').innerHTML = `<button type="button" class="chip ${active === 'all' ? 'on' : ''}" data-news-filter="all">All collected (${items.length})</button>` + sources.map(source => {
      const count = items.filter(item => item.source_id === source.id).length;
      return `<button type="button" class="chip ${active === source.id ? 'on' : ''}" data-news-filter="${esc(source.id)}">${esc(source.publisher)} · ${count}</button>`;
    }).join('');
    $('#newsLiveSources').innerHTML = newsLiveSources().map(([name, url]) => `<a class="chip" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)} ↗</a>`).join('');
    const rows = filtered.map(item => {
      const url = safeNewsUrl(item.url);
      const rawDate = item.published_at || '';
      const date = rawDate ? (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(rawDate + 'T12:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' }) : new Date(rawDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })) : 'Date not provided';
      const isOfficial = /notice/i.test(item.section || '');
      return `<article class="news-card"><div class="news-meta"><span>${esc(item.publisher || 'News source')} · ${esc(item.section || 'News')}${isOfficial ? ' · Official notice' : ''}</span><span>${esc(date)}</span></div><h4>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(item.title || 'Untitled report')} ↗</a>` : esc(item.title || 'Untitled report')}</h4><p>${esc(item.summary || '')}</p><div class="news-localities">${(Array.isArray(item.localities) ? item.localities : []).map(x => `<span class="pill">${esc(x)}</span>`).join('')}</div></article>`;
    }).join('');
    $('#newsItems').innerHTML = rows || '<div class="empty">No recent constituency stories from this source in the collected snapshot. Try its live search above.</div>';
    const updated = data.snapshot_updated_at || data.last_checked_at;
    const checked = updated ? new Date(updated).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'unknown';
    const feedsChecked = data.last_checked_at ? new Date(data.last_checked_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'unknown';
    const failed = sources.filter(s => s.status === 'error').length;
    $('#newsStatus').textContent = `Snapshot updated ${checked} · feeds last checked ${feedsChecked}${failed ? ` · ${failed} collected source(s) unavailable` : ''}`;
    $$('#newsSourceFilters [data-news-filter]').forEach(button => button.addEventListener('click', () => {
      renderNewsSnapshot.activeFilter = button.dataset.newsFilter;
      renderNewsSnapshot(data);
    }));
  }

  async function loadNewsPanel() {
    const panel = $('#newsPanel');
    if (!panel) return;
    panel.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch(`./data/news-summary.json?refresh=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Snapshot unavailable (HTTP ${r.status})`);
      renderNewsSnapshot(await r.json());
    } catch (err) {
      $('#newsItems').innerHTML = `<div class="empty"><strong>News snapshot unavailable</strong>${esc(err.message)}. Use Refresh latest snapshot to try again.</div>`;
      $('#newsStatus').textContent = 'Could not read the latest snapshot';
    } finally {
      panel.setAttribute('aria-busy', 'false');
    }
  }

  // ---------- views ----------
  function overview(p) {
    const est = approval(p);
    const ranks = attention(p);
    const top = ranks.slice(0, 3);
    const rs = records(p);
    const evidence = id => {
      const mr = rs.filter(r => id === 'projects' ? (r.kind === 'project' || r.module === 'projects') : r.module === id);
      for (const st of ['Verified', 'Source-reported', 'Historical']) if (mr.some(r => !r.mock && r.status === st)) return badge(st);
      return mr.length ? badge('Mock') : '<span class="badge st-confirm">No data</span>';
    };
    const keyLine = (id, s) => {
      const f = s.key && p.facts.find(x => x.id === s.key);
      if (f) return `<div class="key"><b>${val(f)}</b> ${esc(f.unit.startsWith('INR') ? 'tendered' : f.unit)}</div>`;
      if (id === 'issues') return `<div class="key"><b>${fmt(p.mock_totals.open_issues)}</b> open issues ${badge('Mock')}</div>`;
      if (id === 'infrastructure') return `<div class="key"><b>${p.projects.filter(x => !x.mock && x.module === 'infrastructure').reduce((n, x) => n + x.items.length, 0)}</b> roads tendered</div>`;
      return `<div class="key">${p.data_gaps.filter(g => g.module === id).length} data gap(s) to fill</div>`;
    };

    return `${crumbs(p, 'overview')}
      <section class="hero"><div class="hero-content"><div>
        <div class="eyebrow">${esc(p.district)} · AC ${p.ac} · ${esc(p.parliamentary_constituency)} PC</div>
        <h2>${esc(p.name)}</h2><p>${esc(p.summary)}</p>
        <div class="hero-tags">
          <button class="tag" data-rec="winner-votes">MLA · ${esc(p.representative.name)} (${esc(p.representative.party)})</button>
          <button class="tag" data-rec="electors-total">${fmt(p.facts.find(f => f.id === 'electors-total').value)} electors</button>
          <span class="tag">2 municipalities · 3 gram panchayats</span>
        </div></div>
        <button class="approval" id="approvalBtn" aria-label="Approval estimate ${Math.round(est.mean * 100)} percent, ${est.mock ? 'demo inputs' : 'estimated'}. Open method.">
          ${gauge(est)}
          <div><h4>Feedback model</h4><p>View assumptions →</p>
          <div class="range">80% range ${Math.round(est.lo * 100)}–${Math.round(est.hi * 100)}%</div>
          <div class="range">${est.mock ? `${badge('Mock')} demo feedback · ${est.m.real_responses} real responses` : badge('Estimated')}</div></div>
        </button>
      </div></section>

      ${sentimentPanel(p)}
      ${window.JDCharts ? window.JDCharts.panel(chartsContext(p)) : ''}

      ${operationsPanel(p)}
      <div class="overview-secondary">

      <div class="section-title"><h3>Focus now</h3><button class="text-btn" id="rankMethod">How this is ranked →</button></div>
      <section class="concerns">${top.map((a, i) => `<a class="concern" href="${href(p.ac, a.id)}">
        <div class="rank">${i + 1}</div>
        <h4>${esc(modLabel(a.id))}</h4>
        <div class="score">Attention ${a.score}${a.usesMock ? ' · MOCK inputs' : ''}</div>
        <ul>${a.drivers.slice(0, 1).map(d => `<li>${esc(d.text.length > 92 ? d.text.slice(0, 90) + '…' : d.text)}</li>`).join('')}</ul>
      </a>`).join('')}</section>

      <div class="section-title"><h3>Explore services</h3><p>Open a service to explore</p></div>
      <section class="areas">${MODULES.filter(m => p.area_summaries[m.id]).map(m => {
        const s = p.area_summaries[m.id];
        const rank = top.findIndex(a => a.id === m.id);
        return `<a class="area-card" href="${href(p.ac, m.id)}"><div class="area-ico">${m.ico}</div><div>
          <h4>${esc(m.label)} ${evidence(m.id)}${rank >= 0 ? ` <span class="badge st-confirm">Attention #${rank + 1}</span>` : ''}</h4>
          <p>${esc(s.summary)}</p>${keyLine(m.id, s)}</div></a>`;
      }).join('')}</section>

      <div class="section-title"><h3>Local bodies</h3><p>Two municipalities and three gram panchayats · select one for its records</p></div>
      <section class="panel"><div class="bodies">${p.jurisdictions.map(j => `<button class="body-node ${j.type === 'Municipality' ? 'muni' : ''}" data-jd="${esc(j.id)}">
        <span class="circ">${esc(j.code)}</span><strong>${esc(j.short)}</strong><small>${fmt(j.population.value)} · ${esc(j.population.period)}</small></button>`).join('')}</div>
        <div class="source-note">Populations come from different sources and scopes, so they are not added up. Gram-panchayat figures are census towns only.</div></section>

${newsPanel()}
      </div>
      <p class="footer">Values marked <span class="badge st-mock">MOCK</span> are invented demo data. Every number opens its evidence · <a href="${href(p.ac, 'sources')}">Sources &amp; freshness</a></p>`;
  }

  function people(p) {
    const e = p.facts;
    const f = id => e.find(x => x.id === id);
    const el = f('electors-total').value;
    const sexBars = [['Female', f('electors-female')], ['Male', f('electors-male')], ['Third gender', f('electors-third')]];
    const w = p.ward_population;
    const maxW = Math.max(...w.rows.map(r => r[1]));
    const sort = S.route.sort || 'ward';
    const rows = [...w.rows].sort((a, b) => sort === 'pop' ? b[1] - a[1] : a[0] - b[0]);
    const pops = p.jurisdictions;
    return `
      <section class="metric-grid">${['electors-total', 'winner-votes', 'margin', 'votes-cast'].map(id => metricCard(f(id))).join('')}</section>
      <section class="grid-2e">
        <div class="panel"><div class="panel-head"><div><h3>Electors by sex · 2026</h3><p>CEO West Bengal, as on last date of nomination</p></div>${badge('Verified')}</div>
          ${sexBars.map(([k, r]) => `<button class="bar-row" data-rec="${r.id}" style="background:none;border:0;width:100%;text-align:left;padding:0"><span>${k}</span><div class="bar"><span style="width:${Math.max(.5, r.value / el * 100)}%"></span></div><span class="num">${fmt(r.value)}</span></button>`).join('')}
          <div class="source-note">${(f('electors-female').value / el * 100).toFixed(1)}% of electors are women (computed). Electors ≠ population ≠ votes cast. ${srcLink('ceo-electors', 'CEO elector table')}</div></div>
        <div class="panel"><div class="panel-head"><div><h3>2026 result</h3><p>${esc(p.election.note)}</p></div>${badge(p.election.status)}</div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Candidate</th><th>Party</th><th class="num">Votes</th><th class="num">%</th></tr></thead>
          <tbody>${p.election.candidates.map(c => `<tr data-src="${esc(p.election.source)}"><td>${esc(c.name)}${c.result ? ' ✓' : ''}</td><td>${esc(c.party)}</td><td class="num">${fmt(c.votes)}</td><td class="num">${c.share.toFixed(2)}</td></tr>`).join('')}</tbody></table></div>
          <div class="source-note"><b>2021:</b> ${esc(p.election.previous.winner)} beat ${esc(p.election.previous.runner_up)} by ${fmt(p.election.previous.margin)}; turnout ${esc(p.election.previous.turnout)} ${badge(p.election.previous.status)}<br>Primary ECI page now returns 404 — confirm with Form 20.</div></div>
      </section>
      <div class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>Population by local body</h3><p>Different sources and scopes — deliberately not summed</p></div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Local body</th><th class="num">Population</th><th>Period</th><th>Status</th><th>Scope</th></tr></thead>
        <tbody>${pops.map(x => `<tr data-jd="${esc(x.id)}" class="${S.route.j === x.id ? 'hl' : ''}"><td>${esc(x.name)}</td><td class="num">${fmt(x.population.value)}</td><td>${esc(x.population.period)}</td><td>${badge(x.population.status)}</td><td style="white-space:normal">${esc(x.population.scope_note || 'Whole body')}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>Uttarpara-Kotrung population by ward</h3><p>Census 2011 · municipality only · select a ward to drill down</p></div>
        <div class="chip-row"><a class="chip ${sort === 'ward' ? 'on' : ''}" href="${href(p.ac, 'people', S.route.j)}${S.route.j ? '&' : '?'}sort=ward">By ward</a><a class="chip ${sort === 'pop' ? 'on' : ''}" href="${href(p.ac, 'people', S.route.j)}${S.route.j ? '&' : '?'}sort=pop">By population</a> ${badge(w.status)}</div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Ward</th><th class="num">Total</th><th></th><th class="num">Male</th><th class="num">Female</th><th class="num">F per 1,000 M</th><th>Works</th></tr></thead>
        <tbody>${rows.map(r => { const n = p.projects.filter(x => (x.wards || []).includes(r[0])).length; return `<tr data-ward="${r[0]}"><td>${r[0]}</td><td class="num">${fmt(r[1])}</td><td><span class="spark" style="width:${Math.round(r[1] / maxW * 120)}px"></span></td><td class="num">${fmt(r[2])}</td><td class="num">${fmt(r[3])}</td><td class="num">${Math.round(r[3] / r[2] * 1000)}</td><td>${n ? n + ' tender lot' : ''}</td></tr>`; }).join('')}</tbody>
        <tfoot><tr><th>Total</th><th class="num">${fmt(w.totals[0])}</th><th></th><th class="num">${fmt(w.totals[1])}</th><th class="num">${fmt(w.totals[2])}</th><th class="num">${Math.round(w.totals[2] / w.totals[1] * 1000)}</th><th></th></tr></tfoot></table></div>
        <div class="source-note">Historical Census 2011 for the municipality only — not a current or constituency-wide estimate. ${srcLink('municipal-pop', 'Official ward table')}</div></div>
      <div class="cards" style="margin-top:14px">
        <div class="card"><h4>What is deliberately absent</h4><p>No voter names, EPIC numbers, addresses, caste or religion, or any inferred political preference. Booth-level figures will be aggregate counts only.</p></div>
        <div class="card"><h4>Next people data</h4><p>Form 20 booth-wise votes, polling-station elector counts, Census 2011 PCA for Konnagar and the GPs, and accessibility (PwD) aggregates.</p></div>
        <div class="card"><h4>Contradiction flagged</h4><p>Wikipedia's infobox lists 216,312 electors; the CEO table lists 228,272; turnout implies ~228,590. The CEO figure is used; the others are not.</p></div>
      </div>`;
  }

  function moduleView(p, module) {
    const j = S.route.j;
    const rs = records(p).filter(r => inJ(r, j));
    const isProjects = module === 'projects';
    const mod = rs.filter(r => isProjects ? (r.kind === 'project' || r.module === 'projects') : r.module === module);
    const facts = mod.filter(r => r.kind === 'fact');
    const recs = mod.filter(r => r.kind !== 'fact' && r.kind !== 'claim');
    const claims = mod.filter(r => r.kind === 'claim');
    const ids = mod.map(r => r.source).concat(mod.flatMap(r => r.corroboration || []));
    let extra = '';

    if (isProjects) {
      const lots = recs.filter(r => r.kind === 'project' && !r.mock);
      const total = lots.reduce((a, r) => a + (r.estimated_value || 0), 0);
      extra = `<div class="panel"><div class="panel-head"><div><h3>Works register</h3><p>Stage-by-stage evidence. Tender ≠ award ≠ spend ≠ completion.</p></div><span class="pill">${lots.length} sourced lots · ${inr(total)} put to tender</span></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Work</th><th>Agency</th><th>Wards</th><th class="num">Est. value</th><th>Stage</th><th>Award</th><th>Spend</th><th>Status</th></tr></thead>
        <tbody>${recs.filter(r => r.kind === 'project').map(r => `<tr data-rec="${esc(r.id)}"><td style="white-space:normal;min-width:220px">${esc(r.title)}</td><td>${esc(r.agency)}</td><td>${esc((r.wards || []).join(', '))}</td><td class="num">${r.estimated_value ? inr(r.estimated_value) : '—'}</td><td>${esc(r.stage)}</td><td>${r.mock ? '—' : 'unknown'}</td><td>${r.mock ? '—' : 'unknown'}</td><td>${badge(statusOf(r))}</td></tr>`).join('')}</tbody></table></div>
        <div class="notice warn"><span>!</span><span><b>Contradiction held back:</b> KMDA NIT 27 (16 Dec 2025) headings say "within Uttarpara Kotrung Municipality", but its own Annexure-I lists every work under Rishra Municipality, which is outside AC 185. The prototype's "ward 13" lead came from this document and is not shown as an Uttarpara work. <button class="text-btn" data-src="kmda-nit27">Evidence →</button></span></div></div>`;
      ids.push('kmda-nit27', 'finance', 'notices');
    }
    if (module === 'issues') {
      const issues = recs.filter(r => r.kind === 'issue');
      extra = `<div class="notice">⚠ <span>Every issue here is <b>MOCK</b>. Total open (demo): ${fmt(p.mock_totals.open_issues)} — ${esc(p.mock_totals.note)}</span></div>
        <div class="panel"><div class="panel-head"><div><h3>Issue register (demo)</h3><p>Fields the real register must carry</p></div><span class="badge st-mock">MOCK</span></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Issue cluster</th><th>Area</th><th>Status</th><th>Priority</th><th>Signal sources / evidence</th><th>Owner</th><th>Opened</th><th class="num">Age (d)</th></tr></thead>
        <tbody>${issues.map(r => `<tr data-rec="${esc(r.id)}"><td>${esc(r.title)} ${badge('Mock')}</td><td>${esc((p.jurisdictions.find(x => x.id === r.jurisdiction) || {}).short)}</td><td>${esc(r.workflow_status || 'Not recorded')}</td><td>${esc(r.priority)}</td><td style="white-space:normal">${(r.source_channels || []).map(esc).join(' · ')}<br><small>${esc(r.evidence_status || 'Evidence not recorded')}</small></td><td>${esc(r.owner)}</td><td>${esc(r.opened)}</td><td class="num">${daysSince(r.opened)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="cards" style="margin-top:14px"><div class="card"><h4>Intake</h4><p>Channel, consent, locality, category, urgency, date and attachments. Assisted intake for offline residents. Minimum personal data, with retention limits.</p></div>
        <div class="card"><h4>Routing</h4><p>Owning local body or department, named owner, response target, escalation and full status history, including jurisdiction hand-offs.</p></div>
        <div class="card"><h4>Close the loop</h4><p>Resolution evidence, resident confirmation, repeat-issue links and ageing. Open/due/overdue counts appear only from the real register.</p></div></div>`;
    }
    if (module === 'education') {
      extra = `<div class="cards"><div class="card"><h4>No current sourced records</h4><p>The only education record is the municipality's historical Mid-Day Meal description. School lists and aggregate enrolment should come from UDISE+.</p></div>
        <div class="card"><h4>School profile fields</h4><p>Location, management, enrolment by grade (aggregate), teacher posts, toilets, drinking water, electricity, ramps, meal delivery.</p></div>
        <div class="card"><h4>Student privacy</h4><p>Children's records stay in restricted systems. Only aggregate indicators appear here, never named students or inferred traits.</p></div></div>`;
    }
    if (module === 'cleanliness') {
      extra = `<div class="cards"><div class="card"><h4>No cleanliness score</h4><p>A score needs a defined method and current inputs (coverage, missed pickups, tonnage processed, complaint closure). None are published for AC 185 yet.</p></div>
        <div class="card"><h4>What the 12–14 t/day figure is</h4><p>A line from a newspaper article reproduced on the municipal SWM page, from the JICA-funded period ending 2017. It is shown as Historical only.</p></div>
        <div class="card"><h4>Field evidence to add</h4><p>Timestamped, geotagged before/after photos per ward and crew; repeat reports merged into one hotspot with an auditable history.</p></div></div>`;
    }
    if (module === 'infrastructure') {
      extra = `<div class="cards"><div class="card"><h4>Roads</h4><p>KMDA NIT 55 (9 Mar 2026, 2nd call) invites bids for 12 roads in Uttarpara-Kotrung wards 5–10, 20 and 23. Award and execution are not yet evidenced.</p></div>
        <div class="card"><h4>Water</h4><p>No current supply-hours, quality or coverage data. The three GPs should be checked on the Jal Jeevan Mission WB PHED dashboard.</p></div>
        <div class="card"><h4>Housing</h4><p>BSUP and PMAY descriptions on the municipal site are historical. Current progress needs PMAY-U aggregate data.</p></div></div>`;
    }

    return `
      ${facts.length ? `<section class="metric-grid">${facts.slice(0, 4).map(metricCard).join('')}</section>` : ''}
      <div class="stack">
        ${extra}
        ${recs.length && !isProjects && module !== 'issues' ? `<div class="panel"><div class="panel-head"><div><h3>Records · ${recs.length}</h3><p>Select a record for its evidence</p></div></div><div class="list">${recs.map(recordRow).join('')}</div></div>` : ''}
        ${claims.length ? `<div class="panel"><div class="panel-head"><div><h3>Programme claims · ${claims.length}</h3><p>What public pages say — context, not current performance</p></div></div><div class="list">${claims.map(recordRow).join('')}</div></div>` : ''}
        ${!facts.length && !recs.length && !claims.length && !extra ? '<div class="empty"><strong>Nothing onboarded for this area yet</strong>See the data gaps below.</div>' : ''}
        ${gapsPanel(p, module)}
        ${sourcesPanel(p, ids)}
      </div>`;
  }

  function sourcesView(p) {
    const list = Object.values(S.sources);
    const filt = S.route.kind || 'all';
    const shown = list.filter(s => filt === 'all' || (filt === 'attention' ? /^unavailable|not re-checked/.test(s.availability) || s.kind === 'secondary' : s.kind === filt));
    const counts = {};
    records(p).forEach(r => { const st = statusOf(r); counts[st] = (counts[st] || 0) + 1; });
    const kinds = ['all', 'official', 'official-tender', 'secondary', 'news', 'attention'];
    return `
      <div class="panel"><div class="panel-head"><div><h3>Status labels</h3><p>Every displayed value carries exactly one</p></div><button class="outline-btn" id="exportCsv">Export records CSV</button></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Status</th><th>Meaning</th><th class="num">Records</th></tr></thead>
        <tbody>${Object.entries(STATUS).map(([k, v]) => `<tr class="nolink"><td>${badge(k)}</td><td style="white-space:normal">${esc(v.def)}</td><td class="num">${counts[k] || 0}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>Source register · ${list.length} records</h3><p>Reviewed ${esc(S.sourceMeta.reviewed)} · stale after ${STALE_DAYS} days</p></div>
        <div class="chip-row">${kinds.map(k => `<a class="chip ${filt === k ? 'on' : ''}" href="${href(p.ac, 'sources')}?kind=${k}">${k === 'attention' ? 'Needs attention' : k}</a>`).join('')}</div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Record</th><th>Publisher</th><th>Kind</th><th>Reference</th><th>Geography</th><th>Freshness</th><th class="num">Uses</th></tr></thead>
        <tbody>${shown.map(s => { const n = records(p).filter(r => r.source === s.id || (r.corroboration || []).includes(s.id)).length; return `<tr data-src="${esc(s.id)}"><td style="white-space:normal;min-width:240px">${esc(s.record_title)}</td><td style="white-space:normal">${esc(s.publisher)}</td><td>${esc(s.kind)}</td><td style="white-space:normal">${esc(s.reference_date)}</td><td style="white-space:normal">${esc(s.geography)}</td><td>${freshness(s)}</td><td class="num">${n}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="notice"><span>!</span><span>Public URLs are references, not live integrations. Dynamic pages and documents must be re-checked before operational decisions.</span></div></div>
      <div class="stack">${gapsPanel(p, null)}</div>`;
  }

  async function acView(ac, module) {
    const seat = S.seats.find(s => s.ac === ac);
    if (!seat) return notFound();
    const p = await profile(ac);
    $('#viewName').textContent = p ? modLabel(module) : 'Seat profile';
    if (!p) return seatOnly(seat);
    if (module === 'overview') return overview(p);
    const m = MODULES.find(x => x.id === module);
    if (!m) return notFound();
    const head = `${crumbs(p, module)}<h2 class="module-title">${esc(m.label)}</h2><p class="module-intro">${esc(m.intro)}</p>
      ${module !== 'sources' && module !== 'reach' ? `<div class="filterbar">${jFilter(p, module)}</div>` : ''}`;
    if (module === 'reach') return head + (window.JDReach ? window.JDReach.view(reachContext(p)) : '<div class="empty">REACH demo module failed to load.</div>');
    if (module === 'people') return head + people(p);
    if (module === 'sources') return head + sourcesView(p);
    return head + moduleView(p, module);
  }

  function seatOnly(seat) {
    const e = seat.electors;
    const src = S.sources['ceo-electors'];
    const dist = S.seats.filter(s => s.district === seat.district);
    const rank = [...dist].sort((a, b) => b.electors.total - a.electors.total).findIndex(s => s.ac === seat.ac) + 1;
    const tile = (label, v, foot) => `<button class="metric" data-src="ceo-electors"><div class="metric-label">${esc(label)} ${badge('Verified')}</div><div class="metric-value">${fmt(v)}</div><div class="metric-foot">${esc(foot)}</div></button>`;
    return `<div class="bread"><a href="#/state">West Bengal</a><span class="sep">/</span><b>${esc(seat.name)} · AC ${seat.ac}</b></div>
      <section class="hero" style="margin-top:12px"><div class="hero-content"><div>
        <div class="eyebrow">West Bengal · ${esc(seat.district)} · Assembly constituency ${seat.ac}</div>
        <h2>${esc(seat.name)}</h2><p>This seat is in the statewide index with verified elector counts. Constituency modules have not been onboarded yet.</p>
        <div class="hero-tags"><span class="tag">${esc(seat.reservation === 'GEN' ? 'General seat' : seat.reservation + ' reserved')}</span><span class="tag">Poll phase ${seat.phase}</span><span class="tag">#${rank} of ${dist.length} seats in ${esc(seat.district)} by electors</span></div>
      </div><div class="hero-date">ELECTOR SOURCE<strong>CEO West Bengal 2026</strong>${freshness(src)}</div></div></section>
      <section class="metric-grid">${tile('Registered electors', e.total, 'As on last date of nomination')}${tile('Female electors', e.female, (e.female / e.total * 100).toFixed(1) + '% of electors')}${tile('Male electors', e.male, (e.male / e.total * 100).toFixed(1) + '% of electors')}${tile('Third-gender electors', e.third_gender, 'CEO table')}</section>
      <div class="grid-2e">
        <div class="panel"><div class="panel-head"><div><h3>Onboarding checklist</h3><p>What it takes to populate this seat like Uttarpara</p></div></div>
          <div class="list">${['Delimitation composition: municipalities, wards and GPs', 'ECI Form 20 / Statistical Report result', 'Census 2011 PCA by local body', 'Municipal / GP project, finance and service sources', 'Health facility roster (CMOH / NHM)', 'UDISE+ school list (aggregate)', 'Issue register owner in the MLA office'].map(t => `<div class="row" style="cursor:default"><div><strong>${esc(t)}</strong></div><div class="right"><span class="badge st-confirm">Not started</span></div></div>`).join('')}</div></div>
        <div class="panel"><div class="panel-head"><div><h3>Neighbouring seats · ${esc(seat.district)}</h3><p>Same CEO electoral district</p></div></div>
          <div class="list">${dist.map(s => `<a class="row" href="#/ac/${s.ac}" style="color:inherit;text-decoration:none"><div><strong>${String(s.ac).padStart(3, '0')} · ${esc(s.name)}</strong><small>${fmt(s.electors.total)} electors</small></div><div class="right">${S.seatMeta.onboarded.includes(s.ac) ? badge('Verified') : '<span class="pill">index only</span>'}</div></a>`).join('')}</div></div>
      </div>
      <p style="margin-top:14px"><a class="outline-btn" href="#/ac/185">← Return to Uttarpara</a></p>`;
  }

  function stateView() {
    $('#viewName').textContent = 'West Bengal';
    const q = (S.route.q || '').toLowerCase();
    const d = S.route.d || '';
    const sort = S.route.sort || 'ac';
    let seats = S.seats.filter(s => (!q || s.name.toLowerCase().includes(q) || String(s.ac) === q) && (!d || s.district === d));
    seats = [...seats].sort((a, b) => sort === 'electors' ? b.electors.total - a.electors.total : sort === 'female' ? b.electors.female / b.electors.total - a.electors.female / a.electors.total : a.ac - b.ac);
    const districts = [...new Set(S.seats.map(s => s.district))].sort();
    const max = Math.max(...S.seats.map(s => s.electors.total));
    const total = seats.reduce((a, s) => a + s.electors.total, 0);
    return `<div class="bread"><b>West Bengal</b><span class="sep">/</span>All Assembly constituencies</div>
      <h2 class="module-title">All ${S.seats.length} Assembly constituencies</h2>
      <p class="module-intro">Seat names from the ECI 2026 schedule; electors from the CEO West Bengal table (as on last date of nomination). The phase and state totals in the source reconcile exactly with these rows (${fmt(S.seatMeta.state_total_electors)} electors).</p>
      <div class="filterbar">
        <div class="chip-row"><input class="search" id="seatSearch" type="search" placeholder="Search seat name or AC number" value="${esc(S.route.q || '')}" aria-label="Search seats" />
        <select class="mini-select" id="districtSel" aria-label="District"><option value="">All districts</option>${districts.map(x => `<option ${x === d ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
        <span class="pill">${seats.length} seats · ${fmt(total)} electors ${badge('Verified')}</span>
      </div>
      <div class="panel"><div class="table-wrap" style="max-height:70vh"><table class="data-table">
        <thead><tr><th><button data-sort="ac">AC ${sort === 'ac' ? '▲' : ''}</button></th><th>Constituency</th><th>Reserved</th><th>District</th><th>Phase</th><th class="num"><button data-sort="electors">Electors ${sort === 'electors' ? '▼' : ''}</button></th><th></th><th class="num"><button data-sort="female">Female % ${sort === 'female' ? '▼' : ''}</button></th><th>Data</th></tr></thead>
        <tbody>${seats.map(s => `<tr data-ac="${s.ac}" class="${s.ac === 185 ? 'hl' : ''}"><td>${String(s.ac).padStart(3, '0')}</td><td>${esc(s.name)}</td><td>${esc(s.reservation === 'GEN' ? '—' : s.reservation)}</td><td>${esc(s.district)}</td><td>${s.phase}</td><td class="num">${fmt(s.electors.total)}</td><td><span class="spark" style="width:${Math.round(s.electors.total / max * 90)}px"></span></td><td class="num">${(s.electors.female / s.electors.total * 100).toFixed(1)}</td><td>${S.seatMeta.onboarded.includes(s.ac) ? '<span class="badge st-verified">Populated</span>' : '<span class="pill">index</span>'}</td></tr>`).join('') || '<tr><td colspan="9">No seats match.</td></tr>'}</tbody>
      </table></div><div class="source-note">${srcLink('ceo-electors', 'CEO West Bengal elector table')} · ${srcLink('ac-list', 'ECI schedule (seat names)')} · Electors are not population and not votes cast.</div></div>`;
  }

  function notFound() {
    return `<div class="empty"><strong>Not found</strong>That view does not exist. <a href="#/ac/185">Go to Uttarpara</a></div>`;
  }

  // ---------- CSV export ----------
  function exportCsv(p) {
    const cols = ['record_type', 'id', 'label', 'value', 'unit', 'period', 'geography', 'jurisdiction', 'module', 'status', 'MOCK', 'source_publisher', 'source_url', 'source_reference_date', 'source_retrieved', 'caveat'];
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')];
    records(p).forEach(r => {
      const s = S.sources[r.source] || {};
      const j = p.jurisdictions.find(x => x.id === r.jurisdiction);
      lines.push([r.kind, r.id, r.label, r.value ?? r.estimated_value ?? '', r.unit || (r.estimated_value ? 'INR (estimated, tendered)' : ''), r.period || r.stage_date || r.opened || '',
        r.geography || (j ? j.name : ''), j ? j.short : '', r.module, statusOf(r), r.mock ? 'MOCK' : '', s.publisher, s.url, s.reference_date, s.retrieved, r.caveat || ''].map(q).join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jandrishti-ac${p.ac}-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('CSV exported · MOCK rows are labelled');
  }

  // ---------- routing ----------
  function parseRoute() {
    const [path, qs] = location.hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(qs || '');
    const parts = path.split('/').filter(Boolean);
    const r = { view: 'ac', ac: 185, module: 'overview', j: params.get('j'), sort: params.get('sort'), kind: params.get('kind'), q: params.get('q'), d: params.get('d') };
    if (parts[0] === 'state') r.view = 'state';
    else if (parts[0] === 'ac') { r.ac = parseInt(parts[1], 10) || 185; r.module = parts[2] || 'overview'; }
    return r;
  }

  function renderNav() {
    const r = S.route;
    const onboarded = S.seatMeta.onboarded.includes(r.ac);
    $('#nav').innerHTML = MODULES.map(m => {
      const active = r.view === 'ac' && r.module === m.id;
      const dis = !onboarded && m.id !== 'overview';
      return `<a href="${dis ? '#/ac/' + r.ac : href(r.ac, m.id, r.j)}" class="${active ? 'active' : ''} ${dis ? 'disabled' : ''}" ${dis ? 'aria-disabled="true" title="Not onboarded yet"' : ''} ${active ? 'aria-current="page"' : ''}><span class="ico">${m.ico}</span>${esc(m.label)}</a>`;
    }).join('');
    $$('[data-nav="state"]').forEach(a => a.classList.toggle('active', r.view === 'state'));
    $('#seatSelect').value = r.view === 'ac' ? String(r.ac) : '';
    $$('#tabbar [data-tab]').forEach(a => a.classList.toggle('active', r.view === 'ac' && r.ac === 185 && r.module === a.dataset.tab));
  }

  async function render() {
    S.route = parseRoute();
    renderNav();
    const v = $('#view');
    try {
      v.innerHTML = S.route.view === 'state' ? stateView() : await acView(S.route.ac, S.route.module);
    } catch (err) {
      if (err instanceof AuthError) return showLogin(err.message);
      if (await recoverStale()) return;
      v.innerHTML = `<div class="empty"><strong>Could not load data</strong>${esc(err.message)}</div>`;
    }
    bindView();
    if (S.route.view === 'ac' && S.route.module === 'overview') loadNewsPanel();
    closeDrawer();
    $('#sidebar').classList.remove('open');
  }

  function bindView() {
    const p = S.profiles[S.route.ac];
    $$('#view [data-rec]').forEach(el => el.addEventListener('click', () => {
      const id = el.dataset.rec;
      if (id === 'mock-open-issues') {
        return recordDrawer(p, { kind: 'fact', id, mock: true, label: 'Open civic issues', value: p.mock_totals.open_issues, unit: 'issues', period: 'Demo', module: 'issues', detail: p.mock_totals.note, caveat: 'No complaint register is connected.' });
      }
      recordDrawer(p, findRecord(p, id));
    }));
    $$('#view [data-src]').forEach(el => el.addEventListener('click', () => sourceDrawer(p, el.dataset.src)));
    $$('#view [data-ward]').forEach(el => el.addEventListener('click', () => wardDrawer(p, +el.dataset.ward)));
    $$('#view [data-jd]').forEach(el => el.addEventListener('click', () => jurisdictionDrawer(p, el.dataset.jd)));
    $$('#view [data-ac]').forEach(el => el.addEventListener('click', () => { location.hash = `#/ac/${el.dataset.ac}`; }));
    const ap = $('#approvalBtn');
    if (ap) ap.addEventListener('click', () => approvalDrawer(p));
    const rm = $('#rankMethod');
    if (rm) rm.addEventListener('click', () => attentionDrawer(p));
    const ex = $('#exportCsv');
    if (ex) ex.addEventListener('click', () => exportCsv(p));
    $$('[data-sentiment-view]').forEach(button => button.addEventListener('click', () => {
      const table = button.dataset.sentimentView === 'table';
      $('#sentimentChart').hidden = table;
      $('#sentimentTable').hidden = !table;
      $$('[data-sentiment-view]').forEach(b => {
        const active = b === button;
        b.classList.toggle('on', active);
        b.setAttribute('aria-pressed', String(active));
      });
    }));
    const newsReload = $('#newsReload');
    if (newsReload) newsReload.addEventListener('click', loadNewsPanel);
    const newsToggle = $('#newsAutoToggle');
    if (newsToggle) newsToggle.addEventListener('change', () => {
      try { localStorage.setItem(NEWS_AUTO_KEY, newsToggle.checked ? '1' : '0'); } catch (e) { /* device preference only */ }
      $('#newsAutoState').textContent = newsToggle.checked ? 'On · every 4 hours' : 'Off';
      if (newsToggle.checked) loadNewsPanel();
    });
    $$('#view [data-sort]').forEach(el => el.addEventListener('click', () => setStateParams({ sort: el.dataset.sort })));
    const search = $('#seatSearch');
    if (search) {
      search.addEventListener('input', () => { clearTimeout(bindView.t); bindView.t = setTimeout(() => setStateParams({ q: search.value }, true), 250); });
      if (S.route.q) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
    }
    const ds = $('#districtSel');
    if (ds) ds.addEventListener('change', () => setStateParams({ d: ds.value }));
    if (S.route.module === 'reach' && p && window.JDReach) window.JDReach.bind(reachContext(p));
    if (p && window.JDCharts) window.JDCharts.bind(chartsContext(p));
  }

  // Helpers the service-signal charts (charts.js) need from the app.
  function chartsContext(p) {
    return { p, esc, badge, modLabel };
  }

  // What the REACH demo workspace (reach.js) may use. It gets no network helper on purpose.
  function reachContext(p) {
    return { p, records: records(p), sources: S.sources, user: (session() || {}).user || 'demo-editor', toast, openDrawer };
  }

  function setStateParams(changes) {
    const params = new URLSearchParams();
    const cur = { q: S.route.q, d: S.route.d, sort: S.route.sort, ...changes };
    Object.entries(cur).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    location.hash = '#/state' + (qs ? '?' + qs : '');
  }

  // ---------- boot ----------
  function showLogin(message) {
    saveSession(null);
    S.profiles = {};
    document.body.classList.add('locked');
    $('#sidebar').classList.remove('open');
    closeDrawer();
    $('#loginError').textContent = message || '';
    $('#loginBtn').disabled = false;
    $('#loginPass').value = '';
    setTimeout(() => ($('#loginUser').value ? $('#loginPass') : $('#loginUser')).focus(), 0);
  }

  async function signIn(e) {
    e.preventDefault();
    const user = $('#loginUser').value.trim(), password = $('#loginPass').value;
    if (!user || !password) { $('#loginError').textContent = 'Enter your user ID and password.'; return; }
    $('#loginBtn').disabled = true;
    $('#loginError').textContent = '';
    try {
      const r = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, password }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || `Sign-in failed (HTTP ${r.status})`);
      saveSession(body);
      $('#loginPass').value = '';
      await start();
    } catch (err) {
      $('#loginError').textContent = err.message === 'Failed to fetch' ? 'Cannot reach JanDrishti. Check your connection and try again.' : err.message;
      $('#loginBtn').disabled = false;
      $('#loginPass').value = '';
      $('#loginPass').focus();
    }
  }

  let started = false;
  async function start() {
    const [seatData, sourceData] = await Promise.all([getJSON('constituencies.json'), getJSON('sources.json')]);
    S.seats = seatData.seats;
    S.seatMeta = { ...seatData, onboarded: [185] };
    S.sourceMeta = sourceData;
    sourceData.sources.forEach(s => { S.sources[s.id] = s; });
    $('#seatSelect').innerHTML = '<option value="">Select Assembly constituency…</option>' + S.seats.map(s =>
      `<option value="${s.ac}">${String(s.ac).padStart(3, '0')} · ${esc(s.name)}${S.seatMeta.onboarded.includes(s.ac) ? ' ●' : ''}</option>`).join('');
    $('#whoami').textContent = session().user;
    document.body.classList.remove('locked');
    if (!started) { window.addEventListener('hashchange', render); started = true; }
    if (!newsTimerStarted) {
      window.setInterval(() => { if (newsAutoEnabled() && document.visibilityState === 'visible' && S.route.view === 'ac' && S.route.module === 'overview') loadNewsPanel(); }, NEWS_REFRESH_MS);
      document.addEventListener('visibilitychange', () => { if (newsAutoEnabled() && document.visibilityState === 'visible' && S.route.view === 'ac' && S.route.module === 'overview') loadNewsPanel(); });
      newsTimerStarted = true;
    }
    if (!location.hash) history.replaceState(null, '', '#/ac/185');
    await render();
  }

  async function init() {
    $('#loginForm').addEventListener('submit', signIn);
    $('#signOut').addEventListener('click', () => { showLogin(''); toast('Signed out'); });
    $('#seatSelect').addEventListener('change', e => { if (e.target.value) location.hash = `#/ac/${e.target.value}`; });
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#detailMask').addEventListener('click', e => { if (e.target.id === 'detailMask') closeDrawer(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); $('#sidebar').classList.remove('open'); } });
    const toggleMenu = e => {
      e.stopPropagation();
      const open = $('#sidebar').classList.toggle('open');
      $('#menuBtn').setAttribute('aria-expanded', String(open));
    };
    $('#menuBtn').addEventListener('click', toggleMenu);
    $('#tabMore').addEventListener('click', toggleMenu);
    // On phones the menu slides over the page; a tap outside it closes it.
    $('.main').addEventListener('click', () => $('#sidebar').classList.remove('open'));
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* offline shell is optional */ });
    }
    // Pick up new releases without the user clearing caches: check on start and on return to the app.
    checkForUpdate();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
    window.addEventListener('focus', checkForUpdate);
    // Inside the Android app (it appends JanDrishtiApp to the user agent) the download link is pointless.
    if (/JanDrishtiApp\//.test(navigator.userAgent)) $$('.get-app').forEach(a => a.remove());
    if (!session()) return showLogin('');
    try {
      await start();
    } catch (err) {
      if (err instanceof AuthError) return showLogin(err.message);
      throw err;
    }
  }

  // An open tab, an installed app, or the Android WebView can keep running an old release for
  // as long as it stays open. Ask the server which release is current (bypassing every cache)
  // and reload once if it differs from this code's BUILD. Throttled; never loops on one target.
  let lastUpdateCheck = 0;
  async function checkForUpdate() {
    if (BUILD === 'dev' || Date.now() - lastUpdateCheck < 60 * 1000) return;
    lastUpdateCheck = Date.now();
    try {
      const html = await (await fetch(`./index.html?check=${Date.now()}`, { cache: 'no-store' })).text();
      const m = /app\.js\?v=([^"]+)"/.exec(html);
      if (!m || m[1] === BUILD) return;
      try {
        if (sessionStorage.getItem('jandrishti_updated_to') === m[1]) return;
        sessionStorage.setItem('jandrishti_updated_to', m[1]);
      } catch (e) { /* no session storage: still update once per page load */ }
      toast('Updating JanDrishti to the latest version…');
      setTimeout(() => location.reload(), 600);
    } catch (e) { /* offline: keep the current release */ }
  }

  // A browser can hold an older cached index.html/app.js (GitHub Pages caches for ~10 min) while
  // the data is already newer. Refresh index.html once from the server and reload.
  async function recoverStale() {
    try {
      if (sessionStorage.getItem('jandrishti_reloaded') === BUILD) return false;
      sessionStorage.setItem('jandrishti_reloaded', BUILD);
      await fetch('./index.html', { cache: 'reload' });
      location.reload();
      return true;
    } catch (e) {
      return false;
    }
  }

  init().catch(async err => {
    if (await recoverStale()) return;
    $('#view').innerHTML = `<div class="empty"><strong>JanDrishti could not start</strong>${esc(err.message)}</div>`;
  });
})();
