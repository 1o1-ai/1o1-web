/**
 * Country universe metadata — landmarks, curriculum labels, search aliases.
 */
(function (global) {
  const DEFAULT_CURRICULUM = 'Grade 10 · Grade 12 · Science';
  const DEFAULT_SUBJECTS = [
    { id: 'physics', label: 'Physics', icon: '⚛️' },
    { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
    { id: 'mathematics', label: 'Mathematics', icon: '📐' },
    { id: 'biology', label: 'Biology', icon: '🧬' },
  ];

  const COUNTRY_META = {
    india: {
      code: 'IN',
      emblemPrimary: 'landmark',
      landmark: '🕌',
      landmarkLabel: 'Taj Mahal',
      curriculumLine: 'CBSE · State Boards',
      grades: 'Class X & XII · Science',
      boards: ['CBSE', 'ICSE', 'State boards'],
      searchAliases: ['cbse', 'icse', 'bharat', 'indian'],
      blurb: 'CBSE Class X & XII Science and Commerce — India’s national boards connected to the global universe.',
    },
    australia: {
      code: 'AU',
      landmark: '🏛️',
      landmarkLabel: 'Opera House',
      curriculumLine: 'Grade 10 · Grade 12 · Science',
      boards: ['Year 10', 'Year 12'],
      searchAliases: ['australian', 'hsc nsw', 'vce', 'sydney'],
      blurb: 'Australian Year 10 and Year 12 science pathways across national curriculum strands.',
    },
    bangladesh: {
      code: 'BD',
      landmark: '🗼',
      landmarkLabel: 'Shaheed Minar',
      curriculumLine: 'SSC · HSC · Science',
      boards: ['SSC', 'HSC'],
      searchAliases: ['ssc', 'hsc', 'dhaka'],
      blurb: 'SSC and HSC science streams with foundational Q&A across four core subjects.',
    },
    pakistan: {
      code: 'PK',
      landmark: '🗼',
      landmarkLabel: 'Minar-e-Pakistan',
      curriculumLine: 'SSC · HSSC · Science',
      boards: ['SSC', 'HSSC'],
      searchAliases: ['ssc', 'hssc', 'lahore', 'karachi'],
      blurb: 'Matric and intermediate science preparation aligned to national syllabi.',
    },
    singapore: {
      code: 'SG',
      emblemPrimary: 'flag',
      landmark: '🦁',
      landmarkLabel: 'Merlion',
      curriculumLine: 'O Level · A Level · Science',
      boards: ['GCE O Level', 'GCE A Level'],
      searchAliases: ['gce', 'o level', 'a level'],
      blurb: 'GCE O and A Level science tracks with MOE-aligned study paths.',
    },
    uk: {
      code: 'GB',
      landmark: '🕰️',
      landmarkLabel: 'Big Ben',
      curriculumLine: 'GCSE · A Level · Science',
      boards: ['GCSE', 'GCE A Level'],
      searchAliases: ['gcse', 'a level', 'britain', 'england'],
      blurb: 'GCSE and A Level science — UK national curriculum in the Brahmexa orbit.',
    },
    usa: {
      code: 'US',
      landmark: '🗽',
      landmarkLabel: 'Statue of Liberty',
      curriculumLine: 'Grade 10 · Grade 12 AP · Science',
      boards: ['Grade 10', 'Grade 12 AP'],
      searchAliases: ['ap', 'american', 'united states'],
      blurb: 'US Grade 10 and AP science pathways plus SAT/ACT bridge via International.',
    },
    japan: {
      code: 'JP',
      landmark: '⛩️',
      landmarkLabel: 'Torii gate',
      curriculumLine: DEFAULT_CURRICULUM,
      boards: ['MEXT Grade 10', 'MEXT Grade 12'],
      searchAliases: ['mext', 'tokyo'],
      blurb: 'MEXT-aligned science curricula for lower and upper secondary.',
    },
    canada: {
      code: 'CA',
      landmark: '🍁',
      landmarkLabel: 'Maple leaf',
      curriculumLine: DEFAULT_CURRICULUM,
      boards: ['Provincial Grade 10', 'Grade 12'],
      searchAliases: ['ontario', 'provincial'],
      blurb: 'Canadian Grade 10 and 12 science across provincial standards.',
    },
    malaysia: {
      code: 'MY',
      landmark: '🏙️',
      landmarkLabel: 'Petronas Towers',
      curriculumLine: 'SPM · STPM · Science',
      boards: ['SPM', 'STPM'],
      searchAliases: ['spm', 'stpm'],
      blurb: 'Malaysian SPM and STPM science preparation tracks.',
    },
    nigeria: {
      code: 'NG',
      landmark: '🦅',
      landmarkLabel: 'Eagle',
      curriculumLine: DEFAULT_CURRICULUM,
      boards: ['WAEC', 'NECO'],
      searchAliases: ['waec', 'neco'],
      blurb: 'WAEC/NECO aligned Grade 10 and 12 science study rooms.',
    },
    philippines: {
      code: 'PH',
      landmark: '🌴',
      landmarkLabel: 'Islands',
      curriculumLine: DEFAULT_CURRICULUM,
      boards: ['DepEd Grade 10', 'Grade 12'],
      searchAliases: ['deped', 'manila'],
      blurb: 'K-12 science strands for Philippine secondary learners.',
    },
    finland: {
      code: 'FI',
      landmark: '🌲',
      landmarkLabel: 'Nordic forest',
      curriculumLine: DEFAULT_CURRICULUM,
      boards: ['FI-OPH Grade 10', 'Grade 12'],
      searchAliases: ['oph', 'finnish'],
      blurb: 'Finnish OPH-aligned science for Grades 10 and 12.',
    },
    'south-korea': {
      code: 'KR',
      landmark: '🏯',
      landmarkLabel: 'Pagoda',
      curriculumLine: DEFAULT_CURRICULUM,
      boards: ['Grade 10', 'CSAT prep Grade 12'],
      searchAliases: ['csat', 'korean', 'seoul'],
      blurb: 'Korean secondary science with CSAT-oriented revision paths.',
    },
  };

  const ACADEMIC_MODULES = [
    { id: 'study-room', title: 'Study Room', icon: '📖', sub: 'Concepts, notes, videos, practice', file: 'room.html', css: 'module-study' },
    { id: 'exam-preparation', title: 'Exam Preparation', icon: '🎯', sub: 'MCQ, PYQ, mock tests, revision', file: 'practice.html', css: 'module-exam' },
    { id: 'forum-discussion', title: 'Forum Discussion', icon: '💬', sub: 'Ask, discuss, learn together', file: 'forum.html', css: 'module-forum' },
  ];

  function metaFor(country) {
    const id = country?.id || country?.slug || '';
    const base = COUNTRY_META[id] || {};
    return {
      code: base.code || id.slice(0, 2).toUpperCase(),
      landmark: base.landmark || '🌍',
      landmarkLabel: base.landmarkLabel || 'Landmark',
      emblemPrimary: base.emblemPrimary || 'flag',
      curriculumLine: base.curriculumLine || country?.subtitle || DEFAULT_CURRICULUM,
      grades: base.grades || base.curriculumLine || country?.subtitle || DEFAULT_CURRICULUM,
      boards: base.boards || [],
      searchAliases: base.searchAliases || [],
      blurb: base.blurb || `Explore ${country?.title || 'this country'} science curricula in the Brahmexa universe.`,
      subjects: DEFAULT_SUBJECTS,
    };
  }

  function enrichCountry(country) {
    return { ...country, universe: metaFor(country) };
  }

  global.AnyoCountryConfig = {
    COUNTRY_META,
    ACADEMIC_MODULES,
    DEFAULT_SUBJECTS,
    metaFor,
    enrichCountry,
  };
})(typeof window !== 'undefined' ? window : globalThis);
