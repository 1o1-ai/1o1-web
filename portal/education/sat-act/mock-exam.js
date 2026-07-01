(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const track = (params.get('track') || 'sat').toLowerCase();
  let section = (params.get('section') || 'math').toLowerCase();
  const mode = params.get('mode') || 'section';

  const redirect = window.SatActShared?.redirectNonMathMock?.(track, section, mode);
  if (redirect && redirect !== location.pathname + location.search) {
    location.replace(redirect);
    return;
  }

  document.body.dataset.track = track;

  const specs = window.SatActShared?.SECTION_SPECS?.[track] || {};
  const fullSpec = window.SatActShared?.FULL_MOCK_SPECS?.[track];
  let sectionKey = section;
  if (track === 'sat' && (section === 'rw' || section === 'reading_writing' || section === 'sat-rw')) {
    sectionKey = 'math';
  } else if (track === 'sat' && section === 'math') {
    sectionKey = 'math';
  } else if (track === 'act' && ['english', 'reading', 'science'].includes(section)) {
    sectionKey = 'math';
  } else if (track === 'act' && section === 'math') {
    sectionKey = 'math';
  }

  const sectionSpec = specs[sectionKey] || specs.math;
  let remaining = sectionSpec?.durationSec || 45 * 60;
  let pasteCount = 0;
  let blurCount = 0;
  let focusScore = 100;
  let timerId = null;
  let questions = [];
  const answers = {};
  let currentSectionIndex = 0;
  let sectionResults = [];

  const clockEl = document.getElementById('mockClock');
  const clockLabel = document.getElementById('clockLabel');
  const paperShell = document.getElementById('paperShell');
  const mockQuestions = document.getElementById('mockQuestions');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function renderClock() {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    clockEl.textContent = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    if (remaining <= 300) clockEl.classList.add('urgent');
  }

  function tick() {
    remaining--;
    renderClock();
    if (remaining <= 0) submitSection(true);
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

  function renderOfficialHeader() {
    const isSat = track === 'sat';
    const brandClass = isSat ? 'sat' : 'act';
    const brandName = isSat ? 'The SAT · College Board' : 'ACT® · Official Practice';
    const modules = sectionSpec.modules || [];
    let moduleRows = '';
    if (modules.length) {
      moduleRows = modules
        .map(
          (m) =>
            `<tr><td>${m.label}</td><td>${m.minutes} min</td><td>${m.questions} questions</td><td>${m.calculator ? 'Calculator allowed' : '—'}</td></tr>`
        )
        .join('');
    }

    const sectionRows =
      mode === 'full' && fullSpec
        ? fullSpec.sections
            .map((sk) => {
              const sp = specs[sk];
              const active = sk === sectionKey ? ' class="active-row"' : '';
              return `<tr${active}><td>${sp?.label || sk}</td><td>${Math.floor((sp?.durationSec || 0) / 60)} min</td><td>${sp?.officialQuestions || '—'} Q</td><td>${sp?.scoring || ''}</td></tr>`;
            })
            .join('')
        : `<tr class="active-row"><td>${sectionSpec.label}</td><td>${Math.floor(sectionSpec.durationSec / 60)} min</td><td>${sectionSpec.officialQuestions} Q</td><td>${sectionSpec.scoring}</td></tr>`;

    paperShell.innerHTML = `
      <div class="mock-paper-official">
        <div class="mock-paper-brand ${brandClass}">
          <div>
            <div class="brand-title">${sectionSpec.label}</div>
            <div class="brand-badge">${sectionSpec.booklet || brandName}</div>
          </div>
          <div style="text-align:right;font-size:0.75rem;color:#64748b">
            ${mode === 'full' ? fullSpec.label + ' · Section ' + (currentSectionIndex + 1) + ' of ' + fullSpec.sections.length : 'Section mock'}
          </div>
        </div>
        <table class="mock-section-table">
          <thead><tr><th>Section</th><th>Time</th><th>Questions</th><th>Scoring</th></tr></thead>
          <tbody>${sectionRows}</tbody>
        </table>
        ${moduleRows ? `<table class="mock-section-table"><thead><tr><th>Module</th><th>Time</th><th>Items</th><th>Notes</th></tr></thead><tbody>${moduleRows}</tbody></table>` : ''}
        <p class="mock-instructions">${sectionSpec.instructions || ''}</p>
        <p style="font-size:0.75rem;color:#94a3b8;margin:0">
          Using verified items from ingested official PDFs where available.
          ${questions.length < sectionSpec.officialQuestions ? `Showing ${questions.length} of ${sectionSpec.officialQuestions} official items — bank expanding via crawler.` : ''}
        </p>
      </div>`;
    document.title = `${sectionSpec.label} · Mock · ${isSat ? 'SAT' : 'ACT'}`;
    clockLabel.textContent = `${sectionSpec.label} · time remaining`;
  }

  function optionLabel(q, j) {
    if (track === 'act' && q.optionLabels?.length) {
      return q.optionLabels[j] || String.fromCharCode(65 + j);
    }
    return String.fromCharCode(65 + j);
  }

  function renderPassage(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.className = 'mock-passage-block';
    div.innerHTML = `<h4>Passage</h4><p>${String(text).replace(/\n/g, '<br>')}</p>`;
    return div;
  }

  function renderQuestions() {
    mockQuestions.innerHTML = '';
    let lastPassage = '';
    const modules = sectionSpec.modules || [];
    const perModule = modules.length
      ? Math.ceil(questions.length / modules.length)
      : questions.length;

    questions.forEach((q, i) => {
      if (modules.length && i > 0 && i % perModule === 0) {
        const modIdx = Math.floor(i / perModule);
        const mod = modules[modIdx];
        if (mod) {
          const div = document.createElement('div');
          div.className = 'mock-module-divider';
          div.textContent = `${mod.label} · ${mod.minutes} minutes · ${mod.questions} questions`;
          mockQuestions.appendChild(div);
        }
      }

      const block = document.createElement('div');
      block.className = 'mock-q-block';
      const qNum = q.questionNumber || i + 1;
      block.innerHTML = `<p class="mock-q-num">Question ${qNum} <span class="verified-tag">Official · verified</span></p>`;

      if (q.passageContext && q.passageContext !== lastPassage) {
        block.appendChild(renderPassage(q.passageContext));
        lastPassage = q.passageContext;
      }

      const prompt = document.createElement('p');
      prompt.className = 'mock-q-prompt';
      prompt.textContent = q.prompt;
      block.appendChild(prompt);

      const opts = document.createElement('div');
      opts.className = 'mock-q-opts';
      q.options.forEach((opt, j) => {
        const lbl = document.createElement('label');
        lbl.className = 'mock-opt';
        const letter = optionLabel(q, j);
        lbl.innerHTML = `<input type="radio" name="q${i}" value="${j}" /> <span class="option-label-act">${letter}.</span> ${opt}`;
        lbl.querySelector('input').addEventListener('change', () => {
          answers[i] = j;
        });
        opts.appendChild(lbl);
      });
      block.appendChild(opts);
      mockQuestions.appendChild(block);
    });
  }

  function estimateActScaled(raw, maxRaw) {
    const pct = raw / Math.max(maxRaw, 1);
    return Math.max(1, Math.min(36, Math.round(1 + pct * 35)));
  }

  function submitSection(auto) {
    clearInterval(timerId);
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });
    const usedMin = Math.round((sectionSpec.durationSec - remaining) / 60);
    sectionResults.push({
      section: sectionKey,
      label: sectionSpec.label,
      score,
      total: questions.length,
      usedMin,
    });

    if (mode === 'full' && fullSpec && currentSectionIndex < fullSpec.sections.length - 1) {
      showSectionTransition(auto);
      return;
    }

    showFinalReport(auto);
  }

  function showSectionTransition(auto) {
    const report = document.getElementById('mockReport');
    report.hidden = false;
    const last = sectionResults[sectionResults.length - 1];
    report.innerHTML = `
      <h2>Section submitted${auto ? ' (time up)' : ''}</h2>
      <p><strong>${last.label}</strong>: ${last.score}/${last.total} raw · ${last.usedMin} min used</p>
      <p class="sr-eval-hint">${fullSpec.breakMinutes || 10}-minute break recommended before next section (simulated — click continue when ready).</p>
      <button type="button" class="btn-portal btn-portal-primary" id="btnNextSection">Continue to next section →</button>`;
    document.getElementById('btnSubmitMock').disabled = true;
    document.getElementById('btnNextSection')?.addEventListener('click', startNextSection);
  }

  function startNextSection() {
    currentSectionIndex++;
    sectionKey = fullSpec.sections[currentSectionIndex];
    const nextSpec = specs[sectionKey];
    Object.assign(sectionSpec, nextSpec);
    remaining = nextSpec.durationSec;
    document.getElementById('mockReport').hidden = true;
    document.getElementById('btnSubmitMock').disabled = false;
    loadSectionQuestions();
    clearInterval(timerId);
    timerId = setInterval(tick, 1000);
    renderClock();
  }

  function showFinalReport(auto) {
    const report = document.getElementById('mockReport');
    report.hidden = false;
    let breakdown = sectionResults
      .map(
        (r) =>
          `<div class="mock-score-card"><strong>${r.score}/${r.total}</strong><small>${r.label}<br>Raw · ${r.usedMin} min</small></div>`
      )
      .join('');

    let compositeNote = '';
    if (track === 'act' && sectionResults.length) {
      const math = sectionResults.find((r) => r.section === 'math');
      if (math) {
        const est = estimateActScaled(math.score, 60);
        compositeNote = `<p>ACT Math estimated scaled: <strong>${est}</strong>/36 (approximate from raw ${math.score}/60)</p>`;
      }
    }

    report.innerHTML = `
      <h2>Mock submitted${auto ? ' (time up)' : ''}</h2>
      <div class="mock-score-breakdown">${breakdown}</div>
      ${compositeNote}
      <p>Concentration: ${focusScore}% · Paste events: ${pasteCount} · Tab away: ${blurCount}</p>
      <p class="sr-eval-hint">Review missed items in Study Room → Evaluate, then discuss in the Forum.</p>
      <a href="practice.html" class="btn-portal btn-portal-ghost">Back to R&amp;W practice</a>
      <a href="room.html" class="btn-portal btn-portal-primary" style="margin-left:8px">Study room</a>`;
    document.getElementById('btnSubmitMock').disabled = true;
  }

  document.getElementById('btnSubmitMock').addEventListener('click', () => submitSection(false));

  function loadSectionQuestions() {
    const target = sectionSpec.officialQuestions || 40;
    return window.SatActShared.loadVerifiedBank().then((bank) => {
      questions = window.SatActShared.filterQuestions(bank, {
        track,
        section: sectionKey === 'reading_writing' ? 'reading_writing' : sectionKey,
        limit: target,
      });
      if (!questions.length && track === 'act' && sectionKey === 'english') {
        questions = window.SatActShared.filterQuestions(bank, { track: 'act', section: 'english', limit: target });
      }
      renderOfficialHeader();
      renderQuestions();
    });
  }

  loadSectionQuestions()
    .then(() => {
      if (!questions.length) {
        mockQuestions.innerHTML =
          '<p class="sr-eval-hint">No verified math items for this section yet. Check back after the next ingest.</p>';
      }
      timerId = setInterval(tick, 1000);
      renderClock();
    })
    .catch((err) => {
      mockQuestions.innerHTML = `<p class="sr-eval-hint">Could not load question bank: ${err.message}</p>`;
    });
})();
