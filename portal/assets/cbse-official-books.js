/**
 * CBSE Official Books — NCERT spread, lecture player, sketch board, Word Hunt game.
 */
(function (global) {
  'use strict';

  let lectureTimer = null;
  let speechCancel = null;

  function stopLecture() {
    if (lectureTimer) clearTimeout(lectureTimer);
    lectureTimer = null;
    if (global.speechSynthesis) global.speechSynthesis.cancel();
    speechCancel = null;
  }

  function speak(text, onEnd) {
    if (!global.speechSynthesis) {
      onEnd?.();
      return;
    }
    global.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = u.rate;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    global.speechSynthesis.speak(u);
  }

  /** Simple animated pencil sketches keyed by subject discipline */
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
    let pageIdx = 0;

    host.innerHTML = `
      <div class="cbse-book-stage">
        <div class="cbse-book-cover">
          <span class="cbse-book-badge">NCERT Official</span>
          <h3>${entry?.title || ctx.chapterTitle}</h3>
          <p class="cbse-book-code">${entry?.ncertCode || ''} · ${ctx.subjectLabel || ''}</p>
          ${pdfUrl ? `<a class="btn-portal btn-portal-ghost cbse-pdf-link" href="${pdfUrl}" target="_blank" rel="noopener">📄 Open full chapter PDF</a>` : ''}
        </div>
        <div class="cbse-book-spread">
          <button type="button" class="cbse-page-turn prev" aria-label="Previous page">‹</button>
          <div class="cbse-book-page left" id="cbsePageLeft"></div>
          <div class="cbse-book-spine"></div>
          <div class="cbse-book-page right" id="cbsePageRight"></div>
          <button type="button" class="cbse-page-turn next" aria-label="Next page">›</button>
        </div>
        <p class="cbse-page-indicator" id="cbsePageIndicator">Page 1</p>
      </div>
      <div class="cbse-lecture-zone">
        <div class="cbse-sketch-wrap">
          <canvas id="cbseSketchCanvas" class="cbse-sketch-canvas"></canvas>
          <span class="cbse-sketch-label">Teacher board</span>
        </div>
        <div class="cbse-lecture-controls">
          <button type="button" class="btn-portal btn-portal-primary" id="cbsePlayLecture">▶ Play explanation</button>
          <button type="button" class="btn-portal btn-portal-ghost hidden" id="cbseStopLecture">⏹ Stop</button>
          <div class="cbse-dialogue" id="cbseDialogue"></div>
        </div>
      </div>
      <div id="cbseHangmanMount" class="cbse-hangman-mount"></div>`;

    const left = host.querySelector('#cbsePageLeft');
    const right = host.querySelector('#cbsePageRight');
    const indicator = host.querySelector('#cbsePageIndicator');
    const dialogue = host.querySelector('#cbseDialogue');
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

    function renderPages() {
      if (!pages.length) {
        left.innerHTML = '<p class="cbse-page-empty">Official transcript not available for this chapter yet.</p>';
        right.innerHTML = pdfUrl
          ? '<p>Open the NCERT PDF to read the full chapter.</p>'
          : '<p>Check back — content is being ingested.</p>';
        return;
      }
      const pL = pages[pageIdx] || pages[0];
      const pR = pages[pageIdx + 1] || null;
      left.innerHTML = renderPageHtml(pL);
      right.innerHTML = pR ? renderPageHtml(pR) : '<p class="cbse-page-end">End of chapter notes · turn back or play lecture.</p>';
      indicator.textContent = `Spread ${Math.floor(pageIdx / 2) + 1} · ${pages.length} sections`;
    }

    function renderPageHtml(page) {
      if (!page) return '';
      if (page.type === 'syllabus') {
        return `<h4>${page.title}</h4><ul>${(page.bullets || []).map((b) => `<li>${b}</li>`).join('')}</ul>`;
      }
      return `<h4>${page.title}</h4>${(page.beats || [])
        .map(
          (b) =>
            `<p class="cbse-beat cbse-beat-${b.role}"><strong>${b.speaker}:</strong> ${b.text}</p>`
        )
        .join('')}`;
    }

    renderPages();
    host.querySelector('.cbse-page-turn.prev')?.addEventListener('click', () => {
      pageIdx = Math.max(0, pageIdx - 2);
      renderPages();
    });
    host.querySelector('.cbse-page-turn.next')?.addEventListener('click', () => {
      pageIdx = Math.min(Math.max(0, pages.length - 1), pageIdx + 2);
      renderPages();
    });

    const beats = entry?.transcript?.beats || [];
    let beatIdx = 0;
    const playBtn = host.querySelector('#cbsePlayLecture');
    const stopBtn = host.querySelector('#cbseStopLecture');

    function playNextBeat() {
      if (beatIdx >= beats.length) {
        playBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        dialogue.innerHTML += '<p class="cbse-lecture-done">✓ Lecture complete — try Word Hunt below!</p>';
        return;
      }
      const b = beats[beatIdx];
      const line = document.createElement('p');
      line.className = `cbse-beat cbse-beat-${b.role} cbse-beat-live`;
      line.innerHTML = `<strong>${b.speaker}:</strong> ${b.text}`;
      dialogue.appendChild(line);
      dialogue.scrollTop = dialogue.scrollHeight;
      if (b.role === 'teacher') sketch.pulse();
      speak(b.text, () => {
        beatIdx += 1;
        lectureTimer = setTimeout(playNextBeat, 400);
      });
    }

    playBtn?.addEventListener('click', () => {
      stopLecture();
      beatIdx = 0;
      dialogue.innerHTML = '';
      playBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      sketch.start(discipline);
      playNextBeat();
    });

    stopBtn?.addEventListener('click', () => {
      stopLecture();
      sketch.stop();
      playBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
    });

    global.CBSEHangmanQuiz?.mount(host.querySelector('#cbseHangmanMount'), ctx);
  }

  function render(host, ctx, entry) {
    stopLecture();
    if (!entry || (!entry.hasTranscript && !entry.hasPdf)) {
      host.innerHTML = `
        <div class="cbse-official-empty">
          <span class="cbse-wip-icon">📖</span>
          <h3>Official NCERT content</h3>
          <p>No official book mapping for <strong>${ctx.chapterTitle}</strong> yet.</p>
          <p>Use <strong>Regular Study</strong> or <strong>Q &amp; A Practice</strong> tabs meanwhile.</p>
        </div>`;
      return;
    }
    renderBookSpread(host, entry, ctx);
  }

  global.CBSEOfficialBooks = { render, stopLecture };
})(typeof window !== 'undefined' ? window : globalThis);
