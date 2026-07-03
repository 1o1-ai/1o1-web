/**

 * CBSE 10 Study Room — wizard: subject → chapter → learn|evaluate → one-by-one Q&A.

 */

(function () {

  'use strict';



  let curriculum = null;

  let masterQuestions = [];
  let syntheticQuestions = [];
  let advancedQuestions = [];

  let subject = '';

  let chapterId = '';

  let chapterTitle = '';



  let questionQueue = [];

  let queueIndex = 0;

  let sessionAnswers = [];

  let sessionStart = 0;

  let questionShownAt = 0;

  let pasteCount = 0;

  let blurCount = 0;

  let timerId = null;

  let activeCardEl = null;

  let activeComposer = null;

  let distractionBound = false;

  let onPasteHandler = null;

  let onBlurHandler = null;

  let onVisibilityHandler = null;



  const phases = {

    subject: document.getElementById('phaseSubject'),

    chapter: document.getElementById('phaseChapter'),

    intent: document.getElementById('phaseIntent'),

    study: document.getElementById('phaseStudy'),

    learn: document.getElementById('phaseLearn'),

    evaluate: document.getElementById('phaseEvaluate'),

  };

  const cornerOrbs = document.getElementById('cornerOrbs');

  const evalChat = document.getElementById('evalChat');

  const evalResults = document.getElementById('evalResults');

  const evalModal = document.getElementById('evalModal');



  Promise.all([

    window.CBSE10Shared.loadCurriculum(),

    window.CBSE10Shared.loadMasterCatalog(),

    window.CBSE10Shared.loadSyntheticBank(),

    window.CBSE10Shared.loadAdvancedComplexityBank(),

    window.CBSE10StudyMaterial.load().catch(() => null),

    window.AnyoBots.loadRoster(),

    window.AnyoReferenceAnswer?.loadOverrides?.() || Promise.resolve(),

  ]).then(([cur, master, synthetic, advanced, _study, roster]) => {

    curriculum = cur;

    masterQuestions = master?.questions || [];

    syntheticQuestions = synthetic || [];

    advancedQuestions = advanced || [];

    renderStudents(roster?.students || [], 'studentsRoster');

    renderStudents(roster?.students || [], 'learnStudentsRoster');

    bindSubjectCircles();

    bindNavigation();

    bindEvaluate();

    if (!applyEntryFromUrl()) showPhase('subject');

  }).catch((err) => {

    showLoadError(

      'Could not load study room data. Check your connection and refresh. ' + (err?.message || err)

    );

  });



  function showLoadError(msg) {

    const el = document.getElementById('srLoadError');

    if (el) {

      el.textContent = msg;

      el.classList.remove('hidden');

    }

    showPhase('subject');

  }



  function showPhase(name) {

    Object.entries(phases).forEach(([k, el]) => {

      if (el) el.classList.toggle('hidden', k !== name);

    });

    const inEval = name === 'evaluate';

    const inLearn = name === 'learn';

    const inStudy = name === 'study';

    cornerOrbs?.classList.toggle('hidden', !inEval && !inLearn && !inStudy);

    document.body.classList.toggle('sr-eval-active', inEval);

    document.body.classList.toggle('sr-learn-active', inLearn);

    document.body.classList.toggle('cbse-study-active', inStudy);

    if (inEval || inLearn || inStudy) highlightCornerOrb();

    if (!inLearn && !inStudy) window.CBSE10StudyMaterial?.stopReadAloud?.();

    if (inStudy === false && name !== 'evaluate') window.CBSEOfficialBooks?.stopLecture?.();

  }



  function chaptersForSubject(sub) {

    const chs = curriculum?.subjects?.[sub]?.chapters || [];

    return [...chs].sort((a, b) => (a.syllabus_order || 99) - (b.syllabus_order || 99));

  }



  function normChapterId(ch) {

    if (window.CBSE10Shared?.normalizeChapterId) return window.CBSE10Shared.normalizeChapterId(ch);

    return ch === 'environment' ? 'sources-of-energy' : ch;

  }



  function applyEntryFromUrl() {

    const p = new URLSearchParams(location.search);

    const sub = p.get('subject');

    const ch = p.get('chapter');

    const intent = p.get('intent');

    if (!sub || (sub !== 'science' && sub !== 'mathematics')) return false;

    subject = sub;

    renderChapterGrid();

    if (!ch) {

      showPhase('chapter');

      return true;

    }

    const found = chaptersForSubject(subject).find((c) => c.id === ch || normChapterId(c.id) === normChapterId(ch));

    if (!found) {

      showPhase('chapter');

      return true;

    }

    chapterId = found.id;

    chapterTitle = found.title;

    const label = document.getElementById('intentChapterLabel');

    if (label) {

      label.innerHTML =

        `<strong>${chapterTitle}</strong> · ${subject === 'science' ? 'Science' : 'Mathematics'}`;

    }

    if (intent === 'learn') {

      openStudyHub('regular');

      return true;

    }

    if (intent === 'evaluate') {

      openStudyHub('practice');

      return true;

    }

    openStudyHub('regular');

    return true;

  }



  function bindSubjectCircles() {

    document.querySelectorAll('.sr-subject-circle').forEach((btn) => {

      btn.addEventListener('click', () => {

        subject = btn.getAttribute('data-subject') || 'science';

        renderChapterGrid();

        showPhase('chapter');

      });

    });

    document.getElementById('cornerScience')?.addEventListener('click', () => {

      if (subject !== 'science') resetToSubject('science');

    });

    document.getElementById('cornerMath')?.addEventListener('click', () => {

      if (subject !== 'mathematics') resetToSubject('mathematics');

    });

  }



  function resetToSubject(sub) {

    subject = sub;

    chapterId = '';

    renderChapterGrid();

    showPhase('chapter');

  }



  function highlightCornerOrb() {

    document.getElementById('cornerScience')?.classList.toggle('active', subject === 'science');

    document.getElementById('cornerMath')?.classList.toggle('active', subject === 'mathematics');

  }



  function countForChapter(chId, mode) {

    return window.CBSE10Shared.filterMasterQuestions(masterQuestions, {

      subject,

      chapter: chId,

      mode: mode || undefined,

      limit: 999,

    }).length;

  }



  function renderChapterGrid() {

    const grid = document.getElementById('chapterGrid');

    grid.innerHTML = '';

    chaptersForSubject(subject).forEach((ch) => {

      const official = countForChapter(ch.id, 'cbse');

      const explore = countForChapter(ch.id, 'ai');

      const btn = document.createElement('button');

      btn.type = 'button';

      btn.className = 'sr-chapter-pick';

      const total = official + explore;
      btn.innerHTML = `<span class="sr-ch-num">${ch.syllabus_order || ''}</span><span class="sr-ch-title">${ch.title}</span><span class="sr-ch-count">${total} questions</span>`;

      btn.addEventListener('click', () => {

        chapterId = ch.id;

        chapterTitle = ch.title;

        document.getElementById('intentChapterLabel').innerHTML =

          `<strong>${chapterTitle}</strong> · ${subject === 'science' ? 'Science' : 'Mathematics'}`;

        openStudyHub('regular');

      });

      grid.appendChild(btn);

    });

  }



  function bindNavigation() {

    document.getElementById('backToSubject')?.addEventListener('click', () => showPhase('subject'));

    document.getElementById('backToChapter')?.addEventListener('click', () => showPhase('chapter'));

    document.getElementById('backFromStudy')?.addEventListener('click', () => {
      window.CBSEOfficialBooks?.stopLecture?.();
      stopEvaluateSession();
      showPhase('chapter');
    });

    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('study'));

    document.getElementById('backFromEvaluate')?.addEventListener('click', () => {

      stopEvaluateSession();

      showPhase('study');

    });

    document.getElementById('btnLearn')?.addEventListener('click', () => startLearnSession());

    document.getElementById('btnEvaluate')?.addEventListener('click', () => startEvaluateSession());

    window.addEventListener('cbse10:switch-evaluate', () => startEvaluateSession());

  }



  function questionSourceMode() {

    const checked = document.querySelector('input[name="qSource"]:checked');

    return checked?.value === 'ai' ? 'ai' : 'cbse';

  }



  function buildQueue() {

    const mode = questionSourceMode();

    const difficulty = document.getElementById('difficultySelect')?.value || 'all';

    const base = {
      subject,
      chapter: chapterId,
      mode,
      difficulty: difficulty === 'all' ? undefined : difficulty,
      limit: 50,
    };
    let pool = window.CBSE10Shared.filterMasterQuestions(masterQuestions, base);
    if (!pool.length && base.difficulty) {
      pool = window.CBSE10Shared.filterMasterQuestions(masterQuestions, { ...base, difficulty: undefined });
    }
    return pool.map(window.CBSE10Shared.toDisplayQ);

  }



  function shuffle(arr) {

    const a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [a[i], a[j]] = [a[j], a[i]];

    }

    return a;

  }



  function startLearnSession() {
    window.CBSE10StudyMaterial?.stopReadAloud?.();
    const ch = window.CBSE10StudyMaterial?.chapter?.(chapterId);
    const root = document.getElementById('learnContent');
    document.getElementById('learnTitle').textContent = chapterTitle;
    document.getElementById('learnSubtitle').textContent =
      `${subject === 'science' ? 'Science · 086' : 'Mathematics · 041'} · AI study guide (not official)`;
    if (!ch) {
      root.innerHTML =
        '<p class="sr-eval-hint">Study material for this chapter is not available yet. Try <strong>Evaluate</strong> or check back later.</p>';
    } else {
      window.CBSE10StudyMaterial.renderLearnView(ch, root);
    }
    document.body.classList.add('sr-learn-active');
    showPhase('learn');
  }

  function openStudyHub(initialTab) {

    if (!window.CBSEStudyHub) {

      showPhase('intent');

      return;

    }

    const subjectLabel = subject === 'science' ? 'Science · 086' : 'Mathematics · 041';

    let evalHome = null;

    window.CBSEStudyHub.open({

      sku: 'cbse10',

      subjectId: subject,

      subjectLabel,

      chapterId,

      chapterTitle,

      initialTab: initialTab || 'regular',

      showPhase,

      listChapters: () =>
        chaptersForSubject(subject).map((c) => ({ id: c.id, title: c.title })),

      filterQuestions: ({ difficulty, limit, chapterIds }) => {
        const ids = chapterIds?.length ? chapterIds : [chapterId];
        const out = [];
        const isComplex = difficulty === 'difficult' || difficulty === 'hard' || difficulty === 'advanced';
        const banks = isComplex
          ? [
              { rows: advancedQuestions, mode: 'advanced' },
              { rows: syntheticQuestions, mode: 'ai' },
              { rows: masterQuestions, mode: 'ai' },
            ]
          : [
              { rows: syntheticQuestions, mode: 'ai' },
              { rows: masterQuestions, mode: 'cbse' },
              { rows: masterQuestions, mode: 'ai' },
            ];
        ids.forEach((ch) => {
          banks.forEach(({ rows, mode }) => {
            window.CBSE10Shared.filterMasterQuestions(rows, {
              subject,
              chapter: ch,
              mode,
              difficulty,
              limit: limit || 6,
            })
              .map(window.CBSE10Shared.toDisplayQ)
              .forEach((q) => out.push(q));
          });
        });
        const seen = new Set();
        const deduped = [];
        out.forEach((q) => {
          const key = String(q.id || q.prompt || '');
          if (seen.has(key)) return;
          seen.add(key);
          deduped.push(q);
        });
        return window.CBSE10Shared.shuffleArray(deduped).slice(0, (limit || 6) * ids.length);
      },

      onBeforePractice: () => {

        const embed = document.getElementById('studyPracticeEmbed');

        const evalPhase = document.getElementById('phaseEvaluate');

        if (embed && evalPhase && !evalHome) {

          evalHome = evalPhase;

          embed.classList.remove('hidden');

          embed.appendChild(evalPhase);

          evalPhase.classList.remove('hidden');

        }

        startEvaluateSession({ embedded: true });

      },

      onLeavePractice: () => {

        const embed = document.getElementById('studyPracticeEmbed');

        const panel = document.getElementById('studyTabPanel');

        if (embed && evalHome && panel) {

          embed.classList.add('hidden');

          panel.after(evalHome);

          evalHome.classList.add('hidden');

        }

        stopEvaluateSession();

      },

      onMountPractice: (mount) => {

        mount.innerHTML = '<p class="sr-eval-hint">Loading Q &amp; A workspace…</p>';

      },

      legacyIntent: () => showPhase('intent'),

    });

  }



  function startEvaluateSession(opts) {

    questionQueue = shuffle(buildQueue());

    queueIndex = 0;

    sessionAnswers = [];

    sessionStart = Date.now();

    pasteCount = 0;

    blurCount = 0;

    activeCardEl = null;

    evalChat.innerHTML =

      '<p class="sr-eval-hint">One question at a time. Use <strong>Next question</strong> when done. Scoring only when you press <strong>Evaluate my answers</strong>.</p>';

    evalResults.classList.add('hidden');

    document.getElementById('evalTitle').textContent = chapterTitle;

    document.getElementById('evalSubtitle').textContent =

      `${subject === 'science' ? 'Science · 086' : 'Mathematics · 041'} · ${questionQueue.length} question(s) in queue`;



    if (!questionQueue.length) {

      appendChatLine('system', 'No valid questions for this chapter. Try another difficulty or refresh the queue.');

    } else {

      showCurrentQuestion();

    }



    if (timerId) clearInterval(timerId);

    timerId = setInterval(updateDistractionStats, 1000);

    trackDistraction();

    if (!opts?.embedded) showPhase('evaluate');

  }



  function stopEvaluateSession() {

    if (timerId) {

      clearInterval(timerId);

      timerId = null;

    }

    unbindDistraction();

  }



  function bindDistraction() {

    if (distractionBound) return;

    onPasteHandler = () => pasteCount++;

    onBlurHandler = () => blurCount++;

    onVisibilityHandler = () => {

      if (document.hidden) blurCount++;

    };

    document.addEventListener('paste', onPasteHandler);

    window.addEventListener('blur', onBlurHandler);

    document.addEventListener('visibilitychange', onVisibilityHandler);

    distractionBound = true;

  }



  function unbindDistraction() {

    if (!distractionBound) return;

    if (onPasteHandler) document.removeEventListener('paste', onPasteHandler);

    if (onBlurHandler) window.removeEventListener('blur', onBlurHandler);

    if (onVisibilityHandler) document.removeEventListener('visibilitychange', onVisibilityHandler);

    distractionBound = false;

  }



  function trackDistraction() {

    bindDistraction();

  }



  function focusScore() {

    return Math.max(0, 100 - pasteCount * 8 - blurCount * 3);

  }



  function updateDistractionStats() {

    const el = document.getElementById('distractionStats');

    if (!el) return;

    const sec = Math.floor((Date.now() - sessionStart) / 1000);

    const m = Math.floor(sec / 60);

    const s = sec % 60;

    el.textContent = `Focus: ${focusScore()}% · Session: ${m}:${String(s).padStart(2, '0')} · Tab away: ${blurCount} · Answered: ${sessionAnswers.length}`;

  }



  function appendChatLine(kind, html) {

    const div = document.createElement('div');

    div.className = `sr-chat-line sr-chat-${kind}`;

    div.innerHTML = html;

    evalChat.appendChild(div);

    evalChat.scrollTop = evalChat.scrollHeight;

    return div;

  }



  function freezeActiveCard() {

    if (!activeCardEl) return;

    activeCardEl.classList.remove('sr-q-active');

    activeCardEl.classList.add('sr-q-done');

    activeCardEl.querySelectorAll('input, textarea, .answer-composer button, .answer-composer .ac-sym-btn, .answer-composer .ac-action-btn').forEach((el) => {

      el.disabled = true;

    });

    if (activeComposer) {

      activeComposer.destroy();

      activeComposer = null;

    }

    activeCardEl = null;

  }



  function cleanQText(text) {

    return window.AnyoQuestionFormat?.cleanQuestionText?.(text) || String(text || '').trim();

  }



  const AI_ANSWER_DISCLAIMER =
    'Reference answer — cross-check with your textbook and teacher before relying on this.';



  function extractReferenceAnswer(q) {

    if (window.AnyoReferenceAnswer?.extractReferenceAnswer) {

      return window.AnyoReferenceAnswer.extractReferenceAnswer(q);

    }

    const cleanSol = (t) =>

      window.AnyoQuestionFormat?.cleanSolutionText?.(t) || cleanQText(t);

    if (q.correctIndex != null && q.options?.[q.correctIndex]) {

      return cleanQText(q.options[q.correctIndex]);

    }

    const sol = q.solutions || {};

    const a = String(sol.alt_answer_02?.text || '');

    const b = String(sol.answer_01?.text || '');

    const pick = a.length >= b.length ? a : b;

    return pick ? cleanSol(pick) : null;

  }



  function cleanPresentationFeedback(feedback) {

    const raw = String(feedback || '');

    if (/offline rubric|keyword overlap|supercop\.in|local rub/i.test(raw)) {

      return '';

    }

    const clean = window.AnyoQuestionFormat?.cleanSolutionText?.(raw) || raw;

    if (/step\s*\d+\s*:/i.test(clean) && clean.length > 120) {

      return '';

    }

    return clean

      .replace(/keyword overlap[\s\S]*/gi, '')

      .replace(/offline rubric[\s\S]*/gi, '')

      .replace(/\(API offline[^)]*\)/gi, '')
      .replace(/_Graded locally from catalog reference \(no LLM\)\._/gi, '')
      .replace(/Graded locally from catalog reference \(no LLM\)\.?/gi, '')
      .trim();

  }



  function attachShowAnswerButton(card, q) {

    const actions = document.createElement('div');

    actions.className = 'sr-q-actions';

    const btn = document.createElement('button');

    btn.type = 'button';

    btn.className = 'btn-portal btn-portal-ghost sr-show-answer-btn';

    btn.textContent = 'Show reference answer';

    const panel = document.createElement('div');

    panel.className = 'sr-q-answer-panel';

    panel.hidden = true;

    btn.addEventListener('click', async () => {

      if (panel.dataset.revealed === '1') {

        panel.hidden = !panel.hidden;

        btn.textContent = panel.hidden ? 'Show reference answer' : 'Hide reference answer';

        return;

      }

      panel.innerHTML = '';

      const disclaimer = document.createElement('p');

      disclaimer.className = 'sr-ai-disclaimer sr-answer-disclaimer';

      disclaimer.textContent = AI_ANSWER_DISCLAIMER;

      panel.appendChild(disclaimer);

      const body = document.createElement('div');

      body.className = 'sr-q-answer-body';

      body.textContent = 'Loading reference answer…';

      panel.appendChild(body);

      panel.dataset.revealed = '1';

      panel.hidden = false;

      btn.textContent = 'Hide reference answer';

      const t0 = window.performance?.now?.() ?? Date.now();

      let ref = extractReferenceAnswer(q);

      await (window.AnyoReferenceAnswer?.loadOverrides?.() || Promise.resolve());
      ref = extractReferenceAnswer(q);

      let source = ref ? 'catalog' : '';

      if (!ref && window.Cbse10TutorApi?.chat) {

        try {

          const reply = await window.Cbse10TutorApi.chat(

            `Give a concise worked solution only (numbered steps, no mark scheme, no source tags) for this CBSE Class 10 question:\n\n${q.prompt}`,

            { subject, chapterId, chapterTitle }

          );

          ref = cleanPresentationFeedback(reply) || String(reply || '').trim();

          source = 'ai_chat';

        } catch {

          ref = '';

        }

      }

      window.EducationPerf?.record?.('reference_answer', {
        durationMs: (window.performance?.now?.() ?? Date.now()) - t0,
        usedAi: source === 'ai_chat',
        source: source || 'none',
        sku: 'cbse10-core',
        questionId: q.id || '',
      });

      if (ref) {

        body.textContent = ref;

      } else {

        body.textContent = '';

        const empty = document.createElement('p');

        empty.className = 'sr-eval-hint';

        empty.textContent = 'No reference answer available yet — try asking in the forum.';

        body.replaceWith(empty);

      }

      evalChat.scrollTop = evalChat.scrollHeight;

    });

    actions.appendChild(btn);

    card.appendChild(actions);

    card.appendChild(panel);

  }



  function showCurrentQuestion() {

    freezeActiveCard();



    if (queueIndex >= questionQueue.length) {

      appendChatLine(

        'system',

        'No more questions in this queue. Press <strong>Evaluate my answers</strong> or refresh questions.'

      );

      return;

    }



    const q = questionQueue[queueIndex];

    const promptText = cleanQText(q.prompt);

    const options = window.AnyoQuestionFormat?.formatOptions?.(q.options) || q.options || [];

    questionShownAt = Date.now();



    const card = document.createElement('div');

    card.className = 'sr-q-card sr-q-active';

    card.dataset.qIndex = String(queueIndex);

    card.innerHTML = `<p class="sr-q-meta">Question ${queueIndex + 1} of ${questionQueue.length} · ${q.type || 'Question'} · ${q.marks || '?'} mark(s)${q.exam_year ? ' · ' + q.exam_year : ''}</p>

      <div class="sr-q-diagram"></div>

      <p class="sr-q-prompt"></p>

      <div class="sr-q-response"></div>`;



    card.querySelector('.sr-q-prompt').textContent = promptText;

    const diagramEl = card.querySelector('.sr-q-diagram');

    if (q.diagramVector && window.CBSE10DiagramVector) {

      window.CBSE10DiagramVector.renderDiagramVector(q.diagramVector, diagramEl);

    } else if (q.figure_url) {

      const img = document.createElement('img');

      img.src = q.figure_url;

      img.alt = 'Figure';

      img.style.maxWidth = '100%';

      diagramEl.appendChild(img);

    }



    const resp = card.querySelector('.sr-q-response');

    if (options.length >= 2) {

      options.forEach((opt, i) => {

        const lbl = document.createElement('label');

        lbl.className = 'sr-opt-label';

        const input = document.createElement('input');

        input.type = 'radio';

        input.name = 'curQ';

        input.value = String(i);

        lbl.appendChild(input);

        lbl.appendChild(document.createTextNode(` ${String.fromCharCode(65 + i)}. ${opt}`));

        resp.appendChild(lbl);

      });

    } else {

      resp.innerHTML =
        '<div class="answer-composer-host sr-answer-composer"></div>';

      const host = resp.querySelector('.answer-composer-host');

      if (window.AnswerComposer && host) {

        activeComposer = AnswerComposer.mount(host, {

          qid: String(q.id || queueIndex),

          isLong: (q.marks || 0) >= 3,

          value: '',

          placeholder: 'Type your answer — use symbols, draw, or upload an image…',

        });

      } else if (host) {

        host.innerHTML = '<textarea class="sr-text-answer" rows="5" placeholder="Type your answer here…"></textarea>';

      }

    }



    attachShowAnswerButton(card, q);



    evalChat.appendChild(card);

    activeCardEl = card;

    evalChat.scrollTop = evalChat.scrollHeight;

  }



  function captureCurrentAnswer() {

    const q = questionQueue[queueIndex];

    if (!q) return null;

    let studentAnswer = '';

    let selectedIndex = null;

    const radio = document.querySelector('.sr-q-active input[name="curQ"]:checked');

    const textarea = document.querySelector('.sr-q-active .sr-text-answer');

    if (radio) {

      selectedIndex = parseInt(radio.value, 10);

      studentAnswer = q.options[selectedIndex] || '';

    } else if (activeComposer) {

      studentAnswer = activeComposer.getValue();

    } else if (textarea) {

      studentAnswer = textarea.value.trim();

    }

    const timeMs = Date.now() - questionShownAt;

    return {

      questionId: q.id,

      chapterId: q.chapterId,

      chapterTitle,

      subject,

      prompt: q.prompt,

      type: q.type,

      marks: q.marks || 1,

      studentAnswer,

      selectedIndex,

      correctIndex: q.correctIndex,

      timeMs,

      distractionScore: blurCount,

      pasteCount,

      focusScore: focusScore(),

      cognitive_domain: q.cognitive_domain,

      solutions: q.solutions,

    };

  }



  function saveCurrentAnswerToSession() {

    const ans = captureCurrentAnswer();

    if (!ans || (!ans.studentAnswer && ans.selectedIndex == null)) return null;

    const dup = sessionAnswers.some((a) => a.questionId === ans.questionId);

    if (!dup) sessionAnswers.push(ans);

    return ans;

  }



  function bindEvaluate() {

    document.querySelectorAll('input[name="qSource"]').forEach((el) => {

      el.addEventListener('change', () => {

        if (phases.evaluate && !phases.evaluate.classList.contains('hidden')) {

          startEvaluateSession();

        }

      });

    });

    document.getElementById('difficultySelect')?.addEventListener('change', () => {

      if (!phases.evaluate.classList.contains('hidden')) startEvaluateSession();

    });

    document.getElementById('btnReloadQueue')?.addEventListener('click', () => startEvaluateSession());

    document.getElementById('btnNextQuestion')?.addEventListener('click', () => {

      const ans = saveCurrentAnswerToSession();

      if (ans) {

        const preview =

          ans.selectedIndex != null

            ? String.fromCharCode(65 + ans.selectedIndex) + '. ' + ans.studentAnswer

            : ans.studentAnswer.slice(0, 160) + (ans.studentAnswer.length > 160 ? '…' : '');

        appendChatLine('student', `<strong>Your answer (Q${queueIndex + 1}):</strong> ${preview}`);

      } else if (activeCardEl) {

        appendChatLine('system', `Skipped Q${queueIndex + 1} — no answer entered.`);

      }

      queueIndex++;

      showCurrentQuestion();

      updateDistractionStats();

    });

    document.getElementById('btnEvaluateSubmit')?.addEventListener('click', () => {

      saveCurrentAnswerToSession();

      freezeActiveCard();

      if (!sessionAnswers.length) {

        appendChatLine('system', 'Answer at least one question before evaluating.');

        return;

      }

      document.getElementById('evalAnswerCount').textContent = String(sessionAnswers.length);

      evalModal.showModal();

    });

    document.getElementById('evalCancel')?.addEventListener('click', () => evalModal.close());

    document.getElementById('evalConfirm')?.addEventListener('click', async (e) => {

      e.preventDefault();

      evalModal.close();

      const mode = document.querySelector('input[name="evalMode"]:checked')?.value || 'computer';

      await runEvaluation(mode);

    });

  }



  function parseMarksFromFeedback(feedback, maxMarks) {

    const text = String(feedback || '');

    if (!text.trim()) return null;

    const frac = text.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);

    if (frac) return Math.min(maxMarks, parseFloat(frac[1]));

    const pct = text.match(/(?:score|rating)\s*[:\(]?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*100|%|\))/i);

    if (pct) return Math.min(maxMarks, Math.round((parseFloat(pct[1]) / 100) * maxMarks * 10) / 10);

    const awarded = text.match(/(?:marks?\s*(?:awarded|scored)?|score)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);

    if (awarded) return Math.min(maxMarks, parseFloat(awarded[1]));

    const marksSlash = text.match(/marks?\s*awarded\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);

    if (marksSlash) return Math.min(maxMarks, parseFloat(marksSlash[1]));

    if (/full\s*marks|correct|perfect|excellent/i.test(text)) return maxMarks;

    if (/zero|incorrect|wrong|no\s*marks|poor/i.test(text)) return 0;

    return null;

  }



  async function scoreOneAnswer(ans) {

    const maxMarks = ans.marks || 1;

    const t0 = window.performance?.now?.() ?? Date.now();

    if (ans.selectedIndex != null && ans.correctIndex != null) {

      const correct = ans.selectedIndex === ans.correctIndex;

      window.EducationPerf?.record?.('grade_answer', {
        durationMs: (window.performance?.now?.() ?? Date.now()) - t0,
        usedAi: false,
        gradedBy: 'catalog_key',
        sku: 'cbse10-core',
      });

      return {

        marksAwarded: correct ? maxMarks : 0,

        maxMarks,

        feedback: correct

          ? `Correct (${String.fromCharCode(65 + ans.correctIndex)}).`

          : `Incorrect. Correct option: ${String.fromCharCode(65 + ans.correctIndex)}.`,

        gradedBy: 'catalog_key',

      };

    }

    const rawRubric = ans.solutions?.alt_answer_02?.text || ans.solutions?.answer_01?.text || '';

    let referenceAnswer =

      window.AnyoReferenceAnswer?.extractReferenceAnswer?.(ans) ||

      window.AnyoQuestionFormat?.cleanSolutionText?.(rawRubric) ||

      cleanQText(rawRubric) ||

      '';

    try {

      const feedback = await window.Cbse10TutorApi.gradeAnswer(

        ans.prompt,

        ans.studentAnswer,

        referenceAnswer,

        {

          referenceAnswer,

          maxMarks,

          subject: ans.subject || subject,

          chapterId: ans.chapterId || chapterId,

          chapterTitle: ans.chapterTitle || chapterTitle,

        }

      );

      const marksAwarded = parseMarksFromFeedback(feedback, maxMarks);

      let presentation = cleanPresentationFeedback(feedback);

      if (!presentation && marksAwarded != null) {

        presentation = `Scored ${marksAwarded}/${maxMarks}. Detailed feedback will appear when the grading service is online.`;

      }

      window.EducationPerf?.record?.('grade_answer', {
        durationMs: (window.performance?.now?.() ?? Date.now()) - t0,
        usedAi: true,
        gradedBy: referenceAnswer ? 'server_deterministic_or_llm' : 'llm',
        sku: 'cbse10-core',
      });

      return {

        marksAwarded,

        maxMarks,

        feedback: presentation || 'Graded by computer tutor.',

        gradedBy: marksAwarded != null ? 'computer_ai' : 'computer_ai_narrative',

      };

    } catch {

      window.EducationPerf?.record?.('grade_answer', {
        durationMs: (window.performance?.now?.() ?? Date.now()) - t0,
        usedAi: false,
        gradedBy: 'pending',
        ok: false,
        sku: 'cbse10-core',
      });

      return {

        marksAwarded: null,

        maxMarks,

        feedback:

          'Computer grading is temporarily unavailable. Your answer was saved — retry when online or ask your teacher.',

        gradedBy: 'pending',

      };

    }

  }



  async function runEvaluation(mode) {

    appendChatLine('system', 'Evaluating…');

    evalResults.classList.remove('hidden');

    evalResults.innerHTML = '<p>Scoring your answers…</p>';



    const grades = [];

    if (mode === 'computer' || mode === 'both') {

      for (const ans of sessionAnswers) {

        const g = await scoreOneAnswer(ans);

        grades.push({ ...ans, ...g });

      }

    } else {

      grades.push(...sessionAnswers.map((a) => ({ ...a, gradedBy: 'teacher_pending' })));

    }



    const totalAwarded = grades.reduce((s, g) => s + (g.marksAwarded != null ? g.marksAwarded : 0), 0);

    const totalMax = grades.reduce((s, g) => s + (g.maxMarks || 1), 0);



    const attempt = {

      sessionId: 'sess_' + Date.now(),

      subject,

      chapterId,

      chapterTitle,

      questionSource: questionSourceMode(),

      evaluationMode: mode,

      sessionDurationMs: Date.now() - sessionStart,

      focusScore: focusScore(),

      pasteCount,

      blurCount,

      totalAwarded,

      totalMax,

      answers: sessionAnswers.map((a) => ({

        ...a,

        grade: grades.find((g) => g.questionId === a.questionId),

      })),

      grades,

    };



    window.CBSE10EvalStore.recordAttempt(attempt);



    let forumThreadId = null;

    if (mode === 'teacher' || mode === 'both') {

      const entry = window.CBSE10EvalStore.submitToTeacherQueue({

        ...attempt,

        status: 'pending_teacher',

        note: 'Submitted from CBSE 10 Study Room — awaiting teacher grade in forum.',

      });

      forumThreadId = entry.forumThreadId;

    }



    let html = `<h3>Evaluation complete</h3><p>${window.CBSE10EvalStore.getStudyUser().name} · ${sessionAnswers.length} answer(s) · Score: ${totalAwarded}/${totalMax}</p><ul class="sr-grade-list">`;

    grades.forEach((g, i) => {

      const note = cleanPresentationFeedback(g.feedback || 'Sent to teacher').slice(0, 280);

      const label =

        g.marksAwarded != null

          ? `${g.marksAwarded}/${g.maxMarks}`

          : g.gradedBy === 'pending'

            ? 'Pending review'

            : 'Review';

      html += `<li><strong>Q${i + 1}</strong> ${label}${note ? ' — ' + note : ''}</li>`;

    });

    html += '</ul>';

    if (mode === 'teacher' || mode === 'both') {

      html += `<p class="sr-teacher-note">Answer sheet queued for teacher grading. <a href="forum.html">Open forum</a> — thread <code>${forumThreadId || 'pending'}</code>.</p>`;

    }

    evalResults.innerHTML = html;

    appendChatLine('system', `Evaluation saved · ${totalAwarded}/${totalMax} marks (computer scoring where available).`);

  }



  function renderStudents(students, listId) {

    const ul = document.getElementById(listId || 'studentsRoster');

    if (!ul) return;

    ul.innerHTML = '';

    if (!students.length) {

      const li = document.createElement('li');

      li.className = 'sr-students-empty';

      li.textContent = 'No classmates listed right now.';

      ul.appendChild(li);

      return;

    }

    students.slice(0, 12).forEach((s) => {

      const li = document.createElement('li');

      li.className = 'sr-student-item';

      li.innerHTML = `<img src="${s.photo}" alt="" width="32" height="32" /><span>${s.name}</span><em>${s.city || ''}</em>`;

      ul.appendChild(li);

    });

    if (!students.length) {

      ul.innerHTML = '<li class="sr-students-empty"><em>Study room open — peers appear when online.</em></li>';

    }

  }

})();

