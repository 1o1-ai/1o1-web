/**

 * CBSE Official Books — NCERT spread + audio lecture (no on-screen transcript).

 */

(function (global) {

  'use strict';



  let lectureTimer = null;



  function stopLecture() {

    if (lectureTimer) clearTimeout(lectureTimer);

    lectureTimer = null;

    global.CBSEVoiceEngine?.stop?.();

  }



  let pdfJsPromise = null;



  function ensurePdfJs() {

    if (global.pdfjsLib) return Promise.resolve(global.pdfjsLib);

    if (pdfJsPromise) return pdfJsPromise;

    pdfJsPromise = new Promise((resolve, reject) => {

      const s = document.createElement('script');

      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

      s.async = true;

      s.onload = () => {

        if (global.pdfjsLib) {

          global.pdfjsLib.GlobalWorkerOptions.workerSrc =

            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          resolve(global.pdfjsLib);

        } else reject(new Error('PDF engine failed to load'));

      };

      s.onerror = () => reject(new Error('PDF engine failed to load'));

      document.head.appendChild(s);

    });

    return pdfJsPromise;

  }



  async function renderOfficialBookPages(scrollEl, pdfUrl, onProgress) {

    const pdfjs = await ensurePdfJs();

    const pdf = await pdfjs.getDocument({ url: pdfUrl }).promise;

    scrollEl.innerHTML = '';

    const dpr = global.devicePixelRatio || 1;

    const containerWidth = scrollEl.clientWidth || scrollEl.parentElement?.clientWidth || 640;

    for (let num = 1; num <= pdf.numPages; num++) {

      const page = await pdf.getPage(num);

      const baseViewport = page.getViewport({ scale: 1 });

      const scale = Math.min(1.6, Math.max(0.85, (containerWidth - 24) / baseViewport.width));

      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');

      canvas.className = 'cbse-book-page-canvas';

      canvas.dataset.page = String(num);

      const ctx = canvas.getContext('2d');

      canvas.width = Math.floor(viewport.width * dpr);

      canvas.height = Math.floor(viewport.height * dpr);

      canvas.style.width = `${Math.floor(viewport.width)}px`;

      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const wrap = document.createElement('div');

      wrap.className = 'cbse-book-page-wrap';

      wrap.id = `cbseBookPage-${num}`;

      wrap.appendChild(canvas);

      scrollEl.appendChild(wrap);

      onProgress?.(num, pdf.numPages);

    }

    return pdf.numPages;

  }



  function SketchBoard(canvas) {

    const ctx = canvas.getContext('2d');

    let animId = null;

    let progress = 0;



    const palettes = {

      chemistry: { stroke: '#fbbf24', fill: 'rgba(251,191,36,0.15)' },

      biology: { stroke: '#34d399', fill: 'rgba(52,211,153,0.12)' },

      physics: { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.12)' },

      mathematics: { stroke: '#c084fc', fill: 'rgba(192,132,252,0.12)' },

      default: { stroke: '#94a3b8', fill: 'rgba(148,163,184,0.1)' },

    };



    function resize() {

      const rect = canvas.parentElement.getBoundingClientRect();

      canvas.width = rect.width * (global.devicePixelRatio || 1);

      canvas.height = rect.height * (global.devicePixelRatio || 1);

      canvas.style.width = rect.width + 'px';

      canvas.style.height = rect.height + 'px';

      ctx.setTransform(global.devicePixelRatio || 1, 0, 0, global.devicePixelRatio || 1, 0, 0);

    }



    function drawBeaker(p, pal) {

      const w = canvas.width / (global.devicePixelRatio || 1);

      const h = canvas.height / (global.devicePixelRatio || 1);

      ctx.strokeStyle = pal.stroke;

      ctx.lineWidth = 2;

      ctx.lineCap = 'round';

      ctx.beginPath();

      const t = Math.min(p, 1);

      const pts = [

        [w * 0.35, h * 0.2],

        [w * 0.35, h * 0.65],

        [w * 0.45, h * 0.78],

        [w * 0.55, h * 0.78],

        [w * 0.65, h * 0.65],

        [w * 0.65, h * 0.2],

      ];

      const n = Math.floor(t * pts.length);

      for (let i = 0; i <= n; i++) {

        const pt = pts[Math.min(i, pts.length - 1)];

        if (i === 0) ctx.moveTo(pt[0], pt[1]);

        else ctx.lineTo(pt[0], pt[1]);

      }

      ctx.stroke();

      if (p > 0.6) {

        ctx.fillStyle = pal.fill;

        ctx.fillRect(w * 0.38, h * 0.55, w * 0.24, h * 0.18);

      }

    }



    function drawAtom(p, pal) {

      const w = canvas.width / (global.devicePixelRatio || 1);

      const h = canvas.height / (global.devicePixelRatio || 1);

      ctx.strokeStyle = pal.stroke;

      ctx.lineWidth = 1.5;

      const cx = w / 2;

      const cy = h / 2;

      if (p > 0.1) {

        ctx.beginPath();

        ctx.arc(cx, cy, 8, 0, Math.PI * 2 * Math.min((p - 0.1) / 0.2, 1));

        ctx.stroke();

      }

      for (let i = 0; i < 3; i++) {

        const phase = p - 0.3 - i * 0.15;

        if (phase <= 0) continue;

        ctx.save();

        ctx.translate(cx, cy);

        ctx.rotate((i * Math.PI) / 3);

        ctx.beginPath();

        ctx.ellipse(0, 0, w * 0.22 * Math.min(phase * 2, 1), h * 0.08 * Math.min(phase * 2, 1), 0, 0, Math.PI * 2);

        ctx.stroke();

        ctx.restore();

      }

    }



    function drawTriangle(p, pal) {

      const w = canvas.width / (global.devicePixelRatio || 1);

      const h = canvas.height / (global.devicePixelRatio || 1);

      ctx.strokeStyle = pal.stroke;

      ctx.lineWidth = 2;

      const pts = [

        [w * 0.5, h * 0.22],

        [w * 0.28, h * 0.72],

        [w * 0.72, h * 0.72],

        [w * 0.5, h * 0.22],

      ];

      const t = Math.min(p, 1);

      ctx.beginPath();

      const steps = Math.floor(t * 4);

      for (let i = 0; i <= steps; i++) {

        const pt = pts[Math.min(i, 3)];

        if (i === 0) ctx.moveTo(pt[0], pt[1]);

        else ctx.lineTo(pt[0], pt[1]);

      }

      ctx.stroke();

    }



    return {

      start(mode) {

        resize();

        progress = 0;

        const pal = palettes[mode] || palettes.default;

        const drawFn = mode === 'mathematics' ? drawTriangle : mode === 'physics' ? drawAtom : drawBeaker;

        if (animId) cancelAnimationFrame(animId);

        const tick = () => {

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'rgba(15,23,42,0.4)';

          ctx.fillRect(0, 0, canvas.width, canvas.height);

          drawFn(progress, pal);

          progress += 0.008;

          if (progress < 1.2) animId = requestAnimationFrame(tick);

        };

        tick();

      },

      pulse() {

        progress = 0.2;

      },

      stop() {

        if (animId) cancelAnimationFrame(animId);

      },

      resize,

    };

  }



  function renderBookSpread(host, entry, ctx) {

    const pages = entry?.transcript?.pages || [];

    const pdfUrl = entry?.pdf?.pdfUrl || '';

    const beatCount = entry?.transcript?.beatCount || entry?.transcript?.beats?.length || 0;



    host.innerHTML = `

      <div class="cbse-book-stage">

        <div class="cbse-book-cover">

          <span class="cbse-book-badge">NCERT Official</span>

          <h3>${entry?.title || ctx.chapterTitle}</h3>

          <p class="cbse-book-code">${entry?.ncertCode || ''} · ${ctx.subjectLabel || ''}</p>

          ${pdfUrl ? `<button type="button" class="btn-portal btn-portal-primary cbse-open-book" id="cbseOpenBook">📖 Open Official Book</button>` : ''}

        </div>

        <div class="cbse-book-reader hidden" id="cbseBookReader">

          <div class="cbse-book-reader-head">

            <span class="cbse-book-reader-title">${entry?.title || ctx.chapterTitle}</span>

            <span class="cbse-book-reader-page" id="cbseBookPageLabel">Loading…</span>

            <button type="button" class="cbse-book-close" id="cbseCloseBook" aria-label="Close official book">✕ Close</button>

          </div>

          <div class="cbse-book-scroll" id="cbseBookScroll" tabindex="0" aria-label="Official book pages"></div>

          <div class="cbse-book-reader-nav">

            <button type="button" class="cbse-page-turn prev" id="cbseBookPrev" aria-label="Previous page">‹</button>

            <span class="cbse-book-scroll-hint">Scroll to read · use arrows for page jumps</span>

            <button type="button" class="cbse-page-turn next" id="cbseBookNext" aria-label="Next page">›</button>

          </div>

        </div>

        <div class="cbse-book-outline" id="cbseBookOutline"></div>

      </div>

      <div class="cbse-lecture-zone cbse-lecture-audio-only">

        <div class="cbse-sketch-wrap cbse-sketch-large">

          <canvas id="cbseSketchCanvas" class="cbse-sketch-canvas"></canvas>

          <span class="cbse-sketch-label">Teacher board · listen &amp; watch</span>

        </div>

        <div class="cbse-lecture-controls">

          <p class="cbse-lecture-note">🎧 Classroom explanation — ${beatCount} exchanges · Indian English voices · transcript hidden</p>

          <div class="cbse-speaker-pill hidden" id="cbseSpeakerPill">

            <span class="cbse-speaker-dot"></span>

            <span id="cbseSpeakerName">Teacher</span>

          </div>

          <div class="cbse-lecture-progress" id="cbseLectureProgress"></div>

          <button type="button" class="btn-portal btn-portal-primary" id="cbsePlayLecture">▶ Play explanation</button>

          <button type="button" class="btn-portal btn-portal-ghost hidden" id="cbseStopLecture">⏹ Stop</button>

        </div>

      </div>`;



    const outline = host.querySelector('#cbseBookOutline');

    const reader = host.querySelector('#cbseBookReader');

    const scrollEl = host.querySelector('#cbseBookScroll');

    const pageLabel = host.querySelector('#cbseBookPageLabel');

    const openBtn = host.querySelector('#cbseOpenBook');

    const speakerPill = host.querySelector('#cbseSpeakerPill');

    const speakerName = host.querySelector('#cbseSpeakerName');

    const progressEl = host.querySelector('#cbseLectureProgress');

    const canvas = host.querySelector('#cbseSketchCanvas');

    const sketch = SketchBoard(canvas);

    const discipline =

      ctx.subjectId === 'mathematics' || ctx.subjectId === 'math'

        ? 'mathematics'

        : ctx.subjectId === 'physics'

          ? 'physics'

          : ctx.subjectId === 'chemistry'

            ? 'chemistry'

            : ctx.subjectId === 'biology'

              ? 'biology'

              : 'chemistry';



    function renderOutline() {

      if (!outline) return;

      if (!pages.length) {

        outline.innerHTML = '';

        return;

      }

      outline.innerHTML = `

        <details class="cbse-outline-details" open>

          <summary>Chapter outline</summary>

          <div class="cbse-outline-pages">${pages

            .map(

              (p) =>

                `<section class="cbse-outline-section"><h4>${p.title}</h4><ul>${(p.bullets || [])

                  .map((b) => `<li>${b}</li>`)

                  .join('')}</ul></section>`

            )

            .join('')}</div>

        </details>`;

    }



    let totalBookPages = 0;

    let bookLoaded = false;



    function updateVisiblePage() {

      if (!scrollEl || !pageLabel || !totalBookPages) return;

      const wraps = scrollEl.querySelectorAll('.cbse-book-page-wrap');

      if (!wraps.length) return;

      const mid = scrollEl.scrollTop + scrollEl.clientHeight * 0.35;

      let current = 1;

      wraps.forEach((w, i) => {

        if (w.offsetTop <= mid) current = i + 1;

      });

      pageLabel.textContent = `Page ${current} of ${totalBookPages}`;

    }



    async function openOfficialBook() {

      if (!pdfUrl || !reader || !scrollEl) return;

      reader.classList.remove('hidden');

      openBtn?.classList.add('hidden');

      if (bookLoaded) {

        updateVisiblePage();

        return;

      }

      pageLabel.textContent = 'Loading book…';

      scrollEl.innerHTML = '<p class="cbse-book-loading">Opening official book…</p>';

      try {

        totalBookPages = await renderOfficialBookPages(scrollEl, pdfUrl, (n, total) => {

          pageLabel.textContent = `Loading page ${n} of ${total}…`;

        });

        bookLoaded = true;

        pageLabel.textContent = `Page 1 of ${totalBookPages}`;

        scrollEl.addEventListener('scroll', updateVisiblePage, { passive: true });

        updateVisiblePage();

      } catch (err) {

        scrollEl.innerHTML = `<p class="cbse-book-error">Could not open the official book. Please try again in a moment.</p>`;

        pageLabel.textContent = 'Unavailable';

        console.warn('Official book load failed', err);

      }

    }



    renderOutline();

    openBtn?.addEventListener('click', openOfficialBook);

    host.querySelector('#cbseBookPrev')?.addEventListener('click', () => {

      if (!scrollEl) return;

      const step = Math.max(200, scrollEl.clientHeight * 0.85);

      scrollEl.scrollBy({ top: -step, behavior: 'smooth' });

    });

    host.querySelector('#cbseBookNext')?.addEventListener('click', () => {

      if (!scrollEl) return;

      const step = Math.max(200, scrollEl.clientHeight * 0.85);

      scrollEl.scrollBy({ top: step, behavior: 'smooth' });

    });



    host.querySelector('#cbseCloseBook')?.addEventListener('click', () => {

      reader?.classList.add('hidden');

      openBtn?.classList.remove('hidden');

    });



    const rawBeats = entry?.transcript?.beats || [];

    const lectureSteps = global.CBSELectureFlow?.prepareLectureBeats?.(

      rawBeats,

      entry?.title || ctx.chapterTitle

    ) || rawBeats.map((beat) => ({ kind: 'speak', beat }));



    let stepIdx = 0;

    const speakSteps = lectureSteps.filter((s) => s.kind === 'speak');

    const playBtn = host.querySelector('#cbsePlayLecture');

    const stopBtn = host.querySelector('#cbseStopLecture');



    function updateProgress() {

      if (!progressEl) return;

      const spoken = lectureSteps.slice(0, stepIdx).filter((s) => s.kind === 'speak').length;

      const total = speakSteps.length || 1;

      const pct = Math.round((spoken / total) * 100);

      progressEl.innerHTML = `<div class="cbse-progress-bar"><div class="cbse-progress-fill" style="width:${pct}%"></div></div><span>${spoken} / ${total}</span>`;

    }



    function playNextStep() {

      if (stepIdx >= lectureSteps.length) {

        playBtn.classList.remove('hidden');

        stopBtn.classList.add('hidden');

        speakerPill?.classList.add('hidden');

        progressEl.innerHTML = '<p class="cbse-lecture-done">✓ Lecture complete — try the Quiz tab when you are ready!</p>';

        return;

      }

      const step = lectureSteps[stepIdx];

      stepIdx += 1;



      if (step.kind === 'pause') {

        lectureTimer = setTimeout(playNextStep, step.ms || 500);

        updateProgress();

        return;

      }



      if (step.kind === 'chime') {

        const engine = global.CBSEVoiceEngine;

        if (engine?.playChime) engine.playChime(playNextStep);

        else lectureTimer = setTimeout(playNextStep, 200);

        return;

      }



      const b = step.beat;

      speakerPill?.classList.remove('hidden');

      if (speakerName && global.CBSEVoiceEngine) {

        speakerName.textContent = global.CBSEVoiceEngine.speakerLabel(b);

      }

      if (b.role === 'teacher') sketch.pulse();

      updateProgress();



      const engine = global.CBSEVoiceEngine;

      const done = () => {

        lectureTimer = setTimeout(playNextStep, 380);

      };

      if (engine) engine.speakBeat(b, done);

      else done();

    }



    playBtn?.addEventListener('click', () => {

      stopLecture();

      global.CBSEVoiceEngine?.resetTeacher?.();

      stepIdx = 0;

      playBtn.classList.add('hidden');

      stopBtn.classList.remove('hidden');

      sketch.start(discipline);

      updateProgress();

      playNextStep();

    });



    stopBtn?.addEventListener('click', () => {

      stopLecture();

      sketch.stop();

      playBtn.classList.remove('hidden');

      stopBtn.classList.add('hidden');

      speakerPill?.classList.add('hidden');

    });

  }



  function render(host, ctx, entry) {

    stopLecture();

    if (!entry || (!entry.hasTranscript && !entry.hasPdf)) {

      host.innerHTML = `

        <div class="cbse-official-empty">

          <span class="cbse-wip-icon">📖</span>

          <h3>Official NCERT content</h3>

          <p>No official book mapping for <strong>${ctx.chapterTitle}</strong> yet.</p>

        </div>`;

      return;

    }

    renderBookSpread(host, entry, ctx);

  }



  global.CBSEOfficialBooks = { render, stopLecture };

})(typeof window !== 'undefined' ? window : globalThis);


