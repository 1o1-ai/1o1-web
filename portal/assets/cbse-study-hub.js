/**
 * CBSE Study Hub — tabbed workspace: Official Books · Advanced · Regular · Q&A · Random Quiz
 */
(function (global) {
  'use strict';

  const TABS = [
    { id: 'official', label: 'Official Books', icon: '📖', hint: 'NCERT + teacher lecture' },
    { id: 'advanced', label: 'Advanced Study', icon: '🚀', hint: 'Deep-dive concepts' },
    { id: 'regular', label: 'Regular Study', icon: '📚', hint: 'Study guides & videos' },
    { id: 'practice', label: 'Q & A Practice', icon: '✅', hint: 'Board-style drills' },
    { id: 'random', label: 'Random Quiz', icon: '🎲', hint: 'Coming soon' },
  ];

  let activeCtx = null;
  let activeTab = 'official';
  let booksCatalog = null;

  function loadBooks(sku) {
    const key = sku === 'cbse10' ? 'cbse10' : 'cbse12-science';
    if (booksCatalog?.sku === key) return Promise.resolve(booksCatalog);
    const path =
      sku === 'cbse10'
        ? '/portal/data/cbse10-official-books.json'
        : '/portal/data/cbse12-science-official-books.json';
    return fetch(path)
      .then((r) => (r.ok ? r.json() : { subjects: {} }))
      .then((data) => {
        booksCatalog = data;
        return data;
      })
      .catch(() => ({ subjects: {} }));
  }

  function chapterEntry(ctx) {
    const sub = booksCatalog?.subjects?.[ctx.subjectId];
    return sub?.chapters?.[ctx.chapterId] || null;
  }

  function renderTabBar(container, onSelect) {
    const bar = document.createElement('nav');
    bar.className = 'cbse-tab-bar';
    bar.setAttribute('role', 'tablist');
    TABS.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cbse-tab' + (t.id === activeTab ? ' active' : '');
      btn.dataset.tab = t.id;
      btn.setAttribute('role', 'tab');
      btn.innerHTML = `<span class="cbse-tab-icon">${t.icon}</span><span class="cbse-tab-label">${t.label}</span><span class="cbse-tab-hint">${t.hint}</span>`;
      btn.addEventListener('click', () => onSelect(t.id));
      bar.appendChild(btn);
    });
    container.appendChild(bar);
  }

  function renderPanel(container, tabId, ctx) {
    container.innerHTML = '';
    if (tabId === 'official') {
      global.CBSEOfficialBooks?.render(container, ctx, chapterEntry(ctx));
      return;
    }
    if (tabId === 'advanced') {
      renderAdvanced(container, ctx);
      return;
    }
    if (tabId === 'regular') {
      mountRegularStudy(container, ctx);
      return;
    }
    if (tabId === 'practice') {
      const embed = document.getElementById('studyPracticeEmbed');
      const panel = document.getElementById('studyTabPanel');
      if (embed) {
        embed.classList.remove('hidden');
        if (panel) panel.classList.add('hidden');
        ctx.onBeforePractice?.();
      } else {
        mountPractice(container, ctx);
      }
      return;
    }
    const embed = document.getElementById('studyPracticeEmbed');
    const panel = document.getElementById('studyTabPanel');
    if (embed) embed.classList.add('hidden');
    if (panel) panel.classList.remove('hidden');
    if (tabId === 'random') {
      container.innerHTML = `
        <div class="cbse-wip-panel">
          <span class="cbse-wip-icon">🎲</span>
          <h3>Random Quiz</h3>
          <p>Mix easy, medium &amp; hard questions across chapters — work in progress.</p>
          <p class="cbse-wip-note">Try <strong>Q &amp; A Practice</strong> or the <strong>Word Hunt</strong> game in Official Books for now.</p>
        </div>`;
    }
  }

  function renderAdvanced(host, ctx) {
    const entry = chapterEntry(ctx);
    const concepts = entry?.transcript?.concepts || [];
    host.innerHTML = `
      <div class="cbse-advanced-panel">
        <h3>Advanced · ${ctx.chapterTitle}</h3>
        <p class="cbse-advanced-lead">Extension topics beyond NCERT basics — ideal before competitive exams.</p>
        <ul class="cbse-concept-list">${concepts.map((c) => `<li>${c}</li>`).join('') || '<li>Advanced notes loading from official transcript…</li>'}</ul>
        <div class="cbse-advanced-cards">
          <article class="cbse-adv-card"><strong>🔗 Cross-links</strong><p>Connect this chapter to previous years &amp; JEE/NEET patterns.</p></article>
          <article class="cbse-adv-card"><strong>🧪 Numericals</strong><p>Focus on multi-step problems from the question bank — use Q &amp; A with difficulty <em>Difficult</em>.</p></article>
          <article class="cbse-adv-card"><strong>📖 NCERT Exemplar</strong><p>${entry?.pdf?.pdfUrl ? `<a href="${entry.pdf.pdfUrl}" target="_blank" rel="noopener">Open official PDF</a> for in-text examples.` : 'Official PDF linked in Official Books tab.'}</p></article>
        </div>
      </div>`;
  }

  function mountRegularStudy(host, ctx) {
    host.innerHTML = '<div id="cbseRegularMount" class="cbse-regular-mount"><p class="sr-eval-hint">Loading study material…</p></div>';
    const mount = host.querySelector('#cbseRegularMount');
    if (ctx.sku === 'cbse10' && global.CBSE10StudyMaterial) {
      global.CBSE10StudyMaterial.load().then(() => {
        const ch = global.CBSE10StudyMaterial.chapter(ctx.chapterId);
        if (!ch) {
          mount.innerHTML = '<p class="sr-eval-hint">Study material for this chapter is not available yet.</p>';
          return;
        }
        global.CBSE10StudyMaterial.renderLearnView(ch, mount);
      });
      return;
    }
    mount.innerHTML = `
      <div class="cbse-regular-fallback">
        <h3>${ctx.chapterTitle}</h3>
        <p>Study notes for ${ctx.subjectLabel || ctx.subjectId} · use <strong>Official Books</strong> for NCERT lecture, or <strong>Q &amp; A Practice</strong> for questions.</p>
      </div>`;
  }

  function mountPractice(host, ctx) {
    host.innerHTML = '<div id="cbsePracticeMount" class="cbse-practice-mount"></div>';
    if (ctx.onMountPractice) ctx.onMountPractice(host.querySelector('#cbsePracticeMount'));
    else host.querySelector('#cbsePracticeMount').innerHTML = '<p class="sr-eval-hint">Practice mode not wired for this SKU.</p>';
  }

  function open(ctx) {
    activeCtx = ctx;
    activeTab = ctx.initialTab || 'official';
    const phase = document.getElementById('phaseStudy');
    if (!phase) {
      ctx.legacyIntent?.();
      return;
    }

    loadBooks(ctx.sku).then(() => {
      const titleEl = document.getElementById('studyHubTitle');
      const subEl = document.getElementById('studyHubSubtitle');
      if (titleEl) titleEl.textContent = ctx.chapterTitle;
      if (subEl) {
        subEl.textContent = `${ctx.subjectLabel || ctx.subjectId}${entryHasOfficial(ctx) ? ' · NCERT official' : ''}`;
      }

      const tabHost = document.getElementById('studyTabBar');
      const panelHost = document.getElementById('studyTabPanel');
      if (!tabHost || !panelHost) return;

      tabHost.innerHTML = '';
      renderTabBar(tabHost, (tabId) => {
        activeTab = tabId;
        tabHost.querySelectorAll('.cbse-tab').forEach((b) => {
          b.classList.toggle('active', b.dataset.tab === tabId);
        });
        if (tabId === 'practice' && ctx.onBeforePractice) ctx.onBeforePractice();
        renderPanel(panelHost, tabId, ctx);
        if (tabId !== 'practice' && ctx.onLeavePractice) ctx.onLeavePractice();
      });

      renderPanel(panelHost, activeTab, ctx);
      ctx.showPhase?.('study');
    });
  }

  function entryHasOfficial(ctx) {
    const e = chapterEntry(ctx);
    return !!(e?.hasTranscript || e?.hasPdf);
  }

  global.CBSEStudyHub = { open, loadBooks, TABS };
})(typeof window !== 'undefined' ? window : globalThis);
