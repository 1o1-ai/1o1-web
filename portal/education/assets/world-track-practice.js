/**
 * World track practice — subject drill from portal/data *-questions.json
 * Loaded via anyo-education-bootstrap (after DOMContentLoaded), so init must not wait on that event.
 */
(function () {
  'use strict';

  function skuFromPath() {
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('education');
    return i >= 0 && parts[i + 1] && parts[i + 2] ? `${parts[i + 1]}-${parts[i + 2]}` : '';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function runWhenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  const sku = skuFromPath();
  const urlParams = new URLSearchParams(window.location.search);
  const urlSubject = urlParams.get('subject') || '';
  const urlCount = Math.max(1, Math.min(50, parseInt(urlParams.get('count') || '5', 10) || 5));
  const isExtended = urlParams.get('mode') === 'extended';

  let subjects = [];
  let questions = [];
  let pool = [];
  let idx = 0;
  let revealed = false;

  async function loadCurriculumSubjects() {
    if (!sku) return [];
    const res = await fetch(`/portal/data/${sku}-curriculum.json`, { cache: 'no-store' });
    if (!res.ok) return [];
    const cur = await res.json();
    return Object.entries(cur.subjects || {}).map(([key, s]) => ({
      id: s?.id || key,
      label: s?.label || s?.id || key,
    }));
  }

  function countForSubject(subjectId) {
    return questions.filter((q) => String(q.subject || '') === subjectId).length;
  }

  async function init() {
    const statsEl = document.getElementById('prStats');
    const sel = document.getElementById('prSubject');
    const startBtn = document.getElementById('btnStart');
    if (!sel || !startBtn) return;

    if (!sku) {
      if (statsEl) statsEl.textContent = 'Could not detect curriculum track from the URL.';
      return;
    }

    subjects = await loadCurriculumSubjects();
    if (!subjects.length) {
      subjects = [
        { id: 'physics', label: 'Physics' },
        { id: 'chemistry', label: 'Chemistry' },
        { id: 'mathematics', label: 'Mathematics' },
        { id: 'biology', label: 'Biology' },
      ];
    }

    const res = await fetch(`/portal/data/${sku}-questions.json`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      questions = data.questions || [];
    }

    sel.innerHTML = '';
    subjects.forEach((s) => {
      const n = countForSubject(s.id);
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = n ? `${s.label} (${n})` : `${s.label} (0)`;
      o.disabled = n === 0;
      sel.appendChild(o);
    });

    const firstWithQs = subjects.find((s) => countForSubject(s.id) > 0);
    if (urlSubject && subjects.some((s) => s.id === urlSubject && countForSubject(s.id) > 0)) {
      sel.value = urlSubject;
    } else if (firstWithQs) {
      sel.value = firstWithQs.id;
    }

    const trackLabel = sku.replace(/-/g, ' ');
    const modeHint = isExtended ? 'Extended drill' : 'Subject drill';
    if (statsEl) {
      statsEl.textContent = questions.length
        ? `Practice ready for ${trackLabel} · ${modeHint}.`
        : `Practice bank for ${trackLabel} is being prepared. Check back after the next knowledge sync.`;
    }

    if (isExtended) {
      const note = document.querySelector('.portal-note');
      if (note) {
        note.textContent =
          'Extended mock-style drill from ingested knowledge — timed pacing recommended.';
      }
      const h1 = document.querySelector('.portal-header h1');
      if (h1 && /practice/i.test(h1.textContent || '')) {
        h1.textContent = 'Mock Test';
      }
    }

    startBtn.addEventListener('click', startDrill);
    document.getElementById('btnReveal')?.addEventListener('click', reveal);
    document.getElementById('btnNext')?.addEventListener('click', next);

    if (urlSubject && urlParams.has('count') && countForSubject(sel.value) > 0) {
      startDrill();
    }
  }

  function startDrill() {
    const sub = document.getElementById('prSubject')?.value;
    const all = questions.filter((q) => String(q.subject || '') === sub);
    pool = shuffle(all).slice(0, urlCount);
    idx = 0;
    revealed = false;
    document.getElementById('prActive')?.classList.remove('hidden');
    showQ();
  }

  function showQ() {
    const q = pool[idx];
    revealed = false;
    const revealBtn = document.getElementById('btnReveal');
    const nextBtn = document.getElementById('btnNext');
    if (revealBtn) revealBtn.hidden = false;
    if (nextBtn) {
      nextBtn.hidden = true;
      nextBtn.textContent = 'Next';
    }
    if (!q) {
      document.getElementById('prQuestion').textContent = 'No questions for this subject yet.';
      document.getElementById('prBody').innerHTML =
        '<p class="sr-eval-hint">Pick another subject, or open Study Room → Q &amp; A Practice for chapter drills.</p>';
      return;
    }
    document.getElementById('prQuestion').textContent = `Question ${idx + 1} of ${pool.length}`;
    const prompt = q.prompt || q.question || '';
    let body = `<p>${esc(prompt)}</p>`;
    if (Array.isArray(q.options) && q.options.length) {
      body += `<ul class="sr-learn-list">${q.options
        .map((opt, i) => `<li><strong>${String.fromCharCode(65 + i)}.</strong> ${esc(opt)}</li>`)
        .join('')}</ul>`;
    }
    document.getElementById('prBody').innerHTML = body;
  }

  function answerText(q) {
    if (!q) return '';
    if (Array.isArray(q.options) && q.options.length && q.correct_index != null) {
      const i = Number(q.correct_index);
      if (i >= 0 && i < q.options.length) {
        return `${String.fromCharCode(65 + i)}. ${q.options[i]}`;
      }
    }
    return q.open_answer || q.explanation || q.answer || '';
  }

  function reveal() {
    const q = pool[idx];
    if (!q || revealed) return;
    revealed = true;
    const ans = answerText(q);
    document.getElementById('prBody').innerHTML += `<div class="sr-eval-answer"><strong>Answer</strong><p>${esc(
      ans || 'Answer not available for this item.'
    )}</p></div>`;
    const revealBtn = document.getElementById('btnReveal');
    const nextBtn = document.getElementById('btnNext');
    if (revealBtn) revealBtn.hidden = true;
    if (nextBtn) {
      const last = idx >= pool.length - 1;
      nextBtn.hidden = false;
      nextBtn.textContent = last ? 'Finish' : 'Next';
    }
  }

  function next() {
    if (idx >= pool.length - 1) {
      document.getElementById('prQuestion').textContent = 'Drill complete';
      document.getElementById('prBody').innerHTML =
        `<p class="sr-eval-hint">You finished ${pool.length} question(s). Start another drill or open <strong>Exam Center</strong> for a longer mock.</p>`;
      document.getElementById('btnReveal').hidden = true;
      document.getElementById('btnNext').hidden = true;
      return;
    }
    idx += 1;
    showQ();
  }

  runWhenReady(init);
})();
