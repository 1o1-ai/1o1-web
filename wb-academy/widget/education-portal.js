/**
 * ManjuLab CSR Education Portal Widget
 * Allowed ONLY on manjulab.com and *.manjulab.com (e.g. csr.education.manjulab.com)
 *
 * Usage on ManjuLab CSR page:
 *   <script src="https://csr.education.manjulab.com/widget/education-portal.js"
 *           data-api-url="https://csr.education.manjulab.com"
 *           data-embed-key="YOUR_EMBED_KEY"
 *           data-actor="student"
 *           data-theme="light"
 *           data-primary-color="#0d9488"
 *           data-title="Education Portal">
 *   </script>
 */
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[src*="education-portal.js"]');

  const ALLOWED_SUFFIXES = ['manjulab.com', 'brahmando.com'];

  function hostAllowed() {
    const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
    return ALLOWED_SUFFIXES.some(function (suffix) {
      return host === suffix || host.endsWith('.' + suffix);
    });
  }

  if (!hostAllowed()) {
    console.warn('[Education Portal] Embed blocked: only manjulab.com and brahmando.com domains are allowed.');
    return;
  }

  const CONFIG = {
    apiUrl: (script && script.getAttribute('data-api-url')) || 'https://csr.education.manjulab.com',
    embedKey: (script && script.getAttribute('data-embed-key')) || '',
    actor: (script && script.getAttribute('data-actor')) || 'student',
    theme: (script && script.getAttribute('data-theme')) || 'light',
    primaryColor: (script && script.getAttribute('data-primary-color')) || '#0d9488',
    title: (script && script.getAttribute('data-title')) || 'Education Portal',
    position: (script && script.getAttribute('data-position')) || 'bottom-right',
  };

  const ACTORS = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'teacher', label: 'Teacher', icon: '📚' },
    { id: 'school', label: 'School', icon: '🏫' },
    { id: 'coaching_center', label: 'Coaching', icon: '📝' },
  ];

  const SAMPLES = {
    student: [
      'Start a practice test on Class 10 CBSE Science',
      'Which History chapters had the most CBSE questions in the last 5 years?',
      'Generate 5 MCQs on photosynthesis for Class 10 CBSE.',
      'What documents do I need before FAFSA?',
    ],
    teacher: [
      'Set up a dummy NEET Mathematics questionnaire with 15 MCQs.',
      'Create a 45-min Grade 8 lesson on ecosystems with SWAN activities.',
    ],
    school: [
      'Allocate hours for Class 11 Physics chapter Sound — 4 weeks, 5 periods/week.',
      'Plan CBSE Class 10 Science term schedule with revision blocks.',
    ],
    coaching_center: [
      'Create a 60-minute mock test for Class 7 CBSE Science.',
      'Design a diagnostic paper for Class 12 Physics Electrostatics.',
    ],
  };

  let isOpen = false;
  let currentActor = CONFIG.actor;
  let isTyping = false;

  const root = document.createElement('div');
  root.id = 'ml-education-portal-root';
  document.body.appendChild(root);

  const shadow = root.attachShadow({ mode: 'open' });
  const primary = CONFIG.primaryColor;

  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
      .fab {
        position: fixed; ${CONFIG.position.includes('left') ? 'left:20px' : 'right:20px'}; bottom: 20px;
        width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
        background: ${primary}; color: #fff; font-size: 24px; box-shadow: 0 4px 14px rgba(0,0,0,.2); z-index: 99999;
      }
      .panel {
        display: none; position: fixed; ${CONFIG.position.includes('left') ? 'left:20px' : 'right:20px'}; bottom: 86px;
        width: min(400px, calc(100vw - 32px)); height: 520px; background: #fff; border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,.18); flex-direction: column; overflow: hidden; z-index: 99999;
      }
      .panel.open { display: flex; }
      .header { background: ${primary}; color: #fff; padding: 14px 16px; font-weight: 600; }
      .actors { display: flex; gap: 6px; padding: 8px; background: #f0fdfa; flex-wrap: wrap; }
      .actor-btn {
        flex: 1; min-width: 70px; padding: 6px 4px; border: 1px solid #99f6e4; border-radius: 8px;
        background: #fff; cursor: pointer; font-size: 11px; text-align: center;
      }
      .actor-btn.active { background: ${primary}; color: #fff; border-color: ${primary}; }
      .messages { flex: 1; overflow-y: auto; padding: 12px; background: #fafafa; }
      .msg { margin-bottom: 10px; max-width: 92%; padding: 10px 12px; border-radius: 12px; font-size: 13px; line-height: 1.45; white-space: pre-wrap; }
      .msg.user { margin-left: auto; background: ${primary}; color: #fff; }
      .msg.bot { background: #fff; border: 1px solid #e2e8f0; color: #1e293b; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 8px; }
      .chip { font-size: 11px; padding: 6px 10px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
      .practice-launch {
        margin: 0 12px 8px; padding: 10px 14px; border-radius: 12px; border: 1px dashed #99f6e4;
        background: linear-gradient(135deg, #f0fdfa, #ecfdf5); cursor: pointer; font-size: 12px;
        font-weight: 600; color: #0f766e; text-align: center; display: none;
      }
      .practice-launch:hover { border-color: ${primary}; background: #ccfbf1; }
      .input-row { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #e2e8f0; background: #fff; }
      .input-row input { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 13px; }
      .input-row button { background: ${primary}; color: #fff; border: none; border-radius: 8px; padding: 0 14px; cursor: pointer; }
      .typing { font-size: 12px; color: #64748b; padding: 0 12px 8px; }
    </style>
    <button class="fab" type="button" aria-label="Open Education Portal">🎓</button>
    <div class="panel">
      <div class="header">${CONFIG.title} · ManjuLab CSR</div>
      <div class="actors"></div>
      <div class="messages"></div>
      <div class="typing" style="display:none">Thinking…</div>
      <button type="button" class="practice-launch">📝 Open Practice Test (CBSE · NEET)</button>
      <div class="chips"></div>
      <div class="input-row">
        <input type="text" placeholder="Ask as student, teacher, school…" />
        <button type="button">Send</button>
      </div>
    </div>
  `;

  const fab = shadow.querySelector('.fab');
  const panel = shadow.querySelector('.panel');
  const messagesEl = shadow.querySelector('.messages');
  const chipsEl = shadow.querySelector('.chips');
  const actorsEl = shadow.querySelector('.actors');
  const input = shadow.querySelector('input');
  const sendBtn = shadow.querySelector('.input-row button');
  const typingEl = shadow.querySelector('.typing');
  const practiceLaunchBtn = shadow.querySelector('.practice-launch');

  ACTORS.forEach(function (a) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'actor-btn' + (a.id === currentActor ? ' active' : '');
    btn.textContent = a.icon + ' ' + a.label;
    btn.dataset.actor = a.id;
    btn.onclick = function () {
      currentActor = a.id;
      shadow.querySelectorAll('.actor-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.actor === currentActor);
      });
      renderChips();
    };
    actorsEl.appendChild(btn);
  });

  function renderChips() {
    practiceLaunchBtn.style.display = currentActor === 'student' ? 'block' : 'none';
    chipsEl.innerHTML = '';
    (SAMPLES[currentActor] || []).forEach(function (q) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.textContent = q.length > 48 ? q.slice(0, 45) + '…' : q;
      c.title = q;
      c.onclick = function () { input.value = q; send(); };
      chipsEl.appendChild(c);
    });
  }

  function addMsg(text, role) {
    const d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = text;
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function extractReply(data) {
    return data.answer || data.analysis || data.content || data.plan || data.lesson_plan || data.matches || data.plan || JSON.stringify(data, null, 2);
  }

  var scriptSrc = (script && script.src) || '';
  var widgetBase = scriptSrc.replace(/education-portal\.js(\?.*)?$/, '');

  function looksLikePracticeTest(text) {
    var m = text.toLowerCase();
    return ['practice test', 'practice paper', 'mock test', 'test me', 'quiz me', 'sample questions', 'give me questions'].some(function (k) {
      return m.indexOf(k) >= 0;
    });
  }

  function practicePageUrl(defaults) {
    defaults = defaults || {};
    var base = widgetBase + 'practice-test.html';
    var q = new URLSearchParams();
    if (CONFIG.apiUrl) q.set('api', CONFIG.apiUrl.replace(/\/$/, ''));
    if (CONFIG.embedKey) q.set('embed_key', CONFIG.embedKey);
    if (defaults.track) q.set('track', defaults.track);
    if (defaults.grade) q.set('grade', String(defaults.grade));
    if (defaults.subject) q.set('subject', defaults.subject);
    if (defaults.topic) q.set('topic', defaults.topic);
    if (defaults.count) q.set('count', String(defaults.count));
    if (defaults.board === 'NEET') q.set('track', 'neet');
    var qs = q.toString();
    return base + (qs ? '?' + qs : '');
  }

  function openPracticePage(defaults) {
    window.open(practicePageUrl(defaults), '_blank', 'noopener,noreferrer');
  }

  function handleActorResponse(data, userText) {
    if (currentActor === 'student' && (data.action === 'open_practice_page' || data.action === 'open_practice_panel')) {
      addMsg(data.answer || 'Opening Practice Test in a new tab…', 'bot');
      openPracticePage(data.practice_defaults || {});
      return;
    }
    if (currentActor === 'student' && looksLikePracticeTest(userText) && !data.action) {
      addMsg(extractReply(data), 'bot');
      openPracticePage({});
      return;
    }
    addMsg(extractReply(data), 'bot');
  }

  async function send() {
    const text = (input.value || '').trim();
    if (!text || isTyping) return;
    input.value = '';
    addMsg(text, 'user');
    isTyping = true;
    typingEl.style.display = 'block';

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (CONFIG.embedKey) headers['X-Education-Embed-Key'] = CONFIG.embedKey;

      const res = await fetch(CONFIG.apiUrl.replace(/\/$/, '') + '/actors/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ actor: currentActor, message: text, context: {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      handleActorResponse(data, text);
    } catch (e) {
      addMsg('Sorry, could not reach Education Portal. ' + (e.message || ''), 'bot');
    } finally {
      isTyping = false;
      typingEl.style.display = 'none';
    }
  }

  fab.onclick = function () {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen && !messagesEl.children.length) {
      addMsg('Hi! I am the ManjuLab CSR Education Portal. Pick your role above and ask about CBSE exams, FAFSA, lesson plans, or mock tests.', 'bot');
      renderChips();
    }
  };
  sendBtn.onclick = send;
  input.onkeydown = function (e) { if (e.key === 'Enter') send(); };
  practiceLaunchBtn.onclick = function () {
    addMsg('Opening Practice Test in a new tab…', 'bot');
    openPracticePage({});
  };

  renderChips();
})();
