/** Shared CBSE10 data helpers */
(function (global) {
  const FIGURE_RE =
    /\b(fig\.?\s*\d|fig\.|figure|figures|given figure|in the given figure|adjoining figure|the adjoining figure|shown in the graph|shown below|shown in the figure|graph of|diagram)\b/i;

  /** Chapters with more than this count stay in the chapter sidebar; rest go to topic buckets. */
  const CHAPTER_SIDEBAR_MIN = 20;

  const SCIENCE_DISCIPLINE = {
    light: 'physics',
    'human-eye': 'physics',
    electricity: 'physics',
    magnetism: 'physics',
    'sources-of-energy': 'physics',
    'chem-reactions': 'chemistry',
    'acids-bases': 'chemistry',
    metals: 'chemistry',
    carbon: 'chemistry',
    life: 'biology',
    control: 'biology',
    reproduction: 'biology',
    heredity: 'biology',
  };

  /** Legacy ingest tags → official syllabus chapter ids (syllabus.txt). */
  const LEGACY_CHAPTER_ALIASES = {
    environment: 'sources-of-energy',
  };

  function normalizeChapterId(chapterId) {
    const c = String(chapterId || '').trim().toLowerCase();
    return LEGACY_CHAPTER_ALIASES[c] || c;
  }

  function effectiveChapter(q) {
    return normalizeChapterId(q.chapter || '');
  }

  const BUCKET_LABELS = {
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    miscellaneous: 'Miscellaneous',
  };

  const SCIENCE_BUCKETS = ['physics', 'chemistry', 'biology'];
  const MATH_BUCKETS = ['miscellaneous'];

  function subjectSlug(q) {
    return (q.subject_slug || q.subject || '').toLowerCase();
  }

  function isMathQuestion(q) {
    const sub = subjectSlug(q);
    return sub.includes('math') || sub === 'mathematics';
  }

  function scienceDiscipline(chapterId) {
    return SCIENCE_DISCIPLINE[chapterId] || 'biology';
  }

  function bucketForOverflow(q) {
    return isMathQuestion(q) ? 'miscellaneous' : scienceDiscipline(effectiveChapter(q));
  }

  /** Tag each verified row with chapter vs bucket placement (mutates bank rows). */
  function enrichBankWithBuckets(bank) {
    bank.forEach((q) => {
      q.chapter = effectiveChapter(q);
    });
    const byChapter = new Map();
    bank.forEach((q) => {
      const ch = q.chapter || '';
      if (!byChapter.has(ch)) byChapter.set(ch, []);
      byChapter.get(ch).push(q);
    });

    const chapterCounts = new Map();
    const bucketCounts = new Map();

    for (const [ch, rows] of byChapter) {
      rows.sort((a, b) => (b.exam_year || 0) - (a.exam_year || 0));
      const total = rows.length;
      chapterCounts.set(ch, total);
      rows.forEach((q, idx) => {
        const copy = { ...q };
        copy._chapterRank = idx + 1;
        if (total <= CHAPTER_SIDEBAR_MIN) {
          copy._inChapterView = false;
          copy._bucket = bucketForOverflow(copy);
        } else if (idx < CHAPTER_SIDEBAR_MIN) {
          copy._inChapterView = true;
          copy._bucket = null;
        } else {
          copy._inChapterView = false;
          copy._bucket = bucketForOverflow(copy);
        }
        if (copy._bucket) {
          bucketCounts.set(copy._bucket, (bucketCounts.get(copy._bucket) || 0) + 1);
        }
        Object.assign(q, copy);
      });
    }

    return { chapterCounts, bucketCounts };
  }

  function sidebarChapterIds(chapterCounts) {
    return [...chapterCounts.entries()]
      .filter(([, n]) => n > CHAPTER_SIDEBAR_MIN)
      .map(([ch]) => ch)
      .sort();
  }

  function bucketsForSubject(subject) {
    return subject === 'mathematics' ? MATH_BUCKETS : SCIENCE_BUCKETS;
  }

  function countInBucket(bank, subject, bucketId) {
    const subj = subject === 'mathematics' ? 'mathematics' : 'science';
    return bank.filter((q) => {
      const sub = subjectSlug(q);
      const matchSub =
        sub === subj ||
        sub === subject ||
        (subj === 'mathematics' && sub.includes('math')) ||
        (subj === 'science' && sub === 'science');
      return matchSub && q._bucket === bucketId;
    }).length;
  }

  function countInChapterView(bank, subject, chapterId) {
    const subj = subject === 'mathematics' ? 'mathematics' : 'science';
    return bank.filter((q) => {
      const sub = subjectSlug(q);
      const matchSub =
        sub === subj ||
        sub === subject ||
        (subj === 'mathematics' && sub.includes('math')) ||
        (subj === 'science' && sub === 'science');
      return matchSub && q._inChapterView && (q.chapter || '') === chapterId;
    }).length;
  }

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

  async function loadMasterCatalog() {
    const paths = [
      '../../data/cbse10-master-catalog.json',
      '/portal/data/cbse10-master-catalog.json',
    ];
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) return r.json();
      } catch {
        /* */
      }
    }
    return null;
  }

  async function loadSyntheticBank() {
    const paths = [
      '../../data/synthetic_questions.json',
      '/portal/data/synthetic_questions.json',
    ];
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) {
          const d = await r.json();
          return (d.questions || []).map((q) => ({ ...q, chapter: normalizeChapterId(q.chapter) }));
        }
      } catch {
        /* */
      }
    }
    return [];
  }

  async function loadAdvancedComplexityBank() {
    const paths = [
      '../../data/advanced_complexity_questions.json',
      '/portal/data/advanced_complexity_questions.json',
    ];
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) {
          const d = await r.json();
          return (d.questions || []).map((q) => ({ ...q, chapter: normalizeChapterId(q.chapter) }));
        }
      } catch {
        /* */
      }
    }
    return [];
  }

  function isAdvancedComplexity(q) {
    return (
      q.question_provenance === 'advanced_complexity' ||
      q.complexity_tier === 'advanced' ||
      String(q.difficulty || '').toLowerCase() === 'advanced'
    );
  }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function loadVerifiedBank() {
    const paths = ['../../data/cbse10-verified-questions.json', '/portal/data/cbse10-verified-questions.json'];
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) {
          const d = await r.json();
          return (d.questions || [])
            .filter((q) => q.answer_verified !== false && q.correctIndex != null)
            .map((q) => ({ ...q, chapter: normalizeChapterId(q.chapter) }));
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

  function filterBank(bank, { subject, chapter, bucket, sourceChapter, yearsBack, limit, requireFigure, preferFigure }) {
    const CURRENT_YEAR = 2026;
    const minYear = yearsBack > 0 ? CURRENT_YEAR - yearsBack : null;
    const cap = limit || 99;
    const subj = subject === 'mathematics' ? 'mathematics' : 'science';

    function basePool(chFilter, bucketFilter) {
      return bank.filter((q) => {
        const sub = subjectSlug(q);
        const matchSub =
          sub === subj ||
          sub === subject ||
          (subj === 'mathematics' && sub.includes('math')) ||
          (subj === 'science' && sub === 'science');
        if (!matchSub) return false;
        if (bucketFilter) return q._bucket === bucketFilter;
        if (chFilter) return effectiveChapter(q) === chFilter;
        if (sourceChapter) return effectiveChapter(q) === sourceChapter;
        if (minYear && typeof q.exam_year === 'number' && q.exam_year < minYear) return false;
        return true;
      });
    }

    let pool = basePool(chapter, bucket);
    if (sourceChapter && !chapter && !bucket) {
      pool = basePool(null, null).filter((q) => effectiveChapter(q) === sourceChapter);
    }

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

  function isAuthenticCbse(q) {
    if (q['previously_asked_cbse-x'] === true || q.previously_asked_cbse_x === true) return true;
    if (q.source_kind === 'procedural_ai') return false;
    const src = String(q.source || '');
    if (/Procedural Syllabus AI Generator/i.test(src)) return false;
    if (q.source_kind === 'pdf_catalog') return true;
    return !!src.toLowerCase().endsWith('.pdf');
  }

  function masterChapterId(q) {
    return normalizeChapterId(q.chapterId || q.chapter || '');
  }

  function isInternalQaPrompt(text) {
    const t = String(text || '');
    if (/\(Verify with Class 10 Board/i.test(t)) return true;
    if (/\(Verify with[^)]*Test-Set/i.test(t)) return true;
    if (/Detail chemical equation for the observation when Zinc metal granulated/i.test(t)) return true;
    return false;
  }

  function cleanDisplayText(text) {
    if (global.AnyoQuestionFormat?.cleanQuestionText) {
      return global.AnyoQuestionFormat.cleanQuestionText(text);
    }
    return String(text || '')
      .replace(/\s*\[Set-\d+(?:\s+Ref(?:erence)?\s+Key)?\]\s*/gi, ' ')
      .replace(/\s*\[Set-\d+\]\s*/gi, ' ')
      .replace(/\s*\[(?:Ref(?:erence)?\s+Key|Approved|internal)[^\]]*\]\s*/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function isProceduralPlaceholderMcq(q) {
    if (/Procedural Syllabus AI Generator/i.test(String(q.source || ''))) {
      const opts = (q.options || []).map((o) => cleanDisplayText(o));
      if (
        opts.length >= 4 &&
        opts[0] === 'Real and distinct rational roots' &&
        opts.includes('Empty baseline answer')
      ) {
        return true;
      }
    }
    const opts = (q.options || []).map((o) => cleanDisplayText(o));
    if (
      opts.length >= 4 &&
      opts[0] === 'Real and distinct rational roots' &&
      opts.includes('Empty baseline answer')
    ) {
      return true;
    }
    return false;
  }

  function isValidCatalogQuestion(q) {
    if (isProceduralPlaceholderMcq(q)) return false;
    const text = cleanDisplayText(q.text || q.prompt || '');
    if (isInternalQaPrompt(text)) return false;
    if (!text || text.length < 8) return false;
    if (/\*31\/|ECNEICS|\*ECNEICS\*/i.test(text) && text.length < 40) return false;
    const opts = q.options || [];
    if (opts.length) {
      const good = opts.filter((o) => cleanDisplayText(o).length > 1);
      if (good.length < 2) return false;
    }
    return true;
  }

  function questionStemKey(text) {
    return cleanDisplayText(text)
      .toLowerCase()
      .replace(/\d+(?:\.\d+)?/g, '#')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function questionVariantScore(q) {
    let score = 0;
    if (isAuthenticCbse(q)) score += 1000;
    score += Number(q.exam_year) || 0;
    const raw = String(q.text || q.prompt || q.question || '');
    if (/\[Set-\d+/i.test(raw)) score -= 50;
    if (/Ref Key/i.test(raw)) score -= 25;
    return score;
  }

  /** Keep one row per numeric template (e.g. same story, different angles). */
  function dedupeByStem(questions) {
    const byStem = new Map();
    questions.forEach((q) => {
      const text = q.text || q.prompt || q.question || '';
      const key = questionStemKey(text);
      if (!key || key.length < 16) {
        byStem.set('id:' + String(q.id || key), q);
        return;
      }
      const prev = byStem.get(key);
      if (!prev || questionVariantScore(q) > questionVariantScore(prev)) {
        byStem.set(key, q);
      }
    });
    return [...byStem.values()];
  }

  function filterMasterQuestions(questions, { subject, chapter, mode, type, difficulty, limit }) {
    const subj = subject === 'mathematics' ? 'mathematics' : 'science';
    let pool = questions.filter((q) => {
      const advanced = isAdvancedComplexity(q);
      if (mode === 'advanced') {
        if (!advanced) return false;
      } else if (advanced) {
        return false;
      }
      const sub = (q.subject_slug || '').toLowerCase();
      const matchSub =
        sub === subj ||
        (subj === 'mathematics' && sub.includes('math')) ||
        (subj === 'science' && sub === 'science');
      if (!matchSub) return false;
      if (chapter && masterChapterId(q) !== chapter) return false;
      if (mode === 'cbse' && !isAuthenticCbse(q)) return false;
      if (mode === 'ai' && isAuthenticCbse(q)) return false;
      if (type && String(q.type || '').toLowerCase() !== type.toLowerCase()) return false;
      if (type && String(type).toLowerCase() === 'mcq') {
        const opts = q.options || [];
        const good = opts.filter((o) => cleanDisplayText(o).length > 1);
        if (good.length < 2) return false;
      }
      if (difficulty && difficulty !== 'all') {
        const d = String(q.difficulty || '').toLowerCase();
        const want = difficulty.toLowerCase();
        if (want === 'difficult' || want === 'hard') {
          if (d !== 'difficult' && d !== 'hard' && d !== 'advanced') return false;
        } else if (d !== want) {
          return false;
        }
      }
      return isValidCatalogQuestion(q);
    });
    pool = dedupeByStem(pool);
    return shuffleArray(pool).slice(0, limit || 9999);
  }

  function countMasterByChapter(questions, subject, mode) {
    const counts = new Map();
    filterMasterQuestions(questions, { subject, mode, limit: 99999 }).forEach((q) => {
      const ch = masterChapterId(q);
      counts.set(ch, (counts.get(ch) || 0) + 1);
    });
    return counts;
  }

  function letterToIndex(letter) {
    if (letter == null || letter === '') return null;
    const c = String(letter).trim().toUpperCase().charAt(0);
    const i = c.charCodeAt(0) - 65;
    return i >= 0 && i <= 25 ? i : null;
  }

  function resolveCorrectIndex(q, opts) {
    if (!opts?.length) return null;
    let idx = q.correctIndex != null ? q.correctIndex : q.correct_index;
    if (idx != null && idx >= opts.length) idx = null;
    if (idx != null) return idx;
    const fromLetter = letterToIndex(q.correct_mcq_option);
    if (fromLetter != null && fromLetter < opts.length) return fromLetter;
    return null;
  }

  function effectiveQuestionType(q, opts) {
    const raw = String(q.type || 'Question');
    if (opts.length >= 2) return raw;
    if (/mcq/i.test(raw)) return 'Short Answer';
    return raw;
  }

  function toDisplayQ(q) {
    const text = q.text || q.prompt || q.question;
    const opts = (q.options || []).map(cleanDisplayText).filter((o) => o.length > 0);
    const correctIndex = resolveCorrectIndex(q, opts);
    const type = effectiveQuestionType(q, opts);
    return {
      id: q.id,
      prompt: cleanDisplayText(text),
      options: opts,
      correctIndex,
      exam_year: q.exam_year,
      chapter: masterChapterId(q) || q.chapter,
      chapterId: masterChapterId(q),
      subject_slug: q.subject_slug,
      hasFigure: hasFigure(q) || !!q.diagramVector || !!q.figure_url,
      diagramVector: q.diagramVector,
      figure_url: q.figure_url,
      type,
      marks: q.marks,
      difficulty: q.difficulty,
      source_kind: q.source_kind,
      cognitive_domain: q.cognitive_domain,
      solutions: q.solutions,
      raw: q,
    };
  }

  global.CBSE10Shared = {
    loadCurriculum,
    loadVerifiedBank,
    loadMasterCatalog,
    loadSyntheticBank,
    loadAdvancedComplexityBank,
    isAdvancedComplexity,
    shuffleArray,
    hasFigure,
    filterBank,
    chaptersWithFigures,
    toDisplayQ,
    enrichBankWithBuckets,
    sidebarChapterIds,
    bucketsForSubject,
    countInBucket,
    countInChapterView,
    bucketLabel: (id) => BUCKET_LABELS[id] || id,
    filterMasterQuestions,
    countMasterByChapter,
    isAuthenticCbse,
    isValidCatalogQuestion,
    isProceduralPlaceholderMcq,
    isInternalQaPrompt,
    resolveCorrectIndex,
    letterToIndex,
    cleanDisplayText,
    questionStemKey,
    dedupeByStem,
    masterChapterId,
    normalizeChapterId,
    effectiveChapter,
    LEGACY_CHAPTER_ALIASES,
    SCIENCE_DISCIPLINE,
    scienceDiscipline,
    FIGURE_RE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
