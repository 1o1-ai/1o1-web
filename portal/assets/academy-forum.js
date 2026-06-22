/**
 * Shared discussion forum loader — reads SKU from body[data-sku] or AnyoAcademyConfig.
 */
(function () {
  if (!window.getPortalSession?.()) {
    location.href = 'index.html';
    return;
  }

  const sku = document.body.dataset.sku || (window.AnyoAcademyConfig && window.AnyoAcademyConfig.detectSku()) || 'cbse10-core';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(sku) : {};
  const forumPath = cfg.forumPath || '../../data/cbse10-forum.json';
  const curriculumPath = cfg.curriculumPath || '../../data/cbse10-curriculum.json';
  const label = cfg.label || 'Academy';

  let forum = null;
  let curriculum = null;
  const threadList = document.getElementById('threadList');
  const threadDetail = document.getElementById('threadDetail');
  const forumSubject = document.getElementById('forumSubject');
  const forumChapter = document.getElementById('forumChapter');

  Promise.all([
    fetch(forumPath).then((r) => r.json()),
    fetch(curriculumPath).then((r) => r.json()),
  ]).then(([f, cur]) => {
    forum = f;
    curriculum = cur;
    mergeGradingThreads();
    fillChapterFilter();
    applyUrlFilters();
    const pending = (forum.threads || []).filter((t) => t.tags?.includes('grading_request')).length;
    const voltaic = (forum.threads || []).filter((t) => t.tags?.includes('voltaic_study')).length;
    const mockNote = forum.mocked ? ' · mock demo' : '';
    document.getElementById('forumStats').textContent =
      `${forum.threads.length} threads${voltaic ? ' · ' + voltaic + ' VOLTAIC peer' : ''}${pending ? ' · ' + pending + ' awaiting grade' : ''} · ${label}${mockNote}`;
    renderList();
    forumSubject.addEventListener('change', () => {
      fillChapterFilter();
      renderList();
    });
    forumChapter.addEventListener('change', renderList);
  });

  function subjectKeys() {
    return (cfg.subjects || []).map((s) => s.id);
  }

  function allChapters() {
    const out = [];
    const keys = subjectKeys().length ? subjectKeys() : Object.keys(curriculum.subjects || {});
    keys.forEach((sub) => {
      const chs = curriculum.subjects[sub]?.chapters || [];
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

  function applyUrlFilters() {
    const params = new URLSearchParams(global.location.search);
    const sub = params.get('subject');
    const ch = params.get('chapter');
    if (sub && forumSubject.querySelector(`option[value="${sub}"]`)) {
      forumSubject.value = sub;
      fillChapterFilter();
    }
    if (ch && forumChapter.querySelector(`option[value="${ch}"]`)) {
      forumChapter.value = ch;
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
      .map(
        (t) => `<button type="button" class="thread-row${t.tags?.includes('grading_request') ? ' thread-grade' : ''}${t.tags?.includes('voltaic_study') ? ' thread-voltaic' : ''}" data-id="${t.id}">
          <span class="thread-tag ${t.subject}">${t.subject === 'mathematics' ? 'Math' : 'Sci'}</span>
          ${t.tags?.includes('grading_request') ? '<span class="tag-pred">Grade me</span>' : ''}
          ${t.tags?.includes('voltaic_study') ? '<span class="tag-voltaic">Peer study</span>' : ''}
          <strong>${esc(t.title)}</strong>
          <span class="hint">${t.reply_count || t.posts.length} posts · Class ${t.grade || '—'} · ${esc(t.chapter_title || t.chapter)}</span>
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
    document.getElementById('threadMeta').textContent =
      `${t.chapter_title || t.chapter} · ${t.subject} · Class ${t.grade || '—'} · ${t.posts.length} posts`;
    const posts = document.getElementById('threadPosts');
    posts.innerHTML = t.posts
      .map((p) => {
        const isAsst = p.author_role === 'assistant';
        return `<div class="forum-post ${isAsst ? 'sahadeva' : ''}">
          <div class="post-head">
            <img src="${p.photo || ''}" alt="" width="32" height="32" onerror="this.style.display='none'" />
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

  document.getElementById('btnBackList').addEventListener('click', renderList);

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
