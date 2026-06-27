/**
 * CBSE Study Hub — tabbed workspace: Official Books · Advanced · Regular · Q&A
 */
(function (global) {
  'use strict';

  const TABS = [
    { id: 'official', label: 'Official Books', icon: '📖', hint: 'NCERT + teacher lecture' },
    { id: 'ncert-plus', label: 'NCERT Plus Syllabus Extension', icon: '📝', hint: 'Beyond NCERT outline' },
    { id: 'advance-material', label: 'Advance Material', icon: '🌍', hint: 'Master solutions' },
    { id: 'regular', label: 'Regular Study', icon: '📚', hint: 'Study guides & videos' },
    { id: 'practice', label: 'Q & A Practice', icon: '✅', hint: 'Board-style drills' },
  ];

  let activeCtx = null;
  let activeTab = 'regular';
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
    if (tabId === 'ncert-plus') {
      mountNcertPlus(container, ctx);
      return;
    }
    if (tabId === 'advance-material') {
      mountAdvanceMaterial(container, ctx);
      return;
    }
    if (tabId === 'advanced') {
      mountNcertPlus(container, ctx);
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
  }

  function mountNcertPlus(host, ctx) {
    host.innerHTML =
      '<div class="cbse-advanced-mount"><p class="sr-eval-hint">Loading NCERT Plus…</p></div>';
    const mount = host.querySelector('.cbse-advanced-mount');
    global.CBSEOfficialBooks?.stopLecture?.();
    global.CBSE10StudyMaterial?.stopReadAloud?.();

    if (ctx.sku === 'cbse10' && global.CBSE10StudyMaterial?.renderNcertPlusView) {
      const loadCh = global.CBSE10StudyMaterial.loadChapter
        ? () => global.CBSE10StudyMaterial.loadChapter(ctx.chapterId)
        : () =>
            global.CBSE10StudyMaterial.load().then(() =>
              global.CBSE10StudyMaterial.chapter(ctx.chapterId)
            );
      loadCh()
        .then((ch) => {
          if (!ch) {
            renderNcertPlusFallback(mount, ctx);
            return;
          }
          global.CBSE10StudyMaterial.renderNcertPlusView(ch, mount, ctx);
        })
        .catch(() => renderNcertPlusFallback(mount, ctx));
      return;
    }
    renderNcertPlusFallback(mount, ctx);
  }

  function mountAdvanceMaterial(host, ctx) {
    host.innerHTML =
      '<div class="cbse-advanced-mount"><p class="sr-eval-hint">Loading Advance Material…</p></div>';
    const mount = host.querySelector('.cbse-advanced-mount');
    global.CBSEOfficialBooks?.stopLecture?.();
    global.CBSE10StudyMaterial?.stopReadAloud?.();

    if (ctx.sku === 'cbse10' && global.CBSE10StudyMaterial?.renderAdvanceMaterialView) {
      const loadCh = global.CBSE10StudyMaterial.loadChapter
        ? () => global.CBSE10StudyMaterial.loadChapter(ctx.chapterId)
        : () =>
            global.CBSE10StudyMaterial.load().then(() =>
              global.CBSE10StudyMaterial.chapter(ctx.chapterId)
            );
      loadCh()
        .then((ch) => {
          if (!ch) {
            mount.innerHTML =
              '<p class="sr-eval-hint">Advance material for this chapter is not available yet.</p>';
            return;
          }
          global.CBSE10StudyMaterial.renderAdvanceMaterialView(ch, mount, ctx);
        })
        .catch(() => {
          mount.innerHTML =
            '<p class="sr-eval-hint">Could not load advance material. Try again later.</p>';
        });
      return;
    }
    mount.innerHTML = '<p class="sr-eval-hint">Advance Material is available for CBSE 10 only.</p>';
  }

  function renderNcertPlusFallback(host, ctx) {
    const entry = chapterEntry(ctx);
    const rawConcepts = entry?.transcript?.concepts || [];
    const concepts = rawConcepts
      .map((c) => String(c || '').trim())
      .filter((s) => {
        if (!s || s.length < 10) return false;
        if (/^CBSE Class 10/i.test(s)) return false;
        if (/^Chapter:/i.test(s)) return false;
        if (/JEE|NEET|olympiad|IIT|competitive exam/i.test(s)) return false;
        return true;
      });
    host.innerHTML = `
      <div class="cbse-advanced-panel">
        <h3>NCERT Plus Syllabus Extension · ${ctx.chapterTitle}</h3>
        <p class="cbse-advanced-lead">Board-level extensions from the NCERT syllabus — Class 10 scope only.</p>
        <ul class="cbse-concept-list">${concepts.map((c) => `<li>${c}</li>`).join('') || '<li>Open <strong>Regular Study</strong> for the full chapter guide.</li>'}</ul>
      </div>`;
  }

  /** @deprecated use mountNcertPlus */
  function mountAdvanced(host, ctx) {
    mountNcertPlus(host, ctx);
  }

  function renderAdvanced(host, ctx) {
    mountNcertPlus(host, ctx);
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
    if (ctx.sku === 'cbse12-science' && global.CBSE12StudyMaterial) {
      global.CBSE12StudyMaterial.load().then(() => {
        const ch = global.CBSE12StudyMaterial.chapter(ctx.chapterId);
        if (!ch) {
          mount.innerHTML = '<p class="sr-eval-hint">Study material for this chapter is not available yet.</p>';
          return;
        }
        global.CBSE12StudyMaterial.renderLearnView(ch, mount);
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
    activeTab = ctx.initialTab || 'regular';
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
        if (activeTab === 'official' && tabId !== 'official') {
          global.CBSEOfficialBooks?.stopLecture?.();
        }
        global.CBSE10StudyMaterial?.stopReadAloud?.();
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
