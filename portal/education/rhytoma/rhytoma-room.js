/**
 * Rhytoma Academy study room — shared shell with CBSE10; WBBSE/WBCHSE Science & Math.
 */
(function () {
  const SKU = 'rhytoma-wbbse';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);
  const mocked = !!(cfg.mocked || window.AnyoBots?.isMocked?.());

  const params = new URLSearchParams(location.search);
  const role = params.get('role') || 'student';
  const CURRENT_YEAR = 2026;
  /** 0 = full verified bank (no year window shown to students). */
  const BANK_YEARS = 0;

  const CHAPTER_ALIASES = {
    polynomial: 'polynomials',
    polynomials: 'polynomials',
    algebra: 'algebra',
    geometry: 'geometry',
    trigonometry: 'trigonometry',
    'physical science': 'physical-science',
    'life science': 'life-science',
    physics: 'physics',
    chemistry: 'chemistry',
    biology: 'biology',
    calculus: 'calculus',
  };

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
  let grade = params.get('grade') || '10';
  let subject = 'science';
  let chapterId = 'physical-science';
  let quizQuestions = [];
  let quizIndex = 0;
  let quizAnswers = [];
  let activePeers = [];
  let pendingInvites = new Map();
  let botChatterTimers = [];
  let onlineStudentIds = new Set();
  let allStudents = [];

  const peersRoster = document.getElementById('peersRoster');
  const activePeerList = document.getElementById('activePeerList');
  const activePeersEl = document.getElementById('activePeers');
  const peersOuterPanel = document.getElementById('peersOuterPanel');
  const peersToggle = document.getElementById('peersToggle');
  const peersOuterBody = document.getElementById('peersOuterBody');
  const peersFilter = document.getElementById('peersFilter');
  const onlineBadge = document.getElementById('onlineBadge');

  const curPath = cfg.curriculumPath || '../../data/rhytoma-curriculum.json';
  const bankPath = cfg.bankPath || '../../data/rhytoma-questions.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    fetch(bankPath)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .catch(() => ({ questions: [] })),
    window.AnyoBots.loadRoster(),
  ])
    .then(([cur, bank, roster]) => {
      curriculum = cur;
      verifiedBank = (bank.questions || cur.verifiedQuestions || []).filter(
        (q) => q.answer_verified !== false && (q.correctIndex != null || q.correct_index != null)
      );
      allStudents = roster.students || [];
      initGradeSelector();
      renderIngestBadge();
      renderChapters();
      initPresenceAndPeers();
      const first = chaptersForSubj(subject)[0];
      selectChapter(first?.id || 'physical-science');
      showAlert();
    })
    .catch(() => {
      chapterList.innerHTML = '<li><em>Could not load curriculum</em></li>';
    });

  const chapterList = document.getElementById('chapterList');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chapterTitle = document.getElementById('chapterTitle');
  const subjectLabel = document.getElementById('subjectLabel');
  const quizPanel = document.getElementById('quizPanel');
  const alertBanner = document.getElementById('alertBanner');

  function initPresenceAndPeers() {
    refreshOnlineBadge();
    renderPeersRoster();
    setInterval(() => {
      refreshOnlineBadge();
      renderPeersRoster();
    }, 60000);

    if (onlineBadge) {
      onlineBadge.style.cursor = 'pointer';
      onlineBadge.title = 'Show online participants';
      onlineBadge.setAttribute('role', 'button');
      onlineBadge.tabIndex = 0;
      onlineBadge.addEventListener('click', openPeersPanel);
      onlineBadge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openPeersPanel();
      });
    }

    peersToggle?.addEventListener('click', () => {
      const collapsed = peersOuterPanel.classList.toggle('collapsed');
      peersToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      peersOuterBody.hidden = collapsed;
    });
    peersFilter?.addEventListener('change', renderPeersRoster);
  }

  function openPeersPanel() {
    if (!peersOuterPanel) return;
    peersOuterPanel.classList.remove('collapsed');
    peersOuterBody.hidden = false;
    peersToggle?.setAttribute('aria-expanded', 'true');
    peersOuterPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function refreshOnlineBadge() {
    if (!window.AnyoPresence) return;
    const real = window.AnyoPresence.countRealByRole();
    const counts = window.AnyoPresence.getOnlineCounts(real.students, real.teachers);
    onlineStudentIds = window.AnyoPresence.pickOnlineBotIds(allStudents, counts.studentBotsOnline, 'student');
    if (onlineBadge) {
      onlineBadge.hidden = false;
      const mockNote = mocked ? ' · mock demo' : '';
      onlineBadge.textContent = `${counts.teachersOnline} teachers · ${counts.studentsOnline} students online${mockNote} (IST ${counts.istLabel})`;
    }
    const lbl = document.getElementById('peersToggleLabel');
    if (lbl) lbl.textContent = `${counts.studentsOnline} students online`;
  }

  function renderPeersRoster() {
    if (!peersRoster) return;
    const filter = peersFilter?.value || 'all';
    const inRoom = new Set(activePeers.map((p) => p.id));
    const pending = new Set(pendingInvites.keys());

    const list = allStudents.filter((s) => {
      if (!onlineStudentIds.has(s.id)) return false;
      if (filter === 'all') return true;
      return s.subject === filter || s.subject === 'both';
    });

    peersRoster.innerHTML = '';
    if (!list.length) {
      peersRoster.innerHTML = '<li class="peers-empty"><em>No classmates match this filter right now.</em></li>';
      return;
    }

    list.slice(0, 40).forEach((bot) => {
      const li = document.createElement('li');
      li.className = 'peer-roster-item';
      const busy = inRoom.has(bot.id) || pending.has(bot.id);
      li.innerHTML = `
        <img class="peer-avatar" src="${bot.photo}" alt="" width="36" height="36" loading="lazy" />
        <div class="peer-meta">
          <strong>${window.AnyoBots?.displayName ? window.AnyoBots.displayName(bot) : bot.name}</strong>
          <span class="peer-loc">${bot.city}, ${bot.state}</span>
          <span class="peer-school">${bot.school}</span>
        </div>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-portal btn-portal-ghost peer-invite-btn';
      if (inRoom.has(bot.id)) {
        btn.textContent = 'In room';
        btn.disabled = true;
      } else if (pending.has(bot.id)) {
        btn.textContent = 'Pending…';
        btn.disabled = true;
      } else if (activePeers.length >= window.AnyoBots.MAX_PEERS) {
        btn.textContent = 'Room full';
        btn.disabled = true;
      } else {
        btn.textContent = 'Request join';
        btn.addEventListener('click', () => requestPeerJoin(bot));
      }
      li.appendChild(btn);
      peersRoster.appendChild(li);
    });
  }

  let botLifecycleTimers = [];

  function removePeer(bot) {
    activePeers = activePeers.filter((p) => p.id !== bot.id);
    renderActivePeers();
    renderPeersRoster();
  }

  function onBotLeave(bot, message) {
    removePeer(bot);
    if (message) addBubble('peer', message, bot.name);
    else addBubble('peer', `${bot.name.split(' ')[0]} left the room.`, 'System');
  }

  function renderActivePeers() {
    if (!activePeerList || !activePeersEl) return;
    if (!activePeers.length) {
      activePeersEl.hidden = true;
      return;
    }
    activePeersEl.hidden = false;
    activePeerList.innerHTML = '';
    activePeers.forEach((bot) => {
      const li = document.createElement('li');
      li.innerHTML = `<img src="${bot.photo}" alt="" width="28" height="28" /><span>${bot.name}</span>`;
      activePeerList.appendChild(li);
    });
  }

  function requestPeerJoin(bot) {
    if (activePeers.length >= window.AnyoBots.MAX_PEERS) {
      addBubble('tutor', 'Your study room is full — max 2 classmates at a time.', 'System');
      return;
    }
    pendingInvites.set(bot.id, bot);
    renderPeersRoster();
    addBubble('peer', `Invite sent to ${bot.name} (${bot.city}). Waiting…`, 'You');

    const outcome = window.AnyoBots.simulateInviteResponse(bot);
    const timer = setTimeout(() => {
      pendingInvites.delete(bot.id);
      if (outcome.type === 'accept') {
        if (activePeers.length < window.AnyoBots.MAX_PEERS && !activePeers.find((p) => p.id === bot.id)) {
          activePeers.push(bot);
          addBubble('peer', window.AnyoBots.acceptLine(), bot.name);
          renderActivePeers();
          renderPeersRoster();
          const chatTimers = window.AnyoBots.scheduleBotChatter(
            bot,
            (b, msg) => addBubble('peer', msg, b.name),
            subject
          );
          if (chatTimers) botChatterTimers.push(...chatTimers);
          const leaveT = window.AnyoBots.scheduleBotLeave(bot, onBotLeave);
          if (leaveT) botLifecycleTimers.push(leaveT);
        }
      } else if (outcome.type === 'decline') {
        addBubble('peer', window.AnyoBots.declineLine(), bot.name);
        renderPeersRoster();
      } else {
        addBubble('peer', 'No response — they may be in another session.', 'System');
        renderPeersRoster();
      }
    }, outcome.delay);
    pendingInvites.set(bot.id, { bot, timer });
  }

  function boardForGrade(g) {
    return String(g) === '11' || String(g) === '12' ? 'WBCHSE' : 'WBBSE';
  }

  function initGradeSelector() {
    const sel = document.getElementById('gradeSelect');
    if (!sel) return;
    sel.value = grade;
    sel.addEventListener('change', () => {
      grade = sel.value;
      const first = chaptersForSubj(subject)[0];
      if (first) selectChapter(first.id);
      else renderChapters();
      renderPeersRoster();
    });
  }

  function renderIngestBadge() {
    const stats = curriculum.stats || {};
    const el = document.getElementById('ingestBadge');
    if (!el) return;
    const n = stats.verified_questions || verifiedBank.length || 0;
    el.textContent = `${n} verified questions · ${boardForGrade(grade)} · Class ${grade}`;
    el.hidden = false;
  }

  function chaptersForSubj(sub) {
    const s = curriculum.subjects[sub];
    const all = s?.units || s?.chapters || [];
    return all.filter((ch) => !ch.grades || ch.grades.includes(String(grade)));
  }

  function subjectKey() {
    return subject === 'mathematics' ? 'mathematics' : 'science';
  }

  function resolveChapterId(text) {
    const t = text.toLowerCase();
    for (const [alias, id] of Object.entries(CHAPTER_ALIASES)) {
      if (t.includes(alias)) return id;
    }
    const ch = chaptersForSubj(subject).find(
      (c) => t.includes(c.id.replace(/-/g, ' ')) || t.includes(c.title.toLowerCase())
    );
    return ch ? ch.id : chapterId;
  }

  function filterQuestions({ chapter, yearsBack, limit }) {
    const minYear = yearsBack > 0 ? CURRENT_YEAR - yearsBack : null;
    const subj = subjectKey();
    const pool = verifiedBank.filter((q) => {
      const qSub = (q.subject_slug || q.subject || '').toLowerCase();
      const matchSub =
        qSub === subj ||
        qSub === subject ||
        (subj === 'mathematics' && qSub.includes('math')) ||
        (subj === 'science' && qSub === 'science');
      const matchCh = (q.chapter || '') === chapter;
      const qGrade = q.grade != null ? String(q.grade) : null;
      const matchGrade = !qGrade || qGrade === String(grade);
      const yr = q.exam_year;
      const matchYear =
        minYear == null || (typeof yr === 'number' ? yr >= minYear : true);
      return matchSub && matchCh && matchGrade && matchYear;
    });
    pool.sort((a, b) => (b.exam_year || 0) - (a.exam_year || 0));
    return pool.slice(0, limit);
  }

  function fmt(text) {
    return window.AnyoQuestionFormat ? window.AnyoQuestionFormat.formatMathText(text) : text;
  }

  function fmtOpts(options) {
    return window.AnyoQuestionFormat ? window.AnyoQuestionFormat.formatOptions(options) : options;
  }

  function toQuizItem(q) {
    const prompt = fmt(q.prompt || q.question || q.text);
    const options = fmtOpts(q.options || []);
    return {
      id: q.id,
      prompt,
      options,
      correctIndex: q.correctIndex != null ? q.correctIndex : q.correct_index,
      source: q.source || q.paper_pair_id || `${boardForGrade(grade)} board`,
      exam_year: q.exam_year,
      answer_verified: true,
    };
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
    subjectLabel.textContent = `${subject === 'science' ? 'Science' : 'Mathematics'} · Class ${grade} · ${boardForGrade(grade)}`;
    renderChapters();
    quizPanel.hidden = true;
    chatMessages.innerHTML = '';
    const avail = filterQuestions({ chapter: id, yearsBack: BANK_YEARS, limit: 99 }).length;
    if (avail > 0) {
      addBubble(
        'tutor',
        `**${ch.title}** — ${avail} verified board question(s) ready. Use **1 sample question** below, type how many you want, or start **Chapter quiz**.`
      );
    } else {
      addBubble(
        'tutor',
        `**${ch.title}** — no verified questions in the bank for this chapter yet. Pick another chapter or try the Practice Test tab.`
      );
    }
  }

  function showAlert() {
    alertBanner.hidden = true;
  }

  document.querySelectorAll('[data-subject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setSubject(btn.getAttribute('data-subject'));
      const first = chaptersForSubj(subject)[0];
      if (first) selectChapter(first.id);
    });
  });

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

  function setSubject(sub) {
    subject = sub;
    document.querySelectorAll('[data-subject]').forEach((b) => {
      const on = b.getAttribute('data-subject') === subject;
      b.classList.toggle('active', on);
      b.style.cssText = on
        ? 'padding:8px;border-radius:10px;border:1px solid rgba(103,232,249,0.4);background:rgba(6,182,212,0.12);color:#67e8f9;cursor:pointer'
        : 'padding:8px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);background:transparent;color:#cbd5e1;cursor:pointer';
    });
  }

  function parseQuestionRequest(msg) {
    if (!window.AnyoTutorIntent.isQuestionFetchIntent(msg)) return null;
    const m = msg.toLowerCase();
    const limit = window.AnyoTutorIntent.parseQuestionCount(msg);
    let yearsBack = BANK_YEARS;
    const ym = m.match(/last\s+(\d+)\s+year/);
    if (ym) yearsBack = parseInt(ym[1], 10);
    let ch = chapterId;
    if (m.includes('polynomial')) ch = 'polynomials';
    else ch = resolveChapterId(m) || chapterId;
    if (m.includes('math') || m.includes('polynomial') || m.includes('trigonometry')) {
      setSubject('mathematics');
    } else if (m.includes('science') && !m.includes('math')) {
      setSubject('science');
    }
    return { chapter: ch, yearsBack, limit };
  }

  function explainReply() {
    const q = quizQuestions[quizIndex] || quizQuestions[0];
    if (!q || q.correctIndex == null) {
      quizPanel.hidden = true;
      return (
        'Ask for a verified question first (e.g. "1 question on linear equations"). ' +
        'Then I can show the linked board answer — I won\'t guess.'
      );
    }
    const letter = String.fromCharCode(65 + q.correctIndex);
    const opt = q.options[q.correctIndex];
    quizPanel.hidden = true;
    return (
      `Verified answer (${q.exam_year || 'board'}): ${letter}. ${opt}\n\n` +
      `This is from the ingested marking scheme — not generated. ` +
      `Full step-by-step working needs more solution text from that paper in the archive.`
    );
  }

  function tutorReply(msg) {
    const req = parseQuestionRequest(msg);
    if (req) {
      const found = filterQuestions(req);
      if (found.length === 0) {
        quizPanel.hidden = true;
        const yrNote =
          req.yearsBack > 0 ? ` for the last ${req.yearsBack} years` : '';
        return (
          `No verified ${req.chapter.replace(/-/g, ' ')} questions in the bank${yrNote}. ` +
          `I only use ingested WBBSE/WBCHSE material — I won't make questions up. Try another chapter.`
        );
      }
      const items = found.slice(0, req.limit).map(toQuizItem);
      quizQuestions = items;
      quizIndex = 0;
      quizAnswers = [];
      quizPanel.hidden = false;
      renderQuizQuestion();
      const shown = items.length;
      if (shown < req.limit) {
        return `Showing ${shown} verified question(s) on ${req.chapter.replace(/-/g, ' ')}. Only ${shown} in the bank — not inventing more.`;
      }
      return `Showing ${shown} verified question(s) on ${req.chapter.replace(/-/g, ' ')}.`;
    }

    if (window.AnyoTutorIntent.isExplainOrAnswerIntent(msg)) {
      return explainReply();
    }

    const m = msg.toLowerCase();
    if (m.includes('example')) {
      quizPanel.hidden = true;
      return 'Examples come from your ingested syllabus and board papers for this chapter.';
    }
    quizPanel.hidden = true;
    return (
      'Try **1 sample question** (quick button below), **Chapter quiz (5)**, or ask e.g. "3 questions on this chapter". ' +
      'After a question appears, type **explain** for the verified answer.'
    );
  }

  function handlePeerChat(msg) {
    const peer = window.AnyoTutorIntent.findPeerMention(msg, activePeers);
    if (!peer) return false;

    if (window.AnyoBots.isPersonalQuestion(msg)) {
      setTimeout(() => {
        addBubble('peer', window.AnyoBots.moderationReply(), 'Tutor');
      }, 500);
      return true;
    }

    const reply = window.AnyoBots.peerReply(peer, msg);
    if (reply) {
      setTimeout(() => {
        if (reply.warn) addBubble('tutor', reply.warn, 'Tutor');
        addBubble('peer', reply.text, peer.name);
      }, 600 + Math.random() * 800);
      return true;
    }
    return true;
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
    if (window.AnyoBots.isTimepassChat(t) && !window.AnyoTutorIntent.findPeerMention(t, activePeers)) {
      setTimeout(() => addBubble('tutor', window.AnyoBots.timepassWarning()), 350);
    }
    if (handlePeerChat(t)) return;
    setTimeout(() => addBubble('tutor', tutorReply(t)), 400);
  }
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

  function startQuiz() {
    const found = filterQuestions({ chapter: chapterId, yearsBack: BANK_YEARS, limit: 5 });
    if (found.length === 0) {
      addBubble(
        'tutor',
        `No verified questions for **${chapterTitle.textContent}** yet. Pick another chapter with questions in the bank.`
      );
      return;
    }
    quizQuestions = found.map(toQuizItem);
    quizIndex = 0;
    quizAnswers = [];
    quizPanel.hidden = false;
    renderQuizQuestion();
    addBubble(
      'tutor',
      `Starting quiz: ${quizQuestions.length} verified question(s) on ${chapterTitle.textContent}.` +
        (quizQuestions.length < 5 ? ' (All available — no filler questions.)' : '')
    );
  }

  function renderQuizQuestion() {
    const q = quizQuestions[quizIndex];
    const yr = q.exam_year ? ` · ${q.exam_year}` : '';
    quizPanel.innerHTML = `<p style="font-size:0.75rem;color:#94a3b8">Q ${quizIndex + 1}/${quizQuestions.length}${yr} · verified</p>
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
          quizPanel.innerHTML = `<p style="color:#6ee7b7;font-weight:600">Quiz complete: ${score}/${quizQuestions.length}</p>`;
          addBubble('tutor', `You scored ${score}/${quizQuestions.length} on ${chapterTitle.textContent} (verified bank only).`);
        } else renderQuizQuestion();
      });
      opts.appendChild(b);
    });
  }

  document.getElementById('btnQuiz').addEventListener('click', startQuiz);
  document.getElementById('btnBoard').addEventListener('click', () => {
    addBubble('tutor', 'Board mock draws verified MCQs for the current chapter and subject only — WBBSE/WBCHSE corpus.');
  });
  document.getElementById('btnInvite').addEventListener('click', () => {
    const link = `${location.origin}/portal/education/rhytoma/room.html?role=student&grade=${encodeURIComponent(grade)}`;
    navigator.clipboard?.writeText(link);
    addBubble('peer', 'Study room link copied — share with a real classmate (not for personal contact here).', 'System');
  });
})();
