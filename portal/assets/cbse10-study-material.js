/**
 * CBSE 10 study material loader (VOLTAIC AI-generated guides).
 */
(function (global) {
  'use strict';

  let catalog = null;

  const YOUTUBE_ID_RE =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/g;

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return fetch('../../data/cbse10-study-material.json')
      .then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      })
      .then((data) => {
        catalog = data;
        return data;
      });
  }

  function chapter(chapterId) {
    return catalog?.chapters?.[chapterId] || null;
  }

  /** Match StudyMaterialHub.tsx: 11-char real IDs embed; placeholders open externally. */
  function isEmbeddableYoutubeId(id) {
    if (!id) return false;
    const isValidFormat = /^[a-zA-Z0-9_-]{11}$/.test(id);
    const isPlaceholder = /^[a-zA-Z_]+10$/.test(id) || id.length < 11;
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

  function collectChapterVideos(ch) {
    const byId = new Map();

    (ch.videos || []).forEach((v) => {
      const id = v.youtubeId || '';
      if (!id) return;
      byId.set(id, {
        id,
        isEmbeddable: v.isEmbeddable != null ? v.isEmbeddable : isEmbeddableYoutubeId(id),
        title: v.title || 'Chapter video lesson',
        presenter: v.presenter || '',
        url: v.url || `https://www.youtube.com/watch?v=${id}`,
        transcripts: v.transcripts || [],
      });
    });

    const blob = [ch.studySummary || '', ...(ch.links || []).map((l) => l.url || '')].join('\n');
    extractVideosFromText(blob).forEach((v) => {
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
        <p class="sr-video-note">Handpicked guide aligned with this chapter syllabus.</p>`;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1`;
      iframe.title = video.title || 'Chapter video lesson';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'no-referrer';
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
      ch.disclaimer || 'AI-generated study guide — verify with NCERT and your teacher.';
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
      sec.innerHTML = '<h3>Peer tips</h3><ul class="sr-learn-list"></ul>';
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
      <button type="button" class="btn-portal btn-portal-ghost" id="learnToEvaluateBtn">Try Evaluate</button>
    `;
    root.appendChild(actions);

    actions.querySelector('#btnReadAloud')?.addEventListener('click', () => readAloud(ch));
    actions.querySelector('#btnStopRead')?.addEventListener('click', stopReadAloud);
    const forumLink = actions.querySelector('#learnForumLink');
    if (forumLink) {
      forumLink.href = `forum.html?subject=${encodeURIComponent(ch.subject)}&chapter=${encodeURIComponent(ch.chapterId)}`;
    }
    actions.querySelector('#learnToEvaluateBtn')?.addEventListener('click', () => {
      global.dispatchEvent(new CustomEvent('cbse10:switch-evaluate'));
    });
  }

  global.CBSE10StudyMaterial = {
    load,
    chapter,
    renderLearnView,
    readAloud,
    stopReadAloud,
    isValidYoutubeId,
    isEmbeddableYoutubeId,
    extractVideosFromText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
