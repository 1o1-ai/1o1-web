/**
 * CBSE Class 11-12 Science study material loader (curated video guides).
 */
(function (global) {
  'use strict';

  let catalog = null;
  let videoOverrides = null;

  /** Legacy study-material keys → curriculum chapter ids */
  const CHAPTER_ID_ALIASES = {
    'human-health-disease': 'human-health-diseases',
    'biotechnology-principles-processes': 'biotechnology-principles',
    'inverse-trigonometric-functions': 'inverse-trig-functions',
  };

  function resolveChapterId(chapterId) {
    return CHAPTER_ID_ALIASES[chapterId] || chapterId;
  }

  const YOUTUBE_ID_RE =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/g;

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return Promise.all([
      fetch('../../data/cbse12-science-study-material.json').then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      }),
      fetch('../../data/cbse12-science-chapter-video-overrides.json?v=1')
        .then((r) => (r.ok ? r.json() : { overrides: {} }))
        .catch(() => ({ overrides: {} })),
    ]).then(([data, overridesData]) => {
      catalog = data;
      videoOverrides = overridesData?.overrides || {};
      return data;
    });
  }

  function chapter(chapterId) {
    const id = resolveChapterId(chapterId);
    return catalog?.chapters?.[id] || catalog?.chapters?.[chapterId] || null;
  }

  function isEmbeddableYoutubeId(id) {
    if (!id) return false;
    const isValidFormat = /^[a-zA-Z0-9_-]{11}$/.test(id);
    const isPlaceholder =
      /^[a-zA-Z_]+1[12]$/.test(id) || /^[a-zA-Z_]+10$/.test(id) || id.length < 11;
    return isValidFormat && !isPlaceholder;
  }

  function isValidYoutubeId(id) {
    return isEmbeddableYoutubeId(id);
  }

  function extractVideosFromText(text) {
    if (!text) return [];
    const uniqueIds = new Set();
    let match;
    const re = new RegExp(YOUTUBE_ID_RE.source, YOUTUBE_ID_RE.flags);
    while ((match = re.exec(text)) !== null) {
      if (match[1]) uniqueIds.add(match[1]);
    }
    return Array.from(uniqueIds).map((id) => ({
      id,
      isEmbeddable: isEmbeddableYoutubeId(id),
    }));
  }

  function applyVideoOverride(chapterId, video) {
    const ov = videoOverrides?.[chapterId];
    if (!ov?.youtubeId) return video;
    const wrongIds = new Set(ov.wrongIds || []);
    if (!wrongIds.has(video.id) && video.id !== ov.youtubeId) return video;
    const id = ov.youtubeId;
    return {
      ...video,
      id,
      isEmbeddable: isEmbeddableYoutubeId(id),
      title: ov.title || video.title,
      presenter: ov.presenter || video.presenter,
      url: ov.url || `https://www.youtube.com/watch?v=${id}`,
    };
  }

  function collectChapterVideos(ch) {
    const byId = new Map();

    (ch.videos || []).forEach((v) => {
      const id = v.youtubeId || '';
      if (!id) return;
      const video = applyVideoOverride(ch.chapterId, {
        id,
        isEmbeddable: v.isEmbeddable != null ? v.isEmbeddable : isEmbeddableYoutubeId(id),
        title: v.title || 'Chapter video lesson',
        presenter: v.presenter || '',
        url: v.url || `https://www.youtube.com/watch?v=${id}`,
        transcripts: v.transcripts || [],
      });
      byId.set(video.id, video);
    });

    const blob = [ch.studySummary || '', ...(ch.links || []).map((l) => l.url || '')].join('\n');
    const wrongIdsForChapter = new Set(videoOverrides?.[ch.chapterId]?.wrongIds || []);
    extractVideosFromText(blob).forEach((v) => {
      if (wrongIdsForChapter.has(v.id)) return;
      if (!byId.has(v.id)) {
        byId.set(v.id, {
          id: v.id,
          isEmbeddable: v.isEmbeddable,
          title: 'Class video companion',
          presenter: '',
          url: `https://www.youtube.com/watch?v=${v.id}`,
          transcripts: [],
        });
      }
    });

    return Array.from(byId.values());
  }

  function mdToHtml(text) {
    if (!text) return '';
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return esc(text)
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  function buildReadText(ch) {
    const parts = [ch.title, ch.disclaimer || ''];
    if (ch.syllabusOutline?.length) {
      parts.push('Syllabus outline. ' + ch.syllabusOutline.join('. '));
    }
    if (ch.studySummary) parts.push(ch.studySummary.replace(/[#*]/g, ''));
    collectChapterVideos(ch).forEach((v) => {
      parts.push(`Video lesson: ${v.title}.`);
      (v.transcripts || []).slice(0, 6).forEach((t) => parts.push(t.text));
    });
    (ch.scholarTips || []).forEach((t) => parts.push(t));
    return parts.join('\n\n').slice(0, 12000);
  }

  let utterance = null;

  function readAloud(ch) {
    if (!global.speechSynthesis) return false;
    global.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(buildReadText(ch));
    utterance.rate = 0.92;
    utterance.pitch = 1;
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function stopReadAloud() {
    global.speechSynthesis?.cancel();
    utterance = null;
  }

  function buildYouTubeEmbedSrc(videoId) {
    const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
    if (global.location?.origin) params.set('origin', global.location.origin);
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  }

  function renderVideoCard(video, idx) {
    const card = document.createElement('div');
    card.className = video.isEmbeddable ? 'sr-video-card' : 'sr-video-card sr-video-placeholder';

    if (video.isEmbeddable) {
      card.innerHTML = `
        <div class="sr-video-card-head">
          <span class="sr-video-live">Interactive video lecture (${idx + 1})</span>
          <span class="sr-video-id">YouTube: ${video.id}</span>
        </div>
        <p class="sr-video-title">${video.title}${video.presenter ? ' · ' + video.presenter : ''}</p>
        <div class="sr-video-embed"></div>
        <p class="sr-video-note">Handpicked guide aligned with this chapter syllabus. If the player fails, <a href="${video.url}" target="_blank" rel="noopener noreferrer">open on YouTube ↗</a>.</p>`;
      const iframe = document.createElement('iframe');
      iframe.src = buildYouTubeEmbedSrc(video.id);
      iframe.title = video.title || 'Chapter video lesson';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.loading = 'lazy';
      card.querySelector('.sr-video-embed').appendChild(iframe);
    } else {
      card.innerHTML = `
        <div class="sr-video-placeholder-inner">
          <span class="sr-video-placeholder-icon">🔗</span>
          <div>
            <div class="sr-video-placeholder-title">External video reference (placeholder ID)</div>
            <p class="sr-video-placeholder-text">This chapter lists an external video reference (<code>${video.id}</code>) instead of an active embed.</p>
            <a href="https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}" target="_blank" rel="noopener noreferrer" class="sr-video-external-link">Launch YouTube lesson in new window ↗</a>
          </div>
        </div>`;
    }

    if (video.transcripts?.length) {
      const ts = document.createElement('details');
      ts.className = 'sr-transcripts';
      ts.innerHTML = '<summary>Micro-lesson timestamps</summary><ul></ul>';
      const ul = ts.querySelector('ul');
      video.transcripts.forEach((t) => {
        const li = document.createElement('li');
        li.innerHTML = `<time>${t.time}</time> ${t.text}`;
        ul.appendChild(li);
      });
      card.appendChild(ts);
    }

    return card;
  }

  function renderLearnView(ch, root) {
    if (!root || !ch) return;
    root.innerHTML = '';

    const disclaimer = document.createElement('p');
    disclaimer.className = 'sr-ai-disclaimer';
    disclaimer.textContent =
      ch.disclaimer ||
      'Curated study guide with NCERT Wallah / Magnet Brains videos — verify with your textbook and teacher.';
    root.appendChild(disclaimer);

    const videos = collectChapterVideos(ch);

    if (videos.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section sr-video-companion';
      sec.innerHTML = '<h3>✨ Class video companion</h3>';
      videos.forEach((v, i) => sec.appendChild(renderVideoCard(v, i)));
      root.appendChild(sec);
    }

    if (ch.syllabusOutline?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Syllabus outline</h3><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('ul');
      ch.syllabusOutline.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    if (ch.studySummary) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Study guide</h3><div class="sr-learn-body"></div>';
      sec.querySelector('.sr-learn-body').innerHTML = mdToHtml(ch.studySummary);
      root.appendChild(sec);
    }

    if (ch.scholarTips?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML =
        '<h3>Quick study tips</h3><p class="sr-section-hint">Short exam shortcuts from this chapter guide.</p><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('ul');
      ch.scholarTips.forEach((tip) => {
        const li = document.createElement('li');
        li.textContent = tip;
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    if (ch.links?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Reference links</h3><ul class="sr-learn-links"></ul>';
      const ul = sec.querySelector('ul');
      ch.links.slice(0, 8).forEach((l) => {
        if (/youtube/i.test(l.url)) return;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = l.label;
        li.appendChild(a);
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    const actions = document.createElement('div');
    actions.className = 'sr-learn-actions';
    actions.innerHTML = `
      <button type="button" class="btn-portal btn-portal-ghost" id="btnReadAloud">🔊 Read aloud</button>
      <button type="button" class="btn-portal btn-portal-ghost" id="btnStopRead">Stop audio</button>
      <a class="btn-portal btn-portal-primary" id="learnForumLink" href="forum.html">Peer discussions →</a>
      <button type="button" class="btn-portal btn-portal-ghost" id="learnToEvaluateBtn">Try Q &amp; A Practice</button>
    `;
    root.appendChild(actions);

    actions.querySelector('#btnReadAloud')?.addEventListener('click', () => readAloud(ch));
    actions.querySelector('#btnStopRead')?.addEventListener('click', stopReadAloud);
    const forumLink = actions.querySelector('#learnForumLink');
    if (forumLink) {
      forumLink.href = `forum.html?subject=${encodeURIComponent(ch.subject)}&chapter=${encodeURIComponent(ch.chapterId)}`;
    }
    actions.querySelector('#learnToEvaluateBtn')?.addEventListener('click', () => {
      global.dispatchEvent(new CustomEvent('cbse12:switch-practice'));
    });
  }

  function renderAdvanceMaterialView(ch, root, ctx) {
    if (!root || !ch) return;
    root.innerHTML = '';
    const mat = ch.advanceMaterial || {};
    const head = document.createElement('div');
    head.className = 'cbse-advanced-panel';
    head.innerHTML = `<h3>Advance Material · ${ch.title || ctx.chapterTitle}</h3>
      <p class="cbse-advanced-lead">${mat.summary || 'NCERT exemplar solutions and enrichment from Additional Materials.'}</p>`;
    root.appendChild(head);

    const pdfs = mat.pdfResources || [];
    if (pdfs.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>NCERT solution PDFs</h3><ul class="sr-learn-list cbse-adv-pdf-list"></ul>';
      const ul = sec.querySelector('.cbse-adv-pdf-list');
      pdfs.forEach((pdf) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = pdf.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = pdf.label || pdf.url;
        li.appendChild(a);
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    const links = mat.supplementalLinks || [];
    if (links.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Curated videos &amp; links</h3><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('.sr-learn-list');
      links.slice(0, 12).forEach((l) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = l.label || l.url;
        li.appendChild(a);
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    const solutions = mat.solutions || [];
    if (solutions.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = `<h3>Master solutions (${mat.solutionCount || solutions.length})</h3><div class="cbse-adv-solutions"></div>`;
      const wrap = sec.querySelector('.cbse-adv-solutions');
      solutions.slice(0, 8).forEach((sol) => {
        const card = document.createElement('article');
        card.className = 'cbse-adv-solution-card';
        let stepsHtml = '';
        (sol.steps || []).forEach((st) => {
          stepsHtml += `<li><strong>${st.heading || 'Step'}:</strong> ${st.detail || ''}</li>`;
        });
        card.innerHTML = `<p class="cbse-adv-sol-prompt"><span class="cbse-adv-q-marks">${sol.marks || '?'} mark(s)</span> ${sol.prompt || sol.title || ''}</p>${stepsHtml ? `<ol class="sr-learn-list">${stepsHtml}</ol>` : ''}`;
        wrap.appendChild(card);
      });
      root.appendChild(sec);
    }

    if (!pdfs.length && !links.length && !solutions.length) {
      const empty = document.createElement('p');
      empty.className = 'sr-eval-hint';
      empty.textContent =
        mat.message ||
        'Advance material for this chapter is being curated from NCERT exemplar PDFs in Additional Materials.';
      root.appendChild(empty);
    }
  }

  global.CBSE12StudyMaterial = {
    load,
    chapter,
    renderLearnView,
    renderAdvanceMaterialView,
    readAloud,
    stopReadAloud,
    isValidYoutubeId,
    isEmbeddableYoutubeId,
    extractVideosFromText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
