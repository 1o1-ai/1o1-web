/**
 * Shared academy SKU config — one place for look-n-feel copy, roster locale, and routes.
 * Study room, practice test, and forum pages read this so future skin changes apply to all SKUs.
 */
(function (global) {
  const SKUS = {
    'cbse10-core': {
      id: 'cbse10-core',
      label: 'CBSE 10 Core',
      hubPath: '/portal/education/cbse10/index.html',
      rosterPath: '/portal/data/academy-bots.json',
      locale: 'in',
      currency: 'INR',
      moderationReply:
        "Let's keep this about CBSE prep — no personal contact or off-topic chat here. Ask about the chapter or quiz instead.",
      timepassWarn:
        'Casual chat is ok for a minute — but this room is for board prep. No personal topics, please.',
      studyChatter: [
        'Anyone doing the chapter quiz?',
        'Board paper 2024 was tough on MCQs…',
        'Stuck on Q3 — options look similar',
        'Going through polynomials again tonight',
        'Has anyone tried the 5-question chapter quiz?',
        'Section A timing is the real challenge',
        'My school pre-board is next month',
      ],
      peerStudyReplies: [
        'Yeah the PDF text is messy sometimes — minus signs get dropped.',
        'I agree, check the marking scheme PDF if options look odd.',
        'Happens with scanned papers — trust the verified option letters.',
        'Same chapter — I got confused on sign too.',
      ],
      curriculumPath: '/portal/data/cbse10-curriculum.json',
      forumPath: '/portal/data/cbse10-forum.json',
      bankPath: '/portal/data/cbse10-verified-questions.json',
      educationApiBase: 'https://api.brahmando.com/education',
      subjects: [
        { id: 'science', label: 'Science', code: '086', icon: '🧪' },
        { id: 'mathematics', label: 'Mathematics', code: '041', icon: '📐' },
      ],
    },
    'cbse12-science': {
      id: 'cbse12-science',
      label: 'CBSE XII Science',
      hubPath: '/portal/education/cbse12-science/index.html',
      rosterPath: '/portal/data/academy-bots.json',
      locale: 'in',
      currency: 'INR',
      moderationReply:
        "Let's keep this about CBSE Class 12 prep — no personal contact or off-topic chat. Ask about Physics, Chemistry, Biology, or Math.",
      timepassWarn: 'This room is for board prep. Please stay on syllabus topics.',
      studyChatter: [
        'Anyone on Electrostatics numericals tonight?',
        'Organic Chemistry naming is killing me',
        'Board practical dates announced — revising ray optics',
        'Integration by parts — need a shortcut',
        'Previous year paper had a tricky Current Electricity MCQ',
      ],
      curriculumPath: '/portal/data/cbse12-science-curriculum.json',
      forumPath: '/portal/data/cbse12-science-forum.json',
      bankPath: '/portal/data/cbse12-science-questions.json',
      educationApiBase: 'https://api.brahmando.com/education',
      subjects: [
        { id: 'physics', label: 'Physics', code: '042', icon: '⚛️' },
        { id: 'chemistry', label: 'Chemistry', code: '043', icon: '🧪' },
        { id: 'biology', label: 'Biology', code: '044', icon: '🧬' },
        { id: 'mathematics', label: 'Mathematics', code: '041', icon: '📐' },
      ],
    },
    'cbse12-commerce': {
      id: 'cbse12-commerce',
      label: 'CBSE-XII-Commerce',
      hubPath: '/portal/education/cbse12-commerce/index.html',
      rosterPath: '/portal/data/academy-bots.json',
      locale: 'in',
      currency: 'INR',
      moderationReply:
        "Let's keep this about CBSE Commerce prep — Accountancy, Business Studies, or Economics. No personal contact or off-topic chat.",
      timepassWarn: 'This room is for board prep. Please stay on syllabus topics.',
      studyChatter: [
        'Anyone on partnership accounts tonight?',
        'Business Studies case studies are heavy this week',
        'Macroeconomics national income numericals — help?',
        'GST treatment in Class XI accounts — revising',
        'Consumer protection act MCQs for pre-board',
      ],
      curriculumPath: '/portal/data/cbse12-commerce-curriculum.json',
      forumPath: '/portal/data/cbse12-commerce-forum.json',
      bankPath: '/portal/data/cbse12-commerce-questions.json',
      studyMaterialPath: '/portal/data/cbse12-commerce-study-material.json',
      educationApiBase: 'https://api.brahmando.com/education',
      grades: ['11', '12'],
      subjects: [
        { id: 'accountancy', label: 'Accountancy', code: '055', icon: '📒' },
        { id: 'business-studies', label: 'Business Studies', code: '054', icon: '💼' },
        { id: 'economics', label: 'Economics', code: '030', icon: '📈' },
      ],
    },
    'sat-act': {
      id: 'sat-act',
      label: 'SAT / ACT',
      hubPath: '/portal/education/sat-act/index.html',
      rosterPath: '/portal/data/us-uk-academy-bots.json',
      locale: 'us-uk',
      currency: 'USD',
      moderationReply:
        "Let's keep this about SAT/ACT prep — no personal contact or off-topic chat. Ask about a skill, passage, or practice set.",
      timepassWarn:
        'Quick break is fine — but this room is for test prep. Please stay on topic.',
      studyChatter: [
        'Anyone grinding the reading section tonight?',
        'The ACT English pacing is brutal on passage 3',
        'Bluebook adaptive felt harder than Khan drills',
        'Stuck between two answer choices on grammar',
        'Trying the 5-question skill drill before bed',
        'College apps due soon — need to bump my math score',
        'Our counselor said to do one full section mock this week',
      ],
      peerStudyReplies: [
        'Same — I always underline the transition words first.',
        'Check the official scoring guide if the wording feels odd.',
        'ACT retired tests are closest to the real thing.',
        'Yeah the comma rules trip me up on Standard English.',
        'Khan Academy drill for that skill helped me last week.',
      ],
      curriculumPath: '/portal/data/sat-act-curriculum.json',
      bankPath: '/portal/data/sat-act-questions.json',
      forumPath: '/portal/data/sat-act-forum.json',
      educationApiBase: 'https://api.brahmando.com/education',
      presence: {
        totalStudents: 142,
        totalTeachers: 8,
        minStudents: 48,
        timezone: 'America/New_York',
      },
      subjects: [
        { id: 'sat-reading-writing', label: 'SAT Reading & Writing', icon: '📖' },
        { id: 'sat-math', label: 'SAT Mathematics', icon: '📐' },
        { id: 'act-english', label: 'ACT English', icon: '✏️' },
        { id: 'act-math', label: 'ACT Mathematics', icon: '🔢' },
        { id: 'act-reading', label: 'ACT Reading', icon: '📚' },
        { id: 'act-science', label: 'ACT Science', icon: '🔬' },
      ],
      tracks: [
        {
          id: 'sat',
          label: 'SAT',
          sections: [
            { id: 'math', label: 'Math', icon: '📐' },
            { id: 'reading_writing', label: 'Reading & Writing', icon: '📖' },
          ],
        },
        {
          id: 'act',
          label: 'ACT',
          sections: [
            { id: 'english', label: 'English', icon: '✏️' },
            { id: 'math', label: 'Math', icon: '🔢' },
            { id: 'reading', label: 'Reading', icon: '📚' },
            { id: 'science', label: 'Science', icon: '🔬' },
          ],
        },
      ],
    },
    'english-tests': {
      id: 'english-tests',
      label: 'TOEFL · IELTS · DET',
      hubPath: '/portal/education/english-tests/index.html',
      rosterPath: '/portal/data/us-uk-academy-bots.json',
      locale: 'us-uk',
      currency: 'USD',
      moderationReply:
        "Let's keep this about English proficiency prep — no personal contact or off-topic chat.",
      timepassWarn: 'This room is for speaking, listening, reading, and writing practice.',
      studyChatter: [
        'Anyone doing the speaking prompt set tonight?',
        'IELTS Task 2 timing is tight',
        'DET adaptive vocab section felt tricky',
        'Recording myself for TOEFL speaking practice',
      ],
      curriculumPath: '/portal/data/english-tests-curriculum.json',
      bankPath: '/portal/data/english-tests-questions.json',
      forumPath: '/portal/data/english-tests-forum.json',
      educationApiBase: 'https://api.brahmando.com/education',
      studyMaterialPath: '/portal/data/english-tests-study-material.json',
      subjects: [
        { id: 'toefl-reading', label: 'TOEFL Reading', icon: '📖' },
        { id: 'toefl-listening', label: 'TOEFL Listening', icon: '🎧' },
        { id: 'toefl-speaking', label: 'TOEFL Speaking', icon: '🗣️' },
        { id: 'toefl-writing', label: 'TOEFL Writing', icon: '✍️' },
        { id: 'ielts-reading', label: 'IELTS Reading', icon: '📚' },
        { id: 'det-literacy', label: 'DET Literacy', icon: '🦉' },
      ],
    },
    'gre-gmat': {
      id: 'gre-gmat',
      label: 'GRE / GMAT',
      hubPath: '/portal/education/gre-gmat/index.html',
      rosterPath: '/portal/data/us-uk-academy-bots.json',
      locale: 'us-uk',
      currency: 'USD',
      moderationReply:
        "Let's keep this about GRE/GMAT prep — no personal contact or off-topic chat.",
      timepassWarn: 'This room is for graduate test prep. Please stay on topic.',
      studyChatter: [
        'Anyone grinding GRE Quant tonight?',
        'GMAT Data Insights multi-source is brutal',
        'Verbal timing on GMAT Focus — 45 min for 23 Qs',
        'AWA issue essay outline templates help',
      ],
      curriculumPath: '/portal/data/gre-gmat-curriculum.json',
      bankPath: '/portal/data/gre-gmat-questions.json',
      forumPath: '/portal/data/gre-gmat-forum.json',
      educationApiBase: 'https://api.brahmando.com/education',
      studyMaterialPath: '/portal/data/gre-gmat-study-material.json',
      subjects: [
        { id: 'gre-verbal', label: 'GRE Verbal', icon: '📖' },
        { id: 'gre-quantitative', label: 'GRE Quant', icon: '📐' },
        { id: 'gmat-quantitative', label: 'GMAT Quant', icon: '🔢' },
        { id: 'gmat-verbal', label: 'GMAT Verbal', icon: '✏️' },
        { id: 'gmat-data-insights', label: 'GMAT Data Insights', icon: '📊' },
      ],
    },
    'rhytoma-wbbse': {
      id: 'rhytoma-wbbse',
      label: 'Rhytoma Academy',
      hubPath: '/portal/education/rhytoma/index.html',
      rosterPath: '/portal/data/rhytoma-academy-bots.json',
      locale: 'wb',
      currency: 'INR',
      mocked: true,
      presence: {
        totalStudents: 20,
        totalTeachers: 4,
        minStudents: 3,
        maxStudentsOnline: 8,
        minTeachers: 1,
        maxTeachersOnline: 2,
      },
      moderationReply:
        "Let's keep this about WBBSE/WBCHSE prep — no personal contact or off-topic chat. Ask about Science or Math.",
      timepassWarn:
        'Quick break is fine — but this room is for Madhyamik & HS prep. Please stay on topic.',
      studyChatter: [
        'Anyone on Life Science MCQs tonight?',
        'Madhyamik Physical Science timing is tight…',
        'Stuck on quadratic equations — help?',
        'Class 11 Physics numericals are heavy this week',
        'Our school test is next month',
      ],
      peerStudyReplies: [
        'Yeah WBBSE papers sometimes drop minus signs in scans.',
        'Check the official solution booklet if options look odd.',
        'Same chapter — sign conventions trip me up too.',
      ],
      curriculumPath: '/portal/data/rhytoma-curriculum.json',
      bankPath: '/portal/data/rhytoma-questions.json',
      forumPath: '/portal/data/rhytoma-forum.json',
      educationApiBase: 'https://api.brahmando.com/education',
      grades: ['9', '10', '11', '12'],
      subjects: [
        { id: 'science', label: 'Science', icon: '🧪' },
        { id: 'mathematics', label: 'Mathematics', icon: '📐' },
      ],
    },
  };

  function detectSku() {
    const p = (global.location && global.location.pathname) || '';
    if (p.includes('/sat-act/')) return 'sat-act';
    if (p.includes('/english-tests/')) return 'english-tests';
    if (p.includes('/gre-gmat/')) return 'gre-gmat';
    if (p.includes('/rhytoma/')) return 'rhytoma-wbbse';
    if (p.includes('/cbse12-commerce/')) return 'cbse12-commerce';
    if (p.includes('/cbse12-science/')) return 'cbse12-science';
    if (p.includes('/cbse10/')) return 'cbse10-core';
    const q = new URLSearchParams(global.location.search || '');
    return q.get('sku') || 'cbse10-core';
  }

  function get(skuId) {
    return SKUS[skuId] || SKUS['cbse10-core'];
  }

  function hubFor(skuId) {
    return get(skuId).hubPath;
  }

  global.AnyoAcademyConfig = { SKUS, detectSku, get, hubFor };
})(typeof window !== 'undefined' ? window : globalThis);
