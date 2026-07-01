/**
 * Education Shell — base study room controller.
 * SKUs extend hooks; shared chrome uses EducationContentCache + EducationPerf.
 *
 * Usage:
 *   class Cbse10StudyRoom extends BaseStudyRoom { ... }
 *   new Cbse10StudyRoom({ sku: 'cbse10-core', ... }).mount();
 */
(function (global) {
  'use strict';

  class BaseStudyRoom {
    constructor(config) {
      this.sku = config.sku || 'generic';
      this.dataPrefix = config.dataPrefix || '';
      this.phases = config.phases || {};
      this.state = {
        subject: null,
        chapterId: null,
        chapterTitle: null,
        phase: 'subject',
      };
    }

    /** Override: return [{ id, label, icon }] */
    subjects() {
      return [];
    }

    /** Override: chapters for subject */
    chaptersForSubject(subject) {
      return [];
    }

    /** Override: load eval question bank slice (T0) */
    async loadEvalBank(ctx) {
      throw new Error('loadEvalBank not implemented');
    }

    /** Override: render learn panel body */
    async renderLearn(chapterId, root) {
      throw new Error('renderLearn not implemented');
    }

    /** Shared: lazy chapter study material (T2 shard) */
    async loadChapterMaterial(chapterId) {
      if (global.CBSE10StudyMaterial?.loadChapter) {
        return global.CBSE10StudyMaterial.loadChapter(chapterId);
      }
      if (global.EducationContentCache?.getChapterStudyMaterial) {
        return global.EducationContentCache.getChapterStudyMaterial(
          this.dataPrefix || this.sku.replace('-core', ''),
          chapterId,
          null
        );
      }
      return null;
    }

    /** Shared: reference answer — catalog first, AI last */
    async referenceAnswer(question) {
      const t0 = global.performance?.now?.() ?? Date.now();
      await (global.AnyoReferenceAnswer?.loadOverrides?.() || Promise.resolve());
      let ref = global.AnyoReferenceAnswer?.extractReferenceAnswer?.(question) || '';
      let source = ref ? 'catalog' : 'none';
      let usedAi = false;

      if (!ref && global.Cbse10TutorApi?.chat) {
        usedAi = true;
        source = 'ai_chat';
        try {
          ref = await global.Cbse10TutorApi.chat(
            `Give a concise worked solution only for:\n\n${question.prompt || question.text}`,
            {
              subject: this.state.subject,
              chapterId: this.state.chapterId,
              chapterTitle: this.state.chapterTitle,
            }
          );
        } catch {
          ref = '';
        }
      }

      global.EducationPerf?.record?.('reference_answer', {
        durationMs: (global.performance?.now?.() ?? Date.now()) - t0,
        usedAi,
        source,
        sku: this.sku,
      });
      return { text: ref, source, usedAi };
    }

    /** Shared: grade one answer — T0 MCQ, deterministic, then API */
    async gradeAnswer(row) {
      const t0 = global.performance?.now?.() ?? Date.now();
      const maxMarks = row.marks || 1;

      if (row.selectedIndex != null && row.correctIndex != null) {
        const correct = row.selectedIndex === row.correctIndex;
        global.EducationPerf?.record?.('grade_answer', {
          durationMs: (global.performance?.now?.() ?? Date.now()) - t0,
          usedAi: false,
          gradedBy: 'catalog_key',
          sku: this.sku,
        });
        return {
          marksAwarded: correct ? maxMarks : 0,
          maxMarks,
          gradedBy: 'catalog_key',
        };
      }

      const ref =
        global.AnyoReferenceAnswer?.extractReferenceAnswer?.(row) ||
        row.referenceAnswer ||
        '';
      if (ref && global.EducationDeterministicGrade?.gradeWritten) {
        const local = global.EducationDeterministicGrade.gradeWritten(
          row.studentAnswer,
          ref,
          maxMarks
        );
        if (local) {
          global.EducationPerf?.record?.('grade_answer', {
            durationMs: (global.performance?.now?.() ?? Date.now()) - t0,
            usedAi: false,
            gradedBy: local.gradedBy,
            sku: this.sku,
          });
          return local;
        }
      }

      if (global.Cbse10TutorApi?.gradeAnswer) {
        const grade = await global.Cbse10TutorApi.gradeAnswer(
          row.prompt,
          row.studentAnswer,
          ref,
          {
            referenceAnswer: ref,
            maxMarks,
            subject: this.state.subject,
            chapterId: this.state.chapterId,
            chapterTitle: this.state.chapterTitle,
            solutionSteps: row.solutionSteps || row.solution_steps || [],
            sku: this.sku,
            grade: this.state.grade || '12',
          }
        );
        global.EducationPerf?.record?.('grade_answer', {
          durationMs: (global.performance?.now?.() ?? Date.now()) - t0,
          usedAi: true,
          gradedBy: grade.gradedBy || 'semantic_llm',
          sku: this.sku,
        });
        return {
          marksAwarded: grade.marksAwarded,
          maxMarks: grade.maxMarks || maxMarks,
          feedback: grade.feedback,
          gradedBy: grade.gradedBy || 'computer_ai',
        };
      }

      return { marksAwarded: null, maxMarks, gradedBy: 'pending' };
    }

    showPhase(name) {
      this.state.phase = name;
      Object.entries(this.phases).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', key !== name);
      });
      document.body.classList.toggle('sr-eval-active', name === 'evaluate');
    }

    mount() {
      /* SKU subclass wires DOM listeners after super.mount() */
    }
  }

  global.EducationShell = { BaseStudyRoom };
})(typeof window !== 'undefined' ? window : globalThis);
