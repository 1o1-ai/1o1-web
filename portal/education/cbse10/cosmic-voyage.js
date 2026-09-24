/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Cosmic Voyage — an interplanetary CBSE Class 10 quiz journey.
  The student pilots a ship from Earth outward across 8 legs: Moon, Mars,
  Asteroid Belt, Jupiter, Saturn, Uranus, Neptune and Deep Space. Each correct
  answer adds thrust; reaching the leg's thrust target lands the ship at the
  waypoint. Wrong answers and timeouts damage the hull (3 points); at hull 0
  the ship drifts and the same leg must be retried. Difficulty ramps mostly
  through mechanics — timers shrink 30s → 14s, meteor-shower rapid questions
  appear from leg 3, and a weighted d1/d2/d3 question mix shifts from 80/20/0
  on the Moon leg to 15/45/40 in Deep Space (the bank has few d3 questions, so
  stakes, not raw question difficulty, carry the ramp). A 3-answer streak arms
  a Warp Boost (+2 thrust on the next correct). Progress persists in
  localStorage under 'cv10_progress'.
*/
(function () {
  'use strict';

  var Bank = window.CBSE10QuizBank;
  if (!Bank) return;

  /* One leg per row: thrust target, question timer (s), d1/d2/d3 weight mix. */
  var LEVELS = [
    { name: 'Moon',          cls: 'moon',    thrust: 5,  timer: 30, mix: [80, 20, 0],  meteors: false },
    { name: 'Mars',          cls: 'mars',    thrust: 6,  timer: 28, mix: [70, 30, 0],  meteors: false },
    { name: 'Asteroid Belt', cls: 'belt',    thrust: 6,  timer: 25, mix: [55, 40, 5],  meteors: true },
    { name: 'Jupiter',       cls: 'jupiter', thrust: 7,  timer: 22, mix: [45, 45, 10], meteors: true },
    { name: 'Saturn',        cls: 'saturn',  thrust: 7,  timer: 20, mix: [35, 50, 15], meteors: true },
    { name: 'Uranus',        cls: 'uranus',  thrust: 8,  timer: 18, mix: [25, 55, 20], meteors: true },
    { name: 'Neptune',       cls: 'neptune', thrust: 8,  timer: 16, mix: [20, 50, 30], meteors: true },
    { name: 'Deep Space',    cls: 'deep',    thrust: 10, timer: 14, mix: [15, 45, 40], meteors: true },
  ];

  var HULL_MAX = 3;
  var TICKER_MS = 2500;
  var METEOR_SECONDS = 10;
  var STORE_KEY = 'cv10_progress';

  var el = {};
  var state = null;
  var progress = null;
  var subject = 'science';
  var pools = null;              // { 1:[q...], 2:[...], 3:[...] } for the subject
  var timerId = null;
  var pendingT = null;

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    ['stars', 'route', 'score', 'leg', 'streak', 'hull', 'thrustTrack', 'thrustFill',
     'thrustText', 'qpanel', 'timerFill', 'timerText', 'tags', 'question', 'options',
     'ticker', 'abortBtn', 'ship', 'flash', 'warpBadge', 'overlay', 'overlayBody']
      .forEach(function (k) { el[k] = $('cv-' + k); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Persistent progress ───────────────────────────────────────── */
  function loadProgress() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { p = null; }
    if (!p || typeof p.furthest !== 'number') p = { furthest: 0, bestAccuracy: {}, subject: subject };
    if (!p.bestAccuracy) p.bestAccuracy = {};
    p.furthest = Math.max(0, Math.min(LEVELS.length, p.furthest));
    return p;
  }

  function saveProgress() {
    progress.subject = subject;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); }
    catch (e) { /* private mode — progress just does not persist */ }
  }

  /* ── Weighted question sampler ─────────────────────────────────── */
  /* The bank is d1-heavy (≈100/75/9), so each leg draws by weight over the
     subject pool, never repeating an id within a voyage until the pool of a
     difficulty is exhausted (then that tier's used-set resets). */
  function buildPools() {
    pools = { 1: [], 2: [], 3: [] };
    Bank.all.forEach(function (q) {
      if (q.subject === subject) pools[q.difficulty].push(q);
    });
  }

  function weightedDifficulty(mix) {
    var r = Math.random() * 100;
    var acc = 0;
    for (var d = 0; d < 3; d++) {
      acc += mix[d];
      if (r < acc && pools[d + 1].length) return d + 1;
    }
    return pools[3].length ? 3 : (pools[2].length ? 2 : 1);
  }

  function freshFrom(diff) {
    return pools[diff].filter(function (q) { return !state.used[q.id]; });
  }

  function pickQuestion(mix) {
    var want = weightedDifficulty(mix);
    var order = [want, 1, 2, 3].filter(function (d, i, a) { return a.indexOf(d) === i; })
      .sort(function (a, b) {
        return (a === want ? -1 : Math.abs(a - want)) - (b === want ? -1 : Math.abs(b - want));
      });
    for (var i = 0; i < order.length; i++) {
      var fresh = freshFrom(order[i]);
      if (!fresh.length && pools[order[i]].length) {
        // This tier is exhausted for the run — recycle it.
        pools[order[i]].forEach(function (q) { delete state.used[q.id]; });
        fresh = pools[order[i]];
      }
      if (fresh.length) {
        var q = fresh[Math.floor(Math.random() * fresh.length)];
        state.used[q.id] = true;
        return prepare(q);
      }
    }
    return null; // unreachable with a non-empty bank
  }

  /* Shuffle option order per draw so the correct answer moves around. */
  function prepare(q) {
    var mixed = Bank.shuffle([0, 1, 2, 3]);
    return {
      id: q.id,
      subject: q.subject,
      subjectLabel: q.subjectLabel,
      chapterTitle: q.chapterTitle,
      question: q.question,
      difficulty: q.difficulty,
      explain: q.explain,
      options: mixed.map(function (i) { return q.options[i]; }),
      answer: mixed.indexOf(q.answer),
    };
  }

  /* ── Route map ─────────────────────────────────────────────────── */
  function renderRoute() {
    el.route.innerHTML = '';
    var current = state ? state.levelIdx : -1;
    LEVELS.forEach(function (L, i) {
      var wp = document.createElement('div');
      var cls = 'cv-wp';
      if (i < progress.furthest) cls += ' is-done';
      if (i === current) cls += ' is-current';
      if (i > progress.furthest) cls += ' is-locked';
      if (i <= progress.furthest && i > 0) cls += ' is-trail';
      wp.className = cls;
      wp.innerHTML =
        '<i class="cv-planet cv-pl-' + L.cls + '"></i>' +
        '<span class="cv-wp-name">' + escapeHtml(L.name) + '</span>';
      el.route.appendChild(wp);
    });
  }

  /* ── HUD ───────────────────────────────────────────────────────── */
  function bump(node) {
    node.classList.remove('is-bump');
    void node.offsetWidth;
    node.classList.add('is-bump');
  }

  function renderHud() {
    var L = LEVELS[state.levelIdx];
    el.score.textContent = state.score.toLocaleString('en-IN');
    el.leg.textContent = 'L' + (state.levelIdx + 1) + ' · ' + L.name;
    el.streak.textContent = state.streak > 0 ? '×' + state.streak : '—';

    el.hull.innerHTML = '';
    for (var i = 0; i < HULL_MAX; i++) {
      var pip = document.createElement('span');
      pip.className = 'cv-hull-pip' + (i >= state.hull ? ' is-lost' : '');
      pip.textContent = '🛡';
      el.hull.appendChild(pip);
    }

    var pct = Math.min(100, (state.leg.thrust / L.thrust) * 100);
    el.thrustFill.style.width = pct + '%';
    el.thrustText.textContent = Math.min(state.leg.thrust, L.thrust) + ' / ' + L.thrust;
    el.thrustTrack.classList.toggle('is-warp', state.warpArmed);
    el.ship.classList.toggle('is-warp', state.warpArmed);
  }

  function shipStage(levelIdx) {
    return levelIdx < 3 ? 1 : (levelIdx < 6 ? 2 : 3);
  }

  /* ── Leg lifecycle ─────────────────────────────────────────────── */
  function startLeg(levelIdx) {
    clearPending();
    stopTimer();
    closeOverlay();
    state.levelIdx = levelIdx;
    state.hull = HULL_MAX;
    state.streak = 0;
    state.warpArmed = false;
    state.meteorActive = false;
    state.leg = { thrust: 0, asked: 0, correct: 0, missed: [], meteorDone: false, start: Date.now() };
    el.ship.dataset.stage = String(shipStage(levelIdx));
    el.ship.classList.remove('is-landing');
    renderRoute();
    renderHud();
    nextQuestion();
  }

  function questionSeconds() {
    if (state.meteorActive) return METEOR_SECONDS;
    return Math.max(6, Math.round(LEVELS[state.levelIdx].timer * state.timerScale));
  }

  function nextQuestion() {
    clearPending();
    el.ticker.classList.remove('is-on');
    el.qpanel.classList.toggle('is-meteor', state.meteorActive);

    var q = pickQuestion(LEVELS[state.levelIdx].mix);
    state.q = q;
    state.secondsTotal = questionSeconds();
    state.secondsLeft = state.secondsTotal;

    el.tags.innerHTML = '';
    if (state.meteorActive) addTag('☄️ Meteor shower — answer fast!', 'cv-tag--meteor');
    addTag(q.subjectLabel, 'cv-tag--' + q.subject);
    addTag(q.chapterTitle, 'cv-tag--chapter');
    addTag(['', 'Easy', 'Medium', 'Hard'][q.difficulty], 'cv-tag--diff');

    el.question.textContent = q.question;
    el.options.innerHTML = '';
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cv-opt';
      b.innerHTML = '<span class="cv-opt-key">' + 'ABCD'[i] + '</span><span>' + escapeHtml(text) + '</span>';
      b.addEventListener('click', function () { answer(i); });
      el.options.appendChild(b);
    });

    startTimer();
  }

  function addTag(text, cls) {
    var s = document.createElement('span');
    s.className = 'cv-tag ' + cls;
    s.textContent = text;
    el.tags.appendChild(s);
  }

  /* ── Timer ─────────────────────────────────────────────────────── */
  function startTimer() {
    stopTimer();
    el.timerFill.style.width = '100%';
    el.timerFill.classList.remove('is-low');
    el.timerText.textContent = Math.ceil(state.secondsLeft) + 's';
    timerId = setInterval(function () {
      state.secondsLeft -= 0.1;
      var pct = Math.max(0, (state.secondsLeft / state.secondsTotal) * 100);
      el.timerFill.style.width = pct + '%';
      el.timerText.textContent = Math.max(0, Math.ceil(state.secondsLeft)) + 's';
      if (pct < 30) el.timerFill.classList.add('is-low');
      if (state.secondsLeft <= 0) answer(-1);
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function clearPending() {
    if (pendingT) { clearTimeout(pendingT); pendingT = null; }
  }

  /* ── Answering ─────────────────────────────────────────────────── */
  function answer(chosen) {
    stopTimer();
    var q = state.q;
    var ok = chosen === q.answer;
    var wasMeteor = state.meteorActive;
    state.leg.asked += 1;

    var buttons = el.options.querySelectorAll('.cv-opt');
    buttons.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.answer) b.classList.add('is-correct');
      else if (i === chosen) b.classList.add('is-wrong');
    });

    if (wasMeteor) {
      state.meteorActive = false;
      state.leg.meteorDone = true;
      if (ok) {
        state.leg.correct += 1;
        state.hull = Math.min(HULL_MAX, state.hull + 1);
        state.score += 250;
        bump(el.score);
        shieldFlare();
        ticker(true, '+250 · Meteor deflected — hull patched!', q.explain);
      } else {
        takeDamage();
        ticker(false, (chosen === -1 ? 'Time up! ' : '') +
          'Meteor strike! Correct answer: ' + q.options[q.answer] + '.', q.explain);
      }
    } else if (ok) {
      state.leg.correct += 1;
      state.streak += 1;
      var gain = state.warpArmed ? 2 : 1;
      state.warpArmed = false;
      state.leg.thrust += gain;
      var pts = Math.round(100 * (1 + state.streak * 0.1));
      state.score += pts;
      bump(el.score);
      if (state.streak > 0 && state.streak % 3 === 0) armWarp();
      ticker(true, '+' + pts + ' points · +' + gain + ' thrust', q.explain);
    } else {
      state.streak = 0;
      state.warpArmed = false;
      state.leg.missed.push(q);
      takeDamage();
      ticker(false, (chosen === -1 ? 'Time up! ' : '') +
        'Correct answer: ' + q.options[q.answer] + '.', q.explain);
    }

    renderHud();

    var L = LEVELS[state.levelIdx];
    pendingT = setTimeout(function () {
      pendingT = null;
      if (state.hull <= 0) {
        showDrifting();
      } else if (state.leg.thrust >= L.thrust) {
        legCleared();
      } else if (L.meteors && !state.leg.meteorDone &&
                 state.leg.thrust >= Math.ceil(L.thrust / 2)) {
        state.meteorActive = true;
        nextQuestion();
      } else {
        nextQuestion();
      }
    }, TICKER_MS);
  }

  function ticker(ok, headline, explain) {
    el.ticker.dataset.ok = ok ? '1' : '0';
    el.ticker.innerHTML =
      '<span class="cv-ticker-src">📡 Mission Control</span>' +
      '<b>' + (ok ? '✅ ' : '❌ ') + escapeHtml(headline) + '</b>' +
      escapeHtml(explain);
    el.ticker.classList.add('is-on');
  }

  function takeDamage() {
    state.hull -= 1;
    el.flash.classList.remove('is-on');
    void el.flash.offsetWidth;
    el.flash.classList.add('is-on');
    el.ship.classList.remove('is-hit');
    void el.ship.offsetWidth;
    el.ship.classList.add('is-hit');
  }

  function shieldFlare() {
    el.ship.classList.remove('is-shielded');
    void el.ship.offsetWidth;
    el.ship.classList.add('is-shielded');
  }

  function armWarp() {
    state.warpArmed = true;
    el.warpBadge.textContent = '⚡ Warp boost armed — next correct gives +2 thrust!';
    el.warpBadge.classList.remove('is-on');
    void el.warpBadge.offsetWidth;
    el.warpBadge.classList.add('is-on');
  }

  /* ── Leg end: captain's log / drifting / victory ───────────────── */
  function legSeconds() {
    return Math.round((Date.now() - state.leg.start) / 1000);
  }

  function accuracyPct() {
    return state.leg.asked ? Math.round((state.leg.correct / state.leg.asked) * 100) : 100;
  }

  function recapHtml(missed) {
    if (!missed.length) {
      return '<p style="color:var(--cv-good)">Flawless leg — no missed questions. 🌟</p>';
    }
    return '<div class="cv-recap"><h3>Revise these ' + missed.length + ' concepts</h3><ul>' +
      missed.map(function (q) {
        return '<li><b>' + escapeHtml(q.question) + '</b>' +
               '<em>' + escapeHtml(q.options[q.answer]) + '</em> — ' + escapeHtml(q.explain) + '</li>';
      }).join('') + '</ul></div>';
  }

  function legCleared() {
    stopTimer();
    clearPending();
    var idx = state.levelIdx;
    var L = LEVELS[idx];
    var bonus = 500 * (idx + 1);
    state.score += bonus;

    var pct = accuracyPct();
    var secs = legSeconds();
    state.voyageLegs[idx] = { idx: idx, name: L.name, pct: pct, secs: secs };

    // furthest may reach LEVELS.length: every leg completed.
    progress.furthest = Math.max(progress.furthest, idx + 1);
    var key = String(idx + 1);
    if (!progress.bestAccuracy[key] || pct > progress.bestAccuracy[key]) {
      progress.bestAccuracy[key] = pct;
    }
    saveProgress();

    // Landing animation, then the captain's log.
    el.ship.classList.add('is-landing');
    pendingT = setTimeout(function () {
      pendingT = null;
      el.ship.classList.remove('is-landing');
      renderRoute();
      showCaptainsLog(L, idx, bonus, pct, secs);
    }, 1550);
  }

  function showCaptainsLog(L, idx, bonus, pct, secs) {
    var last = idx === LEVELS.length - 1;
    openOverlay(
      '<span class="cv-card-emoji">🪐</span>' +
      '<h2>Waypoint reached: ' + escapeHtml(L.name) + '</h2>' +
      '<p>Captain’s Log, leg ' + (idx + 1) + ' of ' + LEVELS.length + '. Landing bonus +' +
        bonus.toLocaleString('en-IN') + '.</p>' +
      '<div class="cv-scoreline">' +
      '<div><span>Accuracy</span><b>' + pct + '%</b></div>' +
      '<div><span>Leg time</span><b>' + secs + 's</b></div>' +
      '<div><span>Score</span><b>' + state.score.toLocaleString('en-IN') + '</b></div>' +
      '</div>' +
      recapHtml(state.leg.missed) +
      '<div class="cv-actions">' +
      (last
        ? '<button type="button" class="cv-btn" data-act="summary">Voyage summary →</button>'
        : '<button type="button" class="cv-btn" data-act="next">Next leg: ' +
            escapeHtml(LEVELS[idx + 1].name) + ' →</button>') +
      '<button type="button" class="cv-btn cv-btn--ghost" data-act="map">Star map</button>' +
      '</div>'
    );
  }

  function showDrifting() {
    stopTimer();
    clearPending();
    openOverlay(
      '<span class="cv-card-emoji">🛰️</span>' +
      '<h2>Drifting…</h2>' +
      '<p>The hull gave out on the way to <b style="color:#fbbf24">' +
        escapeHtml(LEVELS[state.levelIdx].name) + '</b>. Mission Control has your ship in tow — ' +
        'earlier waypoints are safe. Patch up and fly this leg again.</p>' +
      recapHtml(state.leg.missed) +
      '<div class="cv-actions">' +
      '<button type="button" class="cv-btn" data-act="retry">Retry leg ' + (state.levelIdx + 1) + ' →</button>' +
      '<button type="button" class="cv-btn cv-btn--ghost" data-act="map">Star map</button>' +
      '</div>'
    );
  }

  function showVictory() {
    var legs = state.voyageLegs.filter(Boolean);
    var totalPct = legs.length
      ? Math.round(legs.reduce(function (s, l) { return s + l.pct; }, 0) / legs.length)
      : 0;
    var rows = legs.map(function (l) {
      return '<li><b>L' + (l.idx + 1) + ' · ' + escapeHtml(l.name) + '</b>' +
             '<span><em>' + l.pct + '%</em> · ' + l.secs + 's</span></li>';
    }).join('');
    openOverlay(
      '<span class="cv-card-emoji">🚀🏆</span>' +
      '<h2>Voyage complete!</h2>' +
      '<p>From Earth to Deep Space — all ' + LEVELS.length + ' waypoints reached. ' +
        'Mission Control salutes you, Captain.</p>' +
      '<div class="cv-scoreline">' +
      '<div><span>Total score</span><b>' + state.score.toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Voyage accuracy</span><b>' + totalPct + '%</b></div>' +
      '</div>' +
      '<ul class="cv-legs">' + rows + '</ul>' +
      '<div class="cv-actions">' +
      '<button type="button" class="cv-btn" data-act="newvoyage">🌌 New Voyage (timers −20%)</button>' +
      '<button type="button" class="cv-btn cv-btn--ghost" data-act="map">Star map</button>' +
      '<a class="cv-btn cv-btn--ghost" href="game-room.html">Game Room</a>' +
      '</div>'
    );
  }

  /* ── Star map (level select) ───────────────────────────────────── */
  function showStarMap() {
    stopTimer();
    clearPending();
    el.ship.classList.remove('is-landing');
    var map = LEVELS.map(function (L, i) {
      var locked = i > progress.furthest;
      var done = i < progress.furthest;
      var next = i === progress.furthest;
      var best = progress.bestAccuracy[String(i + 1)];
      var cls = 'cv-map-wp' + (done ? ' is-done' : '') + (next ? ' is-next' : '');
      var sub = locked ? '<span class="cv-wp-lock">🔒</span>'
        : done ? '<span class="cv-map-sub">Best ' + best + '%</span>'
        : '<span class="cv-map-sub">' + LEVELS[i].timer + 's · target ' + LEVELS[i].thrust + '</span>';
      return '<button type="button" class="' + cls + '" data-level="' + i + '"' +
        (locked ? ' disabled' : '') + '>' +
        '<i class="cv-planet cv-pl-' + L.cls + '"></i>' +
        '<span class="cv-map-name">L' + (i + 1) + ' ' + escapeHtml(L.name) + '</span>' +
        sub + '</button>';
    }).join('');

    openOverlay(
      '<span class="cv-card-emoji">🌌</span>' +
      '<h2>Cosmic Voyage</h2>' +
      '<p>Pilot your ship from Earth to Deep Space. Correct answers build thrust; ' +
        'wrong ones damage the hull. Reach all ' + LEVELS.length + ' waypoints to complete the voyage.</p>' +
      '<div class="cv-subjects">' +
      '<a href="?subject=science" aria-current="' + (subject === 'science') + '">🔬 Science</a>' +
      '<a href="?subject=mathematics" aria-current="' + (subject === 'mathematics') + '">📐 Mathematics</a>' +
      '</div>' +
      '<div class="cv-map">' + map + '</div>' +
      '<div class="cv-actions">' +
      '<button type="button" class="cv-btn" data-act="launch">🚀 Launch: ' +
        escapeHtml(LEVELS[Math.min(progress.furthest, LEVELS.length - 1)].name) + ' →</button>' +
      '</div>'
    );
    // While the map is open the route strip shows saved progress, not a live leg.
    var keep = state;
    state = null;
    renderRoute();
    state = keep;
  }

  /* ── Overlay plumbing ──────────────────────────────────────────── */
  function openOverlay(html) {
    el.overlayBody.innerHTML = html;
    el.overlay.hidden = false;
  }

  function closeOverlay() { el.overlay.hidden = true; }

  function onOverlayClick(ev) {
    var wp = ev.target.closest('[data-level]');
    if (wp && !wp.disabled) {
      startLeg(parseInt(wp.dataset.level, 10));
      return;
    }
    var act = ev.target.closest('[data-act]');
    if (!act) return;
    var a = act.dataset.act;
    if (a === 'launch') startLeg(Math.min(progress.furthest, LEVELS.length - 1));
    else if (a === 'retry') startLeg(state.levelIdx);
    else if (a === 'next') startLeg(state.levelIdx + 1);
    else if (a === 'map') showStarMap();
    else if (a === 'summary') showVictory();
    else if (a === 'newvoyage') {
      state.timerScale *= 0.8;                    // harder remix: −20% per voyage
      state.score = 0;
      state.voyageLegs = [];
      state.used = {};
      startLeg(0);
    }
  }

  /* ── Starfield canvas ──────────────────────────────────────────── */
  function initStars() {
    var canvas = el.stars;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var stars = [];
    var shooting = null;
    var rafId = null;
    var reduced;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)'); }
    catch (e) { reduced = { matches: false }; }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      seed();
      if (reduced.matches) draw(0);
    }

    function seed() {
      stars = [];
      var n = Math.min(220, Math.max(60, Math.round((canvas.width * canvas.height) / 9000)));
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 0.4 + Math.random() * 1.3,
          v: 0.03 + Math.random() * 0.12,
          a: 0.25 + Math.random() * 0.65,
          tw: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = s.a * (0.65 + 0.35 * Math.sin(t * 0.0012 + s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232, 237, 247, ' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      if (shooting) {
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(shooting.x - shooting.vx * 9, shooting.y - shooting.vy * 9);
        ctx.strokeStyle = 'rgba(165, 243, 252, ' + (shooting.life / 40).toFixed(3) + ')';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    function step(t) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y += s.v;
        if (s.y > canvas.height + 2) { s.y = -2; s.x = Math.random() * canvas.width; }
      }
      if (!shooting && Math.random() < 0.004) {
        shooting = {
          x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          y: Math.random() * canvas.height * 0.35,
          vx: 5 + Math.random() * 4,
          vy: 2.5 + Math.random() * 2,
          life: 40,
        };
      }
      if (shooting) {
        shooting.x += shooting.vx;
        shooting.y += shooting.vy;
        shooting.life -= 1;
        if (shooting.life <= 0 || shooting.x > canvas.width + 40) shooting = null;
      }
      draw(t);
    }

    function loop(t) {
      step(t);
      rafId = window.requestAnimationFrame(loop);
    }

    function applyMotionPref() {
      if (reduced.matches) {
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
        shooting = null;
        draw(0);                                  // one calm static frame
      } else if (!rafId) {
        rafId = window.requestAnimationFrame(loop);
      }
    }

    window.addEventListener('resize', resize);
    if (reduced.addEventListener) reduced.addEventListener('change', applyMotionPref);
    else if (reduced.addListener) reduced.addListener(applyMotionPref);

    resize();
    applyMotionPref();
  }

  /* ── Boot ──────────────────────────────────────────────────────── */
  function init() {
    cacheDom();

    var urlSubject = new URLSearchParams(location.search).get('subject');
    subject = (urlSubject === 'mathematics') ? 'mathematics' : 'science';

    progress = loadProgress();
    buildPools();

    state = {
      levelIdx: 0,
      timerScale: 1,
      score: 0,
      streak: 0,
      warpArmed: false,
      hull: HULL_MAX,
      meteorActive: false,
      used: {},
      voyageLegs: [],
      leg: { thrust: 0, asked: 0, correct: 0, missed: [], meteorDone: false, start: Date.now() },
      q: null,
      secondsLeft: 0,
      secondsTotal: 0,
    };

    el.overlay.addEventListener('click', onOverlayClick);
    el.abortBtn.addEventListener('click', showStarMap);

    // Keyboard: A–D pick an option while a question is live.
    document.addEventListener('keydown', function (ev) {
      if (!el.overlay.hidden) return;
      var idx = 'ABCD'.indexOf(ev.key.toUpperCase());
      if (idx >= 0) {
        var btn = el.options.querySelectorAll('.cv-opt')[idx];
        if (btn && !btn.disabled) { ev.preventDefault(); btn.click(); }
      }
    });

    initStars();
    renderRoute();
    showStarMap();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
