/* JanDrishti service-signal charts (overview).
 * Aggregate, issue-level only: clusters by service area, priority, workflow status, locality,
 * intake channel and owning department. Chart and table are drawn from the same filtered rows.
 * Colours come from palette tokens (styles.css), so every palette works; values are always
 * printed beside bars so colour is never the only cue. No trend is drawn without enough dated
 * observations, and nothing here estimates opinion or targets residents.
 */
(function () {
  'use strict';

  const DIMS = {
    module: 'Service area',
    priority: 'Priority',
    workflow: 'Workflow status',
    locality: 'Locality',
    channel: 'Intake channel',
    owner: 'Department / owner'
  };
  // Source types stay distinct; social posts and protests are leads that need verification.
  const SOURCE_TYPES = [
    [/protest|rally|demonstration|event/i, 'Protest / event report', true],
    [/social|facebook|instagram|whatsapp|twitter|\bx\b post/i, 'Public social post', true],
    [/field|inspection|gp referral|official|department|municipal record|log/i, 'Official / field record', false],
    [/citizen|resident|intake|helpline|walk-in|complaint/i, 'Citizen report', false]
  ];
  const TREND_MIN_RECORDS = 12;
  const TREND_MIN_MONTHS = 3;

  const state = { dim: 'module', view: 'chart', locality: '' };

  function sourceType(channel) {
    for (const [re, label, lead] of SOURCE_TYPES) if (re.test(channel)) return { label, lead };
    return { label: 'Other / unclassified', lead: true };
  }
  const reportCount = issue => { const m = /(\d+)\s+demo\s+(cases|reports)/i.exec(issue.detail || ''); return m ? Number(m[1]) : null; };
  const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  function rowsFor(ctx, issues) {
    const p = ctx.p;
    const jName = id => (p.jurisdictions.find(j => j.id === id) || {}).short || 'Unknown locality';
    const groups = new Map();
    const add = (key, issue, extra) => {
      if (!groups.has(key)) groups.set(key, { key, clusters: new Set(), cases: 0, casesKnown: 0, lead: false, ...extra });
      const g = groups.get(key);
      if (!g.clusters.has(issue.id)) {
        g.clusters.add(issue.id);
        const n = reportCount(issue);
        if (n != null) { g.cases += n; g.casesKnown++; }
      }
    };
    issues.forEach(i => {
      if (state.dim === 'channel') {
        (i.source_channels || ['Not recorded']).forEach(ch => {
          const t = sourceType(ch);
          add(t.label, i, { lead: t.lead });
        });
      } else {
        const key = {
          module: () => ctx.modLabel(i.module || 'issues'),
          priority: () => i.priority || 'Not set',
          workflow: () => i.workflow_status || 'Not recorded',
          locality: () => jName(i.jurisdiction),
          owner: () => i.owner || 'Unassigned'
        }[state.dim]();
        add(key, i, {});
      }
    });
    return [...groups.values()].map(g => ({ ...g, n: g.clusters.size })).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
  }

  function meta(ctx, issues) {
    const p = ctx.p;
    const dates = issues.map(i => i.opened).filter(Boolean).sort();
    const locs = [...new Set(issues.map(i => (p.jurisdictions.find(j => j.id === i.jurisdiction) || {}).short).filter(Boolean))];
    const mix = new Map();
    issues.forEach(i => (i.source_channels || []).forEach(ch => { const t = sourceType(ch).label; mix.set(t, (mix.get(t) || 0) + 1); }));
    const cases = issues.map(reportCount).filter(n => n != null);
    const mockCount = issues.filter(i => i.mock).length;
    return `<dl class="chart-meta">
      <dt>Date range</dt><dd>${dates.length ? `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])} (cluster opened)` : 'No dates recorded'}</dd>
      <dt>Geography</dt><dd>${locs.length ? ctx.esc(locs.join(', ')) : 'Not recorded'} · Uttarpara AC 185</dd>
      <dt>Sample</dt><dd>${issues.length} issue cluster${issues.length === 1 ? '' : 's'}${cases.length ? ` · ${cases.reduce((a, b) => a + b, 0)} stated reports in ${cases.length}` : ''}. Clusters group repeated reports; one resident may appear in several, so these are <b>not unique respondents</b>.</dd>
      <dt>Source mix</dt><dd>${[...mix.entries()].map(([k, v]) => `${ctx.esc(k)} ${v}`).join(' · ') || 'Not recorded'}. Social posts and protest reports are leads to verify, not counts of opinion.</dd>
      <dt>Verification</dt><dd>${mockCount ? `${ctx.badge('Mock')} ${mockCount} of ${issues.length} are DEMO records` : 'Real register'} · ${issues.filter(i => /not|pending|requested|planned/i.test(i.evidence_status || '')).length} with evidence still to verify</dd>
    </dl>`;
  }

  function trend(ctx, issues) {
    const dates = issues.map(i => i.opened).filter(Boolean).sort();
    const months = new Set(dates.map(d => d.slice(0, 7)));
    if (dates.length < TREND_MIN_RECORDS || months.size < TREND_MIN_MONTHS) {
      return `<div class="chart-empty" role="note"><b>No trend shown.</b> ${dates.length} dated issue cluster${dates.length === 1 ? '' : 's'} across ${months.size} month${months.size === 1 ? '' : 's'}${dates.length ? ` (${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])})` : ''}. A trend needs at least ${TREND_MIN_RECORDS} dated records across ${TREND_MIN_MONTHS} months, so none is drawn rather than guessing one.</div>`;
    }
    const by = new Map();
    dates.forEach(d => by.set(d.slice(0, 7), (by.get(d.slice(0, 7)) || 0) + 1));
    const max = Math.max(...by.values());
    return `<div class="chart-trend" role="img" aria-label="Issue clusters opened per month">${[...by.entries()].map(([m, n]) => `<div class="chart-col"><span style="height:${(n / max) * 100}%"></span><b>${n}</b><small>${ctx.esc(m)}</small></div>`).join('')}</div>`;
  }

  function panel(ctx) {
    const p = ctx.p;
    const all = p.issues || [];
    if (!all.length) {
      return `<section class="panel chart-panel"><div class="panel-head"><div><h3>Service signals</h3><p>Issue clusters by service area, priority, status, locality, channel and owner</p></div></div>
        <div class="chart-empty"><b>No issue register connected yet.</b> Charts appear here once real, consented service reports are recorded. Nothing is estimated in the meantime.</div></section>`;
    }
    const locs = [...new Set(all.map(i => i.jurisdiction))];
    const issues = all.filter(i => !state.locality || i.jurisdiction === state.locality);
    const rows = rowsFor(ctx, issues);
    const max = Math.max(1, ...rows.map(r => r.n));
    const demo = issues.some(i => i.mock);
    const demoTag = demo ? `<span class="chart-demo">DEMO</span>` : '';
    const unit = state.dim === 'channel' ? 'clusters citing this source type' : 'issue clusters';
    const chart = rows.map(r => `<div class="chart-row">
        <span class="chart-label">${ctx.esc(r.key)}${r.lead ? ' <span class="badge st-confirm">verify</span>' : ''}</span>
        <span class="chart-bar" role="img" aria-label="${ctx.esc(r.key)}: ${r.n} ${unit}"><i style="width:${(r.n / max) * 100}%"></i></span>
        <span class="chart-val">${r.n}${r.casesKnown ? ` · ${r.cases} rep.` : ''}</span></div>`).join('');
    const table = `<table class="data-table"><caption class="chart-caption">${ctx.esc(DIMS[state.dim])} · ${issues.length} clusters ${demoTag}</caption>
      <thead><tr><th>${ctx.esc(DIMS[state.dim])}</th><th class="num">Issue clusters</th><th class="num">Stated reports</th><th>Evidence type</th><th>Data</th></tr></thead>
      <tbody>${rows.map(r => `<tr class="nolink"><td>${ctx.esc(r.key)}</td><td class="num">${r.n}</td><td class="num">${r.casesKnown ? r.cases : '—'}</td><td>${state.dim === 'channel' ? (r.lead ? 'Lead — needs verification' : 'Report / record') : '—'}</td><td>${demo ? ctx.badge('Mock') : '—'}</td></tr>`).join('')}</tbody></table>`;
    return `<section class="panel chart-panel" id="signalsPanel" aria-labelledby="signalsTitle">
      <div class="panel-head"><div><h3 id="signalsTitle">Service signals ${demoTag}</h3><p>Issue clusters by ${ctx.esc(DIMS[state.dim].toLowerCase())} · aggregate, issue-level only</p></div>
        <div class="chip-row" role="group" aria-label="Signals display">
          <button type="button" class="chip ${state.view === 'chart' ? 'on' : ''}" data-sig-view="chart" aria-pressed="${state.view === 'chart'}">Chart</button>
          <button type="button" class="chip ${state.view === 'table' ? 'on' : ''}" data-sig-view="table" aria-pressed="${state.view === 'table'}">Table</button></div></div>
      <div class="chart-controls">
        <div class="chip-row" role="group" aria-label="Group issue clusters by">${Object.entries(DIMS).map(([k, l]) => `<button type="button" class="chip ${k === state.dim ? 'on' : ''}" data-sig-dim="${k}" aria-pressed="${k === state.dim}">${ctx.esc(l)}</button>`).join('')}</div>
        <label class="chart-filter">Locality <select class="mini-select" id="sigLocality"><option value="">All localities</option>${locs.map(id => `<option value="${ctx.esc(id)}" ${id === state.locality ? 'selected' : ''}>${ctx.esc((p.jurisdictions.find(j => j.id === id) || {}).short || id)}</option>`).join('')}</select></label>
      </div>
      ${demo ? '<p class="chart-demo-note">DEMO records — illustrative clusters, not real complaints. Replace with the real issue register before use.</p>' : ''}
      <div class="chart-grid">
        <div>${state.view === 'chart' ? `<div class="chart-bars">${chart || '<div class="chart-empty">No clusters match this filter.</div>'}</div>` : `<div class="table-wrap">${table}</div>`}</div>
        <details class="insight-details"><summary>Sources &amp; coverage <span>Inspect</span></summary>${meta(ctx, issues)}</details>
      </div>
      <details class="insight-details"><summary>Timeline ${demoTag}<span>Explore</span></summary>${trend(ctx, issues)}</details>
    </section>`;
  }

  function bind(ctx) {
    const root = document.getElementById('signalsPanel');
    if (!root) return;
    const redraw = () => { root.outerHTML = panel(ctx); bind(ctx); const el = document.getElementById('signalsPanel'); const f = el && el.querySelector('[aria-pressed="true"][data-sig-' + (redraw.focus || 'dim') + ']'); if (f) f.focus(); };
    root.querySelectorAll('[data-sig-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.sigView; redraw.focus = 'view'; redraw(); }));
    root.querySelectorAll('[data-sig-dim]').forEach(b => b.addEventListener('click', () => { state.dim = b.dataset.sigDim; redraw.focus = 'dim'; redraw(); }));
    const sel = root.querySelector('#sigLocality');
    if (sel) sel.addEventListener('change', () => { state.locality = sel.value; redraw.focus = null; redraw(); const s = document.getElementById('sigLocality'); if (s) s.focus(); });
  }

  window.JDCharts = { panel, bind, sourceType, rowsFor, state, TREND_MIN_RECORDS, TREND_MIN_MONTHS };
})();
