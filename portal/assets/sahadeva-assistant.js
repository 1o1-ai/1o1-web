/**
 * Sahadeva — floating study assistant (CBSE10 forum + study room deep links).
 */
(function (global) {
  'use strict';

  const DISCLAIMER =
    'AI guidance only — not official CBSE marking. Verify with NCERT and your teacher.';
  const CHAT_STORAGE_KEY = 'sahadeva_chat_cbse10_v2';
  const SIZE_STORAGE_KEY = 'sahadeva_panel_size_v1';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiBase(cfg) {
    return (cfg && cfg.educationApiBase) || 'https://api.brahmando.com/education';
  }

  function normChapter(ch) {
    if (global.CBSE10Shared?.normalizeChapterId) return global.CBSE10Shared.normalizeChapterId(ch);
    return ch === 'environment' ? 'sources-of-energy' : ch;
  }

  function studyRoomUrl(subject, chapter, intent) {
    const p = new URLSearchParams();
    if (subject && subject !== 'all') p.set('subject', subject);
    if (chapter && chapter !== 'all') p.set('chapter', chapter);
    p.set('intent', intent || 'learn');
    return 'room.html?' + p.toString();
  }

  function resolveChapterFromText(text, cur, subjectHint) {
    if (!cur?.subjects || !text) return null;
    const q = String(text).toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    let best = null;
    let bestScore = 0;
    const subs =
      subjectHint && subjectHint !== 'all' ? [subjectHint] : ['science', 'mathematics'];

    subs.forEach((sub) => {
      (cur.subjects[sub]?.chapters || []).forEach((ch) => {
        const title = (ch.title || '').toLowerCase();
        const id = (ch.id || '').toLowerCase();
        let score = 0;
        if (title === q || id === q.replace(/\s+/g, '-')) score = 120;
        else if (title.includes(q) || q.includes(title)) score = 80;
        words.forEach((w) => {
          if (w.length < 3) return;
          if (title.includes(w)) score += 12;
          if (id.includes(w)) score += 6;
          (ch.keywords || []).forEach((kw) => {
            if (String(kw).toLowerCase().includes(w)) score += 10;
          });
        });
        if (score > bestScore) {
          bestScore = score;
          best = { id: ch.id, subject: sub, title: ch.title };
        }
      });
    });

    return bestScore >= 12 ? best : null;
  }

  function scoreThread(thread, query, subject, chapter) {
    let score = 0;
    const q = (query || '').toLowerCase().trim();
    const title = (thread.title || '').toLowerCase();
    const chTitle = (thread.chapter_title || thread.chapter || '').toLowerCase();
    const body = (thread.posts || []).map((p) => p.body || '').join(' ').toLowerCase();

    if (subject && subject !== 'all' && thread.subject !== subject) return -1;
    if (chapter && chapter !== 'all' && normChapter(thread.chapter) !== chapter) return -1;

    if (!q) {
      score = 1;
    } else {
      q.split(/\s+/).filter(Boolean).forEach((word) => {
        if (title.includes(word)) score += 4;
        if (chTitle.includes(word)) score += 3;
        if (body.includes(word)) score += 1;
      });
      if (title.includes(q)) score += 8;
      if (chTitle.includes(q)) score += 10;
    }
    return score;
  }

  function searchThreads(threads, query, subject, chapter) {
    return (threads || [])
      .map((t) => ({ t, score: scoreThread(t, query, subject, chapter) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.t);
  }

  function mount(cardEl, getFilters, cfg) {
    mountFloating({ cfg, getFilters, sku: 'cbse10-core' });
    if (cardEl) cardEl.hidden = true;
  }

  function mountFloating(opts) {
    if (document.getElementById('sahadevaFabRoot')) return;

    const cfg = opts.cfg || {};
    const sku = opts.sku || 'cbse10-core';
    const getFilters = opts.getFilters || (() => ({}));
    const bridge = opts.bridge || global.AcademyForumBridge || null;

    const root = document.createElement('div');
    root.id = 'sahadevaFabRoot';
    root.className = 'sahadeva-fab-root';
    root.innerHTML =
      '<button type="button" class="sahadeva-fab-launcher" id="sahadevaFabLauncher" aria-expanded="false" aria-controls="sahadevaFabPanel">' +
      '<span class="sahadeva-fab-icon" aria-hidden="true">🛡️</span>' +
      '<span class="sahadeva-fab-label">Sahadeva</span>' +
      '</button>' +
      '<section class="sahadeva-orbit-panel forum-hidden" id="sahadevaFabPanel" role="dialog" aria-label="Sahadeva study assistant">' +
      '<div class="sahadeva-orbit-frame">' +
      '<label class="sahadeva-orbit-filter sahadeva-orbit-subject">Subject' +
      '<select id="sahadevaSubject"><option value="all">All</option><option value="science">Science</option><option value="mathematics">Mathematics</option></select></label>' +
      '<label class="sahadeva-orbit-filter sahadeva-orbit-chapter">Chapter' +
      '<select id="sahadevaChapter"><option value="all">All chapters</option></select></label>' +
      '<div class="sahadeva-orbit-core">' +
      '<div class="sahadeva-orbit-circle">' +
      '<header class="sahadeva-orbit-head"><strong>Sahadeva</strong><span>Study Assistant</span>' +
      '<button type="button" class="sahadeva-fab-close" id="sahadevaFabClose" aria-label="Minimize chat">−</button></header>' +
      '<div class="sahadeva-orbit-chat" id="sahadevaFabChat" aria-live="polite"></div>' +
      '</div></div>' +
      '<div class="sahadeva-orbit-modes" role="tablist">' +
      '<button type="button" class="sahadeva-mode active" data-mode="predict" role="tab">Prediction</button>' +
      '<button type="button" class="sahadeva-mode" data-mode="search" role="tab">Find threads</button>' +
      '</div>' +
      '<form class="sahadeva-orbit-form" id="sahadevaFabForm">' +
      '<input type="text" id="sahadevaFabInput" maxlength="400" placeholder="Ask or search discussions…" autocomplete="off" />' +
      '<button type="submit" class="btn-portal btn-portal-primary sahadeva-fab-send">Send</button>' +
      '</form>' +
      '<p class="disclaimer sahadeva-fab-foot">' + esc(DISCLAIMER) + '</p>' +
      '</div>' +
      '<div class="sahadeva-resize-handle" id="sahadevaResize" title="Drag to resize" aria-hidden="true"></div>' +
      '</section>';

    document.body.appendChild(root);

    const launcher = root.querySelector('#sahadevaFabLauncher');
    const panel = root.querySelector('#sahadevaFabPanel');
    const closeBtn = root.querySelector('#sahadevaFabClose');
    const chat = root.querySelector('#sahadevaFabChat');
    const form = root.querySelector('#sahadevaFabForm');
    const input = root.querySelector('#sahadevaFabInput');
    const subjectSel = root.querySelector('#sahadevaSubject');
    const chapterSel = root.querySelector('#sahadevaChapter');
    const modeBtns = root.querySelectorAll('.sahadeva-mode');
    const resizeHandle = root.querySelector('#sahadevaResize');

    let open = false;
    let mode = 'predict';
    let busy = false;
    let curriculum = null;
    let forumData = null;
    let chatLog = [];

    function loadSavedSize() {
      try {
        const raw = sessionStorage.getItem(SIZE_STORAGE_KEY);
        if (!raw) return;
        const { w, h } = JSON.parse(raw);
        if (w) panel.style.setProperty('--sahadeva-w', w + 'px');
        if (h) panel.style.setProperty('--sahadeva-h', h + 'px');
      } catch {
        /* */
      }
    }

    function saveSize() {
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      sessionStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify({ w, h }));
    }

    function bindResize() {
      let startX = 0;
      let startY = 0;
      let startW = 0;
      let startH = 0;

      resizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startW = panel.offsetWidth;
        startH = panel.offsetHeight;
        resizeHandle.setPointerCapture(e.pointerId);

        const onMove = (ev) => {
          const w = Math.min(520, Math.max(300, startW + (ev.clientX - startX)));
          const h = Math.min(680, Math.max(360, startH + (ev.clientY - startY)));
          panel.style.setProperty('--sahadeva-w', w + 'px');
          panel.style.setProperty('--sahadeva-h', h + 'px');
        };
        const onUp = () => {
          resizeHandle.releasePointerCapture(e.pointerId);
          resizeHandle.removeEventListener('pointermove', onMove);
          resizeHandle.removeEventListener('pointerup', onUp);
          saveSize();
        };
        resizeHandle.addEventListener('pointermove', onMove);
        resizeHandle.addEventListener('pointerup', onUp);
      });
    }

    async function ensureCurriculum() {
      if (curriculum?.subjects) return curriculum;
      const fromBridge = bridge?.getCurriculum?.();
      if (fromBridge?.subjects) {
        curriculum = fromBridge;
        return curriculum;
      }
      const path = cfg.curriculumPath || '/portal/data/cbse10-curriculum.json';
      const res = await fetch(path);
      if (!res.ok) throw new Error('Curriculum HTTP ' + res.status);
      curriculum = await res.json();
      return curriculum;
    }

    function fillChapterOptions() {
      const sub = subjectSel.value;
      const prev = chapterSel.value;
      chapterSel.innerHTML = '<option value="all">All chapters</option>';
      if (!curriculum?.subjects) {
        const hint = document.createElement('option');
        hint.value = 'all';
        hint.textContent = 'Loading chapters…';
        hint.disabled = true;
        chapterSel.appendChild(hint);
        return;
      }
      const subs = sub === 'all' ? ['science', 'mathematics'] : [sub];
      subs.forEach((s) => {
        (curriculum.subjects[s]?.chapters || []).forEach((c) => {
          const o = document.createElement('option');
          o.value = c.id;
          o.textContent = c.title;
          chapterSel.appendChild(o);
        });
      });
      if (prev !== 'all' && Array.from(chapterSel.options).some((o) => o.value === prev)) {
        chapterSel.value = prev;
      }
    }

    function applyFilterValues(subject, chapter) {
      if (subject && subjectSel.querySelector(`option[value="${subject}"]`)) {
        subjectSel.value = subject;
      }
      fillChapterOptions();
      if (chapter && chapter !== 'all' && Array.from(chapterSel.options).some((o) => o.value === chapter)) {
        chapterSel.value = chapter;
      }
      pushToForumFilters();
    }

    function syncFromForumFilters() {
      const f = getFilters();
      applyFilterValues(f.subject || 'all', f.chapter || 'all');
    }

    function pushToForumFilters() {
      if (!bridge?.setFilters) return;
      bridge.setFilters({
        subject: subjectSel.value,
        chapter: chapterSel.value,
      });
    }

    function currentFilters() {
      return {
        subject: subjectSel.value || 'all',
        chapter: chapterSel.value || 'all',
      };
    }

    function inferFiltersFromMessage(message) {
      let { subject, chapter } = currentFilters();
      const resolved = resolveChapterFromText(message, curriculum, subject);
      if (resolved) {
        subject = resolved.subject;
        chapter = resolved.id;
        applyFilterValues(subject, chapter);
      }
      return { subject, chapter, resolved };
    }

    function applyForumInPage(subject, chapter, query) {
      if (bridge?.setFilters) bridge.setFilters({ subject, chapter });
      if (bridge?.setSearchQuery) bridge.setSearchQuery(query || '');
      else if (bridge?.setFilters) bridge.setFilters({ subject, chapter });
      document.querySelector('.forum-content-full')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function openThreadInPage(id, subject, chapter) {
      if (subject || chapter) applyFilterValues(subject || 'all', chapter || 'all');
      if (bridge?.openThread && id) bridge.openThread(id);
      document.querySelector('.forum-content-full')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function persistChat() {
      try {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatLog));
      } catch {
        /* */
      }
    }

    function appendMsg(role, htmlOrText, asHtml) {
      const row = document.createElement('div');
      row.className = 'sahadeva-fab-msg sahadeva-fab-msg-' + role;
      if (asHtml) row.innerHTML = htmlOrText;
      else row.textContent = htmlOrText;
      chat.appendChild(row);
      chat.scrollTop = chat.scrollHeight;
      if (role !== 'typing') {
        chatLog.push({ role, content: htmlOrText, asHtml: !!asHtml });
        persistChat();
      }
      return row;
    }

    function restoreChat() {
      try {
        const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return false;
        chatLog = JSON.parse(raw);
        if (!Array.isArray(chatLog) || !chatLog.length) return false;
        chat.innerHTML = '';
        chatLog.forEach((m) => {
          const row = document.createElement('div');
          row.className = 'sahadeva-fab-msg sahadeva-fab-msg-' + m.role;
          if (m.asHtml) row.innerHTML = m.content;
          else row.textContent = m.content;
          chat.appendChild(row);
        });
        chat.scrollTop = chat.scrollHeight;
        return true;
      } catch {
        chatLog = [];
        return false;
      }
    }

    function appendWelcome() {
      if (chat.childElementCount) return;
      appendMsg(
        'assistant',
        'Pick <strong>Subject</strong> and <strong>Chapter</strong> above the circle, then ask for a prediction or search discussions (e.g. <em>Life Processes</em>).',
        true
      );
    }

    function appendActionLinks(subject, chapter, query) {
      const sub = subject === 'all' ? 'science' : subject;
      const ch = chapter === 'all' ? '' : chapter;
      appendMsg(
        'actions',
        '<p class="sahadeva-action-lead">Continue your prep:</p>' +
          '<button type="button" class="sahadeva-action-link" data-sahadeva-action="forum" data-subject="' +
          esc(sub) +
          '" data-chapter="' +
          esc(ch || 'all') +
          '" data-query="' +
          esc(query || '') +
          '">💬 Filter discussions here</button>' +
          '<a class="sahadeva-action-link sahadeva-action-primary" href="' +
          esc(studyRoomUrl(sub, ch, 'learn')) +
          '" target="_blank" rel="noopener">📚 Study Room materials</a>',
        true
      );
    }

    function setOpen(next) {
      open = next;
      panel.classList.toggle('forum-hidden', !open);
      launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.classList.toggle('sahadeva-fab-open', open);
      if (open) {
        ensureCurriculum().then(() => {
          fillChapterOptions();
          syncFromForumFilters();
        });
        input.focus();
      }
    }

    function setMode(next) {
      mode = next;
      modeBtns.forEach((btn) => {
        const on = btn.getAttribute('data-mode') === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      input.placeholder =
        mode === 'search'
          ? 'Search threads — e.g. Life Processes'
          : 'Ask for a chapter prediction…';
    }

    async function ensureForumData() {
      if (forumData?.threads) return forumData;
      if (bridge?.getForum) {
        const f = bridge.getForum();
        if (f?.threads) {
          forumData = f;
          return forumData;
        }
      }
      const path = cfg.forumPath || '/portal/data/cbse10-forum.json';
      const res = await fetch(path);
      if (!res.ok) throw new Error('Forum data HTTP ' + res.status);
      forumData = await res.json();
      return forumData;
    }

    async function handlePredict(message) {
      const inferred = inferFiltersFromMessage(message);
      const { subject, chapter } = inferred;
      const context = {
        subject: subject === 'mathematics' ? 'Mathematics' : 'Science',
        chapter: chapter && chapter !== 'all' ? chapter : '',
        grade: '10',
        board: 'CBSE',
        sku: sku,
        assistant: 'sahadeva',
      };

      const res = await fetch(apiBase(cfg).replace(/\/$/, '') + '/actors/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ actor: 'student', message: message, context: context }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error('API ' + res.status + ': ' + errText.slice(0, 100));
      }
      const data = await res.json();
      const reply =
        data.answer ||
        data.reply ||
        data.message ||
        data.content ||
        (typeof data === 'string' ? data : '');
      if (inferred.resolved) {
        appendMsg(
          'system',
          'Focused on ' + inferred.resolved.title + ' (' + inferred.resolved.subject + ').',
          false
        );
      }
      appendMsg('assistant', String(reply).slice(0, 2000));
      appendActionLinks(subject, chapter, message);
    }

    async function handleSearch(message) {
      const inferred = inferFiltersFromMessage(message);
      const { subject, chapter } = inferred;
      const forum = await ensureForumData();
      const hits = searchThreads(forum.threads, message, subject, chapter);

      if (inferred.resolved) {
        appendMsg(
          'system',
          'Filtering to chapter: ' + inferred.resolved.title + '.',
          false
        );
      }

      if (!hits.length) {
        appendMsg(
          'assistant',
          'No threads matched. Try selecting Science + chapter from the list above, or broader keywords.'
        );
        appendActionLinks(subject, chapter, message);
        return;
      }

      applyForumInPage(subject, chapter, message);

      let html =
        '<p class="sahadeva-search-lead">Found ' +
        hits.length +
        ' thread(s) — forum list updated behind this chat:</p><ul class="sahadeva-search-list">';
      hits.forEach((t) => {
        html +=
          '<li><button type="button" class="sahadeva-thread-hit" data-sahadeva-action="thread" data-thread-id="' +
          esc(t.id || '') +
          '" data-subject="' +
          esc(t.subject || subject) +
          '" data-chapter="' +
          esc(normChapter(t.chapter)) +
          '">' +
          esc(t.title || 'Untitled') +
          '</button>' +
          '<span class="hint">' +
          esc((t.chapter_title || t.chapter || '') + ' · ' + ((t.posts || []).length || t.reply_count || 0) + ' posts') +
          '</span></li>';
      });
      html += '</ul>';
      appendMsg('assistant', html, true);
      appendActionLinks(subject, chapter, message);
    }

    chat.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sahadeva-action]');
      if (!btn) return;
      e.preventDefault();
      const action = btn.getAttribute('data-sahadeva-action');
      if (action === 'forum') {
        applyForumInPage(
          btn.getAttribute('data-subject') || 'all',
          btn.getAttribute('data-chapter') || 'all',
          btn.getAttribute('data-query') || ''
        );
      } else if (action === 'thread') {
        openThreadInPage(
          btn.getAttribute('data-thread-id'),
          btn.getAttribute('data-subject'),
          btn.getAttribute('data-chapter')
        );
      }
    });

    launcher.addEventListener('click', () => setOpen(!open));
    closeBtn.addEventListener('click', () => setOpen(false));

    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.getAttribute('data-mode') || 'predict'));
    });

    subjectSel.addEventListener('change', async () => {
      chapterSel.value = 'all';
      await ensureCurriculum();
      fillChapterOptions();
      pushToForumFilters();
    });
    chapterSel.addEventListener('change', pushToForumFilters);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = (input.value || '').trim();
      if (!message || busy) return;

      busy = true;
      input.disabled = true;
      appendMsg('user', message);
      input.value = '';
      appendMsg('typing', mode === 'search' ? 'Searching discussions…' : 'Sahadeva is thinking…');

      try {
        await ensureCurriculum();
        if (mode === 'search') await handleSearch(message);
        else await handlePredict(message);
      } catch (err) {
        appendMsg('error', String(err.message || err));
      } finally {
        const typing = chat.querySelector('.sahadeva-fab-msg-typing');
        if (typing) typing.remove();
        busy = false;
        input.disabled = false;
        input.focus();
      }
    });

    loadSavedSize();
    bindResize();
    if (!restoreChat()) appendWelcome();

    ensureCurriculum()
      .then(() => {
        fillChapterOptions();
        syncFromForumFilters();
      })
      .catch(() => {
        /* chapters load on subject pick */
      });

    global.SahadevaAssistant._notifyCurriculum = (cur) => {
      if (cur?.subjects) {
        curriculum = cur;
        fillChapterOptions();
      }
    };
  }

  global.SahadevaAssistant = {
    mount,
    mountFloating,
    DISCLAIMER,
    searchThreads,
    resolveChapterFromText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
