/**
 * CBSE 10 study room — LiteLLM-backed tutor via education portal API.
 * Verified MCQ fetch stays client-side; this handles open-ended chapter chat.
 */
(function (global) {
  'use strict';

  const EDUCATION_API = 'https://api.brahmando.com/education';

  function apiBase() {
    const params = new URLSearchParams(global.location.search);
    const explicit = params.get('education_api');
    if (explicit) return explicit.replace(/\/$/, '');
    return EDUCATION_API;
  }

  function headers() {
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const token =
      global.localStorage?.getItem('ml_student_token') ||
      global.localStorage?.getItem('portal_token');
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  async function checkHealth() {
    try {
      const res = await fetch(apiBase() + '/health', { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * @param {string} message
   * @param {{ subject?: string, chapterId?: string, chapterTitle?: string, bucket?: string }} ctx
   */
  async function chat(message, ctx) {
    const subjectLabel =
      ctx.subject === 'mathematics' ? 'Mathematics' : ctx.subject === 'science' ? 'Science' : 'Science';
    const body = {
      actor: 'student',
      message,
      context: {
        grade: '10',
        board: 'CBSE',
        sku: 'cbse10-core',
        study_room: true,
        subject: subjectLabel,
        chapter: ctx.chapterId || '',
        chapter_title: ctx.chapterTitle || '',
        topic_bucket: ctx.bucket || '',
        language_medium: 'English',
      },
    };

    const res = await fetch(apiBase() + '/actors/chat', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : data.error || 'Tutor API error';
      throw new Error(detail);
    }
    return (
      data.answer ||
      data.message ||
      data.content ||
      (typeof data.response === 'string' ? data.response : null) ||
      'I could not form a reply — try rephrasing your question.'
    );
  }

  async function gradeAnswer(question, studentAnswer, rubric) {
    const body = {
      actor: 'student',
      message: 'Grade my answer',
      context: {
        grade_submission: true,
        question,
        answer: studentAnswer,
        rubric: rubric || '',
        grade: '10',
        board: 'CBSE',
        sku: 'cbse10-core',
        study_room: true,
      },
    };
    const res = await fetch(apiBase() + '/actors/chat', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Grading failed');
    return (
      data.evaluation ||
      data.answer ||
      data.message ||
      data.content ||
      (typeof data.response === 'string' ? data.response : '') ||
      ''
    );
  }

  global.Cbse10TutorApi = {
    apiBase,
    checkHealth,
    chat,
    gradeAnswer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
