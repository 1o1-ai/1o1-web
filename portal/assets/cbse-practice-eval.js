/**
 * CBSE chapter practice — answer sheet (on-screen + PDF) and evaluation modes.
 */
(function (global) {
  'use strict';

  const AI_DISCLAIMER =
    'ManjuLAB computer agent — reference answer and marks are AI-assisted, not official CBSE marking. Verify with NCERT and your teacher before relying on this.';

  const COMPUTER_EVAL_DISCLAIMER =
    'Computer evaluation uses catalog rubrics and the ManjuLAB tutor when online. Marks are indicative only.';

  function esc(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cleanQText(text) {
    return global.AnyoQuestionFormat?.cleanQuestionText?.(text) || String(text || '').trim();
  }

  function cleanPresentationFeedback(feedback) {
    const raw = String(feedback || '');
    if (/offline rubric|keyword overlap|supercop\.in|local rub/i.test(raw)) return '';
    const clean = global.AnyoQuestionFormat?.cleanSolutionText?.(raw) || raw;
    if (/step\s*\d+\s*:/i.test(clean) && clean.length > 120) return '';
    return clean
      .replace(/keyword overlap[\s\S]*/gi, '')
      .replace(/offline rubric[\s\S]*/gi, '')
      .replace(/\(API offline[^)]*\)/gi, '')
      .trim();
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
    if (/full\s*marks|correct|perfect|excellent/i.test(text)) return maxMarks;
    if (/zero|incorrect|wrong|no\s*marks|poor/i.test(text)) return 0;
    return null;
  }

  function extractReferenceAnswer(q) {
    if (global.AnyoReferenceAnswer?.extractReferenceAnswer) {
      return global.AnyoReferenceAnswer.extractReferenceAnswer(q);
    }
    if (q.correctIndex != null && q.options?.[q.correctIndex]) {
      return cleanQText(q.options[q.correctIndex]);
    }
    const sol = q.solutions || q.raw?.solutions || {};
    const a = String(sol.alt_answer_02?.text || '');
    const b = String(sol.answer_01?.text || '');
    const pick = a.length >= b.length ? a : b;
    return pick ? cleanPresentationFeedback(pick) || cleanQText(pick) : '';
  }

  function formatStudentAnswer(q, answer) {
    if (q.correctIndex != null && typeof answer === 'number') {
      const letter = String.fromCharCode(65 + answer);
      const opt = q.options?.[answer] || '';
      return `${letter}. ${opt}`;
    }
    if (global.AnswerComposer?.formatDisplayText) {
      return global.AnswerComposer.formatDisplayText(answer || '');
    }
    return String(answer || '(not answered)');
  }

  function renderAnswerImages(container, raw) {
    if (!global.AnswerComposer?.parse) return;
    const parsed = global.AnswerComposer.parse(raw || '');
    (parsed.images || []).forEach((img) => {
      if (!img.data) return;
      const el = document.createElement('img');
      el.className = 'practice-answer-img';
      el.src = img.data;
      el.alt = img.name || 'Attachment';
      container.appendChild(el);
    });
  }

  function getJsPdfConstructor() {
    if (global.jspdf?.jsPDF) return global.jspdf.jsPDF;
    if (typeof global.jsPDF === 'function') return global.jsPDF;
    return null;
  }

  function wrapPdfLines(doc, text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    lines.forEach((line) => {
      if (y > 780) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function buildAnswerRows(ctx) {
    return (ctx.questions || []).map((q, i) => ({
      questionId: String(q.id || i),
      prompt: cleanQText(q.prompt),
      marks: q.marks || 1,
      options: q.options,
      correctIndex: q.correctIndex,
      solutions: q.solutions || q.raw?.solutions,
      subject: ctx.subject,
      chapterId: ctx.chapterId,
      chapterTitle: ctx.chapterTitle,
      selectedIndex: typeof ctx.answers[i] === 'number' && q.correctIndex != null ? ctx.answers[i] : null,
      studentAnswer:
        typeof ctx.answers[i] === 'number' && q.correctIndex != null
          ? q.options?.[ctx.answers[i]] || ''
          : String(ctx.answers[i] || ''),
      rawAnswer: ctx.answers[i],
    }));
  }

  function renderAnswerSheetHtml(ctx, rows) {
    const user = global.CBSE10EvalStore?.DUMMY_USER?.name || 'Student';
    const subjectLabel = ctx.subject === 'mathematics' ? 'Mathematics' : 'Science';
    let html = `
      <div class="exam-paper-sheet practice-answer-sheet">
        <div class="exam-board-header">
          <p class="board-name">Central Board of Secondary Education</p>
          <p class="paper-title">Chapter Practice · Answer Sheet</p>
          <p class="paper-meta">${subjectLabel} · ${ctx.chapterTitle || ctx.chapterId}<br>
            ${user} · ${new Date().toLocaleString()}</p>
        </div>`;

    rows.forEach((row, i) => {
      const isMcq = row.correctIndex != null && row.options?.length >= 2;
      html += `<article class="practice-sheet-q" data-qi="${i}">
        <p class="mock-q-num">Q${i + 1}.<span class="mock-q-marks">${row.marks} mark${row.marks === 1 ? '' : 's'}</span></p>
        <p class="mock-q-prompt">${esc(row.prompt)}</p>
        <div class="practice-sheet-answer">
          <strong>Your answer:</strong>
          <div class="practice-sheet-answer-body" id="practiceAnsBody${i}">${esc(
        formatStudentAnswer(
          { ...ctx.questions[i], correctIndex: row.correctIndex, options: row.options },
          row.rawAnswer
        )
      )}</div>
        </div>
        <div class="practice-sheet-ref hidden" id="practiceRef${i}"></div>
        <div class="practice-sheet-grade hidden" id="practiceGrade${i}"></div>
      </article>`;
      if (isMcq) {
        html += `<p class="practice-mcq-hint" style="font-size:0.78rem;color:#64748b;margin:-8px 0 12px 24px">MCQ — auto-scored on evaluation</p>`;
      }
    });

    html += `</div>`;
    return html;
  }

  function attachAnswerImages(ctx, rows) {
    rows.forEach((row, i) => {
      const q = ctx.questions[i];
      const isMcq = q.correctIndex != null && q.options?.length >= 2;
      if (isMcq) return;
      const body = document.getElementById('practiceAnsBody' + i);
      if (body && row.rawAnswer) renderAnswerImages(body, row.rawAnswer);
    });
  }

  function downloadPdf(ctx, rows) {
    const JsPDF = getJsPdfConstructor();
    if (!JsPDF) {
      alert('PDF library not loaded. Refresh the page and try again.');
      return;
    }
    const user = global.CBSE10EvalStore?.DUMMY_USER?.name || 'Student';
    const subjectLabel = ctx.subject === 'mathematics' ? 'Mathematics' : 'Science';
    const doc = new JsPDF({ unit: 'pt', format: 'a4' });
    let y = 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CBSE Chapter Practice · Answer Sheet', 40, y);
    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    [
      `Student: ${user}`,
      `Subject: ${subjectLabel} · ${ctx.chapterTitle || ctx.chapterId}`,
      `Session: ${ctx.sessionId || '—'}`,
      `Generated: ${new Date().toLocaleString()}`,
    ].forEach((line) => {
      doc.text(line, 40, y);
      y += 14;
    });
    y += 8;
    doc.setDrawColor(200);
    doc.line(40, y, 555, y);
    y += 18;

    rows.forEach((row, idx) => {
      const header = `Q${idx + 1} · ${row.marks} mark(s)`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      y = wrapPdfLines(doc, header, 40, y, 515, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      y = wrapPdfLines(doc, row.prompt, 40, y, 515, 13);
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('Answer:', 40, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      const q = ctx.questions[idx];
      if (row.selectedIndex != null) {
        y = wrapPdfLines(doc, formatStudentAnswer(q, row.rawAnswer), 40, y, 515, 13);
      } else if (global.AnswerComposer) {
        y = global.AnswerComposer.appendToPdf(doc, row.rawAnswer || '(not answered)', 40, y, 515, 13);
      } else {
        y = wrapPdfLines(doc, row.studentAnswer || '(not answered)', 40, y, 515, 13);
      }
      y += 12;
    });

    const fname = `cbse-practice-answer-sheet-${ctx.sessionId || Date.now()}.pdf`;
    doc.save(fname);
  }

  async function scoreOneAnswer(ans, ctx) {
    const maxMarks = ans.marks || 1;
    if (ans.selectedIndex != null && ans.correctIndex != null) {
      const correct = ans.selectedIndex === ans.correctIndex;
      return {
        marksAwarded: correct ? maxMarks : 0,
        maxMarks,
        feedback: correct
          ? `Correct (${String.fromCharCode(65 + ans.correctIndex)}).`
          : `Incorrect. Correct option: ${String.fromCharCode(65 + ans.correctIndex)}.`,
        referenceAnswer: ans.options?.[ans.correctIndex] || '',
        gradedBy: 'catalog_key',
      };
    }

    let referenceAnswer = extractReferenceAnswer(ans);
    await (global.AnyoReferenceAnswer?.loadOverrides?.() || Promise.resolve());
    referenceAnswer = extractReferenceAnswer(ans) || referenceAnswer;

    if (!referenceAnswer && global.Cbse10TutorApi?.chat) {
      try {
        const reply = await global.Cbse10TutorApi.chat(
          `Give a concise worked solution only (numbered steps, no mark scheme, no source tags) for this CBSE Class ${ctx.grade || '10'} question:\n\n${ans.prompt}`,
          {
            subject: ctx.subject,
            chapterId: ctx.chapterId,
            chapterTitle: ctx.chapterTitle,
          }
        );
        referenceAnswer = cleanPresentationFeedback(reply) || String(reply || '').trim();
      } catch {
        /* fallback below */
      }
    }

    if (!global.Cbse10TutorApi?.gradeAnswer) {
      return {
        marksAwarded: null,
        maxMarks,
        feedback: 'Computer grading unavailable — submit to a teacher or retry when online.',
        referenceAnswer: referenceAnswer || '',
        gradedBy: 'pending',
      };
    }

    try {
      const feedback = await global.Cbse10TutorApi.gradeAnswer(ans.prompt, ans.studentAnswer, referenceAnswer, {
        referenceAnswer,
        maxMarks,
        subject: ctx.subject,
        chapterId: ctx.chapterId,
        chapterTitle: ctx.chapterTitle,
      });
      const marksAwarded = parseMarksFromFeedback(feedback, maxMarks);
      let presentation = cleanPresentationFeedback(feedback);
      if (!presentation && marksAwarded != null) {
        presentation = `Scored ${marksAwarded}/${maxMarks}.`;
      }
      return {
        marksAwarded,
        maxMarks,
        feedback: presentation || 'Graded by ManjuLAB computer agent.',
        referenceAnswer: referenceAnswer || '',
        gradedBy: marksAwarded != null ? 'computer_ai' : 'computer_ai_narrative',
      };
    } catch {
      return {
        marksAwarded: null,
        maxMarks,
        feedback: 'Computer grading is temporarily unavailable. Your answer was saved — retry or ask your teacher.',
        referenceAnswer: referenceAnswer || '',
        gradedBy: 'pending',
      };
    }
  }

  function showGradeOnSheet(i, g, mode) {
    const gradeEl = document.getElementById('practiceGrade' + i);
    const refEl = document.getElementById('practiceRef' + i);
    if (!gradeEl) return;

    if (mode === 'teacher') {
      gradeEl.classList.remove('hidden');
      gradeEl.innerHTML = '<p class="practice-pending">Queued for real teacher review.</p>';
      return;
    }

    if (g.marksAwarded != null) {
      gradeEl.classList.remove('hidden');
      gradeEl.innerHTML = `<p class="practice-score"><strong>${g.marksAwarded}/${g.maxMarks}</strong> — ${cleanPresentationFeedback(g.feedback || '').slice(0, 320)}</p>`;
    } else if (g.gradedBy === 'pending') {
      gradeEl.classList.remove('hidden');
      gradeEl.innerHTML = `<p class="practice-pending">${g.feedback || 'Pending review'}</p>`;
    }

    if ((mode === 'computer' || mode === 'both') && g.referenceAnswer && refEl) {
      refEl.classList.remove('hidden');
      refEl.innerHTML = `
        <p class="practice-ref-label">Best possible answer (ManjuLAB agent)</p>
        <p class="practice-ai-disclaimer">${esc(AI_DISCLAIMER)}</p>
        <div class="practice-ref-body">${esc(g.referenceAnswer)}</div>`;
    }
  }

  async function runEvaluation(mode, ctx, rows, resultsEl) {
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `<p class="practice-eval-loading">Evaluating with ${mode === 'computer' ? 'ManjuLAB computer agent' : mode === 'teacher' ? 'teacher queue' : 'computer + teacher'}…</p>`;

    const grades = [];
    if (mode === 'computer' || mode === 'both') {
      for (let i = 0; i < rows.length; i++) {
        const g = await scoreOneAnswer(rows[i], ctx);
        grades.push({ ...rows[i], ...g });
        showGradeOnSheet(i, g, mode);
      }
    } else {
      grades.push(...rows.map((a) => ({ ...a, gradedBy: 'teacher_pending' })));
      rows.forEach((_, i) => showGradeOnSheet(i, { gradedBy: 'teacher_pending' }, mode));
    }

    const totalAwarded = grades.reduce((s, g) => s + (g.marksAwarded != null ? g.marksAwarded : 0), 0);
    const totalMax = grades.reduce((s, g) => s + (g.maxMarks || 1), 0);

    const attempt = {
      sessionId: ctx.sessionId,
      subject: ctx.subject,
      chapterId: ctx.chapterId,
      chapterTitle: ctx.chapterTitle,
      questionSource: 'practice',
      evaluationMode: mode,
      sessionDurationMs: Date.now() - (ctx.sessionStart || Date.now()),
      totalAwarded,
      totalMax,
      answers: rows.map((a) => ({
        ...a,
        grade: grades.find((g) => g.questionId === a.questionId),
      })),
      grades,
    };

    if (global.CBSE10EvalStore?.recordAttempt) {
      global.CBSE10EvalStore.recordAttempt(attempt);
    }

    let forumThreadId = null;
    if ((mode === 'teacher' || mode === 'both') && global.CBSE10EvalStore?.submitToTeacherQueue) {
      const entry = global.CBSE10EvalStore.submitToTeacherQueue({
        ...attempt,
        status: 'pending_teacher',
        note: 'Submitted from CBSE chapter practice — awaiting teacher grade.',
      });
      forumThreadId = entry.forumThreadId;
    }

    let html = `<h3 class="practice-results-title">Evaluation complete</h3>`;
    if (mode === 'computer' || mode === 'both') {
      html += `<p class="practice-ai-disclaimer">${COMPUTER_EVAL_DISCLAIMER}</p>`;
      html += `<p><strong>Score: ${totalAwarded}/${totalMax}</strong> · ${rows.length} question(s)</p>`;
    }
    if (mode === 'teacher' || mode === 'both') {
      html += `<p class="practice-teacher-note">Answer sheet queued for real teacher grading. <a href="forum.html">Open forum</a>${forumThreadId ? ` — thread <code>${forumThreadId}</code>` : ''}.</p>`;
    }
    resultsEl.innerHTML = html;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  let pendingEval = null;

  function bindEvalModal() {
    const modal = document.getElementById('practiceEvalModal');
    const confirmBtn = document.getElementById('practiceEvalConfirm');
    if (!modal || !confirmBtn || confirmBtn.dataset.bound === '1') return;
    confirmBtn.dataset.bound = '1';
    confirmBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!pendingEval) return;
      modal.close();
      const mode = document.querySelector('input[name="practiceEvalMode"]:checked')?.value || 'computer';
      await runEvaluation(mode, pendingEval.ctx, pendingEval.rows, pendingEval.resultsEl);
    });
  }

  function showResults(container, ctx) {
    const rows = buildAnswerRows(ctx);
    const mcqIdx = rows.filter((r) => r.correctIndex != null);
    const mcqScore = mcqIdx.filter((r) => r.selectedIndex === r.correctIndex).length;

    container.hidden = false;
    container.innerHTML = `
      <div class="practice-results-header">
        <h2 style="color:#f1f5f9;font-size:1.05rem;margin:0 0 8px">${ctx.sessionTitle || 'Practice complete'}</h2>
        <p style="color:#94a3b8;font-size:0.85rem;margin:0 0 16px">
          ${mcqIdx.length ? `Quick MCQ tally: ${mcqScore}/${mcqIdx.length} · ` : ''}
          Review your answer sheet below, download PDF, then submit for evaluation.
        </p>
        <div class="practice-results-actions">
          <button type="button" class="btn-portal btn-portal-ghost" id="btnDownloadSheet">Download PDF answer sheet</button>
          <button type="button" class="btn-portal btn-portal-primary" id="btnSubmitEval">Submit for evaluation</button>
        </div>
      </div>
      <div id="practiceSheetMount"></div>
      <div id="practiceEvalResults" class="practice-eval-results hidden" aria-live="polite"></div>`;

    const mount = container.querySelector('#practiceSheetMount');
    mount.innerHTML = renderAnswerSheetHtml(ctx, rows);
    attachAnswerImages(ctx, rows);

    container.querySelector('#btnDownloadSheet').addEventListener('click', () => downloadPdf(ctx, rows));

    const modal = document.getElementById('practiceEvalModal');
    const resultsEl = container.querySelector('#practiceEvalResults');
    pendingEval = { ctx, rows, resultsEl };

    container.querySelector('#btnSubmitEval').addEventListener('click', () => {
      if (modal) {
        const countEl = document.getElementById('practiceEvalCount');
        if (countEl) countEl.textContent = String(rows.length);
        modal.showModal();
      } else {
        runEvaluation('computer', ctx, rows, resultsEl);
      }
    });

    bindEvalModal();
    container.scrollIntoView({ behavior: 'smooth' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvalModal);
  } else {
    bindEvalModal();
  }

  global.CBSEPracticeEval = {
    AI_DISCLAIMER,
    showResults,
    downloadPdf,
    runEvaluation,
  };
})(typeof window !== 'undefined' ? window : globalThis);
