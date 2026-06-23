/**
 * Sahadeva — floating study assistant (CBSE10 forum + study room deep links).
 */
(function (global) {
  'use strict';

  const DISCLAIMER =
    'AI guidance only — not official CBSE marking. Verify with NCERT and your teacher.';
  const CHAT_STORAGE_KEY = 'sahadeva_chat_cbse10_v2';
  const GEOM_STORAGE_KEY = 'sahadeva_panel_geom_v2';

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
      '<section class="sahadeva-panel forum-hidden" id="sahadevaFabPanel" role="dialog" aria-label="Sahadeva study assistant">' +
      '<div class="sahadeva-universe-orbit" id="sahadevaDrag" title="Drag empty ring area to move">' +
      '<div class="sahadeva-orbit-stars" aria-hidden="true"></div>' +
      '<div class="sahadeva-orbit-nebula" aria-hidden="true"></div>' +
      '<div class="sahadeva-orbit-ring sahadeva-orbit-ring-outer" aria-hidden="true"></div>' +
      '<div class="sahadeva-orbit-ring sahadeva-orbit-ring-inner" aria-hidden="true"></div>' +
      '<div class="sahadeva-universe-card">' +
      '<div class="sahadeva-window-chrome" role="toolbar" aria-label="Window controls">' +
      '<button type="button" class="sahadeva-chrome-btn" id="sahadevaFabClose" title="Minimize" aria-label="Minimize">−</button>' +
      '<button type="button" class="sahadeva-chrome-btn" id="sahadevaMaximize" title="Expand" aria-label="Expand">□</button>' +
      '<button type="button" class="sahadeva-chrome-btn" id="sahadevaResize" title="Drag to resize" aria-label="Resize">⤢</button>' +
      '</div>' +
      '<header class="sahadeva-card-head">' +
      '<span class="sahadeva-card-title"><span aria-hidden="true">🛡️</span> Sahadeva</span>' +
      '<small>ManjuLAB · Cosmos tutor</small>' +
      '</header>' +
      '<div class="sahadeva-panel-filters">' +
      '<label>Subject<select id="sahadevaSubject"><option value="all">All</option><option value="science">Science</option><option value="mathematics">Mathematics</option></select></label>' +
      '<label>Chapter<select id="sahadevaChapter"><option value="all">All chapters</option></select></label>' +
      '</div>' +
      '<div class="sahadeva-panel-chat" id="sahadevaFabChat" aria-live="polite"></div>' +
      '<div class="sahadeva-panel-modes" role="tablist">' +
      '<button type="button" class="sahadeva-mode active" data-mode="predict" role="tab">Prediction</button>' +
      '<button type="button" class="sahadeva-mode" data-mode="search" role="tab">Find threads</button>' +
      '</div>' +
      '<form class="sahadeva-panel-form" id="sahadevaFabForm">' +
      '<input type="text" id="sahadevaFabInput" maxlength="400" placeholder="Ask or search discussions…" autocomplete="off" />' +
      '<button type="submit" class="btn-portal btn-portal-primary sahadeva-fab-send">Send</button>' +
      '</form>' +
      '<p class="disclaimer sahadeva-fab-foot">' + esc(DISCLAIMER) + '</p>' +
      '</div></div></section>';

    document.body.appendChild(root);
    document.body.appendChild(panel);

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
    const maximizeBtn = root.querySelector('#sahadevaMaximize');
    const dragHandle = root.querySelector('#sahadevaDrag');

    let open = false;
    let maximized = false;
    let geomBeforeMax = null;
    let mode = 'predict';
    let busy = false;
    let curriculum = null;
    let forumData = null;
    let chatLog = [];

    function defaultGeometry() {
      const size = 460;
      return {
        x: 16,
        y: Math.max(16, window.innerHeight - size - 16),
        w: size,
        h: size,
      };
    }

    function applyGeometry(geom) {
      panel.style.left = geom.x + 'px';
      panel.style.top = geom.y + 'px';
      panel.style.width = geom.w + 'px';
      panel.style.height = geom.h + 'px';
    }

    function readGeometry() {
      return {
        x: panel.offsetLeft,
        y: panel.offsetTop,
        w: panel.offsetWidth,
        h: panel.offsetHeight,
      };
    }

    function saveGeometry() {
      try {
        sessionStorage.setItem(
          GEOM_STORAGE_KEY,
          JSON.stringify({ ...readGeometry(), maximized })
        );
      } catch {
        /* */
      }
    }

    function loadSavedGeometry() {
      try {
        const raw = sessionStorage.getItem(GEOM_STORAGE_KEY);
        if (!raw) {
          applyGeometry(defaultGeometry());
          return;
        }
        const g = JSON.parse(raw);
        if (g.maximized) {
          maximized = true;
          panel.classList.add('sahadeva-panel-maximized');
          const pad = 12;
          applyGeometry({
            x: pad,
            y: pad,
            w: window.innerWidth - pad * 2,
            h: window.innerHeight - pad * 2,
          });
          return;
        }
        applyGeometry({
          x: g.x ?? 16,
          y: g.y ?? 16,
          w: Math.min(window.innerWidth - 24, Math.max(320, g.w || 460)),
          h: Math.min(window.innerHeight - 24, Math.max(320, g.h || 460)),
        });
        if (!maximized) {
          const s = Math.min(panel.offsetWidth, panel.offsetHeight);
          applyGeometry({ x: panel.offsetLeft, y: panel.offsetTop, w: s, h: s });
        }
      } catch {
        applyGeometry(defaultGeometry());
      }
    }

    function toggleMaximize() {
      if (maximized) {
        if (geomBeforeMax) applyGeometry(geomBeforeMax);
        maximized = false;
        panel.classList.remove('sahadeva-panel-maximized');
        maximizeBtn.textContent = '□';
        maximizeBtn.title = 'Expand to full screen';
      } else {
        geomBeforeMax = readGeometry();
        const pad = 12;
        applyGeometry({
          x: pad,
          y: pad,
          w: window.innerWidth - pad * 2,
          h: window.innerHeight - pad * 2,
        });
        maximized = true;
        panel.classList.add('sahadeva-panel-maximized');
        maximizeBtn.textContent = '⊟';
        maximizeBtn.title = 'Restore orbit';
      }
      saveGeometry();
    }

    function bindDrag() {
      let dragMoved = false;
      dragHandle.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.sahadeva-universe-card, button, select, input, a, textarea')) return;
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
        if (maximized) toggleMaximize();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        dragHandle.setPointerCapture(e.pointerId);
        dragHandle.classList.add('sahadeva-dragging');

        const onMove = (ev) => {
          if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
            dragMoved = true;
          }
          const maxX = window.innerWidth - panel.offsetWidth - 8;
          const maxY = window.innerHeight - panel.offsetHeight - 8;
          const x = Math.max(8, Math.min(maxX, startLeft + ev.clientX - startX));
          const y = Math.max(8, Math.min(maxY, startTop + ev.clientY - startY));
          panel.style.left = x + 'px';
          panel.style.top = y + 'px';
        };
        const onUp = () => {
          dragHandle.releasePointerCapture(e.pointerId);
          dragHandle.classList.remove('sahadeva-dragging');
          dragHandle.removeEventListener('pointermove', onMove);
          dragHandle.removeEventListener('pointerup', onUp);
          if (dragMoved) saveGeometry();
        };
        dragHandle.addEventListener('pointermove', onMove);
        dragHandle.addEventListener('pointerup', onUp);
      });
    }

    function bindResize() {
      resizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (maximized) {
          maximized = false;
          panel.classList.remove('sahadeva-panel-maximized');
          maximizeBtn.textContent = '□';
        }
        const startX = e.clientX;
        const startY = e.clientY;
        const startSize = panel.offsetWidth;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        resizeHandle.setPointerCapture(e.pointerId);

        const onMove = (ev) => {
          const delta = Math.max(ev.clientX - startX, ev.clientY - startY);
          const maxSize = Math.min(window.innerWidth - startLeft - 8, window.innerHeight - startTop - 8);
          const size = Math.min(maxSize, Math.max(320, startSize + delta));
          panel.style.width = size + 'px';
          panel.style.height = size + 'px';
        };
        const onUp = () => {
          resizeHandle.releasePointerCapture(e.pointerId);
          resizeHandle.removeEventListener('pointermove', onMove);
          resizeHandle.removeEventListener('pointerup', onUp);
          saveGeometry();
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
        'Pick <strong>Subject</strong> and <strong>Chapter</strong>, then ask or search. Drag the star ring to move; use □ or ⤢ to grow the cosmos window.',
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

      applyForumInPage(subject, chapter, chapter !== 'all' ? '' : message);

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

    launcher.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!open) setOpen(true);
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(false);
    });
    maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximize();
    });

    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    panel.addEventListener('click', (e) => e.stopPropagation());

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

    window.addEventListener('resize', () => {
      if (!maximized) return;
      const pad = 12;
      applyGeometry({
        x: pad,
        y: pad,
        w: window.innerWidth - pad * 2,
        h: window.innerHeight - pad * 2,
      });
    });

    loadSavedGeometry();
    bindDrag();
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
