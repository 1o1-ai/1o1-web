/** Newsroom খবরঘর — the studio: 1 Stories, 2 Design pages, 3 Place stories, 4 Check & print. */
import * as E from './engine.js?v=20261124-1';
import { layout, pageHTML, documentHTML, printEdition, pubOf } from './flow.js?v=20261124-1';
import { download, FORMATS, socialCard, readMedia } from './social.js?v=20261124-1';
import { sampleStories, sampleEdition } from './samples.js?v=20261124-1';
import { library, DISTRICTS } from './library.js?v=20261124-1';

const { esc, bn, words, bodyOf, COLS, ROWS } = E;
const app = document.getElementById('studio-root');
const modalRoot = document.createElement('div');
const toastRoot = document.createElement('div');
toastRoot.className = 'toasts';
toastRoot.setAttribute('role', 'status');
document.body.append(modalRoot, toastRoot);

let state = null;                 // {v,stories,publication,edition,archive,assets,templates}
let lay = null;                   // result of layout()
let editing = null;               // story open in the editor
const ui = { step: 'place', page: 0, sel: null, armed: null, filter: 'All', q: '', menu: false, social: 'Instagram Portrait', zoom: 1, usedOpen: false, src: 'mine', dist: '', len: '', tq: '' };
const undo = [], redo = [];
const STEPS = [['stories', 'Stories', 'খবর'], ['design', 'Design pages', 'পাতার নকশা'], ['place', 'Place stories', 'খবর বসান'], ['print', 'Check & print', 'ছাপা']];
const KIND = { story: 'News story', ad: 'Advertisement', photo: 'Photograph', notice: 'Notice', band: 'Section title' };

/* ---------- storage ---------- */
// The earlier studio saved under "state". This one saves beside it, so nothing made before is overwritten.
// The connection stays open so that a save made while the tab is closing still starts at once.
let conn = null;
async function open() {
  if (!conn) {
    conn = await new Promise((ok, no) => { const r = indexedDB.open('brahmexa-newspaper-v1', 1); r.onupgradeneeded = () => r.result.createObjectStore('workspace'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    conn.onversionchange = conn.onclose = () => { conn?.close(); conn = null; };
  }
  return conn;
}
const put = c => new Promise((ok, no) => { const t = c.transaction('workspace', 'readwrite'); t.objectStore('workspace').put(state, 'state-v2'); t.oncomplete = ok; t.onerror = t.onabort = () => no(t.error); t.commit?.(); });
async function db(mode, key) {
  const c = await open();
  if (mode === 'put') return put(c);
  return new Promise((ok, no) => { const r = c.transaction('workspace').objectStore('workspace').get(key); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
}
let saveTimer, saveFailed = false;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => db('put').then(() => { saveFailed = false; }).catch(() => { if (!saveFailed) toast('This browser could not save your work. Use Menu → Download backup now.', true); saveFailed = true; }), 150);
}
/** Closing the tab straight after a change must not lose it. */
const flush = () => { if (state && conn) { clearTimeout(saveTimer); try { put(conn).catch(() => {}); } catch { /* connection already gone */ } } };
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
function freshState(publication = { ...E.PUBLICATION }) {
  return { v: 2, stories: sampleStories(), publication, edition: sampleEdition(publication), archive: [], assets: {}, templates: [] };
}
async function boot() {
  let note = '';
  try {
    const v2 = await db('get', 'state-v2');
    if (v2?.edition?.pages) state = { assets: {}, templates: [], archive: [], ...v2 };
    else {
      const old = await db('get', 'state');
      if (old?.edition && Array.isArray(old.stories)) {
        const onlySamples = old.stories.every(s => s.demo && /^sample-\d+$/.test(s.id)) && !(old.archive || []).length;
        if (onlySamples) state = freshState({ ...E.PUBLICATION, ...old.publication });
        else { state = E.readBackup(old); note = 'Your stories and pages from the earlier studio are here. Choose Design pages to give each page a new shape.'; }
      }
    }
  } catch { toast('Browser storage is unavailable. Use Menu → Download backup to keep your work.', true); }
  if (!state) state = freshState();
  await Promise.race([document.fonts.load('700 20px Bengali', 'খবর'), new Promise(r => setTimeout(r, 4000))]);
  await document.fonts.ready;
  relayout(); render();
  if (note) toast(note);
}

/* ---------- state changes ---------- */
const ed = () => state.edition;
const page = () => ed().pages[ui.page];
const approved = () => state.stories.filter(s => s.status === 'Approved');
const story = id => state.stories.find(s => s.id === id) || (String(id).startsWith('lib-') ? library().find(s => s.id === id) : undefined);
/** A library report becomes one of the editor's own stories the moment it is used. */
function adopt(ids) { const add = ids.filter(id => !state.stories.some(s => s.id === id)).map(id => library().find(s => s.id === id)).filter(Boolean); if (add.length) state.stories = [...state.stories, ...add.map(s => ({ ...s }))]; return add.length; }
const frameAt = id => { for (let p = 0; p < ed().pages.length; p++) { const f = ed().pages[p].frames.find(x => x.id === id); if (f) return { p, f }; } return null; };
const selected = () => { const f = ui.sel && page()?.frames.find(x => x.id === ui.sel); return f || null; };

function relayout() { lay = layout(ed(), approved(), state.publication); }
function commit(next, { keepSel = true } = {}) {
  const now = JSON.stringify(ed());
  const edition = { ...next, status: 'Draft' };
  if (JSON.stringify(edition) === now) { render(); return; }
  undo.push(now); if (undo.length > 80) undo.shift();
  redo.length = 0;
  state.edition = edition;
  ui.page = E.clamp(ui.page, 0, edition.pages.length - 1);
  if (!keepSel || !selected()) ui.sel = keepSel ? (selected() ? ui.sel : null) : null;
  save(); relayout(); render();
}
function travel(from, to) {
  if (!from.length) return;
  to.push(JSON.stringify(ed()));
  state.edition = JSON.parse(from.pop());
  ui.page = E.clamp(ui.page, 0, ed().pages.length - 1); ui.sel = null; ui.armed = null;
  save(); relayout(); render();
}
const withPage = (i, patch) => ({ ...ed(), pages: ed().pages.map((p, k) => k === i ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p) });
const withFrames = (i, frames) => withPage(i, { frames });
const withFrame = (id, patch) => ({ ...ed(), pages: ed().pages.map(p => ({ ...p, frames: p.frames.map(f => f.id === id ? { ...f, ...patch } : f) })) });
const emptied = f => ({ id: f.id, kind: f.kind, x: f.x, y: f.y, w: f.w, h: f.h });

function toast(text, bad) {
  const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : '');
  t.textContent = text;
  while (toastRoot.children.length > 1) toastRoot.firstChild.remove();
  toastRoot.append(t);
  setTimeout(() => t.remove(), bad ? 8000 : 5000);
}

/* ---------- placing ---------- */
function placeStory(storyId, frameId, fromFrame) {
  const at = frameAt(frameId);
  if (!at || at.f.id === fromFrame) return;
  if (at.f.kind !== 'story' && at.f.kind !== 'photo') { toast(`That box is for: ${KIND[at.f.kind]}. Change its type in Design pages.`, true); return; }
  const src = fromFrame && frameAt(fromFrame);
  const before = E.threads(ed()).get(storyId)?.length || 0;
  adopt([storyId]);
  let next = ed();
  if (src && src.f.kind === at.f.kind) {
    const a = E.contentOf(src.f), b = E.contentOf(at.f);
    next = { ...next, pages: next.pages.map(p => ({ ...p, frames: p.frames.map(f => f.id === src.f.id ? { ...emptied(f), ...b } : f.id === at.f.id ? { ...emptied(f), ...a } : f) })) };
  } else next = withFrame(frameId, { ...Object.fromEntries(Object.keys(E.contentOf(at.f)).map(k => [k, undefined])), storyId });
  ui.armed = null; ui.sel = frameId; ui.page = at.p;
  commit(next);
  const s = story(storyId), r = lay.report[storyId];
  if (at.f.kind === 'story' && !src && before && r) toast(`“${s.title.slice(0, 40)}” now continues on page ${at.p + 1}.`);
  else if (r?.left) toast(`${r.left} words do not fit. Make the box bigger, or choose the page it continues on.`);
}
function dropOnPage(storyId, p) {
  const empty = ed().pages[p].frames.find(f => f.kind === 'story' && !E.filled(f));
  if (empty) { placeStory(storyId, empty.id); return; }
  const gap = E.largestGap(ed().pages[p].frames, 3, 3);
  if (!gap) { toast(`Page ${p + 1} has no empty box. Open Design pages and split or add one.`, true); return; }
  const f = { id: E.uid(), kind: 'story', ...gap }, before = JSON.stringify(ed());
  state.edition = withFrames(p, [...ed().pages[p].frames, f]);
  placeStory(storyId, f.id);
  undo[undo.length - 1] = before;
}
function autoContinue(only) {
  let e = ed(), added = 0, done = 0;
  for (let i = 0; i < 40; i++) {
    const rep = layout(e, approved(), state.publication).report;
    const id = Object.keys(rep).find(k => rep[k].left > 0 && (!only || k === only));
    if (!id) break;
    const r = E.continueStory(e, id, rep[id].left);
    if (r.page < 0) { toast('There is no more room. Add pages or make a box larger.', true); break; }
    if (r.added) added++;
    e = r.edition; done++;
  }
  commit(e);
  if (done) toast(`${done} continuation${done > 1 ? 's' : ''} added${added ? `, with ${added} new page${added > 1 ? 's' : ''}` : ''}.`);
}
function autoFill(onlyPage) {
  const before = new Set(E.threads(ed()).keys());
  const pool = ui.src === 'lib' ? libraryLeft().filter(s => !s.pages) : trayStories();
  let e = E.autoPlace(ed(), pool, onlyPage ?? null);
  const mine = [...E.threads(e).keys()].filter(id => !before.has(id));
  if (!mine.length) { toast(pool.length ? 'No empty story box to fill. Add a box in Design pages.' : 'Every approved story is already on a page.'); return; }
  const list = [...approved(), ...pool.filter(s => !state.stories.some(x => x.id === s.id))];
  const run = x => layout(x, list, state.publication);
  const total = l => Object.values(l.report).reduce((n, r) => n + (r.left || 0), 0);
  const clear = (x, id) => ({ ...x, pages: x.pages.map(p => ({ ...p, frames: p.frames.map(f => f.kind === 'story' && f.storyId === id ? emptied(f) : f) })) });
  const refused = new Set();
  // A story that is too long continues on a later page; if none has room, a shorter story takes its box.
  // The number of pages is the editor's choice, so none is added here.
  let l = run(e);
  for (let k = 0; k < 80; k++) {
    const id = Object.keys(l.report).find(x => !before.has(x) && l.report[x].left > 0);
    if (!id) break;
    const chain = l.report[id].chain, loose = f => f.kind === 'story' ? 1 - (l.frames[f.id]?.fill ?? 1) : 0.2;
    let best = null;
    for (let p = chain.at(-1).page + 1; p < e.pages.length && chain.length < 3; p++) {
      const r = E.continueOn(e, id, p, loose);
      if (!r) continue;
      const rl = run(r.edition);
      if (total(rl) < total(l) && (!best || total(rl) < total(best.l))) best = { e: r.edition, l: rl };
    }
    if (best) { e = best.e; l = best.l; continue; }
    refused.add(id);
    const head = chain[0].frame, room = l.frames[head.id].words, on = E.threads(e);
    const swap = pool.filter(s => !on.has(s.id) && !refused.has(s.id) && words(bodyOf(s)) <= room * 1.15).sort((x, y) => words(bodyOf(y)) - words(bodyOf(x)))[0];
    e = clear(e, id);
    if (swap) e = { ...e, pages: e.pages.map(p => ({ ...p, frames: p.frames.map(f => f.id === head.id ? { ...f, storyId: swap.id } : f) })) };
    l = run(e);
  }
  adopt([...E.threads(e).keys()].filter(id => !before.has(id)));
  e.pages.forEach((_, i) => { if (onlyPage === undefined || i === onlyPage) e = fitPage(e, i); });
  commit(e);
  const n = [...E.threads(ed()).keys()].filter(id => !before.has(id)).length, back = refused.size;
  toast(`${n} stor${n === 1 ? 'y' : 'ies'} placed.${back ? ` ${back} too long for ${onlyPage === undefined ? 'this paper' : 'this page'} stayed in the list.` : ''}`);
}
const usedBefore = () => new Set(state.archive.flatMap(a => [...E.threads(a).keys()]));
function trayStories() {
  const on = E.threads(ed()), used = usedBefore();
  return approved().filter(s => !on.has(s.id) && !used.has(s.id));
}
const libraryLeft = () => { const on = E.threads(ed()); return library().filter(s => !on.has(s.id)); };
/** "Continue this on page 4" — as the editor says, making the page and the room if need be. */
function continueOnPage(storyId, p) {
  let e = ed();
  if (p >= e.pages.length) { e = E.setPageCount(e, p + 1, 'continued'); e = { ...e, pages: e.pages.map((g, i) => i >= ed().pages.length ? { ...g, name: 'বাকি খবর' } : g) }; }
  const r = E.continueOn(e, storyId, p, f => f.kind === 'story' ? 1 - (lay.frames[f.id]?.fill ?? 1) : 0.6);
  if (!r) { toast(`Page ${p + 1} has no box large enough to share. Add or enlarge one in Design pages.`, true); return; }
  commit(r.edition);
  const left = lay.report[storyId]?.left || 0;
  toast(`Continues on page ${p + 1}.${r.split ? ' A box there was split to make room.' : ''}${left ? ` ${left} words are still left.` : ''}`);
}
/** Enlarge one box, taking room from its neighbours, until the whole story fits. */
function fitStoryHere(id) {
  const at = frameAt(id), base = ed().pages[at.p].frames, sid = at.f.storyId;
  let best = null;
  for (let w = at.f.w; w <= COLS && !best; w++) for (let h = at.f.h; h <= ROWS; h++) {
    if (w === at.f.w && h === at.f.h) continue;
    for (const [x, y] of [[at.f.x, at.f.y], [at.f.x - (w - at.f.w), at.f.y], [at.f.x, at.f.y - (h - at.f.h)], [at.f.x - (w - at.f.w), at.f.y - (h - at.f.h)]]) {
      const t = E.resizeFrame(base, id, { x, y, w, h }, true);
      if (t === base) continue;
      const e = withFrames(at.p, t), l = layout(e, approved(), state.publication);
      if (!l.report[sid].left && !l.frames[id].tooSmall) { best = e; break; }
    }
    if (best) break;
  }
  if (best) { commit(best); toast('The whole story now fits here.'); } else toast('There is not enough room on this page for the whole story. Choose a page for it to continue on.', true);
}
function pageFill(i) {
  const frames = ed().pages[i].frames;
  let a = 0;
  for (const f of frames) a += f.w * f.h * (f.kind === 'story' ? (f.storyId ? lay.frames[f.id]?.fill ?? 1 : 0) : f.kind === 'band' || E.filled(f) ? 1 : 0);
  return Math.round(a / (COLS * ROWS) * 100);
}

/** Reshape the boxes on a page to suit the stories in them, then check the result really is fuller. */
function fitPage(e, i) {
  const score = (l, frames) => frames.reduce((n, f) => { const r = l.frames[f.id]; return n + f.w * f.h * (f.kind !== 'story' ? 1 : !f.storyId || !r ? 0 : r.tooSmall ? -1 : r.fill); }, 0);
  const leftOver = l => Object.values(l.report).reduce((n, r) => n + (r.left || 0), 0);
  let bestE = e, bestL = layout(e, approved(), state.publication), boost = 1;
  for (let round = 0; round < 4; round++) {
    const info = {}, chains = E.threads(bestE);
    for (const f of bestE.pages[i].frames) {
      const r = bestL.frames[f.id], s = f.storyId && story(f.storyId);
      if (!r || !s || r.missing) continue;
      const chain = chains.get(s.id) || [], more = chain.at(-1)?.frame.id !== f.id;
      info[f.id] = { words: (words(bodyOf(s)) - r.start) * boost, photo: r.pics > 0, more };
    }
    const frames = E.balanceFrames(bestE, bestE.pages[i].frames, info);
    const e2 = { ...bestE, pages: bestE.pages.map((p, k) => k === i ? { ...p, frames } : p) };
    const l2 = layout(e2, approved(), state.publication);
    const gone = leftOver(bestL) - leftOver(l2);
    if (gone > 0 || (gone === 0 && score(l2, frames) > score(bestL, bestE.pages[i].frames) + 0.5)) { bestE = e2; bestL = l2; } else boost *= 1.12;
  }
  return bestE;
}

/** What stops, or should be looked at before, printing. */
function problems() {
  const out = [], e = ed();
  if (!E.threads(e).size) out.push({ bad: true, text: 'No story is on any page yet.', page: 0 });
  for (const [id, r] of Object.entries(lay.report)) {
    const s = story(id), name = s ? `“${s.title.slice(0, 44)}”` : 'A story';
    const last = r.chain[r.chain.length - 1];
    if (r.missing) out.push({ bad: true, text: `${name} is no longer approved. Approve it again or take it off the page.`, page: last.page, frame: last.frame.id });
    else if (r.left > 0) out.push({ bad: true, text: `${name}: ${r.left} word${r.left > 1 ? 's' : ''} still without a place.`, page: last.page, frame: last.frame.id, fix: id });
    for (const { page: p, frame } of r.chain) {
      const f = lay.frames[frame.id];
      if (f?.tooSmall) out.push({ bad: true, text: `${name} does not fit its box on page ${p + 1}. Make the box bigger.`, page: p, frame: frame.id });
      if (f?.redundant) out.push({ text: `${name}: the whole story already fits, so its continuation on page ${p + 1} is empty.`, page: p, frame: frame.id, clear: frame.id });
      else if (f && !f.missing && !f.left && f.fill < 0.6) out.push({ text: `${name} fills only ${Math.round(f.fill * 100)}% of its box on page ${p + 1}. Use a smaller box or add a photograph.`, page: p, frame: frame.id, loose: true });
    }
  }
  e.pages.forEach((p, i) => {
    const empty = p.frames.filter(f => !E.filled(f)).length;
    if (!p.frames.length) out.push({ text: `Page ${i + 1} is blank.`, page: i });
    else if (empty || E.coverage(p.frames) < 0.985) out.push({ text: `Page ${i + 1} has ${empty ? `${empty} empty box${empty > 1 ? 'es' : ''}` : 'unused space'}.`, page: i, tidy: i });
  });
  return out;
}

/* ---------- views ---------- */
function render() {
  const scroll = {};
  app.querySelectorAll('[data-scroll]').forEach(n => { scroll[n.dataset.scroll] = [n.scrollLeft, n.scrollTop]; });
  const act = document.activeElement, key = app.contains(act) ? act.dataset.k : null;
  const bad = problems().filter(p => p.bad).length;
  app.innerHTML = `<header class="top"><a class="brand" href="/newsroom/"><b>Newsroom</b> <span lang="bn">খবরঘর</span></a>
    <nav class="steps" aria-label="Steps">${STEPS.map(([id, en, b], i) => `<button data-act="step" data-v="${id}" class="${ui.step === id ? 'on' : ''}" ${ui.step === id ? 'aria-current="step"' : ''}><i>${i + 1}</i><span>${en}<small lang="bn">${b}</small></span>${id === 'stories' && waiting() ? `<em title="Waiting for approval">${waiting()}</em>` : ''}${id === 'print' && bad ? `<em class="bad">${bad}</em>` : ''}</button>`).join('')}</nav>
    <div class="tools"><button data-act="undo" ${undo.length ? '' : 'disabled'} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button><button data-act="redo" ${redo.length ? '' : 'disabled'} title="Redo (Ctrl+Y)" aria-label="Redo">↷</button><button class="solid" data-act="write">＋ New story</button><button data-act="menu" aria-expanded="${ui.menu}" aria-haspopup="true">Menu ▾</button>
    ${ui.menu ? `<div class="menu" role="menu">${[['settings', 'Paper & masthead'], ['newissue', 'New issue…'], ['issues', 'Earlier issues'], ['backup', 'Download backup'], ['restore', 'Restore backup…'], ['sample', 'Load sample newspaper']].map(([a, t]) => `<button role="menuitem" data-act="${a}">${t}</button>`).join('')}<a role="menuitem" href="/newsroom/demo/">Watch the demo ↗</a></div>` : ''}</div></header>
    ${ui.step === 'stories' ? storiesView() : ui.step === 'print' ? printView() : pagesView()}`;
  app.querySelectorAll('[data-scroll]').forEach(n => { const s = scroll[n.dataset.scroll]; if (s) [n.scrollLeft, n.scrollTop] = s; });
  fitSheets();
  if (key) app.querySelector(`[data-k="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}
const waiting = () => state.stories.filter(s => s.status === 'In Review').length;

function lengthLabel(s) {
  const n = words(bodyOf(s));
  return n < 30 ? 'Brief' : n < 90 ? 'Short' : n < 180 ? 'Medium' : n < 450 ? 'Long' : 'Very long';
}
const pagesOf = id => (E.threads(ed()).get(id) || []).map(t => t.page + 1).filter((p, i, a) => a.indexOf(p) === i);

function storiesView() {
  const F = { All: () => true, Drafts: s => s.status === 'Draft', 'To approve': s => s.status === 'In Review', Approved: s => s.status === 'Approved' };
  const list = state.stories.filter(F[ui.filter]).filter(s => !ui.q || (s.title + ' ' + s.body + ' ' + s.byline).toLowerCase().includes(ui.q.toLowerCase()));
  return `<main class="stories"><div class="bar"><div class="chips">${Object.keys(F).map(k => `<button data-act="filter" data-v="${k}" class="${ui.filter === k ? 'on' : ''}">${k} <small>${state.stories.filter(F[k]).length}</small></button>`).join('')}</div><input data-k="q" data-set="q" type="search" placeholder="Search stories" aria-label="Search stories" value="${esc(ui.q)}"><button data-act="addlib">＋ Add the Hooghly, Howrah &amp; Kolkata library</button></div>
  <div class="cards">${list.map(s => {
    const pages = pagesOf(s.id), img = s.media?.find(m => m.type.startsWith('image/'));
    return `<article>${img ? `<img alt="" src="${esc(img.url)}">` : ''}<div><small class="st ${s.status === 'Approved' ? 'ok' : s.status === 'In Review' ? 'wait' : ''}">${s.status === 'In Review' ? 'Waiting for approval' : s.status}${s.demo ? ' · fictional sample' : ''}</small><h3 lang="bn">${esc(s.title || 'Untitled')}</h3><p class="meta">${lengthLabel(s)} · ${words(bodyOf(s))} words${s.priority === 1 ? ' · Lead' : ''}${pages.length ? ` · <b>page ${pages.join(' → ')}</b>` : ''}</p><div class="row"><button data-act="edit" data-v="${esc(s.id)}">Edit</button>${s.status !== 'Approved' ? `<button class="solid" data-act="approve" data-v="${esc(s.id)}">Approve</button>` : ''}<button class="ghost" data-act="delete" data-v="${esc(s.id)}">Delete</button></div></div></article>`;
  }).join('') || '<p class="empty">No stories here. Press ＋ New story to write one.</p>'}</div></main>`;
}

const mini = (frames, cls = '') => `<span class="mini ${cls}">${frames.map(f => `<i class="${f.kind}${E.filled(f) ? ' full' : ''}${f.over ? ' over' : ''}" style="left:${f.x / COLS * 100}%;top:${f.y / ROWS * 100}%;width:${f.w / COLS * 100}%;height:${f.h / ROWS * 100}%"></i>`).join('')}</span>`;
const overFrame = f => f.storyId && lay.report[f.storyId]?.left > 0 && lay.frames[f.id]?.left > 0 && lay.report[f.storyId].chain.at(-1).frame.id === f.id;

function rail() {
  return `<aside class="rail" data-scroll="rail"><label class="count">Pages<span><button data-act="pages" data-v="-1" aria-label="One page fewer">−</button><input data-k="count" data-set="pagecount" type="number" min="1" max="${E.MAX_PAGES}" value="${ed().pages.length}" aria-label="Number of pages"><button data-act="pages" data-v="1" aria-label="One page more">＋</button></span></label>
  <div class="thumbs">${ed().pages.map((p, i) => { const fill = pageFill(i); return `<button class="thumb ${i === ui.page ? 'on' : ''}" data-act="goto" data-v="${i}" data-thumb="${i}" ${i === ui.page ? 'aria-current="page"' : ''}>${mini(p.frames.map(f => ({ ...f, over: overFrame(f) })), p.masthead)}<span>${i + 1}<small lang="bn">${esc(p.name)}</small></span><em class="${fill < 70 ? 'low' : ''}">${fill}% full</em></button>`; }).join('')}
  <button class="addpage" data-act="addpage">＋ Add page</button></div></aside>`;
}

function overlay(f, inner) {
  const sel = f.id === ui.sel, design = ui.step === 'design', s = f.storyId && story(f.storyId), r = lay.frames[f.id];
  const over = overFrame(f);
  const lack = r && !r.missing && s && f.kind === 'story' && !over && r.fill < 0.6 && !r.redundant;
  const label = design
    ? `<span class="lab"><b>${f.kind === 'story' ? (s ? esc(s.title) : 'News story') : KIND[f.kind]}</b><small>${f.w}×${f.h}${f.kind === 'story' ? ` · holds about ${E.capacity(ed(), f)} words` : ''}</small></span>`
    : inner ? '' : `<span class="lab drop"><b>${f.kind === 'story' ? 'Drop a story here' : KIND[f.kind]}</b><small>${f.kind === 'story' ? `about ${E.capacity(ed(), f)} words` : 'click to fill in'}</small></span>`;
  const badge = design ? '' : over ? `<button class="badge" data-act="badge" data-v="${esc(f.id)}" title="Make it fit, or choose the page it continues on">＋${lay.report[f.storyId].left} word${lay.report[f.storyId].left > 1 ? 's' : ''} → continue</button>` : r?.missing ? '<span class="badge">Not approved</span>' : lack ? `<span class="badge soft">${Math.round(r.fill * 100)}% full</span>` : '';
  const handles = sel ? ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(h => `<i class="hd ${h}" data-handle="${h}"></i>`).join('') : '';
  return `<div class="ov ${sel ? 'sel' : ''} ${design ? 'design' : ''} ${!E.filled(f) ? 'vacant' : ''} ${ui.armed ? 'target' : ''}" data-k="fr-${esc(f.id)}" data-box="${esc(f.id)}" tabindex="0" role="button" aria-label="${esc((s ? s.title : KIND[f.kind]) + ', ' + f.w + ' by ' + f.h)}">${label}${badge}${handles}</div>`;
}

function pagesView() {
  const design = ui.step === 'design', p = page(), n = ed().pages.length;
  const rest = Object.values(lay.report).filter(r => r.left > 0).length;
  return `<main class="desk">${rail()}<section class="stage"><div class="stagebar"><div class="pager"><button data-act="goto" data-v="${ui.page - 1}" ${ui.page ? '' : 'disabled'} aria-label="Previous page">‹</button><b>Page ${ui.page + 1} of ${n}</b><button data-act="goto" data-v="${ui.page + 1}" ${ui.page < n - 1 ? '' : 'disabled'} aria-label="Next page">›</button></div>
   <span class="hint">${design ? 'Drag a box to move it, drag its edge to resize, drag on white space to add one.' : ui.armed ? 'Now click the box where this story should go.' : 'Drag a story into a box. Click a box to resize it or continue it on another page.'}</span>
   <div class="row">${design ? `<button data-act="tidy">Remove empty boxes</button><button class="solid" data-act="step" data-v="place">Place stories →</button>` : `${rest ? `<button class="warn" data-act="continueall">Continue ${rest} long stor${rest > 1 ? 'ies' : 'y'}</button>` : ''}<button data-act="fit" title="Reshape the boxes to suit the stories in them">Fit boxes to stories</button><button data-act="fillpage">Fill this page</button><button class="solid" data-act="fillall">Fill all pages</button>`}</div></div>
   <div class="canvas ${design ? 'designing' : 'placing'}" data-scroll="canvas"><div class="scaler" data-fit>${pageHTML(ed(), ui.page, approved(), lay, state.assets, { editor: overlay })}</div></div></section>
   <aside class="side" data-scroll="side-${ui.step}">${selected() ? framePanel(selected()) : ''}${design ? (selected() ? '' : pagePanel(p)) : tray()}</aside></main>`;
}

function pagePanel(p) {
  const all = [...E.TEMPLATES, ...state.templates];
  return `<section class="panel"><h3>Page ${ui.page + 1}</h3><label>Page name<input data-k="pname" data-set="page.name" value="${esc(p.name)}" lang="bn"></label><label>Top of page<select data-k="pmast" data-set="page.masthead">${[['full', 'Full masthead'], ['strip', 'Thin heading'], ['none', 'Nothing']].map(([v, t]) => `<option value="${v}" ${p.masthead === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></section>
  <section class="panel"><h3>Choose a design</h3><p class="hint">Stories already on the page are kept.</p><div class="tpls">${all.map(t => `<button data-act="template" data-v="${esc(t.id)}" title="${esc(t.name)}">${mini(t.boxes.map(([x, y, w, h, kind]) => ({ x, y, w, h, kind: kind || 'story' })))}<span>${esc(t.name)}<small lang="bn">${esc(t.bn)}</small></span></button>`).join('')}</div></section>
  <section class="panel"><h3>This page</h3><div class="grid2"><button data-act="dup">Duplicate design</button><button data-act="savetpl">Save as my design</button><button data-act="gaps">Close gaps</button><button data-act="addbox">＋ Add box</button><button data-act="movepage" data-v="-1" ${ui.page ? '' : 'disabled'}>Move earlier</button><button data-act="movepage" data-v="1" ${ui.page < ed().pages.length - 1 ? '' : 'disabled'}>Move later</button><button class="ghost" data-act="clearpage">Empty this page</button><button class="ghost" data-act="delpage" ${ed().pages.length > 1 ? '' : 'disabled'}>Delete page</button></div></section>`;
}

const opt = (v, t, cur) => `<option value="${v}" ${String(cur ?? '') === String(v) ? 'selected' : ''}>${t}</option>`;
const pick = (label, key, f, list) => `<label>${label}<select data-k="f-${key}" data-set="frame.${key}">${list.map(([v, t]) => opt(v, t, f[key] ?? list[0][0])).join('')}</select></label>`;
function framePanel(f) {
  const s = f.storyId && story(f.storyId), r = s && lay.report[s.id], design = ui.step === 'design';
  const chain = r?.chain || [];
  const head = `<div class="phead"><h3>${s && f.kind === 'story' ? 'Story in this box' : 'This box'}</h3><button class="ghost" data-act="unselect" aria-label="Close">✕</button></div>`;
  const imgField = `<label>Image<input type="file" accept="image/jpeg,image/png,image/webp" data-set="frame.image"></label>${f.assetId ? '<button class="ghost" data-act="noimage">Remove image</button>' : ''}`;
  let body = '';
  if (f.kind === 'story' && s) {
    const later = ed().pages.map((p, i) => i).filter(i => i > (chain[0]?.page ?? ui.page) && !chain.some(c => c.page === i));
    body = `<p class="stitle" lang="bn">${esc(s.title)}</p>
    ${chain.length > 1 ? `<ol class="chain">${chain.map(c => `<li class="${c.frame.id === f.id ? 'on' : ''}"><button data-act="jump" data-p="${c.page}" data-v="${esc(c.frame.id)}">Page ${c.page + 1} <small>${lay.frames[c.frame.id]?.words ?? 0} words</small></button></li>`).join('')}</ol>` : ''}
    <div class="alert ${r?.left > 0 ? '' : 'calm'}">${r?.left > 0 ? `<b>${r.left} word${r.left > 1 ? 's do' : ' does'} not fit</b><button class="solid" data-act="fithere">Fit the whole story here</button><button data-act="takeempty">Use all the empty space on this page</button>` : ''}<span>Continue on page</span><div class="pgs">${later.slice(0, 24).map(i => `<button data-act="conton" data-v="${i}" title="${esc(ed().pages[i].name)}">${i + 1}</button>`).join('')}${ed().pages.length < E.MAX_PAGES ? `<button data-act="conton" data-v="${ed().pages.length}" title="Add page ${ed().pages.length + 1}">＋${ed().pages.length + 1}</button>` : ''}${r?.left > 0 ? `<button data-act="continue" data-v="${esc(s.id)}">Choose for me</button>` : ''}</div>${r?.left > 0 ? '' : '<small>The whole story fits now. If you continue it, make this box smaller and the rest moves there.</small>'}</div>
    ${lay.frames[f.id]?.redundant ? `<div class="alert soft">The whole story already fits before this box. <button data-act="removestory">Free this box</button></div>` : ''}
    <div class="grid2">${pick('Headline', 'headSize', f, [['auto', 'Automatic'], ['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Extra large']])}${pick('Columns', 'cols', f, [['', 'Automatic'], ...[1, 2, 3, 4, 5, 6].map(n => [n, n])])}${pick('Photograph', 'photo', f, [['', 'Automatic'], ['top', 'Above text'], ['left', 'Left'], ['right', 'Right'], ['none', 'No photo']])}${pick('Photos used', 'photoCount', f, [['', 'Automatic'], ...[1, 2, 3, 4, 5, 6].map(n => [n, n])])}${pick('Photo crop', 'photoFit', f, [['', 'Fill the space'], ['whole', 'Show whole photo']])}${pick('Text align', 'align', f, [['', 'Automatic'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right'], ['justify', 'Justified']])}${pick('Headline colour', 'colour', f, [['auto', 'Automatic'], ['black', 'Black'], ['blue', 'Blue'], ['green', 'Green'], ['red', 'Red']])}${pick('Background', 'tint', f, [['none', 'White'], ['cream', 'Cream'], ['blue', 'Blue'], ['green', 'Green'], ['grey', 'Grey'], ['dark', 'Dark']])}</div>
    ${pick('Highlighted line from the story', 'quote', f, [['', 'Automatic'], ['true', 'Always'], ['false', 'Never']])}<label class="check"><input type="checkbox" data-set="frame.border" ${f.border ? 'checked' : ''}> Border around the box</label>
    <div class="row"><button data-act="edit" data-v="${esc(s.id)}">Edit story</button><button class="ghost" data-act="removestory">Take off this box</button></div>`;
  } else if (f.kind === 'ad') body = `<label>Heading<input data-k="f-title" data-set="frame.title" value="${esc(f.title)}"></label><label>Text<textarea rows="3" data-k="f-text" data-set="frame.text">${esc(f.text)}</textarea></label>${imgField}`;
  else if (f.kind === 'notice') body = `<label>Heading<input data-k="f-title" data-set="frame.title" value="${esc(f.title)}"></label><label>Text<textarea rows="5" data-k="f-text" data-set="frame.text">${esc(f.text)}</textarea></label>`;
  else if (f.kind === 'band') body = `<label>Title<input data-k="f-title" data-set="frame.title" value="${esc(f.title)}"></label>`;
  else if (f.kind === 'photo') body = `${imgField}<label>Caption<input data-k="f-caption" data-set="frame.caption" value="${esc(f.caption)}"></label><p class="hint">Or drag a story here to use its first photograph.</p>${f.storyId ? '<button class="ghost" data-act="removestory">Take off this box</button>' : ''}`;
  else if (!design) body = '<p class="hint">This box is empty. Drag a story here from the list below.</p>';
  const shape = design ? `<label>Box type<select data-k="f-kind" data-set="frame.kind">${Object.entries(KIND).map(([v, t]) => opt(v, t, f.kind)).join('')}</select></label><div class="grid2"><button data-act="split" data-v="cols">Split side by side</button><button data-act="split" data-v="rows">Split top / bottom</button><button data-act="grow">Grow into space</button><button class="ghost" data-act="delbox">Delete box</button></div>` : '';
  return `<section class="panel frame">${head}${shape}${body}</section>`;
}

function tray() {
  const list = trayStories(), used = approved().filter(s => usedBefore().has(s.id) && !E.threads(ed()).has(s.id));
  const rest = Object.entries(lay.report).filter(([, r]) => r.left > 0);
  const card = (s, extra = '', cls = '', sub = `${lengthLabel(s)} · ${words(bodyOf(s))} words${s.media?.some(m => m.type.startsWith('image/')) ? ' · photo' : ''}`) => `<button class="tcard ${cls} ${ui.armed === s.id ? 'armed' : ''}" data-k="t-${esc(s.id)}" data-drag="${esc(s.id)}"><span class="grip" aria-hidden="true">⋮⋮</span><span><b lang="bn">${esc(s.title)}</b><small>${extra}${sub}</small></span></button>`;
  const on = [...E.threads(ed()).keys()].map(story).filter(Boolean);
  const lib = ui.src === 'lib', LEN = { Brief: [0, 30], Short: [30, 100], Long: [100, 450], Pages: [450, 1e9] };
  const pool = (lib ? libraryLeft() : list).filter(s => (!ui.dist || s.district === ui.dist) && (!ui.len || (words(bodyOf(s)) >= LEN[ui.len][0] && words(bodyOf(s)) < LEN[ui.len][1])) && (!ui.tq || (s.title + s.body).includes(ui.tq)));
  const size = s => s.pages ? `${s.pages} page${s.pages > 1 ? 's' : ''} long · ${words(bodyOf(s))} words` : undefined;
  return `<section class="panel tray"><div class="seg"><button data-act="src" data-v="mine" class="${lib ? '' : 'on'}">My stories <small>${list.length}</small></button><button data-act="src" data-v="lib" class="${lib ? 'on' : ''}">News library <small>${libraryLeft().length}</small></button></div>
  <div class="chips sm">${Object.entries(DISTRICTS).map(([k, [en]]) => `<button data-act="dist" data-v="${k}" class="${ui.dist === k ? 'on' : ''}">${en}</button>`).join('')}</div><div class="chips sm">${Object.keys(LEN).map(k => `<button data-act="len" data-v="${k}" class="${ui.len === k ? 'on' : ''}">${k === 'Pages' ? '1–3 pages' : k}</button>`).join('')}</div>
  ${rest.length ? `<h3 class="red">Continue these <small>${rest.length}</small></h3>${rest.map(([id, r]) => story(id) ? card(story(id), '', 'rest', `${r.left} word${r.left > 1 ? 's' : ''} left · drag to another page`) : '').join('')}` : ''}
  <h3>${lib ? 'Practice reports' : 'Not placed yet'} <small>${pool.length}</small></h3>${lib ? '<p class="hint">Fictional, and marked so on the page.</p>' : ''}${pool.map(s => card(s, '', '', size(s))).join('') || `<p class="hint">${lib || ui.dist || ui.len ? 'Nothing matches.' : approved().length ? 'Every approved story is on a page. Open News library for more.' : 'No approved stories yet.'}</p>`}
  ${waiting() ? `<button class="link" data-act="review">${waiting()} waiting for approval →</button>` : ''}
  <details ${ui.usedOpen ? 'open' : ''} data-details><summary>On the pages <small>${on.length}</small></summary>${on.map(s => `<button class="tcard placed" data-act="find" data-v="${esc(s.id)}"><span><b lang="bn">${esc(s.title)}</b><small>Page ${pagesOf(s.id).join(' → ')}</small></span></button>`).join('')}</details>
  ${used.length ? `<details><summary>Used in earlier issues <small>${used.length}</small></summary>${used.map(s => card(s)).join('')}</details>` : ''}</section>`;
}

function printView() {
  const list = problems(), bad = list.filter(p => p.bad), n = ed().pages.length;
  return `<main class="printing"><aside class="side" data-scroll="side-print"><section class="panel"><h3>${bad.length ? `${bad.length} thing${bad.length > 1 ? 's' : ''} to fix` : 'Ready to print'}${list.length > bad.length ? ` <small>${list.length - bad.length} suggestion${list.length - bad.length > 1 ? 's' : ''}</small>` : ''}</h3>
  ${list.some(p => p.loose) ? '<button class="solid full" data-act="fitall">Fit boxes to stories on every page</button>' : ''}
  ${bad.some(p => p.fix) ? '<button class="solid full" data-act="continueall">Continue all long stories</button>' : ''}
  ${list.length ? `<ul class="probs">${list.map(p => `<li class="${p.bad ? 'bad' : ''}"><span lang="bn">${esc(p.text)}</span><div class="row"><button data-act="jump" data-p="${p.page}" data-v="${esc(p.frame || '')}">Show</button>${p.fix ? `<button data-act="continue" data-v="${esc(p.fix)}">Continue it</button>` : ''}${p.clear ? `<button data-act="clearbox" data-v="${esc(p.clear)}">Free the box</button>` : ''}${p.tidy !== undefined ? `<button data-act="tidy" data-v="${p.tidy}">Close the space</button>` : ''}</div></li>`).join('')}</ul>` : '<p class="hint">Every story is complete and every page is filled.</p>'}
  ${n % 4 ? `<p class="hint">${n} pages. Folded newspaper sheets print four pages each, so a press may ask for ${Math.ceil(n / 4) * 4}.</p>` : ''}</section>
  <section class="panel"><h3>Export</h3><button class="solid full" data-act="print" ${bad.length ? 'disabled' : ''}>Print / Save PDF</button>${bad.length ? '<button class="full" data-act="proof">Print a proof anyway</button>' : ''}<button class="full" data-act="html" ${bad.length ? 'disabled' : ''}>Download web page (HTML)</button>
  <label>Social cards for<select data-k="spage" data-set="spage">${ed().pages.map((p, i) => opt(i, `Page ${i + 1} ${esc(p.name)}`, ui.page)).join('')}</select></label><label>Size<select data-k="social" data-set="social">${Object.keys(FORMATS).map(k => opt(k, k, ui.social)).join('')}</select></label><button class="full" data-act="social">Download social cards</button><p class="hint">Nothing is posted automatically.</p></section>
  <section class="panel"><button class="full" data-act="approveissue" ${bad.length ? 'disabled' : ''}>${ed().status === 'Approved locally' ? '✓ Issue approved' : 'Approve this issue'}</button></section></aside>
  <section class="book" data-scroll="book">${ed().pages.map((_, i) => `<figure><button class="scaler" data-fit="book" data-act="jump" data-p="${i}" data-v="" aria-label="Open page ${i + 1}">${pageHTML(ed(), i, approved(), lay, state.assets)}</button><figcaption>Page ${i + 1} · ${esc(ed().pages[i].name)} · ${pageFill(i)}% full</figcaption></figure>`).join('')}</section></main>`;
}

/** Scale true-size sheets to the space on screen. */
function fitSheets() {
  const [wmm, hmm] = E.trim(ed()), W = wmm * 96 / 25.4, H = hmm * 96 / 25.4;
  app.querySelectorAll('[data-fit]').forEach(n => {
    const box = n.parentElement, room = box.clientWidth - (n.dataset.fit === 'book' ? 0 : 40);
    const z = Math.min(1.3, Math.max(0.12, room / W));
    ui.zoom = z;
    n.style.width = W * z + 'px'; n.style.height = H * z + 'px';
    const s = n.firstElementChild;
    s.style.transform = `scale(${z})`; s.style.transformOrigin = '0 0';
    s.style.setProperty('--iz', 1 / z);
  });
}
new ResizeObserver(() => { if (state) fitSheets(); }).observe(app);

/* ---------- actions ---------- */
const ACT = {
  step: v => { ui.step = v; ui.armed = null; ui.menu = false; render(); scrollTo(0, 0); },
  undo: () => travel(undo, redo), redo: () => travel(redo, undo),
  menu: () => { ui.menu = !ui.menu; render(); if (ui.menu) app.querySelector('.menu button')?.focus(); },
  filter: v => { ui.filter = v; render(); },
  review: () => { ui.step = 'stories'; ui.filter = 'To approve'; render(); },
  write: () => openEditor({ title: '', short: '', kicker: '', deck: '', body: '', byline: '', location: '', section: '', priority: 2, status: 'Draft', media: [] }),
  edit: v => { const s = story(v); if (s) openEditor(E.clone(s)); },
  approve: v => { const s = story(v); if (!s.title.trim() || !bodyOf(s).trim()) { toast('A headline and a report are needed before approval.', true); return; } s.status = 'Approved'; save(); relayout(); render(); toast('Approved. It is waiting in Place stories.'); },
  delete: v => { const s = story(v); ask(`Delete “${s.title}”?`, 'The story and its photographs are removed from this browser. Any page it is on will show an empty box.', 'Delete story', () => { state.stories = state.stories.filter(x => x.id !== v); state.edition = { ...ed(), pages: ed().pages.map(p => ({ ...p, frames: p.frames.map(f => f.storyId === v ? emptied(f) : f) })) }; undo.length = redo.length = 0; save(); relayout(); render(); }); },
  goto: v => { const i = Number(v); if (!ed().pages[i]) return; ui.page = i; ui.sel = null; render(); },
  jump: (v, d) => { ui.page = Number(d.p); ui.sel = v || null; if (!['design', 'place'].includes(ui.step)) ui.step = 'place'; render(); },
  find: v => { const t = E.threads(ed()).get(v)?.[0]; if (t) ACT.jump(t.frame.id, { p: t.page }); },
  pages: v => setPages(ed().pages.length + Number(v)),
  addpage: () => { const n = ed().pages.length + 1; if (n > E.MAX_PAGES) return; ui.page = n - 1; ui.sel = null; commit(E.setPageCount(ed(), n)); toast(`Page ${n} added. Pick its design on the right.`); ui.step = 'design'; render(); },
  template: v => { const t = E.templateById(v, state.templates); const next = E.applyTemplate(page(), t); const lost = page().frames.filter(E.filled).length - next.frames.filter(E.filled).length; commit(withPage(ui.page, next), { keepSel: false }); if (lost > 0) toast(`${lost} item${lost > 1 ? 's' : ''} did not fit this design. Stories are back in the list; Undo brings everything back.`); },
  tidy: v => { const i = v === undefined || v === '' ? ui.page : Number(v); if (!ed().pages[i].frames.some(E.filled)) { toast('This page has nothing on it yet. Place a story first, or delete the page.'); return; } commit(withPage(i, E.tidyPage(ed().pages[i]))); },
  conton: v => continueOnPage(selected().storyId, Number(v)),
  takeempty: () => { const next = E.takeEmpty(page().frames, ui.sel); JSON.stringify(next) === JSON.stringify(page().frames) ? toast('There is no empty space next to this box.') : commit(withFrames(ui.page, next)); },
  fithere: () => fitStoryHere(ui.sel),
  src: v => { ui.src = v; ui.armed = null; render(); }, dist: v => { ui.dist = ui.dist === v ? '' : v; render(); }, len: v => { ui.len = ui.len === v ? '' : v; render(); },
  badge: v => { ui.sel = v; ui.armed = null; render(); app.querySelector('.panel.frame')?.scrollIntoView({ block: 'nearest' }); },
  addlib: () => { const n = adopt(library().map(s => s.id)); save(); relayout(); render(); toast(n ? `${n} practice reports added to your stories.` : 'All of them are already in your stories.'); },
  fit: () => { const before = pageFill(ui.page); commit(fitPage(ed(), ui.page)); const now = pageFill(ui.page); toast(now > before ? `Page ${ui.page + 1} went from ${before}% to ${now}% full.` : 'The boxes already suit these stories. To fill more space add a photograph, an advertisement or another story.'); },
  fitall: () => { let e = ed(); e.pages.forEach((_, i) => { e = fitPage(e, i); }); commit(e); toast('Boxes reshaped to suit the stories on every page.'); },
  gaps: () => commit(withFrames(ui.page, E.closeGaps(page().frames))),
  addbox: () => { const g = E.largestGap(page().frames); if (g) { const f = { id: E.uid(), kind: 'story', ...g }; ui.sel = f.id; commit(withFrames(ui.page, [...page().frames, f])); return; } const big = [...page().frames].sort((a, b) => b.w * b.h - a.w * a.h)[0]; const next = E.splitFrame(page().frames, big.id, big.w >= 6 ? 'cols' : 'rows'); if (next === page().frames) toast('No room for another box.', true); else commit(withFrames(ui.page, next)); },
  split: v => { const next = E.splitFrame(page().frames, ui.sel, v); if (next === page().frames) toast('This box is too small to split that way.', true); else commit(withFrames(ui.page, next)); },
  grow: () => { const all = page().frames, f = { ...selected() }; for (let go = true; go;) { go = false; for (const d of [{ h: 1 }, { w: 1 }, { y: -1, h: 1 }, { x: -1, w: 1 }]) { const t = { ...f, x: f.x + (d.x || 0), y: f.y + (d.y || 0), w: f.w + (d.w || 0), h: f.h + (d.h || 0) }; if (E.fitsOn(t, all, f.id)) { Object.assign(f, t); go = true; } } } commit(withFrames(ui.page, all.map(g => g.id === f.id ? f : g))); },
  delbox: () => { const id = ui.sel; ui.sel = null; commit(withFrames(ui.page, page().frames.filter(f => f.id !== id))); },
  unselect: () => { ui.sel = null; render(); },
  removestory: () => { const f = selected(); commit(withFrames(ui.page, page().frames.map(g => g.id === f.id ? emptied(g) : g))); },
  clearbox: v => commit({ ...ed(), pages: ed().pages.map(p => ({ ...p, frames: p.frames.map(f => f.id === v ? emptied(f) : f) })) }),
  noimage: () => commit(withFrame(ui.sel, { assetId: undefined })),
  dup: () => { if (ed().pages.length >= E.MAX_PAGES) return; const p = E.clone(page()); const copy = { ...p, id: E.uid('p'), masthead: p.masthead === 'full' ? 'strip' : p.masthead, frames: p.frames.map(f => ({ ...emptied(f), id: E.uid() })) }; const pages = [...ed().pages]; pages.splice(ui.page + 1, 0, copy); ui.page++; commit({ ...ed(), pages }, { keepSel: false }); },
  savetpl: () => { const name = `My design ${state.templates.length + 1}`; state.templates = [...state.templates, E.toTemplate(page(), name)]; save(); render(); toast(`Saved as “${name}”. It is at the end of the designs.`); },
  movepage: v => { const pages = [...ed().pages], j = ui.page + Number(v); if (!pages[j]) return; [pages[ui.page], pages[j]] = [pages[j], pages[ui.page]]; ui.page = j; commit({ ...ed(), pages }); },
  clearpage: () => commit(withFrames(ui.page, page().frames.map(emptied))),
  delpage: () => { const go = () => commit({ ...ed(), pages: ed().pages.filter((_, i) => i !== ui.page) }, { keepSel: false }); page().frames.some(E.filled) ? ask(`Delete page ${ui.page + 1}?`, 'Its stories go back to the list. You can undo this.', 'Delete page', go) : go(); },
  continue: v => autoContinue(v), continueall: () => autoContinue(),
  fillpage: () => autoFill(ui.page), fillall: () => autoFill(),
  print: () => run(() => printEdition(ed(), approved(), lay, state.assets, false)),
  proof: () => run(() => printEdition(ed(), approved(), lay, state.assets, true)),
  html: () => run(async () => download(await documentHTML(ed(), approved(), lay, state.assets, { embed: true }), `newspaper-issue-${ed().issue}.html`, 'text/html;charset=utf-8')),
  social: () => run(async () => { const ids = [...new Set(page().frames.map(f => f.storyId).filter(Boolean))].map(story).filter(s => s?.status === 'Approved'); if (!ids.length) throw Error('There is no story on that page.'); for (const s of ids) await socialCard(s, pubOf(ed(), state.publication).name, ui.social); toast(`${ids.length} card${ids.length > 1 ? 's' : ''} downloaded.`); }),
  approveissue: () => { state.edition = { ...ed(), status: 'Approved locally' }; save(); render(); toast('Issue approved in this browser.'); },
  settings: () => openSettings(), newissue: () => openNewIssue(), issues: () => openIssues(),
  backup: () => { download(JSON.stringify(E.makeBackup(state)), 'newsroom-backup.json', 'application/json'); closeMenu(); },
  restore: () => { closeMenu(); const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json'; i.onchange = () => run(async () => { const f = i.files[0]; if (!f) return; if (f.size > 300e6) throw Error('This backup is too large.'); let raw; try { raw = JSON.parse(await f.text()); } catch { throw Error('This is not a Newsroom backup file.'); } const next = E.readBackup(raw); ask('Restore this backup?', `It holds ${next.stories.length} stories and a ${next.edition.pages.length}-page issue. It replaces what is in this browser now.`, 'Restore', () => { state = next; undo.length = redo.length = 0; ui.page = 0; ui.sel = null; save(); relayout(); render(); toast('Backup restored.'); }); }); i.click(); },
  sample: () => { closeMenu(); ask('Load the sample newspaper?', 'Your current issue moves to Earlier issues. Your own stories are kept.', 'Load sample', () => { const s = sampleStories(); state.archive = archived(); state.stories = [...state.stories.filter(x => !s.some(y => y.id === x.id)), ...s]; state.edition = sampleEdition(state.publication); undo.length = redo.length = 0; ui.page = 0; ui.sel = null; ui.step = 'place'; save(); relayout(); render(); }); }
};
function closeMenu() { ui.menu = false; render(); }
const archived = () => E.threads(ed()).size && !Object.keys(lay.report).every(id => story(id)?.demo) ? [...state.archive, { ...ed(), id: ed().id || E.uid('e') }] : state.archive;
async function run(fn) { try { await fn(); } catch (e) { toast(e.message || 'Something went wrong.', true); } }
function setPages(n) {
  n = E.clamp(Math.round(Number(n)) || ed().pages.length, 1, E.MAX_PAGES);
  const lost = E.pagesLost(ed(), n);
  const go = () => commit(E.setPageCount(ed(), n), { keepSel: false });
  if (lost.length) { ask(`Reduce to ${n} page${n > 1 ? 's' : ''}?`, `${lost.length} page${lost.length > 1 ? 's' : ''} at the end still hold something. Their stories go back to the list, and you can undo this.`, 'Reduce pages', go); render(); } else go();
}

app.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (b && !b.disabled) {
    const wasMenu = ui.menu;
    if (wasMenu && b.dataset.act !== 'menu' && b.closest('.menu')) ui.menu = false;
    ACT[b.dataset.act]?.(b.dataset.v, b.dataset);
    return;
  }
  if (ui.menu && !ev.target.closest('.menu')) closeMenu();
});
app.addEventListener('toggle', ev => { if (ev.target.matches?.('[data-details]')) ui.usedOpen = ev.target.open; }, true);
app.addEventListener('change', ev => {
  const t = ev.target, k = t.dataset.set;
  if (!k) return;
  const v = t.type === 'checkbox' ? t.checked : t.value;
  if (k === 'q') { ui.q = v; render(); } else if (k === 'pagecount') setPages(v);
  else if (k === 'social') ui.social = v;
  else if (k === 'spage') { ui.page = Number(v); render(); }
  else if (k.startsWith('page.')) commit(withPage(ui.page, { [k.slice(5)]: v }));
  else if (k === 'frame.image') run(async () => { const m = await readMedia(t.files[0]); if (!m.type.startsWith('image/')) throw Error('Choose a picture.'); const id = E.uid('a'); state.assets = { ...state.assets, [id]: { url: m.url } }; commit(withFrame(ui.sel, { assetId: id })); });
  else if (k === 'frame.kind') { const f = selected(); commit(withFrames(ui.page, page().frames.map(g => g.id === f.id ? { ...emptied(g), kind: v } : g))); }
  else if (k.startsWith('frame.')) { const key = k.slice(6); if (key === 'quote') { commit(withFrame(ui.sel, { quote: v === '' ? undefined : v === 'true' })); return; } commit(withFrame(ui.sel, { [key]: v === '' || v === false ? undefined : ['cols', 'photoCount'].includes(key) ? Number(v) : v })); }
});
app.addEventListener('input', ev => { if (ev.target.dataset.set === 'q') { ui.q = ev.target.value; const at = ev.target.selectionStart; render(); const i = app.querySelector('[data-set=q]'); i?.setSelectionRange(at, at); } });

document.addEventListener('keydown', ev => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
  if (ev.key === 'Escape') { if (modalRoot.innerHTML) { if (!modalRoot.querySelector('[data-guard]')) closeModal(); } else if (ui.menu) closeMenu(); else if (ui.armed || ui.sel) { ui.armed = ui.sel = null; render(); } return; }
  if (modalRoot.innerHTML || typing || !state) return;
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? ACT.redo() : ACT.undo(); return; }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') { ev.preventDefault(); ACT.redo(); return; }
  const box = ev.target.closest?.('[data-box]');
  if (box && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); clickBox(box.dataset.box); return; }
  const f = selected();
  if (!f) { if (ev.target.dataset?.drag && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); arm(ev.target.dataset.drag); } return; }
  if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); ui.step === 'design' ? ACT.delbox() : ACT.removestory(); return; }
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
  if (d && ui.step === 'design') {
    ev.preventDefault();
    commit(withFrames(ui.page, ev.shiftKey ? E.resizeFrame(page().frames, f.id, { x: f.x, y: f.y, w: f.w + d[0], h: f.h + d[1] }) : E.moveFrame(page().frames, f.id, f.x + d[0], f.y + d[1])));
  }
});
function arm(id) { ui.armed = ui.armed === id ? null : id; ui.sel = null; render(); }
function clickBox(id) { if (ui.armed && ui.step === 'place') placeStory(ui.armed, id); else { ui.sel = ui.sel === id ? null : id; render(); } }

/* ---------- dragging (mouse, pen and touch) ---------- */
let drag = null;
app.addEventListener('pointerdown', ev => {
  if (ev.button > 0 || ev.target.closest('button.badge')) return;
  const card = ev.target.closest('[data-drag]'), box = ev.target.closest('[data-box]'), body = ev.target.closest('.canvas .np-body');
  if (card) drag = { type: 'story', id: card.dataset.drag };
  else if (ev.target.dataset.handle) drag = { type: 'resize', h: ev.target.dataset.handle, f: { ...selected() } };
  else if (ui.step === 'design' && box) drag = { type: 'move', id: box.dataset.box, f: { ...page().frames.find(f => f.id === box.dataset.box) } };
  else if (ui.step === 'design' && body) drag = { type: 'draw' };
  else if (ui.step === 'place' && box) { const f = page().frames.find(x => x.id === box.dataset.box); drag = f.storyId && f.kind === 'story' ? { type: 'story', id: f.storyId, from: f.id, box: f.id } : { type: 'tap', box: f.id }; }
  else return;
  Object.assign(drag, { x: ev.clientX, y: ev.clientY, on: false, pid: ev.pointerId });
  if (drag.type === 'resize' || drag.type === 'draw') ev.preventDefault();
});
const units = () => { const r = app.querySelector('.canvas .np-body').getBoundingClientRect(); return { r, ux: r.width / COLS, uy: r.height / ROWS }; };
function showFrames(frames) { app.querySelectorAll('.canvas [data-frame]').forEach(n => { n.style.visibility = frames.some(f => f.id === n.dataset.frame) ? '' : 'hidden'; }); for (const f of frames) { const n = app.querySelector(`.canvas [data-frame="${CSS.escape(f.id)}"]`); if (!n) continue; n.style.cssText += `;left:${f.x / COLS * 100}%;top:${f.y / ROWS * 100}%;width:${f.w / COLS * 100}%;height:${f.h / ROWS * 100}%`; } }
window.addEventListener('pointermove', ev => {
  if (!drag || ev.pointerId !== drag.pid) return;
  if (!drag.on) {
    if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 5) return;
    if (drag.type === 'tap') return;
    drag.on = true;
    document.body.classList.add('dragging');
    if (drag.type === 'story') {
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'ghost-card';
      drag.ghost.textContent = story(drag.id)?.title || '';
      document.body.append(drag.ghost);
    }
  }
  ev.preventDefault();
  if (drag.type === 'story') {
    drag.ghost.style.transform = `translate(${ev.clientX + 12}px,${ev.clientY + 12}px)`;
    const under = document.elementFromPoint(ev.clientX, ev.clientY), box = under?.closest('.canvas [data-box]'), thumb = under?.closest('[data-thumb]');
    app.querySelectorAll('.hover').forEach(n => n.classList.remove('hover'));
    (box || thumb)?.classList.add('hover');
    const th = thumb ? Number(thumb.dataset.thumb) : null;
    if (th !== drag.thumb) {                                  // rest on a page to open it
      clearTimeout(drag.timer); drag.thumb = th;
      if (th !== null && th !== ui.page) drag.timer = setTimeout(() => { if (drag) { ui.page = th; ui.sel = null; render(); } }, 650);
    }
    const c = app.querySelector('.canvas'), cr = c.getBoundingClientRect();
    if (ev.clientX > cr.left && ev.clientX < cr.right) { if (ev.clientY > cr.bottom - 40) c.scrollTop += 18; else if (ev.clientY < cr.top + 40) c.scrollTop -= 18; }
    return;
  }
  const { r, ux, uy } = units(), dx = Math.round((ev.clientX - drag.x) / ux), dy = Math.round((ev.clientY - drag.y) / uy);
  if (drag.type === 'resize') {
    const f = { ...drag.f };
    if (drag.h.includes('e')) f.w += dx;
    if (drag.h.includes('s')) f.h += dy;
    if (drag.h.includes('w')) { f.x += dx; f.w -= dx; }
    if (drag.h.includes('n')) { f.y += dy; f.h -= dy; }
    const next = E.resizeFrame(page().frames, f.id, { x: f.x, y: f.y, w: f.w, h: f.h }, ui.step === 'place');
    if (next !== page().frames || (!dx && !dy)) { drag.next = next; showFrames(next); }
  } else if (drag.type === 'move') {
    const n = app.querySelector(`.canvas [data-frame="${CSS.escape(drag.id)}"]`);
    n.style.transform = `translate(${(ev.clientX - drag.x) / ui.zoom}px,${(ev.clientY - drag.y) / ui.zoom}px)`;
    n.style.zIndex = 9; n.style.opacity = 0.8;
    const cx = Math.floor((ev.clientX - r.left) / ux), cy = Math.floor((ev.clientY - r.top) / uy);
    const over = page().frames.find(f => f.id !== drag.id && cx >= f.x && cx < f.x + f.w && cy >= f.y && cy < f.y + f.h);
    app.querySelectorAll('.hover').forEach(x => x.classList.remove('hover'));
    if (over) app.querySelector(`.canvas [data-box="${CSS.escape(over.id)}"]`)?.classList.add('hover');
    drag.next = E.moveFrame(page().frames, drag.id, drag.f.x + dx, drag.f.y + dy, over?.id);
    drag.over = over;
  } else if (drag.type === 'draw') {
    const gx = v => E.clamp((v - r.left) / ux, 0, COLS), gy = v => E.clamp((v - r.top) / uy, 0, ROWS);
    const x0 = Math.floor(Math.min(gx(drag.x), gx(ev.clientX))), y0 = Math.floor(Math.min(gy(drag.y), gy(ev.clientY)));
    const x1 = Math.ceil(Math.max(gx(drag.x), gx(ev.clientX))), y1 = Math.ceil(Math.max(gy(drag.y), gy(ev.clientY)));
    drag.rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    drag.ok = E.fitsOn(drag.rect, page().frames);
    if (!drag.mark) { drag.mark = document.createElement('div'); app.querySelector('.canvas .np-body').append(drag.mark); }
    drag.mark.className = 'draw' + (drag.ok ? '' : ' no');
    drag.mark.style.cssText = `left:${x0 / COLS * 100}%;top:${y0 / ROWS * 100}%;width:${(x1 - x0) / COLS * 100}%;height:${(y1 - y0) / ROWS * 100}%`;
  }
}, { passive: false });
function endDrag(ev, cancelled) {
  if (!drag || ev.pointerId !== drag.pid) return;
  const d = drag;
  drag = null;
  clearTimeout(d.timer); d.ghost?.remove(); d.mark?.remove();
  document.body.classList.remove('dragging');
  if (cancelled) { render(); return; }
  if (!d.on) {
    if (d.type === 'story' && !d.box) arm(d.id);
    else if (d.box || d.type === 'move') clickBox(d.box || d.id);
    else if (d.type === 'draw' && ui.sel) { ui.sel = null; render(); }
    return;
  }
  // a click that ends a drag must not also press what is under it
  const eat = e => { e.stopPropagation(); e.preventDefault(); };
  window.addEventListener('click', eat, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', eat, { capture: true }), 40);
  if (d.type === 'story') {
    const under = document.elementFromPoint(ev.clientX, ev.clientY), box = under?.closest('.canvas [data-box]'), thumb = under?.closest('[data-thumb]');
    if (box) placeStory(d.id, box.dataset.box, d.from);
    else if (thumb && !d.from) dropOnPage(d.id, Number(thumb.dataset.thumb));
    else if (thumb) { const e = ed().pages[Number(thumb.dataset.thumb)].frames.find(f => f.kind === 'story' && !E.filled(f)); e ? placeStory(d.id, e.id, d.from) : toast('That page has no empty box.', true); render(); }
    else if (d.from && under?.closest('.tray')) commit({ ...ed(), pages: ed().pages.map(p => ({ ...p, frames: p.frames.map(f => f.id === d.from ? emptied(f) : f) })) });
    else render();
  } else if (d.type === 'draw') {
    if (d.ok) { const f = { id: E.uid(), kind: 'story', ...d.rect }; ui.sel = f.id; commit(withFrames(ui.page, [...page().frames, f])); } else { toast('A box needs at least 2 × 2 squares of white space.', true); render(); }
  } else {
    ui.sel = d.type === 'move' ? d.id : ui.sel;
    if (d.next && d.next !== page().frames) commit(withFrames(ui.page, d.next)); else render();
  }
}
window.addEventListener('pointerup', ev => endDrag(ev));
window.addEventListener('pointercancel', ev => endDrag(ev, true));

/* ---------- dialogs ---------- */
let lastFocus = null;
function openModal(html, guard) {
  lastFocus = document.activeElement;
  modalRoot.innerHTML = `<div class="veil"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title" ${guard ? 'data-guard' : ''}>${html}</section></div>`;
  (modalRoot.querySelector('[autofocus]') || modalRoot.querySelector('input,textarea,button'))?.focus();
}
function closeModal() { modalRoot.innerHTML = ''; editing = null; lastFocus?.isConnected && lastFocus.focus(); }
let onYes = null;
function ask(title, text, yes, fn) { onYes = fn; openModal(`<h2 id="m-title" lang="bn">${esc(title)}</h2><p>${esc(text)}</p><div class="row end"><button data-m="close">Cancel</button><button class="solid" data-m="yes" autofocus>${esc(yes)}</button></div>`); }

const SECTIONS = ['প্রথম পাতা', 'রাজ্য', 'জেলা', 'দেশ', 'বিদেশ', 'খেলা', 'বিনোদন', 'শিক্ষা', 'স্বাস্থ্য', 'বিজ্ঞান', 'অর্থনীতি', 'সম্পাদকীয়'];
function openEditor(s) {
  editing = s;
  const field = (k, label, ph = '', extra = '') => `<label>${label}<input data-e="${k}" value="${esc(s[k])}" placeholder="${esc(ph)}" lang="bn" ${extra}></label>`;
  openModal(`<div class="phead"><h2 id="m-title">${s.id ? 'Edit story' : 'New story'} <small lang="bn">প্রতিবেদন</small></h2><button data-m="closeeditor" class="ghost" aria-label="Close">✕</button></div>
  ${field('title', 'Headline শিরোনাম *', 'যেমন: উত্তরপাড়ায় নতুন পাঠাগার', 'autofocus')}
  <label>Report প্রতিবেদন *<textarea data-e="body" rows="11" lang="bn" placeholder="কী ঘটেছে, কোথায় ও কখন, কারা জড়িত — সহজ ভাষায় লিখুন। নতুন অনুচ্ছেদের জন্য Enter দিন।">${esc(bodyOf(s))}</textarea><small class="wc"></small></label>
  <div class="grid2">${field('byline', 'Reporter প্রতিবেদক', 'নিজস্ব সংবাদদাতা')}${field('location', 'Place স্থান')}<label>Importance<select data-e="priority">${[[1, 'Lead — biggest'], [2, 'Normal'], [3, 'Brief']].map(([v, t]) => opt(v, t, s.priority || 2)).join('')}</select></label><label>Section বিভাগ<select data-e="section"><option value="">—</option>${SECTIONS.map(x => opt(x, x, s.section)).join('')}</select></label></div>
  <details ${s.kicker || s.deck || s.short ? 'open' : ''}><summary>More headline options</summary>${field('kicker', 'Line above the headline')}${field('deck', 'Line below the headline')}${field('short', 'Short headline for the continued part', 'যেমন: নতুন পাঠাগার')}</details>
  <label class="drop">＋ Add photographs, audio or video<input type="file" multiple accept="image/jpeg,image/png,image/webp,audio/*,video/mp4" data-e-files></label><div data-media></div>
  <p class="err" role="alert"></p><div class="row end"><button data-m="Draft">Save draft</button><button data-m="In Review">Send for approval</button><button class="solid" data-m="Approved">Save &amp; approve</button></div>`, true);
  drawMedia(); countWords();
}
function countWords() { const w = modalRoot.querySelector('.wc'); if (w) { const n = words(editing.body ?? bodyOf(editing)); w.textContent = `${n} words · ${lengthLabel({ body: editing.body ?? bodyOf(editing) })}${n >= 260 ? ' — may continue on another page' : ''}`; } }
function drawMedia() {
  const n = modalRoot.querySelector('[data-media]');
  if (!n) return;
  n.innerHTML = (editing.media || []).map((m, i) => `<div class="att">${m.type.startsWith('image/') ? `<img alt="" src="${esc(m.url)}">` : `<span>${esc(m.name)}</span>`}<input aria-label="Caption" placeholder="Caption" data-cap="${i}" value="${esc(m.caption)}" lang="bn"><input aria-label="Photo credit" placeholder="Credit" data-cred="${i}" value="${esc(m.credit)}" lang="bn"><button class="ghost" data-m="rm" data-i="${i}" aria-label="Remove">✕</button></div>`).join('') + (editing.media?.length ? `<label class="check"><input type="checkbox" data-consent ${editing.consent ? 'checked' : ''}> I have permission to use these files. <span lang="bn">এই media ব্যবহারের অনুমতি আমার আছে।</span></label>` : '');
}
function saveStory(status) {
  const err = t => { modalRoot.querySelector('.err').textContent = t; };
  if (!editing.title.trim()) return err('Write a headline first. শিরোনাম লিখুন।');
  if (status !== 'Draft' && !bodyOf(editing).trim()) return err('Write the report first. প্রতিবেদন লিখুন।');
  if (status !== 'Draft' && editing.media?.length && !editing.consent && !editing.demo) return err('Please confirm you may use these files.');
  const { ...s } = editing;
  s.id = s.id || E.uid('s'); s.status = status; s.priority = Number(s.priority) || 2;
  const i = state.stories.findIndex(x => x.id === s.id);
  state.stories = i < 0 ? [s, ...state.stories] : state.stories.map(x => x.id === s.id ? s : x);
  closeModal(); save(); relayout(); render();
  toast(status === 'Approved' ? 'Story approved. Put it on a page in Place stories.' : status === 'In Review' ? 'Sent for approval.' : 'Draft saved.');
}

function openSettings() {
  closeMenu();
  const e = ed(), p = pubOf(e, state.publication), inp = (k, l, v, x = '') => `<label>${l}<input data-s="${k}" value="${esc(v)}" ${x}></label>`;
  openModal(`<div class="phead"><h2 id="m-title">Paper &amp; masthead</h2><button data-m="close" class="ghost" aria-label="Close">✕</button></div><h3>This issue</h3><div class="grid2">${inp('title', 'Issue title', e.title)}${inp('editionDate', 'Publication date', /^\d{4}-/.test(e.editionDate) ? e.editionDate : E.todayISO(), 'type="date"')}${inp('issue', 'Issue number', e.issue)}${inp('volume', 'Volume', e.volume || p.volume)}<label>Paper size<select data-s="size">${[...Object.keys(E.SIZES), 'Custom'].map(k => opt(k, k === 'Custom' ? 'Custom…' : `${k} (${E.SIZES[k].join(' × ')} mm)`, e.size)).join('')}</select></label><label>Body text<select data-s="fontSize">${[8, 9, 10, 11, 12, 13, 14].map(n => opt(n, n + ' pt', e.fontSize || 10)).join('')}</select></label>${inp('widthMm', 'Custom width (mm)', e.widthMm || 280, 'type="number" min="100" max="600"')}${inp('heightMm', 'Custom height (mm)', e.heightMm || 430, 'type="number" min="100" max="900"')}</div>
  ${[['autofit', 'Fit headlines, photographs and text to fill each box', e.autofit !== false], ['rules', 'Lines between stories', e.rules !== false], ['showFrequency', 'Show “Weekly” in the masthead', e.showFrequency !== false], ['bw', 'Black and white', e.bw]].map(([k, t, on]) => `<label class="check"><input type="checkbox" data-s="${k}" ${on ? 'checked' : ''}> ${t}</label>`).join('')}
  <details><summary>Masthead (same for every issue)</summary><div class="grid2">${[['name', 'Newspaper name'], ['englishName', 'English name'], ['tagline', 'Tagline'], ['registration', 'Registration number'], ['frequency', 'Frequency'], ['price', 'Price'], ['footer', 'Footer'], ['accent', 'Brand colour']].map(([k, l]) => inp('p.' + k, l, p[k], k === 'accent' ? 'type="color"' : '')).join('')}</div></details><p class="err" role="alert"></p><div class="row end"><button data-m="close">Cancel</button><button class="solid" data-m="savesettings">Save</button></div>`);
}
function saveSettings() {
  const e = { ...ed() }, p = { ...pubOf(e, state.publication) };
  modalRoot.querySelectorAll('[data-s]').forEach(n => { const k = n.dataset.s, v = n.type === 'checkbox' ? n.checked : n.value; if (k.startsWith('p.')) p[k.slice(2)] = v; else e[k] = ['fontSize', 'widthMm', 'heightMm'].includes(k) ? Number(v) : v; });
  if (!p.name.trim() || !p.registration.trim()) { modalRoot.querySelector('.err').textContent = 'The newspaper name and registration number are required.'; return; }
  state.publication = p; e.publication = p;
  closeModal(); commit(e);
}
function openNewIssue() {
  closeMenu();
  openModal(`<h2 id="m-title">New issue</h2><p>The masthead stays. This issue is kept in Earlier issues.</p><label>How many pages?<input type="number" min="1" max="${E.MAX_PAGES}" value="8" data-n="pages" autofocus></label><div class="chips">${[1, 2, 3, 4, 6, 8, 12, 16].map(n => `<button data-m="setn" data-i="${n}">${n}</button>`).join('')}</div>
  <label>Start with<select data-n="design"><option value="mix">A ready design on every page</option><option value="same">The same designs as this issue</option><option value="blank">Blank pages — I will design them</option></select></label><label>Paper size<select data-n="size">${Object.keys(E.SIZES).map(k => opt(k, k, ed().size)).join('')}${ed().size === 'Custom' ? opt('Custom', 'Custom', 'Custom') : ''}</select></label><div class="row end"><button data-m="close">Cancel</button><button class="solid" data-m="newissue">Start designing</button></div>`);
}
function newIssue() {
  const v = k => modalRoot.querySelector(`[data-n=${k}]`).value, n = E.clamp(Math.round(Number(v('pages'))) || 8, 1, E.MAX_PAGES), how = v('design'), old = ed();
  const mine = old.pages.map(p => ({ ...p, id: E.uid('p'), frames: p.frames.map(f => ({ ...emptied(f), id: E.uid() })) }));
  const num = x => String((Number(x) || 0) + 1);
  state.archive = archived();
  state.edition = { ...old, id: undefined, issue: num(old.issue), editionDate: E.todayISO(), status: 'Draft', size: v('size'), pages: how === 'mix' ? E.planPages(n) : how === 'blank' ? E.planPages(n, 'blank') : E.setPageCount({ pages: mine.slice(0, n) }, n).pages };
  undo.length = redo.length = 0;
  Object.assign(ui, { page: 0, sel: null, step: 'design', armed: null });
  closeModal(); save(); relayout(); render();
  toast(`${n} page${n > 1 ? 's' : ''} ready. Design each one, then place your stories.`);
}
function openIssues() {
  closeMenu();
  openModal(`<div class="phead"><h2 id="m-title">Earlier issues</h2><button data-m="close" class="ghost" aria-label="Close">✕</button></div>${state.archive.length ? `<ul class="probs">${state.archive.map((a, i) => `<li><b>${esc(a.title)} · Issue ${esc(a.issue)}</b><small>${esc(E.dateLabel(a.editionDate))} · ${a.pages.length} pages</small><div class="row"><button data-m="openissue" data-i="${i}">Open</button></div></li>`).reverse().join('')}</ul>` : '<p>None yet. When you start a new issue, this one is kept here.</p>'}`);
}

modalRoot.addEventListener('click', ev => {
  const b = ev.target.closest('[data-m]');
  if (!b) return;
  const m = b.dataset.m, i = Number(b.dataset.i);
  if (m === 'close' || m === 'closeeditor') {
    if (m === 'closeeditor' && editing?.dirty && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Discard changes?'; return; }
    closeModal();
  } else if (m === 'yes') { const fn = onYes; closeModal(); fn(); }
  else if (['Draft', 'In Review', 'Approved'].includes(m)) { delete editing.dirty; saveStory(m); }
  else if (m === 'rm') { editing.media.splice(i, 1); editing.dirty = 1; drawMedia(); }
  else if (m === 'savesettings') saveSettings();
  else if (m === 'setn') modalRoot.querySelector('[data-n=pages]').value = i;
  else if (m === 'newissue') newIssue();
  else if (m === 'openissue') { const a = state.archive[i]; const rest = state.archive.filter((_, k) => k !== i); state.archive = rest; state.archive = archived(); state.edition = a; undo.length = redo.length = 0; Object.assign(ui, { page: 0, sel: null, step: 'place' }); closeModal(); save(); relayout(); render(); }
});
modalRoot.addEventListener('input', ev => {
  const t = ev.target;
  if (!editing) return;
  if (t.dataset.e) editing[t.dataset.e] = t.value;
  else if (t.dataset.cap) editing.media[t.dataset.cap].caption = t.value;
  else if (t.dataset.cred) editing.media[t.dataset.cred].credit = t.value;
  else if ('consent' in t.dataset) { editing.consent = t.checked; return; } else return;
  editing.dirty = 1;
  countWords();
});
modalRoot.addEventListener('change', async ev => {
  if (!('eFiles' in ev.target.dataset)) return;
  const err = modalRoot.querySelector('.err');
  err.textContent = '';
  const s = editing;
  try {
    for (const f of Array.from(ev.target.files)) {
      if ((s.media || []).length >= 6) throw Error('Up to six files per story.');
      const m = await readMedia(f);
      s.media = [...(s.media || []), { id: E.uid('m'), name: f.name, caption: '', credit: s.byline || '', ...m }];
      s.dirty = 1;
    }
  } catch (e) { err.textContent = e.message; }
  if (editing === s) drawMedia();
  ev.target.value = '';
});
window.addEventListener('beforeunload', ev => { if (editing?.dirty) ev.preventDefault(); });

boot();
