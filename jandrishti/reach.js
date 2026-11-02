/* Brahmexa REACH · Public Service Updates — DEMO ONLY.
 *
 * A simulated social publishing workspace inside JanDrishti. Nothing here talks to Meta or to
 * any network: this file contains no fetch/XHR/beacon/socket call, every "publish" or "schedule"
 * only changes this browser's localStorage, and the page CSP (connect-src) would block any
 * request to Facebook/Instagram anyway. See docs/jandrishti-reach-demo.md.
 *
 * The adapter mirrors the real REACH API lifecycle (intake → run → selectVariant →
 * requestApproval → decide → schedule/publish → metrics) so a reviewed real adapter could be
 * swapped in later; only the mock implementation exists.
 */
(function () {
  'use strict';

  const STORE_KEY = 'jandrishti_reach_demo_v1';
  const SIM_NOTE = 'Simulated publish — nothing was posted externally.';
  const SOURCED = ['Verified', 'Source-reported']; // verification states that may be approved without an extra check

  const FORMATS = {
    fb_update: { label: 'Facebook-style service update', short: 'FB update', dest: 'fb' },
    ig_square: { label: 'Instagram square post', short: 'IG square', dest: 'ig' },
    ig_story: { label: 'Instagram story', short: 'IG story', dest: 'ig' },
    carousel: { label: 'Carousel', short: 'Carousel', dest: 'ig' },
    reel_storyboard: { label: 'Short-reel storyboard (preview only)', short: 'Reel storyboard', dest: 'ig' }
  };
  const DESTS = {
    fb: { name: 'Uttarpara Service Updates · Facebook Demo', handle: 'uttarpara.service.updates.demo' },
    ig: { name: 'Uttarpara Service Updates · Instagram Demo', handle: 'uttarpara.service.demo' }
  };
  const CATEGORIES = ['Road work', 'Water interruption', 'Clinic information', 'Waste schedule', 'Project progress', 'Public meeting', 'Emergency notice'];
  const CATEGORY_ICON = { 'Road work': '⛕', 'Water interruption': '💧', 'Clinic information': '✚', 'Waste schedule': '♻', 'Project progress': '◌', 'Public meeting': '◎', 'Emergency notice': '⚠' };
  // Records from these modules may start a post. People & elections is deliberately excluded.
  const SERVICE_MODULES = ['projects', 'cleanliness', 'health', 'education', 'infrastructure', 'issues'];
  const STATE_LABEL = { draft: 'Draft', in_review: 'In review', changes_requested: 'Changes requested', approved: 'Approved', scheduled: 'Scheduled (demo)', published: 'Published (demo)' };

  // ---------- nonpartisan policy ----------
  // Public-service information only: anything electoral, partisan or persuasive blocks review,
  // approval and simulated publishing.
  const POLICY = [
    [/\bvot(e|es|er|ers|ing)\b/i, 'voting or voter language'],
    [/\belection(s)?\b|\bpoll(s|ing)? (day|booth)/i, 'election language'],
    [/\bcandidate(s)?\b|\bcampaign(s|ing)?\b|\bmanifesto\b|\brally\b/i, 'campaign language'],
    [/\bparty\b|\bBJP\b|\bAITC\b|\bTMC\b|\btrinamool\b|\bCPI\s*\(?M\)?|\bcongress\b|\bINC\b/i, 'party reference'],
    [/\bsupport (us|our|the mla)\b|\bthank (our|the) mla\b|\bthanks to (our|the) mla\b/i, 'praise or appeal for a representative'],
    [/\bopponent(s)?\b|\bdefeat\b|\bwin(s|ning)?\b/i, 'contest language']
  ];
  function policyCheck(text, names) {
    const issues = [];
    const t = String(text || '');
    POLICY.forEach(([re, why]) => { const m = t.match(re); if (m) issues.push(`“${m[0]}” — ${why}`); });
    (names || []).filter(Boolean).forEach(n => {
      if (t.toLowerCase().includes(n.toLowerCase())) issues.push(`“${n}” — names an elected representative; service updates name offices, not people`);
    });
    return issues;
  }

  // ---------- helpers ----------
  const H = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => { try { const x = new URL(u); return ['http:', 'https:'].includes(x.protocol) ? x.href : ''; } catch { return ''; } };
  const today = () => new Date().toISOString().slice(0, 10);
  const nowIso = () => new Date().toISOString();
  const uid = () => 'p' + Math.random().toString(36).slice(2, 9);
  const inr = n => '₹' + Number(n).toLocaleString('en-IN');
  function seeded(str, lo, hi) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return lo + ((h >>> 0) % (hi - lo + 1));
  }

  // ---------- record → facts (field by field, so nothing is reworded) ----------
  function categoryFor(r) {
    const t = `${r.label || ''} ${r.title || ''} ${r.type || ''} ${r.detail || ''}`.toLowerCase();
    if (/water|tube-well|tap|pipe/.test(t)) return 'Water interruption';
    if (/road|lane|street|sarani/.test(t)) return 'Road work';
    if (r.module === 'health' || /hospital|uphc|clinic/.test(t)) return 'Clinic information';
    if (r.module === 'cleanliness' || /waste|pickup|drain/.test(t)) return 'Waste schedule';
    if (r.kind === 'project') return 'Project progress';
    return 'Project progress';
  }

  function factsFromRecord(r, ctx) {
    const p = ctx.p;
    const j = p.jurisdictions.find(x => x.id === r.jurisdiction);
    const src = r.source ? ctx.sources[r.source] : null;
    const verified = !r.mock && ['Verified', 'Source-reported'].includes(r.status);
    const lines = [];
    let headline = r.label || r.title || r.name || 'Service update';
    if (r.kind === 'project') {
      headline = `${r.title}`;
      lines.push(`Status: ${r.stage}${r.stage_date ? ` (${r.stage_date})` : ''}.`);
      if (r.agency) lines.push(`Agency: ${r.agency}.`);
      if (r.wards && r.wards.length) lines.push(`Ward${r.wards.length > 1 ? 's' : ''}: ${r.wards.join(', ')}.`);
      if (r.estimated_value) lines.push(`Estimated value put to tender: ${inr(r.estimated_value)}.`);
      if (r.unknown && r.unknown.length) lines.push(`Not yet confirmed: ${r.unknown.join(', ')}.`);
    } else if (r.kind === 'facility') {
      headline = r.name;
      lines.push(`${r.type}. ${r.address}.`);
      (r.contacts || []).forEach(([k, v]) => lines.push(`${k}: ${v}`));
    } else if (r.kind === 'fact') {
      lines.push(`${r.label}: ${typeof r.value === 'number' ? r.value.toLocaleString('en-IN') : r.value} ${r.unit} (${r.period}).`);
    } else if (r.kind === 'claim') {
      lines.push(`${r.claim}`);
    } else if (r.kind === 'issue') {
      lines.push(`${r.detail}.`);
    }
    if (r.caveat) lines.push(`Note: ${r.caveat}`);
    return {
      recordId: r.id,
      recordKind: r.kind,
      headline,
      body: lines.join('\n'),
      serviceArea: r.module,
      category: categoryFor(r),
      locality: [j ? j.short : 'Uttarpara AC 185', r.wards && r.wards.length ? `Ward ${r.wards.join(', ')}` : ''].filter(Boolean).join(' · '),
      source: src ? {
        publisher: src.publisher, title: src.record_title, url: src.url, referenceDate: src.reference_date,
        retrieved: src.retrieved, verificationNote: src.verification
      } : { publisher: 'No source — demo record', title: '', url: '', referenceDate: '', retrieved: '', verificationNote: 'Invented demo data' },
      lastVerified: src ? src.retrieved : '',
      verification: verified ? r.status : 'Needs verification',
      recordStatus: r.mock ? 'Mock' : r.status
    };
  }

  // ---------- REACH assist (mock): re-shape the same facts per format ----------
  function sourceLine(post) {
    const s = post.source || {};
    return `Source: ${s.publisher || 'not attached'}${s.referenceDate ? ` · ${s.referenceDate}` : ''}${post.lastVerified ? ` · checked ${post.lastVerified}` : ''}`;
  }
  function keyLine(post) {
    return (post.body || '').split('\n').find(l => l.trim()) || '';
  }
  function render(post, format) {
    const head = post.headline || 'Untitled update';
    const lines = (post.body || '').split('\n').filter(l => l.trim());
    const src = sourceLine(post);
    switch (format) {
      case 'fb_update':
        return { kind: 'text', title: head, text: [...lines, '', `📍 ${post.locality}`, src, post.source && post.source.url ? post.source.url : ''].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n') };
      case 'ig_square':
        return { kind: 'square', title: head.length > 70 ? head.slice(0, 68) + '…' : head, key: keyLine(post), foot: src, caption: [head, ...lines, `📍 ${post.locality}`, src].join('\n') };
      case 'ig_story':
        return { kind: 'story', title: head, key: lines.slice(0, 2).join(' · '), foot: src, locality: post.locality };
      case 'carousel':
        return {
          kind: 'carousel',
          slides: [
            { t: post.category, b: head },
            ...lines.slice(0, 5).map((l, i) => ({ t: ['What', 'Details', 'Details', 'Details', 'Note'][i] || 'Details', b: l })),
            { t: 'Where', b: post.locality },
            { t: 'Source', b: `${post.source ? post.source.publisher : ''}${post.source && post.source.referenceDate ? ' · ' + post.source.referenceDate : ''}` }
          ]
        };
      case 'reel_storyboard':
        return {
          kind: 'reel',
          frames: [
            { s: 3, on: post.category, note: 'Title card · area label' },
            { s: 4, on: head, note: 'Headline, plain text on brand shapes' },
            ...lines.slice(0, 3).map(l => ({ s: 4, on: l, note: 'Fact card (text only, no faces)' })),
            { s: 3, on: post.locality, note: 'Locality map label' },
            { s: 3, on: src, note: 'Source end card — required' }
          ]
        };
      default:
        return { kind: 'text', title: head, text: lines.join('\n') };
    }
  }
  // Every rendering must keep the source publisher and the record's first fact line verbatim.
  function factsPreserved(post) {
    const pub = post.source ? post.source.publisher : '';
    const key = keyLine(post);
    return Object.keys(FORMATS).every(f => {
      const text = JSON.stringify(render(post, f));
      const has = s => !s || text.includes(JSON.stringify(s).slice(1, -1));
      return has(pub) && has(key);
    });
  }

  // ---------- local store ----------
  function load() {
    try { const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (v && Array.isArray(v.posts)) return v; } catch (e) { /* storage blocked */ }
    return null;
  }
  let memory = null;
  function save(state) {
    memory = state;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ }
  }
  function state() { return memory || load(); }

  function seed(ctx) {
    const recs = ctx.records;
    const mk = (id, format, st, extra) => {
      const r = recs.find(x => x.id === id);
      if (!r) return null;
      const f = factsFromRecord(r, ctx);
      return { id: uid(), demo: true, format, ...f, editor: 'demo-editor', reviewer: null, state: st, assisted: true, history: [{ at: nowIso(), by: 'demo-seed', action: `Seeded as ${STATE_LABEL[st]}` }], ...extra };
    };
    const d = new Date();
    const plus = n => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) + 'T10:00'; };
    const posts = [
      mk('nit55-lot2', 'fb_update', 'published', { reviewer: 'demo-reviewer', publishedAt: nowIso(), simulated: true }),
      mk('mahamaya', 'ig_square', 'scheduled', { reviewer: 'demo-reviewer', scheduledFor: plus(2), simulated: true }),
      mk('mock-waste-timing', 'ig_story', 'in_review', {}),
      mk('nit55-lot3', 'carousel', 'draft', {})
    ].filter(Boolean);
    return { version: 1, posts, questions: [] };
  }
  function ensure(ctx) {
    let s = state();
    if (!s) { s = seed(ctx); save(s); }
    return s;
  }

  // ---------- adapter ----------
  /**
   * ReachAdapter — the interface a real REACH client would implement (mirrors /reach/api/v1):
   *   intake(brief) → {id}; run(intakeId, format) → campaign {id, variants:[{id, format, body}]};
   *   selectVariant(id, variantId); requestApproval(id); decide(id, {decision, comment});
   *   schedule(id, {scheduled_at}); publish(id); metrics(id).
   * Only the mock below exists. It never makes a network request.
   */
  function createMockReachAdapter(ctx) {
    const s = () => ensure(ctx);
    const find = id => s().posts.find(x => x.id === id);
    const log = (post, action) => post.history.push({ at: nowIso(), by: ctx.user, action });
    const commit = () => save(s());
    const names = [ctx.p.representative && ctx.p.representative.name];
    const blocked = post => policyCheck(`${post.headline}\n${post.body}\n${post.locality}`, names);
    return {
      mode: 'mock',
      network: false,
      intake(brief) {
        const post = { id: uid(), demo: true, editor: ctx.user, reviewer: null, state: 'draft', assisted: false, history: [], ...brief };
        log(post, 'Draft created');
        s().posts.unshift(post);
        commit();
        return Promise.resolve({ id: post.id });
      },
      run(id, format) {
        const post = find(id);
        post.format = format;
        post.assisted = true;
        log(post, `REACH assist (mock) shaped the draft as ${FORMATS[format].short}; facts and source unchanged`);
        commit();
        return Promise.resolve({ id, variants: Object.keys(FORMATS).map(f => ({ id: `${id}:${f}`, format: f, body: render(post, f) })) });
      },
      selectVariant(id, variantId) {
        const post = find(id);
        post.format = variantId.split(':')[1];
        commit();
        return Promise.resolve(post);
      },
      requestApproval(id) {
        const post = find(id);
        const issues = blocked(post);
        if (issues.length) return Promise.reject(new Error('Blocked by the public-service policy: ' + issues.join('; ')));
        post.state = 'in_review';
        log(post, 'Submitted for internal review');
        commit();
        return Promise.resolve(post);
      },
      decide(id, { decision, comment }) {
        const post = find(id);
        if (decision === 'APPROVED') {
          const issues = blocked(post);
          if (issues.length) return Promise.reject(new Error('Cannot approve: ' + issues.join('; ')));
          if (!SOURCED.includes(post.verification) && !post.verificationAcknowledged) {
            return Promise.reject(new Error('Needs verification: tick “I have checked this against its source” before approving.'));
          }
          post.state = 'approved';
        } else {
          post.state = 'changes_requested';
        }
        post.reviewer = ctx.user;
        post.reviewComment = comment || '';
        log(post, `${decision === 'APPROVED' ? 'Approved' : 'Changes requested'}${post.editor === ctx.user ? ' (self-review, demo)' : ''}${comment ? ': ' + comment : ''}`);
        commit();
        return Promise.resolve(post);
      },
      schedule(id, { scheduled_at }) {
        const post = find(id);
        if (post.state !== 'approved') return Promise.reject(new Error('Only approved posts can be scheduled (demo).'));
        post.state = 'scheduled';
        post.scheduledFor = scheduled_at;
        post.simulated = true;
        log(post, `Simulated schedule for ${scheduled_at} — nothing was scheduled externally`);
        commit();
        return Promise.resolve(post);
      },
      publish(id) {
        const post = find(id);
        if (!['approved', 'scheduled'].includes(post.state)) return Promise.reject(new Error('Only approved posts can be published to the demo feed.'));
        post.state = 'published';
        post.publishedAt = nowIso();
        post.simulated = true;
        log(post, SIM_NOTE);
        commit();
        return Promise.resolve(post);
      },
      metrics(id) {
        const post = find(id);
        if (post.state !== 'published') return Promise.resolve(null);
        const views = seeded(post.id, 180, 2400);
        return Promise.resolve({ synthetic: true, views, interactions: Math.round(views * seeded(post.id + 'i', 2, 9) / 100), questions: seeded(post.id + 'q', 0, 6) });
      }
    };
  }

  // ---------- views ----------
  let tab = 'compose';
  let editingId = null;
  let previewFormat = null;
  let posterId = null;
  let posterSize = 'square';

  const DEMO = '<span class="rx-demo">DEMO</span>';
  const stateChip = st => `<span class="rx-state rx-${st}">${H(STATE_LABEL[st] || st)}</span>`;
  const verChip = v => v === 'Verified' ? '<span class="badge st-verified">Verified</span>' : v === 'Source-reported' ? '<span class="badge st-source">Source-reported</span>' : '<span class="badge st-confirm">Needs verification</span>';

  function provenance(post) {
    const s = post.source || {};
    const url = safeUrl(s.url);
    return `<dl class="rx-prov">
      <dt>Source</dt><dd>${H(s.publisher || 'Not attached')}${s.title ? ` — ${H(s.title)}` : ''}</dd>
      <dt>Source URL</dt><dd>${url ? `<a href="${H(url)}" target="_blank" rel="noopener noreferrer">${H(url)}</a>` : '—'}</dd>
      <dt>Locality</dt><dd>${H(post.locality)}</dd>
      <dt>Service area</dt><dd>${H(post.serviceArea)} · ${H(post.category)}</dd>
      <dt>Last verified</dt><dd>${H(post.lastVerified || 'Not verified')}</dd>
      <dt>Verification</dt><dd>${verChip(post.verification)}${!SOURCED.includes(post.verification) ? ' <span class="rx-warn">Mock or unconfirmed data — needs verification before any real use.</span>' : ''}</dd>
      <dt>Editor / reviewer</dt><dd>${H(post.editor || '—')} / ${H(post.reviewer || 'not reviewed')} · ${stateChip(post.state)}</dd>
    </dl>`;
  }

  function preview(post, format) {
    const r = render(post, format);
    const dest = DESTS[FORMATS[format].dest];
    const avatar = `<span class="rx-avatar" aria-hidden="true">U</span>`;
    const head = `<div class="rx-phead">${avatar}<div><strong>${H(dest.name)}</strong><small>${H(FORMATS[format].label)} · ${DEMO}</small></div></div>`;
    const sim = post.state === 'published' ? `<div class="rx-sim">${SIM_NOTE}</div>` : `<div class="rx-sim rx-sim-pre">Preview only · not published · ${DEMO}</div>`;
    const icon = CATEGORY_ICON[post.category] || '◎';
    if (r.kind === 'text') {
      return `<article class="rx-card rx-fb">${head}<h4>${H(r.title)}</h4><p class="rx-text">${H(r.text).replace(/\n/g, '<br>')}</p>
        <div class="rx-fakebar">Like · Comment · Share <span>(demo buttons — inactive)</span></div>${sim}</article>`;
    }
    if (r.kind === 'square') {
      return `<article class="rx-card rx-ig">${head}<div class="rx-square"><span class="rx-ico">${icon}</span><b>${H(r.title)}</b><span>${H(r.key)}</span><small>${H(r.foot)}</small><i class="rx-wm">DEMO</i></div>
        <p class="rx-text rx-cap">${H(r.caption).replace(/\n/g, '<br>')}</p>${sim}</article>`;
    }
    if (r.kind === 'story') {
      return `<article class="rx-card rx-ig">${head}<div class="rx-story"><span class="rx-ico">${icon}</span><b>${H(r.title)}</b><span>${H(r.key)}</span><em>📍 ${H(r.locality)}</em><small>${H(r.foot)}</small><i class="rx-wm">DEMO</i></div>${sim}</article>`;
    }
    if (r.kind === 'carousel') {
      return `<article class="rx-card rx-ig">${head}<div class="rx-carousel">${r.slides.map((s, i) => `<div class="rx-slide"><small>${i + 1}/${r.slides.length} · ${H(s.t)}</small><b>${H(s.b)}</b><i class="rx-wm">DEMO</i></div>`).join('')}</div>${sim}</article>`;
    }
    return `<article class="rx-card rx-ig">${head}<ol class="rx-reel">${r.frames.map(f => `<li><span class="rx-sec">${f.s}s</span><b>${H(f.on)}</b><small>${H(f.note)}</small></li>`).join('')}</ol>
      <p class="rx-text">Storyboard preview only — no video is generated or uploaded. ${DEMO}</p>${sim}</article>`;
  }

  function serviceRecords(ctx) {
    return ctx.records.filter(r => SERVICE_MODULES.includes(r.module) || r.kind === 'project');
  }

  function composeView(ctx, s) {
    const post = s.posts.find(x => x.id === editingId);
    const recs = serviceRecords(ctx);
    const fmtSel = post ? post.format : 'fb_update';
    const pf = previewFormat || fmtSel;
    const issues = post ? policyCheck(`${post.headline}\n${post.body}\n${post.locality}`, [ctx.p.representative && ctx.p.representative.name]) : [];
    const queue = s.posts.filter(x => ['draft', 'in_review', 'changes_requested', 'approved'].includes(x.state));
    return `<div class="rx-grid">
      <section class="panel rx-compose">
        <div class="panel-head"><div><h3>Composer ${DEMO}</h3><p>Start from a JanDrishti service record so the source travels with the post.</p></div></div>
        <label class="rx-l">Start from a service record</label>
        <div class="rx-row"><select id="rxRecord" class="mini-select"><option value="">Choose a record…</option>${SERVICE_MODULES.map(m => {
          const rs = recs.filter(r => (r.kind === 'project' ? 'projects' : r.module) === m || (m === 'projects' && r.kind === 'project'));
          return rs.length ? `<optgroup label="${H(m)}">${rs.map(r => `<option value="${H(r.id)}">${H(r.label || r.title || r.name)} — ${H(r.mock ? 'MOCK' : r.status)}</option>`).join('')}</optgroup>` : '';
        }).join('')}</select><button class="outline-btn" id="rxFromRecord" type="button">Create draft</button><button class="outline-btn" id="rxBlank" type="button">Blank draft</button></div>
        ${post ? `
        <div class="rx-fields">
          <label class="rx-l">Format</label><select id="rxFormat" class="mini-select">${Object.entries(FORMATS).map(([k, f]) => `<option value="${k}" ${k === fmtSel ? 'selected' : ''}>${H(f.label)}</option>`).join('')}</select>
          <label class="rx-l">Service area</label><select id="rxArea" class="mini-select">${SERVICE_MODULES.map(m => `<option ${m === post.serviceArea ? 'selected' : ''}>${m}</option>`).join('')}</select>
          <label class="rx-l">Category</label><select id="rxCat" class="mini-select">${CATEGORIES.map(c => `<option ${c === post.category ? 'selected' : ''}>${H(c)}</option>`).join('')}</select>
          <label class="rx-l">Locality</label><input id="rxLoc" class="search" value="${H(post.locality)}">
          <label class="rx-l">Headline</label><input id="rxHead" class="search" maxlength="120" value="${H(post.headline)}">
          <label class="rx-l">Public update</label><textarea id="rxBody" class="search rx-ta" rows="6">${H(post.body)}</textarea>
          <fieldset class="rx-src"><legend>Source record ${post.recordId ? `· ${H(post.recordId)}` : '· none'}</legend>
            <label class="rx-l">Publisher</label><input id="rxSrcPub" class="search" value="${H(post.source.publisher)}">
            <label class="rx-l">Source URL</label><input id="rxSrcUrl" class="search" value="${H(post.source.url)}">
            <label class="rx-l">Source date</label><input id="rxSrcDate" class="search" value="${H(post.source.referenceDate)}">
            <label class="rx-l">Last verified</label><input id="rxVerDate" class="search" type="date" value="${H(post.lastVerified)}">
            <label class="rx-l">Verification</label><select id="rxVer" class="mini-select">${['Verified', 'Source-reported', 'Needs verification'].map(v => `<option ${v === post.verification ? 'selected' : ''}>${v}</option>`).join('')}</select>
          </fieldset>
          ${issues.length ? `<div class="notice warn">⛔ <span><b>Public-service policy:</b> ${issues.map(H).join('<br>')}<br>Remove these before review. Updates are factual, nonpartisan service information only.</span></div>` : ''}
          ${!SOURCED.includes(post.verification) ? `<div class="notice">⚠ <span><b>Needs verification.</b> This draft uses mock or unconfirmed data. It must be checked against its source before approval.</span></div>` : ''}
          <div class="rx-actions">
            <button class="outline-btn" id="rxAssist" type="button">✦ REACH assist (mock): shape for ${H(FORMATS[fmtSel].short)}</button>
            <button class="outline-btn" id="rxSave" type="button">Save draft</button>
            <button class="outline-btn" id="rxSubmit" type="button" ${post.state === 'draft' || post.state === 'changes_requested' ? '' : 'disabled'}>Submit for review</button>
          </div>
          <div class="rx-review">
            <h4>Internal review ${DEMO}</h4>
            ${!SOURCED.includes(post.verification) ? `<label class="rx-check"><input type="checkbox" id="rxAck" ${post.verificationAcknowledged ? 'checked' : ''}> I have checked this against its source</label>` : ''}
            <input id="rxComment" class="search" placeholder="Reviewer comment (optional)">
            <div class="rx-actions">
              <button class="outline-btn" id="rxApprove" type="button" ${post.state === 'in_review' ? '' : 'disabled'}>Approve</button>
              <button class="outline-btn" id="rxChanges" type="button" ${post.state === 'in_review' ? '' : 'disabled'}>Request changes</button>
            </div>
            <h4>Simulated release ${DEMO}</h4>
            <div class="rx-actions">
              <input id="rxWhen" class="search" type="datetime-local" value="${H(post.scheduledFor || '')}">
              <button class="outline-btn" id="rxSchedule" type="button" ${post.state === 'approved' ? '' : 'disabled'}>Simulated schedule</button>
              <button class="login-btn rx-pub" id="rxPublish" type="button" ${['approved', 'scheduled'].includes(post.state) ? '' : 'disabled'}>Simulated publish</button>
            </div>
            <p class="rx-sim">${SIM_NOTE} Publish and schedule only change this browser's demo feed.</p>
          </div>
          <div class="rx-hist"><h4>History</h4><ul>${post.history.slice().reverse().map(h => `<li><small>${H(h.at.slice(0, 16).replace('T', ' '))}</small> ${H(h.by)}: ${H(h.action)}</li>`).join('')}</ul></div>
        </div>` : '<div class="empty">Choose a service record, or start a blank draft.</div>'}
      </section>
      <section class="panel rx-preview">
        <div class="panel-head"><div><h3>Preview ${DEMO}</h3><p>The same draft in every supported demo format</p></div></div>
        ${post ? `<div class="chip-row">${Object.entries(FORMATS).map(([k, f]) => `<button type="button" class="chip ${k === pf ? 'on' : ''}" data-rx-pf="${k}">${H(f.short)}</button>`).join('')}</div>
        <div class="rx-pv">${preview(post, pf)}</div>${provenance(post)}` : '<div class="empty">Nothing to preview yet.</div>'}
      </section>
    </div>
    <section class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>Review queue ${DEMO}</h3><p>Drafts, items in review and approved posts</p></div></div>
      <div class="list">${queue.map(x => `<button class="row" data-rx-edit="${H(x.id)}"><div><strong>${H(x.headline)}</strong><small>${H(FORMATS[x.format].short)} · ${H(x.locality)} · editor ${H(x.editor)}</small></div><div class="right">${stateChip(x.state)}${verChip(x.verification)}</div></button>`).join('') || '<div class="empty">Queue is empty.</div>'}</div></section>`;
  }

  function pagesView(ctx, s) {
    const pub = s.posts.filter(x => x.state === 'published');
    const fb = pub.filter(x => FORMATS[x.format].dest === 'fb');
    const ig = pub.filter(x => FORMATS[x.format].dest === 'ig');
    const pageHead = (d, n) => `<div class="rx-cover"><span class="rx-c1"></span><span class="rx-c2"></span><span class="rx-avatar rx-big">U</span>
      <div><h3>${H(d.name)}</h3><small>@${H(d.handle)} · fictional demo page · ${n} demo post${n === 1 ? '' : 's'}</small></div>${DEMO}</div>`;
    return `<div class="notice">ⓘ <span>These are <b>fictional demo pages</b> with original styling. They are not connected to Facebook or Instagram and have no real followers. ${SIM_NOTE}</span></div>
    <div class="rx-pages">
      <section class="panel rx-page">${pageHead(DESTS.fb, fb.length)}
        <div class="rx-feed">${fb.map(x => `${preview(x, x.format)}${provenance(x)}`).join('') || '<div class="empty">No demo posts yet. Simulated-publish an approved FB update.</div>'}</div></section>
      <section class="panel rx-page">${pageHead(DESTS.ig, ig.length)}
        <div class="rx-stories">${ig.filter(x => x.format === 'ig_story').map(x => `<button class="rx-ring" data-rx-open="${H(x.id)}" title="${H(x.headline)}"><span>${CATEGORY_ICON[x.category] || '◎'}</span></button>`).join('') || '<small class="muted">No demo stories</small>'}</div>
        <div class="rx-tiles">${ig.filter(x => x.format !== 'ig_story').map(x => `<button class="rx-tile" data-rx-open="${H(x.id)}"><span>${CATEGORY_ICON[x.category] || '◎'}</span><b>${H(x.headline)}</b><i class="rx-wm">DEMO</i></button>`).join('') || '<div class="empty">No demo posts yet.</div>'}</div></section>
    </div>`;
  }

  const SIZES = { square: [1080, 1080, 'Square 1:1'], story: [1080, 1920, 'Portrait / story 9:16'], landscape: [1200, 628, 'Landscape 1.91:1'] };
  function poster(p, size) {
    const [w, h] = SIZES[size];
    const sc = w / 1080;
    const wrap = (t, n) => { const out = []; let line = ''; String(t || '').split(/\s+/).forEach(word => { if ((line + ' ' + word).trim().length > n) { out.push(line.trim()); line = word; } else line += ' ' + word; }); if (line.trim()) out.push(line.trim()); return out; };
    const titleLines = wrap(p.title, size === 'landscape' ? 34 : 22).slice(0, 4);
    const bodyLines = wrap(p.body, size === 'landscape' ? 60 : 40).slice(0, size === 'story' ? 9 : 5);
    const fs = 64 * sc, bs = 34 * sc;
    let y = (size === 'story' ? 520 : size === 'landscape' ? 170 : 330) * sc;
    const tspan = (lines, size_, gap) => lines.map(l => { const t = `<text x="${70 * sc}" y="${y}" font-size="${size_}" font-weight="${size_ === fs ? 800 : 500}" fill="#0f2a33">${H(l)}</text>`; y += gap; return t; }).join('');
    const title = tspan(titleLines, fs, fs * 1.15);
    y += 20 * sc;
    const body = tspan(bodyLines, bs, bs * 1.4);
    return `<svg class="rx-poster" viewBox="0 0 ${w} ${h}" role="img" aria-label="Demo service notice poster">
      <rect width="${w}" height="${h}" fill="#f6f1e6"/>
      <circle cx="${w - 120 * sc}" cy="${150 * sc}" r="${260 * sc}" fill="none" stroke="#0a6b67" stroke-opacity=".25" stroke-width="${3 * sc}"/>
      <circle cx="${w - 120 * sc}" cy="${150 * sc}" r="${170 * sc}" fill="#0a6b67" fill-opacity=".08"/>
      <ellipse cx="${w - 120 * sc}" cy="${150 * sc}" rx="${330 * sc}" ry="${90 * sc}" fill="none" stroke="#c46a14" stroke-opacity=".5" stroke-width="${3 * sc}" transform="rotate(-24 ${w - 120 * sc} ${150 * sc})"/>
      <text x="${w - 120 * sc}" y="${190 * sc}" text-anchor="middle" font-size="${120 * sc}">${H(CATEGORY_ICON[p.category] || '◎')}</text>
      <rect x="${70 * sc}" y="${70 * sc}" rx="${22 * sc}" width="${430 * sc}" height="${56 * sc}" fill="#0a6b67"/>
      <text x="${92 * sc}" y="${108 * sc}" font-size="${28 * sc}" font-weight="700" fill="#fff">${H((p.category || 'Service notice').toUpperCase())}</text>
      ${title}${body}
      <g transform="translate(${70 * sc} ${h - 300 * sc})">
        <circle cx="${26 * sc}" cy="${26 * sc}" r="${26 * sc}" fill="#c46a14"/><text x="${26 * sc}" y="${36 * sc}" text-anchor="middle" font-size="${26 * sc}" fill="#fff">📍</text>
        <text x="${70 * sc}" y="${36 * sc}" font-size="${32 * sc}" font-weight="700" fill="#0f2a33">${H(p.locality)}</text>
        <text x="${70 * sc}" y="${86 * sc}" font-size="${28 * sc}" fill="#33505a">${H(p.dates)}</text>
        <text x="${70 * sc}" y="${132 * sc}" font-size="${28 * sc}" fill="#33505a">${H(p.contact)}</text>
      </g>
      <text x="${70 * sc}" y="${h - 70 * sc}" font-size="${22 * sc}" fill="#4c6670">${H(p.source)}</text>
      <rect x="${w - 260 * sc}" y="${h - 110 * sc}" rx="${14 * sc}" width="${200 * sc}" height="${56 * sc}" fill="#9a5b00"/>
      <text x="${w - 160 * sc}" y="${h - 72 * sc}" text-anchor="middle" font-size="${30 * sc}" font-weight="800" fill="#fff">DEMO</text>
    </svg>`;
  }

  function posterView(ctx, s) {
    const post = s.posts.find(x => x.id === posterId) || s.posts[0];
    const pd = s.poster || {};
    const data = {
      title: pd.title ?? (post ? post.headline : ''),
      body: pd.body ?? (post ? (post.body || '').split('\n')[0] : ''),
      category: pd.category ?? (post ? post.category : 'Public meeting'),
      locality: pd.locality ?? (post ? post.locality : ''),
      dates: pd.dates ?? '',
      contact: pd.contact ?? 'Municipal office: 2663-4095',
      source: pd.source ?? (post ? sourceLine(post) : 'Source: —')
    };
    const issues = policyCheck(Object.values(data).join('\n'), [ctx.p.representative && ctx.p.representative.name]);
    return `<div class="rx-grid">
      <section class="panel"><div class="panel-head"><div><h3>Poster editor ${DEMO}</h3><p>Factual service notices only: text, area labels, dates, contacts and source.</p></div></div>
        <label class="rx-l">Fill from post</label><select id="rxPosterPost" class="mini-select">${s.posts.map(x => `<option value="${H(x.id)}" ${post && x.id === post.id ? 'selected' : ''}>${H(x.headline)}</option>`).join('')}</select>
        ${['title', 'body', 'locality', 'dates', 'contact', 'source'].map(k => `<label class="rx-l">${k[0].toUpperCase() + k.slice(1)}</label><input class="search" data-rx-poster="${k}" value="${H(data[k])}">`).join('')}
        <label class="rx-l">Category icon</label><select class="mini-select" data-rx-poster="category">${CATEGORIES.map(c => `<option ${c === data.category ? 'selected' : ''}>${H(c)}</option>`).join('')}</select>
        ${issues.length ? `<div class="notice warn">⛔ <span><b>Public-service policy:</b> ${issues.map(H).join('<br>')}</span></div>` : ''}
        <p class="rx-sim">Posters are generated in this browser only. No portraits, party symbols, slogans or appeals. ${DEMO}</p>
      </section>
      <section class="panel"><div class="panel-head"><div><h3>Preview ${DEMO}</h3><p>${H(SIZES[posterSize][2])}</p></div>
        <div class="chip-row">${Object.entries(SIZES).map(([k, v]) => `<button type="button" class="chip ${k === posterSize ? 'on' : ''}" data-rx-size="${k}">${H(v[2])}</button>`).join('')}</div></div>
        <div class="rx-poster-wrap rx-${posterSize}">${poster(data, posterSize)}</div>
      </section></div>`;
  }

  function calendarView(ctx, s) {
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth();
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const on = day => {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return s.posts.filter(x => (x.state === 'scheduled' && (x.scheduledFor || '').startsWith(key)) || (x.state === 'published' && (x.publishedAt || '').startsWith(key)));
    };
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<div class="rx-day rx-empty"></div>');
    for (let day = 1; day <= days; day++) {
      const items = on(day);
      cells.push(`<div class="rx-day ${day === d.getDate() ? 'rx-today' : ''}"><small>${day}</small>${items.map(x => `<button class="rx-ev rx-${x.state}" data-rx-edit="${H(x.id)}">${H(CATEGORY_ICON[x.category] || '◎')} ${H(x.headline.slice(0, 26))}${x.headline.length > 26 ? '…' : ''} <i>DEMO</i></button>`).join('')}</div>`);
    }
    return `<section class="panel"><div class="panel-head"><div><h3>Content calendar ${DEMO}</h3><p>${H(first.toLocaleString('en-IN', { month: 'long', year: 'numeric' }))} · simulated schedule and simulated publishes in this browser</p></div></div>
      <div class="rx-cal"><b>Mon</b><b>Tue</b><b>Wed</b><b>Thu</b><b>Fri</b><b>Sat</b><b>Sun</b>${cells.join('')}</div>
      <p class="rx-sim">Nothing on this calendar is scheduled on any real platform. ${DEMO}</p></section>`;
  }

  function analyticsView(ctx, s) {
    const pub = s.posts.filter(x => x.state === 'published');
    const awaiting = s.posts.filter(x => ['in_review', 'changes_requested'].includes(x.state)).length;
    const covered = new Set(s.posts.filter(x => ['published', 'scheduled'].includes(x.state)).map(x => x.category));
    const per = pub.map(x => { const v = seeded(x.id, 180, 2400); return { x, v, i: Math.round(v * seeded(x.id + 'i', 2, 9) / 100), q: seeded(x.id + 'q', 0, 6) }; });
    const views = per.reduce((a, r) => a + r.v, 0), inter = per.reduce((a, r) => a + r.i, 0), qs = per.reduce((a, r) => a + r.q, 0);
    const reports = CATEGORIES.map(c => [c, seeded('reports' + c + s.posts.length, 0, 9)]);
    const max = Math.max(1, ...reports.map(r => r[1]));
    const tile = (label, v, foot) => `<div class="metric rx-metric"><div class="metric-label">${H(label)} <span class="rx-demo">DEMO</span></div><div class="metric-value">${H(String(v))}</div><div class="metric-foot">${H(foot)}</div></div>`;
    return `<div class="notice warn">⚠ <span><b>Synthetic demo figures.</b> Generated in this browser from post IDs. They are <b>not</b> Meta / Facebook / Instagram analytics and say nothing about real reach or public opinion.</span></div>
      <section class="metric-grid">${tile('Drafts awaiting review', awaiting, 'In review or changes requested')}${tile('Service categories covered', `${covered.size}/${CATEGORIES.length}`, 'Published or scheduled (demo)')}${tile('Simulated views', views.toLocaleString('en-IN'), 'Synthetic · demo feed only')}${tile('Simulated interactions', inter.toLocaleString('en-IN'), 'Synthetic · demo feed only')}</section>
      <div class="grid-2e"><section class="panel"><div class="panel-head"><div><h3>Per post ${DEMO}</h3><p>Synthetic views, interactions and questions</p></div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Post</th><th class="num">Views</th><th class="num">Interactions</th><th class="num">Questions</th><th></th></tr></thead>
        <tbody>${per.map(r => `<tr class="nolink"><td style="white-space:normal">${H(r.x.headline)}</td><td class="num">${r.v.toLocaleString('en-IN')}</td><td class="num">${r.i}</td><td class="num">${r.q}</td><td><span class="rx-demo">DEMO</span></td></tr>`).join('') || '<tr class="nolink"><td colspan="5">No simulated publishes yet.</td></tr>'}</tbody></table></div></section>
      <section class="panel"><div class="panel-head"><div><h3>Questions & service reports received ${DEMO}</h3><p>Synthetic counts by service category — total questions on posts: ${qs}</p></div></div>
        ${reports.map(([c, n]) => `<div class="bar-row"><span>${H(c)}</span><div class="bar"><span style="width:${(n / max) * 100}%"></span></div><span class="num">${n}</span></div>`).join('')}
        <p class="rx-sim">No sentiment, opinion or approval is inferred from these synthetic counts. ${DEMO}</p></section></div>`;
  }

  function view(ctx) {
    const s = ensure(ctx);
    const tabs = [['compose', 'Composer & review'], ['pages', 'Demo pages'], ['poster', 'Poster editor'], ['calendar', 'Calendar'], ['analytics', 'Analytics']];
    const body = { compose: composeView, pages: pagesView, poster: posterView, calendar: calendarView, analytics: analyticsView }[tab](ctx, s);
    return `<div class="rx" id="rxRoot">
      <div class="rx-banner" role="note"><span class="rx-demo">DEMO ONLY</span> <span><b>Simulated Facebook and Instagram pages.</b> Not connected to Meta or any account. Publish and Schedule only change this browser's demo state. <b>${SIM_NOTE}</b></span></div>
      <div class="chip-row rx-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === tab}" class="chip ${k === tab ? 'on' : ''}" data-rx-tab="${k}">${H(l)}</button>`).join('')}
        <button type="button" class="chip" id="rxReset" title="Clear this browser's demo posts">Reset demo</button></div>
      ${body}
    </div>`;
  }

  function bind(ctx) {
    const root = document.getElementById('rxRoot');
    if (!root) return;
    const api = createMockReachAdapter(ctx);
    const rerender = () => { const host = root.parentElement; root.outerHTML = view(ctx); bind(ctx); if (host) host.scrollIntoView({ block: 'nearest' }); };
    const q = sel => root.querySelector(sel);
    const qa = sel => [...root.querySelectorAll(sel)];
    const fail = e => ctx.toast(e.message);

    qa('[data-rx-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.rxTab; rerender(); }));
    q('#rxReset').addEventListener('click', () => { save(seed(ctx)); editingId = null; ctx.toast('Demo state reset (this browser only)'); rerender(); });
    qa('[data-rx-edit]').forEach(b => b.addEventListener('click', () => { editingId = b.dataset.rxEdit; previewFormat = null; tab = 'compose'; rerender(); }));
    qa('[data-rx-open]').forEach(b => b.addEventListener('click', () => {
      const post = ensure(ctx).posts.find(x => x.id === b.dataset.rxOpen);
      ctx.openDrawer(`<h2 id="drawerTitle">${H(post.headline)} ${DEMO}</h2>${preview(post, post.format)}${provenance(post)}`);
    }));
    qa('[data-rx-pf]').forEach(b => b.addEventListener('click', () => { previewFormat = b.dataset.rxPf; rerender(); }));

    const fromRec = q('#rxFromRecord');
    if (fromRec) fromRec.addEventListener('click', () => {
      const id = q('#rxRecord').value;
      const r = ctx.records.find(x => x.id === id);
      if (!r) return ctx.toast('Choose a service record first');
      api.intake({ format: 'fb_update', ...factsFromRecord(r, ctx) }).then(res => { editingId = res.id; previewFormat = null; rerender(); });
    });
    const blank = q('#rxBlank');
    if (blank) blank.addEventListener('click', () => {
      api.intake({ format: 'fb_update', headline: '', body: '', serviceArea: 'infrastructure', category: 'Public meeting', locality: 'Uttarpara AC 185', source: { publisher: '', title: '', url: '', referenceDate: '', retrieved: '' }, lastVerified: '', verification: 'Needs verification', recordId: null }).then(res => { editingId = res.id; rerender(); });
    });

    const post = ensure(ctx).posts.find(x => x.id === editingId);
    const readForm = () => {
      if (!post || !q('#rxHead')) return;
      Object.assign(post, {
        format: q('#rxFormat').value, serviceArea: q('#rxArea').value, category: q('#rxCat').value, locality: q('#rxLoc').value,
        headline: q('#rxHead').value, body: q('#rxBody').value, lastVerified: q('#rxVerDate').value, verification: q('#rxVer').value,
        source: { ...post.source, publisher: q('#rxSrcPub').value, url: q('#rxSrcUrl').value, referenceDate: q('#rxSrcDate').value }
      });
      const ack = q('#rxAck');
      if (ack) post.verificationAcknowledged = ack.checked;
    };
    const persist = () => { readForm(); save(ensure(ctx)); };
    const on = (id, fn) => { const el = q(id); if (el) el.addEventListener('click', fn); };
    ['#rxFormat', '#rxArea', '#rxCat', '#rxVer'].forEach(id => { const el = q(id); if (el) el.addEventListener('change', () => { persist(); rerender(); }); });
    on('#rxSave', () => { persist(); post.history.push({ at: nowIso(), by: ctx.user, action: 'Draft saved' }); save(ensure(ctx)); ctx.toast('Draft saved (demo, this browser)'); rerender(); });
    on('#rxAssist', () => { persist(); api.run(post.id, post.format).then(() => { ctx.toast('REACH assist (mock): reshaped — facts and source unchanged'); rerender(); }); });
    on('#rxSubmit', () => { persist(); api.requestApproval(post.id).then(() => { ctx.toast('Submitted for internal review (demo)'); rerender(); }, fail); });
    on('#rxApprove', () => { persist(); api.decide(post.id, { decision: 'APPROVED', comment: q('#rxComment').value }).then(() => { ctx.toast('Approved (demo)'); rerender(); }, fail); });
    on('#rxChanges', () => { persist(); api.decide(post.id, { decision: 'CHANGES_REQUESTED', comment: q('#rxComment').value }).then(() => rerender(), fail); });
    on('#rxSchedule', () => {
      persist();
      const when = q('#rxWhen').value;
      if (!when) return ctx.toast('Pick a date and time first');
      api.schedule(post.id, { scheduled_at: when }).then(() => { ctx.toast('Simulated schedule — nothing was scheduled externally'); rerender(); }, fail);
    });
    on('#rxPublish', () => { persist(); api.publish(post.id).then(() => { ctx.toast(SIM_NOTE); rerender(); }, fail); });

    qa('[data-rx-poster]').forEach(el => el.addEventListener('input', () => {
      const s = ensure(ctx);
      s.poster = s.poster || {};
      s.poster[el.dataset.rxPoster] = el.value;
      save(s);
      const wrap = root.querySelector('.rx-poster-wrap');
      // Re-render only the preview so the field keeps focus while typing.
      const tmp = document.createElement('div');
      tmp.innerHTML = view(ctx);
      wrap.innerHTML = tmp.querySelector('.rx-poster-wrap').innerHTML;
    }));
    const pp = q('#rxPosterPost');
    if (pp) pp.addEventListener('change', () => { posterId = pp.value; const s = ensure(ctx); s.poster = {}; save(s); rerender(); });
    qa('[data-rx-size]').forEach(b => b.addEventListener('click', () => { posterSize = b.dataset.rxSize; rerender(); }));
  }

  window.JDReach = { view, bind, createMockReachAdapter, policyCheck, factsFromRecord, render, factsPreserved, FORMATS, DESTS, SIM_NOTE, STORE_KEY, SERVICE_MODULES };
})();
