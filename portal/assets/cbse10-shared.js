/** Shared CBSE10 data helpers */
(function (global) {
  const FIGURE_RE =
    /\b(fig\.?\s*\d|fig\.|figure|figures|given figure|in the given figure|adjoining figure|the adjoining figure|shown in the graph|shown below|shown in the figure|graph of|diagram)\b/i;

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
    if (q.has_figure === true || q.has_diagram === true) return true;
    const t = `${q.prompt || q.question || ''} ${(q.options || []).join(' ')}`;
    return FIGURE_RE.test(t);
  }

  function filterBank(bank, { subject, chapter, yearsBack, limit, requireFigure, preferFigure }) {
    const CURRENT_YEAR = 2026;
    const minYear = yearsBack > 0 ? CURRENT_YEAR - yearsBack : null;
    const cap = limit || 99;

    function basePool(chFilter) {
      return bank.filter((q) => {
        const sub = (q.subject_slug || '').toLowerCase();
        if (subject === 'mathematics' && !sub.includes('math')) return false;
        if (subject === 'science' && sub !== 'science') return false;
        if (chFilter && q.chapter !== chFilter) return false;
        if (minYear && typeof q.exam_year === 'number' && q.exam_year < minYear) return false;
        return true;
      });
    }

    let pool = basePool(chapter);

    if (requireFigure) {
      pool = pool.filter(hasFigure);
      if (!pool.length) {
        pool = basePool(null).filter(hasFigure);
      }
    }

    if (preferFigure) {
      const fig = pool.filter(hasFigure);
      const rest = pool.filter((q) => !hasFigure(q));
      pool = [...fig, ...rest];
    }

    pool.sort((a, b) => (b.exam_year || 0) - (a.exam_year || 0));
    return pool.slice(0, cap);
  }

  /** Chapters that have diagram-style prompts in the verified bank (for UI hints). */
  function chaptersWithFigures(bank, subject) {
    const counts = new Map();
    bank.forEach((q) => {
      const sub = (q.subject_slug || '').toLowerCase();
      if (subject === 'mathematics' && !sub.includes('math')) return;
      if (subject === 'science' && sub !== 'science') return;
      if (!hasFigure(q)) return;
      const ch = q.chapter || '';
      counts.set(ch, (counts.get(ch) || 0) + 1);
    });
    return counts;
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
    chaptersWithFigures,
    toDisplayQ,
    FIGURE_RE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
