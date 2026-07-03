/**
 * Client-side deterministic grading when catalog reference answer exists (no LLM).
 * Mirrors server truth_guard.grade_written_deterministic overlap logic.
 */
(function (global) {
  'use strict';

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokens(text) {
    const n = normalize(text);
    return n ? n.split(' ').filter(Boolean) : [];
  }

  function overlapRatio(a, b) {
    const ta = tokens(a);
    const tb = new Set(tokens(b));
    if (!ta.length || !tb.size) return 0;
    let hit = 0;
    ta.forEach((t) => {
      if (tb.has(t)) hit += 1;
    });
    return hit / ta.length;
  }

  function fuzzyRatio(a, b) {
    const x = normalize(a);
    const y = normalize(b);
    if (!x || !y) return 0;
    if (x === y) return 1;
    const longer = x.length >= y.length ? x : y;
    const shorter = x.length >= y.length ? y : x;
    if (!longer.length) return 1;
    let matches = 0;
    for (let i = 0; i < shorter.length; i += 1) {
      if (shorter[i] === longer[i]) matches += 1;
    }
    return matches / longer.length;
  }

  /**
   * @returns {{ marksAwarded: number, maxMarks: number, feedback: string, gradedBy: string } | null}
   */
  function gradeWritten(studentAnswer, referenceAnswer, maxMarks, opts) {
    opts = opts || {};
    const ref = String(referenceAnswer || '').trim();
    const ans = String(studentAnswer || '').trim();
    if (!ref || !ans || ref.length < 8) return null;

    const minPass = opts.minPassRatio ?? 0.5;
    const minFull = opts.minFullRatio ?? 0.78;
    const refInAns = overlapRatio(ref, ans);
    const ansInRef = overlapRatio(ans, ref);
    const fuzzy = fuzzyRatio(ans, ref);
    const scoreRatio = Math.max(refInAns, ansInRef * 0.92, fuzzy * 0.85);

    let marksAwarded;
    let feedback;
    if (scoreRatio >= minFull) {
      marksAwarded = maxMarks;
      feedback = 'Good answer — key points from the reference are covered.';
    } else if (scoreRatio >= minPass) {
      marksAwarded = Math.round(maxMarks * Math.min(1, scoreRatio / minFull) * 10) / 10;
      feedback = 'Partially correct — some expected points are present.';
    } else {
      marksAwarded = 0;
      feedback = 'Answer does not match the expected key points.';
    }

    return {
      marksAwarded,
      maxMarks,
      feedback,
      referenceAnswer: ref,
      gradedBy: 'deterministic_overlap',
      scoreRatio: Math.round(scoreRatio * 100),
    };
  }

  global.EducationDeterministicGrade = { gradeWritten, normalize, overlapRatio };
})(typeof window !== 'undefined' ? window : globalThis);
