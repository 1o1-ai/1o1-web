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

  if (!session) {
    const banner = document.createElement('p');
    banner.className = 'forum-guest-banner';
    banner.innerHTML =
      'Browsing as guest · <a href="index.html">Sign in (yoga/yoga)</a> to sync grading submissions from Study Room.';
    document.querySelector('.forum-sidebar')?.prepend(banner);
  }

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
    })
    .catch((err) => {
      threadList.innerHTML = `<p class="forum-empty">Could not load forum data. ${esc(String(err.message || err))}</p>`;
      forumStats.textContent = 'Load failed';
    });

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
    if (sub && forumSubject.querySelector(`option[value="${sub}"]`)) {
      forumSubject.value = sub;
      fillChapterFilter();
    }
    if (ch && Array.from(forumChapter.options).some((o) => o.value === ch)) {
      forumChapter.value = ch;
    } else if (ch) {
      forumChapter.value = 'all';
    }
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
    return (forum?.threads || []).filter((t) => {
      if (sub !== 'all' && t.subject !== sub) return false;
      if (ch !== 'all' && t.chapter !== ch) return false;
      return true;
    });
  }

  function renderList() {
    if (!forum) return;
    threadDetail.hidden = true;
    threadList.hidden = false;
    const threads = filteredThreads();
    if (!threads.length) {
      threadList.innerHTML =
        '<p class="forum-empty">No threads match these filters. Try <strong>All</strong> subject and chapter, or pick a chapter from the same subject.</p>';
      return;
    }
    threadList.innerHTML = threads
      .slice(0, 200)
      .map(
        (t) => `<button type="button" class="thread-row${t.tags?.includes('grading_request') ? ' thread-grade' : ''}${t.tags?.includes('voltaic_study') ? ' thread-voltaic' : ''}" data-id="${esc(t.id)}">
          <span class="thread-tag ${t.subject}">${t.subject === 'mathematics' ? 'Math' : 'Sci'}</span>
          ${t.tags?.includes('grading_request') ? '<span class="tag-pred">Grade me</span>' : ''}
          ${t.tags?.includes('voltaic_study') ? '<span class="tag-voltaic">Peer study</span>' : ''}
          <strong>${esc(t.title)}</strong>
          <span class="hint">${t.reply_count || (t.posts || []).length} posts · Class ${t.grade || '10'} · ${esc(t.chapter_title || t.chapter)}</span>
        </button>`
      )
      .join('');
    if (threads.length > 200) {
      threadList.innerHTML += `<p class="forum-empty">Showing first 200 of ${threads.length} threads — narrow filters to see more.</p>`;
    }
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
    document.getElementById('threadMeta').textContent =
      `${t.chapter_title || t.chapter} · ${t.subject} · Class ${t.grade || '10'} · ${(t.posts || []).length} posts`;
    const posts = document.getElementById('threadPosts');
    posts.innerHTML = (t.posts || [])
      .map((p) => {
        const isAsst = p.author_role === 'assistant';
        return `<div class="forum-post ${isAsst ? 'sahadeva' : ''}">
          <div class="post-head">
            <img src="${esc(p.photo || '')}" alt="" width="32" height="32" onerror="this.style.display='none'" />
            <strong>${esc(p.author_name)}</strong>
            ${isAsst ? '<span class="tag-pred">Study Assistant</span>' : ''}
            <span class="hint">${esc(p.location || '')}</span>
          </div>
          <p>${esc(p.body)}</p>
          ${p.disclaimer ? `<p class="disclaimer">${esc(p.disclaimer)}</p>` : ''}
        </div>`;
      })
      .join('');
  }

  document.getElementById('btnBackList')?.addEventListener('click', renderList);

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
