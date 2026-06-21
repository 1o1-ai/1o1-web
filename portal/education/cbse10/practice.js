(function () {
  if (!window.getPortalSession?.()) {
    location.href = 'index.html';
    return;
  }

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
    const figureOnly = document.getElementById('prFigureOnly').checked;
    let qs = window.CBSE10Shared.filterBank(bank, {
      subject: prSubject.value,
      chapter: prChapter.value,
      yearsBack: 3,
      limit: figureOnly ? 99 : count,
      requireFigure: figureOnly,
    });
    if (figureOnly) qs = qs.slice(0, count);
    if (!qs.length) {
      alert('No verified questions for this filter. Try another chapter or uncheck diagram-only.');
      return;
    }
    runQuiz(qs.map(window.CBSE10Shared.toDisplayQ), `Chapter practice · ${count} question(s)`);
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
