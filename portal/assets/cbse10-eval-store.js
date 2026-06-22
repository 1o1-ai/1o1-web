/**
 * CBSE 10 study room — attempt analytics & teacher grading queue (local profile).
 */
(function (global) {
  'use strict';

  const PROFILE_KEY = 'cbse10_study_profile';
  const TEACHER_QUEUE_KEY = 'cbse10_teacher_grading_queue';
  const FORUM_GRADING_KEY = 'cbse10_forum_grading_threads';
  const DUMMY_USER = { id: 'yoga-demo', name: 'Yoga Demo Student', grade: '10' };

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* */
    }
    return { user: DUMMY_USER, attempts: [] };
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
    const profile = loadProfile();
    profile.attempts.push({
      ...attempt,
      userId: DUMMY_USER.id,
      userName: DUMMY_USER.name,
      recordedAt: new Date().toISOString(),
    });
    if (profile.attempts.length > 200) profile.attempts = profile.attempts.slice(-200);
    saveProfile(profile);
    return profile.attempts[profile.attempts.length - 1];
  }

  function buildForumThread(submission) {
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
          author_id: DUMMY_USER.id,
          author_name: DUMMY_USER.name,
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
    const queue = loadTeacherQueue();
    const forumData = loadForumGradingThreads();
    const forumThread = buildForumThread(submission);
    const entry = {
      id: 'tg_' + Date.now(),
      status: 'pending_teacher',
      forumThreadId: forumThread.id,
      ...submission,
      userId: DUMMY_USER.id,
      userName: DUMMY_USER.name,
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
    DUMMY_USER,
    loadProfile,
    recordAttempt,
    submitToTeacherQueue,
    loadTeacherQueue,
    loadForumGradingThreads,
  };
})(typeof window !== 'undefined' ? window : globalThis);
