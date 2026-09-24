/**
 * World track forum — filters, list/detail views from portal/data *-forum.json
 */
(function () {
  'use strict';

  const SUBJECT_LABELS = {
    physics: 'Physics',
    chemistry: 'Chemistry',
    mathematics: 'Mathematics',
    biology: 'Biology',
  };

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

  const sku = skuFromPath();
  let forum = null;
  let curriculum = null;

  const threadList = document.getElementById('threadList');
  const threadDetail = document.getElementById('threadDetail');
  const forumSubject = document.getElementById('forumSubject');
  const forumChapter = document.getElementById('forumChapter');
  const forumStats = document.getElementById('forumStats');

  if (!threadList || !threadDetail || !sku) return;

  document.body.dataset.sku = sku;

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

  function subjectLabel(id) {
    return curriculum?.subjects?.[id]?.label || SUBJECT_LABELS[id] || id || '';
  }

  function allChapters() {
    const out = [];
    Object.entries(curriculum?.subjects || {}).forEach(([subId, sub]) => {
      (sub.chapters || []).forEach((ch) => {
        out.push({ id: ch.id, title: ch.title, subject: subId });
      });
    });
    return out;
  }

  function fillSubjectFilter() {
    forumSubject.innerHTML = '<option value="all">All</option>';
    Object.values(curriculum?.subjects || {}).forEach((sub) => {
      const o = document.createElement('option');
      o.value = sub.id;
      o.textContent = sub.label || sub.id;
      forumSubject.appendChild(o);
    });
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
    if (sub && forumSubject.querySelector(`option[value="${sub}"]`)) {
      forumSubject.value = sub;
      fillChapterFilter();
    }
    if (ch && Array.from(forumChapter.options).some((o) => o.value === ch)) {
      forumChapter.value = ch;
    }
  }

  function filteredThreads() {
    const sub = forumSubject.value;
    const ch = forumChapter.value;
    return (forum?.threads || []).filter((t) => {
      if (sub !== 'all') {
        if (!t.subject || t.subject !== sub) return false;
      }
      if (ch !== 'all') {
        const threadCh = t.chapter || '';
        if (!threadCh || threadCh !== ch) return false;
      }
      return true;
    });
  }

  function renderList() {
    if (!forum) return;
    showListView();
    threadList.innerHTML = '';
    const threads = filteredThreads();
    if (!threads.length) {
      threadList.innerHTML =
        '<p class="forum-empty">No threads match these filters. Try <strong>All</strong> subject and chapter.</p>';
      return;
    }

    threads.slice(0, 200).forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thread-row' + (t.tags?.includes('grading_request') ? ' thread-grade' : '');
      btn.setAttribute('data-thread-id', t.id || '');

      if (t.subject) {
        const tag = document.createElement('span');
        tag.className = `thread-tag ${t.subject}`;
        tag.textContent = subjectLabel(t.subject).split(' ')[0] || t.subject.slice(0, 4);
        btn.appendChild(tag);
      }

      const title = document.createElement('strong');
      title.textContent = t.title || 'Untitled thread';
      btn.appendChild(title);

      const hint = document.createElement('span');
      hint.className = 'hint';
      const postCount = t.reply_count || (t.posts || []).length;
      const chTitle = t.chapter_title || t.chapter || '';
      const subTitle = t.subject ? subjectLabel(t.subject) : 'General';
      hint.textContent = `${postCount} posts · ${subTitle}${chTitle ? ' · ' + chTitle : ''}`;
      btn.appendChild(hint);

      threadList.appendChild(btn);
    });
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
    const subTitle = t.subject ? subjectLabel(t.subject) : 'General';
    const chTitle = t.chapter_title || t.chapter || '';
    document.getElementById('threadMeta').textContent =
      `${chTitle || subTitle} · ${(t.posts || []).length} posts`;

    const posts = document.getElementById('threadPosts');
    posts.innerHTML = '';
    (t.posts || []).forEach((p) => {
      const isAsst = p.author_role === 'assistant';
      const wrap = document.createElement('div');
      wrap.className = 'forum-post' + (isAsst ? ' sahadeva' : '');

      const head = document.createElement('div');
      head.className = 'post-head';

      const name = document.createElement('strong');
      name.textContent = p.author_name || p.author || 'Student';
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

      posts.appendChild(wrap);
    });
  }

  threadList.addEventListener('click', (e) => {
    const row = e.target.closest('.thread-row');
    if (!row) return;
    const id = row.getAttribute('data-thread-id');
    if (id) openThread(id);
  });

  document.getElementById('btnBackList')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderList();
  });

  forumSubject.addEventListener('change', () => {
    forumChapter.value = 'all';
    fillChapterFilter();
    renderList();
  });
  forumChapter.addEventListener('change', renderList);

  Promise.all([
    fetch(`/portal/data/${sku}-forum.json`, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('Forum data HTTP ' + r.status);
      return r.json();
    }),
    fetch(`/portal/data/${sku}-curriculum.json`, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('Curriculum HTTP ' + r.status);
      return r.json();
    }),
  ])
    .then(([f, cur]) => {
      forum = f;
      curriculum = cur;
      fillSubjectFilter();
      fillChapterFilter();
      applyUrlFilters();

      const trackLabel = cur.displayName || cur.title || sku.replace(/-/g, ' ');
      forumStats.textContent = `${(forum.threads || []).length} threads · ${trackLabel}`;

      renderList();

      const threadId = new URLSearchParams(window.location.search).get('thread');
      if (threadId) openThread(threadId);
    })
    .catch((err) => {
      threadList.innerHTML = `<p class="forum-empty">Could not load forum data. ${esc(String(err.message || err))}</p>`;
      if (forumStats) forumStats.textContent = 'Load failed';
    });
})();
