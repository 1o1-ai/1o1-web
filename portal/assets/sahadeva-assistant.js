/**
 * Sahadeva — floating study assistant (CBSE10 forum + study room deep links).
 */
(function (global) {
  'use strict';

  const DISCLAIMER =
    'AI guidance only — not official CBSE marking. Verify with NCERT and your teacher.';

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

  function forumUrl(subject, chapter, q) {
    const p = new URLSearchParams();
    if (subject && subject !== 'all') p.set('subject', subject);
    if (chapter && chapter !== 'all') p.set('chapter', chapter);
    if (q) p.set('q', q);
    const qs = p.toString();
    return 'forum.html' + (qs ? '?' + qs : '');
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
        if (chTitle.includes(word)) score += 2;
        if (body.includes(word)) score += 1;
      });
      if (title.includes(q)) score += 6;
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

  /** Legacy sidebar mount — delegates to floating widget. */
  function mount(cardEl, getFilters, cfg) {
    mountFloating({ cfg, getFilters, sku: 'cbse10-core' });
    if (cardEl) cardEl.hidden = true;
  }

  /**
   * Bottom-left chatbot: predictions + intelligent thread search.
   * @param {{ cfg?: object, getFilters?: () => object, sku?: string, bridge?: object }} opts
   */
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
      '<section class="sahadeva-fab-panel forum-hidden" id="sahadevaFabPanel" role="dialog" aria-label="Sahadeva study assistant">' +
      '<header class="sahadeva-fab-head">' +
      '<div><strong>Sahadeva</strong><span>ManjuLAB Study Assistant</span></div>' +
      '<button type="button" class="sahadeva-fab-close" id="sahadevaFabClose" aria-label="Close chat">×</button>' +
      '</header>' +
      '<div class="sahadeva-fab-filters">' +
      '<label>Subject<select id="sahadevaSubject"><option value="all">All</option><option value="science">Science</option><option value="mathematics">Mathematics</option></select></label>' +
      '<label>Chapter<select id="sahadevaChapter"><option value="all">All chapters</option></select></label>' +
      '</div>' +
      '<div class="sahadeva-fab-modes" role="tablist">' +
      '<button type="button" class="sahadeva-mode active" data-mode="predict" role="tab" aria-selected="true">Prediction</button>' +
      '<button type="button" class="sahadeva-mode" data-mode="search" role="tab" aria-selected="false">Find threads</button>' +
      '</div>' +
      '<div class="sahadeva-fab-chat" id="sahadevaFabChat" aria-live="polite"></div>' +
      '<form class="sahadeva-fab-form" id="sahadevaFabForm">' +
      '<input type="text" id="sahadevaFabInput" maxlength="400" placeholder="Ask for a prediction or search discussions…" autocomplete="off" />' +
      '<button type="submit" class="btn-portal btn-portal-primary sahadeva-fab-send">Send</button>' +
      '</form>' +
      '<p class="disclaimer sahadeva-fab-foot">' + esc(DISCLAIMER) + '</p>' +
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

    let open = false;
    let mode = 'predict';
    let busy = false;
    let curriculum = null;
    let forumData = null;

    function syncFromForumFilters() {
      const f = getFilters();
      if (f.subject && subjectSel.querySelector(`option[value="${f.subject}"]`)) {
        subjectSel.value = f.subject;
      }
      fillChapterOptions();
      if (f.chapter && Array.from(chapterSel.options).some((o) => o.value === f.chapter)) {
        chapterSel.value = f.chapter;
      }
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

    function fillChapterOptions() {
      const sub = subjectSel.value;
      const prev = chapterSel.value;
      chapterSel.innerHTML = '<option value="all">All chapters</option>';
      const subs = sub === 'all' ? ['science', 'mathematics'] : [sub];
      subs.forEach((s) => {
        const chs = curriculum?.subjects?.[s]?.chapters || [];
        chs.forEach((c) => {
          const o = document.createElement('option');
          o.value = c.id;
          o.textContent = (s === 'science' ? 'Sci' : 'Math') + ' · ' + c.title;
          chapterSel.appendChild(o);
        });
      });
      if (prev !== 'all' && Array.from(chapterSel.options).some((o) => o.value === prev)) {
        chapterSel.value = prev;
      }
    }

    function setOpen(next) {
      open = next;
      panel.classList.toggle('forum-hidden', !open);
      launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.classList.toggle('sahadeva-fab-open', open);
      if (open) {
        syncFromForumFilters();
        input.focus();
      }
    }

    function appendMsg(role, htmlOrText, asHtml) {
      const row = document.createElement('div');
      row.className = 'sahadeva-fab-msg sahadeva-fab-msg-' + role;
      if (asHtml) row.innerHTML = htmlOrText;
      else row.textContent = htmlOrText;
      chat.appendChild(row);
      chat.scrollTop = chat.scrollHeight;
    }

    function appendWelcome() {
      if (chat.childElementCount) return;
      appendMsg(
        'assistant',
        'Hi! Pick a subject and chapter, then ask for a <strong>prediction</strong> or switch to <strong>Find threads</strong> to search discussions.',
        true
      );
    }

    function appendActionLinks(subject, chapter, query) {
      const sub = subject === 'all' ? 'science' : subject;
      const ch = chapter === 'all' ? '' : chapter;
      const discussHref = forumUrl(sub, ch, query || '');
      const studyHref = studyRoomUrl(sub, ch, 'learn');
      appendMsg(
        'actions',
        '<p class="sahadeva-action-lead">Continue your prep:</p>' +
          '<a class="sahadeva-action-link" href="' +
          esc(discussHref) +
          '">💬 View matching discussions</a>' +
          '<a class="sahadeva-action-link sahadeva-action-primary" href="' +
          esc(studyHref) +
          '">📚 Open Study Room (materials)</a>',
        true
      );
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
          ? 'Search discussion threads by topic…'
          : 'e.g. key exam points for this chapter?';
    }

    async function ensureForumData() {
      if (forumData) return forumData;
      if (bridge?.getForum) {
        forumData = bridge.getForum();
        return forumData;
      }
      const path = cfg.forumPath || '/portal/data/cbse10-forum.json';
      const res = await fetch(path);
      if (!res.ok) throw new Error('Forum data HTTP ' + res.status);
      forumData = await res.json();
      return forumData;
    }

    async function ensureCurriculum() {
      if (curriculum) return curriculum;
      if (bridge?.getCurriculum) {
        curriculum = bridge.getCurriculum();
        return curriculum;
      }
      const path = cfg.curriculumPath || '/portal/data/cbse10-curriculum.json';
      const res = await fetch(path);
      if (!res.ok) throw new Error('Curriculum HTTP ' + res.status);
      curriculum = await res.json();
      return curriculum;
    }

    async function handlePredict(message) {
      const { subject, chapter } = currentFilters();
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
      appendMsg('assistant', String(reply).slice(0, 2000));
      appendActionLinks(subject, chapter, message);
    }

    async function handleSearch(message) {
      const { subject, chapter } = currentFilters();
      const forum = await ensureForumData();
      const hits = searchThreads(forum.threads, message, subject, chapter);

      if (!hits.length) {
        appendMsg(
          'assistant',
          'No threads matched. Try broader filters or different keywords — or ask Sahadeva for a prediction instead.'
        );
        appendActionLinks(subject, chapter, message);
        return;
      }

      let html = '<p class="sahadeva-search-lead">Found ' + hits.length + ' discussion(s):</p><ul class="sahadeva-search-list">';
      hits.forEach((t) => {
        const p = new URLSearchParams();
        if (t.subject) p.set('subject', t.subject);
        if (t.chapter) p.set('chapter', normChapter(t.chapter));
        if (message) p.set('q', message);
        if (t.id) p.set('thread', t.id);
        const threadHref = 'forum.html?' + p.toString();
        html +=
          '<li><button type="button" class="sahadeva-thread-hit" data-thread-id="' +
          esc(t.id || '') +
          '">' +
          esc(t.title || 'Untitled') +
          '</button>' +
          '<span class="hint">' +
          esc((t.chapter_title || t.chapter || '') + ' · ' + ((t.posts || []).length || t.reply_count || 0) + ' posts') +
          '</span></li>';
      });
      html += '</ul>';
      appendMsg('assistant', html, true);

      chat.querySelectorAll('.sahadeva-thread-hit').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-thread-id');
          if (bridge?.openThread && id) {
            bridge.openThread(id);
            setOpen(false);
          } else if (id) {
            location.href = forumUrl(subject, chapter, message) + '&thread=' + encodeURIComponent(id);
          }
        });
      });

      appendActionLinks(subject, chapter, message);
    }

    launcher.addEventListener('click', () => setOpen(!open));
    closeBtn.addEventListener('click', () => setOpen(false));

    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.getAttribute('data-mode') || 'predict'));
    });

    subjectSel.addEventListener('change', () => {
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

    ensureCurriculum()
      .then(() => {
        fillChapterOptions();
        syncFromForumFilters();
        appendWelcome();
      })
      .catch(() => appendWelcome());

    if (bridge?.onReady) bridge.onReady({ syncFromForumFilters, setOpen });
  }

  global.SahadevaAssistant = { mount, mountFloating, DISCLAIMER, searchThreads };
})(typeof window !== 'undefined' ? window : globalThis);
