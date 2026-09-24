/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Chain Reaction — reactor-engineer quiz game on the CBSE Class 10 syllabus.
  The student brings the "Gyan Reactor" online across eight Marks. Each
  correct answer slots an energy core into the reactor ring; every mistake
  raises instability (0-3) — at three the reactor melts down and the Mark is
  retried (completed Marks stay online). Three correct answers in a row are
  a chain surge: one instability vented, +500 bonus, multiplier +0.5x
  (cap 3x, reset on a miss) and lightning across the ring.

  Level design (cores / seconds per question / d1-d2-d3 mix):
    Mk-I 6/30s 80-20-0 · Mk-II 7/27s 70-30-0 · Mk-III 8/24s 55-40-5 ·
    Mk-IV 9/21s 45-45-10 · Mk-V 10/19s 35-50-15 · Mk-VI 10/17s 25-55-20 ·
    Mk-VII 11/15s 20-50-30 · Mk-VIII 12/13s 15-45-40.
  Questions come from a weighted sampler over CBSE10QuizBank.all filtered by
  subject (?subject=science|mathematics, default science); used ids are
  tracked per run so nothing repeats until the pool exhausts. One power-up
  (Coolant / Time Dilation / Insight) per completed Mark, two held max.
  Scoring: 100 x multiplier per correct, +500 per surge, 300 x Mark on
  clear, +200 per unused power-up at Full Power.
*/
(function () {
  'use strict';

  var Bank = window.CBSE10QuizBank;
  if (!Bank) return;

  /* ── Reactor Marks — cores to slot, seconds per question, d1/d2/d3 mix ── */
  var LEVELS = [
    { mark: 'Mk-I',    cores: 6,  timer: 30, mix: [80, 20, 0]  },
    { mark: 'Mk-II',   cores: 7,  timer: 27, mix: [70, 30, 0]  },
    { mark: 'Mk-III',  cores: 8,  timer: 24, mix: [55, 40, 5]  },
    { mark: 'Mk-IV',   cores: 9,  timer: 21, mix: [45, 45, 10] },
    { mark: 'Mk-V',    cores: 10, timer: 19, mix: [35, 50, 15] },
    { mark: 'Mk-VI',   cores: 10, timer: 17, mix: [25, 55, 20] },
    { mark: 'Mk-VII',  cores: 11, timer: 15, mix: [20, 50, 30] },
    { mark: 'Mk-VIII', cores: 12, timer: 13, mix: [15, 45, 40] },
  ];

  var POWERS = [
    { id: 'coolant', icon: '🧊', label: 'Coolant', desc: 'Vents ALL instability from the reactor' },
    { id: 'dilate',  icon: '⏳', label: 'Time Dilation', desc: 'Adds 15 seconds to the current question timer' },
    { id: 'insight', icon: '💡', label: 'Insight', desc: 'Removes two wrong options' },
  ];

  var STORE_KEY = 'cr10_progress';
  var LOG_MS = 2500;              // Engineer's log dwell time before next question
  var MAX_POWERS = 2;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DIFF_LABEL = ['', 'Easy', 'Medium', 'Hard'];
  var reducedMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var el = {};
  var fx = null;
  var timerId = null;
  var progress = loadProgress();
  var SUBJECT = getSubject();
  var run = null;                 // whole-run state (score, powers, used ids)
  var state = null;               // current-Mark state

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    ['root', 'stage', 'mark', 'cores', 'score', 'mult', 'pips', 'gauge', 'needle',
     'reactor', 'ring', 'orb', 'powers', 'log', 'timerFill', 'secs', 'tags',
     'question', 'options', 'abortBtn', 'tint', 'flash', 'overlay',
     'overlayBody'].forEach(function (k) {
      el[k] = $('cr-' + k);
    });
    el.fxCanvas = $('cr-fx');
    el.gsegs = el.gauge.querySelectorAll('.cr-gseg');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ── Progress persistence ──────────────────────────────────────── */
  function loadProgress() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { p = null; }
    if (!p || typeof p !== 'object') p = {};
    return {
      furthest: p.furthest > 0 ? Math.min(8, p.furthest) : 0,
      bestScore: p.bestScore && typeof p.bestScore === 'object' ? p.bestScore : {},
      subject: p.subject === 'mathematics' ? 'mathematics' : 'science',
    };
  }

  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* private mode */ }
  }

  function getSubject() {
    var m = /[?&]subject=(science|mathematics)/.exec(window.location.search);
    if (m) return m[1];
    return progress.subject;
  }

  /* ── Weighted question sampler over Bank.all ───────────────────── */
  function pickDifficulty(mix) {
    var r = Math.random() * (mix[0] + mix[1] + mix[2]);
    if (r < mix[0]) return 1;
    if (r < mix[0] + mix[1]) return 2;
    return 3;
  }

  function unusedPool(diff) {
    return Bank.all.filter(function (q) {
      return q.subject === run.subject && q.difficulty === diff && !run.used[q.id];
    });
  }

  function drawQuestion() {
    var mix = LEVELS[state.level].mix;
    var want = pickDifficulty(mix);
    var order = want === 3 ? [3, 2, 1] : want === 2 ? [2, 1, 3] : [1, 2, 3];
    var pool = [];
    var i;
    for (i = 0; i < order.length && !pool.length; i++) pool = unusedPool(order[i]);
    if (!pool.length) {
      run.used = {};            // subject pool exhausted — recycle
      for (i = 0; i < order.length && !pool.length; i++) pool = unusedPool(order[i]);
    }
    var q = pool[Math.floor(Math.random() * pool.length)];
    run.used[q.id] = 1;
    return randomiseOptions(q);
  }

  function randomiseOptions(q) {
    var pairs = Bank.shuffle(q.options.map(function (t, i) {
      return { t: t, ok: i === q.answer };
    }));
    return {
      id: q.id, subject: q.subject, subjectLabel: q.subjectLabel,
      chapter: q.chapter, chapterTitle: q.chapterTitle,
      question: q.question, difficulty: q.difficulty, explain: q.explain,
      options: pairs.map(function (p) { return p.t; }),
      answer: pairs.findIndex(function (p) { return p.ok; }),
    };
  }

  /* ── Particle field: sparks, bursts, embers, lightning ─────────── */
  function initFx() {
    var canvas = el.fxCanvas;
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var sparks = [], bursts = [], bolts = [], embers = [];

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < 55; i++) {
      sparks.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.6 + 0.4,
        vy: Math.random() * 0.3 + 0.08,
        sway: Math.random() * Math.PI * 2,
        a: Math.random() * 0.45 + 0.12,
      });
    }

    function burst(x, y, color, count) {
      for (var j = 0; j < count; j++) {
        var ang = (Math.PI * 2 * j) / count + Math.random() * 0.4;
        var sp = Math.random() * 5 + 2.2;
        bursts.push({
          x: x, y: y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          life: 1, color: color, r: Math.random() * 3.2 + 1.4,
        });
      }
    }

    function bolt(x1, y1, x2, y2, color) {
      var pts = [], n = 14;
      for (var j = 0; j <= n; j++) {
        var t = j / n;
        var x = x1 + (x2 - x1) * t;
        var y = y1 + (y2 - y1) * t;
        if (j > 0 && j < n) {
          x += (Math.random() - 0.5) * 28;
          y += (Math.random() - 0.5) * 28;
        }
        pts.push([x, y]);
      }
      bolts.push({ pts: pts, life: 1, color: color || '#a5f3fc' });
    }

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var i, p;

      if (!reducedMotion) {
        // Idle drifting sparks — the reactor hall dust
        for (i = 0; i < sparks.length; i++) {
          p = sparks[i];
          p.y -= p.vy;
          p.sway += 0.01;
          p.x += Math.sin(p.sway) * 0.2;
          if (p.y < -4) { p.y = window.innerHeight + 4; p.x = Math.random() * window.innerWidth; }
          ctx.globalAlpha = p.a;
          ctx.fillStyle = '#67e8f9';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Warning embers rise as instability grows
        var heat = state && state.phase !== 'over' ? state.instability : 0;
        if (heat > 0 && embers.length < 80 && Math.random() < heat * 0.12) {
          embers.push({
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 6,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(Math.random() * 1.2 + 0.5),
            r: Math.random() * 2.2 + 0.8,
            life: 1,
            color: heat >= 2 ? '#f87171' : '#fbbf24',
          });
        }
      }

      for (i = embers.length - 1; i >= 0; i--) {
        p = embers[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.006;
        if (p.life <= 0 || p.y < -8) { embers.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life * 0.8);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (i = bursts.length - 1; i >= 0; i--) {
        p = bursts[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.14;
        p.vx *= 0.98;
        p.life -= 0.022;
        if (p.life <= 0) { bursts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      for (i = bolts.length - 1; i >= 0; i--) {
        p = bolts[i];
        p.life -= 0.07;
        if (p.life <= 0) { bolts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (var j = 0; j < p.pts.length; j++) {
          if (j === 0) ctx.moveTo(p.pts[j][0], p.pts[j][1]);
          else ctx.lineTo(p.pts[j][0], p.pts[j][1]);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    frame();

    return { burst: burst, bolt: bolt };
  }

  function burstAt(node, color, count) {
    if (!fx || !node) return;
    var r = node.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, color, count || 20);
  }

  /* ── SVG reactor ring — segment count adapts to the Mark ───────── */
  function polar(cx, cy, r, deg) {
    var rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx, cy, r, a0, a1) {
    var p0 = polar(cx, cy, r, a0);
    var p1 = polar(cx, cy, r, a1);
    var large = (a1 - a0) > 180 ? 1 : 0;
    return 'M ' + p0.x.toFixed(2) + ' ' + p0.y.toFixed(2) +
           ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' +
           p1.x.toFixed(2) + ' ' + p1.y.toFixed(2);
  }

  function buildRing(n) {
    var svg = el.ring;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.classList.remove('is-full');

    var defs = document.createElementNS(SVG_NS, 'defs');
    var grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', 'crSegGrad');
    // userSpaceOnUse: objectBoundingBox collapses on axis-aligned geometry
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '240');
    grad.setAttribute('y2', '240');
    [['0%', '#22d3ee'], ['50%', '#818cf8'], ['100%', '#fbbf24']].forEach(function (s) {
      var stop = document.createElementNS(SVG_NS, 'stop');
      stop.setAttribute('offset', s[0]);
      stop.setAttribute('stop-color', s[1]);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    var step = 360 / n;
    var gap = Math.min(7, step * 0.22);
    state.segs = [];
    for (var i = 0; i < n; i++) {
      var a0 = -90 + i * step + gap / 2;
      var a1 = -90 + (i + 1) * step - gap / 2;
      var d = arcPath(120, 120, 96, a0, a1);

      var base = document.createElementNS(SVG_NS, 'path');
      base.setAttribute('class', 'cr-seg');
      base.setAttribute('d', d);
      svg.appendChild(base);

      var lit = document.createElementNS(SVG_NS, 'path');
      lit.setAttribute('class', 'cr-seg-lit');
      lit.setAttribute('d', d);
      lit.setAttribute('pathLength', '100');
      svg.appendChild(lit);
      state.segs.push(lit);
    }
  }

  function igniteSegment(i) {
    if (!state) return;
    var seg = state.segs[i];
    if (seg) seg.classList.add('is-lit');
    burstAt(el.orb, '#22d3ee', 18);
    if (state.coresLit >= LEVELS[state.level].cores) {
      el.ring.classList.add('is-full');
      el.orb.classList.add('is-max');
      burstAt(el.orb, '#fbbf24', 34);
    }
  }

  /* Animated flying core: correct option → reactor orb */
  function flyCore(btn, done) {
    if (reducedMotion || !btn) { done(); return; }
    var r1 = btn.getBoundingClientRect();
    var r2 = el.orb.getBoundingClientRect();
    var d = document.createElement('span');
    d.className = 'cr-fly';
    var x1 = r1.left + r1.width / 2 - 11;
    var y1 = r1.top + r1.height / 2 - 11;
    d.style.left = x1 + 'px';
    d.style.top = y1 + 'px';
    document.body.appendChild(d);
    var dx = (r2.left + r2.width / 2 - 11) - x1;
    var dy = (r2.top + r2.height / 2 - 11) - y1;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        d.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0.55)';
        d.style.opacity = '0.85';
      });
    });
    setTimeout(function () { d.remove(); done(); }, 650);
  }

  /* ── FX helpers ────────────────────────────────────────────────── */
  function flashFx(red) {
    el.flash.classList.remove('is-on', 'is-red');
    void el.flash.offsetWidth;
    if (red) el.flash.classList.add('is-red');
    el.flash.classList.add('is-on');
  }

  function shakeStage() {
    el.stage.classList.remove('is-shake');
    void el.stage.offsetWidth;
    el.stage.classList.add('is-shake');
  }

  function quake() {
    el.root.classList.remove('is-quake');
    void el.root.offsetWidth;
    el.root.classList.add('is-quake');
  }

  function surgeFx() {
    flashFx(false);
    if (!fx) return;
    var r = el.ring.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var rad = r.width * 0.4;
    for (var b = 0; b < 2; b++) {
      var a = Math.random() * Math.PI;
      fx.bolt(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad,
              cx - Math.cos(a) * rad, cy - Math.sin(a) * rad);
    }
    fx.burst(cx, cy, '#a5f3fc', 26);
  }

  /* ── Rendering ─────────────────────────────────────────────────── */
  function addScore(n) {
    run.score += n;
    el.score.textContent = run.score.toLocaleString('en-IN');
  }

  function renderHud() {
    var L = LEVELS[state.level];
    el.mark.textContent = L.mark + (run.pace > 1 ? ' ⏩' : '');
    el.cores.textContent = state.coresLit + ' / ' + L.cores;
    el.score.textContent = run.score.toLocaleString('en-IN');
    el.mult.textContent = state.mult.toFixed(1) + '×';
    var lit = state.chain % 3;
    var pips = el.pips.querySelectorAll('i');
    for (var i = 0; i < pips.length; i++) pips[i].classList.toggle('is-on', i < lit);
    el.orb.style.setProperty('--cr-charge', (state.coresLit / L.cores).toFixed(3));
  }

  function setInstability(n) {
    el.gauge.dataset.level = String(n);
    el.gauge.setAttribute('aria-label', 'Instability: ' + n + ' of 3');
    el.tint.dataset.level = String(n);
    for (var i = 0; i < el.gsegs.length; i++) {
      var segNo = parseInt(el.gsegs[i].dataset.seg, 10);
      el.gsegs[i].classList.toggle('is-on', segNo <= n);
    }
  }

  function powerById(id) {
    return POWERS.filter(function (p) { return p.id === id; })[0];
  }

  function renderPowers() {
    el.powers.innerHTML = '';
    for (var s = 0; s < MAX_POWERS; s++) {
      var id = run ? run.powers[s] : null;
      if (id) {
        var p = powerById(id);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cr-power';
        b.disabled = !state || state.phase !== 'question';
        b.title = p.desc;
        b.innerHTML = '<i>' + p.icon + '</i><span>' + p.label + '</span>';
        b.addEventListener('click', (function (idx) {
          return function () { usePower(idx); };
        })(s));
        el.powers.appendChild(b);
      } else {
        var d = document.createElement('div');
        d.className = 'cr-slot';
        d.textContent = 'empty';
        el.powers.appendChild(d);
      }
    }
  }

  function usePower(idx) {
    if (!state || state.phase !== 'question' || !run.powers[idx]) return;
    var id = run.powers[idx];
    if (id === 'coolant') {
      state.instability = 0;
      setInstability(0);
      burstAt(el.gauge, '#7dd3fc', 18);
    } else if (id === 'dilate') {
      state.qTotal += 15;
      state.secondsLeft += 15;
      renderTimer();
      burstAt(el.timerFill, '#fbbf24', 14);
    } else if (id === 'insight') {
      var btns = [].slice.call(el.options.querySelectorAll('.cr-opt'));
      var wrong = btns.filter(function (b, i) {
        return i !== state.q.answer && !b.classList.contains('is-eliminated');
      });
      Bank.shuffle(wrong).slice(0, 2).forEach(function (b) {
        b.classList.add('is-eliminated');
        b.disabled = true;
      });
    }
    run.powers.splice(idx, 1);
    renderPowers();
  }

  function showLog(ok, text) {
    el.log.dataset.ok = ok ? '1' : '0';
    el.log.innerHTML = '<b>ENG LOG //</b> ' + escapeHtml(text);
    el.log.classList.add('is-on');
  }

  /* ── Timer ─────────────────────────────────────────────────────── */
  function renderTimer() {
    var pct = Math.max(0, Math.min(100, (state.secondsLeft / state.qTotal) * 100));
    el.timerFill.style.width = pct + '%';
    el.timerFill.classList.toggle('is-low', pct < 30);
    el.secs.textContent = Math.max(0, Math.ceil(state.secondsLeft)) + 's';
  }

  function startTimer() {
    stopTimer();
    renderTimer();
    timerId = setInterval(function () {
      state.secondsLeft -= 0.1;
      renderTimer();
      if (state.secondsLeft <= 0) answer(-1);
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  /* ── Mark / question flow ──────────────────────────────────────── */
  function newRun(pace) {
    return {
      subject: SUBJECT, pace: pace || 1, score: 0,
      powers: [], used: {}, bestChain: 0, missedAll: [],
    };
  }

  function startLevel(i) {
    closeOverlay();
    state = {
      level: i, phase: 'idle',
      coresLit: 0, instability: 0, chain: 0, mult: 1,
      correct: 0, wrong: 0, asked: 0, missed: [],
      bestChain: 0, scoreSnapshot: run.score,
      q: null, secondsLeft: 0, qTotal: 0, segs: [],
    };
    buildRing(LEVELS[i].cores);
    el.orb.classList.remove('is-max');
    setInstability(0);
    renderHud();
    el.log.classList.remove('is-on');
    nextQuestion();
  }

  function nextQuestion() {
    if (!state) return;
    state.phase = 'question';
    state.q = drawQuestion();
    var q = state.q;
    var L = LEVELS[state.level];

    el.log.classList.remove('is-on');
    el.tags.innerHTML = '';
    [['CORE ' + pad2(state.coresLit + 1) + '/' + pad2(L.cores), 'term'],
     [q.subjectLabel, q.subject],
     [q.chapterTitle, 'chapter'],
     [DIFF_LABEL[q.difficulty], 'diff']].forEach(function (t) {
      var s = document.createElement('span');
      s.className = 'cr-tag cr-tag--' + t[1];
      s.textContent = t[0];
      el.tags.appendChild(s);
    });

    el.question.textContent = q.question;
    el.options.innerHTML = '';
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cr-opt';
      b.innerHTML = '<span class="cr-opt-key">' + 'ABCD'[i] + '</span><span>' +
        escapeHtml(text) + '</span>';
      b.addEventListener('click', function () { answer(i); });
      el.options.appendChild(b);
    });

    state.qTotal = L.timer / run.pace;
    state.secondsLeft = state.qTotal;
    renderPowers();
    startTimer();
  }

  function answer(chosen) {
    if (!state || state.phase !== 'question') return;
    state.phase = 'resolve';
    stopTimer();

    var q = state.q;
    var ok = chosen === q.answer;
    state.asked += 1;

    var chosenBtn = null;
    el.options.querySelectorAll('.cr-opt').forEach(function (b, i) {
      b.disabled = true;
      if (i === q.answer) b.classList.add('is-correct');
      else if (i === chosen) b.classList.add('is-wrong');
      if (i === chosen) chosenBtn = b;
    });
    renderPowers();

    if (ok) correctFlow(q, chosenBtn);
    else wrongFlow(q, chosen === -1);
  }

  function correctFlow(q, btn) {
    state.correct += 1;
    state.chain += 1;
    state.bestChain = Math.max(state.bestChain, state.chain);
    run.bestChain = Math.max(run.bestChain, state.chain);

    var gained = Math.round(100 * state.mult);
    addScore(gained);

    var note = '+' + gained;
    var surged = state.chain > 0 && state.chain % 3 === 0;
    if (surged) {
      addScore(500);
      note += ' · ⚡ CHAIN SURGE +500';
      if (state.instability > 0) {
        state.instability -= 1;
        setInstability(state.instability);
        note += ' · instability vented';
      }
      state.mult = Math.min(3, state.mult + 0.5);
      surgeFx();
    }
    showLog(true, note + ' — ' + q.explain);

    state.coresLit += 1;
    var slot = state.coresLit - 1;
    flyCore(btn, function () { igniteSegment(slot); });
    renderHud();

    if (state.coresLit >= LEVELS[state.level].cores) {
      setTimeout(function () {
        if (state && state.phase === 'resolve') levelClear();
      }, 1500);
    } else {
      setTimeout(function () {
        if (state && state.phase === 'resolve') nextQuestion();
      }, LOG_MS);
    }
  }

  function wrongFlow(q, timedOut) {
    state.wrong += 1;
    state.missed.push(q);
    run.missedAll.push(q);
    state.chain = 0;
    state.mult = 1;
    state.instability += 1;
    setInstability(state.instability);
    shakeStage();
    flashFx(true);
    burstAt(el.orb, '#f87171', 16);
    showLog(false, (timedOut ? '⏱️ Timed out. ' : '') + 'Correct: ' +
      q.options[q.answer] + ' — ' + q.explain);
    renderHud();

    if (state.instability >= 3) {
      setTimeout(function () {
        if (state && state.phase === 'resolve') meltdown();
      }, 900);
    } else {
      setTimeout(function () {
        if (state && state.phase === 'resolve') nextQuestion();
      }, LOG_MS + 100);
    }
  }

  /* ── Outcomes ──────────────────────────────────────────────────── */
  function gradeFor(acc) {
    return acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : 'C';
  }

  function recapHtml(missed) {
    if (!missed.length) {
      return '<p class="cr-clean">No cores misaligned — flawless assembly.</p>';
    }
    return '<div class="cr-recap"><h3>Recalibrate these ' + missed.length +
      '</h3><ul>' + missed.slice(-8).map(function (q) {
        return '<li><b>' + escapeHtml(q.question) + '</b><em>' +
          escapeHtml(q.options[q.answer]) + '</em> — ' + escapeHtml(q.explain) + '</li>';
      }).join('') + '</ul></div>';
  }

  function levelClear() {
    state.phase = 'over';
    stopTimer();
    var L = LEVELS[state.level];
    var lvlNum = state.level + 1;
    addScore(300 * lvlNum);

    var acc = state.asked ? Math.round((state.correct / state.asked) * 100) : 100;
    var grade = gradeFor(acc);
    var levelScore = run.score - state.scoreSnapshot;

    var granted = null;
    if (run.powers.length < MAX_POWERS) {
      granted = POWERS[Math.floor(Math.random() * POWERS.length)];
      run.powers.push(granted.id);
    }

    progress.furthest = Math.max(progress.furthest, lvlNum);
    var prev = progress.bestScore[lvlNum];
    if (!prev || levelScore > prev.score) {
      progress.bestScore[lvlNum] = { score: levelScore, grade: grade };
    }
    progress.subject = run.subject;
    saveProgress();
    burstAt(el.orb, '#a5f3fc', 40);

    var isLast = lvlNum >= LEVELS.length;
    openOverlay(
      '<span class="cr-card-emoji">🟢</span>' +
      '<h2>Reactor ' + L.mark + ' ONLINE</h2>' +
      '<p class="cr-grade-line"><span class="cr-grade cr-grade--big" data-g="' + grade + '">' +
        grade + '</span></p>' +
      '<div class="cr-scoreline">' +
      '<div><span>Accuracy</span><b>' + acc + '%</b></div>' +
      '<div><span>Best chain</span><b>' + state.bestChain + '</b></div>' +
      '<div><span>Mark score</span><b>' + levelScore.toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Total</span><b>' + run.score.toLocaleString('en-IN') + '</b></div>' +
      '</div>' +
      (granted
        ? '<p class="cr-fineprint">Fabricated power cell: <b>' + granted.icon + ' ' +
          granted.label + '</b> — ' + granted.desc.toLowerCase() + '.</p>'
        : '<p class="cr-fineprint">Power cell bay full — no new cell fabricated.</p>') +
      recapHtml(state.missed) +
      '<div class="cr-actions">' +
      (isLast
        ? '<button type="button" class="cr-btn" data-act="finale">Full Power →</button>'
        : '<button type="button" class="cr-btn" data-act="next">Bring ' +
          LEVELS[lvlNum].mark + ' online →</button>') +
      '<button type="button" class="cr-btn cr-btn--ghost" data-act="select">Mark select</button>' +
      '</div>'
    );
  }

  function meltdown() {
    state.phase = 'over';
    stopTimer();
    var L = LEVELS[state.level];
    var lost = run.score - state.scoreSnapshot;
    run.score = state.scoreSnapshot;
    el.score.textContent = run.score.toLocaleString('en-IN');
    setInstability(3);
    quake();
    flashFx(true);
    burstAt(el.orb, '#ef4444', 44);

    openOverlay(
      '<div class="cr-klaxon" aria-hidden="true"></div>' +
      '<span class="cr-card-emoji">☢️</span>' +
      '<h2 class="cr-melt-title">MELTDOWN</h2>' +
      '<p>Instability breached containment on ' + L.mark +
      '. Completed Marks stay online — recalibrate and retry.</p>' +
      '<div class="cr-scoreline">' +
      '<div><span>Cores slotted</span><b>' + state.coresLit + ' / ' + L.cores + '</b></div>' +
      '<div><span>Mark score lost</span><b>' + lost.toLocaleString('en-IN') + '</b></div>' +
      '</div>' +
      recapHtml(state.missed) +
      '<div class="cr-actions">' +
      '<button type="button" class="cr-btn" data-act="retry">Restart ' + L.mark + '</button>' +
      '<button type="button" class="cr-btn cr-btn--ghost" data-act="select">Mark select</button>' +
      '</div>',
      'cr-card--melt'
    );
  }

  function weakestChapter() {
    var tally = {};
    run.missedAll.forEach(function (q) {
      tally[q.chapterTitle] = (tally[q.chapterTitle] || 0) + 1;
    });
    var worst = null;
    Object.keys(tally).forEach(function (k) {
      if (!worst || tally[k] > tally[worst]) worst = k;
    });
    return worst ? { title: worst, count: tally[worst] } : null;
  }

  function finale() {
    var bonus = run.powers.length * 200;
    if (bonus) addScore(bonus);
    run.powers = [];
    var weak = weakestChapter();
    surgeFx();

    openOverlay(
      '<span class="cr-card-emoji">🌟</span>' +
      '<h2>FULL POWER</h2>' +
      '<p>All eight Marks of the Gyan Reactor are online. The grid is singing.</p>' +
      '<div class="cr-scoreline">' +
      '<div><span>Total score</span><b>' + run.score.toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Longest chain</span><b>' + run.bestChain + '</b></div>' +
      '<div><span>Unused cells</span><b>+' + bonus + '</b></div>' +
      '</div>' +
      (weak
        ? '<p class="cr-fineprint">Weakest chain: <b>' + escapeHtml(weak.title) + '</b> (' +
          weak.count + ' missed) — revise that chapter before the boards.</p>'
        : '<p class="cr-fineprint">No weak links — every chapter held under load.</p>') +
      '<div class="cr-actions">' +
      '<button type="button" class="cr-btn" data-act="replay-fast">Replay at +20% speed →</button>' +
      '<button type="button" class="cr-btn cr-btn--ghost" data-act="select">Mark select</button>' +
      '<a class="cr-btn cr-btn--ghost" href="game-room.html">Game Room</a>' +
      '</div>'
    );
  }

  /* ── Overlay / Mark select ─────────────────────────────────────── */
  function openOverlay(html, extraClass) {
    el.overlayBody.className = 'cr-card' + (extraClass ? ' ' + extraClass : '');
    el.overlayBody.innerHTML = html;
    el.overlay.hidden = false;
  }

  function closeOverlay() { el.overlay.hidden = true; }

  function markCardsHtml() {
    return LEVELS.map(function (L, i) {
      var num = i + 1;
      var best = progress.bestScore[num];
      var locked = i > progress.furthest;
      var current = !locked && !best && i === progress.furthest;
      var cls = 'cr-mk' + (best ? ' is-done' : '') + (current ? ' is-cur' : '') +
        (locked ? ' is-locked' : '');
      var badge = best
        ? '<span class="cr-grade" data-g="' + best.grade + '">' + best.grade + '</span>'
        : locked ? '<span class="cr-lock">🔒</span>' : '';
      return '<button type="button" class="' + cls + '" data-act="start" data-level="' +
        i + '"' + (locked ? ' disabled' : '') + '>' + badge +
        '<span class="cr-schem"><i></i></span><b>' + L.mark + '</b>' +
        '<span class="cr-mk-sub">' + L.cores + ' cores · ' + L.timer + 's</span></button>';
    }).join('');
  }

  function showMarkSelect() {
    stopTimer();
    state = null;
    setInstability(0);
    var s = Bank.stats();
    var subjHtml = '<div class="cr-subjects">' +
      [['science', 'Science'], ['mathematics', 'Mathematics']].map(function (t) {
        return '<a class="cr-subject' + (SUBJECT === t[0] ? ' is-active' : '') +
          '" href="?subject=' + t[0] + '">' + t[1] + '</a>';
      }).join('') + '</div>';

    openOverlay(
      '<span class="cr-card-emoji">⚛️</span>' +
      '<h2>Chain Reaction</h2>' +
      '<p>Bring the Gyan Reactor online, Mark by Mark. Correct answers slot energy cores ' +
      'into the ring; mistakes raise instability — three and it melts down. ' +
      'Chain three in a row to surge: instability vents and the multiplier climbs.</p>' +
      subjHtml +
      '<div class="cr-marks">' + markCardsHtml() + '</div>' +
      '<p class="cr-fineprint">' + s[SUBJECT] + ' ' +
      (SUBJECT === 'mathematics' ? 'Mathematics' : 'Science') +
      ' questions · one power cell per completed Mark · hold ' + MAX_POWERS + ' max</p>'
    );
  }

  /* ── Boot ──────────────────────────────────────────────────────── */
  function init() {
    cacheDom();
    fx = initFx();
    renderPowers();

    el.overlay.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act]');
      if (!t) return;
      var act = t.dataset.act;
      if (act === 'start') {
        run = newRun(1);
        startLevel(parseInt(t.dataset.level, 10) || 0);
      } else if (act === 'next') {
        startLevel(state.level + 1);
      } else if (act === 'retry') {
        startLevel(state.level);
      } else if (act === 'select') {
        showMarkSelect();
      } else if (act === 'finale') {
        finale();
      } else if (act === 'replay-fast') {
        run = newRun(1.2);
        startLevel(0);
      }
    });

    el.abortBtn.addEventListener('click', function () {
      if (state && state.phase !== 'over' && run) {
        stopTimer();
        run.score = state.scoreSnapshot;
      }
      showMarkSelect();
    });

    document.addEventListener('keydown', function (ev) {
      if (!el.overlay.hidden || !state || state.phase !== 'question') return;
      var idx = 'ABCD'.indexOf(ev.key.toUpperCase());
      if (idx < 0) idx = '1234'.indexOf(ev.key);
      if (idx >= 0) {
        var btn = el.options.querySelectorAll('.cr-opt')[idx];
        if (btn && !btn.disabled) { ev.preventDefault(); btn.click(); }
      }
    });

    showMarkSelect();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
