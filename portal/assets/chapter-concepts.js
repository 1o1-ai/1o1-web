/**
 * Chapter concept learn panel — Eden RAG analogies for Concepts & Syllabus tab.
 * Loads lightweight manifest + sharded bundles from /portal/data (no API required).
 */
(function (global) {
  'use strict';

  const MANIFEST_PATH = '/portal/data/concept-learn-manifest.json?v=7';
  const SHARD_BASE = '/portal/data/concept-bundles/';
  const ANIM_BASE = '/portal/data/concept-animations/';
  const DATA_CACHE_BUST = 'v=7';

  const ASCII_PALETTE = {
    sky: '#DBEAFE',
    cloud: '#FFFFFF',
    sun: '#FCD34D',
    grass: '#86EFAC',
    darkgrass: '#14532D',
    dirt: '#78350F',
    skin: '#FDBA74',
    shirt: '#1D4ED8',
    pants: '#1E3A8A',
    ball: '#EA580C',
    eq: '#FACC15',
    crowd: '#7C3AED',
    white: '#FFFFFF',
    gold: '#EAB308',
    pink: '#DB2777',
    lime: '#65A30D',
    orange: '#C2410C',
    cyan: '#0891B2',
    red: '#DC2626',
    bench: '#475569',
    net: '#1E293B',
    leaf: '#15803D',
    water: '#0369A1',
    ink: '#0F172A',
    bright: '#FFFFFF',
    default: '#0F172A',
  };

  const THEME_CLASS = {
    'stadium-day': 'eden-theme-stadium-day',
    'stadium-sunset': 'eden-theme-stadium-sunset',
    'night-field': 'eden-theme-night-field',
    'ocean-lab': 'eden-theme-ocean-lab',
    forest: 'eden-theme-forest',
    space: 'eden-theme-space',
    classroom: 'eden-theme-classroom',
  };
  const INVALID_SLUGS = new Set([
    'how', 'the', 'and', 'for', 'are', 'was', 'its', 'can', 'may', 'not', 'you', 'all', 'none',
  ]);

  function apiBase() {
    if (global.CBSE10TutorApi?.apiBase) return global.CBSE10TutorApi.apiBase();
    const params = new URLSearchParams(global.location.search);
    const explicit = params.get('education_api');
    if (explicit) return explicit.replace(/\/$/, '');
    return 'https://api.brahmando.com/education';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isValidSlug(slug) {
    const s = String(slug || '').trim().toLowerCase();
    return s.length >= 4 && !INVALID_SLUGS.has(s);
  }

  function cleanDisplayName(name, slug) {
    const n = String(name || '').trim();
    if (!n || /^none$/i.test(n)) {
      return String(slug || '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return n;
  }

  function shardKey(slug) {
    const s = String(slug || '').trim().toLowerCase();
    const first = s[0] || 'z';
    return /^[a-z0-9]$/.test(first) ? first : '0';
  }

  const curriculumCache = new Map();
  let manifestPromise = null;
  const shardCache = new Map();

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(MANIFEST_PATH, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { concepts: {} }))
        .then((data) => data.concepts || {})
        .catch(() => ({}));
    }
    return manifestPromise;
  }

  function loadShard(shard) {
    const key = String(shard || '0').toLowerCase();
    if (shardCache.has(key)) return Promise.resolve(shardCache.get(key));
    const promise = fetch(`${SHARD_BASE}${encodeURIComponent(key)}.json?${DATA_CACHE_BUST}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    shardCache.set(key, promise);
    return promise;
  }

  function loadCurriculum(sku) {
    const key = String(sku || '').trim();
    if (curriculumCache.has(key)) return Promise.resolve(curriculumCache.get(key));
    return fetch(`/portal/data/${key}-curriculum.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        curriculumCache.set(key, data);
        return data;
      })
      .catch(() => null);
  }

  function findChapterMeta(curriculum, subjectId, chapterId) {
    const subj = curriculum?.subjects?.[subjectId];
    if (subj?.chapters) {
      const hit = subj.chapters.find((c) => c.id === chapterId);
      if (hit) return hit;
    }
    for (const s of Object.values(curriculum?.subjects || {})) {
      const hit = s.chapters?.find((c) => c.id === chapterId);
      if (hit) return hit;
    }
    return null;
  }

  function chapterSlugs(curriculum, subjectId, chapterId) {
    const ch = findChapterMeta(curriculum, subjectId, chapterId);
    return (Array.isArray(ch?.eden_concept_slugs) ? ch.eden_concept_slugs : []).filter(isValidSlug);
  }

  function fetchChapterConcepts(sku, subjectId, chapterId) {
    return Promise.all([loadCurriculum(sku), loadManifest()]).then(([cur, manifest]) => {
      const slugs = chapterSlugs(cur, subjectId, chapterId);
      return {
        sku,
        subject_id: subjectId,
        chapter_id: chapterId,
        concepts: slugs.map((slug) => {
          const m = manifest[slug];
          return m
            ? {
                slug,
                display_name: m.display_name,
                analogy_preview: m.analogy_preview || '',
                has_animation: !!m.has_animation,
              }
            : {
                slug,
                display_name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                analogy_preview: '',
                has_animation: false,
              };
        }),
      };
    });
  }

  function fetchConceptLearn(slug) {
    if (!isValidSlug(slug)) return Promise.reject(new Error('Invalid concept slug'));

    return loadManifest().then((manifest) => {
      const shard = manifest[slug]?.shard || shardKey(slug);
      return loadShard(shard).then((bucket) => {
        if (bucket && bucket[slug]) return bucket[slug];
        const url = apiBase() + `/concepts/${encodeURIComponent(slug)}/learn`;
        return fetch(url, { headers: { Accept: 'application/json' } }).then((r) => {
          if (!r.ok) throw new Error('Concept not found');
          return r.json();
        });
      });
    });
  }

  function normalizeConcept(c) {
    return {
      slug: c.slug,
      display_name: cleanDisplayName(c.display_name, c.slug),
      analogy_preview: c.analogy_preview || (c.analogy || '').slice(0, 220),
      description_preview: c.description_preview || (c.description || '').slice(0, 280),
      has_animation: !!c.has_animation,
    };
  }

  function renderConceptList(root, concepts, onSelect) {
    const list = document.createElement('div');
    list.className = 'eden-concept-grid';
    concepts.forEach((raw) => {
      const c = normalizeConcept(raw);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eden-concept-chip';
      btn.dataset.slug = c.slug;
      const preview = c.analogy_preview || c.description_preview || '';
      const animTag = c.has_animation ? '<span class="eden-concept-chip-anim">▶ anim</span>' : '';
      btn.innerHTML = `<span class="eden-concept-chip-title">${esc(c.display_name)}${animTag}</span>${
        preview ? `<span class="eden-concept-chip-preview">${esc(preview)}</span>` : ''
      }`;
      btn.addEventListener('click', () => onSelect(c.slug));
      list.appendChild(btn);
    });
    root.appendChild(list);
  }

  function cleanDescription(bundle) {
    const title = cleanDisplayName(bundle.display_name, bundle.slug);
    let desc = String(bundle.description || bundle.student_guidance || '').trim();
    if (!desc) return '';
    if (desc.startsWith(title)) {
      desc = desc.slice(title.length).trim();
    }
    const analogy = String(bundle.analogy || '').trim();
    if (analogy && desc === analogy) return '';
    if (analogy && desc.startsWith(analogy.slice(0, 80))) return '';
    return desc.length > 600 ? desc.slice(0, 597) + '…' : desc;
  }

  function parseColoredLine(line) {
    let html = '';
    let i = 0;
    while (i < line.length) {
      const open = line.indexOf('{', i);
      if (open === -1) {
        html += esc(line.slice(i));
        break;
      }
      html += esc(line.slice(i, open));
      const tagEnd = line.indexOf('}', open + 1);
      if (tagEnd === -1) {
        html += esc(line.slice(open));
        break;
      }
      const tag = line.slice(open + 1, tagEnd).trim();
      if (tag === '/') {
        i = tagEnd + 1;
        continue;
      }
      let depth = 1;
      let pos = tagEnd + 1;
      let closeStart = -1;
      while (pos < line.length && depth > 0) {
        const nextOpen = line.indexOf('{', pos);
        const nextClose = line.indexOf('{/}', pos);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          const innerEnd = line.indexOf('}', nextOpen + 1);
          if (innerEnd === -1) break;
          const innerTag = line.slice(nextOpen + 1, innerEnd).trim();
          if (innerTag !== '/') depth += 1;
          pos = innerEnd + 1;
          continue;
        }
        depth -= 1;
        if (depth === 0) closeStart = nextClose;
        else pos = nextClose + 4;
      }
      if (closeStart === -1) {
        html += esc(line.slice(open));
        break;
      }
      const inner = line.slice(tagEnd + 1, closeStart);
      const color = tag.startsWith('#') ? tag : ASCII_PALETTE[tag] || ASCII_PALETTE.default;
      const innerHtml = inner.includes('{') ? parseColoredLine(inner) : esc(inner);
      html += `<span class="eden-ascii-seg" style="color:${color}">${innerHtml}</span>`;
      i = closeStart + 4;
    }
    return html;
  }

  function parseColoredAscii(frame) {
    const text = String(frame || '');
    if (!text.includes('{')) {
      return esc(text)
        .split('\n')
        .map((ln) => `<span class="eden-ascii-line">${ln || '&nbsp;'}</span>`)
        .join('');
    }
    return text
      .split('\n')
      .map((line) => `<span class="eden-ascii-line">${parseColoredLine(line) || '&nbsp;'}</span>`)
      .join('');
  }

  function themeClassFor(anim) {
    const theme = String(anim?.theme || '').trim().toLowerCase();
    return THEME_CLASS[theme] || 'eden-theme-default';
  }

  function fetchConceptAnimation(slug) {
    return fetch(`${ANIM_BASE}${encodeURIComponent(slug)}.json?${DATA_CACHE_BUST}`, { cache: 'no-store' }).then(
      (r) => (r.ok ? r.json() : null)
    );
  }

  function resolveAnimation(bundle) {
    const embedded = bundle?.ascii_animation || bundle?.stem_animation;
    if (embedded?.scenes?.length || embedded?.frames?.length) {
      return Promise.resolve(embedded);
    }
    const slug = bundle?.slug;
    if (!slug) return Promise.resolve(null);
    return fetchConceptAnimation(slug);
  }

  function stopAnimation(host) {
    if (host?._animTimer) {
      clearInterval(host._animTimer);
      host._animTimer = null;
    }
  }

  function mountStemSvgAnimation(host, anim) {
    const scenes = anim?.scenes;
    if (!host || !scenes?.length) return false;
    stopAnimation(host);
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'eden-stem-anim';
    wrap.innerHTML = `
      <div class="eden-stem-anim-head">
        <span class="eden-stem-anim-badge">▶ STEM SCENE</span>
        <span class="eden-stem-anim-title">${esc(anim.title || 'Concept animation')}</span>
      </div>
      <div class="eden-stem-anim-stage" aria-live="polite">
        <svg class="eden-stem-anim-svg" viewBox="${esc(anim.viewBox || '0 0 640 360')}" role="img"></svg>
      </div>
      <p class="eden-stem-anim-caption"></p>
      <p class="eden-stem-anim-vo" hidden></p>`;
    host.appendChild(wrap);
    const svgEl = wrap.querySelector('.eden-stem-anim-svg');
    const capEl = wrap.querySelector('.eden-stem-anim-caption');
    const voEl = wrap.querySelector('.eden-stem-anim-vo');
    const voice = anim.voiceover || [];

    // Expand scenes by duration_frames for pacing.
    const timeline = [];
    scenes.forEach((sc, idx) => {
      const reps = Math.max(1, Math.min(6, Number(sc.duration_frames) || 3));
      for (let r = 0; r < reps; r += 1) timeline.push({ ...sc, _i: idx });
    });

    let i = 0;
    const tick = () => {
      const sc = timeline[i % timeline.length];
      const vb = anim.viewBox || '0 0 640 360';
      svgEl.setAttribute('viewBox', vb);
      svgEl.innerHTML = sc.svg || '';
      capEl.textContent = sc.caption || '';
      if (voice.length) {
        voEl.hidden = false;
        voEl.textContent = voice[sc._i % voice.length] || '';
      }
      i += 1;
    };
    tick();
    const fps = Math.max(0.35, Math.min(1.5, Number(anim.fps) || 0.55));
    host._animTimer = setInterval(tick, Math.round(1000 / fps));
    return true;
  }

  function mountAsciiAnimation(host, anim) {
    if (!host || !anim?.frames?.length) return false;
    stopAnimation(host);
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = `eden-ascii-anim ${themeClassFor(anim)}`;
    wrap.innerHTML = `
      <div class="eden-ascii-anim-head">
        <span class="eden-ascii-anim-badge">▶ LIVE SCENE</span>
        <span class="eden-ascii-anim-title">${esc(anim.title || 'Concept animation')}</span>
      </div>
      <div class="eden-ascii-anim-canvas" aria-live="polite"></div>
      <p class="eden-ascii-anim-caption"></p>`;
    host.appendChild(wrap);
    const frameEl = wrap.querySelector('.eden-ascii-anim-canvas');
    const capEl = wrap.querySelector('.eden-ascii-anim-caption');
    const frames = anim.frames;
    const captions = anim.captions || [];
    let i = 0;
    const tick = () => {
      const idx = i % frames.length;
      frameEl.innerHTML = parseColoredAscii(frames[idx]);
      capEl.textContent = captions[idx] || '';
      i += 1;
    };
    tick();
    const fps = Math.max(0.4, Math.min(2, Number(anim.fps) || 0.65));
    host._animTimer = setInterval(tick, Math.round(1000 / fps));
    return true;
  }

  function mountAnimation(host, anim) {
    if (!anim) return false;
    if (anim.video) {
      host.innerHTML = `
        <div class="eden-stem-anim">
          <div class="eden-stem-anim-head">
            <span class="eden-stem-anim-badge">▶ STEM VIDEO</span>
            <span class="eden-stem-anim-title">${esc(anim.title || 'Concept animation')}</span>
          </div>
          <video class="eden-stem-video" controls playsinline loop muted autoplay
            src="${ANIM_BASE}${encodeURIComponent(anim.video)}"></video>
          <p class="eden-stem-anim-caption">${esc((anim.voiceover || [])[0] || '')}</p>
        </div>`;
      return true;
    }
    if (Number(anim.version) >= 3 || anim.format === 'stem-svg' || anim.scenes?.length) {
      return mountStemSvgAnimation(host, anim);
    }
    return mountAsciiAnimation(host, anim);
  }

  function renderConceptDetail(root, bundle, onBack) {
    stopAnimation(root);
    root.innerHTML = '';
    const panel = document.createElement('article');
    panel.className = 'eden-concept-detail';
    const title = cleanDisplayName(bundle.display_name, bundle.slug);
    const analogy = bundle.analogy || bundle.guidance?.['How can I remember it intuitively?'] || '';
    const desc = cleanDescription(bundle);
    panel.innerHTML = `
      <button type="button" class="eden-concept-back">← Back to concepts</button>
      <div class="eden-concept-split">
        <div class="eden-concept-copy">
          <h3 class="eden-concept-title">${esc(title)}</h3>
          ${desc ? `<p class="eden-concept-desc">${esc(desc)}</p>` : ''}
          ${analogy ? `<section class="eden-concept-analogy"><h4>Think of it like this</h4><p>${esc(analogy)}</p></section>` : ''}
          ${bundle.everyday_applications ? `<section class="eden-concept-extra"><h4>Everyday life</h4><p>${esc(bundle.everyday_applications)}</p></section>` : ''}
          ${bundle.historical_context ? `<section class="eden-concept-extra"><h4>History</h4><p>${esc(bundle.historical_context)}</p></section>` : ''}
          ${bundle.cross_disciplinary_connections ? `<section class="eden-concept-extra"><h4>Connections</h4><p>${esc(bundle.cross_disciplinary_connections)}</p></section>` : ''}
        </div>
        <aside class="eden-concept-stage">
          <div class="eden-concept-anim-slot"><p class="sr-eval-hint">Loading scene…</p></div>
        </aside>
      </div>`;
    panel.querySelector('.eden-concept-back').addEventListener('click', onBack);
    root.appendChild(panel);
    const animSlot = panel.querySelector('.eden-concept-anim-slot');
    resolveAnimation(bundle).then((anim) => {
      animSlot.innerHTML = '';
      if (!mountAnimation(animSlot, anim)) {
        animSlot.innerHTML =
          '<p class="sr-eval-hint">Animation unavailable for this concept. Try another concept chip — STEM scenes are ready for all chapter concepts.</p>';
      }
    });
  }

  function mount(host, ctx) {
    if (!host || !ctx?.sku || !ctx?.subjectId || !ctx?.chapterId) {
      if (host) {
        host.innerHTML =
          '<p class="sr-eval-hint">Could not load concepts — missing chapter context. Go back and re-open the chapter.</p>';
      }
      return;
    }

    host.innerHTML = '';
    const wrap = document.createElement('section');
    wrap.className = 'eden-chapter-concepts sr-learn-section';
    wrap.innerHTML = `
      <h3>Concepts for this chapter</h3>
      <p class="eden-concept-lead">Tap a concept for an intuitive analogy and animated diagram.</p>
      <div class="eden-concept-mount"><p class="sr-eval-hint">Loading concepts…</p></div>`;
    host.appendChild(wrap);
    const mountEl = wrap.querySelector('.eden-concept-mount');

    const showList = (concepts) => {
      const filtered = (concepts || []).filter((c) => isValidSlug(c.slug));
      mountEl.innerHTML = '';
      if (!filtered.length) {
        mountEl.innerHTML =
          '<p class="sr-eval-hint">Concept links for this chapter are being mapped. Check back after the next knowledge sync.</p>';
        return;
      }
      renderConceptList(mountEl, filtered, (slug) => {
        mountEl.innerHTML = '<p class="sr-eval-hint">Loading concept…</p>';
        fetchConceptLearn(slug)
          .then((bundle) => renderConceptDetail(mountEl, bundle, () => showList(filtered)))
          .catch(() => {
            mountEl.innerHTML =
              '<p class="sr-eval-hint">Could not load this concept. Hard-refresh the page (Ctrl+Shift+R) and try again.</p>';
          });
      });
    };

    const timeout = setTimeout(() => {
      if (mountEl.textContent.includes('Loading concepts')) {
        mountEl.innerHTML =
          '<p class="sr-eval-hint">Concepts are taking longer than usual. Check your connection and hard-refresh (Ctrl+Shift+R).</p>';
      }
    }, 12000);

    fetchChapterConcepts(ctx.sku, ctx.subjectId, ctx.chapterId)
      .then((data) => {
        clearTimeout(timeout);
        showList(data.concepts || []);
      })
      .catch(() => {
        clearTimeout(timeout);
        mountEl.innerHTML =
          '<p class="sr-eval-hint">Could not load concept list. Hard-refresh (Ctrl+Shift+R) and try again.</p>';
      });
  }

  global.ChapterConcepts = {
    mount,
    loadCurriculum,
    chapterSlugs,
    findChapterMeta,
    fetchConceptLearn,
    fetchChapterConcepts,
    loadManifest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
