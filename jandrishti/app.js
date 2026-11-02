/* Brahmexa JanDrishti — buildless constituency dashboard.
 * Data lives in ./data; nothing here is a source of truth for a fact.
 * Routes: #/state · #/ac/<n>[/<module>][?j=<jurisdiction>]
 */
(() => {
  'use strict';

  const MODULES = [
    { id: 'overview', label: 'Overview', ico: '◉' },
    { id: 'people', label: 'People & elections', ico: '◎', intro: 'Aggregate electoral and population records. Electors, votes and Census population are separate concepts and are never added together. No individual voter data is stored or shown.' },
    { id: 'projects', label: 'Projects & funds', ico: '◌', intro: 'Every public work from tender to maintenance. A tender is not an award, and an award is not spend — each stage needs its own record.' },
    { id: 'cleanliness', label: 'Cleanliness & environment', ico: '✳', intro: 'Service evidence and repeat-location tracking. No cleanliness score is computed: there is no defined method or current input data yet.' },
    { id: 'health', label: 'Healthcare', ico: '✚', intro: 'Facility directory from published sources. Staffing, capacity, hours and stock need department confirmation.' },
    { id: 'education', label: 'Education', ico: '⌑', intro: 'Institutions and programmes at aggregate level only. Named student records never enter this dashboard.' },
    { id: 'infrastructure', label: 'Water, roads & housing', ico: '⌂', intro: 'Asset and works register across the municipal wards and three gram panchayats.' },
    { id: 'issues', label: 'Public issues', ico: '✉', intro: 'One accountable issue register for MLA-office intake and agency follow-up. No real register is connected yet — every issue below is MOCK.' },
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

  // ---------- data ----------
  async function getJSON(path) {
    const r = await fetch(path, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.json();
  }

  async function profile(ac) {
    if (!(ac in S.profiles)) {
      S.profiles[ac] = S.seatMeta.onboarded.includes(ac) ? await getJSON(`./data/ac/${ac}.json`) : null;
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
    if (r.kind === 'issue') rows.push(['Priority', r.priority], ['Owner', r.owner], ['Opened', r.opened]);
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
      <div class="drawer-block"><a class="outline-btn" href="${href(p.ac, S.route.module, id)}">Filter dashboard to ${esc(j.short)} →</a></div>`);
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

  // ---------- orbit (circular universe drill-down) ----------
  function orbit(p) {
    const W = 520, H = 340, cx = W / 2, cy = H / 2, rx = 200, ry = 120;
    const n = p.jurisdictions.length;
    const nodes = p.jurisdictions.map((j, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      const sel = S.route.j === j.id;
      const r = j.type === 'Municipality' ? 30 : 24;
      return `<g class="node ${sel ? 'sel' : ''}" data-j="${esc(j.id)}" tabindex="0" role="button" aria-label="${esc(j.name)}">
        <circle class="halo" cx="${x}" cy="${y}" r="${r}"/>
        <text class="code" x="${x}" y="${y + 4}" text-anchor="middle">${esc(j.code)}</text>
        <text x="${x}" y="${y + r + 14}" text-anchor="middle">${esc(j.short)}</text>
        <text class="sub" x="${x}" y="${y + r + 26}" text-anchor="middle">${esc(j.type)}</text>
      </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H + 30}" role="group" aria-label="Local bodies of ${esc(p.name)} AC">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#52d3d033" stroke-dasharray="3 5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * .55}" ry="${ry * .55}" fill="none" stroke="#e9b45e22"/>
      <circle cx="${cx}" cy="${cy}" r="44" fill="#0e2a38" stroke="#52d3d0" stroke-opacity=".6"/>
      <circle cx="${cx}" cy="${cy}" r="56" fill="none" stroke="#52d3d0" stroke-opacity=".15"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-weight:700;font-size:13px">${esc(p.name)}</text>
      <text class="sub" x="${cx}" y="${cy + 13}" text-anchor="middle">AC ${p.ac}</text>
      ${nodes}
    </svg>`;
  }

  function areaDetail(p) {
    const j = p.jurisdictions.find(x => x.id === S.route.j);
    if (!j) {
      return `<div class="area-detail"><h4>Whole constituency</h4>
        <p>Two municipalities and three gram panchayats (2008 delimitation). Select a body on the orbit to drill down.</p>
        <p>Populations below come from different source types and scopes, so they are <b>not summed</b> into a constituency population.</p></div>`;
    }
    const rs = records(p).filter(r => r.jurisdiction === j.id);
    return `<div class="area-detail"><h4>${esc(j.name)}</h4>
      <p>${fmt(j.population.value)} people · ${esc(j.population.period)} ${badge(j.population.status)}</p>
      ${j.population.scope_note ? `<p><b>Scope:</b> ${esc(j.population.scope_note)}</p>` : ''}
      <p>${rs.length} record(s) · ${j.wards ? j.wards + ' wards' : 'ward/sansad list pending'}</p>
      <p style="margin-top:8px"><button class="outline-btn" data-jd="${esc(j.id)}">Open area evidence →</button> <a class="text-btn" href="${href(p.ac)}">Clear filter</a></p></div>`;
  }

  // ---------- views ----------
  function overview(p) {
    const j = S.route.j;
    const fact = id => p.facts.find(f => f.id === id);
    const mockTotal = { id: 'mock-open-issues', kind: 'fact', mock: true, label: 'Open civic issues', value: p.mock_totals.open_issues, unit: 'issues', period: 'Demo', status: 'Mock', module: 'issues', detail: p.mock_totals.note };
    const popFact = p.facts.find(f => f.jurisdiction === (j || 'ukm') && f.unit === 'persons') || fact('ukm-pop');
    const tiles = [fact('electors-total'), fact('winner-votes'), popFact, mockTotal];
    const rs = records(p).filter(r => inJ(r, j));
    const attention = rs.filter(r => r.kind === 'issue');
    const highGaps = p.data_gaps.filter(g => g.priority === 'High').slice(0, 4);
    const works = rs.filter(r => r.kind === 'project');

    const cover = MODULES.filter(m => !['overview', 'sources'].includes(m.id)).map(m => {
      const mr = rs.filter(r => r.module === m.id || (m.id === 'projects' && r.kind === 'project'));
      const real = mr.filter(r => !r.mock).length, mock = mr.filter(r => r.mock).length;
      const gaps = p.data_gaps.filter(g => g.module === m.id).length;
      return { m, real, mock, gaps };
    });
    const maxC = Math.max(1, ...cover.map(c => c.real + c.mock));

    return `${crumbs(p, 'overview')}
      <section class="hero" style="margin-top:12px"><div class="hero-content"><div>
        <div class="eyebrow">West Bengal · ${esc(p.district)} district · Assembly constituency ${p.ac} · ${esc(p.parliamentary_constituency)} PC</div>
        <h2>${esc(p.name)}</h2><p>${esc(p.summary)}</p>
        <div class="hero-tags">
          <button class="tag" data-rec="winner-votes">MLA · ${esc(p.representative.name)} (${esc(p.representative.party)}) · ${badge(p.representative.status)}</button>
          <span class="tag">5 local bodies</span><span class="tag">${fmt(S.seats.length)}-seat statewide index</span>
        </div></div>
        <div class="hero-date">DATA REVIEWED<strong>${esc(p.reviewed)}</strong><span>Source dates vary — see each record</span></div>
      </div></section>
      <div class="notice"><span>ⓘ</span><span>Sourced records and demo examples are mixed only where labelled. Anything marked <b>MOCK</b> is invented. Municipal programme pages are largely historical — their figures are never shown as current performance.</span></div>
      <div class="filterbar">${jFilter(p, 'overview')}<button class="outline-btn" id="exportCsv">Export records CSV</button></div>
      <section class="metric-grid">${tiles.map(metricCard).join('')}</section>
      <section class="grid-2">
        <div class="panel"><div class="panel-head"><div><h3>Constituency orbit · local bodies</h3><p>Select a body to focus every module. Schematic — not a boundary map.</p></div><span class="pill">${p.jurisdictions.length} jurisdictions</span></div>
          <div class="orbit-wrap"><div class="orbit">${orbit(p)}</div>${areaDetail(p)}</div>
          <div class="legend">${p.jurisdictions.map(x => `<span>${esc(x.code)} · ${esc(x.short)} ${fmt(x.population.value)} ${badge(x.population.status)}</span>`).join('')}</div>
        </div>
        <div class="panel"><div class="panel-head"><div><h3>Needs attention</h3><p>Demo issue queue and highest-priority evidence gaps</p></div><span class="badge st-mock">MOCK issues</span></div>
          <div class="list">${attention.map(recordRow).join('') || '<div class="empty">No mock issues for this area.</div>'}</div>
          <div class="source-note"><b>Top data gaps</b><br>${highGaps.map(g => `• ${esc(g.need)}`).join('<br>')}</div>
        </div>
      </section>
      <section class="grid-2e" style="margin-top:14px">
        <div class="panel"><div class="panel-head"><div><h3>Project watch</h3><p>Tendered works and demo tracker entries</p></div><a class="text-btn" href="${href(p.ac, 'projects', j)}">Open all →</a></div>
          <div class="list">${works.map(recordRow).join('') || '<div class="empty">No works found for this area yet.</div>'}</div></div>
        <div class="panel"><div class="panel-head"><div><h3>Evidence coverage by module</h3><p>Records loaded per module — not a performance score</p></div><a class="text-btn" href="${href(p.ac, 'sources')}">Evidence →</a></div>
          ${cover.map(c => `<a class="bar-row" href="${href(p.ac, c.m.id, j)}" style="color:inherit;text-decoration:none"><span>${esc(c.m.label)}</span>
            <div class="bar" title="${c.real} sourced · ${c.mock} mock"><span style="width:${(c.real / maxC) * 100}%;display:inline-block"></span><span class="gold" style="width:${(c.mock / maxC) * 100}%;display:inline-block"></span></div>
            <span class="num">${c.real}${c.mock ? ` +${c.mock}m` : ''}</span></a>`).join('')}
          <div class="legend"><span><span class="spark" style="width:14px"></span> sourced records</span><span><span class="spark" style="width:14px;background:var(--gold)"></span> mock (m)</span></div>
          <div class="source-note">Coverage counts records, not service quality. Education has no current sourced records yet.</div></div>
      </section>`;
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
        <div class="table-wrap"><table class="data-table"><thead><tr><th>MOCK</th><th>Issue</th><th>Area</th><th>Priority</th><th>Owner</th><th>Opened</th><th class="num">Age (d)</th></tr></thead>
        <tbody>${issues.map(r => `<tr data-rec="${esc(r.id)}"><td>${badge('Mock')}</td><td>${esc(r.title)}</td><td>${esc((p.jurisdictions.find(x => x.id === r.jurisdiction) || {}).short)}</td><td>${esc(r.priority)}</td><td>${esc(r.owner)}</td><td>${esc(r.opened)}</td><td class="num">${daysSince(r.opened)}</td></tr>`).join('')}</tbody></table></div></div>
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
      ${module !== 'sources' ? `<div class="filterbar">${jFilter(p, module)}</div>` : ''}`;
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
  }

  async function render() {
    S.route = parseRoute();
    renderNav();
    const v = $('#view');
    try {
      v.innerHTML = S.route.view === 'state' ? stateView() : await acView(S.route.ac, S.route.module);
    } catch (err) {
      v.innerHTML = `<div class="empty"><strong>Could not load data</strong>${esc(err.message)}</div>`;
    }
    bindView();
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
    $$('#view .orbit .node').forEach(el => {
      const go = () => { location.hash = href(p.ac, 'overview', S.route.j === el.dataset.j ? null : el.dataset.j); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    const ex = $('#exportCsv');
    if (ex) ex.addEventListener('click', () => exportCsv(p));
    $$('#view [data-sort]').forEach(el => el.addEventListener('click', () => setStateParams({ sort: el.dataset.sort })));
    const search = $('#seatSearch');
    if (search) {
      search.addEventListener('input', () => { clearTimeout(bindView.t); bindView.t = setTimeout(() => setStateParams({ q: search.value }, true), 250); });
      if (S.route.q) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
    }
    const ds = $('#districtSel');
    if (ds) ds.addEventListener('change', () => setStateParams({ d: ds.value }));
  }

  function setStateParams(changes) {
    const params = new URLSearchParams();
    const cur = { q: S.route.q, d: S.route.d, sort: S.route.sort, ...changes };
    Object.entries(cur).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    location.hash = '#/state' + (qs ? '?' + qs : '');
  }

  // ---------- boot ----------
  async function init() {
    const [seatData, sourceData] = await Promise.all([getJSON('./data/constituencies.json'), getJSON('./data/sources.json')]);
    S.seats = seatData.seats;
    S.seatMeta = { ...seatData, onboarded: [185] };
    S.sourceMeta = sourceData;
    sourceData.sources.forEach(s => { S.sources[s.id] = s; });

    const sel = $('#seatSelect');
    sel.innerHTML = '<option value="">Select Assembly constituency…</option>' + S.seats.map(s =>
      `<option value="${s.ac}">${String(s.ac).padStart(3, '0')} · ${esc(s.name)}${S.seatMeta.onboarded.includes(s.ac) ? ' ●' : ''}</option>`).join('');
    sel.addEventListener('change', e => { if (e.target.value) location.hash = `#/ac/${e.target.value}`; });

    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#detailMask').addEventListener('click', e => { if (e.target.id === 'detailMask') closeDrawer(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
    $('#menuBtn').addEventListener('click', () => {
      const open = $('#sidebar').classList.toggle('open');
      $('#menuBtn').setAttribute('aria-expanded', String(open));
    });
    window.addEventListener('hashchange', render);
    if (!location.hash) history.replaceState(null, '', '#/ac/185');
    await render();
  }

  init().catch(err => {
    $('#view').innerHTML = `<div class="empty"><strong>JanDrishti could not start</strong>${esc(err.message)}</div>`;
  });
})();
