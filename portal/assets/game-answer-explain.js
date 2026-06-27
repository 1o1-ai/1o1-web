/**
 * Portal-side answer explanations (mirrors games/src/shared/answer-explain.ts).
 */
(function (global) {
  'use strict';

  var studyCache = null;

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function ensureStudyMaterial() {
    if (studyCache) return Promise.resolve(studyCache);
    return fetch('/portal/data/cbse10-study-material.json')
      .then(function (r) {
        return r.json();
      })
      .then(function (raw) {
        studyCache = raw.chapters || {};
        return studyCache;
      })
      .catch(function () {
        studyCache = {};
        return studyCache;
      });
  }

  function findChapter(answer, subject, curriculum, meta) {
    var chapters = (curriculum.subjects[subject] && curriculum.subjects[subject].chapters) || [];
    var hint = (meta && (meta.chapterId || meta.chapter)) || '';
    if (hint) {
      var byHint = chapters.find(function (c) {
        return c.id === hint || c.title === hint;
      });
      if (byHint) return byHint;
    }
    var n = norm(answer);
    return chapters.find(function (c) {
      return (
        norm(c.title) === n ||
        c.keywords.some(function (k) {
          return norm(k) === n || norm(k).indexOf(n) >= 0 || n.indexOf(norm(k)) >= 0;
        })
      );
    });
  }

  function patternGloss(a, chapter, meta) {
    var ch = (chapter && chapter.title) || (meta && meta.chapter) || 'this chapter';
    if (/hydrocarbon/i.test(a)) {
      return (
        'A <strong>hydrocarbon</strong> is an organic compound containing <strong>only carbon and hydrogen</strong>. ' +
        'Examples: methane (CH₄), ethene (C₂H₄). In <em>' +
        ch +
        '</em>, hydrocarbons form homologous series (alkanes, alkenes).'
      );
    }
    if (/photosynthesis/i.test(a)) {
      return '<strong>Photosynthesis</strong> — plants make glucose using CO₂, water, sunlight, and chlorophyll; oxygen is released.';
    }
    if (/uniform\s*speed/i.test(a)) {
      return '<strong>Uniform speed</strong> — equal distance in equal time; distance–time graph is a straight line through the origin.';
    }
    if (/ohm\s*law/i.test(a)) {
      return "<strong>Ohm's law</strong> — V = IR at constant temperature.";
    }
    return null;
  }

  function explainAnswer(answer, subject, curriculum, meta) {
    meta = meta || {};
    if (meta.fullWord && String(answer).trim().length <= 2) {
      return (
        'The missing letter is <strong>' +
        String(answer).toUpperCase() +
        '</strong> in <strong>' +
        meta.fullWord +
        '</strong>. ' +
        explainAnswer(meta.fullWord, subject, curriculum, meta)
      );
    }
    var lookup = meta.term || meta.concept || answer;
    var chapter = findChapter(lookup, subject, curriculum, meta);
    var display = String(answer).trim();
    var gloss = patternGloss(display, chapter, meta);
    if (gloss) return gloss;
    if (chapter && norm(display) === norm(chapter.title)) {
      return (
        '<strong>' +
        chapter.title +
        '</strong> is a CBSE Class 10 ' +
        (chapter.discipline || 'science') +
        ' chapter. Key terms: ' +
        chapter.keywords.slice(0, 4).join(', ') +
        '.'
      );
    }
    if (chapter) {
      var related = chapter.keywords
        .filter(function (k) {
          return norm(k) !== norm(lookup);
        })
        .slice(0, 3);
      return (
        '<strong>' +
        display +
        '</strong> — syllabus term in <em>' +
        chapter.title +
        '</em>. Related: ' +
        (related.join(', ') || 'see Study Room') +
        '.'
      );
    }
    return '<strong>' + display + '</strong> — review in Class 10 ' + subject + ' notes.';
  }

  global.GameAnswerExplain = {
    ensureStudyMaterial: ensureStudyMaterial,
    explainAnswer: explainAnswer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
