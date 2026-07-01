/**
 * SAT/ACT shared loaders — verified question bank + filtering for drills and mocks.
 */
(function (global) {
  'use strict';

  const cfg = global.AnyoAcademyConfig?.get?.('sat-act') || {};
  let bankCache = null;

  function loadVerifiedBank() {
    if (bankCache) return Promise.resolve(bankCache);
    const path = cfg.bankPath || '/portal/data/sat-act-questions.json';
    return fetch(path)
      .then((r) => {
        if (!r.ok) throw new Error('Question bank not found');
        return r.json();
      })
      .then((data) => {
        bankCache = (data.questions || []).filter(
          (q) => q.answer_verified && (q.options || []).length >= 2 && q.correct_index != null
        );
        return bankCache;
      });
  }

  function resolveCorrectIndex(q, opts) {
    if (q.correct_index != null && q.correct_index >= 0 && q.correct_index < opts.length) {
      return q.correct_index;
    }
    if (q.correctIndex != null && q.correctIndex >= 0 && q.correctIndex < opts.length) {
      return q.correctIndex;
    }
    return null;
  }

  function toDisplayQ(q) {
    const opts = (q.options || []).map((o) => String(o || '').trim()).filter((o) => o.length > 0);
    return {
      id: q.id,
      track: q.track,
      section: q.section,
      chapter: q.chapter,
      prompt: q.question || q.prompt,
      options: opts,
      optionLabels: q.option_labels || opts.map((_, i) => String.fromCharCode(65 + i)),
      correctIndex: resolveCorrectIndex(q, opts),
      passageContext: q.passage_context || '',
      questionNumber: q.question_number,
      source: q.source,
      hasDiagram: !!(q.has_diagram || q.diagram),
      diagram: q.diagram,
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

  /** Official section specs — timing and question counts per College Board / ACT.org */
  const SECTION_SPECS = {
    act: {
      english: {
        label: 'ACT English Test',
        booklet: 'Test 1 · English',
        durationSec: 45 * 60,
        officialQuestions: 75,
        scoring: 'Raw score 0–75 → scaled 1–36 (varies by test form)',
        instructions:
          'DIRECTIONS: In the passages that follow, certain words and phrases are underlined and numbered. For each underlined portion, choose the alternative that best answers the question.',
      },
      math: {
        label: 'ACT Mathematics Test',
        booklet: 'Test 1 · Mathematics',
        durationSec: 60 * 60,
        officialQuestions: 60,
        scoring: 'Raw score 0–60 → scaled 1–36',
        instructions:
          'DIRECTIONS: Solve each problem, choose the correct answer, and fill in the corresponding oval on your answer document.',
      },
      reading: {
        label: 'ACT Reading Test',
        booklet: 'Test 1 · Reading',
        durationSec: 35 * 60,
        officialQuestions: 40,
        scoring: 'Raw score 0–40 → scaled 1–36',
        instructions:
          'DIRECTIONS: Read each passage carefully and answer the questions that follow.',
      },
      science: {
        label: 'ACT Science Test',
        booklet: 'Test 1 · Science',
        durationSec: 35 * 60,
        officialQuestions: 40,
        scoring: 'Raw score 0–40 → scaled 1–36',
        instructions:
          'DIRECTIONS: Read the passages and examine the diagrams. Answer the questions using only the information given.',
      },
    },
    sat: {
      reading_writing: {
        label: 'SAT Reading and Writing',
        booklet: 'Digital SAT · Section 1',
        durationSec: 64 * 60,
        officialQuestions: 54,
        modules: [
          { label: 'Module 1', minutes: 32, questions: 27 },
          { label: 'Module 2 (adaptive)', minutes: 32, questions: 27 },
        ],
        scoring: 'Section score 200–800 (combined with Math for total 400–1600)',
        instructions:
          'DIRECTIONS: Read each passage and question carefully. Choose the best answer to each question.',
      },
      math: {
        label: 'SAT Mathematics',
        booklet: 'Digital SAT · Section 2',
        durationSec: 70 * 60,
        officialQuestions: 44,
        modules: [
          { label: 'Module 1', minutes: 35, questions: 22, calculator: true },
          { label: 'Module 2 (adaptive)', minutes: 35, questions: 22, calculator: true },
        ],
        scoring: 'Section score 200–800 · Desmos graphing calculator permitted',
        instructions:
          'DIRECTIONS: Solve each problem. For student-produced response questions, enter your answer.',
      },
    },
  };

  const RW_SECTIONS = new Set(['sat-reading-writing', 'act-english', 'act-reading']);

  const MATH_MOCK_SECTIONS = {
    act: 'math',
    sat: 'math',
  };

  const FULL_MOCK_SPECS = {
    act: {
      label: 'ACT Mathematics (mock)',
      totalMinutes: 60,
      breakMinutes: 0,
      sections: ['math'],
      mathOnly: true,
    },
    sat: {
      label: 'Digital SAT Mathematics (mock)',
      totalMinutes: 70,
      breakMinutes: 0,
      sections: ['math'],
      mathOnly: true,
    },
  };

  function isRwSection(subjectId) {
    return RW_SECTIONS.has(subjectId);
  }

  function isMathMockSection(track, sectionKey) {
    const key = (sectionKey || '').toLowerCase();
    return key === 'math' || key === MATH_MOCK_SECTIONS[track];
  }

  function redirectNonMathMock(track, sectionKey, mode) {
    const mathSection = MATH_MOCK_SECTIONS[track] || 'math';
    const key = (sectionKey || '').toLowerCase();
    const u = new URL(typeof location !== 'undefined' ? location.href : 'http://local/mock-exam.html');

    if (mode === 'full' && FULL_MOCK_SPECS[track]?.mathOnly) {
      if (key && key !== mathSection) {
        u.searchParams.set('track', track);
        u.searchParams.set('section', mathSection);
        u.searchParams.set('mode', 'full');
        return u.pathname + u.search;
      }
      return null;
    }

    if (!isMathMockSection(track, key)) {
      u.searchParams.set('track', track);
      u.searchParams.set('section', mathSection);
      u.searchParams.delete('mode');
      return u.pathname + u.search;
    }
    return null;
  }

  global.SatActShared = {
    loadVerifiedBank,
    filterQuestions,
    toDisplayQ,
    resolveCorrectIndex,
    SECTION_SPECS,
    FULL_MOCK_SPECS,
    RW_SECTIONS,
    MATH_MOCK_SECTIONS,
    isRwSection,
    isMathMockSection,
    redirectNonMathMock,
  };
})(typeof window !== 'undefined' ? window : globalThis);
