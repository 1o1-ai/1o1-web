/**
 * IST-based simulated online presence for Anyo Brahmando Academy.
 * Peaks: 7 PM–1 AM and 10 AM–2 PM. Minimum 55 students online at any time.
 */
(function (global) {
  const MIN_STUDENTS = 55;
  const TOTAL_STUDENTS = 165;
  const TOTAL_TEACHERS = 10;
  const MIN_TEACHERS = 2;

  function istNow() {
    const s = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    return new Date(s);
  }

  function istHourDecimal(d) {
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  /** Deterministic pseudo-random 0..1 from seed */
  function seeded(seed) {
    const x = Math.sin(seed * 9999.1337) * 43758.5453;
    return x - Math.floor(x);
  }

  function attendanceRatio(h) {
    // Evening peak 19:00–01:00
    if (h >= 19 || h < 1) return 0.82 + seeded(Math.floor(h) + 19) * 0.12;
    // Morning peak 10:00–14:00
    if (h >= 10 && h < 14) return 0.62 + seeded(Math.floor(h) + 10) * 0.14;
    // Shoulder 7–10, 14–19
    if ((h >= 7 && h < 10) || (h >= 14 && h < 19)) return 0.38 + seeded(Math.floor(h) + 7) * 0.12;
    // Late night / early morning
    return 0.34 + seeded(Math.floor(h)) * 0.08;
  }

  function teacherRatio(h) {
    if (h >= 19 || h < 1) return 0.85;
    if (h >= 10 && h < 14) return 0.7;
    if (h >= 14 && h < 19) return 0.45;
    return 0.35;
  }

  function getOnlineCounts(extraRealStudents, extraRealTeachers, overrides) {
    const cfgOv =
      overrides ||
      (global.AnyoAcademyConfig && global.AnyoAcademyConfig.get(global.AnyoAcademyConfig.detectSku()).presence) ||
      null;
    const totalStudents = cfgOv?.totalStudents ?? TOTAL_STUDENTS;
    const totalTeachers = cfgOv?.totalTeachers ?? TOTAL_TEACHERS;
    const minStudents = cfgOv?.minStudents ?? MIN_STUDENTS;
    const minTeachers = cfgOv?.minTeachers ?? MIN_TEACHERS;
    const maxStudentsOnline = cfgOv?.maxStudentsOnline ?? totalStudents;
    const maxTeachersOnline = cfgOv?.maxTeachersOnline ?? totalTeachers;
    const tz = cfgOv?.timezone || 'Asia/Kolkata';
    const now = overrides?.timezone
      ? new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
      : istNow();
    const h = istHourDecimal(now);
    const minuteSeed = Math.floor(now.getTime() / 60000);

    let studentBots = Math.max(
      minStudents,
      Math.round(totalStudents * attendanceRatio(h) + seeded(minuteSeed) * 8 - 4)
    );
    studentBots = Math.min(totalStudents, studentBots, maxStudentsOnline);

    let teacherBots = Math.max(
      minTeachers,
      Math.round(totalTeachers * teacherRatio(h))
    );
    teacherBots = Math.min(totalTeachers, teacherBots, maxTeachersOnline);

    const realS = extraRealStudents || 0;
    const realT = extraRealTeachers || 0;

    return {
      studentsOnline: studentBots + realS,
      teachersOnline: teacherBots + realT,
      studentBotsOnline: studentBots,
      teacherBotsOnline: teacherBots,
      realStudentsOnline: realS,
      realTeachersOnline: realT,
      istLabel: now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      isPeak: (h >= 19 || h < 1) || (h >= 10 && h < 14),
    };
  }

  /** Pick which bot IDs appear online this minute */
  function pickOnlineBotIds(allBots, count, prefix) {
    const now = istNow();
    const seed = Math.floor(now.getTime() / 60000) + (prefix === 'teacher' ? 1000 : 0);
    const ids = allBots.map((b) => b.id);
    const scored = ids.map((id, i) => ({
      id,
      score: seeded(seed + i * 17 + id.length),
    }));
    scored.sort((a, b) => b.score - a.score);
    return new Set(scored.slice(0, count).map((x) => x.id));
  }

  const REAL_KEY = 'anyo_real_presence_v1';
  const STALE_MS = 120000;

  function registerRealUser(session, page) {
    if (!session || !session.username) return;
    try {
      const raw = localStorage.getItem(REAL_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const tabId = sessionStorage.getItem('anyo_tab_id') || `tab_${Date.now()}`;
      sessionStorage.setItem('anyo_tab_id', tabId);
      const entry = {
        tabId,
        username: session.username,
        role: session.role || 'student',
        page: page || location.pathname,
        isBot: false,
        lastSeen: Date.now(),
      };
      const filtered = list.filter((e) => e.tabId !== tabId && Date.now() - e.lastSeen < STALE_MS);
      filtered.push(entry);
      localStorage.setItem(REAL_KEY, JSON.stringify(filtered));
    } catch {
      /* ignore */
    }
  }

  function getRealUsersOnline() {
    try {
      const raw = localStorage.getItem(REAL_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw).filter((e) => Date.now() - e.lastSeen < STALE_MS);
      localStorage.setItem(REAL_KEY, JSON.stringify(list));
      return list;
    } catch {
      return [];
    }
  }

  function countRealByRole() {
    const users = getRealUsersOnline();
    let students = 0;
    let teachers = 0;
    users.forEach((u) => {
      if (u.role === 'teacher') teachers += 1;
      else students += 1;
    });
    return { students, teachers, users };
  }

  function startHeartbeat(session) {
    registerRealUser(session, location.pathname);
    setInterval(() => registerRealUser(session, location.pathname), 30000);
  }

  function formatOnlineBadge(counts) {
    return `${counts.teachersOnline} teachers · ${counts.studentsOnline} students online now (IST)`;
  }

  function mountOnlineBadges() {
    const real = countRealByRole();
    const counts = getOnlineCounts(real.students, real.teachers);
    const text = formatOnlineBadge(counts);
    document.querySelectorAll('[data-online-badge]').forEach((el) => {
      el.textContent = text;
      el.hidden = false;
    });
    document.querySelectorAll('[data-online-badge-short]').forEach((el) => {
      el.textContent = `${counts.teachersOnline} teachers · ${counts.studentsOnline} students online`;
      el.hidden = false;
    });
  }

  global.AnyoPresence = {
    getOnlineCounts,
    pickOnlineBotIds,
    registerRealUser,
    getRealUsersOnline,
    countRealByRole,
    startHeartbeat,
    formatOnlineBadge,
    mountOnlineBadges,
    istNow,
    MIN_STUDENTS,
    TOTAL_STUDENTS,
    TOTAL_TEACHERS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
