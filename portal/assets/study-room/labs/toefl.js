/**
 * TOEFL iBT Study Lab — Jan 2026 ETS format (reading, listening, speaking, writing).
 * Registers with StudyRoomProvision for english-tests / track=toefl.
 */
(function (global) {
  'use strict';

  const CONTENT_URLS = [
    '/portal/data/toefl-lab-content.json',
    '/portal/assets/study-room/labs/toefl-content.json',
  ];
  let contentCache = null;

  function loadContent() {
    if (contentCache) return Promise.resolve(contentCache);
    let idx = 0;
    function tryNext() {
      const url = CONTENT_URLS[idx];
      if (!url) return Promise.reject(new Error('TOEFL lab content not found'));
      return fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          contentCache = data;
          return data;
        })
        .catch(() => {
          idx += 1;
          return tryNext();
        });
    }
    return tryNext();
  }

  function mdToHtml(text) {
    if (global.MultiTrackStudyMaterial?.mdToHtml) return global.MultiTrackStudyMaterial.mdToHtml(text);
    return String(text || '')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  function sectionData(subjectId) {
    return contentCache?.sections?.[subjectId] || null;
  }

  function renderGuide(container, guideMd) {
    const sec = document.createElement('section');
    sec.className = 'sr-learn-section';
    sec.innerHTML = '<h3>TOEFL iBT · Study guide</h3><div class="sr-learn-body"></div>';
    sec.querySelector('.sr-learn-body').innerHTML = mdToHtml(guideMd);
    container.appendChild(sec);
  }

  function renderMcq(host, questions, onDone) {
    let idx = 0;
    const answers = [];

    function show() {
      const q = questions[idx];
      if (!q) {
        const scored = questions.filter((qq) => qq.correctIndex != null);
        const score = scored.length
          ? answers.filter((a, i) => a === questions[i].correctIndex).length
          : null;
        const msg =
          score != null
            ? `Score: ${score} / ${scored.length}`
            : `${answers.length} answer(s) recorded — compare with official key in ETS PDF`;
        host.innerHTML += `<p style="color:#6ee7b7;font-weight:600;margin-top:16px">${msg}</p>`;
        onDone?.(score, questions.length);
        return;
      }
      host.querySelector('.sr-lab-q-active')?.remove();
      const wrap = document.createElement('div');
      wrap.className = 'sr-lab-q sr-lab-q-active';
      wrap.innerHTML = `<p>Question ${idx + 1} of ${questions.length}</p><p>${q.prompt}</p><div class="sr-lab-opts"></div>`;
      const opts = wrap.querySelector('.sr-lab-opts');
      q.options.forEach((opt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-option';
        b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
        b.addEventListener('click', () => {
          answers.push(i);
          idx += 1;
          show();
        });
        opts.appendChild(b);
      });
      host.appendChild(wrap);
    }
    show();
  }

  function renderReadingLab(host, lab) {
    const panel = document.createElement('div');
    panel.className = 'sr-lab-panel';
    const taskHint =
      lab.taskTypes?.length > 0
        ? `<p class="sr-lab-meta">2026 tasks: ${lab.taskTypes.map((t) => t.task).join(' · ')}</p>`
        : '';
    panel.innerHTML = `<h3>Interactive · Reading</h3>
      <p class="sr-lab-meta">${lab.passageTitle} · ETS Practice Test 1</p>
      ${taskHint}
      <div class="sr-lab-passage"></div>
      <div class="sr-lab-questions"></div>`;
    panel.querySelector('.sr-lab-passage').textContent = lab.passage;
    host.appendChild(panel);
    if (lab.questions?.length) renderMcq(panel.querySelector('.sr-lab-questions'), lab.questions);
  }

  function renderListeningLab(host, lab) {
    const panel = document.createElement('div');
    panel.className = 'sr-lab-panel';
    panel.innerHTML = `<h3>Interactive · Listening</h3>
      <p class="sr-lab-meta">${lab.title}</p>
      <div class="srm-audio-host"></div>
      <label style="font-size:0.75rem;color:#94a3b8;display:block;margin:12px 0 6px">Your notes (optional)</label>
      <textarea class="sr-lab-notes" placeholder="${lab.notesPlaceholder || 'Take notes while listening…'}"></textarea>
      <div class="sr-lab-questions"></div>`;
    host.appendChild(panel);
    global.StudyRoomMedia.mountAudioPlayer(panel.querySelector('.srm-audio-host'), {
      title: '🔊 Listen to the conversation',
      script: lab.script,
      maxListens: 2,
      note: 'Real TOEFL iBT: one listen only. Practice with up to two here.',
    });
    if (lab.questions?.length) renderMcq(panel.querySelector('.sr-lab-questions'), lab.questions);
  }

  function runCountdown(el, seconds, onTick, onDone) {
    let left = seconds;
    el.classList.add('running');
    el.textContent = `⏱ ${left}s`;
    const id = setInterval(() => {
      left -= 1;
      el.textContent = `⏱ ${left}s`;
      onTick?.(left);
      if (left <= 0) {
        clearInterval(id);
        el.classList.remove('running');
        onDone?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }

  /** Jan 2026: Listen and Repeat + Take an Interview */
  function renderSpeakingLab(host, lab) {
    const panel = document.createElement('div');
    panel.className = 'sr-lab-panel';
    panel.innerHTML = `<h3>Interactive · Speaking (mic required)</h3>
      <p class="sr-lab-meta">${lab.context || 'ETS Jan 2026 format: Listen and Repeat · Take an Interview'}</p>`;
    host.appendChild(panel);

    const repeatLines = lab.listenRepeat || [];
    const interviewQs = lab.interviewQuestions || [];
    let phase = 'repeat';
    let lineIdx = 0;
    let qIdx = 0;

    function showRepeat() {
      panel.querySelector('.sr-lab-task-active')?.remove();
      const line = repeatLines[lineIdx];
      if (!line) {
        phase = 'interview';
        qIdx = 0;
        showInterview();
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'sr-lab-task-active';
      wrap.innerHTML = `<h4>Listen and Repeat · ${lineIdx + 1} / ${repeatLines.length}</h4>
        <ol class="sr-lab-task-steps">
          <li>Press <strong>Play line</strong> — hear the trainer once.</li>
          <li>Press <strong>Record repeat</strong> and say the sentence clearly.</li>
          <li>Replay your recording, then continue.</li>
        </ol>
        <p style="font-weight:500;color:#e2e8f0">Trainer: “${line}”</p>
        <div class="sr-lab-actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <button type="button" class="btn-portal btn-portal-ghost btn-play-line">▶ Play line</button>
          <button type="button" class="btn-portal btn-portal-primary btn-record">Record repeat</button>
          <button type="button" class="btn-portal btn-portal-ghost btn-next hidden">Next line →</button>
        </div>
        <div class="srm-mic-host"></div>`;
      panel.appendChild(wrap);

      const micHost = wrap.querySelector('.srm-mic-host');
      wrap.querySelector('.btn-play-line').addEventListener('click', () => {
        global.StudyRoomMedia.speak(line, { rate: 0.92 });
      });
      wrap.querySelector('.btn-record').addEventListener('click', async () => {
        wrap.querySelector('.btn-record').disabled = true;
        try {
          await global.StudyRoomMedia.requestMic();
          global.StudyRoomMedia.mountMicBar(micHost, {
            maxSeconds: 15,
            hint: 'Repeat the trainer line…',
            onRecorded: () => {
              wrap.querySelector('.btn-next').classList.remove('hidden');
            },
          });
          micHost.querySelector('.srm-btn-record')?.click();
        } catch (e) {
          wrap.querySelector('.btn-record').disabled = false;
          alert(e.message || 'Microphone access denied');
        }
      });
      wrap.querySelector('.btn-next').addEventListener('click', () => {
        lineIdx += 1;
        showRepeat();
      });
    }

    function showInterview() {
      panel.querySelector('.sr-lab-task-active')?.remove();
      const q = interviewQs[qIdx];
      if (!q) {
        panel.insertAdjacentHTML(
          'beforeend',
          '<p style="color:#6ee7b7;margin-top:12px">Speaking set complete. Review recordings above.</p>'
        );
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'sr-lab-task-active';
      wrap.innerHTML = `<h4>Take an Interview · ${qIdx + 1} / ${interviewQs.length}</h4>
        <p class="sr-lab-meta">No prep time on the real test — respond spontaneously.</p>
        <p style="font-weight:500;color:#a5f3fc">Interviewer: ${q}</p>
        <div class="sr-lab-timer">Ready</div>
        <div class="sr-lab-actions" style="margin-bottom:12px">
          <button type="button" class="btn-portal btn-portal-primary btn-answer">Start answer</button>
        </div>
        <div class="srm-mic-host"></div>`;
      panel.appendChild(wrap);

      const timerEl = wrap.querySelector('.sr-lab-timer');
      const micHost = wrap.querySelector('.srm-mic-host');
      wrap.querySelector('.btn-answer').addEventListener('click', async () => {
        wrap.querySelector('.btn-answer').disabled = true;
        try {
          await global.StudyRoomMedia.requestMic();
          runCountdown(timerEl, 45, null, () => {
            timerEl.textContent = '✓ Time';
          });
          global.StudyRoomMedia.mountMicBar(micHost, {
            maxSeconds: 45,
            hint: 'Answer the interview question…',
            onRecorded: () => {
              qIdx += 1;
              setTimeout(showInterview, 800);
            },
          });
          micHost.querySelector('.srm-btn-record')?.click();
        } catch (e) {
          wrap.querySelector('.btn-answer').disabled = false;
          alert(e.message || 'Microphone access denied');
        }
      });
    }

    if (repeatLines.length) showRepeat();
    else if (interviewQs.length) showInterview();
    else {
      panel.insertAdjacentHTML('beforeend', '<p class="sr-lab-meta">Speaking tasks will load after PDF ingest.</p>');
    }
  }

  /** Jan 2026: Write an Email + Academic Discussion */
  function renderWritingLab(host, lab) {
    const panel = document.createElement('div');
    panel.className = 'sr-lab-panel';
    const disc = lab.discussion || {};
    const emailMin = lab.emailMinutes || 7;
    const discMin = lab.discussionMinutes || 10;

    panel.innerHTML = `<h3>Interactive · Writing</h3>
      <p class="sr-lab-meta">Write an Email (${emailMin} min) · Academic Discussion (${discMin} min)</p>

      <h4 style="margin-top:16px;color:#e2e8f0">Write an Email</h4>
      <div class="sr-lab-passage">${lab.emailPrompt || 'See ETS Practice Test 1 for the email scenario.'}</div>
      <div class="sr-lab-timer sr-timer-email">Email · ${emailMin}:00</div>
      <textarea class="sr-lab-essay" id="toeflWriteEmail" placeholder="Write a complete email response…"></textarea>

      <h4 style="margin-top:24px;color:#e2e8f0">Write for an Academic Discussion</h4>
      <p style="font-weight:500;color:#a5f3fc">${disc.professorQuestion || ''}</p>
      <p style="font-size:0.85rem;color:#94a3b8"><strong>Student A:</strong> ${disc.studentA || ''}</p>
      <p style="font-size:0.85rem;color:#94a3b8"><strong>Student B:</strong> ${disc.studentB || ''}</p>
      <p style="font-size:0.88rem;color:#cbd5e1">${disc.prompt || 'Write at least 100 words.'}</p>
      <div class="sr-lab-timer sr-timer-disc">Discussion · ${discMin}:00</div>
      <textarea class="sr-lab-essay" id="toeflWriteDisc" placeholder="Write at least 100 words…"></textarea>
      <button type="button" class="btn-portal btn-portal-primary btn-save-writing" style="margin-top:12px">Save draft locally</button>`;

    host.appendChild(panel);

    const tEmail = panel.querySelector('.sr-timer-email');
    const tDisc = panel.querySelector('.sr-timer-disc');
    runCountdown(tEmail, emailMin * 60, (left) => {
      const m = Math.floor(left / 60);
      const s = left % 60;
      tEmail.textContent = `Email · ${m}:${String(s).padStart(2, '0')}`;
    });
    runCountdown(tDisc, discMin * 60, (left) => {
      const m = Math.floor(left / 60);
      const s = left % 60;
      tDisc.textContent = `Discussion · ${m}:${String(s).padStart(2, '0')}`;
    });

    panel.querySelector('.btn-save-writing').addEventListener('click', () => {
      const payload = {
        email: panel.querySelector('#toeflWriteEmail').value,
        discussion: panel.querySelector('#toeflWriteDisc').value,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem('toefl-writing-draft-v2', JSON.stringify(payload));
        panel.querySelector('.btn-save-writing').textContent = '✓ Draft saved';
      } catch {
        panel.querySelector('.btn-save-writing').textContent = 'Could not save';
      }
    });

    try {
      const saved = JSON.parse(localStorage.getItem('toefl-writing-draft-v2') || 'null');
      if (saved?.email) panel.querySelector('#toeflWriteEmail').value = saved.email;
      if (saved?.discussion) panel.querySelector('#toeflWriteDisc').value = saved.discussion;
    } catch {
      /* ignore */
    }
  }

  function renderLabForSection(container, subjectId) {
    const data = sectionData(subjectId);
    if (!data?.lab) return;
    const mode = subjectId.replace('toefl-', '');
    if (mode === 'reading') renderReadingLab(container, data.lab);
    else if (mode === 'listening') renderListeningLab(container, data.lab);
    else if (mode === 'speaking') renderSpeakingLab(container, data.lab);
    else if (mode === 'writing') renderWritingLab(container, data.lab);
  }

  function registerToeflLab() {
    if (!global.StudyRoomProvision) return;

    global.StudyRoomProvision.register({
      id: 'toefl-ibt',
      match: (ctx) => ctx.sku === 'english-tests' && ctx.track === 'toefl',
      sections: {
        'toefl-reading': {
          mode: 'reading',
          learnLabel: 'Learn',
          learnSub: '2026 reading tasks + academic passage',
          practiceLabel: 'Practice',
          practiceSub: 'Passage questions',
        },
        'toefl-listening': {
          mode: 'listening',
          needsAudio: true,
          learnLabel: 'Learn',
          learnSub: 'Conversations + note-taking',
          practiceLabel: 'Practice',
          practiceSub: 'Listen then answer',
        },
        'toefl-speaking': {
          mode: 'speaking',
          needsMic: true,
          learnLabel: 'Learn',
          learnSub: 'Listen & Repeat + Interview',
          practiceLabel: 'Practice',
          practiceSub: 'Mic · repeat & interview',
        },
        'toefl-writing': {
          mode: 'writing',
          learnLabel: 'Learn',
          learnSub: 'Email + academic discussion',
          practiceLabel: 'Practice',
          practiceSub: 'Timed writing workspace',
        },
      },
      renderLearn(container, ctx) {
        return loadContent().then(() => {
          container.innerHTML = '';
          const data = sectionData(ctx.subjectId);
          if (data?.guide) renderGuide(container, data.guide);
          renderLabForSection(container, ctx.subjectId);
        });
      },
      renderPractice(container, ctx) {
        return loadContent().then(() => {
          container.innerHTML = '';
          const data = sectionData(ctx.subjectId);
          if (!data?.lab) {
            container.innerHTML = '<p class="sr-eval-hint">Practice lab not available for this section.</p>';
            return;
          }
          const head = document.createElement('p');
          head.className = 'sr-lab-meta';
          head.textContent = `${ctx.chapterTitle} · ${ctx.sectionLabel} · timed practice`;
          container.appendChild(head);
          renderLabForSection(container, ctx.subjectId);
        });
      },
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerToeflLab);
  } else {
    registerToeflLab();
  }

  global.ToeflStudyLab = { loadContent, registerToeflLab };
})(typeof window !== 'undefined' ? window : globalThis);
