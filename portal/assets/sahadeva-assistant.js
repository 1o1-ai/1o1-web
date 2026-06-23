/**
 * Sahadeva — floating study assistant (CBSE10 forum + study room deep links).
 */
(function (global) {
  'use strict';

  const DISCLAIMER =
    'AI guidance only — not official CBSE marking. Verify with NCERT and your teacher.';
  const CHAT_STORAGE_KEY = 'sahadeva_chat_cbse10_v2';
  const GEOM_STORAGE_KEY = 'sahadeva_panel_geom_v2';
  const DISPLAY_STORAGE_KEY = 'sahadeva_display_mode_v1';

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

  /** Arc logo: SAHADEVA curved inside top bend + orbiting universe dot. */
  function sahadevaArcMarkSvg(className) {
    const uid = 'sah' + Math.random().toString(36).slice(2, 9);
    const textPath = uid + 'Text';
    const orbitPath = uid + 'Orbit';
    return (
      '<svg class="' +
      className +
      '" viewBox="0 0 128 72" aria-hidden="true" focusable="false">' +
      '<defs>' +
      '<path id="' +
      textPath +
      '" d="M 24 48 A 40 40 0 0 1 104 48"/>' +
      '<path id="' +
      orbitPath +
      '" d="M 6 52 A 58 58 0 0 1 122 52"/>' +
      '<filter id="' +
      uid +
      'Glow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +
      '<path d="M 12 50 A 52 52 0 0 1 116 50" fill="none" stroke="#042f2e" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M 12 50 A 52 52 0 0 1 116 50" fill="none" stroke="#0f766e" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M 14 50 A 50 50 0 0 1 114 50" fill="none" stroke="#14b8a6" stroke-width="8" stroke-linecap="round"/>' +
      '<text fill="#ecfdf5" font-size="9.5" font-weight="700" letter-spacing="0.32em" font-family="system-ui,Segoe UI,sans-serif">' +
      '<textPath href="#' +
      textPath +
      '" startOffset="50%" text-anchor="middle">SAHADEVA</textPath></text>' +
      '<circle r="3.8" fill="#67e8f9" filter="url(#' +
      uid +
      'Glow)">' +
      '<animateMotion dur="16s" repeatCount="indefinite" calcMode="linear">' +
      '<mpath href="#' +
      orbitPath +
      '"/></animateMotion></circle>' +
      '</svg>'
    );
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
      '<button type="button" class="sahadeva-fab-launcher" id="sahadevaFabLauncher" aria-expanded="false" aria-controls="sahadevaFabPanel" aria-label="Open Sahadeva study assistant">' +
      sahadevaArcMarkSvg('sahadeva-fab-mark') +
      '</button>' +
      '<section class="sahadeva-panel forum-hidden sahadeva-display-circular" id="sahadevaFabPanel" role="dialog" aria-label="Sahadeva study assistant">' +
      '<div class="sahadeva-orbit-crown" aria-hidden="true">' +
      sahadevaArcMarkSvg('sahadeva-panel-arc-title') +
      '</div>' +
      '<div class="sahadeva-universe-orbit" id="sahadevaDrag" title="Drag empty ring area to move">' +
      '<div class="sahadeva-orbit-decor" aria-hidden="true">' +
      '<div class="sahadeva-orbit-stars"></div>' +
      '<div class="sahadeva-orbit-nebula"></div>' +
      '<div class="sahadeva-orbit-ring sahadeva-orbit-ring-outer"></div>' +
      '<div class="sahadeva-orbit-ring sahadeva-orbit-ring-inner"></div>' +
      '<div class="sahadeva-orbit-satellite"><span class="sahadeva-universe-dot"></span></div>' +
      '</div>' +
      '<div class="sahadeva-universe-card">' +
      '<div class="sahadeva-window-chrome" role="toolbar" aria-label="Window controls">' +
      '<button type="button" class="sahadeva-chrome-btn" id="sahadevaFabClose" title="Minimize" aria-label="Minimize">−</button>' +
      '<button type="button" class="sahadeva-chrome-btn" id="sahadevaMaximize" title="Expand" aria-label="Expand">□</button>' +
      '<button type="button" class="sahadeva-chrome-btn" id="sahadevaResize" title="Drag to resize" aria-label="Resize">⤢</button>' +
      '</div>' +
      '<header class="sahadeva-card-head">' +
      '<span class="sahadeva-card-title"><span aria-hidden="true">🛡️</span> Sahadeva</span>' +
      '<small>ManjuLAB · Cosmos tutor</small>' +
      '<div class="sahadeva-display-pick" role="group" aria-label="Display style">' +
      '<button type="button" class="sahadeva-display-opt active" data-display="circular" title="Circular orbit window">Orbit</button>' +
      '<button type="button" class="sahadeva-display-opt" data-display="normal" title="Normal rectangular window">Panel</button>' +
      '</div>' +
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
    const launcher = root.querySelector('#sahadevaFabLauncher');
    const panel = root.querySelector('#sahadevaFabPanel');
    document.body.appendChild(panel);

    const closeBtn = panel.querySelector('#sahadevaFabClose');
    const chat = panel.querySelector('#sahadevaFabChat');
    const form = panel.querySelector('#sahadevaFabForm');
    const input = panel.querySelector('#sahadevaFabInput');
    const subjectSel = panel.querySelector('#sahadevaSubject');
    const chapterSel = panel.querySelector('#sahadevaChapter');
    const modeBtns = panel.querySelectorAll('.sahadeva-mode');
    const resizeHandle = panel.querySelector('#sahadevaResize');
    const maximizeBtn = panel.querySelector('#sahadevaMaximize');
    const dragHandle = panel.querySelector('#sahadevaDrag');
    const cardHead = panel.querySelector('.sahadeva-card-head');
    const displayBtns = panel.querySelectorAll('.sahadeva-display-opt');

    let open = false;
    let maximized = false;
    let geomBeforeMax = null;
    let displayMode = 'circular';
    let mode = 'predict';
    let busy = false;
    let curriculum = null;
    let forumData = null;
    let chatLog = [];

    function defaultGeometry(mode) {
      const style = mode || displayMode;
      if (style === 'normal') {
        const w = 380;
        const h = 520;
        return {
          x: 16,
          y: Math.max(16, window.innerHeight - h - 16),
          w,
          h,
        };
      }
      const size = 460;
      return {
        x: 16,
        y: Math.max(16, window.innerHeight - size - 16),
        w: size,
        h: size,
      };
    }

    function isCircular() {
      return displayMode === 'circular';
    }

    function loadDisplayMode() {
      try {
        const raw = sessionStorage.getItem(DISPLAY_STORAGE_KEY);
        if (raw === 'normal' || raw === 'circular') displayMode = raw;
      } catch {
        /* */
      }
      applyDisplayMode(displayMode, false);
    }

    function saveDisplayMode() {
      try {
        sessionStorage.setItem(DISPLAY_STORAGE_KEY, displayMode);
      } catch {
        /* */
      }
    }

    function applyDisplayMode(next, resizePanel) {
      displayMode = next === 'normal' ? 'normal' : 'circular';
      panel.classList.toggle('sahadeva-display-circular', isCircular());
      panel.classList.toggle('sahadeva-display-normal', !isCircular());
      displayBtns.forEach((btn) => {
        const on = btn.getAttribute('data-display') === displayMode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      dragHandle.title = isCircular()
        ? 'Drag empty ring area to move'
        : 'Drag header to move';
      saveDisplayMode();
      if (resizePanel && !maximized) {
        applyGeometry(defaultGeometry());
        saveGeometry();
      }
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
          JSON.stringify({ ...readGeometry(), maximized, display: displayMode })
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
        if (g.display === 'normal' || g.display === 'circular') {
          applyDisplayMode(g.display, false);
        }
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
        const w = Math.min(window.innerWidth - 24, Math.max(320, Number(g.w) || (isCircular() ? 460 : 380)));
        const h = Math.min(window.innerHeight - 24, Math.max(320, Number(g.h) || (isCircular() ? 460 : 520)));
        const x = Math.max(8, Math.min(window.innerWidth - w - 8, Number(g.x) || 16));
        const y = Math.max(8, Math.min(window.innerHeight - h - 8, Number(g.y) || 16));
        if (isCircular()) {
          const size = Math.min(w, h);
          applyGeometry({ x, y, w: size, h: size });
        } else {
          applyGeometry({ x, y, w, h });
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
      const startDrag = (e) => {
        if (isCircular()) {
          if (e.target.closest('.sahadeva-universe-card, button, select, input, a, textarea')) return;
        } else if (!e.target.closest('.sahadeva-card-head') || e.target.closest('button, select, input, a, textarea')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
        if (maximized) toggleMaximize();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        const handle = isCircular() ? dragHandle : cardHead;
        handle.setPointerCapture(e.pointerId);
        handle.classList.add('sahadeva-dragging');

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
          handle.releasePointerCapture(e.pointerId);
          handle.classList.remove('sahadeva-dragging');
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          if (dragMoved) saveGeometry();
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
      };
      dragHandle.addEventListener('pointerdown', startDrag);
      cardHead.addEventListener('pointerdown', startDrag);
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
        const startW = panel.offsetWidth;
        const startH = panel.offsetHeight;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        resizeHandle.setPointerCapture(e.pointerId);

        const onMove = (ev) => {
          const deltaX = ev.clientX - startX;
          const deltaY = ev.clientY - startY;
          const maxW = window.innerWidth - startLeft - 8;
          const maxH = window.innerHeight - startTop - 8;
          if (isCircular()) {
            const delta = Math.max(deltaX, deltaY);
            const size = Math.min(maxW, maxH, Math.max(320, startW + delta));
            panel.style.width = size + 'px';
            panel.style.height = size + 'px';
          } else {
            const w = Math.min(maxW, Math.max(300, startW + deltaX));
            const h = Math.min(maxH, Math.max(360, startH + deltaY));
            panel.style.width = w + 'px';
            panel.style.height = h + 'px';
          }
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
      if (open) {
        const rect = panel.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 100) {
          applyGeometry(defaultGeometry());
          saveGeometry();
        }
      }
      const visible = open && panel.getBoundingClientRect().width >= 100;
      launcher.setAttribute('aria-expanded', visible ? 'true' : 'false');
      root.classList.toggle('sahadeva-fab-open', visible);
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

    displayBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = btn.getAttribute('data-display');
        if (!next || next === displayMode) return;
        applyDisplayMode(next, true);
      });
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

    loadDisplayMode();
    loadSavedGeometry();
    applyDisplayMode(displayMode, false);
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
