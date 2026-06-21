(function () {
  const params = new URLSearchParams(location.search);
  const subject = params.get('subject') || 'mathematics';
  const DURATION_SEC = 3 * 60 * 60;
  let remaining = DURATION_SEC;
  let pasteCount = 0;
  let blurCount = 0;
  let focusScore = 100;
  let timerId = null;
  let questions = [];
  const answers = {};

  const clockEl = document.getElementById('mockClock');
  const paperTitle = document.getElementById('paperTitle');
  const mockQuestions = document.getElementById('mockQuestions');

  paperTitle.textContent =
    subject === 'science' ? 'CBSE Class X · Science (086)' : 'CBSE Class X · Mathematics Standard (041)';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function renderClock() {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    clockEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    if (remaining <= 600) clockEl.classList.add('urgent');
  }

  function tick() {
    remaining--;
    renderClock();
    if (remaining <= 0) submitMock(true);
  }

  function updateIntegrity() {
    document.getElementById('pasteCount').textContent = pasteCount;
    document.getElementById('blurCount').textContent = blurCount;
    focusScore = Math.max(0, 100 - pasteCount * 8 - blurCount * 3);
    document.getElementById('focusScore').textContent = focusScore;
  }

  document.addEventListener('paste', () => {
    pasteCount++;
    updateIntegrity();
  });
  document.addEventListener('copy', () => {
    pasteCount++;
    updateIntegrity();
  });
  window.addEventListener('blur', () => {
    blurCount++;
    updateIntegrity();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      blurCount++;
      updateIntegrity();
    }
  });

  function renderQuestions() {
    mockQuestions.innerHTML = '';
    questions.forEach((q, i) => {
      const div = document.createElement('div');
      div.className = 'mock-q-block';
      const fig = q.hasFigure
        ? `<p class="figure-badge">📐 Figure/diagram item · Paper: ${q.paper_pair_id || 'board'} — image from original PDF not yet embedded in portal</p>`
        : '';
      div.innerHTML = `<p class="mock-q-num">Q${i + 1}. <span class="verified-tag">verified ${q.exam_year || ''}</span></p>
        ${fig}<p class="mock-q-prompt">${q.prompt}</p><div class="mock-q-opts" data-qi="${i}"></div>`;
      const opts = div.querySelector('.mock-q-opts');
      q.options.forEach((opt, j) => {
        const lbl = document.createElement('label');
        lbl.className = 'mock-opt';
        lbl.innerHTML = `<input type="radio" name="q${i}" value="${j}" /> ${String.fromCharCode(65 + j)}. ${opt}`;
        lbl.querySelector('input').addEventListener('change', () => {
          answers[i] = j;
        });
        opts.appendChild(lbl);
      });
      mockQuestions.appendChild(div);
    });
  }

  function submitMock(auto) {
    clearInterval(timerId);
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });
    const usedMin = Math.round((DURATION_SEC - remaining) / 60);
    const report = document.getElementById('mockReport');
    report.hidden = false;
    report.innerHTML = `
      <h2>Mock submitted${auto ? ' (time up)' : ''}</h2>
      <p>Section A score: <strong>${score}/${questions.length}</strong></p>
      <p>Time used: ${usedMin} min · Concentration score: ${focusScore}%</p>
      <p>Paste/copy events: ${pasteCount} · Tab/window switches: ${blurCount}</p>
      <p class="hint">Full subjective Sections B–E require scanned paper UI — MCQ section uses verified bank only.</p>
      <a href="practice.html" class="btn-portal btn-portal-ghost">Back to practice</a>`;
    document.getElementById('btnSubmitMock').disabled = true;
  }

  document.getElementById('btnSubmitMock').addEventListener('click', () => submitMock(false));

  window.CBSE10Shared.loadVerifiedBank().then((bank) => {
    const mcqs = window.CBSE10Shared.filterBank(bank, { subject, yearsBack: 3, limit: 20 });
    const withFig = mcqs.filter((q) => window.CBSE10Shared.hasFigure(q));
    const without = mcqs.filter((q) => !window.CBSE10Shared.hasFigure(q));
    const mix = [];
    let fi = 0;
    let wi = 0;
    while (mix.length < 20 && (fi < withFig.length || wi < without.length)) {
      if (fi < withFig.length && (mix.length % 4 === 0 || wi >= without.length)) mix.push(withFig[fi++]);
      else if (wi < without.length) mix.push(without[wi++]);
      else if (fi < withFig.length) mix.push(withFig[fi++]);
    }
    questions = mix.map(window.CBSE10Shared.toDisplayQ);
    if (questions.length < 5) {
      mockQuestions.innerHTML = '<p>Not enough verified MCQs in bank for this mock. Ingest more papers.</p>';
      return;
    }
    renderQuestions();
    renderClock();
    timerId = setInterval(tick, 1000);
  });
})();
