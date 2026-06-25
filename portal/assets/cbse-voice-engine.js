/**
 * CBSE classroom voices — British male teacher; student gender matched to name.
 */
(function (global) {
  'use strict';

  let voicesReady = null;
  let speakGen = 0;
  const TEACHER_GENDER = 'male';

  const FEMALE_STUDENTS = ['priya', 'sneha', 'ananya', 'kavya', 'meera', 'dia', 'neha'];
  const MALE_STUDENTS = ['rahul', 'amit', 'arjun', 'rohan', 'vikram', 'dev', 'aditya'];

  function loadVoices() {
    if (voicesReady) return voicesReady;
    voicesReady = new Promise((resolve) => {
      const pick = () => resolve(global.speechSynthesis?.getVoices() || []);
      pick();
      if (global.speechSynthesis) {
        global.speechSynthesis.onvoiceschanged = pick;
        setTimeout(pick, 500);
      }
    });
    return voicesReady;
  }

  function scoreTeacherVoice(v) {
    const n = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    let s = 0;
    if (lang.includes('en-gb')) s += 120;
    if (n.includes('british') || n.includes('uk english') || n.includes('en-gb')) s += 90;
    if (n.includes('daniel') || n.includes('george') || n.includes('ryan') || n.includes('thomas') || n.includes('arthur')) s += 80;
    if (n.includes('male') || n.includes('david') || n.includes('james') || n.includes('mark')) s += 30;
    if (n.includes('female') || n.includes('zira') || n.includes('samantha') || n.includes('hazel')) s -= 200;
    if (lang.includes('en-in')) s -= 30;
    if (lang.includes('en-us') && !lang.includes('gb')) s -= 10;
    return s;
  }

  function scoreStudentVoice(v, gender) {
    const n = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    let s = 0;
    if (lang.startsWith('en')) s += 20;
    if (gender === 'female') {
      if (n.includes('female') || n.includes('zira') || n.includes('samantha') || n.includes('hazel') || n.includes('susan')) s += 80;
      if (n.includes('male') || n.includes('david') || n.includes('george')) s -= 60;
    } else {
      if (n.includes('male') || n.includes('david') || n.includes('george') || n.includes('daniel')) s += 60;
      if (n.includes('female') || n.includes('zira') || n.includes('samantha')) s -= 80;
    }
    if (lang.includes('en-gb')) s += 15;
    return s;
  }

  function poolByGender(voices, gender, role) {
    const scoreFn = role === 'teacher' ? scoreTeacherVoice : (v) => scoreStudentVoice(v, gender);
    const english = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('en'));
    const pool = (english.length ? english : voices)
      .map((v) => ({ v, s: scoreFn(v) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.v);
    return pool.length ? pool : voices;
  }

  function pickVoice(voices, gender, seed, role) {
    const pool = poolByGender(voices, gender, role);
    const idx = Math.abs(String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
    return pool[idx] || voices.find((v) => v.default) || voices[0];
  }

  function studentGender(speaker) {
    const s = String(speaker || '')
      .toLowerCase()
      .replace(/\(.*\)/g, ' ')
      .replace(/[^a-z\s]/g, ' ');
    if (FEMALE_STUDENTS.some((n) => s.includes(n))) return 'female';
    if (MALE_STUDENTS.some((n) => s.includes(n))) return 'male';
    return 'male';
  }

  function resetTeacher() {
    /* Teacher voice is fixed — British male. */
  }

  function stop() {
    speakGen += 1;
    global.speechSynthesis?.cancel();
  }

  function speakUtterance(u, voices, onEnd, gen) {
    u.volume = 1;
    let attempts = 0;
    const fallbacks = [u.voice, ...poolByGender(voices, TEACHER_GENDER, 'teacher').slice(0, 4), voices[0]].filter(Boolean);

    const trySpeak = () => {
      if (gen !== speakGen) return;
      u.voice = fallbacks[attempts] || fallbacks[fallbacks.length - 1];
      u.onend = () => {
        if (gen !== speakGen) return;
        onEnd?.();
      };
      u.onerror = () => {
        if (gen !== speakGen) return;
        attempts += 1;
        if (attempts < fallbacks.length) trySpeak();
        else onEnd?.();
      };
      global.speechSynthesis.speak(u);
    };

    trySpeak();
  }

  function speakBeat(beat, onEnd) {
    if (!global.speechSynthesis) {
      onEnd?.();
      return;
    }
    const text = String(beat?.text || '').trim();
    if (!text) {
      onEnd?.();
      return;
    }
    const gen = ++speakGen;
    loadVoices().then((voices) => {
      if (!voices.length || gen !== speakGen) {
        onEnd?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      const isTeacher = beat.role === 'teacher';

      if (isTeacher) {
        u.voice = pickVoice(voices, TEACHER_GENDER, 'teacher-gb-male', 'teacher');
        u.pitch = 0.98;
        u.rate = 0.9;
        speakUtterance(u, voices, onEnd, gen);
        return;
      }

      const sg = studentGender(beat.speaker);
      u.voice = pickVoice(voices, sg, beat.speaker || 'student', 'student');
      u.pitch = sg === 'female' ? 1.12 : 1.0;
      u.rate = 0.95;
      speakUtterance(u, voices, onEnd, gen);
    });
  }

  function playChime(onEnd) {
    try {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) {
        onEnd?.();
        return;
      }
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.34);
      osc.onended = () => {
        ctx.close().catch(() => {});
        onEnd?.();
      };
    } catch {
      onEnd?.();
    }
  }

  function speakerLabel(beat) {
    if (beat.role === 'teacher') return 'Teacher (Sir)';
    const name = String(beat.speaker || 'Student')
      .replace(/\s*-\s*Interrupting/gi, '')
      .replace(/\(.*\)/, '')
      .trim();
    return `${name} · student`;
  }

  global.CBSEVoiceEngine = {
    loadVoices,
    speakBeat,
    stop,
    playChime,
    resetTeacher,
    speakerLabel,
    get teacherGender() {
      return TEACHER_GENDER;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
