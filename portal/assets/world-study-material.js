/**
 * World curriculum track study material — portal/data/{sku}-study-material.json
 */
(function (global) {
  'use strict';

  const catalogs = new Map();
  const YOUTUBE_ID_RE =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;

  function isWorldSku(sku) {
    const s = String(sku || '').toLowerCase();
    return s.length > 0 && !s.startsWith('cbse');
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mdToHtml(text) {
    if (!text) return '';
    return esc(text)
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /** Detect ingested question banks masquerading as study guides. */
  function looksLikeQuestionBank(text) {
    const t = String(text || '').trim();
    if (!t) return false;
    const blocks = t.split(/\n### /);
    if (blocks.length < 2) return false;
    let qaPairs = 0;
    blocks.slice(1).forEach((block) => {
      const parts = block.split(/\n\n+/);
      if (parts.length >= 2 && parts[1].trim().length < 280) qaPairs += 1;
    });
    return qaPairs >= 2 || (blocks.length >= 3 && qaPairs >= 1);
  }

  function isEmbeddableYoutubeId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(String(id || ''));
  }

  function scrubInternalBankCopy(text) {
    return String(text || '')
      .replace(/This chapter has\s+\*?\*?\d+\*?\*?\s*practice questions[^\n]*/gi, 'Use **Q & A Practice** for chapter drills when you are ready.')
      .replace(/This chapter has\s+\*?\*?\d+[^\n]*practice questions[^\n]*/gi, 'Use **Q & A Practice** for chapter drills when you are ready.')
      .replace(/\bin the question bank\b/gi, '')
      .replace(/\n{3,}/g, '\n\n');
  }

  function collectVideos(ch) {
    const byId = new Map();
    (ch.videos || []).forEach((v) => {
      const id = v.youtubeId || v.id || '';
      if (!id || !isEmbeddableYoutubeId(id)) return;
      byId.set(id, {
        id,
        title: v.title || 'Chapter video lesson',
        url: v.url || `https://www.youtube.com/watch?v=${id}`,
      });
    });
    const linkBlob = (ch.links || [])
      .map((l) => `${l.title || ''} ${l.url || ''}`)
      .join('\n');
    const blob = [ch.studyGuide || '', ch.proseSummary || '', linkBlob].join('\n');
    let m;
    const re = new RegExp(YOUTUBE_ID_RE.source, YOUTUBE_ID_RE.flags);
    while ((m = re.exec(blob)) !== null) {
      if (!byId.has(m[1])) {
        byId.set(m[1], {
          id: m[1],
          title: 'Recommended lesson',
          url: `https://www.youtube.com/watch?v=${m[1]}`,
        });
      }
    }
    return Array.from(byId.values());
  }

  function hasProseStudyGuide(ch) {
    const guide = String(ch.studyGuide || ch.proseSummary || '').trim();
    if (guide && !looksLikeQuestionBank(guide)) return true;
    const summary = String(ch.studySummary || '').trim();
    if (summary && !looksLikeQuestionBank(summary)) return true;
    return false;
  }

  function load(sku) {
    const key = String(sku || '').trim();
    if (!key) return Promise.reject(new Error('Missing SKU'));
    if (catalogs.has(key)) return Promise.resolve(catalogs.get(key));
    return fetch(`/portal/data/${key}-study-material.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { chapters: {} }))
      .then((data) => {
        catalogs.set(key, data);
        return data;
      });
  }

  function chapter(sku, chapterId) {
    const cat = catalogs.get(String(sku || '').trim());
    return cat?.chapters?.[chapterId] || null;
  }

  function youtubeSearchUrl(ch, ctx) {
    const subject = ctx?.subjectLabel || ch.subject || '';
    const q = [ch.title || ctx?.chapterTitle || '', subject, 'lesson explained'].filter(Boolean).join(' ');
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  }

  function renderVideoCard(video, idx) {
    const card = document.createElement('div');
    card.className = 'sr-video-card';
    const watchUrl = video.url || `https://www.youtube.com/watch?v=${video.id}`;
    const label = idx === 0 ? 'Most relevant lesson' : `Related lesson (${idx + 1})`;
    card.innerHTML = `
      <div class="sr-video-card-head">
        <span class="sr-video-live">${esc(label)}</span>
      </div>
      <p class="sr-video-title">${esc(video.title)}</p>
      <div class="sr-video-embed"></div>
      <p class="sr-video-note">
        <a href="${esc(watchUrl)}" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a>
        ·
        <a class="sr-video-share" href="${esc(watchUrl)}" target="_blank" rel="noopener noreferrer" data-ym-share="${esc(watchUrl)}">Copy / share link ↗</a>
      </p>`;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1`;
    iframe.title = video.title || 'Chapter video lesson';
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    card.querySelector('.sr-video-embed').appendChild(iframe);
    const share_ym = card.querySelector('.sr-video-share');
    if (share_ym) {
      share_ym.addEventListener('click', (ev) => {
        const url = share_ym.getAttribute('data-ym-share') || watchUrl;
        if (navigator.clipboard?.writeText) {
          ev.preventDefault();
          navigator.clipboard.writeText(url).then(() => {
            share_ym.textContent = 'Link copied';
            setTimeout(() => {
              share_ym.textContent = 'Copy / share link ↗';
            }, 1600);
          }).catch(() => {
            /* fall through to open YouTube */
          });
        }
      });
    }
    return card;
  }

  function ym_appendYoutubeLinks(root, ch, ctx, videos) {
    const sec = document.createElement('section');
    sec.className = 'sr-learn-section sr-youtube-links';
    const searchUrl = youtubeSearchUrl(ch, ctx);
    const primary = videos && videos[0];
    const watchUrl = primary
      ? primary.url || `https://www.youtube.com/watch?v=${primary.id}`
      : searchUrl;
    sec.innerHTML = `
      <h3>YouTube links</h3>
      <ul class="sr-learn-links">
        ${
          primary
            ? `<li><a href="${esc(watchUrl)}" target="_blank" rel="noopener noreferrer">Watch the featured lesson on YouTube ↗</a></li>`
            : ''
        }
        <li><a class="sr-learn-youtube-search" href="${esc(searchUrl)}" target="_blank" rel="noopener noreferrer">Search YouTube for more “${esc(ch.title || ctx?.chapterTitle || 'this chapter')}” lessons ↗</a></li>
      </ul>`;
    root.appendChild(sec);
  }

  function renderYoutubeSection(root, ch, ctx) {
    const videos = collectVideos(ch).slice(0, 2);
    const sec = document.createElement('section');
    sec.className = 'sr-learn-section sr-video-companion';
    sec.innerHTML = '<h3>Video lessons</h3>';
    if (videos.length) {
      videos.forEach((v, i) => sec.appendChild(renderVideoCard(v, i)));
      root.appendChild(sec);
      ym_appendYoutubeLinks(root, ch, ctx, videos);
      return;
    }
    sec.innerHTML = `
      <h3>Video lessons</h3>
      <p class="sr-section-hint">A featured embed is not ready yet for this chapter. Use the search link below for trusted lessons:</p>`;
    root.appendChild(sec);
    ym_appendYoutubeLinks(root, ch, ctx, []);
  }

  function renderWipBanner(root, ch, ctx) {
    const banner = document.createElement('div');
    banner.className = 'sr-wip-banner';
    banner.innerHTML = `
      <span class="sr-wip-badge">WIP</span>
      <div>
        <strong>Study material in progress</strong>
        <p>Full chapter guides are being curated. Use <strong>Concepts &amp; Syllabus</strong> for Eden concept analogies, or <strong>Q &amp; A Practice</strong> for exam drills.</p>
      </div>`;
    root.appendChild(banner);

    const sec = document.createElement('section');
    sec.className = 'sr-learn-section';
    sec.innerHTML = `<h3>${esc(ch.title || ctx?.chapterTitle || 'Chapter')}</h3>`;
    const body = document.createElement('div');
    body.className = 'sr-learn-body';

    const outline = ch.syllabusOutline || ctx?.syllabusOutline || [];
    if (outline.length) {
      body.innerHTML = '<h4>Syllabus structure</h4><ul class="sr-learn-list"></ul>';
      const ul = body.querySelector('ul');
      outline.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = String(item);
        ul.appendChild(li);
      });
    } else if (ctx?.topicId) {
      body.innerHTML = `<p class="sr-section-hint">Topic: <code>${esc(ctx.topicId)}</code></p>`;
    } else {
      body.innerHTML =
        '<p class="sr-section-hint">Chapter outline will appear here once syllabus mapping is complete.</p>';
    }
    sec.appendChild(body);
    root.appendChild(sec);

    const learn = document.createElement('section');
    learn.className = 'sr-learn-section';
    learn.innerHTML = `
      <h3>Find lessons online</h3>
      <p class="sr-section-hint">Curated video embeds are not ready yet. Search YouTube for trusted lessons on this topic:</p>
      <p><a class="sr-learn-youtube-search" href="${esc(youtubeSearchUrl(ch, ctx))}" target="_blank" rel="noopener noreferrer">Search YouTube for “${esc(ch.title || ctx?.chapterTitle || 'this chapter')}” lessons ↗</a></p>`;
    root.appendChild(learn);
  }

  function humanizeSlug(slug) {
    return String(slug || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function renderOutlineSection(root, outline, title) {
    if (!outline.length) return;
    const sec = document.createElement('section');
    sec.className = 'sr-learn-section';
    sec.innerHTML = `<h3>${esc(title || 'Syllabus outline')}</h3><ul class="sr-learn-list"></ul>`;
    const ul = sec.querySelector('ul');
    outline.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = String(item);
      ul.appendChild(li);
    });
    root.appendChild(sec);
  }

  function renderYoutubeSection(root, ch, ctx) {
    // Prefer an in-page embed when we already have a real video id in links/guide.
    const videos = collectVideos(ch);
    if (videos.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section sr-video-companion';
      sec.innerHTML = '<h3>Video lessons</h3>';
      videos.forEach((v, i) => sec.appendChild(renderVideoCard(v, i)));
      root.appendChild(sec);
      return;
    }
    const sec = document.createElement('section');
    sec.className = 'sr-learn-section';
    sec.innerHTML = `
      <h3>Video lessons</h3>
      <p class="sr-section-hint">Curated embeds are still being added for this chapter. Meanwhile you can search trusted lessons:</p>
      <p><a class="sr-learn-youtube-search" href="${esc(youtubeSearchUrl(ch, ctx))}" target="_blank" rel="noopener noreferrer">Search YouTube for “${esc(ch.title || ctx?.chapterTitle || 'this chapter')}” lessons ↗</a></p>`;
    root.appendChild(sec);
  }

  function renderLearnView(ch, root, ctx) {
    if (!root || !ch) return;
    root.innerHTML = '';

    const videos = collectVideos(ch).slice(0, 2);
    const outline = (ch.syllabusOutline || ctx?.syllabusOutline || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    const guideText = scrubInternalBankCopy(ch.studyGuide || ch.proseSummary || '');
    const hasGuide = hasProseStudyGuide({ ...ch, studyGuide: guideText, proseSummary: guideText });
    const hasContent =
      hasGuide || outline.length || videos.length || (ch.scholarTips || []).length || (ch.links || []).length;

    if (!hasContent) {
      renderWipBanner(root, ch, ctx);
      return;
    }

    const intro = document.createElement('section');
    intro.className = 'sr-learn-section';
    intro.innerHTML = `<h3>${esc(ch.title || ctx?.chapterTitle || 'Chapter')}</h3>
      <p class="sr-section-hint">${esc(ctx?.subjectLabel || ch.subject || '')} · study guides and video lessons here. Exam practice is in <strong>Q &amp; A Practice</strong>.</p>`;
    root.appendChild(intro);

    if (videos.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section sr-video-companion';
      sec.innerHTML = '<h3>Video lessons</h3>';
      videos.forEach((v, i) => sec.appendChild(renderVideoCard(v, i)));
      root.appendChild(sec);
      ym_appendYoutubeLinks(root, ch, ctx, videos);
    } else {
      renderYoutubeSection(root, ch, ctx);
    }

    renderOutlineSection(root, outline, 'Key topics');

    if (hasGuide) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Study guide</h3><div class="sr-learn-body"></div>';
      sec.querySelector('.sr-learn-body').innerHTML = mdToHtml(guideText);
      root.appendChild(sec);
    }

    if (ch.scholarTips?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Study tips</h3><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('ul');
      ch.scholarTips.forEach((tip) => {
        const li = document.createElement('li');
        li.textContent = String(tip);
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    const nonYoutubeLinks = (ch.links || []).filter((l) => {
      const url = String(l.url || '');
      if (!url) return false;
      // YouTube watch/embed/search links are shown in the video section above.
      if (/youtube\.com|youtu\.be/i.test(url)) return false;
      return true;
    });
    if (nonYoutubeLinks.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Reference links</h3><ul class="sr-learn-links"></ul>';
      const ul = sec.querySelector('ul');
      nonYoutubeLinks.slice(0, 8).forEach((l) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = l.url || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = l.title || l.url || 'Link';
        li.appendChild(a);
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }
  }

  function ym_filterAdvanceModules(modules) {
    return (modules || []).filter(
      (mod) => !/solution|answer key|marking scheme/i.test(String(mod.title || ''))
    );
  }

  function ym_renderResourceList(root, resources) {
    const list = (resources || []).filter((r) => r && (r.url || r.label));
    if (!list.length) return;
    const sec = document.createElement('section');
    sec.className = 'sr-learn-section';
    sec.innerHTML = '<h3>Further open resources</h3><ul class="sr-learn-links"></ul>';
    const ul = sec.querySelector('ul');
    list.slice(0, 6).forEach((r) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = r.url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = r.label || r.provider || r.url || 'Resource';
      li.appendChild(a);
      ul.appendChild(li);
    });
    root.appendChild(sec);
  }

  function ym_synthesizeAdvanceModules(ch, ctx) {
    const title = ch.title || ctx?.chapterTitle || 'Chapter';
    const subject = ctx?.subjectLabel || ch.subject || 'this subject';
    const outline = (ch.syllabusOutline || ctx?.syllabusOutline || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 6);
    const tips = (ch.scholarTips || []).map((t) => String(t || '').trim()).filter(Boolean);
    const bullets =
      outline.length > 0
        ? outline.map((c) => `- ${c}`).join('\n')
        : `- Core ideas in ${title}`;
    return [
      {
        title: `Deeper look: ${title}`,
        body:
          `## Beyond the syllabus checklist\n` +
          `**${title}** (${subject}) rewards model-based thinking, not only memorising headings:\n` +
          `${bullets}\n\n` +
          `## Study move\n` +
          `Explain each bullet without notes, then reopen **Concepts & Syllabus** for Eden analogies.`,
      },
      {
        title: 'Transfer & stretch',
        body:
          `## Stretch task\n` +
          `Invent one real-world situation that uses ${title}, then outline how you would solve it step by step.\n\n` +
          (tips.length
            ? `## Tips from this chapter\n${tips
                .slice(0, 4)
                .map((t) => `- ${t}`)
                .join('\n')}\n\n`
            : '') +
          `## Close the loop\n` +
          `Use **Q & A Practice** after this stretch — enrichment is for understanding; drills lock it in.`,
      },
    ];
  }

  function renderAdvanceMaterialView(ch, root, ctx) {
    if (!root || !ch) return;
    root.innerHTML = '';

    const plus = ch.advancedStudy || {};
    let modules = ym_filterAdvanceModules(plus.modules);
    if (!modules.length) {
      modules = ym_synthesizeAdvanceModules(ch, ctx);
    }

    const head = document.createElement('div');
    head.className = 'cbse-advanced-panel';
    head.innerHTML = `<h3>Advance Material · ${esc(ch.title || ctx?.chapterTitle || 'Chapter')}</h3>
      <p class="cbse-advanced-lead">${esc(
        plus.summary ||
          'Enrichment beyond the core syllabus outline — deeper explanations, stretch tasks, and open-course links.'
      )}</p>`;
    root.appendChild(head);

    if (plus.disclaimer) {
      const disc = document.createElement('p');
      disc.className = 'sr-section-hint';
      disc.textContent = plus.disclaimer;
      root.appendChild(disc);
    }

    modules.forEach((mod) => {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section cbse-plus-module';
      const source = mod.source ? ` · ${mod.source}` : '';
      sec.innerHTML = `<div class="cbse-plus-module-head"><h3>${esc(mod.title || 'Module')}${esc(
        source
      )}</h3></div>`;
      if (mod.body) {
        const body = document.createElement('div');
        body.className = 'sr-learn-body cbse-plus-body';
        body.innerHTML = mdToHtml(mod.body);
        sec.appendChild(body);
      }
      if (mod.keyIdeas?.length) {
        const ideas = document.createElement('ul');
        ideas.className = 'sr-learn-list';
        mod.keyIdeas.forEach((idea) => {
          const li = document.createElement('li');
          li.textContent = String(idea);
          ideas.appendChild(li);
        });
        sec.appendChild(ideas);
      }
      if (mod.sourceUrl) {
        const p = document.createElement('p');
        p.className = 'sr-section-hint';
        p.innerHTML = `<a href="${esc(mod.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open related open course ↗</a>`;
        sec.appendChild(p);
      }
      root.appendChild(sec);
    });

    ym_renderResourceList(root, plus.resources);

    const videos = collectVideos(ch).slice(0, 2);
    if (videos.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section sr-video-companion';
      sec.innerHTML = '<h3>Video enrichment</h3>';
      videos.forEach((v, i) => sec.appendChild(renderVideoCard(v, i)));
      root.appendChild(sec);
      ym_appendYoutubeLinks(root, ch, ctx, videos);
    } else {
      renderYoutubeSection(root, ch, ctx);
    }
  }

  global.WorldStudyMaterial = {
    isWorldSku,
    load,
    chapter,
    renderLearnView,
    renderAdvanceMaterialView,
    mdToHtml,
    looksLikeQuestionBank,
  };
})(typeof window !== 'undefined' ? window : globalThis);
