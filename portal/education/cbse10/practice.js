(function () {
  const shared = window.CBSE10Shared;
  let curriculum = null;
  let verifiedBank = [];
  let catalogQuestions = [];

  const prSubject = document.getElementById('prSubject');
  const prChapter = document.getElementById('prChapter');
  const prCount = document.getElementById('prCount');
  const quizArea = document.getElementById('quizArea');

  const urlParams = new URLSearchParams(location.search);

  Promise.all([shared.loadCurriculum(), shared.loadVerifiedBank(), shared.loadMasterCatalog()]).then(
    ([cur, verified, catalog]) => {
      curriculum = cur;
      verifiedBank = verified.filter((q) => !shared.isProceduralPlaceholderMcq(q));
      catalogQuestions = catalog?.questions || [];
      if (urlParams.get('subject')) prSubject.value = urlParams.get('subject');
      if (urlParams.get('count')) {
        const n = Math.min(15, Math.max(1, parseInt(urlParams.get('count'), 10) || 5));
        prCount.value = String(n);
      }
      fillChapters();
      prSubject.addEventListener('change', fillChapters);
    }
  );

  function chapters(sub) {
    const s = curriculum.subjects[sub];
    return s?.chapters || s?.units || [];
  }

  function fillChapters() {
    prChapter.innerHTML = '';
    chapters(prSubject.value).forEach((ch) => {
      const o = document.createElement('option');
      o.value = ch.id;
      o.textContent = ch.title;
      prChapter.appendChild(o);
    });
  }

  function isPlayableMcq(q) {
    if (shared.isProceduralPlaceholderMcq(q)) return false;
    const d = shared.toDisplayQ(q);
    return d.options.length >= 2 && d.correctIndex != null;
  }

  function pickPracticeQuestions(subject, chapter, count, preferFigure) {
    const fromVerified = shared.filterBank(verifiedBank, {
      subject,
      chapter,
      limit: 500,
      preferFigure,
    });
    const fromCatalog = shared.filterMasterQuestions(catalogQuestions, {
      subject,
      chapter,
      type: 'mcq',
      limit: 500,
    });

    const seen = new Set();
    let pool = [];
    for (const q of [...fromVerified, ...fromCatalog]) {
      if (!isPlayableMcq(q)) continue;
      const key = q.id || shared.toDisplayQ(q).prompt;
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push(q);
    }

    if (preferFigure) {
      const fig = pool.filter((q) => shared.hasFigure(q));
      const rest = pool.filter((q) => !shared.hasFigure(q));
      pool = [...fig, ...rest];
    }

    pool.sort(() => Math.random() - 0.5);
    return pool.slice(0, count);
  }

  document.getElementById('btnChapterStart').addEventListener('click', () => {
    const count = Math.min(15, Math.max(1, parseInt(prCount.value, 10) || 5));
    const preferFigure = document.getElementById('prFigureOnly').checked;
    const subject = prSubject.value;
    const chapter = prChapter.value;

    const qs = pickPracticeQuestions(subject, chapter, count, preferFigure);
    const display = qs.map(shared.toDisplayQ);
    const figCount = display.filter((q) => q.hasFigure).length;
    const figChapters = shared.chaptersWithFigures([...verifiedBank, ...catalogQuestions], subject);
    const chTitle = chapters(subject).find((c) => c.id === chapter)?.title || chapter;

    if (!qs.length) {
      alert('No playable MCQs for this chapter. Try another chapter or subject.');
      return;
    }

    if (qs.length < count) {
      const ok = confirm(
        `Only ${qs.length} playable question(s) available for "${chTitle}" (requested ${count}). Start with ${qs.length}?`
      );
      if (!ok) return;
    }

    if (preferFigure && figCount === 0) {
      if (figChapters.size === 0) {
        alert(
          'No diagram-style questions in the bank for this subject yet. ' +
            'Try Mathematics → Circles or Polynomials, or uncheck the diagram preference.'
        );
        return;
      }
      const hints = [...figChapters.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id, n]) => {
          const t = chapters(subject).find((c) => c.id === id)?.title || id;
          return `${t} (${n})`;
        })
        .join(', ');
      const ok = confirm(
        `No diagram-style questions in "${chTitle}" right now.\n\n` +
          `Chapters with figure prompts: ${hints}.\n\n` +
          'Start anyway with text-only questions from this chapter?'
      );
      if (!ok) return;
    }

    let title = `Chapter practice · ${display.length} question(s) · ${chTitle}`;
    if (preferFigure && figCount > 0) {
      title += ` · ${figCount} with figure/diagram prompt`;
    }
    runQuiz(display, title);
  });

  function runQuiz(questions, title) {
    quizArea.hidden = false;
    let idx = 0;
    const answers = [];
    quizArea.innerHTML = `<h2 style="color:#f1f5f9;font-size:1rem">${title}</h2><div id="qBox"></div>`;
    const box = document.getElementById('qBox');

    function render() {
      const q = questions[idx];
      if (!q.options?.length) {
        idx++;
        if (idx >= questions.length) {
          const score = answers.filter((a, j) => a === questions[j].correctIndex).length;
          box.innerHTML = `<p style="color:#6ee7b7;font-weight:600">Score: ${score}/${questions.length}</p>`;
        } else render();
        return;
      }
      const fig = q.hasFigure
        ? '<p class="figure-badge">📐 Diagram/Figure question — see original board paper scan for image</p>'
        : '';
      box.innerHTML = `${fig}<p style="color:#94a3b8;font-size:0.75rem">Q ${idx + 1}/${questions.length} · ${q.exam_year || ''} verified</p>
        <p style="font-weight:500;margin:12px 0">${q.prompt}</p><div id="opts"></div>`;
      const opts = box.querySelector('#opts');
      q.options.forEach((opt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-portal btn-portal-ghost';
        b.style.cssText = 'display:block;width:100%;text-align:left;margin:4px 0';
        b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
        b.onclick = () => {
          answers.push(i);
          idx++;
          if (idx >= questions.length) {
            const score = answers.filter((a, j) => a === questions[j].correctIndex).length;
            box.innerHTML = `<p style="color:#6ee7b7;font-weight:600">Score: ${score}/${questions.length}</p>`;
          } else render();
        };
        opts.appendChild(b);
      });
    }
    render();
    quizArea.scrollIntoView({ behavior: 'smooth' });
  }
})();
