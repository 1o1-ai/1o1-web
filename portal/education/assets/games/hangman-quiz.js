/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Shared Hangman Quiz engine. Track-agnostic: everything syllabus-specific
  (subjects, hidden terms, questions) comes from window.BrahmexaGames, which is
  built by game-core.js from the track's game-bank.js.

  Mechanic: each level hides a curriculum term. Correct MCQ answers reveal its
  letters; wrong answers draw one more part of the hangman. Reveal the whole
  term before six mistakes to clear the level.
*/
(function () {
  'use strict';

  var G = window.BrahmexaGames;
  if (!G) return;

  var MAX_WRONG = 6;
  var PARTS = ['head', 'body', 'armL', 'armR', 'legL', 'legR'];
  var QUESTION_SECONDS = 30;

  var el = {};
  var state = null;
  var timerId = null;

  function $(id) { return document.getElementById(id); }
  var esc = G.escapeHtml;

  function cacheDom() {
    ['score', 'level', 'streak', 'lives', 'accuracy', 'word', 'wordHint', 'gallows',
     'danger', 'tags', 'question', 'options', 'feedback', 'timerFill', 'overlay',
     'overlayBody', 'streakBadge', 'nextBtn', 'quitBtn'].forEach(function (k) {
      el[k] = $('hq-' + k);
    });
  }

  function pointsFor(q, secondsLeft, streak) {
    var base = 60 + q.difficulty * 30;
    var speed = Math.round((secondsLeft / QUESTION_SECONDS) * 40);
    var mult = 1 + Math.min(streak, 5) * 0.2;      // caps at 2x on a 5-streak
    return Math.round((base + speed) * mult);
  }

  /* ── Level setup ───────────────────────────────────────────────── */
  function startLevel(levelIndex) {
    var terms = G.terms.length ? G.terms : [{ word: 'CURRICULUM', hint: 'What you are revising', subject: 'mixed' }];
    var term = terms[levelIndex % terms.length];
    var letters = term.word.split('');
    var revealable = [];
    letters.forEach(function (c, i) { if (/[A-Z]/.test(c)) revealable.push(i); });

    state.level = levelIndex + 1;
    state.term = term;
    state.letters = letters;
    state.revealed = {};
    state.hidden = G.shuffle(revealable);
    state.wrong = 0;

    // Free head start: reveal ~20% of the letters so the board never looks blank.
    var freebies = Math.max(1, Math.round(state.hidden.length * 0.2));
    for (var i = 0; i < freebies; i++) state.revealed[state.hidden.pop()] = true;

    state.queue = G.draw({
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
    void node.offsetWidth;                          // force reflow to restart
    node.classList.add('is-bump');
  }

  function renderHud() {
    el.score.textContent = state.score.toLocaleString('en-IN');
    el.level.textContent = state.level;
    el.streak.textContent = state.streak > 0 ? '×' + state.streak : '—';
    el.accuracy.textContent = (state.asked ? Math.round((state.correct / state.asked) * 100) : 100) + '%';

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

    if (!state.queue.length) state.queue = G.draw({ count: 8, subject: state.subject });
    var q = state.queue.shift();
    state.current = q;
    state.secondsLeft = QUESTION_SECONDS;

    el.tags.innerHTML = '';
    addTag(q.subjectLabel, 'hq-tag--subject');
    addTag(q.chapterTitle, 'hq-tag--chapter');
    addTag(q.difficultyLabel, 'hq-tag--diff');

    el.question.textContent = q.question;
    el.options.innerHTML = '';
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hq-opt';
      b.innerHTML = '<span class="hq-opt-key">' + 'ABCD'[i] + '</span><span>' + esc(text) + '</span>';
      b.addEventListener('click', function () { answer(i); });
      el.options.appendChild(b);
    });

    startTimer();
  }

  function addTag(text, cls) {
    if (!text) return;
    var s = document.createElement('span');
    s.className = 'hq-tag ' + cls;
    s.textContent = text;
    el.tags.appendChild(s);
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

    el.options.querySelectorAll('.hq-opt').forEach(function (b, i) {
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
      if (state.streak % 3 === 0) revealOneLetter();   // streak bonus letter
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

    if (state.wrong >= MAX_WRONG) setTimeout(gameOver, 1400);
    else if (!state.hidden.length) setTimeout(levelComplete, 1100);
    else { el.nextBtn.hidden = false; el.nextBtn.focus(); }
  }

  function showFeedback(ok, text) {
    el.feedback.dataset.ok = ok ? '1' : '0';
    el.feedback.innerHTML = '<b>' + (ok ? '✅ Correct!' : '❌ Not quite') + '</b>' + esc(text);
    el.feedback.classList.add('is-on');
  }

  function flashStreak(n) {
    el.streakBadge.textContent = '🔥 ' + n + ' in a row!';
    el.streakBadge.classList.remove('is-on');
    void el.streakBadge.offsetWidth;
    el.streakBadge.classList.add('is-on');
  }

  /* ── Level / game end ──────────────────────────────────────────── */
  function levelComplete() {
    stopTimer();
    var bonus = 200 + (MAX_WRONG - state.wrong) * 75;
    state.score += bonus;
    G.confetti(40, 'hq');
    openOverlay(
      '<span class="hq-card-emoji">🏆</span>' +
      '<h2>Level ' + state.level + ' cleared!</h2>' +
      '<p>You revealed <b style="color:#fbbf24">' + esc(state.term.word) + '</b> with ' +
        (MAX_WRONG - state.wrong) + ' of ' + MAX_WRONG + ' lives intact.</p>' +
      '<div class="hq-scoreline"><div><span>Level bonus</span><b>+' + bonus + '</b></div></div>' +
      '<div class="hq-actions">' +
      '<button type="button" class="hq-btn" data-act="next">Next level →</button>' +
      '<button type="button" class="hq-btn hq-btn--ghost" data-act="quit">End game</button>' +
      '</div>'
    );
  }

  function gameOver() {
    stopTimer();
    G.saveBest('hangman', state.score);
    var pct = state.asked ? Math.round((state.correct / state.asked) * 100) : 0;
    openOverlay(
      '<span class="hq-card-emoji">💀</span>' +
      '<h2>Game over</h2>' +
      '<p>The word was <b style="color:#fbbf24">' + esc(state.term.word) + '</b>.</p>' +
      '<div class="hq-scoreline">' +
      '<div><span>Final score</span><b>' + state.score.toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Levels</span><b>' + state.level + '</b></div>' +
      '<div><span>Accuracy</span><b>' + pct + '%</b></div>' +
      '<div><span>Best streak</span><b>' + state.best + '</b></div>' +
      '</div>' + recapHtml() +
      '<div class="hq-actions">' +
      '<button type="button" class="hq-btn" data-act="restart">Play again</button>' +
      '<a class="hq-btn hq-btn--ghost" href="game-room.html">Game Room</a>' +
      '</div>'
    );
  }

  function recapHtml() {
    if (!state.missed.length) return '';
    return '<div class="hq-recap"><h3>Revise these ' + state.missed.length + ' concepts</h3><ul>' +
      state.missed.slice(-8).map(function (q) {
        return '<li><b>' + esc(q.question) + '</b><em>' + esc(q.options[q.answer]) +
               '</em> — ' + esc(q.chapterTitle) + '</li>';
      }).join('') + '</ul></div>';
  }

  /* ── Overlay ───────────────────────────────────────────────────── */
  function openOverlay(html) { el.overlayBody.innerHTML = html; el.overlay.hidden = false; }
  function closeOverlay() { el.overlay.hidden = true; }

  function showStartCard() {
    var s = G.stats();
    var best = G.bestScore('hangman');
    var chips = [{ key: 'mixed', label: '🔀 Mixed' }].concat(
      G.subjectOptions().map(function (o) { return { key: o.key, label: o.label }; })
    );
    openOverlay(
      '<span class="hq-card-emoji">🎯</span>' +
      '<h2>Hangman Quiz</h2>' +
      '<p class="hq-track">' + esc(G.label) + '</p>' +
      '<p>Answer questions from your syllabus to reveal the hidden term. ' +
      'Six wrong answers and the hangman is complete.</p>' +
      '<p style="font-size:0.8rem">' + s.total + ' questions · ' + s.chapters + ' chapters' +
      (best ? ' · your best: <b style="color:#fbbf24">' + best.toLocaleString('en-IN') + '</b>' : '') + '</p>' +
      '<div class="hq-setup hq-chip-group"><p>Subject mix</p>' +
      chips.map(function (c, i) {
        return '<button type="button" class="hq-chip" data-subject="' + esc(c.key) + '" aria-pressed="' +
               (i === 0 ? 'true' : 'false') + '">' + esc(c.label) + '</button>';
      }).join('') +
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
    if (urlSubject && G.subjects[urlSubject]) pending = urlSubject;

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
    el.quitBtn.addEventListener('click', function () { if (state) gameOver(); });

    // Keyboard: A-D pick an option, Enter/Space advances.
    document.addEventListener('keydown', function (ev) {
      if (!el.overlay.hidden) return;
      var idx = 'ABCD'.indexOf(ev.key.toUpperCase());
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
