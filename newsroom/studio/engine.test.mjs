// node --test newsroom/studio/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.js';

const mk = (boxes, extra = {}) => ({ size: 'A4', fontSize: 10, pages: boxes.map(b => ({ id: E.uid('p'), name: '', masthead: 'strip', frames: E.framesFrom({ boxes: b }) })), ...extra });
const story = (id, n, o = {}) => ({ id, title: id, body: Array(n).fill('শব্দ').join(' '), status: 'Approved', media: [], ...o });

test('every template tiles its page completely with no overlap', () => {
  for (const t of E.TEMPLATES) {
    const f = E.framesFrom(t);
    assert.ok(E.validFrames(f), t.id + ' overlaps');
    if (t.id !== 'blank') assert.equal(E.coverage(f), 1, t.id + ' leaves a hole');
  }
  for (const n of [1, 2, 3, 4, 5]) { const f = E.framesFrom({ boxes: E.tileFor(n) }); assert.ok(E.validFrames(f)); assert.equal(E.coverage(f), 1, 'tile ' + n); assert.equal(f.length, n); }
});

test('any number of pages from 1 to 64', () => {
  for (const n of [1, 2, 3, 5, 7, 12, 64]) assert.equal(E.planPages(n).length, n);
  assert.equal(E.planPages(500).length, 64);
  let e = mk([[], []]);
  e = E.setPageCount(e, 9); assert.equal(e.pages.length, 9);
  assert.ok(e.pages.slice(2).every(p => p.frames.length > 0), 'added pages arrive designed, not empty');
  e.pages[8].frames[0].storyId = 'a';
  assert.equal(E.pagesLost(e, 8).length, 1);
  assert.equal(E.pagesLost(e, 9).length, 0);
  assert.equal(E.setPageCount(e, 3).pages.length, 3);
});

test('resizing a box pushes or pulls its neighbour; overlap is refused', () => {
  const f = E.framesFrom({ boxes: [[0, 0, 6, 24], [6, 0, 6, 24]] });
  const r = E.resizeFrame(f, f[0].id, { x: 0, y: 0, w: 8, h: 24 });
  assert.deepEqual([r[0].w, r[1].x, r[1].w], [8, 8, 4]);
  assert.equal(E.coverage(r), 1);
  assert.equal(E.resizeFrame(f, f[0].id, { x: 0, y: 0, w: 11, h: 24 }), f);
  assert.equal(E.resizeFrame(f, f[0].id, { x: 0, y: 0, w: 13, h: 24 }), f);
});

test('a shared edge moves as one line, so a row can grow and nothing overlaps', () => {
  const f = E.framesFrom({ boxes: [[0, 0, 8, 11], [8, 0, 4, 11], [0, 11, 5, 13], [5, 11, 7, 13]] });
  const r = E.resizeFrame(f, f[0].id, { x: 0, y: 0, w: 8, h: 13 });
  assert.deepEqual(r.map(x => [x.y, x.h]), [[0, 13], [0, 13], [13, 11], [13, 11]]);
  assert.equal(E.coverage(r), 1);
  assert.equal(E.moveLine(f, f[0].id, 'y', 11, 12), null);
});

test('a box grows over empty boxes, never over filled ones', () => {
  const f = E.framesFrom({ boxes: [[0, 0, 8, 11], [8, 0, 4, 6], [8, 6, 4, 5], [0, 11, 12, 13]] });
  f[0].storyId = 'a'; f[3].storyId = 'b';
  const r = E.resizeFrame(f, f[0].id, { x: 0, y: 0, w: 12, h: 11 }, true);
  assert.equal(r.length, 2); assert.equal(r[0].w, 12); assert.ok(E.validFrames(r));
  f[1].storyId = 'c';
  assert.equal(E.resizeFrame(f, f[0].id, { x: 0, y: 0, w: 12, h: 11 }, true), f);
  f[1].storyId = undefined;
  const t = E.takeEmpty(f, f[0].id); assert.equal(t.length, 2); assert.equal(E.coverage(t), 1);
});

test('balanceFrames gives a long story more room than a short one and never opens a hole', () => {
  const f = E.framesFrom({ boxes: [[0, 0, 6, 24], [6, 0, 6, 12], [6, 12, 6, 12]] });
  f.forEach((x, i) => { x.storyId = 's' + i; });
  const out = E.balanceFrames({ size: 'A4', fontSize: 10 }, f, { [f[0].id]: { words: 500 }, [f[1].id]: { words: 60 }, [f[2].id]: { words: 200 } });
  assert.ok(E.validFrames(out)); assert.equal(E.coverage(out), 1);
  assert.ok(out[0].w > 6); assert.ok(out[1].h < out[2].h);
});

test('split, swap, move, close gaps and tidy never overlap', () => {
  let f = E.framesFrom({ boxes: [[0, 0, 12, 12], [0, 12, 6, 12]] });
  f = E.splitFrame(f, f[0].id, 'cols'); assert.equal(f.length, 3); assert.ok(E.validFrames(f));
  const sw = E.moveFrame(f, f[0].id, 3, 13, f[2].id); assert.ok(E.validFrames(sw)); assert.equal(sw[0].y, 12);
  const mv = E.moveFrame(f, f[2].id, 6, 12); assert.equal(mv[2].x, 6);
  const g = E.closeGaps(f); assert.ok(E.validFrames(g)); assert.equal(E.coverage(g), 1);
  const p = { frames: E.framesFrom(E.templateById('mixed')) }; p.frames[0].storyId = 'a'; p.frames[3].storyId = 'b';
  const t = E.tidyPage(p); assert.equal(t.frames.length, 2); assert.ok(E.validFrames(t.frames)); assert.ok(E.coverage(t.frames) > 0.9);
});

test('largestGap finds the hole', () => {
  assert.deepEqual(E.largestGap(E.framesFrom({ boxes: [[0, 0, 12, 10], [0, 10, 5, 14]] })), { x: 5, y: 10, w: 7, h: 14 });
  assert.equal(E.largestGap(E.framesFrom({ boxes: [[0, 0, 12, 24]] })), null);
});

test('a story runs in reading order across pages', () => {
  const e = mk([[[0, 0, 6, 24], [6, 0, 6, 24]], [[0, 0, 12, 24]]]);
  e.pages[1].frames[0].storyId = 'a'; e.pages[0].frames[1].storyId = 'a'; e.pages[0].frames[0].storyId = 'b';
  assert.deepEqual(E.threads(e).get('a').map(t => t.page), [0, 1]);
});

test('continueStory uses a later empty box, then free space, then a new page', () => {
  const e = mk([[[0, 0, 12, 24]], [[0, 0, 12, 12], [0, 12, 12, 12]]]);
  e.pages[0].frames[0].storyId = 'a'; e.pages[1].frames[0].storyId = 'b';
  const one = E.continueStory(e, 'a', 200); assert.equal(one.page, 1); assert.equal(one.edition.pages[1].frames[1].storyId, 'a');
  const e2 = mk([[[0, 0, 12, 24]], [[0, 0, 12, 12]]]); e2.pages[0].frames[0].storyId = 'a'; e2.pages[1].frames[0].storyId = 'b';
  const two = E.continueStory(e2, 'a', 200); assert.equal(two.page, 1); assert.ok(E.validFrames(two.edition.pages[1].frames));
  const e3 = mk([[[0, 0, 12, 24]]]); e3.pages[0].frames[0].storyId = 'a';
  const three = E.continueStory(e3, 'a', 200); assert.equal(three.added, true); assert.equal(three.edition.pages.length, 2);
  assert.equal(e3.pages.length, 1, 'input untouched');
});

test('continueOn puts the rest on the page that was named', () => {
  const e = mk([[[0, 0, 12, 24]], [[0, 0, 12, 24]], [[0, 0, 12, 24]], [[0, 0, 12, 12], [0, 12, 12, 12]]]);
  e.pages.forEach((p, i) => { p.frames[0].storyId = 's' + i; }); e.pages[3].frames[1].storyId = 'z';
  const r = E.continueOn(e, 's0', 3); assert.ok(r.split);
  assert.deepEqual(E.threads(r.edition).get('s0').map(t => t.page), [0, 3]);
  assert.ok(E.validFrames(r.edition.pages[3].frames)); assert.equal(E.coverage(r.edition.pages[3].frames), 1);
  assert.ok(E.threads(r.edition).has('s3') && E.threads(r.edition).has('z'), 'nothing on page 4 is lost');
});

test('autoPlace gives the lead to the priority story and never places one twice', () => {
  const e = mk([E.templateById('front').boxes, E.templateById('mixed').boxes]);
  const list = [story('s1', 60), story('lead', 300, { priority: 1 }), ...Array.from({ length: 6 }, (_, i) => story('x' + i, 40 + i * 60))];
  const out = E.autoPlace(e, list);
  assert.equal(out.pages[0].frames[0].storyId, 'lead');
  assert.equal(E.threads(out).size, 8);
  assert.ok([...E.threads(out).values()].every(c => c.length === 1));
  assert.ok(out.pages.flatMap(p => p.frames).filter(f => f.kind === 'ad').every(f => !f.storyId));
});

test('changing a design keeps what is on the page', () => {
  const p = { frames: E.framesFrom(E.templateById('front')) };
  p.frames[0].storyId = 'lead'; p.frames[1].storyId = 'b'; p.frames[8].text = 'ad';
  const q = E.applyTemplate(p, E.templateById('featureside'));
  assert.equal(q.frames[0].storyId, 'lead'); assert.ok(q.frames.some(f => f.storyId === 'b')); assert.ok(q.frames.some(f => f.kind === 'ad' && f.text === 'ad'));
});

test('work saved by the old four-page studio opens', () => {
  const old = { stories: [story('a', 50), story('b', 50), story('c', 50)], publication: { name: 'আমার কাগজ', registration: 'X/1' }, edition: { title: 'T', issue: '7', size: 'A3', maxPerPage: 5, items: [{ storyId: 'a', page: 1 }, { storyId: 'b', page: 1, align: 'left' }, { storyId: 'c', page: 3 }], advertisement: 'AD' } };
  const s = E.readBackup(old);
  assert.equal(s.edition.pages.length, 3); assert.equal(s.edition.issue, '7'); assert.equal(s.publication.name, 'আমার কাগজ');
  assert.deepEqual([...E.threads(s.edition).keys()].sort(), ['a', 'b', 'c']);
  assert.ok(s.edition.pages.every(p => E.validFrames(p.frames)));
  assert.ok(s.edition.pages.some(p => p.frames.some(f => f.kind === 'ad' && f.text === 'AD')));
});

test('backup round trip keeps pages and still satisfies the old studio', () => {
  const s = E.readBackup({ stories: [story('a', 10)], edition: { items: [{ storyId: 'a', page: 1 }] } });
  s.edition = E.setPageCount(s.edition, 6);
  const b = JSON.parse(JSON.stringify(E.makeBackup(s)));
  assert.ok(Array.isArray(b.edition.items) && b.edition.items.length <= 100);
  const r = E.readBackup(b); assert.equal(r.edition.pages.length, 6); assert.equal(E.threads(r.edition).size, 1);
});

test('a hostile backup is cleaned', () => {
  const s = E.readBackup({ stories: [{ id: 'a', title: 5, media: [{ url: 'javascript:alert(1)' }, { url: 'data:image/svg+xml;base64,x' }] }], assets: { 'x"': { url: 'data:image/png;base64,a' }, ok: { url: 'http://evil' } }, edition: { pages: [{ frames: [{ id: '"><img>', kind: 'zzz', x: 0, y: 0, w: 12, h: 24 }, { x: 0, y: 0, w: 5, h: 5 }, { x: -4, y: 0, w: 99, h: 5 }] }] } });
  assert.equal(s.stories[0].media.length, 0); assert.deepEqual(s.assets, {});
  assert.equal(s.edition.pages[0].frames.length, 1); assert.equal(s.edition.pages[0].frames[0].kind, 'story'); assert.match(s.edition.pages[0].frames[0].id, /^[\w-]+$/);
  assert.throws(() => E.readBackup({ stories: [] }));
  assert.equal(E.esc('<a "b">'), '&lt;a &quot;b&quot;&gt;'); assert.equal(E.bn(120), '১২০');
});
