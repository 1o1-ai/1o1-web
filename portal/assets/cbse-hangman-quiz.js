/**
 * ManjuLAB WordHunter — hangman-style MCQ game (subject-wide or multi-chapter).
 */
(function (global) {
  'use strict';

  const BRAND = 'ManjuLAB WordHunter';

  const CHAPTER_WORDS = {
    'chem-reactions': { word: 'REACTION', hint: 'Chemical change forming new substances' },
    'acids-bases': { word: 'NEUTRAL', hint: 'pH equals 7' },
    metals: { word: 'CORRODE', hint: 'Iron rusts when it does this' },
    carbon: { word: 'COVALENT', hint: 'Carbon shares electrons' },
    life: { word: 'PHOTOSYNTHESIS', hint: 'Plants make food using sunlight' },
    light: { word: 'REFRACTION', hint: 'Bending of light at a boundary' },
    electricity: { word: 'RESISTANCE', hint: "Opposes electric current" },
    magnetism: { word: 'SOLENOID', hint: 'Coil that acts like a magnet' },
    'sources-of-energy': { word: 'BIOGAS', hint: 'Fuel from cow dung and waste' },
    'real-numbers': { word: 'IRRATIONAL', hint: 'Cannot be written as p/q' },
    polynomials: { word: 'QUADRATIC', hint: 'Degree-two polynomial' },
    'linear-eq': { word: 'CONSISTENT', hint: 'System with at least one solution' },
    quadratic: { word: 'DISCRIMINANT', hint: 'b squared minus 4ac' },
    ap: { word: 'PROGRESSION', hint: 'Sequence with constant difference' },
    triangles: { word: 'SIMILAR', hint: 'Same shape, proportional sides' },
    trigonometry: { word: 'SINE', hint: 'Opposite over hypotenuse' },
    'electric-charges-fields': { word: 'COULOMB', hint: 'SI unit of charge' },
    'human-eye': { word: 'DISPERSION', hint: 'Splitting of white light in a prism' },
    control: { word: 'REFLEX', hint: 'Automatic rapid response without thinking' },
    reproduction: { word: 'MEIOSIS', hint: 'Cell division forming gametes' },
    heredity: { word: 'CHROMOSOME', hint: 'Thread-like structure carrying genes' },
    'trig-apps': { word: 'ELEVATION', hint: 'Angle looking up at an object' },
    coordinate: { word: 'DISTANCE', hint: 'Length between two coordinate points' },
    'areas-circles': { word: 'SECTOR', hint: 'Pie-shaped part of a circle' },
    'surface-vol': { word: 'HEMISPHERE', hint: 'Half of a sphere' },
    statistics: { word: 'MEDIAN', hint: 'Middle value of ordered data' },
    probability: { word: 'OUTCOME', hint: 'Single result of a random experiment' },
    'chemical-kinetics': { word: 'CATALYST', hint: 'Speeds reaction without being consumed' },
  };

  function pickWord(chapterId, title) {
    if (CHAPTER_WORDS[chapterId]) return { ...CHAPTER_WORDS[chapterId], chapterId };
    const clean = (title || chapterId).replace(/[^a-zA-Z]/g, '').toUpperCase();
    const word = clean.length >= 5 ? clean.slice(0, Math.min(12, clean.length)) : 'STUDY';
    return { word, hint: `Keyword from ${title || chapterId}`, chapterId };
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalizeQ(q) {
    const opts = (q.options || []).map((o) => String(o || '').trim()).filter((o) => o.length > 0);
    const prompt = (q.prompt || q.question || q.text || '').trim();
    let correctIndex = q.correctIndex ?? q.correct_index ?? 0;
    if (correctIndex < 0 || correctIndex >= opts.length) correctIndex = 0;
    return { prompt, options: opts, correctIndex, pool: q.pool || 'mixed' };
  }

  function buildQuestions(ctx, wordPack, limit) {
    const qs = [];
    const filter = ctx.filterQuestions;
    const chapterIds = wordPack.chapterIds || [wordPack.chapterId];
    if (filter) {
      ['easy', 'medium', 'difficult', 'ASKED_BEFORE'].forEach((d) => {
        const batch = filter({ difficulty: d, limit: 4, chapterIds }) || [];
        batch.forEach((raw) => {
          const q = normalizeQ({ ...raw, pool: d });
          if (q.prompt && q.options.length >= 2) qs.push(q);
        });
      });
    }
    const fallbacks = [
      {
        prompt: `Which term best matches this clue: "${wordPack.hint}"?`,
        options: [
          wordPack.word.charAt(0) + wordPack.word.slice(1).toLowerCase(),
          'Velocity',
          'Fraction',
          'Photosynthesis',
        ],
        correctIndex: 0,
        pool: 'easy',
      },
      {
        prompt: `How many letters are in the hidden keyword?`,
        options: [
          String(wordPack.word.replace(/\s/g, '').length),
          String(wordPack.word.length + 2),
          String(Math.max(1, wordPack.word.length - 1)),
          '10',
        ],
        correctIndex: 0,
        pool: 'medium',
      },
      {
        prompt: 'Balanced chemical equations must satisfy which law?',
        options: ['Conservation of mass', 'Conservation of charge only', "Boyle's law", "Snell's law"],
        correctIndex: 0,
        pool: 'hard',
      },
      {
        prompt: `For this chapter, the secret word relates to:`,
        options: [wordPack.hint, 'Random guessing', 'None of the above', 'Skip this round'],
        correctIndex: 0,
        pool: 'easy',
      },
    ].map(normalizeQ);

    const merged = shuffle([...qs, ...fallbacks]);
    const seen = new Set();
    const unique = merged.filter((q) => {
      const key = q.prompt.slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return q.options.length >= 2;
    });
    return unique.slice(0, limit || 10);
  }

  function hangmanSvg() {
    return `<svg class="cbse-hangman-fig" viewBox="0 0 120 140" aria-hidden="true">
      <line x1="10" y1="130" x2="110" y2="130" stroke="currentColor" stroke-width="3"/>
      <line x1="30" y1="130" x2="30" y2="20" stroke="currentColor" stroke-width="3"/>
      <line x1="30" y1="20" x2="80" y2="20" stroke="currentColor" stroke-width="3"/>
      <line x1="80" y1="20" x2="80" y2="35" stroke="currentColor" stroke-width="3"/>
      <circle class="hg-part" data-part="0" cx="80" cy="48" r="12" fill="none" stroke="currentColor" stroke-width="2" opacity="0"/>
      <line class="hg-part" data-part="1" x1="80" y1="60" x2="80" y2="95" stroke="currentColor" stroke-width="2" opacity="0"/>
      <line class="hg-part" data-part="2" x1="80" y1="70" x2="62" y2="85" stroke="currentColor" stroke-width="2" opacity="0"/>
      <line class="hg-part" data-part="3" x1="80" y1="70" x2="98" y2="85" stroke="currentColor" stroke-width="2" opacity="0"/>
      <line class="hg-part" data-part="4" x1="80" y1="95" x2="65" y2="120" stroke="currentColor" stroke-width="2" opacity="0"/>
      <line class="hg-part" data-part="5" x1="80" y1="95" x2="95" y2="120" stroke="currentColor" stroke-width="2" opacity="0"/>
    </svg>`;
  }

  function runRound(host, ctx, wordPack, roundNum, totalRounds, onComplete) {
    const word = wordPack.word.replace(/\s/g, '');
    const revealed = new Set();
    let wrong = 0;
    const maxWrong = 6;
    let qIdx = 0;
    const questions = buildQuestions(ctx, { ...wordPack, word }, 10);

    host.innerHTML = `
      <div class="cbse-hangman-game manjulab-round">
        <header class="cbse-hangman-head">
          <h4>🎯 ${BRAND}</h4>
          <p>Round ${roundNum} / ${totalRounds} · ${wordPack.chapterTitle || wordPack.chapterId || 'Chapter'}</p>
        </header>
        <div class="cbse-hangman-stage">
          ${hangmanSvg()}
          <div class="cbse-hangman-word" id="hgWord"></div>
          <p class="cbse-hangman-hint">💡 ${wordPack.hint}</p>
        </div>
        <div class="cbse-hangman-q" id="hgQuestion"></div>
        <p class="cbse-hangman-status" id="hgStatus"></p>
      </div>`;

    const wordEl = host.querySelector('#hgWord');
    const qEl = host.querySelector('#hgQuestion');
    const statusEl = host.querySelector('#hgStatus');

    function renderWord() {
      wordEl.innerHTML = word
        .split('')
        .map((ch) => {
          const show = revealed.has(ch) ? ch : '_';
          return `<span class="hg-letter${revealed.has(ch) ? ' on' : ''}">${show}</span>`;
        })
        .join('');
    }

    function revealRandomLetter() {
      const hidden = word.split('').filter((c) => !revealed.has(c));
      if (!hidden.length) return;
      revealed.add(hidden[Math.floor(Math.random() * hidden.length)]);
      renderWord();
    }

    function drawPart() {
      host.querySelectorAll(`.hg-part[data-part="${wrong - 1}"]`).forEach((el) => {
        el.setAttribute('opacity', '1');
      });
    }

    function checkWin() {
      return word.split('').every((c) => revealed.has(c));
    }

    function finishRound(won) {
      setTimeout(() => onComplete(won), won ? 1200 : 1800);
    }

    function showQuestion() {
      const q = questions[qIdx];
      if (!q) {
        qEl.innerHTML = '<p class="cbse-hangman-done">No more questions in this round.</p>';
        return;
      }
      const opts = q.options || [];
      if (!q.prompt || opts.length < 2) {
        qIdx += 1;
        showQuestion();
        return;
      }
      qEl.innerHTML = `
        <p class="hg-q-pool">${String(q.pool || 'mixed').replace(/_/g, ' ')}</p>
        <p class="hg-q-text">${q.prompt}</p>
        <div class="hg-opts">${opts
          .slice(0, 4)
          .map(
            (o, i) =>
              `<button type="button" class="quiz-option hg-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`
          )
          .join('')}</div>`;
      qEl.querySelectorAll('.hg-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          const correct = q.correctIndex === i;
          if (correct) {
            revealRandomLetter();
            statusEl.textContent = '✓ Correct — letter revealed!';
            statusEl.className = 'cbse-hangman-status ok';
          } else {
            wrong += 1;
            drawPart();
            statusEl.textContent = '✗ Wrong answer…';
            statusEl.className = 'cbse-hangman-status bad';
          }
          qIdx += 1;
          if (checkWin()) {
            qEl.innerHTML = '<p class="cbse-hangman-win">🎉 Word decoded!</p>';
            finishRound(true);
            return;
          }
          if (wrong >= maxWrong) {
            qEl.innerHTML = `<p class="cbse-hangman-lose">Word was: <strong>${word}</strong></p>`;
            word.split('').forEach((c) => revealed.add(c));
            renderWord();
            finishRound(false);
            return;
          }
          setTimeout(showQuestion, 500);
        });
      });
    }

    renderWord();
    showQuestion();
  }

  function renderLauncher(host, ctx) {
    const chapters = ctx.listChapters?.() || [{ id: ctx.chapterId, title: ctx.chapterTitle }];
    host.innerHTML = `
      <div class="manjulab-launcher">
        <header class="manjulab-brand">
          <span class="manjulab-logo">🧪</span>
          <div>
            <h3>${BRAND}</h3>
            <p>Decode chapter keywords · MCQs reveal letters · wrong answers draw the figure</p>
          </div>
        </header>
        <label class="manjulab-whole-subject">
          <input type="checkbox" id="whWholeSubject" checked />
          <strong>Entire subject</strong> — all ${chapters.length} chapters in ${ctx.subjectLabel || ctx.subjectId}
        </label>
        <div class="manjulab-chapter-pick hidden" id="whChapterPick">
          <p class="manjulab-pick-lead">Select one or more chapters:</p>
          <div class="manjulab-ch-grid" id="whChGrid"></div>
          <button type="button" class="btn-portal btn-portal-ghost btn-wh-all" id="whSelectAll">Select all</button>
        </div>
        <button type="button" class="btn-portal btn-portal-primary manjulab-start" id="whStart">Start WordHunter</button>
      </div>`;

    const whole = host.querySelector('#whWholeSubject');
    const pick = host.querySelector('#whChapterPick');
    const grid = host.querySelector('#whChGrid');

    chapters.forEach((ch) => {
      const lbl = document.createElement('label');
      lbl.className = 'manjulab-ch-chip';
      lbl.innerHTML = `<input type="checkbox" value="${ch.id}" checked /> ${ch.title}`;
      grid.appendChild(lbl);
    });

    whole.addEventListener('change', () => {
      pick.classList.toggle('hidden', whole.checked);
    });
    pick.classList.toggle('hidden', whole.checked);

    host.querySelector('#whSelectAll')?.addEventListener('click', () => {
      grid.querySelectorAll('input').forEach((cb) => {
        cb.checked = true;
      });
    });

    host.querySelector('#whStart')?.addEventListener('click', () => {
      let selected = chapters.map((c) => c.id);
      if (!whole.checked) {
        selected = [...grid.querySelectorAll('input:checked')].map((cb) => cb.value);
        if (!selected.length) {
          alert('Pick at least one chapter, or use Entire subject.');
          return;
        }
      }
      startGame(host, ctx, selected, chapters);
    });
  }

  function startGame(host, ctx, chapterIds, allChapters) {
    const rounds = shuffle(
      chapterIds.map((id) => {
        const meta = allChapters.find((c) => c.id === id) || {};
        return pickWord(id, meta.title);
      })
    ).slice(0, Math.min(8, chapterIds.length));

    rounds.forEach((r) => {
      const meta = allChapters.find((c) => c.id === r.chapterId);
      r.chapterTitle = meta?.title;
      r.chapterIds = chapterIds;
    });

    let wins = 0;
    let idx = 0;

    function nextRound() {
      if (idx >= rounds.length) {
        host.innerHTML = `
          <div class="manjulab-summary">
            <h3>${BRAND} · Session complete</h3>
            <p class="manjulab-score">You decoded <strong>${wins}</strong> of <strong>${rounds.length}</strong> words.</p>
            <button type="button" class="btn-portal btn-portal-primary" id="whPlayAgain">Play again</button>
          </div>`;
        host.querySelector('#whPlayAgain')?.addEventListener('click', () => renderLauncher(host, ctx));
        return;
      }
      runRound(host, ctx, rounds[idx], idx + 1, rounds.length, (won) => {
        if (won) wins += 1;
        idx += 1;
        nextRound();
      });
    }

    nextRound();
  }

  function mountQuizTab(host, ctx) {
    if (!host) return;
    renderLauncher(host, ctx);
  }

  /** @deprecated use mountQuizTab */
  function mount(host, ctx) {
    mountQuizTab(host, ctx);
  }

  global.ManjuLABWordHunter = { mountQuizTab, mount, pickWord, BRAND };
  global.CBSEHangmanQuiz = global.ManjuLABWordHunter;
})(typeof window !== 'undefined' ? window : globalThis);
