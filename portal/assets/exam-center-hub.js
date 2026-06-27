/**
 * Exam Center hub — Practice Test vs Mock Test chooser per SKU.
 */
(function (global) {
  'use strict';

  const SKU_CONFIG = {
    cbse10: {
      label: 'CBSE Class X',
      hub: 'index.html',
      practice: 'practice.html',
      mock: 'mock-exam.html',
      mockParams: (subject) => `?subject=${subject || 'mathematics'}&mode=authentic`,
      subjects: [
        { id: 'mathematics', label: 'Mathematics Standard (041)' },
        { id: 'science', label: 'Science (086)' },
      ],
      practiceNote: 'Chapter drills — 1–40 questions with competency mix.',
      mockNote: 'Full 3-hour mock · 80 marks · Math: Sections A–E · Science: Biology / Chemistry / Physics (39 Q).',
    },
    'cbse12-science': {
      label: 'CBSE Class XI–XII Science',
      hub: 'index.html',
      practice: 'practice.html',
      mock: 'mock-exam.html',
      mockParams: (subject) => `?subject=${subject || 'physics'}&mode=authentic`,
      subjects: [
        { id: 'physics', label: 'Physics (042)' },
        { id: 'chemistry', label: 'Chemistry (043)' },
        { id: 'biology', label: 'Biology (044)' },
        { id: 'mathematics', label: 'Mathematics (041)' },
      ],
      practiceNote: 'Topic/chapter practice — competency mix from question bank.',
      mockNote: '3-hour mock · 70/80 marks · 20/50/30 competency split.',
    },
    'sat-act': {
      label: 'SAT / ACT',
      hub: 'index.html',
      practice: 'practice.html',
      mock: 'mock-exam.html',
      mockParams: () => '',
      subjects: [],
      practiceNote: '5-question skill drill · section timing from official guides.',
      mockNote: 'Timed section mock — Digital SAT or ACT section format.',
    },
    'english-tests': {
      label: 'TOEFL · IELTS · DET',
      hub: 'index.html',
      practice: 'practice.html',
      mock: 'mock-exam.html',
      mockParams: () => '',
      subjects: [],
      practiceNote: 'Section skill practice from ingested ETS / British Council guides.',
      mockNote: 'Full-section timed simulation.',
    },
    'gre-gmat': {
      label: 'GRE / GMAT',
      hub: 'index.html',
      practice: 'practice.html',
      mock: 'mock-exam.html',
      mockParams: () => '',
      subjects: [],
      practiceNote: 'Quant / Verbal skill drills.',
      mockNote: 'Section-length timed mock.',
    },
    rhytoma: {
      label: 'Rhytoma WBBSE',
      hub: 'index.html',
      practice: '/rhytoma/#panel-practice',
      mock: '/rhytoma/#panel-practice',
      mockParams: () => '',
      subjects: [],
      practiceNote: 'Chapter practice from local bank.',
      mockNote: 'Board-style mock when available.',
    },
  };

  function mount(root, sku) {
    const cfg = SKU_CONFIG[sku] || SKU_CONFIG.cbse10;
    const subjectSelect =
      cfg.subjects.length > 0
        ? `<label class="field" style="display:block;margin:10px 0 6px;font-size:0.85rem;color:#94a3b8">Subject / paper
           <select id="ecSubject" style="width:100%;margin-top:6px;padding:10px;border-radius:8px;background:#0a0f0d;color:#e2e8f0;border:1px solid #334155">
             ${cfg.subjects.map((s) => `<option value="${s.id}">${s.label}</option>`).join('')}
           </select></label>`
        : '';

    root.innerHTML = `
      <div class="portal-hero">
        <p class="eyebrow">${cfg.label}</p>
        <h2>Exam Center</h2>
        <p>Choose how you want to test — untimed practice or full board mock.</p>
        ${subjectSelect}
      </div>
      <div class="exam-center-grid">
        <a href="#" class="exam-center-card" id="ecPractice">
          <span class="ec-icon">✅</span>
          <h3>Practice Test</h3>
          <p>${cfg.practiceNote}</p>
        </a>
        <a href="#" class="exam-center-card" id="ecMock">
          <span class="ec-icon">📝</span>
          <h3>Mock Test</h3>
          <p>${cfg.mockNote}</p>
        </a>
      </div>
      <p class="portal-note" style="margin-top:14px">
        Passing: 33% theory minimum · Internal/practical marks excluded ·
        <a href="${cfg.hub}">← Back to hub</a>
      </p>`;

    const subEl = document.getElementById('ecSubject');
    document.getElementById('ecPractice').addEventListener('click', (e) => {
      e.preventDefault();
      const sub = subEl?.value || '';
      const params = new URLSearchParams();
      if (sub) params.set('subject', sub);
      if (sku === 'cbse10') params.set('count', '10');
      const q = params.toString() ? `?${params.toString()}` : '';
      location.href = cfg.practice + q;
    });
    document.getElementById('ecMock').addEventListener('click', (e) => {
      e.preventDefault();
      const sub = subEl?.value || cfg.subjects[0]?.id || '';
      location.href = cfg.mock + cfg.mockParams(sub);
    });
  }

  global.ExamCenterHub = { mount, SKU_CONFIG };
})(typeof window !== 'undefined' ? window : globalThis);
