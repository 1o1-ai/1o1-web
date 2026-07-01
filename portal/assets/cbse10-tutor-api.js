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

    const run = async () => {
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
    };

    if (global.EducationPerf?.timed) {
      return global.EducationPerf.timed('tutor_chat', run, { usedAi: true, sku: 'cbse10-core' });
    }
    return run();
  }

  /**
   * @returns {Promise<{feedback: string, marksAwarded: number|null, maxMarks: number|null, gradedBy: string, score: number|null}>}
   */
  async function gradeAnswer(question, studentAnswer, rubric, ctx) {
    ctx = ctx || {};
    const referenceAnswer = String(ctx.referenceAnswer || rubric || '').trim();
    const solutionSteps = Array.isArray(ctx.solutionSteps) ? ctx.solutionSteps : [];
    const body = {
      actor: 'student',
      message: 'Grade my answer',
      context: {
        grade_submission: true,
        semantic_grade: ctx.semanticGrade !== false,
        question,
        answer: studentAnswer,
        rubric: referenceAnswer,
        reference_answer: referenceAnswer,
        solution_steps: solutionSteps,
        max_marks: ctx.maxMarks || 5,
        marks: ctx.maxMarks || 5,
        grade: ctx.grade || '10',
        board: ctx.board || 'CBSE',
        sku: ctx.sku || 'cbse10-core',
        study_room: true,
        subject: ctx.subject || '',
        chapter: ctx.chapterId || '',
        chapter_title: ctx.chapterTitle || '',
        language_medium: 'English',
      },
    };

    const run = async () => {
      const res = await fetch(apiBase() + '/actors/chat', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Grading failed');
      const feedback =
        data.evaluation ||
        data.feedback ||
        data.answer ||
        data.message ||
        data.content ||
        (typeof data.response === 'string' ? data.response : '') ||
        '';
      return {
        feedback,
        marksAwarded: data.marks_awarded ?? data.marksAwarded ?? null,
        maxMarks: data.max_marks ?? data.maxMarks ?? ctx.maxMarks ?? null,
        gradedBy: data.grading_method || 'semantic_llm',
        score: data.score ?? null,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
      };
    };

    const meta = {
      usedAi: true,
      sku: ctx.sku || 'cbse10-core',
      gradedBy: 'semantic_llm',
    };
    if (global.EducationPerf?.timed) {
      return global.EducationPerf.timed('grade_answer_api', run, meta);
    }
    return run();
  }

  global.Cbse10TutorApi = {
    apiBase,
    checkHealth,
    chat,
    gradeAnswer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
