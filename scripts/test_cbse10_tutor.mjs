#!/usr/bin/env node
/**
 * Study room tutor intent + verified-bank reply tests (no browser).
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadTutorIntent() {
  const src = fs.readFileSync(path.join(ROOT, 'portal/assets/tutor-intent.js'), 'utf8');
  const sandbox = { window: {}, globalThis: {} };
  sandbox.window = sandbox.globalThis;
  vm.runInNewContext(src, sandbox);
  return sandbox.window.AnyoTutorIntent;
}

function loadShared() {
  const src = fs.readFileSync(path.join(ROOT, 'portal/assets/cbse10-shared.js'), 'utf8');
  const sandbox = { window: {}, globalThis: {} };
  sandbox.window = sandbox.globalThis;
  vm.runInNewContext(src, sandbox);
  return sandbox.window.CBSE10Shared;
}

function effectiveChapter(q) {
  return S.normalizeChapterId ? S.normalizeChapterId(q.chapter) : q.chapter;
}

function loadBank() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'portal/data/cbse10-verified-questions.json'), 'utf8')
  );
  return (raw.questions || []).filter((q) => q.answer_verified !== false && q.correctIndex != null);
}

function filterQuestions(bank, { subject, chapter, bucket, limit }) {
  const subj = subject === 'mathematics' ? 'mathematics' : 'science';
  const pool = bank.filter((q) => {
    const qSub = (q.subject_slug || q.subject || '').toLowerCase();
    const matchSub =
      qSub === subj ||
      qSub === subject ||
      (subj === 'mathematics' && qSub.includes('math')) ||
      (subj === 'science' && qSub === 'science');
    if (bucket) return matchSub && q._bucket === bucket;
    return matchSub && q._inChapterView && (q.chapter || '') === chapter;
  });
  pool.sort((a, b) => (b.exam_year || 0) - (a.exam_year || 0));
  return pool.slice(0, limit);
}

const T = loadTutorIntent();
const S = loadShared();
const bank = loadBank();
S.enrichBankWithBuckets(bank);
let failed = 0;

function ok(label) {
  console.log(`OK   ${label}`);
}

function fail(label, detail = '') {
  console.log(`FAIL ${label}${detail ? ': ' + detail : ''}`);
  failed++;
}

// --- Intent routing ---
const fetchCases = [
  ['one question', true, 1],
  ['give me one question', true, 1],
  ['1 sample question', true, 1],
  ['3 questions on this chapter', true, 3],
  ['5 mcqs on polynomials', true, 5],
  ['i want 3', true, 3],
  ['I want 3', true, 3],
  ['need 2', true, 2],
  ['give me 4', true, 4],
  ['1', true, 1],
  ['3', true, 3],
  ['15', true, 15],
  ['the question and answers not sync', false, null],
  ['do you agree the answer is wrong', false, null],
  ['question and answer not matching', false, null],
  ['explain', false, null],
  ['hello', false, null],
  ['2024', false, null],
];

for (const [msg, wantFetch, wantCount] of fetchCases) {
  const got = T.isQuestionFetchIntent(msg);
  if (got !== wantFetch) {
    fail(`fetch intent "${msg}"`, `expected ${wantFetch}, got ${got}`);
    continue;
  }
  if (wantFetch && T.parseQuestionCount(msg) !== wantCount) {
    fail(`count "${msg}"`, `expected ${wantCount}, got ${T.parseQuestionCount(msg)}`);
    continue;
  }
  ok(`fetch "${msg}" → ${wantFetch}${wantCount != null ? ` (${wantCount})` : ''}`);
}

const explainCases = [
  ['explain', true],
  ['why is this wrong', true],
  ['provide the answer', true],
  ['the question and answers not sync', false],
  ['question and answer not sync', false],
  ['answers do not match the paper', false],
  ['give me 2 questions', false],
];

const syncCases = [
  'the question and answers not sync',
  'question and answer not sync',
  'options look wrong in the pdf',
  'answers do not match',
];

for (const msg of syncCases) {
  const got = T.isBankSyncComplaint?.(msg);
  if (!got) fail(`sync complaint "${msg}"`, 'expected true');
  else ok(`sync complaint "${msg}"`);
}

for (const [msg, want] of explainCases) {
  const got = T.isExplainOrAnswerIntent(msg);
  if (got !== want) fail(`explain intent "${msg}"`, `expected ${want}, got ${got}`);
  else ok(`explain "${msg}" → ${want}`);
}

// --- Bank integrity ---
for (const q of bank) {
  const opts = q.options || [];
  const ci = q.correctIndex ?? q.correct_index;
  if (ci < 0 || ci >= opts.length) {
    fail(`bank ${q.id}`, `correctIndex ${ci} out of range`);
  }
}
if (failed === 0) ok(`bank integrity (${bank.length} questions)`);

// --- Chapter pools (bucket model; master catalog = 10 MCQs/chapter) ---
const lightBucket = filterQuestions(bank, { subject: 'science', bucket: 'physics', limit: 99 });
const lightChapter = filterQuestions(bank, { subject: 'science', chapter: 'light', limit: 99 });
if (lightChapter.length !== 0) fail('light chapter view should be empty (≤20 → bucket)');
else ok('science/light not in chapter sidebar');
if (lightBucket.length < 1) fail('physics bucket empty');
else ok(`science/physics bucket ${lightBucket.length}`);

const polyBucket = filterQuestions(bank, { subject: 'mathematics', bucket: 'miscellaneous', limit: 99 });
const polyChapter = filterQuestions(bank, { subject: 'mathematics', chapter: 'polynomials', limit: 99 });
if (polyChapter.length !== 0) fail('polynomials chapter view', `expected 0 (bucket only), got ${polyChapter.length}`);
else ok('math/polynomials in Miscellaneous bucket only');
if (polyBucket.length < 5) fail('polynomials misc bucket', String(polyBucket.length));
else ok(`math/miscellaneous bucket includes polynomials (${polyBucket.length} total)`);

const acidsBucket = filterQuestions(bank, { subject: 'science', bucket: 'chemistry', limit: 99 });
if (acidsBucket.length < 5) fail('chemistry bucket too small', String(acidsBucket.length));
else ok(`science/chemistry bucket ${acidsBucket.length}`);

// --- Explain must use bank letter ---
const polyQs = bank.filter(
  (q) => (q.subject_slug || '').includes('math') && effectiveChapter(q) === 'polynomials'
);
const q = polyQs[0] || bank.find((x) => (x.subject_slug || '').includes('math'));
const letter = String.fromCharCode(65 + q.correctIndex);
const opt = q.options[q.correctIndex];
if (!letter || !opt) fail('explain sample missing option');
else ok(`verified answer sample: ${letter}. ${String(opt).slice(0, 40)}…`);

console.log(`\n${failed === 0 ? 'All tutor checks passed' : `${failed} check(s) failed`}`);
process.exit(failed ? 1 : 0);
