/**
 * Study Room Media — standalone mic, voice capture, playback, and TTS.
 * Provision on any study room via StudyRoomProvision (TOEFL, IELTS, DET, GRE verbal, etc.)
 */
(function (global) {
  'use strict';

  const state = {
    stream: null,
    recorder: null,
    chunks: [],
    recordings: [],
    recordingId: 0,
    analyser: null,
    audioCtx: null,
    rafId: null,
  };

  function supportsRecording() {
    return !!(navigator.mediaDevices?.getUserMedia && global.MediaRecorder);
  }

  function supportsSpeech() {
    return !!global.speechSynthesis;
  }

  async function requestMic() {
    if (!supportsRecording()) {
      throw new Error('Microphone recording is not supported in this browser.');
    }
    if (state.stream) return state.stream;
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    });
    return state.stream;
  }

  async function releaseMic() {
    if (state.recorder && state.recorder.state === 'recording') {
      state.recorder.stop();
    }
    state.stream?.getTracks().forEach((t) => t.stop());
    state.stream = null;
    state.recorder = null;
    if (state.audioCtx) {
      await state.audioCtx.close().catch(() => {});
      state.audioCtx = null;
    }
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  function startLevelMeter(canvas, stream) {
    if (!canvas || !stream) return () => {};
    const ctx2d = canvas.getContext('2d');
    state.audioCtx = state.audioCtx || new AudioContext();
    const source = state.audioCtx.createMediaStreamSource(stream);
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 256;
    source.connect(state.analyser);
    const data = new Uint8Array(state.analyser.frequencyBinCount);

    function draw() {
      state.rafId = requestAnimationFrame(draw);
      state.analyser.getByteFrequencyData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);
      const bars = 24;
      const step = Math.floor(data.length / bars);
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const bh = Math.max(4, v * h);
        ctx2d.fillStyle = `rgba(103, 232, 249, ${0.35 + v * 0.65})`;
        ctx2d.fillRect(i * (w / bars) + 2, h - bh, w / bars - 4, bh);
      }
    }
    draw();
    return () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.rafId = null;
    };
  }

  async function startRecording() {
    const stream = await requestMic();
    state.chunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    state.recorder = new MediaRecorder(stream, { mimeType: mime });
    return new Promise((resolve, reject) => {
      state.recorder.ondataavailable = (e) => {
        if (e.data.size) state.chunks.push(e.data);
      };
      state.recorder.onerror = () => reject(new Error('Recording failed'));
      state.recorder.onstart = () => resolve({ mimeType: mime });
      state.recorder.start(200);
    });
  }

  function stopRecording() {
    return new Promise((resolve) => {
      if (!state.recorder || state.recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      state.recorder.onstop = () => {
        const blob = new Blob(state.chunks, { type: state.recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const id = `rec-${++state.recordingId}`;
        const entry = { id, url, blob, createdAt: Date.now(), durationMs: null };
        state.recordings.push(entry);
        resolve(entry);
      };
      state.recorder.stop();
    });
  }

  function getRecording(id) {
    return state.recordings.find((r) => r.id === id) || null;
  }

  function playRecording(idOrUrl) {
    const rec = typeof idOrUrl === 'string' && idOrUrl.startsWith('blob:')
      ? { url: idOrUrl }
      : getRecording(idOrUrl);
    if (!rec?.url) return Promise.reject(new Error('Recording not found'));
    const audio = new Audio(rec.url);
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Playback failed'));
      audio.play().catch(reject);
    });
  }

  function speak(text, opts = {}) {
    if (!supportsSpeech()) {
      return Promise.reject(new Error('Text-to-speech not supported'));
    }
    return new Promise((resolve, reject) => {
      global.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text || ''));
      u.lang = opts.lang || 'en-US';
      u.rate = opts.rate ?? (opts.slow ? 0.88 : 1);
      u.pitch = opts.pitch ?? 1;
      const voices = global.speechSynthesis.getVoices();
      const pick = opts.voiceName
        ? voices.find((v) => v.name.includes(opts.voiceName))
        : voices.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) ||
          voices.find((v) => v.lang.startsWith('en'));
      if (pick) u.voice = pick;
      u.onend = () => resolve();
      u.onerror = (e) => reject(e.error || new Error('TTS failed'));
      global.speechSynthesis.speak(u);
    });
  }

  function stopSpeak() {
    global.speechSynthesis?.cancel();
  }

  /** Build a reusable mic toolbar into a host element. */
  function mountMicBar(host, opts = {}) {
    if (!host) return null;
    const maxSec = opts.maxSeconds || 45;
    host.innerHTML = '';
    host.classList.add('srm-mic-bar');

    const status = document.createElement('p');
    status.className = 'srm-mic-status';
    status.textContent = opts.hint || 'Allow microphone access to practice speaking.';

    const canvas = document.createElement('canvas');
    canvas.className = 'srm-level-meter';
    canvas.width = 240;
    canvas.height = 48;
    canvas.setAttribute('aria-hidden', 'true');

    const timer = document.createElement('span');
    timer.className = 'srm-timer';
    timer.textContent = `0:${String(maxSec).padStart(2, '0')}`;

    const row = document.createElement('div');
    row.className = 'srm-mic-controls';

    const btnRecord = document.createElement('button');
    btnRecord.type = 'button';
    btnRecord.className = 'btn-portal btn-portal-primary srm-btn-record';
    btnRecord.textContent = opts.recordLabel || '🎙 Start recording';

    const btnPlay = document.createElement('button');
    btnPlay.type = 'button';
    btnPlay.className = 'btn-portal btn-portal-ghost srm-btn-play';
    btnPlay.textContent = '▶ Play back';
    btnPlay.disabled = true;

    const btnStop = document.createElement('button');
    btnStop.type = 'button';
    btnStop.className = 'btn-portal btn-portal-ghost srm-btn-stop hidden';
    btnStop.textContent = '■ Stop';

    const list = document.createElement('ul');
    list.className = 'srm-recording-list';

    row.append(btnRecord, btnStop, btnPlay, timer);
    host.append(status, canvas, row, list);

    let lastRec = null;
    let stopMeter = () => {};
    let tickId = null;
    let startedAt = 0;

    function clearTick() {
      if (tickId) clearInterval(tickId);
      tickId = null;
    }

    function updateTimer(remaining) {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timer.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }

    btnRecord.addEventListener('click', async () => {
      try {
        const stream = await requestMic();
        stopMeter = startLevelMeter(canvas, stream);
        await startRecording();
        startedAt = Date.now();
        status.textContent = 'Recording… speak clearly into your microphone.';
        btnRecord.classList.add('hidden');
        btnStop.classList.remove('hidden');
        btnPlay.disabled = true;
        let left = maxSec;
        updateTimer(left);
        tickId = setInterval(async () => {
          left -= 1;
          updateTimer(left);
          if (left <= 0) btnStop.click();
        }, 1000);
      } catch (err) {
        status.textContent = err.message || 'Microphone access denied.';
      }
    });

    btnStop.addEventListener('click', async () => {
      clearTick();
      stopMeter();
      btnStop.classList.add('hidden');
      btnRecord.classList.remove('hidden');
      btnRecord.textContent = '🎙 Record again';
      lastRec = await stopRecording();
      if (lastRec) {
        lastRec.durationMs = Date.now() - startedAt;
        btnPlay.disabled = false;
        status.textContent = `Captured ${Math.round(lastRec.durationMs / 1000)}s. Play back to review.`;
        const li = document.createElement('li');
        li.textContent = `Take ${list.children.length + 1} · ${new Date(lastRec.createdAt).toLocaleTimeString()}`;
        list.prepend(li);
        opts.onRecorded?.(lastRec);
      }
    });

    btnPlay.addEventListener('click', () => {
      if (lastRec) playRecording(lastRec.id).catch(() => {});
    });

    return {
      getLastRecording: () => lastRec,
      setStatus: (t) => {
        status.textContent = t;
      },
      destroy: () => {
        clearTick();
        stopMeter();
      },
    };
  }

  /** Audio player for listening sections (TTS or URL). */
  function mountAudioPlayer(host, opts = {}) {
    if (!host) return null;
    host.innerHTML = '';
    host.classList.add('srm-audio-player');

    const title = document.createElement('p');
    title.className = 'srm-audio-title';
    title.textContent = opts.title || 'Listen';

    const note = document.createElement('p');
    note.className = 'srm-audio-note';
    note.textContent =
      opts.note || 'On the real TOEFL iBT you hear each clip once. Practice with one or two listens.';

    const row = document.createElement('div');
    row.className = 'srm-audio-controls';

    const btnPlay = document.createElement('button');
    btnPlay.type = 'button';
    btnPlay.className = 'btn-portal btn-portal-primary';
    btnPlay.textContent = '▶ Play audio';

    const btnReplay = document.createElement('button');
    btnReplay.type = 'button';
    btnReplay.className = 'btn-portal btn-portal-ghost';
    btnReplay.textContent = '↻ Listen again';
    btnReplay.disabled = true;

    const listens = document.createElement('span');
    listens.className = 'srm-listen-count';
    listens.textContent = 'Listens: 0';

    row.append(btnPlay, btnReplay, listens);
    host.append(title, note, row);

    let count = 0;
    const maxListens = opts.maxListens ?? 2;
    let playing = false;

    async function playOnce() {
      if (playing) return;
      if (count >= maxListens) {
        note.textContent = 'No listens left — answer from your notes (real test: one listen only).';
        return;
      }
      playing = true;
      btnPlay.disabled = true;
      try {
        if (opts.audioUrl) {
          const a = new Audio(opts.audioUrl);
          await new Promise((res, rej) => {
            a.onended = res;
            a.onerror = rej;
            a.play().catch(rej);
          });
        } else if (opts.script) {
          await speak(opts.script, { rate: opts.slow ? 0.9 : 1, lang: opts.lang || 'en-US' });
        }
        count += 1;
        listens.textContent = `Listens: ${count} / ${maxListens}`;
        btnReplay.disabled = count >= maxListens;
      } catch {
        note.textContent = 'Could not play audio. Check volume or try again.';
      } finally {
        playing = false;
        btnPlay.disabled = count >= maxListens;
      }
    }

    btnPlay.addEventListener('click', playOnce);
    btnReplay.addEventListener('click', playOnce);

    return { play: playOnce, getListenCount: () => count };
  }

  global.StudyRoomMedia = {
    supportsRecording,
    supportsSpeech,
    requestMic,
    releaseMic,
    startRecording,
    stopRecording,
    getRecording,
    playRecording,
    speak,
    stopSpeak,
    mountMicBar,
    mountAudioPlayer,
    listRecordings: () => [...state.recordings],
  };
})(typeof window !== 'undefined' ? window : globalThis);
