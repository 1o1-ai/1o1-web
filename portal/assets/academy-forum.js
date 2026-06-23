/**
 * Shared discussion forum loader — reads SKU from body[data-sku] or AnyoAcademyConfig.
 * Read-only access without login; demo session optional for grading threads.
 */
(function () {
  const sku = document.body.dataset.sku || (window.AnyoAcademyConfig && window.AnyoAcademyConfig.detectSku()) || 'cbse10-core';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(sku) : {};
  const forumPath = cfg.forumPath || '../../data/cbse10-forum.json';
  const curriculumPath = cfg.curriculumPath || '../../data/cbse10-curriculum.json';
  const label = cfg.label || 'Academy';
  const session = window.getPortalSession?.();

  let forum = null;
  let curriculum = null;
  const threadList = document.getElementById('threadList');
  const threadDetail = document.getElementById('threadDetail');
  const forumSubject = document.getElementById('forumSubject');
  const forumChapter = document.getElementById('forumChapter');
  const forumStats = document.getElementById('forumStats');

  if (!threadList || !threadDetail) return;

  const getFilters = () => ({
    subject: forumSubject?.value || 'all',
    chapter: forumChapter?.value || 'all',
  });

  function setSearchQuery(q) {
    if (q) threadList.dataset.searchQuery = q;
    else delete threadList.dataset.searchQuery;
    if (forum) renderList();
  }

  function setFilters({ subject, chapter, query }) {
    if (!forumSubject || !forumChapter) return;
    if (subject && forumSubject.querySelector(`option[value="${subject}"]`)) {
      forumSubject.value = subject;
      if (curriculum) fillChapterFilter();
    }
    if (chapter && Array.from(forumChapter.options).some((o) => o.value === chapter)) {
      forumChapter.value = chapter;
    }
    if (query !== undefined) setSearchQuery(query);
    if (forum) renderList();
  }

  window.AcademyForumBridge = {
    getForum: () => forum,
    getCurriculum: () => curriculum,
    getFilters,
    setFilters,
    setSearchQuery,
    openThread,
  };

  if (!session) {
    const banner = document.createElement('p');
    banner.className = 'forum-guest-banner';
    banner.innerHTML =
      'Open forum — no login required. Use <strong>Sahadeva</strong> (bottom left) for predictions or to search threads by topic.';
    document.querySelector('.forum-toolbar')?.prepend(banner);
  }

  if (window.SahadevaAssistant && sku === 'cbse10-core') {
    window.SahadevaAssistant.mountFloating({
      cfg,
      getFilters,
      sku,
      bridge: window.AcademyForumBridge,
    });
  }

  showListView();

  threadList.addEventListener('click', (e) => {
    const row = e.target.closest('.thread-row');
    if (!row) return;
    const id = row.getAttribute('data-thread-id');
    if (id) openThread(id);
  });

  document.getElementById('btnBackList')?.addEventListener('click', (e) => {
    e.preventDefault();
    showListView();
  });

  Promise.all([
    fetch(forumPath).then((r) => {
      if (!r.ok) throw new Error('Forum data HTTP ' + r.status);
      return r.json();
    }),
    fetch(curriculumPath).then((r) => {
      if (!r.ok) throw new Error('Curriculum HTTP ' + r.status);
      return r.json();
    }),
  ])
    .then(([f, cur]) => {
      forum = f;
      curriculum = cur;
      mergeGradingThreads();
      fillChapterFilter();
      applyUrlFilters();
      const pending = (forum.threads || []).filter((t) => t.tags?.includes('grading_request')).length;
      const voltaic = (forum.threads || []).filter((t) => t.tags?.includes('voltaic_study')).length;
      const mockNote = forum.mocked ? ' · mock demo' : '';
      forumStats.textContent =
        `${forum.threads.length} threads${voltaic ? ' · ' + voltaic + ' peer study' : ''}${pending ? ' · ' + pending + ' awaiting grade' : ''} · ${label}${mockNote}`;
      renderList();
      forumSubject.addEventListener('change', () => {
        forumChapter.value = 'all';
        fillChapterFilter();
        renderList();
      });
      forumChapter.addEventListener('change', renderList);

      const threadId = new URLSearchParams(window.location.search).get('thread');
      if (threadId) openThread(threadId);

      if (window.SahadevaAssistant?._notifyCurriculum) {
        window.SahadevaAssistant._notifyCurriculum(curriculum);
      }
    })
    .catch((err) => {
      threadList.innerHTML = `<p class="forum-empty">Could not load forum data. ${esc(String(err.message || err))}</p>`;
      if (forumStats) forumStats.textContent = 'Load failed';
    });

  function showListView() {
    threadList.classList.remove('forum-hidden');
    threadDetail.classList.add('forum-hidden');
    threadDetail.setAttribute('aria-hidden', 'true');
  }

  function showDetailView() {
    threadList.classList.add('forum-hidden');
    threadDetail.classList.remove('forum-hidden');
    threadDetail.setAttribute('aria-hidden', 'false');
    threadDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function normChapter(ch) {
    if (window.CBSE10Shared?.normalizeChapterId) {
      return window.CBSE10Shared.normalizeChapterId(ch);
    }
    return ch === 'environment' ? 'sources-of-energy' : ch;
  }

  function subjectKeys() {
    return (cfg.subjects || []).map((s) => s.id);
  }

  function allChapters() {
    const out = [];
    const keys = subjectKeys().length ? subjectKeys() : Object.keys(curriculum?.subjects || {});
    keys.forEach((sub) => {
      const chs = curriculum?.subjects?.[sub]?.chapters || [];
      chs.forEach((c) => out.push({ ...c, subject: sub }));
    });
    return out;
  }

  function fillChapterFilter() {
    const sub = forumSubject.value;
    const prev = forumChapter.value;
    forumChapter.innerHTML = '<option value="all">All chapters</option>';
    const options = allChapters().filter((c) => sub === 'all' || c.subject === sub);
    options.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.title;
      forumChapter.appendChild(o);
    });
    const valid = prev === 'all' || options.some((c) => c.id === prev);
    forumChapter.value = valid ? prev : 'all';
  }

  function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subject');
    const ch = params.get('chapter');
    const q = params.get('q');
    if (sub && forumSubject.querySelector(`option[value="${sub}"]`)) {
      forumSubject.value = sub;
      fillChapterFilter();
    }
    if (ch && Array.from(forumChapter.options).some((o) => o.value === ch)) {
      forumChapter.value = ch;
    } else if (ch) {
      forumChapter.value = 'all';
    }
    if (q) threadList.dataset.searchQuery = q;
  }

  function searchQuery() {
    return (threadList.dataset.searchQuery || '').trim().toLowerCase();
  }

  function mergeGradingThreads() {
    const extra = window.CBSE10EvalStore?.loadForumGradingThreads?.()?.threads || [];
    if (!extra.length) return;
    const ids = new Set((forum.threads || []).map((t) => t.id));
    extra.forEach((t) => {
      if (!ids.has(t.id)) forum.threads.unshift(t);
    });
  }

  function filteredThreads() {
    const sub = forumSubject.value;
    const ch = forumChapter.value;
    const q = searchQuery();
    const qWords = q ? q.split(/\s+/).filter(Boolean) : [];

    let threads = (forum?.threads || []).filter((t) => {
      if (sub !== 'all' && t.subject !== sub) return false;
      if (ch !== 'all' && normChapter(t.chapter) !== ch) return false;
      return true;
    });

    if (qWords.length) {
      threads = threads
        .map((t) => {
          const title = (t.title || '').toLowerCase();
          const body = (t.posts || []).map((p) => p.body || '').join(' ').toLowerCase();
          let score = 0;
          qWords.forEach((w) => {
            if (title.includes(w)) score += 4;
            if (body.includes(w)) score += 1;
          });
          if (title.includes(q)) score += 6;
          return { t, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.t);
    }

    return threads;
  }

  function renderList() {
    if (!forum) return;
    showListView();
    threadList.innerHTML = '';
    const threads = filteredThreads();
    if (!threads.length) {
      threadList.innerHTML =
        '<p class="forum-empty">No threads match these filters. Try <strong>All</strong> subject and chapter, or pick a chapter from the same subject.</p>';
      return;
    }

    threads.slice(0, 200).forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'thread-row' +
        (t.tags?.includes('grading_request') ? ' thread-grade' : '') +
        (t.tags?.includes('voltaic_study') ? ' thread-voltaic' : '');
      btn.setAttribute('data-thread-id', t.id || '');

      const tag = document.createElement('span');
      tag.className = `thread-tag ${t.subject || ''}`;
      tag.textContent = t.subject === 'mathematics' ? 'Math' : 'Sci';
      btn.appendChild(tag);

      if (t.tags?.includes('grading_request')) {
        const g = document.createElement('span');
        g.className = 'tag-pred';
        g.textContent = 'Grade me';
        btn.appendChild(g);
      }
      if (t.tags?.includes('voltaic_study')) {
        const v = document.createElement('span');
        v.className = 'tag-voltaic';
        v.textContent = 'Peer study';
        btn.appendChild(v);
      }

      const title = document.createElement('strong');
      title.textContent = t.title || 'Untitled thread';
      btn.appendChild(title);

      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = `${t.reply_count || (t.posts || []).length} posts · Class ${t.grade || '10'} · ${t.chapter_title || t.chapter || ''}`;
      btn.appendChild(hint);

      threadList.appendChild(btn);
    });

    if (threads.length > 200) {
      const note = document.createElement('p');
      note.className = 'forum-empty';
      note.textContent = `Showing first 200 of ${threads.length} threads — narrow filters to see more.`;
      threadList.appendChild(note);
    }
  }

  function openThread(id) {
    if (!forum || !id) return;
    const t = forum.threads.find((x) => x.id === id);
    if (!t) {
      threadList.innerHTML = `<p class="forum-empty">Thread not found (${esc(id)}). <button type="button" class="btn-portal btn-portal-ghost" id="forumRetryList">Back to list</button></p>`;
      document.getElementById('forumRetryList')?.addEventListener('click', renderList);
      return;
    }

    showDetailView();
    document.getElementById('threadTitle').textContent = t.title || 'Discussion';
    document.getElementById('threadMeta').textContent =
      `${t.chapter_title || t.chapter} · ${t.subject} · Class ${t.grade || '10'} · ${(t.posts || []).length} posts`;

    const posts = document.getElementById('threadPosts');
    posts.innerHTML = '';
    (t.posts || []).forEach((p) => {
      const isAsst = p.author_role === 'assistant';
      const wrap = document.createElement('div');
      wrap.className = 'forum-post' + (isAsst ? ' sahadeva' : '');

      const head = document.createElement('div');
      head.className = 'post-head';

      if (p.photo) {
        const img = document.createElement('img');
        img.src = p.photo;
        img.alt = '';
        img.width = 32;
        img.height = 32;
        img.onerror = () => {
          img.style.display = 'none';
        };
        head.appendChild(img);
      }

      const name = document.createElement('strong');
      name.textContent = p.author_name || 'Student';
      head.appendChild(name);

      if (isAsst) {
        const badge = document.createElement('span');
        badge.className = 'tag-pred';
        badge.textContent = 'Study Assistant';
        head.appendChild(badge);
      }

      if (p.location) {
        const loc = document.createElement('span');
        loc.className = 'hint';
        loc.textContent = p.location;
        head.appendChild(loc);
      }

      wrap.appendChild(head);

      const body = document.createElement('p');
      body.textContent = p.body || '';
      wrap.appendChild(body);

      if (p.disclaimer) {
        const disc = document.createElement('p');
        disc.className = 'disclaimer';
        disc.textContent = p.disclaimer;
        wrap.appendChild(disc);
      }

      posts.appendChild(wrap);
    });
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
