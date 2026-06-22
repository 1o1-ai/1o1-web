/**
 * Reference answers for study room — reject rubric placeholders, derive common CBSE math steps.
 */
(function (global) {
  'use strict';

  const PLACEHOLDER_RE =
    /\[supercop|\[gemini|checked scheme|result validated cleanly|we first write down given quantities|invoke standard formulas|substituting variables allows|matches class standards perfectly|formula definition\s*&\s*statement verification|correct substitution in algebraic equation|calculating final numerical response/i;

  function isPlaceholderSolution(text) {
    const t = String(text || '').trim();
    if (!t || t.length < 4) return true;
    if (PLACEHOLDER_RE.test(t)) return true;
    if (/^[\s•\-–—]*(step\s*\d+|formula definition|correct substitution)/i.test(t)) return true;
    return false;
  }

  function cleanForDisplay(text) {
    const fn = global.AnyoQuestionFormat?.cleanSolutionText;
    return fn ? fn(text) : String(text || '').trim();
  }

  function pickBestSolution(solutions) {
    if (!solutions) return '';
    const candidates = [solutions.answer_01?.text, solutions.alt_answer_02?.text].filter(Boolean);
    for (const raw of candidates) {
      if (isPlaceholderSolution(raw)) continue;
      const cleaned = cleanForDisplay(raw);
      if (cleaned && !isPlaceholderSolution(cleaned)) return cleaned;
    }
    return '';
  }

  function deriveApNthTerm(prompt) {
    const m = String(prompt).match(
      /(\d+)(?:st|nd|rd|th)\s+term\s+of\s+the\s+AP\s*:\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/i
    );
    if (!m) return null;
    const n = parseInt(m[1], 10);
    const a = parseInt(m[2], 10);
    const second = parseInt(m[3], 10);
    const d = second - a;
    const an = a + (n - 1) * d;
    return (
      `Given: a = ${a}, common difference d = ${second} − ${a} = ${d}.\n\n` +
      `aₙ = a + (n − 1)d\n` +
      `a${n} = ${a} + (${n} − 1)(${d}) = ${an}\n\n` +
      `The ${n}th term is ${an}.`
    );
  }

  function deriveApSumFirstN(prompt) {
    const m = String(prompt).match(
      /sum\s+of\s+(?:the\s+)?first\s+(\d+)\s+positive\s+integers\s+divisible\s+by\s+(\d+)/i
    );
    if (!m) return null;
    const n = parseInt(m[1], 10);
    const k = parseInt(m[2], 10);
    const a = k;
    const l = k * n;
    const s = (n * (a + l)) / 2;
    return (
      `Multiples of ${k}: ${k}, ${2 * k}, …, ${l} (${n} terms).\n\n` +
      `This is an AP with a = ${a}, last term = ${l}, n = ${n}.\n` +
      `Sₙ = n(a + l) / 2 = ${n}(${a} + ${l}) / 2 = ${s}\n\n` +
      `Sum = ${s}.`
    );
  }

  function deriveReferenceAnswer(q) {
    const prompt = q.prompt || q.text || q.question || '';
    return deriveApNthTerm(prompt) || deriveApSumFirstN(prompt) || null;
  }

  function extractReferenceAnswer(q) {
    const id = q.id || q.raw?.id;
    const ov = overridesMap?.[id];
    if (ov?.text && !ov.error && !isPlaceholderSolution(ov.text)) {
      return cleanForDisplay(ov.text);
    }
    if (q.correctIndex != null && q.options?.[q.correctIndex]) {
      const opt = global.AnyoQuestionFormat?.cleanQuestionText?.(q.options[q.correctIndex]);
      if (opt) return opt;
    }
    const fromCatalog = pickBestSolution(q.solutions || q.raw?.solutions);
    if (fromCatalog) return fromCatalog;
    return deriveReferenceAnswer(q);
  }

  let overridesMap = null;
  let overridesPromise = null;

  function loadOverrides() {
    if (overridesMap) return Promise.resolve(overridesMap);
    if (overridesPromise) return overridesPromise;
    const paths = [
      '/portal/data/cbse10-answer-overrides.json',
      '../../data/cbse10-answer-overrides.json',
    ];
    overridesPromise = (async () => {
      for (const p of paths) {
        try {
          const r = await fetch(p);
          if (r.ok) {
            const d = await r.json();
            overridesMap = d.reviewed || {};
            return overridesMap;
          }
        } catch {
          /* try next */
        }
      }
      overridesMap = {};
      return overridesMap;
    })();
    return overridesPromise;
  }

  global.AnyoReferenceAnswer = {
    isPlaceholderSolution,
    pickBestSolution,
    deriveReferenceAnswer,
    extractReferenceAnswer,
    loadOverrides,
  };
})(typeof window !== 'undefined' ? window : globalThis);
