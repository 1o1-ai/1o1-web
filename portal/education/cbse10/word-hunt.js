(function () {
  'use strict';

  var subjectEl = document.getElementById('whSubject');
  var host = document.getElementById('whHost');
  var curriculum = null;
  var masterQuestions = [];
  var syntheticQuestions = [];
  var advancedQuestions = [];

  var stored = sessionStorage.getItem('cbse10_game_subject');
  var urlSubject = new URLSearchParams(location.search).get('subject');
  if (urlSubject && subjectEl) subjectEl.value = urlSubject;
  else if (stored && subjectEl) subjectEl.value = stored;

  function chaptersForSubject(subject) {
    if (!curriculum) return [];
    var sub = curriculum.subjects && curriculum.subjects[subject];
    return (sub && sub.chapters) || [];
  }

  function filterQuestions(opts) {
    var subject = subjectEl.value;
    var ids = opts.chapterIds || [];
    var out = [];
    var isComplex = opts.difficulty === 'difficult' || opts.difficulty === 'hard' || opts.difficulty === 'advanced';
    var banks = isComplex
      ? [
          { rows: advancedQuestions, mode: 'advanced' },
          { rows: syntheticQuestions, mode: 'ai' },
          { rows: masterQuestions, mode: 'ai' },
        ]
      : [
          { rows: syntheticQuestions, mode: 'ai' },
          { rows: masterQuestions, mode: 'cbse' },
          { rows: masterQuestions, mode: 'ai' },
        ];
    ids.forEach(function (ch) {
      banks.forEach(function (bank) {
        window.CBSE10Shared.filterMasterQuestions(bank.rows, {
          subject: subject,
          chapter: ch,
          mode: bank.mode,
          difficulty: opts.difficulty,
          limit: opts.limit || 6,
        })
          .map(window.CBSE10Shared.toDisplayQ)
          .forEach(function (q) {
            out.push(q);
          });
      });
    });
    return out;
  }

  function start() {
    if (!window.ManjuLABWordHunter) {
      host.innerHTML = '<p class="sr-eval-hint">Word Hunter failed to load.</p>';
      return;
    }
    sessionStorage.setItem('cbse10_game_subject', subjectEl.value);
    var chapters = chaptersForSubject(subjectEl.value).map(function (c) {
      return { id: c.id, title: c.title };
    });
    window.ManjuLABWordHunter.mountSubjectGame(host, {
      subject: subjectEl.value,
      curriculum: {
        subjects: {
          science: { chapters: (curriculum.subjects && curriculum.subjects.science && curriculum.subjects.science.chapters) || [] },
          mathematics: { chapters: (curriculum.subjects && curriculum.subjects.mathematics && curriculum.subjects.mathematics.chapters) || [] },
        },
      },
      listChapters: function () {
        return chapters;
      },
      filterQuestions: filterQuestions,
    });
  }

  Promise.all([
    fetch('/portal/data/cbse10-curriculum.json').then(function (r) {
      return r.json();
    }),
    fetch('/portal/data/cbse10-master-catalog.json').then(function (r) {
      return r.json();
    }),
    fetch('/portal/data/synthetic_questions.json').then(function (r) {
      return r.json();
    }),
    fetch('/portal/data/advanced_complexity_questions.json').then(function (r) {
      return r.json();
    }),
  ])
    .then(function (parts) {
      curriculum = parts[0];
      masterQuestions = (parts[1] && parts[1].questions) || [];
      syntheticQuestions = (parts[2] && parts[2].questions) || parts[2] || [];
      advancedQuestions = (parts[3] && parts[3].questions) || parts[3] || [];
      start();
    })
    .catch(function () {
      host.innerHTML = '<p class="sr-eval-hint">Could not load question banks.</p>';
    });

  subjectEl.addEventListener('change', start);
  document.getElementById('whRestart').addEventListener('click', start);
})();
