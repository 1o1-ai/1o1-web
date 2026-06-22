(function () {
  let curriculum = null;
  let bank = [];

  const prSubject = document.getElementById('prSubject');
  const prChapter = document.getElementById('prChapter');
  const quizArea = document.getElementById('quizArea');

  Promise.all([window.CBSE10Shared.loadCurriculum(), window.CBSE10Shared.loadVerifiedBank()]).then(
    ([cur, b]) => {
      curriculum = cur;
      bank = b;
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

  document.getElementById('btnChapterStart').addEventListener('click', () => {
    const count = Math.min(15, Math.max(1, parseInt(document.getElementById('prCount').value, 10) || 5));
    const preferFigure = document.getElementById('prFigureOnly').checked;
    const subject = prSubject.value;
    const chapter = prChapter.value;

    let qs = window.CBSE10Shared.filterBank(bank, {
      subject,
      chapter,
      limit: count,
      preferFigure,
    });

    const display = qs.map(window.CBSE10Shared.toDisplayQ);
    const figCount = display.filter((q) => q.hasFigure).length;
    const figChapters = window.CBSE10Shared.chaptersWithFigures(bank, subject);
    const chTitle = chapters(subject).find((c) => c.id === chapter)?.title || chapter;

    if (!qs.length) {
      alert('No verified questions for this chapter. Try another chapter.');
      return;
    }

    if (preferFigure && figCount === 0) {
      if (figChapters.size === 0) {
        alert(
          'No diagram-style questions in the verified bank for Science yet. ' +
            'Switch to Mathematics and try Circles or Polynomials, or uncheck the diagram preference.'
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

    let title = `Chapter practice · ${count} question(s) · ${chTitle}`;
    if (preferFigure && figCount > 0) {
      title += ` · ${figCount} with figure/diagram prompt`;
    }
    runQuiz(display, title);
  });

  document.getElementById('btnMockStart').addEventListener('click', () => {
    const sub = document.getElementById('mockSubject').value;
    location.href = `mock-exam.html?subject=${encodeURIComponent(sub)}`;
  });

  function runQuiz(questions, title) {
    quizArea.hidden = false;
    let idx = 0;
    const answers = [];
    quizArea.innerHTML = `<h2 style="color:#f1f5f9;font-size:1rem">${title}</h2><div id="qBox"></div>`;
    const box = document.getElementById('qBox');

    function render() {
      const q = questions[idx];
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
