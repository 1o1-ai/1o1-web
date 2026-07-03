/**
 * CBSE 10 study room — attempt analytics & teacher grading queue (local profile).
 */
(function (global) {
  'use strict';

  const PROFILE_KEY = 'cbse10_study_profile';
  const TEACHER_QUEUE_KEY = 'cbse10_teacher_grading_queue';
  const FORUM_GRADING_KEY = 'cbse10_forum_grading_threads';
  const DEFAULT_USER = { id: 'student', name: 'Student', grade: '10' };

  function capitalizeName(value) {
    const s = String(value || '').trim();
    if (!s) return DEFAULT_USER.name;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function isDemoProfile(user) {
    if (!user) return true;
    const id = String(user.id || '').toLowerCase();
    const name = String(user.name || '').toLowerCase();
    return id.includes('demo') || name.includes('demo') || id === 'yoga-demo';
  }

  function resolveStudyUser() {
    const session = global.getPortalSession?.();
    if (session) {
      return { id: session, name: capitalizeName(session), grade: '10' };
    }
    try {
      const raw = global.localStorage?.getItem(PROFILE_KEY);
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile.user && !isDemoProfile(profile.user)) {
          return {
            id: profile.user.id || DEFAULT_USER.id,
            name: profile.user.name || DEFAULT_USER.name,
            grade: profile.user.grade || '10',
          };
        }
      }
    } catch {
      /* */
    }
    return { ...DEFAULT_USER };
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const profile = JSON.parse(raw);
        profile.user = resolveStudyUser();
        return profile;
      }
    } catch {
      /* */
    }
    return { user: resolveStudyUser(), attempts: [] };
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function loadTeacherQueue() {
    try {
      const raw = localStorage.getItem(TEACHER_QUEUE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* */
    }
    return { submissions: [] };
  }

  function saveTeacherQueue(queue) {
    localStorage.setItem(TEACHER_QUEUE_KEY, JSON.stringify(queue));
  }

  function loadForumGradingThreads() {
    try {
      const raw = localStorage.getItem(FORUM_GRADING_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* */
    }
    return { threads: [] };
  }

  function saveForumGradingThreads(data) {
    localStorage.setItem(FORUM_GRADING_KEY, JSON.stringify(data));
  }

  /**
   * @param {object} attempt
   */
  function recordAttempt(attempt) {
    const user = resolveStudyUser();
    const profile = loadProfile();
    profile.user = user;
    profile.attempts.push({
      ...attempt,
      userId: user.id,
      userName: user.name,
      recordedAt: new Date().toISOString(),
    });
    if (profile.attempts.length > 200) profile.attempts = profile.attempts.slice(-200);
    saveProfile(profile);
    return profile.attempts[profile.attempts.length - 1];
  }

  function buildForumThread(submission) {
    const user = resolveStudyUser();
    const threadId = 'thr_grade_' + Date.now();
    const answerLines = (submission.answers || [])
      .map((a, i) => {
        const ans =
          a.selectedIndex != null
            ? String.fromCharCode(65 + a.selectedIndex) + '. ' + (a.studentAnswer || '')
            : a.studentAnswer || '(no answer)';
        return `Q${i + 1}. ${a.prompt.slice(0, 120)}${a.prompt.length > 120 ? '…' : ''}\nAnswer: ${ans.slice(0, 200)}`;
      })
      .join('\n\n');

    const body =
      `Please grade my ${submission.chapterTitle} answer sheet (${submission.answers?.length || 0} responses).\n` +
      `Subject: ${submission.subject} · Source: ${submission.questionSource || 'official'}\n` +
      `Focus score: ${submission.focusScore}% · Session: ${Math.round((submission.sessionDurationMs || 0) / 1000)}s\n\n` +
      answerLines;

    return {
      id: threadId,
      title: `[Grade me] ${submission.chapterTitle} · ${submission.answers?.length || 0} answers`,
      subject: submission.subject,
      chapter: submission.chapterId,
      chapter_title: submission.chapterTitle,
      tags: ['grading_request', 'study_room'],
      reply_count: 1,
      grade: '10',
      grading_status: 'pending_teacher',
      submission_id: submission.sessionId,
      posts: [
        {
          author_id: user.id,
          author_name: user.name,
          author_role: 'student',
          location: 'CBSE 10 Study Room',
          photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          body,
          created_at: new Date().toISOString(),
        },
      ],
    };
  }

  function submitToTeacherQueue(submission) {
    const user = resolveStudyUser();
    const queue = loadTeacherQueue();
    const forumData = loadForumGradingThreads();
    const forumThread = buildForumThread(submission);
    const entry = {
      id: 'tg_' + Date.now(),
      status: 'pending_teacher',
      forumThreadId: forumThread.id,
      ...submission,
      userId: user.id,
      userName: user.name,
      submittedAt: new Date().toISOString(),
    };
    queue.submissions.unshift(entry);
    if (queue.submissions.length > 100) queue.submissions = queue.submissions.slice(0, 100);
    saveTeacherQueue(queue);

    forumData.threads.unshift(forumThread);
    if (forumData.threads.length > 50) forumData.threads = forumData.threads.slice(0, 50);
    saveForumGradingThreads(forumData);

    return entry;
  }

  global.CBSE10EvalStore = {
    getStudyUser: resolveStudyUser,
    loadProfile,
    recordAttempt,
    submitToTeacherQueue,
    loadTeacherQueue,
    loadForumGradingThreads,
  };
})(typeof window !== 'undefined' ? window : globalThis);
