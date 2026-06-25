/**

 * CBSE Official Books — NCERT spread + audio lecture (no on-screen transcript).

 */

(function (global) {

  'use strict';

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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



    function drawBiology(p, pal) {
      const w = canvas.width / (global.devicePixelRatio || 1);
      const h = canvas.height / (global.devicePixelRatio || 1);
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 2;
      const cx = w / 2;
      const cy = h / 2;
      const t = Math.min(p, 1);
      if (t > 0.05) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.24 * Math.min(t * 1.4, 1), h * 0.18 * Math.min(t * 1.4, 1), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (t > 0.35) {
        ctx.fillStyle = pal.fill;
        ctx.beginPath();
        ctx.arc(cx, cy, 14 * Math.min((t - 0.35) * 2, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (t > 0.55) {
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.08, cy - h * 0.04);
        ctx.quadraticCurveTo(cx, cy - h * 0.18 * Math.min((t - 0.55) * 2, 1), cx + w * 0.08, cy - h * 0.04);
        ctx.stroke();
      }
    }

    let activeMode = 'default';

    function pickDrawFn(mode) {
      if (mode === 'mathematics') return drawTriangle;
      if (mode === 'physics') return drawAtom;
      if (mode === 'biology') return drawBiology;
      return drawBeaker;
    }

    return {

      start(mode) {
        activeMode = mode || activeMode || 'default';
        resize();
        progress = 0;
        const pal = palettes[activeMode] || palettes.default;
        const drawFn = pickDrawFn(activeMode);
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
        this.start(activeMode);
      },

      stop() {

        if (animId) cancelAnimationFrame(animId);

      },

      resize,

    };

  }



  function resolveDiscipline(ctx) {
    const sid = (ctx.subjectId || '').toLowerCase();
    if (sid === 'mathematics' || sid === 'math') return 'mathematics';
    if (sid === 'physics') return 'physics';
    if (sid === 'chemistry') return 'chemistry';
    if (sid === 'biology') return 'biology';
    if (sid === 'science') {
      const ch = (ctx.chapterId || '').toLowerCase();
      if (/life|control|repro|hered|source|human-eye/.test(ch)) return 'biology';
      if (/chem|acid|metal|carbon|electric|magnet|light/.test(ch)) return 'chemistry';
      return 'physics';
    }
    return 'chemistry';
  }

  function synthesizeBeatsFromPages(entry, ctx) {
    const pages = entry?.transcript?.pages || [];
    const concepts = pages.flatMap((p) => p.bullets || []).filter((b) => b && String(b).length > 8);
    const title = entry?.title || ctx.chapterTitle || 'this chapter';
    if (!concepts.length) return [];
    const beats = [
      {
        role: 'teacher',
        speaker: 'Teacher',
        text: `Let us walk through ${title}. Follow the NCERT pages and watch the board animation for each idea.`,
      },
    ];
    concepts.slice(0, 6).forEach((concept, i) => {
      const student = ['Priya', 'Rahul', 'Amit', 'Sneha'][i % 4];
      const topic = String(concept).split('.')[0].trim();
      beats.push({ role: 'student', speaker: student, text: `Ma'am, please explain ${topic}.` });
      beats.push({
        role: 'teacher',
        speaker: 'Teacher',
        text: `${topic}: note the definition, SI units if any, and one NCERT example. This is a favourite CBSE board checkpoint.`,
      });
    });
    return beats;
  }

  function renderBookSpread(host, entry, ctx) {

    const pages = entry?.transcript?.pages || [];

    const pdfUrl = entry?.pdf?.pdfUrl || '';

    const discipline = resolveDiscipline(ctx);

    let beats = (entry?.transcript?.beats || []).length
      ? entry.transcript.beats
      : synthesizeBeatsFromPages(entry, ctx);

    const chapterTitle = entry?.title || ctx.chapterTitle || 'this chapter';
    const steps = global.CBSELectureFlow?.prepareLectureBeats
      ? global.CBSELectureFlow.prepareLectureBeats(beats, chapterTitle)
      : beats.map((beat) => ({ kind: 'speak', beat }));

    const effectiveBeatCount = steps.filter((s) => s.kind === 'speak').length;



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

          <span class="cbse-sketch-label">Teacher board · ${discipline} animation</span>

        </div>

        <div class="cbse-lecture-controls">

          <p class="cbse-lecture-note">🎧 Classroom explanation — ${effectiveBeatCount} exchanges · Indian English voices</p>

          <div class="cbse-lecture-caption" id="cbseLectureCaption" aria-live="polite">
            <p class="cbse-caption-hint">${effectiveBeatCount ? 'Press Play to hear the teacher walk through this chapter.' : 'Teacher script is being indexed for this chapter — use Regular Study for video guides.'}</p>
          </div>

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

    const captionEl = host.querySelector('#cbseLectureCaption');

    const progressEl = host.querySelector('#cbseLectureProgress');

    const canvas = host.querySelector('#cbseSketchCanvas');

    const sketch = SketchBoard(canvas);

    global.requestAnimationFrame(() => sketch.start(discipline));



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



    const stepsRef = steps;

    let stepIdx = 0;

    const playBtn = host.querySelector('#cbsePlayLecture');

    const stopBtn = host.querySelector('#cbseStopLecture');



    function showCaption(beat) {
      if (!captionEl || !beat?.text) return;
      const roleLabel =
        beat.role === 'teacher'
          ? beat.speaker || 'Teacher'
          : beat.speaker || 'Student';
      captionEl.innerHTML = `<p class="cbse-caption-role">${escHtml(roleLabel)}</p><p class="cbse-caption-text">${escHtml(beat.text)}</p>`;
    }

    const firstSpeak = stepsRef.find((s) => s.kind === 'speak')?.beat;
    if (firstSpeak) showCaption(firstSpeak);

    function updateProgress() {

      if (!progressEl) return;

      const speakTotal = stepsRef.filter((s) => s.kind === 'speak').length || 1;
      const spoken = stepsRef.slice(0, stepIdx).filter((s) => s.kind === 'speak').length;
      const pct = Math.round((spoken / speakTotal) * 100);

      progressEl.innerHTML = `<div class="cbse-progress-bar"><div class="cbse-progress-fill" style="width:${pct}%"></div></div><span>${spoken} / ${speakTotal}</span>`;

    }



    function playNextStep() {

      if (stepIdx >= stepsRef.length) {

        playBtn.classList.remove('hidden');

        stopBtn.classList.add('hidden');

        speakerPill?.classList.add('hidden');

        progressEl.innerHTML = '<p class="cbse-lecture-done">✓ Lecture complete</p>';

        return;

      }

      const step = stepsRef[stepIdx++];

      if (step.kind === 'pause') {

        lectureTimer = setTimeout(playNextStep, step.ms || 400);

        return;

      }

      if (step.kind === 'chime') {

        if (global.CBSEVoiceEngine?.playChime) global.CBSEVoiceEngine.playChime(playNextStep);

        else playNextStep();

        return;

      }

      const b = step.beat;

      speakerPill?.classList.remove('hidden');

      showCaption(b);

      if (speakerName && global.CBSEVoiceEngine) {

        speakerName.textContent = global.CBSEVoiceEngine.speakerLabel(b);

      }

      if (b.role === 'teacher') sketch.pulse();

      updateProgress();



      const engine = global.CBSEVoiceEngine;

      if (engine) engine.speakBeat(b, playNextStep);

      else playNextStep();

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


