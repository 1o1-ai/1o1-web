/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Shared Battle Arena engine. Track-agnostic: the boss roster and question pool
  come from window.BrahmexaGames, built by game-core.js from the track's
  game-bank.js.

  Correct answers strike the boss; wrong answers let it strike back. Speed and
  combo drive damage, and victories award power-ups for the next fight.
*/
(function () {
  'use strict';

  var G = window.BrahmexaGames;
  if (!G) return;

  var BOSSES = (G.bosses && G.bosses.length) ? G.bosses : [
    { id: 'default', name: 'Concept Warden', title: 'Syllabus Guardian', emoji: '★',
      tint: '#fbbf24', glow: 'rgba(251,191,36,0.5)', hp: 120, power: 14,
      subject: 'mixed', taunt: 'Prove what you know.' },
  ];

  var HERO_HP = 100;
  var TURN_SECONDS = 25;

  var POWERS = [
    { id: 'fifty', icon: '✂️', label: '50-50', desc: 'Removes two wrong options' },
    { id: 'shield', icon: '🛡️', label: 'Shield', desc: 'Blocks the next hit you take' },
    { id: 'freeze', icon: '❄️', label: 'Freeze', desc: 'Adds 15 seconds to the timer' },
    { id: 'crit', icon: '💥', label: 'Double', desc: 'Doubles your next hit' },
  ];

  var el = {};
  var state = null;
  var timerId = null;
  var fx = null;

  function $(id) { return document.getElementById(id); }
  var esc = G.escapeHtml;

  function cacheDom() {
    ['heroFill', 'heroText', 'foeFill', 'foeText', 'foeAvatar', 'foeName', 'foeTitle',
     'heroAvatar', 'combo', 'stage', 'timerFill', 'tags', 'question', 'options',
     'feedback', 'powers', 'overlay', 'overlayBody', 'nextBtn', 'fleeBtn',
     'roundNo', 'score', 'bossNo', 'flash'].forEach(function (k) {
      el[k] = $('fa-' + k);
    });
  }

  /* ── Particle field ────────────────────────────────────────────── */
  function initFx() {
    var canvas = $('fa-fx');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var bursts = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.7 + 0.4,
        vy: Math.random() * 0.28 + 0.06,
        a: Math.random() * 0.5 + 0.15,
      });
    }

    function burst(x, y, color, count) {
      for (var i = 0; i < count; i++) {
        var ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        var sp = Math.random() * 5 + 2.2;
        bursts.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                      life: 1, color: color, r: Math.random() * 3.2 + 1.4 });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(function (p) {
        p.y += p.vy;
        if (p.y > window.innerHeight) { p.y = -4; p.x = Math.random() * window.innerWidth; }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      for (var i = bursts.length - 1; i >= 0; i--) {
        var b = bursts[i];
        b.x += b.vx; b.y += b.vy;
        b.vy += 0.14;                  // gravity
        b.vx *= 0.98;
        b.life -= 0.022;
        if (b.life <= 0) { bursts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, b.life);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * b.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    frame();
    return { burst: burst };
  }

  function burstAt(node, color, count) {
    if (!fx || !node) return;
    var r = node.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, color, count || 22);
  }

  /* ── Damage ────────────────────────────────────────────────────── */
  function heroDamage(q, secondsLeft, combo) {
    return 12 + q.difficulty * 6 +
           Math.round((secondsLeft / TURN_SECONDS) * 10) +
           Math.min(combo, 5) * 3;
  }

  function floatDamage(node, text, kind) {
    if (!node) return;
    var stageRect = el.stage.getBoundingClientRect();
    var r = node.getBoundingClientRect();
    var d = document.createElement('span');
    d.className = 'fa-dmg fa-dmg--' + kind;
    d.textContent = text;
    d.style.left = (r.left - stageRect.left + r.width / 2 - 18) + 'px';
    d.style.top = (r.top - stageRect.top) + 'px';
    el.stage.appendChild(d);
    setTimeout(function () { d.remove(); }, 1150);
  }

  function flash() {
    el.flash.classList.remove('is-on');
    void el.flash.offsetWidth;
    el.flash.classList.add('is-on');
  }

  function renderHp() {
    var hpPct = (Math.max(0, state.heroHp) / HERO_HP) * 100;
    el.heroFill.style.width = hpPct + '%';
    el.heroFill.classList.toggle('is-mid', hpPct <= 55 && hpPct > 28);
    el.heroFill.classList.toggle('is-low', hpPct <= 28);
    el.heroText.textContent = Math.max(0, state.heroHp) + ' / ' + HERO_HP + ' HP';

    var bPct = (Math.max(0, state.foeHp) / state.boss.hp) * 100;
    el.foeFill.style.width = bPct + '%';
    el.foeFill.classList.toggle('is-mid', bPct <= 55 && bPct > 28);
    el.foeFill.classList.toggle('is-low', bPct <= 28);
    el.foeText.textContent = Math.max(0, state.foeHp) + ' / ' + state.boss.hp + ' HP';

    el.score.textContent = state.score.toLocaleString('en-IN');
    el.bossNo.textContent = (state.bossIndex + 1) + ' / ' + BOSSES.length;
  }

  function renderPowers() {
    el.powers.innerHTML = '';
    POWERS.forEach(function (p) {
      var n = state.powers[p.id] || 0;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fa-power' + (state.activePower === p.id ? ' is-active' : '');
      b.disabled = n <= 0 || state.answered;
      b.title = p.desc;
      b.innerHTML = p.icon + ' ' + p.label + ' <span class="fa-power-count">' + n + '</span>';
      b.addEventListener('click', function () { usePower(p.id); });
      el.powers.appendChild(b);
    });
  }

  function usePower(id) {
    if (state.answered || !state.powers[id]) return;
    if (id === 'fifty') {
      var btns = [].slice.call(el.options.querySelectorAll('.fa-opt'));
      var wrong = btns.filter(function (b, i) {
        return i !== state.current.answer && !b.classList.contains('is-eliminated');
      });
      G.shuffle(wrong).slice(0, 2).forEach(function (b) {
        b.classList.add('is-eliminated');
        b.disabled = true;
      });
    } else if (id === 'freeze') {
      state.secondsLeft = Math.min(TURN_SECONDS, state.secondsLeft + 15);
    } else if (id === 'shield') {
      state.shielded = true;
    } else if (id === 'crit') {
      state.critNext = true;
    }
    state.powers[id] -= 1;
    state.activePower = (id === 'shield' || id === 'crit') ? id : null;
    renderPowers();
  }

  /* ── Boss / round ──────────────────────────────────────────────── */
  function startBoss(index) {
    var boss = BOSSES[index];
    state.bossIndex = index;
    state.boss = boss;
    state.foeHp = boss.hp;
    state.heroHp = HERO_HP;
    state.round = 0;
    state.combo = 0;
    state.shielded = false;
    state.critNext = false;
    state.activePower = null;

    el.foeAvatar.textContent = boss.emoji;
    el.foeAvatar.style.setProperty('--fa-tint', boss.tint);
    el.foeAvatar.style.setProperty('--fa-glow', boss.glow);
    el.foeName.textContent = boss.name;
    el.foeTitle.textContent = boss.title;

    state.queue = G.draw({
      count: 30,
      subject: boss.subject,
      minDifficulty: boss.minDifficulty,
      maxDifficulty: boss.maxDifficulty,
    });

    renderHp();
    nextRound();
  }

  function nextRound() {
    stopTimer();
    state.answered = false;
    state.round += 1;
    el.roundNo.textContent = state.round;
    el.feedback.classList.remove('is-on');
    el.nextBtn.hidden = true;

    if (!state.queue.length) state.queue = G.draw({ count: 20, subject: state.boss.subject });
    var q = state.queue.shift();
    state.current = q;
    state.secondsLeft = TURN_SECONDS;

    el.tags.innerHTML = '';
    [[q.subjectLabel, 'subject'], [q.chapterTitle, 'chapter'], [q.difficultyLabel, 'diff']]
      .forEach(function (t) {
        if (!t[0]) return;
        var s = document.createElement('span');
        s.className = 'fa-tag fa-tag--' + t[1];
        s.textContent = t[0];
        el.tags.appendChild(s);
      });

    el.question.textContent = q.question;
    el.options.innerHTML = '';
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fa-opt';
      b.innerHTML = '<span class="fa-opt-key">' + 'ABCD'[i] + '</span><span>' + esc(text) + '</span>';
      b.addEventListener('click', function () { answer(i); });
      el.options.appendChild(b);
    });

    renderPowers();
    startTimer();
  }

  function startTimer() {
    el.timerFill.style.width = '100%';
    el.timerFill.classList.remove('is-low');
    timerId = setInterval(function () {
      state.secondsLeft -= 0.1;
      var pct = Math.max(0, (state.secondsLeft / TURN_SECONDS) * 100);
      el.timerFill.style.width = pct + '%';
      el.timerFill.classList.toggle('is-low', pct < 30);
      if (state.secondsLeft <= 0) answer(-1);
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function answer(chosen) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    var q = state.current;
    var ok = chosen === q.answer;
    state.asked += 1;

    el.options.querySelectorAll('.fa-opt').forEach(function (b, i) {
      b.disabled = true;
      if (i === q.answer) b.classList.add('is-correct');
      else if (i === chosen) b.classList.add('is-wrong');
    });

    if (ok) heroStrikes(q);
    else bossStrikes(q, chosen === -1);

    renderHp();
    renderPowers();

    if (state.foeHp <= 0) setTimeout(bossDefeated, 1200);
    else if (state.heroHp <= 0) setTimeout(defeat, 1200);
    else { el.nextBtn.hidden = false; el.nextBtn.focus(); }
  }

  function heroStrikes(q) {
    state.correct += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);

    var dmg = heroDamage(q, Math.max(0, state.secondsLeft), state.combo - 1);
    var isCrit = state.critNext || state.combo >= 5;
    if (isCrit) dmg *= 2;
    state.critNext = false;

    state.foeHp -= dmg;
    state.score += dmg * 10;

    el.heroAvatar.classList.remove('is-attacking-right');
    void el.heroAvatar.offsetWidth;
    el.heroAvatar.classList.add('is-attacking-right');
    el.foeAvatar.classList.remove('is-hurt');
    void el.foeAvatar.offsetWidth;
    el.foeAvatar.classList.add('is-hurt');

    floatDamage(el.foeAvatar, '-' + dmg, isCrit ? 'crit' : 'hero');
    burstAt(el.foeAvatar, isCrit ? '#f43f5e' : '#fbbf24', isCrit ? 38 : 22);
    if (isCrit) flash();

    el.combo.textContent = state.combo >= 2 ? state.combo + '× COMBO' : '';
    el.combo.classList.toggle('is-on', state.combo >= 2);

    showFeedback(true, (isCrit ? '💥 CRITICAL HIT! ' : '⚔️ Direct hit! ') + dmg + ' damage. ' + q.explain);
  }

  function bossStrikes(q, timedOut) {
    state.combo = 0;
    state.missed.push(q);
    el.combo.classList.remove('is-on');

    if (state.shielded) {
      state.shielded = false;
      state.activePower = null;
      floatDamage(el.heroAvatar, 'BLOCKED', 'heal');
      burstAt(el.heroAvatar, '#34d399', 20);
      showFeedback(false, '🛡️ Your shield absorbed the blow. Correct answer: ' +
        q.options[q.answer] + '. ' + q.explain);
      return;
    }

    var dmg = state.boss.power + Math.round(Math.random() * 6);
    state.heroHp -= dmg;

    el.foeAvatar.classList.remove('is-attacking-left');
    void el.foeAvatar.offsetWidth;
    el.foeAvatar.classList.add('is-attacking-left');
    el.heroAvatar.classList.remove('is-hurt');
    void el.heroAvatar.offsetWidth;
    el.heroAvatar.classList.add('is-hurt');

    floatDamage(el.heroAvatar, '-' + dmg, 'foe');
    burstAt(el.heroAvatar, '#fb7185', 20);

    showFeedback(false, (timedOut ? '⏱️ Out of time! ' : '🩸 ' + state.boss.name + ' strikes back! ') +
      dmg + ' damage. Correct answer: ' + q.options[q.answer] + '. ' + q.explain);
  }

  function showFeedback(ok, text) {
    el.feedback.dataset.ok = ok ? '1' : '0';
    el.feedback.innerHTML = '<b>' + (ok ? 'Correct' : 'Incorrect') + '</b>' + esc(text);
    el.feedback.classList.add('is-on');
  }

  /* ── Outcomes ──────────────────────────────────────────────────── */
  function grantRewards() {
    var picks = G.shuffle(POWERS).slice(0, 2).map(function (p) { return p.id; });
    if (state.bossIndex >= 2) picks.push('shield');
    picks.forEach(function (id) { state.powers[id] = (state.powers[id] || 0) + 1; });
    return picks.map(function (id) {
      var p = POWERS.find(function (x) { return x.id === id; });
      return p.icon + ' ' + p.label;
    });
  }

  function bossDefeated() {
    stopTimer();
    var hpBonus = state.heroHp * 25;
    state.score += 1000 + hpBonus;
    G.confetti(50, 'fa');

    if (state.bossIndex >= BOSSES.length - 1) return victory();

    var rewards = grantRewards();
    var next = BOSSES[state.bossIndex + 1];
    openOverlay(
      '<span class="fa-card-emoji">🏅</span>' +
      '<h2>' + esc(state.boss.name) + ' defeated!</h2>' +
      '<p>You cleared the ' + esc(state.boss.title) + ' with <b style="color:#34d399">' +
        state.heroHp + ' HP</b> remaining.</p>' +
      '<div class="fa-scoreline">' +
      '<div><span>Victory bonus</span><b>+' + (1000 + hpBonus).toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Total score</span><b>' + state.score.toLocaleString('en-IN') + '</b></div>' +
      '</div>' +
      '<p style="margin-top:14px;font-size:0.8rem">Power-ups earned</p>' +
      '<div class="fa-rewards">' + rewards.map(function (r) {
        return '<span class="fa-reward">' + r + '</span>';
      }).join('') + '</div>' +
      '<p style="font-size:0.83rem">Next up: <b style="color:' + esc(next.tint) + '">' +
        esc(next.emoji) + ' ' + esc(next.name) + '</b> — ' + esc(next.taunt) + '</p>' +
      '<div class="fa-actions">' +
      '<button type="button" class="fa-btn" data-act="nextBoss">Next battle →</button>' +
      '<button type="button" class="fa-btn fa-btn--ghost" data-act="stop">Stop here</button>' +
      '</div>'
    );
  }

  function victory() {
    stopTimer();
    G.saveBest('arena', state.score);
    G.confetti(120, 'fa');
    var pct = state.asked ? Math.round((state.correct / state.asked) * 100) : 0;
    openOverlay(
      '<span class="fa-card-emoji">👑</span>' +
      '<h2>Arena conquered!</h2>' +
      '<p>You defeated all ' + BOSSES.length + ' concept bosses and mastered the syllabus.</p>' +
      '<div class="fa-scoreline">' +
      '<div><span>Final score</span><b>' + state.score.toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Accuracy</span><b>' + pct + '%</b></div>' +
      '<div><span>Best combo</span><b>' + state.bestCombo + '×</b></div>' +
      '</div>' + recapHtml() +
      '<div class="fa-actions">' +
      '<button type="button" class="fa-btn" data-act="restart">Play again</button>' +
      '<a class="fa-btn fa-btn--ghost" href="game-room.html">Game Room</a>' +
      '</div>'
    );
  }

  function defeat() {
    stopTimer();
    G.saveBest('arena', state.score);
    var pct = state.asked ? Math.round((state.correct / state.asked) * 100) : 0;
    openOverlay(
      '<span class="fa-card-emoji">💔</span>' +
      '<h2>Defeated by ' + esc(state.boss.name) + '</h2>' +
      '<p>' + esc(state.boss.taunt) + '</p>' +
      '<div class="fa-scoreline">' +
      '<div><span>Score</span><b>' + state.score.toLocaleString('en-IN') + '</b></div>' +
      '<div><span>Accuracy</span><b>' + pct + '%</b></div>' +
      '<div><span>Best combo</span><b>' + state.bestCombo + '×</b></div>' +
      '</div>' + recapHtml() +
      '<div class="fa-actions">' +
      '<button type="button" class="fa-btn" data-act="retry">Retry ' + esc(state.boss.name) + '</button>' +
      '<button type="button" class="fa-btn fa-btn--ghost" data-act="restart">From the start</button>' +
      '</div>'
    );
  }

  function recapHtml() {
    if (!state.missed.length) return '';
    return '<div class="fa-recap"><h3>Revise these ' + state.missed.length + ' concepts</h3><ul>' +
      state.missed.slice(-8).map(function (q) {
        return '<li><b>' + esc(q.question) + '</b><em>' + esc(q.options[q.answer]) +
               '</em> — ' + esc(q.chapterTitle) + '</li>';
      }).join('') + '</ul></div>';
  }

  /* ── Overlay / boot ────────────────────────────────────────────── */
  function openOverlay(html) { el.overlayBody.innerHTML = html; el.overlay.hidden = false; }
  function closeOverlay() { el.overlay.hidden = true; }

  function showStartCard() {
    var s = G.stats();
    var best = G.bestScore('arena');
    openOverlay(
      '<span class="fa-card-emoji">⚔️</span>' +
      '<h2>Battle Arena</h2>' +
      '<p class="fa-track">' + esc(G.label) + '</p>' +
      '<p>' + BOSSES.length + ' concept bosses guard your syllabus. Answer correctly to strike; ' +
      'answer wrong and they strike you. Speed and combos multiply your damage.</p>' +
      '<div class="fa-roster">' + BOSSES.map(function (b) {
        return '<div class="fa-roster-item"><i>' + esc(b.emoji) + '</i><b>' + esc(b.name) +
               '</b><span>' + b.hp + ' HP</span></div>';
      }).join('') + '</div>' +
      '<p style="font-size:0.79rem">' + s.total + ' questions · ' + s.chapters + ' chapters' +
      (best ? ' · your best: <b style="color:#fbbf24">' + best.toLocaleString('en-IN') + '</b>' : '') + '</p>' +
      '<div class="fa-actions"><button type="button" class="fa-btn" data-act="begin">Enter the arena →</button></div>'
    );
  }

  function newGame() {
    state = {
      score: 0, asked: 0, correct: 0, bestCombo: 0, missed: [],
      powers: { fifty: 1, shield: 1, freeze: 1, crit: 0 },
    };
    closeOverlay();
    startBoss(0);
  }

  function init() {
    cacheDom();
    fx = initFx();

    el.overlay.addEventListener('click', function (ev) {
      var act = ev.target.closest('[data-act]');
      if (!act) return;
      var a = act.dataset.act;
      if (a === 'begin' || a === 'restart') newGame();
      else if (a === 'nextBoss') { closeOverlay(); startBoss(state.bossIndex + 1); }
      else if (a === 'retry') { closeOverlay(); startBoss(state.bossIndex); }
      else if (a === 'stop') victory();
    });

    el.nextBtn.addEventListener('click', nextRound);
    el.fleeBtn.addEventListener('click', function () { if (state) defeat(); });

    document.addEventListener('keydown', function (ev) {
      if (!el.overlay.hidden) return;
      var idx = 'ABCD'.indexOf(ev.key.toUpperCase());
      if (idx >= 0) {
        var btn = el.options.querySelectorAll('.fa-opt')[idx];
        if (btn && !btn.disabled) { ev.preventDefault(); btn.click(); }
      } else if ((ev.key === 'Enter' || ev.key === ' ') && !el.nextBtn.hidden) {
        ev.preventDefault();
        nextRound();
      }
    });

    showStartCard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
