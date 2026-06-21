/**
 * CBSE 10 Core study room — student (live) / teacher (preview)
 * Curriculum: portal/data/cbse10-curriculum.json (CBSE 2026-27)
 */
(function () {
  const params = new URLSearchParams(location.search);
  const role = params.get('role') || 'student';
  const body = document.body;

  body.classList.add(role === 'teacher' ? 'teacher-ambience' : 'student-ambience');

  if (role === 'teacher') {
    document.getElementById('teacherView').hidden = false;
    document.getElementById('studentView').hidden = true;
    document.getElementById('roleBadge').textContent = 'Teacher · preview';
    return;
  }

  document.getElementById('roleBadge').textContent = 'Student';

  let curriculum = null;
  let subject = 'science';
  let chapterId = 'light';
  let quizActive = false;
  let quizQuestions = [];
  let quizIndex = 0;
  let quizAnswers = [];

  const chapterList = document.getElementById('chapterList');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chapterTitle = document.getElementById('chapterTitle');
  const subjectLabel = document.getElementById('subjectLabel');
  const quizPanel = document.getElementById('quizPanel');
  const alertBanner = document.getElementById('alertBanner');

  fetch('../../data/cbse10-curriculum.json')
    .then((r) => r.json())
    .then((data) => {
      curriculum = data;
      renderIngestBadge();
      renderChapters();
      selectChapter('light');
      showAlert();
    })
    .catch(() => {
      chapterList.innerHTML = '<li><em>Could not load curriculum</em></li>';
    });

  function renderIngestBadge() {
    const stats = curriculum.stats;
    if (!stats) return;
    const el = document.getElementById('ingestBadge');
    if (!el) return;
    el.textContent = `${stats.questions_in_bank || 0} questions · ${stats.files_total || 0} files ingested`;
    el.hidden = false;
  }

  function chaptersForSubj(sub) {
    const s = curriculum.subjects[sub];
    return s?.units || s?.chapters || [];
  }

  function renderChapters() {
    chapterList.innerHTML = '';
    chaptersForSubj(subject).forEach((ch) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = ch.title;
      btn.dataset.id = ch.id;
      if (ch.id === chapterId) btn.classList.add('active');
      btn.addEventListener('click', () => selectChapter(ch.id));
      li.appendChild(btn);
      chapterList.appendChild(li);
    });
  }

  function selectChapter(id) {
    chapterId = id;
    const ch = chaptersForSubj(subject).find((c) => c.id === id);
    if (!ch) return;
    chapterTitle.textContent = ch.title;
    subjectLabel.textContent = subject === 'science' ? 'Science · 086' : 'Mathematics · 041';
    renderChapters();
    quizActive = false;
    quizPanel.hidden = true;
    chatMessages.innerHTML = '';
    addBubble(
      'tutor',
      `Welcome to **${ch.title}** (${curriculum.session} syllabus). Ask for an explanation, example, or start a 5-question chapter quiz.`
    );
    if (id === 'light') {
      setTimeout(() => {
        addBubble('peer', 'Arjun: I am revising mirror formula here too — ping me if stuck.', 'Arjun M.');
      }, 1800);
    }
  }

  function showAlert() {
    if (chapterId !== 'light') return;
    alertBanner.hidden = false;
    alertBanner.innerHTML =
      '<strong>Light needs attention</strong> — studied 12 &amp; 18 Jun, mock score 25%. ' +
      '<button type="button" id="alertQuizBtn" style="margin-left:8px;color:#67e8f9;background:none;border:none;cursor:pointer;text-decoration:underline">5-Q drill</button>';
    document.getElementById('alertQuizBtn')?.addEventListener('click', startQuiz);
  }

  document.querySelectorAll('[data-subject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      subject = btn.getAttribute('data-subject');
      document.querySelectorAll('[data-subject]').forEach((b) => {
        const on = b.getAttribute('data-subject') === subject;
        b.classList.toggle('active', on);
        b.style.cssText = on
          ? 'padding:8px;border-radius:10px;border:1px solid rgba(103,232,249,0.4);background:rgba(6,182,212,0.12);color:#67e8f9;cursor:pointer'
          : 'padding:8px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);background:transparent;color:#cbd5e1;cursor:pointer';
      });
      const first = chaptersForSubj(subject)[0];
      if (first) selectChapter(first.id);
    });
  });

  function addBubble(kind, text, author) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${kind}`;
    if (author) div.innerHTML = `<small style="opacity:0.7">${author}</small><br>` + text.replace(/\*\*(.*?)\*\*/g, '$1');
    else div.textContent = text.replace(/\*\*(.*?)\*\*/g, '$1');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function mockTutorReply(msg) {
    const m = msg.toLowerCase();
    if (m.includes('example')) return 'NCERT Example: use sign convention for mirrors — u is negative for real objects in standard layout.';
    if (m.includes('explain')) return 'Core idea from syllabus: reflection laws, mirror/lens formula, magnification — board often asks diagram + numerical.';
    return 'Good question. In production I pull this from cbse10_kb Qdrant. Try the chapter quiz to check recall.';
  }

  document.getElementById('sendChat').addEventListener('click', () => {
    const t = chatInput.value.trim();
    if (!t) return;
    addBubble('student', t);
    chatInput.value = '';
    setTimeout(() => addBubble('tutor', mockTutorReply(t)), 500);
  });
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('sendChat').click();
  });

  function getQuizQuestions() {
    const bank = curriculum.quizBank[chapterId];
    if (bank && bank.length) return bank.slice(0, 5);
    return [
      {
        prompt: 'Review question for this chapter — syllabus-aligned recall.',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 1,
        source: 'Generic',
      },
    ];
  }

  function startQuiz() {
    quizQuestions = getQuizQuestions();
    while (quizQuestions.length < 5 && curriculum.quizBank.light) {
      quizQuestions.push(curriculum.quizBank.light[quizQuestions.length % curriculum.quizBank.light.length]);
    }
    quizQuestions = quizQuestions.slice(0, 5);
    quizIndex = 0;
    quizAnswers = [];
    quizActive = true;
    quizPanel.hidden = false;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const q = quizQuestions[quizIndex];
    quizPanel.innerHTML = `<p style="font-size:0.75rem;color:#94a3b8">Q ${quizIndex + 1}/5 · ${q.source || 'CBSE'}</p>
      <p style="margin:8px 0 12px;font-weight:500">${q.prompt.replace(/\n/g, '<br>')}</p>
      <div id="quizOpts"></div>`;
    const opts = quizPanel.querySelector('#quizOpts');
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      b.style.cssText =
        'display:block;width:100%;text-align:left;margin:4px 0;padding:10px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);background:rgba(15,23,42,0.6);color:#e2e8f0;cursor:pointer';
      b.addEventListener('click', () => {
        quizAnswers.push(i);
        quizIndex++;
        if (quizIndex >= quizQuestions.length) {
          const score = quizAnswers.filter((a, j) => a === quizQuestions[j].correctIndex).length;
          quizPanel.innerHTML = `<p style="color:#6ee7b7;font-weight:600">Quiz complete: ${score}/${quizQuestions.length}</p>
            <p style="font-size:0.82rem;color:#94a3b8;margin-top:8px">Logged to your progress report (mock).</p>`;
          addBubble('tutor', `You scored ${score}/${quizQuestions.length} on ${chapterTitle.textContent}. Review weak items before board mock.`);
          quizActive = false;
        } else renderQuizQuestion();
      });
      opts.appendChild(b);
    });
  }

  document.getElementById('btnQuiz').addEventListener('click', startQuiz);
  document.getElementById('btnBoard').addEventListener('click', () => {
    addBubble('tutor', 'Board mock uses random questions from CBSE 2023-24 practice papers (Science/Math PQ). Timer in next release.');
  });
  document.getElementById('btnInvite').addEventListener('click', () => {
    const link = `${location.origin}/portal/education/cbse10/room.html?role=student&join=sr-mock-a7f2`;
    navigator.clipboard?.writeText(link);
    addBubble('peer', 'Invite link copied — share with classmates (SaaS web only).', 'System');
  });
})();
