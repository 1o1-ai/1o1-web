/**
 * CBSE Exam Simulation Schema — Class X & XI–XII Science
 * Used by mock-exam.js to enforce mark distribution and section layout.
 */
(function (global) {
  'use strict';

  const CLASS_X_MATH = {
    sku: 'cbse10',
    subject: 'mathematics',
    code: '041',
    title: 'Mathematics Standard',
    classLabel: 'Class X',
    durationHours: 3,
    totalMarks: 80,
    passingPercent: 33,
    note: 'Internal assessment ignored · 3 hours · Maximum Marks: 80',
    unitWeightage: [
      ['Number Systems', 6],
      ['Algebra', 20],
      ['Coordinate Geometry', 6],
      ['Geometry', 15],
      ['Trigonometry', 12],
      ['Mensuration', 10],
      ['Statistics & Probability', 11],
    ],
    sections: [
      { id: 'A', label: 'Section A', instruction: 'MCQs · 1 mark each', marksEach: 1, count: 20, types: ['MCQ'] },
      { id: 'B', label: 'Section B', instruction: 'Very Short Answer · 2 marks each', marksEach: 2, count: 5, types: ['short', 'MCQ'] },
      { id: 'C', label: 'Section C', instruction: 'Short Answer · 3 marks each', marksEach: 3, count: 6, types: ['short', 'MCQ'] },
      { id: 'D', label: 'Section D', instruction: 'Long Answer · 4 marks each', marksEach: 4, count: 3, types: ['short', 'long'] },
      { id: 'E', label: 'Section E', instruction: 'Long Answer · 5 marks each', marksEach: 5, count: 4, types: ['long', 'short'] },
    ],
  };

  const CLASS_X_SCIENCE = {
    sku: 'cbse10',
    subject: 'science',
    code: '086',
    title: 'Science',
    classLabel: 'Class X',
    durationHours: 3,
    totalMarks: 80,
    passingPercent: 33,
    note: 'Internal assessment ignored · 3 hours · Maximum Marks: 80',
    unitWeightage: [
      ['Chemical Substances – Nature & Behaviour', 25],
      ['World of Living', 25],
      ['Natural Phenomena', 12],
      ['Effects of Current', 13],
      ['Natural Resources', 5],
    ],
    sections: [
      { id: 'A', label: 'Section A', instruction: 'MCQs · 1 mark each', marksEach: 1, count: 20, types: ['MCQ'] },
      { id: 'B', label: 'Section B', instruction: 'Very Short Answer · 2 marks each', marksEach: 2, count: 6, types: ['short', 'MCQ'] },
      { id: 'C', label: 'Section C', instruction: 'Short Answer · 3 marks each', marksEach: 3, count: 7, types: ['short', 'MCQ'] },
      { id: 'D', label: 'Section D', instruction: 'Long Answer · 4 marks each', marksEach: 4, count: 3, types: ['short', 'long'] },
      { id: 'E', label: 'Section E', instruction: 'Long Answer · 5 marks each', marksEach: 5, count: 3, types: ['long', 'short'] },
    ],
  };

  function class12Paper(subject, code, title, totalMarks) {
    const mcqMarks = Math.round(totalMarks * 0.2);
    const compMarks = Math.round(totalMarks * 0.5);
    const conMarks = totalMarks - mcqMarks - compMarks;
    return {
      sku: 'cbse12-science',
      subject,
      code,
      title,
      classLabel: 'Class XII',
      durationHours: 3,
      totalMarks,
      passingPercent: 33,
      note: 'Competency-based · 50% application · 20% MCQ · 30% constructed response',
      competencySplit: { mcq: 0.2, competency: 0.5, constructed: 0.3 },
      sections: [
        {
          id: 'A',
          label: 'Section A',
          instruction: `MCQs · ~20% (${mcqMarks} marks)`,
          marksEach: 1,
          count: mcqMarks,
          types: ['MCQ'],
          totalMarks: mcqMarks,
        },
        {
          id: 'B',
          label: 'Section B',
          instruction: `Competency / Application · ~50% (${compMarks} marks)`,
          marksEach: 2,
          count: Math.ceil(compMarks / 2),
          types: ['short', 'MCQ'],
          totalMarks: compMarks,
        },
        {
          id: 'C',
          label: 'Section C',
          instruction: `Short / Long Constructed Response · ~30% (${conMarks} marks)`,
          marksEach: 3,
          count: Math.ceil(conMarks / 3),
          types: ['short', 'long'],
          totalMarks: conMarks,
        },
      ],
    };
  }

  const SCHEMA = {
    cbse10: {
      mathematics: CLASS_X_MATH,
      science: CLASS_X_SCIENCE,
    },
    'cbse12-science': {
      physics: class12Paper('physics', '042', 'Physics', 70),
      chemistry: class12Paper('chemistry', '043', 'Chemistry', 70),
      biology: class12Paper('biology', '044', 'Biology', 70),
      mathematics: class12Paper('mathematics', '041', 'Mathematics', 80),
    },
  };

  function getPaper(sku, subject) {
    return SCHEMA[sku]?.[subject] || null;
  }

  function listSubjects(sku) {
    return Object.keys(SCHEMA[sku] || {});
  }

  global.CBSEExamSchema = { SCHEMA, getPaper, listSubjects, CLASS_X_MATH, CLASS_X_SCIENCE };
})(typeof window !== 'undefined' ? window : globalThis);
