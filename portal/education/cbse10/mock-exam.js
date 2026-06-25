(function (global) {
  'use strict';

  const params = new URLSearchParams(location.search);
  const sku = document.body.dataset.sku || params.get('sku') || 'cbse10';
  const subject = params.get('subject') || (sku === 'cbse12-science' ? 'physics' : 'mathematics');
  const mode = params.get('mode') || 'authentic';
  const isAuthentic = mode === 'authentic';
  const DURATION_SEC = 3 * 60 * 60;

  const paper = global.CBSEExamSchema.getPaper(sku, subject);
  if (!paper) {
    document.getElementById('mockSections').innerHTML =
      '<p>Unknown subject. <a href="exam-center.html">Back to Exam Center</a></p>';
    return;
  }

  const expectedQuestionCount = paper.sections.reduce((n, s) => n + s.count, 0);

  let remaining = DURATION_SEC;
  let pasteCount = 0;
  let blurCount = 0;
  let focusScore = 100;
  let timerId = null;
  const paperQuestions = [];
  const answers = {};
  const composers = {};

  const clockEl = document.getElementById('mockClock');
  const sectionsEl = document.getElementById('mockSections');

  function subjectKey(s) {
    const x = (s || '').toLowerCase();
    if (x === 'math' || x === 'maths') return 'mathematics';
    if (x === 'sci') return 'science';
    return x;
  }

  function filterBySubject(pool, subj) {
    const key = subjectKey(subj);
    return pool.filter((q) => subjectKey(q.subject || q.subject_id) === key);
  }

  function renderBoardHeader(approvedCount) {
    document.getElementById('boardHeader').innerHTML = `
      <div class="board-name">Central Board of Secondary Education</div>
      <div class="paper-title">${paper.classLabel} · ${paper.title} (${paper.code})</div>
      <div class="paper-meta">Sample Question Paper · ${paper.durationHours} Hours · Maximum Marks: ${paper.totalMarks}</div>`;

    document.getElementById('marksBox').innerHTML = `
      <div><strong>Time Allowed:</strong> ${paper.durationHours} Hours</div>
      <div><strong>Maximum Marks:</strong> ${paper.totalMarks}</div>
      <div><strong>Subject Code:</strong> ${paper.code}</div>
      <div><strong>Passing:</strong> ${paper.passingPercent}% (theory)</div>`;

    const sectionSummary = paper.sections
      .map(
        (s) =>
          `<li><strong>${s.label}</strong> — ${s.instruction} (${s.count} × ${s.marksEach} = ${s.count * s.marksEach} marks)</li>`
      )
      .join('');

    const approvedNote = '';

    document.getElementById('instructions').innerHTML = `
      <strong>General Instructions:</strong>
      <ol>
        <li>All questions are compulsory.</li>
        <li>Read each question carefully before answering.</li>
        <li>${paper.note}</li>
        <li>Internal assessment / practical marks are not included in this mock.</li>
        ${approvedNote}
      </ol>
      <strong>Mark distribution:</strong><ul style="margin:8px 0 0 18px">${sectionSummary}</ul>`;
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

  function hasPlayableMcq(q) {
    if (global.CBSE10Shared?.isProceduralPlaceholderMcq?.(q)) return false;
    const opts = (q.options || []).map((o) => String(o || '').trim()).filter((o) => o.length > 1);
    return opts.length >= 2 && global.CBSE10Shared?.resolveCorrectIndex(q, opts) != null;
  }

  function normalizeBankRow(q) {
    const prompt = q.prompt || q.text || q.question || '';
    return {
      ...q,
      prompt,
      marks: q.marks ?? q.mark ?? 1,
      subject: (q.subject || q.subject_id || '').toLowerCase(),
    };
  }

  function sectionRequiresPlayableMcq(section) {
    return section.id === 'A' && sku === 'cbse10';
  }

  function questionKey(q, suffix) {
    return String(q.id || q.prompt || q.question || 'q') + (suffix || '');
  }

  function toDisplayQ(q, section) {
    const approved = q.approved === true;
    const base = global.CBSE10Shared
      ? global.CBSE10Shared.toDisplayQ(q)
      : {
          prompt: global.AnyoQuestionFormat?.cleanQuestionText
            ? global.AnyoQuestionFormat.cleanQuestionText(q.question || q.prompt || '')
            : String(q.question || q.prompt || ''),
          options: (q.options || []).map((o) =>
            global.AnyoQuestionFormat?.cleanQuestionText ? global.AnyoQuestionFormat.cleanQuestionText(o) : o
          ),
          correctIndex: q.correctIndex,
          diagramVector: q.diagramVector,
          figure_url: q.figure_url,
        };
    base.marks = approved ? q.marks || section.marksEach : section.marksEach;
    base.approved = approved;
    base.chapterId = q.chapterId;
    if (section.id !== 'A') {
      base.options = [];
    } else if (!base.options?.length) {
      base.options = [];
    }
    return base;
  }

  /** Fill every section to schema count; Class X Section A = MCQs; Class XII Section A = 1-mark competency items. */
  function pickForSection(pool, section, used, opts) {
    opts = opts || {};
    const picked = [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const requireMcq = sectionRequiresPlayableMcq(section) && !opts.allowConstructed;

    function take(q, suffix) {
      const key = questionKey(q, suffix);
      if (used.has(key)) return false;
      if (requireMcq && !hasPlayableMcq(q)) return false;
      if (section.id === 'A' && sku === 'cbse12-science') {
        const marks = q.marks || q.mark || 1;
        if (marks !== 1) return false;
      }
      picked.push({ raw: q, suffix });
      used.add(key);
      return true;
    }

    for (const q of shuffled) {
      if (picked.length >= section.count) break;
      if (requireMcq) take(q, '');
      else {
        const marks = q.marks || q.mark || 1;
        if (q.approved && marks === section.marksEach) take(q, '');
        else if (Math.abs(marks - section.marksEach) <= 1 || section.marksEach <= 2) take(q, '');
      }
    }

    if (!requireMcq) {
      for (const q of shuffled) {
        if (picked.length >= section.count) break;
        take(q, '');
      }
    }

    let attempt = 0;
    while (picked.length < section.count && shuffled.length && attempt < section.count * 4) {
      const q = shuffled[attempt % shuffled.length];
      take(q, '::alt-' + picked.length);
      attempt++;
    }

    return picked.map(({ raw, suffix }) => toDisplayQ(raw, section));
  }

  function renderDiagram(container, q) {
    if (q.diagramVector && global.CBSE10DiagramVector) {
      global.CBSE10DiagramVector.renderDiagramVector(q.diagramVector, container);
    } else if (q.figure_url) {
      const img = document.createElement('img');
      img.src = q.figure_url;
      img.alt = 'Figure';
      img.style.maxWidth = '100%';
      container.appendChild(img);
    }
  }

  function renderPaper() {
    sectionsEl.innerHTML = '';
    let qNum = 0;

    paperQuestions.forEach(({ section, questions }) => {
      const secHead = document.createElement('div');
      secHead.className = 'exam-section-head';
      secHead.innerHTML = `${section.label}<small>${section.instruction} · ${section.count * section.marksEach} marks</small>`;
      sectionsEl.appendChild(secHead);

      questions.forEach((q) => {
        qNum++;
        const idx = qNum - 1;
        const div = document.createElement('div');
        div.className = 'mock-q-block';
        const marks = q.marks || section.marksEach;
        div.innerHTML = `<p class="mock-q-num">Q${qNum}.<span class="mock-q-marks">${marks} mark${marks === 1 ? '' : 's'}</span></p>
          <div class="mock-q-diagram"></div>
          <p class="mock-q-prompt"></p><div class="mock-q-opts" data-qi="${idx}"></div>`;
        div.querySelector('.mock-q-prompt').textContent = q.prompt || '';
        renderDiagram(div.querySelector('.mock-q-diagram'), q);
        const opts = div.querySelector('.mock-q-opts');
        if (q.options?.length >= 2) {
          q.options.forEach((opt, j) => {
            const lbl = document.createElement('label');
            lbl.className = 'mock-opt';
            lbl.innerHTML = `<input type="radio" name="q${idx}" value="${j}" /> ${String.fromCharCode(65 + j)}. ${opt}`;
            lbl.querySelector('input').addEventListener('change', () => {
              answers[idx] = j;
            });
            opts.appendChild(lbl);
          });
        } else {
          const isLong = marks >= 3;
          opts.innerHTML = `<div class="answer-composer-host" data-qi="${idx}" data-long="${isLong ? '1' : '0'}"></div>`;
        }
        sectionsEl.appendChild(div);
      });
    });

    if (global.AnswerComposer) {
      sectionsEl.querySelectorAll('.answer-composer-host').forEach((host) => {
        const qi = host.dataset.qi;
        const isLong = host.dataset.long === '1';
        composers[qi] = AnswerComposer.mount(host, {
          qid: qi,
          isLong,
          value: answers[qi] || '',
          placeholder: isLong
            ? 'Write a full explanation with steps, formulas, and diagrams if needed…'
            : 'Type your answer — use symbols, draw, or upload an image…',
          onChange: (val) => {
            answers[qi] = val;
          },
        });
      });
    } else {
      sectionsEl.querySelectorAll('.answer-composer-host').forEach((host) => {
        const qi = host.dataset.qi;
        host.innerHTML = `<textarea rows="4" style="width:100%;padding:8px;font-family:inherit" placeholder="Write your answer…"></textarea>`;
        const ta = host.querySelector('textarea');
        ta.value = answers[qi] || '';
        ta.addEventListener('input', (e) => {
          answers[qi] = e.target.value;
        });
      });
    }
  }

  function collectWrittenAnswers() {
    Object.keys(composers).forEach((qi) => {
      answers[qi] = composers[qi].getValue();
    });
  }

  function submitMock(auto) {
    clearInterval(timerId);
    collectWrittenAnswers();
    let score = 0;
    let mcqTotal = 0;
    let qIdx = 0;
    paperQuestions.forEach(({ questions }) => {
      questions.forEach((q) => {
        if (q.options?.length >= 2) {
          mcqTotal++;
          if (answers[qIdx] === q.correctIndex) score++;
        }
        qIdx++;
      });
    });
    const usedMin = Math.round((DURATION_SEC - remaining) / 60);
    const constructedLabel = sku === 'cbse12-science' ? 'Sections B–C' : 'Sections B–E';
    const report = document.getElementById('mockReport');
    report.hidden = false;
    report.innerHTML = `
      <div class="exam-paper-sheet">
        <h2>Paper submitted${auto ? ' (time up)' : ''}</h2>
        <p>Auto-scored MCQs: <strong>${score}/${mcqTotal || '—'}</strong></p>
        <p>Total paper marks: <strong>${paper.totalMarks}</strong> · Questions: <strong>${expectedQuestionCount}</strong> · Mode: ${isAuthentic ? 'Authentic CBSE' : 'Open explore'}</p>
        <p>Time used: ${usedMin} min · Concentration: ${focusScore}%</p>
        <p class="hint">Constructed responses (${constructedLabel}) require teacher review (Abhyas workflow).</p>
        <a href="exam-center.html" class="btn-portal btn-portal-ghost">Back to Exam Center</a>
      </div>`;
    document.getElementById('btnSubmitMock').disabled = true;
  }

  document.getElementById('btnSubmitMock').addEventListener('click', () => submitMock(false));

  sectionsEl.innerHTML = '<p class="mock-loading" style="padding:16px;color:#334155">Building your board paper…</p>';

  const loadPromise =
    sku === 'cbse10'
      ? Promise.all([
          global.CBSE10Shared.loadMasterCatalog(),
          global.CBSE10Shared.loadVerifiedBank(),
          fetch('../../data/cbse10-board-questions.json').then((r) => (r.ok ? r.json() : { questions: [] })),
        ])
      : fetch('../../data/cbse12-science-questions.json')
          .then((r) => {
            if (!r.ok) throw new Error('Question bank not found (cbse12-science-questions.json)');
            return r.json();
          })
          .then((payload) => {
            const bank = Array.isArray(payload) ? payload : payload.questions || [];
            return [{ questions: [] }, bank, { questions: [] }];
          });

  loadPromise.then(([master, bank, boardPayload]) => {
    const catalog = master?.questions || [];
    let normalizedBank = (bank || []).map(normalizeBankRow);
    const approvedBank = filterBySubject((boardPayload?.questions || []).map(normalizeBankRow), subject);
    const verifiedMcqs = normalizedBank.filter(
      (q) => q.options?.length && (q.answer_verified || q.correctIndex != null)
    );
    const sources = verifiedMcqs.length ? verifiedMcqs : normalizedBank;
    const filters = { subject, mode: isAuthentic ? 'cbse' : 'ai' };

    let allPool;
    if (sku === 'cbse10') {
      allPool = global.CBSE10Shared
        ? global.CBSE10Shared.filterMasterQuestions([...verifiedMcqs, ...catalog], { ...filters, limit: 2000 })
        : sources.filter((q) => (q.subject || '').toLowerCase().includes(subject.slice(0, 4)));
      if (allPool.length < 30) {
        allPool = global.CBSE10Shared
          ? global.CBSE10Shared.filterMasterQuestions(sources, { subject, limit: 2000 })
          : sources;
      }
    } else {
      allPool = sources.filter((q) => {
        const sub = (q.subject || q.subject_id || '').toLowerCase();
        return sub === subject || sub.includes(subject.slice(0, 4));
      });
      if (allPool.length < 30) {
        allPool = sources.filter((q) => (q.subject || '').toLowerCase().includes(subject.slice(0, 3)));
      }
    }

    const mcqPool = (() => {
      const catalogMcqs = global.CBSE10Shared
        ? global.CBSE10Shared.filterMasterQuestions(catalog, { subject, limit: 3000 }).filter(hasPlayableMcq)
        : [];
      const poolMcqs =
        sku === 'cbse12-science'
          ? allPool.filter((q) => (q.marks || 1) === 1)
          : allPool.filter(hasPlayableMcq);
      const seen = new Set();
      const merged = [];
      for (const q of [...catalogMcqs, ...poolMcqs]) {
        const key = q.id || q.prompt;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(q);
      }
      return merged;
    })();
    const used = new Set();

    paper.sections.forEach((section) => {
      let poolForSection;
      let pickOpts = {};
      if (section.id === 'A') {
        if (mcqPool.length) poolForSection = mcqPool;
        else {
          poolForSection = filterBySubject(approvedBank, subject).filter((q) => (q.marks || 1) === 1);
          pickOpts = { allowConstructed: true };
        }
      } else if (sku === 'cbse10' && approvedBank.length) {
        const exact = approvedBank.filter((q) => (q.marks || 1) === section.marksEach);
        poolForSection = exact.length >= section.count ? exact : approvedBank;
      } else {
        poolForSection = allPool.length ? allPool : mcqPool;
      }
      const qs = pickForSection(poolForSection, section, used, pickOpts);
      paperQuestions.push({ section, questions: qs });
    });

    renderBoardHeader(approvedBank.length);

    const totalQ = paperQuestions.reduce((n, s) => n + s.questions.length, 0);
    const minRequired = Math.max(8, Math.floor(expectedQuestionCount * 0.45));
    if (totalQ < minRequired) {
      sectionsEl.innerHTML = `<p style="color:#b91c1c;padding:16px">Not enough questions for this mock (${totalQ}/${expectedQuestionCount}). ${
        sku === 'cbse12-science'
          ? 'Run <code>scripts/export_portal_study_assets.py</code> to publish the question bank.'
          : 'Try Practice Test or another subject.'
      } <a href="exam-center.html">Back to Exam Center</a></p>`;
      return;
    }
    renderPaper();
    renderClock();
    timerId = setInterval(tick, 1000);
  }).catch((err) => {
    sectionsEl.innerHTML = `<p>Could not load question bank: ${err.message || err}. <a href="exam-center.html">Back to Exam Center</a></p>`;
  });
})(typeof window !== 'undefined' ? window : globalThis);
