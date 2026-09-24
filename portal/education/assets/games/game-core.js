/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Shared curriculum-game core. A track supplies `window.BRAHMEXA_GAME_BANK`
  (see any portal/education/<track>/game-bank.js) and this module turns it into
  the runtime API the Hangman and Arena games consume.

  Bank shape:
    {
      track, label,
      subjects: { subjectKey: 'Display Label', ... },
      terms:    [ { word, hint, subject } ],
      bosses:   [ { id, name, title, emoji, tint, glow, hp, power, subject, taunt,
                    minDifficulty?, maxDifficulty? } ],
      questions:[ [subject, chapterId, chapterTitle, question, options[4], answerIdx, difficulty, explain] ]
    }
*/
(function () {
  'use strict';

  var bank = window.BRAHMEXA_GAME_BANK;
  if (!bank) return;

  var DIFF_LABEL = ['', 'Easy', 'Medium', 'Hard'];

  var ALL = (bank.questions || []).map(function (r, i) {
    var subject = r[0];
    return {
      id: subject.slice(0, 4) + '-' + i,
      subject: subject,
      subjectLabel: (bank.subjects && bank.subjects[subject]) || subject,
      chapter: r[1],
      chapterTitle: r[2],
      question: r[3],
      options: r[4],
      answer: r[5],
      difficulty: r[6],
      explain: r[7],
    };
  });

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Shuffle option order per draw so the correct answer is not always first. */
  function randomiseOptions(q) {
    var pairs = q.options.map(function (text, idx) {
      return { text: text, correct: idx === q.answer };
    });
    var mixed = shuffle(pairs);
    return {
      id: q.id,
      subject: q.subject,
      subjectLabel: q.subjectLabel,
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      question: q.question,
      difficulty: q.difficulty,
      difficultyLabel: DIFF_LABEL[q.difficulty] || '',
      explain: q.explain,
      options: mixed.map(function (p) { return p.text; }),
      answer: mixed.findIndex(function (p) { return p.correct; }),
    };
  }

  /*
    draw(opts) -> array of ready-to-render questions.
    opts: { count, subject: <key>|'mixed', minDifficulty, maxDifficulty }
  */
  function draw(opts) {
    opts = opts || {};
    var count = opts.count || 10;
    var pool = ALL;

    if (opts.subject && opts.subject !== 'mixed') {
      var bySubject = pool.filter(function (q) { return q.subject === opts.subject; });
      if (bySubject.length) pool = bySubject;
    }
    if (opts.minDifficulty) {
      var harder = pool.filter(function (q) { return q.difficulty >= opts.minDifficulty; });
      if (harder.length >= 8) pool = harder;   // keep a usable pool if the filter is too tight
    }
    if (opts.maxDifficulty) {
      var easier = pool.filter(function (q) { return q.difficulty <= opts.maxDifficulty; });
      if (easier.length >= 8) pool = easier;
    }
    if (!pool.length) pool = ALL;

    // Cycle the pool when more questions are requested than exist — games rely
    // on receiving exactly `count` items.
    var out = shuffle(pool);
    while (out.length < count) out = out.concat(shuffle(pool));
    return out.slice(0, count).map(randomiseOptions);
  }

  function stats() {
    var chapters = {};
    var subjects = {};
    ALL.forEach(function (q) {
      chapters[q.chapter] = 1;
      subjects[q.subject] = (subjects[q.subject] || 0) + 1;
    });
    return {
      total: ALL.length,
      chapters: Object.keys(chapters).length,
      subjects: subjects,
      subjectCount: Object.keys(subjects).length,
    };
  }

  function subjectOptions() {
    return Object.keys(bank.subjects || {}).map(function (k) {
      return { key: k, label: bank.subjects[k] };
    });
  }

  window.BrahmexaGames = {
    bank: bank,
    track: bank.track,
    label: bank.label,
    all: ALL,
    terms: bank.terms || [],
    bosses: bank.bosses || [],
    subjects: bank.subjects || {},
    subjectOptions: subjectOptions,
    draw: draw,
    shuffle: shuffle,
    stats: stats,
    escapeHtml: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    storageKey: function (game) {
      return 'brahmexa_' + bank.track + '_' + game + '_best';
    },
    bestScore: function (game) {
      try { return parseInt(localStorage.getItem(this.storageKey(game)) || '0', 10); }
      catch (e) { return 0; }
    },
    saveBest: function (game, score) {
      try {
        if (score > this.bestScore(game)) localStorage.setItem(this.storageKey(game), String(score));
      } catch (e) { /* private mode — scores just do not persist */ }
    },
    confetti: function (count, prefix) {
      var colors = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'];
      for (var i = 0; i < count; i++) {
        var c = document.createElement('i');
        c.className = (prefix || 'hq') + '-confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = colors[i % colors.length];
        c.style.animationDuration = (2 + Math.random() * 1.6) + 's';
        c.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(c);
        setTimeout((function (n) { return function () { n.remove(); }; })(c), 4400);
      }
    },
  };
})();
