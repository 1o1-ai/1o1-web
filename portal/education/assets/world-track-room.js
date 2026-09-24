/**
 * @deprecated World tracks now use cbse10-room.js via _service-shell/room.html.
 * Kept for reference only — not loaded by generated service pages.
 */
(function () {
  'use strict';

  const SUBJECT_ICONS = { physics: '⚛️', chemistry: '🧪', mathematics: '📐', biology: '🧬' };

  function partsFromPath() {
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('education');
    return {
      country: i >= 0 ? parts[i + 1] : '',
      track: i >= 0 ? parts[i + 2] : '',
    };
  }

  function skuFromPath() {
    const { country, track } = partsFromPath();
    return country && track ? `${country}-${track}` : '';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function mdToHtml(text) {
    if (!text) return '';
    return esc(text)
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  const sku = skuFromPath();
  let curriculum = null;
  let material = null;
  let questions = [];
  let subjectId = '';
  let chapterId = '';
  let evalIndex = 0;
  let revealed = false;

  const phases = {
    subject: document.getElementById('phaseSubject'),
    intent: document.getElementById('phaseIntent'),
    learn: document.getElementById('phaseLearn'),
    evaluate: document.getElementById('phaseEvaluate'),
  };

  function showPhase(name) {
    Object.entries(phases).forEach(([k, el]) => {
      if (el) el.classList.toggle('hidden', k !== name);
    });
  }

  function showError(msg) {
    const el = document.getElementById('srLoadError');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    showPhase('subject');
  }

  function subjectQuestions() {
    return questions.filter((q) => q.subject === subjectId);
  }

  function renderSubjects() {
    const host = document.getElementById('subjectCircles');
    if (!host || !curriculum?.subjects) return;
    const mk = window.AnyoEducationHub?.createSubjectPortalButton;
    host.innerHTML = '';
    Object.values(curriculum.subjects).forEach((sub) => {
      const btn = mk
        ? mk({
            subjectClass: sub.id,
            icon: SUBJECT_ICONS[sub.id] || '📘',
            title: sub.label,
            subtitle: sub.code || sub.id.slice(0, 2).toUpperCase(),
            dataset: { subject: sub.id },
          })
        : (() => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `portal portal--saas sr-subject-circle ${sub.id}`;
            b.dataset.subject = sub.id;
            b.innerHTML = `<div class="portal-ring"></div><div class="portal-orbit"></div><div class="portal-core"><span class="portal-icon">${SUBJECT_ICONS[sub.id] || '📘'}</span><span class="portal-title">${esc(sub.label)}</span><span class="portal-sub"></span></div>`;
            return b;
          })();
      btn.addEventListener('click', () => {
        subjectId = sub.id;
        chapterId = sub.chapters?.[0]?.id || `${sub.id}-foundation`;
        document.getElementById('intentChapterLabel').textContent = sub.chapters?.[0]?.title || sub.label;
        showPhase('intent');
      });
      host.appendChild(btn);
    });
  }

  function renderLearn() {
    const ch = material?.chapters?.[chapterId];
    const root = document.getElementById('learnContent');
    document.getElementById('learnTitle').textContent = ch?.title || 'Study notes';
    if (ch?.studySummary) {
      root.innerHTML = mdToHtml(ch.studySummary);
    } else {
      root.innerHTML = '<p>No study notes yet for this subject. Check back after the next knowledge sync.</p>';
    }
    showPhase('learn');
  }

  function renderEvaluateQuestion() {
    const pool = subjectQuestions();
    const q = pool[evalIndex];
    const chat = document.getElementById('evalChat');
    revealed = false;
    document.getElementById('btnReveal').hidden = false;
    document.getElementById('btnNext').hidden = true;
    if (!q) {
      chat.innerHTML = '<p class="sr-eval-hint">No practice questions for this subject yet.</p>';
      document.getElementById('evalProgress').textContent = '';
      showPhase('evaluate');
      return;
    }
    document.getElementById('evalTitle').textContent = q.prompt || q.question;
    document.getElementById('evalProgress').textContent = `Question ${evalIndex + 1} of ${pool.length}`;
    chat.innerHTML = `<p class="sr-eval-q">${esc(q.prompt || q.question)}</p>`;
    showPhase('evaluate');
  }

  function bindNav() {
    document.getElementById('btnLearn')?.addEventListener('click', renderLearn);
    document.getElementById('btnEvaluate')?.addEventListener('click', (e) => {
      if (window.AnyoAccess && !window.AnyoAccess.canWrite()) {
        window.AnyoAccess.guardWrite(e);
        return;
      }
      evalIndex = 0;
      renderEvaluateQuestion();
    });
    document.getElementById('backToSubject')?.addEventListener('click', () => showPhase('subject'));
    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('intent'));
    document.getElementById('backFromEvaluate')?.addEventListener('click', () => showPhase('intent'));
    document.getElementById('btnReveal')?.addEventListener('click', () => {
      const pool = subjectQuestions();
      const q = pool[evalIndex];
      if (!q || revealed) return;
      revealed = true;
      const chat = document.getElementById('evalChat');
      chat.innerHTML += `<div class="sr-eval-answer"><strong>Answer</strong><div>${mdToHtml(q.open_answer || q.explanation || '')}</div></div>`;
      document.getElementById('btnReveal').hidden = true;
      document.getElementById('btnNext').hidden = evalIndex >= pool.length - 1;
    });
    document.getElementById('btnNext')?.addEventListener('click', () => {
      evalIndex += 1;
      renderEvaluateQuestion();
    });
  }

  async function init() {
    if (!sku) {
      showError('Could not detect curriculum track from URL.');
      return;
    }
    document.body.dataset.sku = sku;
    const titleEl = document.getElementById('roomTitle');
    if (titleEl) titleEl.textContent = `${sku.replace(/-/g, ' ')} · Study Room`;

    try {
      const [curRes, matRes, qRes] = await Promise.all([
        fetch(`/portal/data/${sku}-curriculum.json`, { cache: 'no-store' }),
        fetch(`/portal/data/${sku}-study-material.json`, { cache: 'no-store' }),
        fetch(`/portal/data/${sku}-questions.json`, { cache: 'no-store' }),
      ]);
      if (!curRes.ok) throw new Error(`Missing curriculum (${curRes.status})`);
      curriculum = await curRes.json();
      material = matRes.ok ? await matRes.json() : { chapters: {} };
      const qData = qRes.ok ? await qRes.json() : { questions: [] };
      questions = qData.questions || [];
      renderSubjects();
      bindNav();
      showPhase('subject');
    } catch (err) {
      showError('Could not load study room data. ' + (err.message || err));
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
