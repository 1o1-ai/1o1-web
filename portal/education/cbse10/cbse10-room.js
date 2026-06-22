/**

 * CBSE 10 Study Room — wizard: subject → chapter → learn|evaluate → one-by-one Q&A.

 */

(function () {

  'use strict';



  let curriculum = null;

  let masterQuestions = [];

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



  const phases = {

    subject: document.getElementById('phaseSubject'),

    chapter: document.getElementById('phaseChapter'),

    intent: document.getElementById('phaseIntent'),

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

    window.CBSE10StudyMaterial.load().catch(() => null),

    window.AnyoBots.loadRoster(),

  ]).then(([cur, master, _study, roster]) => {

    curriculum = cur;

    masterQuestions = master?.questions || [];

    renderStudents(roster?.students || [], 'studentsRoster');

    renderStudents(roster?.students || [], 'learnStudentsRoster');

    bindSubjectCircles();

    bindNavigation();

    bindEvaluate();

    showPhase('subject');

  });



  function showPhase(name) {

    Object.entries(phases).forEach(([k, el]) => {

      if (el) el.classList.toggle('hidden', k !== name);

    });

    const inEval = name === 'evaluate';

    const inLearn = name === 'learn';

    cornerOrbs?.classList.toggle('hidden', !inEval && !inLearn);

    document.body.classList.toggle('sr-eval-active', inEval);

    document.body.classList.toggle('sr-learn-active', inLearn);

    if (inEval || inLearn) highlightCornerOrb();

    if (!inLearn) window.CBSE10StudyMaterial?.stopReadAloud?.();

  }



  function chaptersForSubject(sub) {

    const chs = curriculum?.subjects?.[sub]?.chapters || [];

    return [...chs].sort((a, b) => (a.syllabus_order || 99) - (b.syllabus_order || 99));

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

      btn.innerHTML = `<span class="sr-ch-num">${ch.syllabus_order || ''}</span><span class="sr-ch-title">${ch.title}</span><span class="sr-ch-count">${official} board · ${explore} explore</span>`;

      btn.addEventListener('click', () => {

        chapterId = ch.id;

        chapterTitle = ch.title;

        document.getElementById('intentChapterLabel').innerHTML =

          `<strong>${chapterTitle}</strong> · ${subject === 'science' ? 'Science' : 'Mathematics'}`;

        showPhase('intent');

      });

      grid.appendChild(btn);

    });

  }



  function bindNavigation() {

    document.getElementById('backToSubject')?.addEventListener('click', () => showPhase('subject'));

    document.getElementById('backToChapter')?.addEventListener('click', () => showPhase('chapter'));

    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('intent'));

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

    return window.CBSE10Shared.filterMasterQuestions(masterQuestions, {

      subject,

      chapter: chapterId,

      mode,

      difficulty: difficulty === 'all' ? undefined : difficulty,

      limit: 50,

    }).map(window.CBSE10Shared.toDisplayQ);

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

  function startEvaluateSession() {

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

      appendChatLine('system', 'No valid questions for this chapter and source. Try AI-generated or another difficulty.');

    } else {

      showCurrentQuestion();

    }



    if (timerId) clearInterval(timerId);

    timerId = setInterval(updateDistractionStats, 1000);

    showPhase('evaluate');

    trackDistraction();

  }



  function trackDistraction() {

    document.addEventListener('paste', () => pasteCount++);

    window.addEventListener('blur', () => blurCount++);

    document.addEventListener('visibilitychange', () => {

      if (document.hidden) blurCount++;

    });

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

    activeCardEl.querySelectorAll('input, textarea, button').forEach((el) => {

      el.disabled = true;

    });

    activeCardEl = null;

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

    questionShownAt = Date.now();



    const card = document.createElement('div');

    card.className = 'sr-q-card sr-q-active';

    card.dataset.qIndex = String(queueIndex);

    card.innerHTML = `<p class="sr-q-meta">Question ${queueIndex + 1} of ${questionQueue.length} · ${q.type || 'Question'} · ${q.marks || '?'} mark(s)${q.exam_year ? ' · ' + q.exam_year : ''}${q.source_kind === 'pdf_catalog' ? ' · board' : ''}</p>

      <div class="sr-q-diagram"></div>

      <p class="sr-q-prompt"></p>

      <div class="sr-q-response"></div>`;



    card.querySelector('.sr-q-prompt').textContent = q.prompt;

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

    if (q.options?.length >= 2) {

      q.options.forEach((opt, i) => {

        const lbl = document.createElement('label');

        lbl.className = 'sr-opt-label';

        lbl.innerHTML = `<input type="radio" name="curQ" value="${i}" /> ${String.fromCharCode(65 + i)}. ${opt}`;

        resp.appendChild(lbl);

      });

    } else {

      resp.innerHTML =

        '<textarea class="sr-text-answer" rows="5" placeholder="Type your answer here…"></textarea>';

    }



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

    const frac = text.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);

    if (frac) return Math.min(maxMarks, parseFloat(frac[1]));

    const awarded = text.match(/(?:marks?\s*(?:awarded|scored)?|score)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);

    if (awarded) return Math.min(maxMarks, parseFloat(awarded[1]));

    if (/full\s*marks|correct|perfect/i.test(text)) return maxMarks;

    if (/zero|incorrect|wrong|no\s*marks/i.test(text)) return 0;

    return null;

  }



  async function scoreOneAnswer(ans) {

    const maxMarks = ans.marks || 1;

    if (ans.selectedIndex != null && ans.correctIndex != null) {

      const correct = ans.selectedIndex === ans.correctIndex;

      return {

        marksAwarded: correct ? maxMarks : 0,

        maxMarks,

        feedback: correct

          ? `Correct (${String.fromCharCode(65 + ans.correctIndex)}).`

          : `Incorrect. Correct option: ${String.fromCharCode(65 + ans.correctIndex)}.`,

        gradedBy: 'catalog_key',

      };

    }

    const rubric =

      ans.solutions?.alt_answer_02?.text ||

      ans.solutions?.answer_01?.text ||

      'Award partial marks using CBSE marking scheme.';

    try {

      const feedback = await window.Cbse10TutorApi.gradeAnswer(ans.prompt, ans.studentAnswer, rubric);

      const marksAwarded = parseMarksFromFeedback(feedback, maxMarks);

      return {

        marksAwarded,

        maxMarks,

        feedback,

        gradedBy: 'computer_ai',

      };

    } catch {

      return {

        marksAwarded: null,

        maxMarks,

        feedback: 'Computer grading unavailable — answer saved for teacher review.',

        gradedBy: 'fallback',

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



    let html = `<h3>Evaluation complete</h3><p>${window.CBSE10EvalStore.DUMMY_USER.name} · ${sessionAnswers.length} answer(s) · Score: ${totalAwarded}/${totalMax}</p><ul class="sr-grade-list">`;

    grades.forEach((g, i) => {

      const marks =

        g.marksAwarded != null ? `${g.marksAwarded}/${g.maxMarks}` : 'Pending / AI narrative';

      html += `<li><strong>Q${i + 1}</strong> ${marks} — ${(g.feedback || 'Sent to teacher').slice(0, 280)}</li>`;

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

