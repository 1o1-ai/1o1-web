/**
 * Word Hunt — hangman-style MCQ game (easy / medium / hard mix).
 */
(function (global) {
  'use strict';

  const CHAPTER_WORDS = {
    'chem-reactions': { word: 'REACTION', hint: 'Chemical change forming new substances' },
    'acids-bases': { word: 'NEUTRAL', hint: 'pH equals 7' },
    'metals': { word: 'CORRODE', hint: 'Iron rusts when it ___s' },
    'carbon': { word: 'COVALENT', hint: 'Carbon shares electrons' },
    life: { word: 'PHOTOSYNTHESIS', hint: 'Plants make food using sunlight' },
    light: { word: 'REFRACTION', hint: 'Bending of light at boundary' },
    electricity: { word: 'RESISTANCE', hint: "Opposes current (Ohm's law)" },
    'real-numbers': { word: 'IRRATIONAL', hint: 'Cannot be written as p/q' },
    polynomials: { word: 'QUADRATIC', hint: 'Degree-two polynomial' },
    trigonometry: { word: 'SINE', hint: 'Opposite over hypotenuse' },
    'electric-charges-fields': { word: 'COULOMB', hint: 'Unit of electric charge' },
    'chemical-kinetics': { word: 'CATALYST', hint: 'Speeds reaction without being consumed' },
    electrostatics: { word: 'POTENTIAL', hint: 'Work per unit charge' },
  };

  function pickWord(chapterId, title) {
    if (CHAPTER_WORDS[chapterId]) return CHAPTER_WORDS[chapterId];
    const clean = (title || chapterId).replace(/[^a-zA-Z]/g, '').toUpperCase();
    const word = clean.length >= 5 ? clean.slice(0, Math.min(12, clean.length)) : 'STUDY';
    return { word, hint: `Keyword from ${title || chapterId}` };
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQuestions(ctx, word) {
    const qs = [];
    const filter = ctx.filterQuestions;
    if (filter) {
      ['easy', 'medium', 'difficult', 'ASKED_BEFORE'].forEach((d) => {
        const batch = filter({ difficulty: d, limit: 2 });
        batch.forEach((q) => qs.push({ ...q, pool: d }));
      });
    }
    if (qs.length < 3) {
      qs.push(
        {
          question: `Which term fits: "${word.hint}"?`,
          options: [word.word.charAt(0) + word.word.slice(1).toLowerCase(), 'Velocity', 'Photosynthesis', 'Fraction'],
          correct_index: 0,
          pool: 'easy',
        },
        {
          question: `How many letters are in the chapter keyword (${word.word.length} letters)?`,
          options: [String(word.word.length), String(word.word.length + 1), String(word.word.length - 1), '10'],
          correct_index: 0,
          pool: 'medium',
        },
        {
          question: 'A balanced chemical equation satisfies which law?',
          options: ['Conservation of mass', 'Conservation of charge only', 'Boyles law', 'Snells law'],
          correct_index: 0,
          pool: 'hard',
        }
      );
    }
    return shuffle(qs).slice(0, 8);
  }

  function mount(host, ctx) {
    if (!host) return;
    const { word, hint } = pickWord(ctx.chapterId, ctx.chapterTitle);
    const revealed = new Set();
    let wrong = 0;
    const maxWrong = 6;
    let qIdx = 0;
    const questions = buildQuestions(ctx, { word, hint });

    host.innerHTML = `
      <div class="cbse-hangman-game">
        <header class="cbse-hangman-head">
          <h4>🎯 Word Hunt</h4>
          <p>Answer MCQs to reveal letters · wrong answers draw the figure</p>
        </header>
        <div class="cbse-hangman-stage">
          <svg class="cbse-hangman-fig" viewBox="0 0 120 140" aria-hidden="true">
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
          </svg>
          <div class="cbse-hangman-word" id="hgWord"></div>
          <p class="cbse-hangman-hint">💡 ${hint}</p>
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
          if (ch === ' ') return '<span class="hg-space">&nbsp;</span>';
          const show = revealed.has(ch) ? ch : '_';
          return `<span class="hg-letter${revealed.has(ch) ? ' on' : ''}">${show}</span>`;
        })
        .join('');
    }

    function revealRandomLetter() {
      const hidden = word.split('').filter((c) => c !== ' ' && !revealed.has(c));
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
      return word.split('').every((c) => c === ' ' || revealed.has(c));
    }

    function showQuestion() {
      const q = questions[qIdx];
      if (!q) {
        qEl.innerHTML = '<p class="cbse-hangman-done">No more questions — keep guessing or you win!</p>';
        return;
      }
      const opts = q.options || [];
      qEl.innerHTML = `
        <p class="hg-q-pool">${q.pool || 'mixed'}</p>
        <p class="hg-q-text">${q.question}</p>
        <div class="hg-opts">${opts
          .map(
            (o, i) =>
              `<button type="button" class="quiz-option hg-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`
          )
          .join('')}</div>`;
      qEl.querySelectorAll('.hg-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          const correct = q.correct_index === i || q.correctIndex === i;
          if (correct) {
            revealRandomLetter();
            statusEl.textContent = '✓ Correct — letter revealed!';
            statusEl.className = 'cbse-hangman-status ok';
          } else {
            wrong += 1;
            drawPart();
            statusEl.textContent = '✗ Wrong — figure grows closer…';
            statusEl.className = 'cbse-hangman-status bad';
          }
          qIdx += 1;
          if (checkWin()) {
            qEl.innerHTML = '<p class="cbse-hangman-win">🎉 You decoded the chapter word!</p>';
            statusEl.textContent = 'Chapter mastered — try Q & A Practice next.';
            return;
          }
          if (wrong >= maxWrong) {
            qEl.innerHTML = `<p class="cbse-hangman-lose">Word was: <strong>${word}</strong></p>`;
            word.split('').forEach((c) => revealed.add(c));
            renderWord();
            return;
          }
          setTimeout(showQuestion, 600);
        });
      });
    }

    renderWord();
    showQuestion();
  }

  global.CBSEHangmanQuiz = { mount, pickWord };
})(typeof window !== 'undefined' ? window : globalThis);
