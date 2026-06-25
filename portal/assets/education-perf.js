/**
 * Education UX performance telemetry — client-side timing + optional pod flush.
 * Inspect: EducationPerf.summary() in browser console.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'education_perf_v1';
  const MAX_EVENTS = 200;
  const FLUSH_EVERY = 12;
  let flushCount = 0;

  function apiBase() {
    if (global.Cbse10TutorApi?.apiBase) return global.Cbse10TutorApi.apiBase();
    const params = new URLSearchParams(global.location?.search || '');
    const explicit = params.get('education_api');
    if (explicit) return explicit.replace(/\/$/, '');
    return 'https://api.brahmando.com/education';
  }

  function readEvents() {
    try {
      const raw = global.sessionStorage?.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function writeEvents(events) {
    try {
      global.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch {
      /* quota */
    }
  }

  function record(op, detail) {
    const evt = {
      op,
      ts: new Date().toISOString(),
      page: global.location?.pathname || '',
      sku: detail?.sku || 'cbse10-core',
      durationMs: Math.round(Number(detail?.durationMs) || 0),
      usedAi: Boolean(detail?.usedAi),
      source: detail?.source || '',
      gradedBy: detail?.gradedBy || '',
      ok: detail?.ok !== false,
      questionId: detail?.questionId || '',
      extra: detail?.extra || undefined,
    };
    const events = readEvents();
    events.push(evt);
    writeEvents(events);
    flushCount += 1;
    if (flushCount >= FLUSH_EVERY) {
      flushCount = 0;
      flush().catch(() => {});
    }
    return evt;
  }

  async function timed(op, fn, meta) {
    const t0 = global.performance?.now?.() ?? Date.now();
    let ok = true;
    try {
      return await fn();
    } catch (e) {
      ok = false;
      throw e;
    } finally {
      const t1 = global.performance?.now?.() ?? Date.now();
      record(op, { ...(meta || {}), durationMs: t1 - t0, ok });
    }
  }

  function percentile(sorted, p) {
    if (!sorted.length) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  }

  function summary(filterOp) {
    const events = filterOp ? readEvents().filter((e) => e.op === filterOp) : readEvents();
    const byOp = {};
    events.forEach((e) => {
      if (!byOp[e.op]) byOp[e.op] = [];
      byOp[e.op].push(e);
    });
    const out = { total: events.length, byOp: {} };
    Object.keys(byOp).forEach((op) => {
      const rows = byOp[op];
      const durations = rows.map((r) => r.durationMs).sort((a, b) => a - b);
      const aiHits = rows.filter((r) => r.usedAi).length;
      out.byOp[op] = {
        count: rows.length,
        aiHits,
        localHits: rows.length - aiHits,
        p50Ms: percentile(durations, 50),
        p95Ms: percentile(durations, 95),
        maxMs: durations.length ? durations[durations.length - 1] : 0,
        sources: rows.reduce((acc, r) => {
          const k = r.source || r.gradedBy || 'unknown';
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        }, {}),
      };
    });
    return out;
  }

  async function flush() {
    const events = readEvents();
    if (!events.length) return { flushed: 0 };
    const batch = events.slice(-40);
    try {
      const res = await fetch(apiBase() + '/ops/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ source: 'portal', events: batch }),
        keepalive: true,
      });
      if (res.ok) return { flushed: batch.length };
    } catch {
      /* offline */
    }
    return { flushed: 0 };
  }

  global.EducationPerf = { record, timed, summary, flush, readEvents };
})(typeof window !== 'undefined' ? window : globalThis);
