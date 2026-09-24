/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  CBSE Hangman Quiz.
  Mechanic: each level hides a CBSE Class 10 term. Correct MCQ answers reveal
  letters of that term; wrong answers draw one more part of the hangman.
  Reveal the whole term before six mistakes to clear the level.
*/
(function () {
  'use strict';

  var Bank = window.CBSE10QuizBank;
  if (!Bank) return;

  /* Secret terms per level, tagged with the chapter they revise. */
  var TERMS = [
    { word: 'PHOTOSYNTHESIS', hint: 'Green plants make food by this process', subject: 'science' },
    { word: 'ELECTROMAGNET', hint: 'A coil that becomes a magnet when current flows', subject: 'science' },
    { word: 'DISCRIMINANT', hint: 'b² − 4ac decides the nature of the roots', subject: 'mathematics' },
    { word: 'REFRACTION', hint: 'Bending of light as it changes medium', subject: 'science' },
    { word: 'TRIGONOMETRY', hint: 'The study of ratios of sides in a right triangle', subject: 'mathematics' },
    { word: 'CATENATION', hint: 'Carbon linking with itself in long chains', subject: 'science' },
    { word: 'PROGRESSION', hint: 'A sequence with a constant common difference', subject: 'mathematics' },
    { word: 'CHROMOSOME', hint: 'Thread-like structure carrying genes', subject: 'science' },
    { word: 'PROBABILITY', hint: 'A measure of how likely an event is', subject: 'mathematics' },
    { word: 'NEUTRALISATION', hint: 'Acid plus base gives salt and water', subject: 'science' },
    { word: 'POLYNOMIAL', hint: 'An expression of terms with whole-number powers', subject: 'mathematics' },
    { word: 'RESPIRATION', hint: 'Cells release energy from glucose by this', subject: 'science' },
  ];

  var MAX_WRONG = 6;
  var PARTS = ['head', 'body', 'armL', 'armR', 'legL', 'legR'];
  var QUESTION_SECONDS = 30;

  var el = {};
  var state = null;
  var timerId = null;

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    ['score', 'level', 'streak', 'lives', 'accuracy', 'word', 'wordHint', 'gallows',
     'danger', 'tags', 'question', 'options', 'feedback', 'timerFill', 'overlay',
     'overlayBody', 'streakBadge', 'nextBtn', 'quitBtn'].forEach(function (k) {
      el[k] = $('hq-' + k);
    });
  }

  /* ── Scoring ───────────────────────────────────────────────────── */
  function pointsFor(q, secondsLeft, streak) {
    var base = 60 + q.difficulty * 30;                 // harder questions pay more
    var speed = Math.round((secondsLeft / QUESTION_SECONDS) * 40);
    var mult = 1 + Math.min(streak, 5) * 0.2;          // caps at 2x on a 5-streak
    return Math.round((base + speed) * mult);
  }

  /* ── Level setup ───────────────────────────────────────────────── */
  function startLevel(levelIndex) {
    var term = TERMS[levelIndex % TERMS.length];
    var letters = term.word.split('');
    var revealable = [];
    letters.forEach(function (c, i) { if (/[A-Z]/.test(c)) revealable.push(i); });

    state.level = levelIndex + 1;
    state.term = term;
    state.letters = letters;
    state.revealed = {};
    state.hidden = Bank.shuffle(revealable);
    state.wrong = 0;

    // Free head start: reveal ~20% of the letters so the board never looks blank.
    var freebies = Math.max(1, Math.round(state.hidden.length * 0.2));
    for (var i = 0; i < freebies; i++) state.revealed[state.hidden.pop()] = true;

    // Enough questions to reveal every remaining letter, plus slack for mistakes.
    state.queue = Bank.draw({
      count: state.hidden.length + MAX_WRONG + 4,
      subject: state.subject,
      minDifficulty: state.level >= 4 ? 2 : 1,
    });

    PARTS.forEach(function (p) {
      var node = $('hq-part-' + p);
      if (node) node.classList.remove('is-on');
    });
    el.gallows.classList.remove('is-doomed');

    renderWord();
    renderHud();
    nextQuestion();
  }

  function renderWord() {
    el.wordHint.textContent = 'Level ' + state.level + ' · ' + state.term.hint;
    el.word.innerHTML = '';
    state.letters.forEach(function (c, i) {
      var s = document.createElement('span');
      if (!/[A-Z]/.test(c)) {
        s.className = 'hq-slot is-space';
      } else {
        s.className = 'hq-slot' + (state.revealed[i] ? ' is-shown' : '');
        s.textContent = state.revealed[i] ? c : '';
      }
      el.word.appendChild(s);
    });
  }

  function revealOneLetter() {
    if (!state.hidden.length) return;
    state.revealed[state.hidden.pop()] = true;
    renderWord();
  }

  /* ── HUD ───────────────────────────────────────────────────────── */
  function bump(node) {
    if (!node) return;
    node.classList.remove('is-bump');
    void node.offsetWidth;                              // force reflow to restart
    node.classList.add('is-bump');
  }

  function renderHud() {
    el.score.textContent = state.score.toLocaleString('en-IN');
    el.level.textContent = state.level;
    el.streak.textContent = state.streak > 0 ? '×' + state.streak : '—';
    var pct = state.asked ? Math.round((state.correct / state.asked) * 100) : 100;
    el.accuracy.textContent = pct + '%';

    el.lives.innerHTML = '';
    for (var i = 0; i < MAX_WRONG; i++) {
      var h = document.createElement('span');
      h.className = 'hq-life' + (i < state.wrong ? ' is-lost' : '');
      h.textContent = '❤';
      el.lives.appendChild(h);
    }
    var left = MAX_WRONG - state.wrong;
    el.danger.innerHTML = left > 2
      ? left + ' mistakes left'
      : '<b>' + left + ' mistake' + (left === 1 ? '' : 's') + ' left!</b>';
  }

  /* ── Question flow ─────────────────────────────────────────────── */
  function nextQuestion() {
    stopTimer();
    el.feedback.classList.remove('is-on');
    el.nextBtn.hidden = true;

    if (!state.queue.length) state.queue = Bank.draw({ count: 8, subject: state.subject });
    var q = state.queue.shift();
    state.current = q;
    state.secondsLeft = QUESTION_SECONDS;

    el.tags.innerHTML = '';
    addTag(q.subjectLabel, 'hq-tag--' + q.subject);
    addTag(q.chapterTitle, 'hq-tag--chapter');
    addTag(['', 'Easy', 'Medium', 'Hard'][q.difficulty], 'hq-tag--diff');

    el.question.textContent = q.question;
    el.options.innerHTML = '';
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hq-opt';
      b.innerHTML = '<span class="hq-opt-key">' + 'ABCD'[i] + '</span><span>' + escapeHtml(text) + '</span>';
      b.addEventListener('click', function () { answer(i); });
      el.options.appendChild(b);
    });

    startTimer();
  }

  function addTag(text, cls) {
    var s = document.createElement('span');
    s.className = 'hq-tag ' + cls;
    s.textContent = text;
    el.tags.appendChild(s);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function startTimer() {
    el.timerFill.style.width = '100%';
    el.timerFill.classList.remove('is-low');
    timerId = setInterval(function () {
      state.secondsLeft -= 0.1;
      var pct = Math.max(0, (state.secondsLeft / QUESTION_SECONDS) * 100);
      el.timerFill.style.width = pct + '%';
      if (pct < 30) el.timerFill.classList.add('is-low');
      if (state.secondsLeft <= 0) answer(-1);
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function answer(chosen) {
    stopTimer();
    var q = state.current;
    var ok = chosen === q.answer;
    state.asked += 1;

    var buttons = el.options.querySelectorAll('.hq-opt');
    buttons.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.answer) b.classList.add('is-correct');
      else if (i === chosen) b.classList.add('is-wrong');
    });

    if (ok) {
      state.correct += 1;
      state.streak += 1;
      state.best = Math.max(state.best, state.streak);
      var gained = pointsFor(q, Math.max(0, state.secondsLeft), state.streak - 1);
      state.score += gained;
      bump(el.score);
      if (state.streak >= 3) flashStreak(state.streak);
      revealOneLetter();
      // A streak of 3+ is rewarded with an extra letter.
      if (state.streak > 0 && state.streak % 3 === 0) revealOneLetter();
      showFeedback(true, '+' + gained + ' points · ' + q.explain);
    } else {
      state.streak = 0;
      state.wrong += 1;
      state.missed.push(q);
      var part = $('hq-part-' + PARTS[state.wrong - 1]);
      if (part) part.classList.add('is-on');
      if (state.wrong >= MAX_WRONG) el.gallows.classList.add('is-doomed');
      showFeedback(false, (chosen === -1 ? 'Time up! ' : '') +
        'Correct answer: ' + q.options[q.answer] + '. ' + q.explain);
    }

    renderHud();

    if (state.wrong >= MAX_WRONG) {
      setTimeout(gameOver, 1400);
    } else if (!state.hidden.length) {
      setTimeout(levelComplete, 1100);
    } else {
      el.nextBtn.hidden = false;
      el.nextBtn.focus();
    }
  }

  function showFeedback(ok, text) {
    el.feedback.dataset.ok = ok ? '1' : '0';
    el.feedback.innerHTML = '<b>' + (ok ? '✅ Correct!' : '❌ Not quite') + '</b>' + escapeHtml(text);
    el.feedback.classList.add('is-on');
  }

  function flashStreak(n) {
    el.streakBadge.textContent = '🔥 ' + n + ' in a row!';
    el.streakBadge.classList.remove('is-on');
    void el.streakBadge.offsetWidth;
    el.streakBadge.classList.add('is-on');
  }

  function confetti(count) {
    var colors = ['#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#818cf8'];
    for (var i = 0; i < count; i++) {
      var c = document.createElement('i');
      c.className = 'hq-confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(c);
      setTimeout((function (node) { return function () { node.remove(); }; })(c), 4200);
    }
  }

  /* ── Level / game end ──────────────────────────────────────────── */
  function levelComplete() {
    stopTimer();
    var bonus = 200 + (MAX_WRONG - state.wrong) * 75;
    state.score += bonus;
    confetti(40);
    openOverlay(
      '<span class="hq-card-emoji">🏆</span>' +
      '<h2>Level ' + state.level + ' cleared!</h2>' +
      '<p>You revealed <b style="color:#fbbf24">' + state.term.word + '</b> with ' +
        (MAX_WRONG - state.wrong) + ' of ' + MAX_WRONG + ' lives intact.</p>' +
      scoreLine('Level bonus', '+' + bonus) +
      '<div class="hq-actions">' +
      '<button type="button" class="hq-btn" data-act="next">Next level →</button>' +
      '<button type="button" class="hq-btn hq-btn--ghost" data-act="quit">End game</button>' +
      '</div>'
    );
  }

  function gameOver() {
    stopTimer();
    var pct = state.asked ? Math.round((state.correct / state.asked) * 100) : 0;
    var recap = '';
    if (state.missed.length) {
      recap = '<div class="hq-recap"><h3>Revise these ' + state.missed.length + ' concepts</h3><ul>' +
        state.missed.slice(-8).map(function (q) {
          return '<li><b>' + escapeHtml(q.question) + '</b>' +
                 '<em>' + escapeHtml(q.options[q.answer]) + '</em> — ' + escapeHtml(q.chapterTitle) + '</li>';
        }).join('') + '</ul></div>';
    }
    openOverlay(
      '<span class="hq-card-emoji">💀</span>' +
      '<h2>Game over</h2>' +
      '<p>The word was <b style="color:#fbbf24">' + state.term.word + '</b>.</p>' +
      scoreLine('Final score', state.score.toLocaleString('en-IN')) +
      '<div class="hq-scoreline">' +
      '<div><span>Levels</span><b>' + state.level + '</b></div>' +
      '<div><span>Accuracy</span><b>' + pct + '%</b></div>' +
      '<div><span>Best streak</span><b>' + state.best + '</b></div>' +
      '</div>' + recap +
      '<div class="hq-actions">' +
      '<button type="button" class="hq-btn" data-act="restart">Play again</button>' +
      '<a class="hq-btn hq-btn--ghost" href="game-room.html">Game Room</a>' +
      '</div>'
    );
    saveBest();
  }

  function scoreLine(label, value) {
    return '<div class="hq-scoreline"><div><span>' + label + '</span><b>' + value + '</b></div></div>';
  }

  function saveBest() {
    try {
      var key = 'cbse10_hangman_best';
      var prev = parseInt(localStorage.getItem(key) || '0', 10);
      if (state.score > prev) localStorage.setItem(key, String(state.score));
    } catch (e) { /* private mode — scores just do not persist */ }
  }

  function bestScore() {
    try { return parseInt(localStorage.getItem('cbse10_hangman_best') || '0', 10); }
    catch (e) { return 0; }
  }

  /* ── Overlay ───────────────────────────────────────────────────── */
  function openOverlay(html) {
    el.overlayBody.innerHTML = html;
    el.overlay.hidden = false;
  }

  function closeOverlay() { el.overlay.hidden = true; }

  function showStartCard() {
    var s = Bank.stats();
    var best = bestScore();
    openOverlay(
      '<span class="hq-card-emoji">🎯</span>' +
      '<h2>CBSE Hangman Quiz</h2>' +
      '<p>Answer questions from Science and Mathematics to reveal the hidden term. ' +
      'Six wrong answers and the hangman is complete.</p>' +
      '<p style="font-size:0.8rem">' + s.total + ' questions · ' + s.chapters + ' chapters' +
      (best ? ' · your best: <b style="color:#fbbf24">' + best.toLocaleString('en-IN') + '</b>' : '') + '</p>' +
      '<div class="hq-setup hq-chip-group"><p>Subject mix</p>' +
      '<button type="button" class="hq-chip" data-subject="mixed" aria-pressed="true">🔀 Mixed</button>' +
      '<button type="button" class="hq-chip" data-subject="science" aria-pressed="false">🔬 Science</button>' +
      '<button type="button" class="hq-chip" data-subject="mathematics" aria-pressed="false">📐 Mathematics</button>' +
      '</div>' +
      '<div class="hq-actions"><button type="button" class="hq-btn" data-act="begin">Start game →</button></div>'
    );
  }

  /* ── Boot ──────────────────────────────────────────────────────── */
  function newGame(subject) {
    state = {
      subject: subject || 'mixed',
      score: 0, streak: 0, best: 0,
      asked: 0, correct: 0,
      level: 0, missed: [],
    };
    closeOverlay();
    startLevel(0);
  }

  function init() {
    cacheDom();

    var pending = 'mixed';
    var urlSubject = new URLSearchParams(location.search).get('subject');
    if (urlSubject === 'science' || urlSubject === 'mathematics') pending = urlSubject;

    el.overlay.addEventListener('click', function (ev) {
      var chip = ev.target.closest('[data-subject]');
      if (chip) {
        pending = chip.dataset.subject;
        el.overlay.querySelectorAll('[data-subject]').forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
        return;
      }
      var act = ev.target.closest('[data-act]');
      if (!act) return;
      var a = act.dataset.act;
      if (a === 'begin' || a === 'restart') newGame(pending);
      else if (a === 'next') { closeOverlay(); startLevel(state.level); }
      else if (a === 'quit') gameOver();
    });

    el.nextBtn.addEventListener('click', nextQuestion);
    el.quitBtn.addEventListener('click', function () {
      if (state) gameOver();
    });

    // Keyboard: A–D pick an option, Enter/Space advances.
    document.addEventListener('keydown', function (ev) {
      if (!el.overlay.hidden) return;
      var k = ev.key.toUpperCase();
      var idx = 'ABCD'.indexOf(k);
      if (idx >= 0) {
        var btn = el.options.querySelectorAll('.hq-opt')[idx];
        if (btn && !btn.disabled) { ev.preventDefault(); btn.click(); }
      } else if ((ev.key === 'Enter' || ev.key === ' ') && !el.nextBtn.hidden) {
        ev.preventDefault();
        nextQuestion();
      }
    });

    showStartCard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
