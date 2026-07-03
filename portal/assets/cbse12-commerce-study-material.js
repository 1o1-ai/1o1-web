/**
 * CBSE Class 11-12 Commerce study material loader.
 */
(function (global) {
  'use strict';

  let catalog = null;

  const YOUTUBE_ID_RE =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/g;

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return fetch('../../data/cbse12-commerce-study-material.json')
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

  function isEmbeddableYoutubeId(id) {
    if (!id) return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  function renderLearnPanel(container, ctx) {
    if (!container || !ctx?.chapterId) return;
    const ch = chapter(ctx.chapterId);
    container.innerHTML = '';
    if (!ch) {
      container.innerHTML = '<p class="sr-eval-hint">Study notes for this chapter are being indexed.</p>';
      return;
    }
    const summary = ch.studySummary || '';
    const videos = ch.videos || [];
    let html = '';
    if (summary) {
      html += `<div class="sr-learn-section cbse-markdown">${summary.replace(/\n/g, '<br>')}</div>`;
    }
    if (videos.length) {
      html += '<div class="sr-learn-section"><h3>Curated videos</h3><ul class="sr-learn-list">';
      videos.forEach((v) => {
        const embed = isEmbeddableYoutubeId(v.youtubeId)
          ? `<iframe src="${v.embedUrl || 'https://www.youtube-nocookie.com/embed/' + v.youtubeId}" title="${v.title}" loading="lazy" allowfullscreen></iframe>`
          : '';
        html += `<li><strong>${v.title}</strong>${embed ? `<div class="cbse-video-embed">${embed}</div>` : `<br><a href="${v.url}" target="_blank" rel="noopener">Watch on YouTube</a>`}</li>`;
      });
      html += '</ul></div>';
    }
    if (!html) {
      html = '<p class="sr-eval-hint">Open the Official Books tab for NCERT PDF content.</p>';
    }
    container.innerHTML = html;
  }

  global.CBSE12CommerceStudyMaterial = { load, chapter, renderLearnPanel };
})(typeof window !== 'undefined' ? window : globalThis);
