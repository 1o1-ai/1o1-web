/** Shared CBSE10 data helpers */
(function (global) {
  const FIGURE_RE = /\b(fig\.?\s*\d|figure|given figure|in the given figure|shown in the graph|diagram)\b/i;

  async function loadCurriculum() {
    const paths = ['../../data/cbse10-curriculum.json', '/portal/data/cbse10-curriculum.json'];
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) return r.json();
      } catch {
        /* */
      }
    }
    throw new Error('curriculum not found');
  }

  async function loadVerifiedBank() {
    const paths = ['../../data/cbse10-verified-questions.json', '/portal/data/cbse10-verified-questions.json'];
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) {
          const d = await r.json();
          return (d.questions || []).filter((q) => q.answer_verified !== false && q.correctIndex != null);
        }
      } catch {
        /* */
      }
    }
    return [];
  }

  function hasFigure(q) {
    const t = `${q.prompt || q.question || ''} ${(q.options || []).join(' ')}`;
    return FIGURE_RE.test(t);
  }

  function filterBank(bank, { subject, chapter, yearsBack, limit, requireFigure }) {
    const CURRENT_YEAR = 2026;
    const minYear = yearsBack ? CURRENT_YEAR - yearsBack : null;
    let pool = bank.filter((q) => {
      const sub = (q.subject_slug || '').toLowerCase();
      if (subject === 'mathematics' && !sub.includes('math')) return false;
      if (subject === 'science' && sub !== 'science') return false;
      if (chapter && q.chapter !== chapter) return false;
      if (minYear && typeof q.exam_year === 'number' && q.exam_year < minYear) return false;
      if (requireFigure && !hasFigure(q)) return false;
      return true;
    });
    pool.sort((a, b) => (b.exam_year || 0) - (a.exam_year || 0));
    return pool.slice(0, limit || pool.length);
  }

  function formatMath(text) {
    return global.AnyoQuestionFormat ? global.AnyoQuestionFormat.formatMathText(text) : text;
  }

  function toDisplayQ(q) {
    return {
      id: q.id,
      prompt: formatMath(q.prompt || q.question),
      options: (q.options || []).map(formatMath),
      correctIndex: q.correctIndex != null ? q.correctIndex : q.correct_index,
      exam_year: q.exam_year,
      chapter: q.chapter,
      subject_slug: q.subject_slug,
      hasFigure: hasFigure(q),
      paper_pair_id: q.paper_pair_id,
    };
  }

  global.CBSE10Shared = {
    loadCurriculum,
    loadVerifiedBank,
    hasFigure,
    filterBank,
    toDisplayQ,
    FIGURE_RE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
