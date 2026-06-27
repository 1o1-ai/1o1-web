/**
 * Classroom lecture pacing — student pause + chime, teacher answers, closing summary.
 */
(function (global) {
  'use strict';

  function studentFirstName(speaker) {
    return (
      (speaker || 'Student')
        .replace(/\s*-\s*Interrupting/gi, '')
        .replace(/\(.*\)/g, '')
        .trim()
        .split(/\s+/)[0] || 'dear'
    );
  }

  function synthesizeTeacherAnswer(studentBeat, chapterTitle) {
    const name = studentFirstName(studentBeat.speaker);
    const q = (studentBeat.text || '').trim();
    const topic = q.replace(/\?+$/, '').trim();
    return {
      role: 'teacher',
      speaker: 'Teacher',
      text: `Thank you, ${name}. ${topic} — let me answer clearly. This is important for your board exam; note the NCERT definition and one solved example in your notebook.`,
    };
  }

  function hasClosingGoodbye(steps) {
    const tail = steps
      .filter((s) => s.kind === 'speak')
      .slice(-4)
      .map((s) => s.beat.text)
      .join(' ')
      .toLowerCase();
    return /see you|goodbye|next session|thank you, class/.test(tail);
  }

  /**
   * @param {Array<{role:string,speaker?:string,text:string}>} rawBeats
   * @param {string} chapterTitle
   * @returns {Array<{kind:'pause'|'chime'|'speak', ms?:number, beat?:object}>}
   */
  function prepareLectureBeats(rawBeats, chapterTitle) {
    const steps = [];
    if (!rawBeats?.length) return steps;

    let i = 0;
    while (i < rawBeats.length) {
      const b = rawBeats[i];
      if (b.role === 'teacher') {
        steps.push({ kind: 'speak', beat: b });
        i += 1;
        continue;
      }

      let studentsInBlock = 0;
      while (i < rawBeats.length && rawBeats[i].role === 'student') {
        const student = rawBeats[i];
        i += 1;
        studentsInBlock += 1;

        steps.push({ kind: 'pause', ms: 1200 });
        steps.push({ kind: 'chime' });
        steps.push({ kind: 'speak', beat: student });
        steps.push({ kind: 'pause', ms: 500 });

        let teacher;
        if (i < rawBeats.length && rawBeats[i].role === 'teacher') {
          teacher = rawBeats[i];
          i += 1;
        } else {
          teacher = synthesizeTeacherAnswer(student, chapterTitle);
        }
        steps.push({ kind: 'speak', beat: teacher });
      }

      if (studentsInBlock > 0 && i < rawBeats.length && rawBeats[i].role === 'teacher') {
        steps.push({ kind: 'pause', ms: 700 });
        steps.push({
          kind: 'speak',
          beat: {
            role: 'teacher',
            speaker: 'Teacher',
            text: "If there are no more questions, let's continue with the rest of today's lesson.",
          },
        });
      }
    }

    if (!hasClosingGoodbye(steps)) {
      steps.push({ kind: 'pause', ms: 800 });
      steps.push({
        kind: 'speak',
        beat: {
          role: 'teacher',
          speaker: 'Teacher',
          text: `To summarise ${chapterTitle || "today's lesson"}: revise the NCERT examples and intext questions we discussed. When you are ready, open the Game Room from the CBSE 10 home screen for WordHunter and other drills.`,
        },
      });
      steps.push({ kind: 'pause', ms: 600 });
      steps.push({
        kind: 'speak',
        beat: {
          role: 'teacher',
          speaker: 'Teacher',
          text: 'Thank you, class. Goodbye for today — see you in the next session!',
        },
      });
    }

    return steps;
  }

  global.CBSELectureFlow = { prepareLectureBeats, synthesizeTeacherAnswer };
})(typeof window !== 'undefined' ? window : globalThis);
