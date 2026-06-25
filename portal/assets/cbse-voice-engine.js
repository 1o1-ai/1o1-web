/**
 * CBSE classroom voices — prefer Indian English (en-IN); role-based pitch/rate.
 */
(function (global) {
  'use strict';

  let voicesReady = null;
  let teacherGender = Math.random() < 0.5 ? 'female' : 'male';

  function loadVoices() {
    if (voicesReady) return voicesReady;
    voicesReady = new Promise((resolve) => {
      const pick = () => {
        const v = global.speechSynthesis?.getVoices() || [];
        resolve(v);
      };
      pick();
      if (global.speechSynthesis) {
        global.speechSynthesis.onvoiceschanged = pick;
        setTimeout(pick, 400);
      }
    });
    return voicesReady;
  }

  function scoreVoice(v) {
    const n = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    let s = 0;
    if (lang.includes('en-in') || lang.includes('hi-in')) s += 100;
    if (n.includes('india') || n.includes('indian')) s += 80;
    if (n.includes('neerja') || n.includes('prabhat') || n.includes('kavya')) s += 90;
    if (n.includes('english') && n.includes('india')) s += 70;
    if (lang.startsWith('en') && !lang.includes('gb') && !lang.includes('uk')) s += 20;
    if (n.includes('google') && lang.includes('in')) s += 60;
    if (n.includes('microsoft')) s += 10;
    if (lang.includes('en-gb') || n.includes('british') || n.includes('uk english')) s -= 40;
    if (n.includes('us ') || lang.includes('en-us')) s -= 15;
    return s;
  }

  function poolByGender(voices, gender) {
    const indian = voices.filter((v) => scoreVoice(v) > 30).sort((a, b) => scoreVoice(b) - scoreVoice(a));
    const fallback = voices.filter((v) => (v.lang || '').startsWith('en')).sort((a, b) => scoreVoice(b) - scoreVoice(a));
    const pool = indian.length ? indian : fallback;

    const femaleHints = ['neerja', 'kavya', 'female', 'woman', 'zira', 'samantha', 'priya'];
    const maleHints = ['prabhat', 'male', 'man', 'david', 'ravi', 'amit'];

    const isFemale = (v) => {
      const n = v.name.toLowerCase();
      return femaleHints.some((h) => n.includes(h));
    };
    const isMale = (v) => {
      const n = v.name.toLowerCase();
      return maleHints.some((h) => n.includes(h)) || (!isFemale(v) && !n.includes('female'));
    };

    if (gender === 'female') {
      const f = pool.filter(isFemale);
      return f.length ? f : pool;
    }
    const m = pool.filter(isMale);
    return m.length ? m : pool;
  }

  function pickVoice(voices, gender, seed) {
    const pool = poolByGender(voices, gender);
    if (!pool.length) return voices.find((v) => v.default) || voices[0];
    const idx = Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
    return pool[idx] || voices.find((v) => v.default) || voices[0];
  }

  function speakUtterance(u, voices, onEnd) {
    u.volume = 1;
    let attempts = 0;
    const fallbacks = [
      u.voice,
      voices.find((v) => v.default),
      voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')),
      voices[0],
    ].filter(Boolean);

    const trySpeak = () => {
      const voice = fallbacks[attempts] || fallbacks[fallbacks.length - 1];
      u.voice = voice;
      u.onend = () => onEnd?.();
      u.onerror = () => {
        attempts += 1;
        if (attempts < fallbacks.length) {
          trySpeak();
          return;
        }
        onEnd?.();
      };
      global.speechSynthesis.speak(u);
    };

    global.speechSynthesis.cancel();
    trySpeak();
  }

  function studentGender(speaker) {
    const s = (speaker || '').toLowerCase();
    if (s.includes('priya') || s.includes('sneha') || s.includes('ananya') || s.includes('female')) return 'female';
    if (s.includes('rahul') || s.includes('amit') || s.includes('arjun') || s.includes('male')) return 'male';
    return Math.random() < 0.5 ? 'female' : 'male';
  }

  function resetTeacher() {
    teacherGender = Math.random() < 0.5 ? 'female' : 'male';
  }

  /**
   * @param {{ role: 'teacher'|'student', speaker?: string, text: string }} beat
   */
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
    loadVoices().then((voices) => {
      if (!voices.length) {
        onEnd?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      const isTeacher = beat.role === 'teacher';

      if (isTeacher) {
        u.voice = pickVoice(voices, teacherGender, 'teacher-' + teacherGender);
        u.pitch = teacherGender === 'female' ? 1.05 : 0.96;
        u.rate = 0.92;
      } else {
        const sg = studentGender(beat.speaker);
        u.voice = pickVoice(voices, sg, beat.speaker || 'student');
        u.pitch = sg === 'female' ? 1.18 : 1.05;
        u.rate = 0.96;
      }

      speakUtterance(u, voices, onEnd);
    });
  }

  function stop() {
    global.speechSynthesis?.cancel();
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
    if (beat.role === 'teacher') {
      return teacherGender === 'female' ? 'Teacher (Ma\'am)' : 'Teacher (Sir)';
    }
    const sg = studentGender(beat.speaker);
    const name = (beat.speaker || 'Student').replace(/\(.*\)/, '').trim();
    return sg === 'female' ? `${name} · student` : `${name} · student`;
  }

  global.CBSEVoiceEngine = {
    loadVoices,
    speakBeat,
    stop,
    playChime,
    resetTeacher,
    speakerLabel,
    get teacherGender() {
      return teacherGender;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
