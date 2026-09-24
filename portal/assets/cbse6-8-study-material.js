/**
 * CBSE Classes 6-8 study material loader (curated video guides).
 */
(function (global) {
  'use strict';

  let catalog = null;
  let videoOverrides = null;

  const YOUTUBE_ID_RE =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/g;

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return Promise.all([
      fetch('../../data/cbse6-8-study-material.json').then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      }),
      fetch('../../data/cbse6-8-chapter-video-overrides.json?v=1')
        .then((r) => (r.ok ? r.json() : { overrides: {} }))
        .catch(() => ({ overrides: {} })),
    ]).then(([data, overridesData]) => {
      catalog = data;
      videoOverrides = overridesData?.overrides || {};
      return data;
    });
  }

  function chapter(chapterId) {
    return catalog?.chapters?.[chapterId] || null;
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
    const vid = video.youtubeId || video.id;

    if (video.isEmbeddable) {
      card.innerHTML = `
        <div class="sr-video-card-head">
          <span class="sr-video-live">Class video (${idx + 1})</span>
        </div>
        <p class="sr-video-title">${video.title || 'Chapter video'}${video.presenter ? ' · ' + video.presenter : ''}</p>
        <div class="sr-video-embed"></div>
        <p class="sr-video-note">If the player fails, <a href="${video.url || `https://www.youtube.com/watch?v=${vid}`}" target="_blank" rel="noopener noreferrer">open on YouTube ↗</a>.</p>`;
      const iframe = document.createElement('iframe');
      iframe.src = buildYouTubeEmbedSrc(vid);
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
            <div class="sr-video-placeholder-title">Video lesson</div>
            <p class="sr-video-placeholder-text">Open this chapter lesson on YouTube.</p>
            <a href="${video.url || `https://www.youtube.com/watch?v=${encodeURIComponent(vid || '')}`}" target="_blank" rel="noopener noreferrer" class="sr-video-external-link">Open on YouTube ↗</a>
          </div>
        </div>`;
    }
    // Never show teacher/student screenplay transcripts in the student UI.
    return card;
  }

  function renderAdvanceMaterialView(ch, root, ctx) {
    if (!root || !ch) return;
    root.innerHTML = '';
    const mat = ch.advanceMaterial || {};
    const plus = ch.advancedStudy || {};

    const head = document.createElement('div');
    head.className = 'cbse-advanced-panel';
    head.innerHTML = `<h3>Advance Material · ${ch.title || ctx?.chapterTitle || ''}</h3>
      <p class="cbse-advanced-lead">Enrichment notes and study modules for this chapter. Full worked solutions stay with teachers — they are not published in the student portal.</p>`;
    root.appendChild(head);

    // Never expose master solution PDFs or step-by-step answer keys in the student UI.
    const hasModules = !!(plus?.modules?.length);
    if (hasModules) {
      plus.modules.forEach((mod) => {
        if (/solution|answer key|marking scheme/i.test(String(mod.title || ''))) return;
        const sec = document.createElement('section');
        sec.className = 'sr-learn-section cbse-plus-module';
        sec.innerHTML = `<div class="cbse-plus-module-head"><h3>${mod.title || 'Module'}</h3></div>`;
        if (mod.body) {
          const body = document.createElement('div');
          body.className = 'sr-learn-body cbse-plus-body';
          body.innerHTML = mdToHtml(mod.body);
          sec.appendChild(body);
        }
        root.appendChild(sec);
      });
    }

    const note = document.createElement('p');
    note.className = 'sr-eval-hint';
    const pdfCount = mat.solutionPdfs?.length || 0;
    const solCount = mat.solutionCount || (mat.solutions || []).length || 0;
    if (pdfCount || solCount) {
      note.textContent =
        'Teacher solution packs for this chapter are curated offline and are not downloadable here. Use Concepts & Syllabus, Regular Study videos, and Q & A Practice.';
    } else if (!hasModules) {
      note.textContent = 'Advance enrichment for this chapter is being curated. Open Concepts & Syllabus for Eden concept guides.';
    }
    if (note.textContent) root.appendChild(note);
  }

  function renderNcertPlusView(ch, root, ctx) {
    if (!root || !ch) return;
    root.innerHTML = '';
    const disciplineLabels = {
      physics: 'Physics',
      chemistry: 'Chemistry',
      biology: 'Biology',
      mathematics: 'Mathematics',
    };
    const subjectLabel = disciplineLabels[ch.subject] || ctx?.subjectLabel || 'Science';

    const head = document.createElement('div');
    head.className = 'cbse-advanced-panel';
    head.innerHTML = `<h3>NCERT Plus Syllabus Extension · ${ch.title || ctx?.chapterTitle || ''}</h3>
      <p class="cbse-advanced-lead">Board-level extensions from the NCERT syllabus — Class XI–XII scope for ${subjectLabel}.</p>`;
    root.appendChild(head);

    if (ch.syllabusOutline?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Key syllabus points</h3><ul class="sr-learn-list"></ul>';
      ch.syllabusOutline.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = String(item || '').trim();
        sec.querySelector('ul').appendChild(li);
      });
      root.appendChild(sec);
    }

    if (ch.scholarTips?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Exam focus tips</h3><ul class="sr-learn-list"></ul>';
      ch.scholarTips.forEach((tip) => {
        const li = document.createElement('li');
        li.textContent = String(tip || '').trim();
        sec.querySelector('ul').appendChild(li);
      });
      root.appendChild(sec);
    }

    const concepts = ch.discoveredConcepts || [];
    if (concepts.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Related concept notes</h3><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('ul');
      concepts.slice(0, 16).forEach((c) => {
        const li = document.createElement('li');
        li.textContent = String(c || '').trim();
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    if (!ch.syllabusOutline?.length && !ch.scholarTips?.length && !concepts.length) {
      const note = document.createElement('p');
      note.className = 'sr-eval-hint';
      note.textContent = 'Open Regular Study for curated NCERT-aligned video guides for this chapter.';
      root.appendChild(note);
    }
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
    } else {
      const q = encodeURIComponent(`${ch.title || 'CBSE Class 6-8'} ${ch.subject || ''} lesson explained`);
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = `<h3>Find lessons online</h3>
        <p class="sr-section-hint">Curated embeds are not ready for this chapter yet.</p>
        <p><a class="sr-learn-youtube-search" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener noreferrer">Search YouTube for “${ch.title || 'this chapter'}” lessons ↗</a></p>`;
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

    // lectureTranscript beats are for voice engine only — never render in the student UI.

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
      global.dispatchEvent(new CustomEvent('cbse6-8:switch-practice'));
    });
  }

  global.CBSE68StudyMaterial = {
    load,
    chapter,
    renderLearnView,
    renderNcertPlusView,
    renderAdvanceMaterialView,
    readAloud,
    stopReadAloud,
    isValidYoutubeId,
    isEmbeddableYoutubeId,
    extractVideosFromText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
