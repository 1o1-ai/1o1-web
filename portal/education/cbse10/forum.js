(function () {
  if (!window.getPortalSession?.()) {
    location.href = 'index.html';
    return;
  }

  let forum = null;
  let curriculum = null;
  const threadList = document.getElementById('threadList');
  const threadDetail = document.getElementById('threadDetail');
  const forumSubject = document.getElementById('forumSubject');
  const forumChapter = document.getElementById('forumChapter');

  Promise.all([
    fetch('../../data/cbse10-forum.json').then((r) => r.json()),
    fetch('../../data/cbse10-curriculum.json').then((r) => r.json()),
  ]).then(([f, cur]) => {
    forum = f;
    curriculum = cur;
    fillChapterFilter();
    document.getElementById('forumStats').textContent = `${forum.threads.length} threads · CBSE 10 Math & Science only`;
    renderList();
    forumSubject.addEventListener('change', () => {
      fillChapterFilter();
      renderList();
    });
    forumChapter.addEventListener('change', renderList);
  });

  function allChapters() {
    const out = [];
    ['science', 'mathematics'].forEach((sub) => {
      const chs = curriculum.subjects[sub]?.chapters || curriculum.subjects[sub]?.units || [];
      chs.forEach((c) => out.push({ ...c, subject: sub }));
    });
    return out;
  }

  function fillChapterFilter() {
    const sub = forumSubject.value;
    forumChapter.innerHTML = '<option value="all">All chapters</option>';
    allChapters()
      .filter((c) => sub === 'all' || c.subject === sub)
      .forEach((c) => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.title;
        forumChapter.appendChild(o);
      });
  }

  function filteredThreads() {
    return forum.threads.filter((t) => {
      if (forumSubject.value !== 'all' && t.subject !== forumSubject.value) return false;
      if (forumChapter.value !== 'all' && t.chapter !== forumChapter.value) return false;
      return true;
    });
  }

  function renderList() {
    threadDetail.hidden = true;
    threadList.hidden = false;
    const threads = filteredThreads();
    threadList.innerHTML = threads
      .slice(0, 80)
      .map(
        (t) => `<button type="button" class="thread-row" data-id="${t.id}">
          <span class="thread-tag ${t.subject}">${t.subject === 'mathematics' ? 'Math' : 'Sci'}</span>
          <strong>${esc(t.title)}</strong>
          <span class="hint">${t.reply_count || t.posts.length} posts · ${esc(t.chapter_title || t.chapter)}</span>
          ${t.tags?.includes('prediction') ? '<span class="tag-pred">Sahadeva prediction</span>' : ''}
        </button>`
      )
      .join('');
    threadList.querySelectorAll('.thread-row').forEach((btn) => {
      btn.addEventListener('click', () => openThread(btn.dataset.id));
    });
  }

  function openThread(id) {
    const t = forum.threads.find((x) => x.id === id);
    if (!t) return;
    threadList.hidden = true;
    threadDetail.hidden = false;
    document.getElementById('threadTitle').textContent = t.title;
    document.getElementById('threadMeta').textContent = `${t.chapter_title || t.chapter} · ${t.subject} · ${t.posts.length} posts`;
    const posts = document.getElementById('threadPosts');
    posts.innerHTML = t.posts
      .map((p) => {
        const isSah = p.author_role === 'assistant' || p.author_id === 'sahadeva';
        return `<div class="forum-post ${isSah ? 'sahadeva' : ''}">
          <div class="post-head">
            <img src="${p.photo || ''}" alt="" width="32" height="32" onerror="this.style.display='none'" />
            <strong>${esc(p.author_name)}</strong>
            ${isSah ? '<span class="tag-pred">Study Assistant</span>' : ''}
            <span class="hint">${esc(p.location || '')}</span>
          </div>
          <p>${esc(p.body)}</p>
          ${p.disclaimer ? `<p class="disclaimer">${esc(p.disclaimer)}</p>` : ''}
        </div>`;
      })
      .join('');
  }

  document.getElementById('btnBackList').addEventListener('click', renderList);

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
