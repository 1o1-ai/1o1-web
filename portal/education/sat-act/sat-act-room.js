/**
 * SAT / ACT study room — same shell as CBSE10; track/section config + US/UK peer roster.
 */
(function () {
  const SKU = 'sat-act';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots && window.AnyoBots.configureForSku) {
    window.AnyoBots.configureForSku(SKU);
  }

  const params = new URLSearchParams(location.search);
  const role = params.get('role') || 'student';

  document.body.classList.add(role === 'teacher' ? 'teacher-ambience' : 'student-ambience');

  if (role === 'teacher') {
    document.getElementById('teacherView').hidden = false;
    document.getElementById('studentView').hidden = true;
    document.getElementById('roleBadge').textContent = 'Teacher · preview';
    return;
  }

  document.getElementById('roleBadge').textContent = 'Student';

  let curriculum = null;
  let verifiedBank = [];
  let track = 'act';
  let section = 'english';
  let skillId = 'act-english';
  let quizQuestions = [];
  let quizIndex = 0;
  let quizAnswers = [];
  let activePeers = [];
  let pendingInvites = new Map();
  let botChatterTimers = [];
  let allStudents = [];

  const chapterList = document.getElementById('chapterList');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chapterTitle = document.getElementById('chapterTitle');
  const subjectLabel = document.getElementById('subjectLabel');
  const quizPanel = document.getElementById('quizPanel');
  const peersRoster = document.getElementById('peersRoster');
  const activePeerList = document.getElementById('activePeerList');
  const activePeersEl = document.getElementById('activePeers');
  const peersOuterPanel = document.getElementById('peersOuterPanel');
  const peersToggle = document.getElementById('peersToggle');
  const peersOuterBody = document.getElementById('peersOuterBody');
  const peersFilter = document.getElementById('peersFilter');
  const onlineBadge = document.getElementById('onlineBadge');

  const curPath = cfg.curriculumPath || '../../data/sat-act-curriculum.json';
  const bankPath = cfg.bankPath || '../../data/sat-act-questions.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    fetch(bankPath)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .catch(() => ({ questions: [] })),
    window.AnyoBots.loadRoster(),
  ])
    .then(([cur, bank, roster]) => {
      curriculum = cur;
      verifiedBank = (bank.questions || []).filter((q) => (q.options || []).length >= 3);
      allStudents = roster.students || [];
      renderIngestBadge();
      renderTrackButtons();
      renderSkills();
      initPresenceAndPeers();
      selectSkill(skillsForSection()[0]?.id || 'act-english');
    })
    .catch(() => {
      chapterList.innerHTML = '<li><em>Could not load curriculum</em></li>';
    });

  function skillsForSection() {
    const t = curriculum?.tracks?.[track];
    const sec = t?.sections?.[section];
    return sec?.skills || [];
  }

  function renderTrackButtons() {
    document.querySelectorAll('[data-track]').forEach((btn) => {
      const on = btn.getAttribute('data-track') === track;
      btn.classList.toggle('active', on);
      btn.style.cssText = on
        ? 'padding:8px;border-radius:10px;border:1px solid rgba(103,232,249,0.4);background:rgba(6,182,212,0.12);color:#67e8f9;cursor:pointer'
        : 'padding:8px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);background:transparent;color:#cbd5e1;cursor:pointer';
    });
    const secRow = document.getElementById('sectionRow');
    if (!secRow || !curriculum?.tracks?.[track]) return;
    secRow.innerHTML = '';
    const sections = curriculum.tracks[track].sections || {};
    Object.entries(sections).forEach(([id, meta]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = meta.label || id;
      b.dataset.section = id;
      if (id === section) b.classList.add('active');
      b.style.cssText =
        id === section
          ? 'padding:6px 10px;border-radius:8px;border:1px solid rgba(103,232,249,0.35);background:rgba(6,182,212,0.1);color:#67e8f9;cursor:pointer;font-size:0.75rem'
          : 'padding:6px 10px;border-radius:8px;border:1px solid rgba(148,163,184,0.2);background:transparent;color:#cbd5e1;cursor:pointer;font-size:0.75rem';
      b.addEventListener('click', () => {
        section = id;
        renderTrackButtons();
        renderSkills();
        const first = skillsForSection()[0];
        if (first) selectSkill(first.id);
      });
      secRow.appendChild(b);
    });
  }

  function renderSkills() {
    chapterList.innerHTML = '';
    skillsForSection().forEach((sk) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sk.title;
      btn.dataset.id = sk.id;
      if (sk.id === skillId) btn.classList.add('active');
      btn.addEventListener('click', () => selectSkill(sk.id));
      li.appendChild(btn);
      chapterList.appendChild(li);
    });
  }

  function selectSkill(id) {
    skillId = id;
    const sk = skillsForSection().find((s) => s.id === id);
    chapterTitle.textContent = sk ? sk.title : id;
    const trackLabel = curriculum?.tracks?.[track]?.label || track.toUpperCase();
    const secLabel = curriculum?.tracks?.[track]?.sections?.[section]?.label || section;
    subjectLabel.textContent = `${trackLabel} · ${secLabel}`;
    renderSkills();
    quizPanel.hidden = true;
    chatMessages.innerHTML = '';
    const avail = filterQuestions({ limit: 99 }).length;
    if (avail > 0) {
      addBubble(
        'tutor',
        `**${chapterTitle.textContent}** — ${avail} official practice item(s) in the bank. Tap **1 sample question**, ask for more, or start **Skill quiz (5)**.`
      );
    } else {
      addBubble(
        'tutor',
        `**${chapterTitle.textContent}** — no verified items with answer keys yet for this skill. Try **ACT English** (official PDF ingested) or check back after the next crawl.`
      );
    }
  }

  function filterQuestions({ limit }) {
    const pool = verifiedBank.filter((q) => {
      const matchTrack = (q.track || '').toLowerCase() === track;
      const matchSec = !section || (q.section || '').toLowerCase() === section;
      const matchSkill = !skillId || (q.chapter || '') === skillId;
      return matchTrack && matchSec && matchSkill;
    });
    return pool.slice(0, limit);
  }

  function toQuizItem(q) {
    return {
      id: q.id,
      prompt: q.question || q.prompt,
      options: q.options || [],
      correctIndex: q.correctIndex != null ? q.correctIndex : q.correct_index,
      source: q.source || 'Official practice',
      answer_verified: q.answer_verified === true,
    };
  }

  function renderIngestBadge() {
    const el = document.getElementById('ingestBadge');
    if (!el) return;
    const n = curriculum?.stats?.total_questions || verifiedBank.length || 0;
    el.textContent = `${n} official practice items (ACT PDFs ingested)`;
    el.hidden = false;
  }

  function addBubble(kind, text, author) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${kind}`;
    if (author) {
      div.innerHTML = `<small style="opacity:0.7">${author}</small><br>` + text.replace(/\*\*(.*?)\*\*/g, '$1');
    } else {
      div.textContent = text.replace(/\*\*(.*?)\*\*/g, '$1');
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function tutorReply(msg) {
    if (window.AnyoTutorIntent.isQuestionFetchIntent(msg)) {
      const limit = window.AnyoTutorIntent.parseQuestionCount(msg);
      const found = filterQuestions({ limit });
      if (found.length === 0) {
        quizPanel.hidden = true;
        return 'No official items for this skill yet — I only use ingested College Board / ACT materials, not invented questions.';
      }
      quizQuestions = found.slice(0, limit).map(toQuizItem);
      quizIndex = 0;
      quizAnswers = [];
      quizPanel.hidden = false;
      renderQuizQuestion();
      return `Showing ${quizQuestions.length} practice item(s) on ${chapterTitle.textContent}.`;
    }
    if (window.AnyoTutorIntent.isExplainOrAnswerIntent(msg)) {
      const q = quizQuestions[quizIndex] || quizQuestions[0];
      if (!q || !q.answer_verified || q.correctIndex == null) {
        return 'Ask for a sample question first. Answer keys are being linked from official scoring guides.';
      }
      const letter = String.fromCharCode(65 + q.correctIndex);
      return `Verified answer: ${letter}. ${q.options[q.correctIndex]}`;
    }
    return 'Try **1 sample question**, **Skill quiz (5)**, or ask e.g. "3 questions on this skill".';
  }

  function handleChatSend() {
    const t = chatInput.value.trim();
    if (!t) return;
    addBubble('student', t);
    chatInput.value = '';
    if (window.AnyoBots.isPersonalQuestion(t)) {
      setTimeout(() => addBubble('tutor', window.AnyoBots.moderationReply()), 300);
      return;
    }
    setTimeout(() => addBubble('tutor', tutorReply(t)), 400);
  }

  function renderQuizQuestion() {
    const q = quizQuestions[quizIndex];
    quizPanel.innerHTML = `<p style="font-size:0.75rem;color:#94a3b8">Q ${quizIndex + 1}/${quizQuestions.length} · ${q.answer_verified ? 'verified' : 'practice'}</p>
      <p style="margin:8px 0 12px;font-weight:500">${String(q.prompt).replace(/\n/g, '<br>')}</p>
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
          quizPanel.innerHTML = `<p style="color:#6ee7b7;font-weight:600">Done: ${score}/${quizQuestions.length}</p>`;
        } else renderQuizQuestion();
      });
      opts.appendChild(b);
    });
  }

  function initPresenceAndPeers() {
    refreshOnlineBadge();
    renderPeersRoster();
    setInterval(() => {
      refreshOnlineBadge();
      renderPeersRoster();
    }, 60000);
    peersFilter?.addEventListener('change', renderPeersRoster);
    peersToggle?.addEventListener('click', () => {
      const collapsed = peersOuterPanel.classList.toggle('collapsed');
      peersToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      peersOuterBody.hidden = collapsed;
    });
  }

  function refreshOnlineBadge() {
    if (!window.AnyoPresence || !onlineBadge) return;
    const counts = window.AnyoPresence.getOnlineCounts(0, 0, {
      totalStudents: 142,
      totalTeachers: 8,
      minStudents: 48,
      timezone: 'America/New_York',
    });
    onlineBadge.hidden = false;
    onlineBadge.textContent = window.AnyoPresence.formatOnlineBadge(counts);
  }

  function renderPeersRoster() {
    if (!peersRoster) return;
    const filter = peersFilter?.value || 'all';
    peersRoster.innerHTML = '';
    allStudents
      .filter((s) => filter === 'all' || (s.subject || '').includes(filter))
      .slice(0, 24)
      .forEach((s) => {
        const li = document.createElement('li');
        li.className = 'peer-row';
        li.innerHTML = `<span>${s.name}</span><small>${s.city || ''}, ${s.country || 'US'}</small>`;
        peersRoster.appendChild(li);
      });
  }

  document.querySelectorAll('[data-track]').forEach((btn) => {
    btn.addEventListener('click', () => {
      track = btn.getAttribute('data-track');
      const sections = Object.keys(curriculum?.tracks?.[track]?.sections || {});
      section = sections[0] || section;
      renderTrackButtons();
      renderSkills();
      const first = skillsForSection()[0];
      if (first) selectSkill(first.id);
    });
  });

  document.getElementById('sendChat').addEventListener('click', handleChatSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleChatSend();
  });
  document.querySelectorAll('[data-prompt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.getAttribute('data-prompt') || '';
      handleChatSend();
    });
  });
  document.getElementById('btnQuiz').addEventListener('click', () => {
    const found = filterQuestions({ limit: 5 });
    if (!found.length) {
      addBubble('tutor', 'No items for this skill yet.');
      return;
    }
    quizQuestions = found.map(toQuizItem);
    quizIndex = 0;
    quizAnswers = [];
    quizPanel.hidden = false;
    renderQuizQuestion();
  });
  document.getElementById('btnBoard').addEventListener('click', () => {
    addBubble('tutor', 'Section mock uses official timing — full ACT English block coming in Practice Test page.');
  });
  document.getElementById('btnInvite').addEventListener('click', () => {
    navigator.clipboard?.writeText(`${location.origin}/portal/education/sat-act/room.html?role=student`);
    addBubble('peer', 'Study room link copied — share with a classmate.', 'System');
  });
})();
