/**
 * Newsroom খবরঘর — page model. Pure functions, no DOM, so `node --test` can run them.
 *
 * A page body is a 12 x 24 grid. Everything printed on it is a "frame" {id,kind,x,y,w,h}.
 * A story is placed by putting its id on a frame. Put the same id on a second frame and the
 * text continues there: the chain is always in reading order (page, then top, then left), so a
 * "continued on page N" line can never point backwards.
 */
export const COLS = 12;
export const ROWS = 24;
export const MIN_W = 2;
export const MIN_H = 2;
export const MAX_PAGES = 64;

let seq = 0;
export const uid = (p = 'f') => p + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
export const clone = v => JSON.parse(JSON.stringify(v));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function todayISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
export function dateLabel(value) {
  const s = String(value || todayISO());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const PUBLICATION = {
  name: 'ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া', englishName: 'DIGITAL INDIAN GOLDEN INDIA',
  tagline: 'সত্যনিষ্ঠ সংবাদে সঠিক দর্শন', registration: 'WBBEN/2021/89805', frequency: 'Weekly',
  price: 'Rs. 5.00', volume: '5', date: '', footer: '', accent: '#0878aa'
};

export const SIZES = { A4: [210, 297], A3: [297, 420], Tabloid: [280, 430], Broadsheet: [380, 560] };
export function trim(e) {
  if (e.size === 'Custom') return [clamp(Number(e.widthMm) || 280, 100, 600), clamp(Number(e.heightMm) || 430, 100, 900)];
  return SIZES[e.size] || SIZES.A4;
}

/* ---------- geometry ---------- */
export const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const inBounds = f => f.x >= 0 && f.y >= 0 && f.w >= MIN_W && f.h >= MIN_H && f.x + f.w <= COLS && f.y + f.h <= ROWS;
export const fitsOn = (rect, frames, skip) => inBounds(rect) && !frames.some(f => f.id !== skip && overlaps(rect, f));
export const validFrames = frames => frames.every((f, i) => inBounds(f) && !frames.some((g, j) => j > i && overlaps(f, g)));
export const coverage = frames => frames.reduce((n, f) => n + f.w * f.h, 0) / (COLS * ROWS);

/** Largest empty rectangle on the page, or null. */
export function largestGap(frames, minW = MIN_W, minH = MIN_H) {
  const used = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (const f of frames) for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) if (used[y]) used[y][x] = 1;
  const heights = Array(COLS).fill(0);
  let best = null;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) heights[x] = used[y][x] ? 0 : heights[x] + 1;
    for (let x = 0; x < COLS; x++) {
      let h = Infinity;
      for (let x2 = x; x2 < COLS && heights[x2]; x2++) {
        h = Math.min(h, heights[x2]);
        const w = x2 - x + 1;
        if (w >= minW && h >= minH && (!best || w * h > best.w * best.h)) best = { x, y: y - h + 1, w, h };
      }
    }
  }
  return best;
}

/** Grow frames, one step at a time, until nothing can grow: no white holes left. */
export function closeGaps(frames) {
  const out = frames.map(f => ({ ...f }));
  for (let moved = true; moved;) {
    moved = false;
    const order = [...out].sort((a, b) => a.w * a.h - b.w * b.h);
    for (const f of order) {
      for (const d of [{ h: 1 }, { w: 1 }, { y: -1, h: 1 }, { x: -1, w: 1 }]) {
        const t = { ...f, x: f.x + (d.x || 0), y: f.y + (d.y || 0), w: f.w + (d.w || 0), h: f.h + (d.h || 0) };
        if (fitsOn(t, out, f.id)) { Object.assign(f, t); moved = true; break; }
      }
    }
  }
  return out;
}

export function splitFrame(frames, id, dir) {
  const f = frames.find(x => x.id === id);
  if (!f) return frames;
  const key = dir === 'cols' ? 'w' : 'h', pos = dir === 'cols' ? 'x' : 'y', min = dir === 'cols' ? MIN_W : MIN_H;
  if (f[key] < min * 2) return frames;
  const a = Math.ceil(f[key] / 2);
  const first = { ...f, [key]: a };
  const second = { id: uid(), kind: 'story', x: f.x, y: f.y, w: f.w, h: f.h, [key]: f[key] - a, [pos]: f[pos] + a };
  return frames.flatMap(x => x.id === id ? [first, second] : [x]);
}

/**
 * Drag an edge. Boxes touching that edge give way or follow, like a window splitter, so resizing one
 * box does not leave a hole beside it. With eat, empty boxes in the way are swallowed. Returns the old frames if the result would overlap.
 */
export function resizeFrame(frames, id, rect, eat = false) {
  const f = frames.find(x => x.id === id);
  if (!f || !inBounds(rect)) return frames;
  const next = { ...f, ...rect };
  const spansY = g => g.y < f.y + f.h && f.y < g.y + g.h;
  const spansX = g => g.x < f.x + f.w && f.x < g.x + g.w;
  const pushed = frames.map(g => {
    if (g.id === id) return next;
    let o = { ...g };
    if (g.x === f.x + f.w && spansY(g)) o = { ...o, x: next.x + next.w, w: g.x + g.w - (next.x + next.w) };
    else if (g.x + g.w === f.x && spansY(g)) o = { ...o, w: next.x - g.x };
    else if (g.y === f.y + f.h && spansX(g)) o = { ...o, y: next.y + next.h, h: g.y + g.h - (next.y + next.h) };
    else if (g.y + g.h === f.y && spansX(g)) o = { ...o, h: next.y - g.y };
    return o;
  });
  const pushOK = validFrames(pushed);
  if (pushOK && coverage(pushed) >= coverage(frames)) return pushed;
  let lined = frames;                                  // boxes that share one long edge move together
  for (const [axis, from, to] of [['y', f.y + f.h, next.y + next.h], ['y', f.y, next.y], ['x', f.x + f.w, next.x + next.w], ['x', f.x, next.x]]) {
    if (from !== to && lined) lined = moveLine(lined, id, axis, from, to - from);
  }
  if (lined && lined !== frames) return lined;
  if (pushOK) return pushed;
  const alone = frames.map(g => g.id === id ? next : g);
  if (validFrames(alone)) return alone;
  if (!eat) return frames;
  const eaten = frames.flatMap(g => {                   // empty boxes in the way shrink or disappear
    if (g.id === id) return [next];
    if (filled(g) || !overlaps(g, next)) return [g];
    const parts = [{ ...g, h: next.y - g.y }, { ...g, y: next.y + next.h, h: g.y + g.h - next.y - next.h }, { ...g, w: next.x - g.x }, { ...g, x: next.x + next.w, w: g.x + g.w - next.x - next.w }].filter(inBounds);
    return parts.sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 1);
  });
  return validFrames(eaten) ? eaten : frames;
}

/** Give one box every empty box and gap it can reach. */
export function takeEmpty(frames, id) {
  const out = frames.filter(f => f.id === id || filled(f)), f = { ...out.find(g => g.id === id) };
  for (let go = true; go;) {
    go = false;
    for (const s of [{ h: 1 }, { w: 1 }, { y: -1, h: 1 }, { x: -1, w: 1 }]) {
      const t = { ...f, x: f.x + (s.x || 0), y: f.y + (s.y || 0), w: f.w + (s.w || 0), h: f.h + (s.h || 0) };
      if (fitsOn(t, out, id)) { Object.assign(f, t); go = true; }
    }
  }
  return frames.flatMap(g => g.id === id ? [f] : filled(g) || !overlaps(g, f) ? [g] : []);
}

/** Move a whole shared edge (all boxes meeting along it) by delta. Null if that cannot be done. */
export function moveLine(frames, seedId, axis, pos, delta) {
  const len = axis === 'y' ? 'h' : 'w', o = axis === 'y' ? 'x' : 'y', ol = axis === 'y' ? 'w' : 'h', max = axis === 'y' ? ROWS : COLS;
  if (pos <= 0 || pos >= max) return null;
  const touching = frames.filter(g => g[axis] === pos || g[axis] + g[len] === pos);
  const group = new Set([seedId]);
  for (let grew = true; grew;) {
    grew = false;
    for (const g of touching) {
      if (group.has(g.id)) continue;
      const meets = touching.some(k => group.has(k.id) && (k[axis] === pos) !== (g[axis] === pos) && k[o] < g[o] + g[ol] && g[o] < k[o] + k[ol]);
      if (meets) { group.add(g.id); grew = true; }
    }
  }
  const out = frames.map(g => !group.has(g.id) ? g : g[axis] === pos ? { ...g, [axis]: pos + delta, [len]: g[len] - delta } : { ...g, [len]: g[len] + delta });
  return validFrames(out) ? out : null;
}

/**
 * Reshape the boxes on a page so each one suits what is in it: long stories get more room, short ones less.
 * info[frameId] = {words, photo, more} where more means the text runs on to another box.
 */
export function balanceFrames(e, frames, info) {
  const [pw, ph] = trim(e), ux = (pw - 18) / COLS, uy = (ph - 45) / ROWS, k = 0.58 * (e.fontSize || 10) ** 2;
  const one = f => {
    const a = f.w * f.h, i = info[f.id];
    if (f.kind === 'band') return f.h > 2 ? (f.h - 2) * 4 : 0;
    if (f.kind !== 'story') return (a > 72 ? (a - 72) / 16 : a < 12 ? (12 - a) / 2 : 0) * (f.kind === 'photo' ? 0.3 : 1);
    if (!f.storyId || !i) return a / 10;
    const room = f.w * ux * (f.h * uy - 24), narrow = f.w < 3 ? 25 : 0, flat = f.h < 4 ? 8 : 0;
    if (room <= 0) return 400;
    const r = i.words * k / room, hi = i.photo ? 0.74 : 0.96, lo = i.photo ? 0.36 : 0.66;
    const c = r > hi ? (i.more ? 0 : (r / hi - 1) * 70) : r < lo ? (1 - r / lo) ** 2 * a * 1.6 : 0;
    return c + narrow + flat;
  };
  const cost = list => list.reduce((n, f) => n + one(f), 0);
  let best = frames, bestCost = cost(frames);
  for (let step = 0; step < 60; step++) {
    let pick = null, pickCost = bestCost - 0.05;
    for (const f of best) for (const d of [-2, -1, 1, 2]) for (const [axis, pos] of [['y', f.y + f.h], ['x', f.x + f.w]]) {
      const rect = axis === 'y' ? { x: f.x, y: f.y, w: f.w, h: f.h + d } : { x: f.x, y: f.y, w: f.w + d, h: f.h };
      for (const t of [resizeFrame(best, f.id, rect), moveLine(best, f.id, axis, pos, d)]) {
        if (!t || t === best || coverage(t) < coverage(best)) continue;
        const c = cost(t);
        if (c < pickCost) { pick = t; pickCost = c; }
      }
    }
    if (!pick) break;
    best = pick; bestCost = pickCost;
  }
  return best;
}

/** Drop a box on another box: they swap places. Drop it on free space: it moves there. */
export function moveFrame(frames, id, x, y, overId) {
  const f = frames.find(g => g.id === id);
  if (!f) return frames;
  const o = overId && overId !== id && frames.find(g => g.id === overId);
  const to = { ...f, x: clamp(x, 0, COLS - f.w), y: clamp(y, 0, ROWS - f.h) };
  if (fitsOn(to, frames, id)) return frames.map(g => g.id === id ? to : g);
  if (!o) return frames;
  const geo = g => ({ x: g.x, y: g.y, w: g.w, h: g.h });
  return frames.map(g => g.id === id ? { ...g, ...geo(o) } : g.id === o.id ? { ...g, ...geo(f) } : g);
}

/* ---------- templates ---------- */
const S = (x, y, w, h) => [x, y, w, h];
const AD = (x, y, w, h) => [x, y, w, h, 'ad'];
export const TEMPLATES = [
  { id: 'front', name: 'Front page', bn: 'প্রথম পাতা', boxes: [S(0, 0, 8, 11), S(8, 0, 4, 6), S(8, 6, 4, 5), S(0, 11, 4, 7), S(4, 11, 5, 7), S(9, 11, 3, 7), S(0, 18, 6, 6), S(6, 18, 3, 6), AD(9, 18, 3, 6)] },
  { id: 'banner', name: 'Banner lead', bn: 'বড় খবর', boxes: [S(0, 0, 12, 10), S(0, 10, 5, 8), S(5, 10, 4, 8), S(9, 10, 3, 8), S(0, 18, 3, 6), S(3, 18, 3, 6), S(6, 18, 6, 6)] },
  { id: 'leadside', name: 'Lead + sidebar', bn: 'প্রধান ও পাশে', boxes: [S(0, 0, 9, 12), S(9, 0, 3, 6), S(9, 6, 3, 6), S(0, 12, 4, 12), S(4, 12, 4, 6), S(8, 12, 4, 6), S(4, 18, 8, 6)] },
  { id: 'twoleads', name: 'Two leads', bn: 'দুটি বড় খবর', boxes: [S(0, 0, 6, 12), S(6, 0, 6, 12), S(0, 12, 4, 6), S(4, 12, 4, 6), S(8, 12, 4, 12), S(0, 18, 8, 6)] },
  { id: 'mixed', name: 'Mixed sizes', bn: 'ছোট-বড় মিশিয়ে', boxes: [S(0, 0, 7, 8), S(7, 0, 5, 5), S(7, 5, 5, 8), S(0, 8, 4, 8), S(4, 8, 3, 8), S(7, 13, 5, 11), S(0, 16, 7, 8)] },
  { id: 'briefs', name: 'News in brief', bn: 'সংক্ষেপে', boxes: [S(0, 0, 4, 6), S(4, 0, 4, 6), S(8, 0, 4, 6), S(0, 6, 3, 6), S(3, 6, 3, 6), S(6, 6, 3, 6), S(9, 6, 3, 6), S(0, 12, 6, 6), S(6, 12, 6, 6), S(0, 18, 4, 6), S(4, 18, 4, 6), AD(8, 18, 4, 6)] },
  { id: 'feature', name: 'Full-page feature', bn: 'এক পাতার প্রতিবেদন', boxes: [S(0, 0, 12, 24)] },
  { id: 'featureside', name: 'Feature + column', bn: 'প্রতিবেদন ও কলাম', boxes: [S(0, 0, 8, 24), S(8, 0, 4, 9), S(8, 9, 4, 9), AD(8, 18, 4, 6)] },
  { id: 'continued', name: 'Continued stories', bn: 'বাকি খবর', boxes: [S(0, 0, 8, 8), S(8, 0, 4, 8), S(0, 8, 4, 8), S(4, 8, 8, 8), S(0, 16, 6, 8), S(6, 16, 6, 8)] },
  { id: 'photo', name: 'Photo page', bn: 'ছবির পাতা', boxes: [[0, 0, 12, 12, 'photo'], [0, 12, 6, 6, 'photo'], [6, 12, 6, 6, 'photo'], S(0, 18, 12, 6)] },
  { id: 'adpage', name: 'News + big advert', bn: 'খবর ও বিজ্ঞাপন', boxes: [S(0, 0, 7, 8), S(7, 0, 5, 8), S(0, 8, 4, 6), S(4, 8, 8, 6), AD(0, 14, 12, 10)] },
  { id: 'blank', name: 'Blank page', bn: 'ফাঁকা পাতা', boxes: [] }
];
export const templateById = (id, custom = []) => [...TEMPLATES, ...custom].find(t => t.id === id);
export const framesFrom = t => (t?.boxes || []).map(([x, y, w, h, kind]) => ({ id: uid(), kind: kind || 'story', x, y, w, h }));
export const toTemplate = (page, name) => ({ id: uid('t'), name, bn: 'আমার নকশা', custom: true, boxes: page.frames.map(f => [f.x, f.y, f.w, f.h, f.kind]) });

/** Change a page's design but keep what is on it: stories go back in, biggest box first. */
export function applyTemplate(page, t) {
  const size = f => f.w * f.h;
  const old = [...page.frames].filter(filled).sort((a, b) => size(b) - size(a));
  const frames = framesFrom(t);
  for (const kind of ['story', 'ad', 'photo', 'notice', 'band']) {
    const slots = frames.filter(f => f.kind === kind).sort((a, b) => size(b) - size(a));
    old.filter(f => f.kind === kind).forEach((f, i) => { if (slots[i]) Object.assign(slots[i], contentOf(f)); });
  }
  return { ...page, frames };
}
const CONTENT = ['storyId', 'text', 'title', 'assetId', 'caption', 'headSize', 'cols', 'photo', 'photoFit', 'photoCount', 'align', 'tint', 'border', 'quote', 'colour'];
export const contentOf = f => Object.fromEntries(CONTENT.filter(k => f[k] !== undefined).map(k => [k, f[k]]));
export const filled = f => !!(f.storyId || f.text || f.title || f.assetId);

const PAGE_NAMES = ['প্রথম পাতা', 'রাজ্য', 'জেলা', 'সম্পাদকীয়', 'দেশ', 'বিদেশ', 'খেলা', 'বিনোদন', 'শিক্ষা', 'স্বাস্থ্য', 'বিজ্ঞান', 'অর্থনীতি'];
const CYCLE = ['leadside', 'mixed', 'twoleads', 'briefs', 'banner', 'continued', 'featureside'];
export function newPage(i, total, templateId) {
  const id = templateId || (i === 0 ? 'front' : total > 3 && i === total - 1 ? 'adpage' : total > 3 && i === total - 2 ? 'continued' : CYCLE[(i - 1) % CYCLE.length]);
  return { id: uid('p'), name: i === 0 ? PAGE_NAMES[0] : PAGE_NAMES[1 + (i - 1) % (PAGE_NAMES.length - 1)], masthead: i === 0 ? 'full' : 'strip', frames: framesFrom(templateById(id)) };
}
export const planPages = (n, templateId) => Array.from({ length: clamp(Math.round(n) || 1, 1, MAX_PAGES) }, (_, i) => newPage(i, n, templateId));

/** Pages that would be cut and still hold something, when shrinking to n. */
export const pagesLost = (e, n) => e.pages.slice(n).filter(p => p.frames.some(filled));
export function setPageCount(e, n, templateId) {
  n = clamp(Math.round(n) || 1, 1, MAX_PAGES);
  if (n < e.pages.length) return { ...e, pages: e.pages.slice(0, n) };
  const add = [];
  for (let i = e.pages.length; i < n; i++) add.push(newPage(i, n, templateId || CYCLE[(i - 1 + CYCLE.length) % CYCLE.length]));
  return { ...e, pages: [...e.pages, ...add] };
}

/* ---------- stories on pages ---------- */
/** storyId -> frames in reading order. */
export function threads(e) {
  const map = new Map();
  e.pages.forEach((p, page) => [...p.frames].filter(f => f.kind === 'story' && f.storyId)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .forEach(frame => { if (!map.has(frame.storyId)) map.set(frame.storyId, []); map.get(frame.storyId).push({ page, frame }); }));
  return map;
}
export const words = s => String(s || '').split(/\s+/).filter(Boolean).length;
export const bodyOf = s => String(s?.body || s?.outline || '');
/** Rough words a box can hold (the real count comes from the browser's layout). */
export function capacity(e, f) {
  const [w, h] = trim(e), pt = e.fontSize || 10;
  const mm2 = (w - 18) / COLS * f.w * ((h - 45) / ROWS * f.h);
  return Math.max(0, Math.round((mm2 - 28 * (w - 18) / COLS * f.w) / (0.58 * pt * pt)));
}

/**
 * Put approved stories that are not on any page into empty boxes: the most important story takes the
 * first page's biggest box, then each box takes the story closest to what it can hold.
 */
export function autoPlace(e, stories, onlyPage = null) {
  const out = clone(e), used = new Set(threads(out).keys());
  const left = stories.filter(s => !used.has(s.id)).sort((a, b) => (a.priority || 2) - (b.priority || 2) || words(bodyOf(b)) - words(bodyOf(a)));
  out.pages.forEach((p, pi) => {
    if (onlyPage !== null && pi !== onlyPage) return;
    const boxes = p.frames.filter(f => f.kind === 'story' && !filled(f)).sort((a, b) => b.w * b.h - a.w * a.h);
    boxes.forEach((f, bi) => {
      if (!left.length) return;
      let pick = 0;
      if (!(pi === 0 && bi === 0)) {
        const cap = capacity(out, f);
        const cost = s => Math.abs(Math.log((words(bodyOf(s)) + 20) / (cap + 20))) + (s.section && s.section === p.name ? -1 : 0);
        left.forEach((s, i) => { if (cost(s) < cost(left[pick])) pick = i; });
      }
      f.storyId = left.splice(pick, 1)[0].id;
    });
  });
  return out;
}

/**
 * Find room for the rest of a story: an empty box after it, else free space after it, else a new page.
 * `remaining` is the words still to print.
 */
export function continueStory(e, storyId, remaining) {
  const out = clone(e), chain = threads(out).get(storyId);
  if (!chain?.length) return { edition: e, page: -1 };
  const last = chain[chain.length - 1];
  for (let p = last.page + 1; p < out.pages.length; p++) {
    const empty = out.pages[p].frames.filter(f => f.kind === 'story' && !filled(f));
    if (empty.length) {
      const cost = f => { const c = capacity(out, f); return c >= remaining ? c - remaining : (remaining - c) * 3; };
      empty.sort((a, b) => cost(a) - cost(b))[0].storyId = storyId;
      return { edition: out, page: p };
    }
  }
  for (let p = last.page + 1; p < out.pages.length; p++) {
    const gap = largestGap(out.pages[p].frames, 3, 3);
    if (gap) {
      out.pages[p].frames.push({ id: uid(), kind: 'story', ...gap, storyId });
      return { edition: out, page: p };
    }
  }
  if (out.pages.length >= MAX_PAGES) return { edition: e, page: -1 };
  const np = newPage(out.pages.length, out.pages.length + 1, 'continued');
  np.name = 'বাকি খবর';
  np.frames[0].storyId = storyId;
  out.pages.push(np);
  return { edition: out, page: out.pages.length - 1, added: true };
}

/**
 * Put the rest of a story on one named page: an empty box, else white space, else half of that page's
 * roomiest box. looseness(frame) is 0..1 unused space, so the box given up is the one that needs it least.
 */
export function continueOn(e, storyId, p, looseness = () => 0) {
  const out = clone(e), page = out.pages[p];
  if (!page) return null;
  const empty = page.frames.filter(f => f.kind === 'story' && !filled(f)).sort((a, b) => b.w * b.h - a.w * a.h)[0];
  if (empty) { empty.storyId = storyId; return { edition: out, frame: empty.id }; }
  const gap = largestGap(page.frames, 3, 4);
  if (gap) { const f = { id: uid(), kind: 'story', ...gap, storyId }; page.frames.push(f); return { edition: out, frame: f.id }; }
  const pick = page.frames.filter(f => f.kind !== 'band' && f.storyId !== storyId && (f.h >= 8 || f.w >= 6)).sort((a, b) => b.w * b.h * (0.35 + looseness(b)) - a.w * a.h * (0.35 + looseness(a)))[0];
  if (!pick) return null;
  const dir = pick.h >= 8 ? 'rows' : 'cols', before = new Set(page.frames.map(f => f.id));
  page.frames = splitFrame(page.frames, pick.id, dir);
  const f = page.frames.find(x => !before.has(x.id));
  f.storyId = storyId;
  return { edition: out, frame: f.id, split: true };
}

/** Remove boxes with nothing in them and let the others grow into the space. */
export function tidyPage(page) {
  const keep = page.frames.filter(filled);
  return { ...page, frames: closeGaps(keep) };
}

/* ---------- saved work ---------- */
/** Tile n boxes of different sizes over a whole page. */
export function tileFor(n) {
  const sets = { 1: [[0, 0, 12, 24]], 2: [[0, 0, 12, 13], [0, 13, 12, 11]], 3: [[0, 0, 12, 11], [0, 11, 7, 13], [7, 11, 5, 13]], 4: [[0, 0, 8, 12], [8, 0, 4, 12], [0, 12, 5, 12], [5, 12, 7, 12]], 5: [[0, 0, 8, 11], [8, 0, 4, 11], [0, 11, 4, 13], [4, 11, 4, 13], [8, 11, 4, 13]] };
  return sets[n] || null;
}
export function migrateEdition(old, fallbackPublication) {
  const base = {
    id: old?.id, title: old?.title || 'প্রথম সংস্করণ', issue: String(old?.issue || '1'), volume: old?.volume, editionDate: old?.editionDate || todayISO(),
    size: old?.size || 'A4', widthMm: old?.widthMm, heightMm: old?.heightMm, fontSize: old?.fontSize || 10, bw: !!old?.bw, showFrequency: old?.showFrequency !== false,
    publication: old?.publication || fallbackPublication, status: old?.status || 'Draft', pages: []
  };
  if (Array.isArray(old?.pages) && old.pages.length) {
    return { ...base, rules: old.rules !== false, autofit: old.autofit !== false, pages: cleanPages(old.pages) };
  }
  const items = Array.isArray(old?.items) ? old.items : [];
  const last = Math.max(1, ...items.map(i => Number(i.page) || 1));
  for (let p = 1; p <= last; p++) {
    const here = items.filter(i => (Number(i.page) || 1) === p).slice(0, 12);
    const page = newPage(p - 1, last);
    const set = tileFor(here.length);
    const boxes = set ? set.map(([x, y, w, h]) => ({ id: uid(), kind: 'story', x, y, w, h })) : here.length ? framesFrom(templateById('briefs')).map(f => ({ ...f, kind: 'story' })) : page.frames;
    here.forEach((i, k) => { boxes[k].storyId = i.storyId; if (['left', 'center', 'right', 'justify'].includes(i.align)) boxes[k].align = i.align; });
    page.frames = boxes;
    base.pages.push(page);
  }
  if (old?.advertisement) {
    const lastPage = base.pages[base.pages.length - 1];
    const tall = [...lastPage.frames].sort((a, b) => b.y + b.h - (a.y + a.h) || b.w * b.h - a.w * a.h)[0];
    if (tall && tall.h >= 6) { tall.h -= 4; lastPage.frames.push({ id: uid(), kind: 'ad', x: tall.x, y: tall.y + tall.h, w: tall.w, h: 4, text: old.advertisement }); }
  }
  return { ...base, rules: true, autofit: true };
}
const KINDS = ['story', 'ad', 'photo', 'notice', 'band'];
export function cleanPages(pages) {
  return pages.slice(0, MAX_PAGES).map((p, i) => {
    const frames = [];
    for (const f of Array.isArray(p?.frames) ? p.frames : []) {
      const c = { ...contentOf(f), id: typeof f.id === 'string' && /^[\w-]{1,60}$/.test(f.id) ? f.id : uid(), kind: KINDS.includes(f.kind) ? f.kind : 'story', x: f.x | 0, y: f.y | 0, w: f.w | 0, h: f.h | 0 };
      if (frames.some(g => g.id === c.id)) c.id = uid();
      if (fitsOn(c, frames)) frames.push(c);
    }
    return { id: uid('p'), name: String(p?.name || ''), masthead: ['full', 'strip', 'none'].includes(p?.masthead) ? p.masthead : i ? 'strip' : 'full', frames };
  });
}
const MEDIA = /^data:(image\/(jpeg|png|webp)|audio\/[\w.+-]+|video\/mp4)[;,]/;
export function readBackup(raw) {
  if (!raw || !Array.isArray(raw.stories) || !raw.edition || !(Array.isArray(raw.edition.items) || Array.isArray(raw.edition.pages))) throw Error('This is not a Newsroom backup file.');
  if (raw.stories.length > 2000) throw Error('Too many stories in this backup.');
  const publication = { ...PUBLICATION, ...raw.publication };
  const str = (v, d = '') => v === undefined || v === null ? d : String(v);
  const stories = raw.stories.map(s => ({
    id: str(s.id) || uid('s'), title: str(s.title), short: str(s.short), kicker: str(s.kicker), deck: str(s.deck), body: bodyOf(s), shortDescription: s.shortDescription, byline: str(s.byline), location: str(s.location),
    section: str(s.section), priority: [1, 2, 3].includes(s.priority) ? s.priority : 2, status: ['Draft', 'In Review', 'Approved'].includes(s.status) ? s.status : 'Draft', demo: !!s.demo, ...(typeof s.district === 'string' ? { district: s.district } : {}), ...(Number.isInteger(s.pages) ? { pages: s.pages } : {}),
    media: (Array.isArray(s.media) ? s.media : []).filter(m => typeof m?.url === 'string' && MEDIA.test(m.url)).slice(0, 6).map(m => ({ id: str(m.id) || uid('m'), type: str(m.type) || m.url.slice(5, m.url.indexOf(';')), name: str(m.name), url: m.url, caption: str(m.caption), credit: str(m.credit) }))
  }));
  const assets = {};
  for (const [k, a] of Object.entries(raw.assets || {})) if (/^[\w-]{1,60}$/.test(k) && typeof a?.url === 'string' && /^data:image\/(jpeg|png|webp)[;,]/.test(a.url)) assets[k] = { url: a.url };
  const templates = (Array.isArray(raw.templates) ? raw.templates : []).slice(0, 60).map(t => toTemplate(cleanPages([{ frames: (t.boxes || []).map(([x, y, w, h, kind]) => ({ x, y, w, h, kind })) }])[0], str(t.name, 'My design')));
  return { v: 2, stories, publication, edition: migrateEdition(raw.edition, publication), archive: (Array.isArray(raw.archive) ? raw.archive : []).map(a => migrateEdition(a, publication)), assets, templates };
}
/** Older copies of the studio need edition.items (4 pages, 5 a page) to accept the file. */
export function makeBackup(state) {
  const items = [], seen = new Set();
  state.edition.pages.slice(0, 4).forEach((p, i) => p.frames.filter(f => f.kind === 'story' && f.storyId).slice(0, 5).forEach(f => {
    if (!seen.has(f.storyId)) { seen.add(f.storyId); items.push({ storyId: f.storyId, page: i + 1, ...(f.align ? { align: f.align } : {}) }); }
  }));
  return { ...state, edition: { ...state.edition, items, maxPerPage: 5, template: 'Newspaper' } };
}
