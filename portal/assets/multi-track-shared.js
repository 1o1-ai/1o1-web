/**
 * Multi-track exam shared loaders — GRE/GMAT, TOEFL/IELTS/DET, etc.
 */
(function (global) {
  'use strict';

  function skuId() {
    return document.body?.dataset?.sku || global.AnyoAcademyConfig?.detectSku?.() || '';
  }

  function cfg() {
    return global.AnyoAcademyConfig?.get?.(skuId()) || {};
  }

  const banks = {};

  function loadVerifiedBank() {
    const id = skuId();
    if (banks[id]) return Promise.resolve(banks[id]);
    const path = cfg().bankPath || `/portal/data/${id}-questions.json`;
    return fetch(path)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((data) => {
        banks[id] = (data.questions || []).filter(
          (q) => q.answer_verified && (q.options || []).length >= 2 && q.correct_index != null
        );
        return banks[id];
      })
      .catch(() => {
        banks[id] = [];
        return banks[id];
      });
  }

  function toDisplayQ(q) {
    const opts = (q.options || []).map((o) => String(o || '').trim()).filter(Boolean);
    return {
      id: q.id,
      track: q.track,
      section: q.section,
      chapter: q.chapter,
      prompt: q.question || q.prompt,
      options: opts,
      optionLabels: q.option_labels || opts.map((_, i) => String.fromCharCode(65 + i)),
      correctIndex: q.correct_index != null ? q.correct_index : q.correctIndex,
      passageContext: q.passage_context || '',
    };
  }

  function filterQuestions(bank, { track, section, chapter, limit }) {
    let pool = bank.filter((q) => {
      if (track && (q.track || '').toLowerCase() !== track.toLowerCase()) return false;
      if (section && (q.section || '').toLowerCase() !== section.toLowerCase()) return false;
      if (chapter && q.chapter !== chapter) return false;
      return true;
    });
    if (pool.length < 2 && chapter) {
      pool = bank.filter(
        (q) =>
          (!track || (q.track || '').toLowerCase() === track.toLowerCase()) &&
          (!section || (q.section || '').toLowerCase() === section.toLowerCase())
      );
    }
    return pool.slice(0, limit || pool.length).map(toDisplayQ);
  }

  global.MultiTrackShared = { skuId, cfg, loadVerifiedBank, filterQuestions, toDisplayQ };
})(typeof window !== 'undefined' ? window : globalThis);
