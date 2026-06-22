(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const subject = params.get('subject') || 'mathematics';
  const mode = params.get('mode') || 'authentic';
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
  const paperMeta = document.getElementById('paperMeta');
  const mockQuestions = document.getElementById('mockQuestions');

  const isAuthentic = mode === 'authentic';
  paperTitle.textContent =
    subject === 'science' ? 'CBSE Class X · Science (086)' : 'CBSE Class X · Mathematics Standard (041)';
  paperMeta.textContent = isAuthentic
    ? 'Section A · Authentic CBSE-X MCQs from master catalog (board-tagged only)'
    : 'Section A · Open explore MCQs (includes procedural / AI-generated — see disclaimer)';

  if (!isAuthentic) {
    const note = document.createElement('p');
    note.className = 'sr-disclaimer';
    note.style.margin = '12px 0';
    note.textContent =
      'Disclaimer: This open mock may include questions outside strict CBSE-X scope. Use it to widen understanding; authentic mocks match board tagging.';
    mockQuestions.parentNode.insertBefore(note, mockQuestions);
  }

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

  function renderDiagram(container, q) {
    if (q.diagramVector && window.CBSE10DiagramVector) {
      window.CBSE10DiagramVector.renderDiagramVector(q.diagramVector, container);
    } else if (q.figure_url) {
      const img = document.createElement('img');
      img.src = q.figure_url;
      img.alt = 'Figure';
      img.style.maxWidth = '100%';
      container.appendChild(img);
    }
  }

  function renderQuestions() {
    mockQuestions.innerHTML = '';
    questions.forEach((q, i) => {
      const div = document.createElement('div');
      div.className = 'mock-q-block';
      div.innerHTML = `<p class="mock-q-num">Q${i + 1}. <span class="verified-tag">${isAuthentic ? 'CBSE' : 'Open'} · ${q.marks || 1} mark</span></p>
        <div class="mock-q-diagram"></div>
        <p class="mock-q-prompt">${q.prompt}</p><div class="mock-q-opts" data-qi="${i}"></div>`;
      renderDiagram(div.querySelector('.mock-q-diagram'), q);
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
      <p>Mode: ${isAuthentic ? 'Authentic CBSE-X' : 'Open explore'}</p>
      <p>Time used: ${usedMin} min · Concentration: ${focusScore}%</p>
      <a href="room.html" class="btn-portal btn-portal-ghost">Back to study room</a>`;
    document.getElementById('btnSubmitMock').disabled = true;
  }

  document.getElementById('btnSubmitMock').addEventListener('click', () => submitMock(false));

  function hasPlayableMcq(q) {
    const opts = (q.options || [])
      .map((o) => String(o || '').trim())
      .filter((o) => o.length > 1);
    return opts.length >= 2 && window.CBSE10Shared.resolveCorrectIndex(q, opts) != null;
  }

  function mcqPool(questions, filters) {
    return window.CBSE10Shared.filterMasterQuestions(questions, filters).filter(hasPlayableMcq);
  }

  Promise.all([window.CBSE10Shared.loadMasterCatalog(), window.CBSE10Shared.loadVerifiedBank()]).then(
    ([master, bank]) => {
      const catalog = master?.questions || [];
      const verifiedMcqs = bank.filter((q) => q.options?.length && (q.answer_verified || q.correctIndex != null));
      const sources = verifiedMcqs.length ? verifiedMcqs : catalog;

      let pool = [];
      if (isAuthentic) {
        pool = mcqPool([...verifiedMcqs, ...catalog], {
          subject,
          mode: 'cbse',
          type: 'MCQ',
          limit: 200,
        });
      }
      if (pool.length < 5) {
        pool = mcqPool(sources, {
          subject,
          mode: 'ai',
          type: 'MCQ',
          limit: 200,
        });
      }
      if (pool.length < 5) {
        pool = mcqPool(catalog, { subject, type: 'MCQ', limit: 200 });
      }

      const shuffled = pool.sort(() => Math.random() - 0.5);
      questions = shuffled.slice(0, 20).map(window.CBSE10Shared.toDisplayQ);
      if (questions.length < 5) {
        mockQuestions.innerHTML = `<p>Not enough MCQs for this mock (${mode}). Try the other mode or subject.</p>`;
        return;
      }
      renderQuestions();
      renderClock();
      timerId = setInterval(tick, 1000);
    }
  );
})();
