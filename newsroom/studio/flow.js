/**
 * Newsroom খবরঘর — text flow and page rendering.
 *
 * Each box is built off-screen at true print size and measured with the same CSS the printer gets,
 * so what fits on screen is what fits on paper. Text that does not fit moves to the story's next box.
 */
import { esc, bn, trim, threads, bodyOf, words, dateLabel, COLS, ROWS, PUBLICATION, clamp } from './engine.js?v=20261124-1';

export const FONT_URL = new URL('./bengali.woff2', import.meta.url).href;
const HEAD_COLOURS = { auto: null, black: '#171717', blue: '#0878aa', green: '#1d6b2d', red: '#b52626' };
const TINTS = { none: '', cream: '#fbf4e2', blue: '#eaf3f9', green: '#ecf5ea', grey: '#f0f0ee', dark: '#22333d' };
export const HEAD_SCALE = { auto: 1, s: 0.72, m: 1, l: 1.3, xl: 1.7 };
const images = s => (s?.media || []).filter(m => String(m.type).startsWith('image/')).slice(0, 6);
const accentOf = pub => /^#[\da-f]{6}$/i.test(pub.accent) ? pub.accent : PUBLICATION.accent;
export const pubOf = (e, publication) => ({ ...PUBLICATION, ...publication, ...e.publication });

export function pageCSS(e, fontUrl = FONT_URL) {
  const [w, h] = trim(e), big = w > 250;
  return `
@font-face{font-family:Bengali;src:url('${fontUrl.replace(/['<>]/g, '')}')}
.np-sheet,.np-sheet *{box-sizing:border-box}
.np-sheet{--accent:#0878aa;width:${w}mm;height:${h}mm;padding:8mm 9mm 6mm;background:#fff;color:#171717;display:flex;flex-direction:column;overflow:hidden;position:relative;font-family:Bengali,'Noto Serif Bengali','Nirmala UI',serif;line-height:1.5;text-align:left}
.np-sheet.bw{filter:grayscale(1)}
.np-sheet h1,.np-sheet h2,.np-sheet h3,.np-sheet p,.np-sheet figure{margin:0}
.np-mast{text-align:center;padding:0 0 2mm}.np-tag{color:#267135;font-size:9pt;font-weight:700}
.np-mast h1{font-size:${w > 350 ? 48 : big ? 37 : 27}pt;line-height:1.4;color:var(--accent);font-weight:700}
.np-eng{font:700 ${big ? 14 : 12}pt Georgia,serif;color:var(--accent)}
.np-tri{background:linear-gradient(to bottom,#d85c00 0%,#e87509 33%,#222 46%,#222 54%,#167e34 68%,#08732b 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.np-strip{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;padding-bottom:1.2mm}.np-strip b{font-size:10pt}.np-strip .sec{font-size:15pt;font-weight:700;color:var(--accent);line-height:1.3}.np-strip span{font:7pt Georgia,serif}
.np-issue{background:var(--accent);color:#fff;display:flex;justify-content:space-around;gap:2mm;flex-wrap:wrap;padding:1.2mm;font:8pt Georgia,Bengali,serif;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.np-body{position:relative;flex:1;min-height:0;margin-top:1.5mm}
.np-foot{display:flex;justify-content:space-between;font-size:7pt;padding-top:1.5mm;border-top:.2mm solid #999;margin-top:1mm}
.np-frame{position:absolute;padding:1.6mm 2mm;overflow:hidden}
.np-rules .np-frame{border-right:.2mm solid #b5b5b5;border-bottom:.2mm solid #b5b5b5}.np-rules .np-frame.edge-r{border-right:0}.np-rules .np-frame.edge-b{border-bottom:0}
.np-frame.np-border{border:.5mm solid #333!important}
.np-frame.np-tint{print-color-adjust:exact;-webkit-print-color-adjust:exact}
.np-in{height:100%;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.np-kick{font-size:8.5pt;font-weight:700;color:#b52626;line-height:1.35}
.np-in h2{font-weight:700;line-height:1.32;padding-bottom:1mm;overflow-wrap:break-word}
.np-deck{font-size:11.5pt;line-height:1.45;color:#444;padding-bottom:1mm!important}
.np-by{font-size:8pt;font-weight:700;line-height:1.5;color:#333;padding-bottom:.6mm}
.np-demo{font-size:7pt;color:#a43620;line-height:1.4}
.np-main{flex:1;min-height:0;display:flex;flex-direction:column;gap:1.5mm}
.np-main.side{flex-direction:row;gap:3mm}.np-main.side.right{flex-direction:row-reverse}
.np-pics{flex:none;display:grid;gap:1.2mm;min-height:0;min-width:0}
.np-pics.n2,.np-pics.n4{grid-template-columns:1fr 1fr}.np-pics.n3,.np-pics.n5,.np-pics.n6{grid-template-columns:repeat(3,1fr)}
.np-main.side .np-pics{grid-template-columns:1fr}
.np-pics figure{display:flex;flex-direction:column;min-height:0;min-width:0}
.np-pics img,.np-pics .ph{flex:1;min-height:0;width:100%;object-fit:cover;object-position:50% 30%;display:block;background:#eceee9}.np-pics.whole img{object-fit:contain;object-position:50% 50%}
.np-pics figcaption{font-size:7pt;line-height:1.45;flex:none;padding-top:.5mm;max-height:8mm;overflow:hidden}
.np-text{flex:1;min-height:0;min-width:0;display:flex;flex-direction:column}
.np-copy{flex:1;min-height:0;column-gap:4mm;column-fill:auto;column-rule:.15mm solid #d5d5d5;text-align:justify;overflow-wrap:anywhere;overflow:hidden;orphans:1;widows:1}
.np-copy p{text-indent:3mm}.np-copy p.first{text-indent:0}
.np-copy.bal{column-fill:balance}
.np-quote{flex:none;border-top:.6mm solid var(--accent);border-bottom:.6mm solid var(--accent);padding:1.5mm 2mm;margin:1mm 0;font-size:13pt;line-height:1.45;font-weight:700;color:#22333d;text-align:center}
.np-jump{flex:none;font-size:8pt;font-weight:700;text-align:right;color:#b52626;line-height:1.5}
.np-from{font-size:8pt;font-weight:700;color:#b52626;line-height:1.5}
.np-ad{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#f8f4e8;border:.3mm solid #b9a97a;padding:2mm;overflow:hidden;gap:1mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.np-ad small{font:6pt Arial;letter-spacing:1.5px;color:#777}.np-ad h3{font-size:16pt;line-height:1.4}.np-ad p{font-size:11pt;white-space:pre-line}.np-ad img{min-height:0;flex:1;max-width:100%;object-fit:contain}
.np-ad.pic{padding:0;border:0;background:none}.np-ad.pic img{width:100%;height:100%}
.np-photo{height:100%;display:flex;flex-direction:column}.np-photo img{flex:1;min-height:0;width:100%;object-fit:cover;object-position:50% 30%}.np-photo.whole img{object-fit:contain}.np-photo p{font-size:8pt;line-height:1.5;padding-top:1mm}
.np-notice{height:100%;border:.5mm double #444;padding:2mm 3mm;overflow:hidden}.np-notice h3{font-size:13pt;text-align:center;line-height:1.4;padding-bottom:1mm}.np-notice p{font-size:9.5pt;white-space:pre-line}
.np-band{height:100%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18pt;font-weight:700;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.np-proof{position:absolute;right:9mm;bottom:1.2mm;font:700 8pt Arial;color:#b52626}`;
}

/* ---------- images ---------- */
const blobs = new Map();
/** Screen uses short blob: addresses (fast to redraw); exports keep the full data: address. */
export function screenURL(url) {
  if (!String(url).startsWith('data:image/')) return url;
  if (!blobs.has(url)) {
    try {
      const [head, b64] = url.split(',');
      const bin = atob(b64), a = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      blobs.set(url, URL.createObjectURL(new Blob([a], { type: head.slice(5, head.indexOf(';')) })));
    } catch { blobs.set(url, url); }
  }
  return blobs.get(url);
}

/* ---------- measuring ---------- */
let host, styleEl;
function measureHost(e) {
  if (!host) {
    host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;left:-30000px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict';
    document.body.append(host);
    styleEl = document.createElement('style');
    styleEl.id = 'np-style';
    document.head.append(styleEl);
  }
  const css = pageCSS(e);
  if (styleEl.textContent !== css) { styleEl.textContent = css; cache.clear(); sizes.clear(); }
}
const cache = new Map(), sizes = new Map();
const PX_MM = 96 / 25.4;

function bodySize(e, pub, page, total) {
  const key = JSON.stringify([page.masthead, pub, e.size, e.widthMm, e.heightMm, e.issue, e.volume, e.editionDate, e.showFrequency, page.name, total]);
  if (!sizes.has(key)) {
    host.innerHTML = sheetShell(e, pub, page, 0, total, '');
    const b = host.querySelector('.np-body');
    const r = b.getBoundingClientRect();
    sizes.set(key, [r.width, r.height]);
  }
  return sizes.get(key);
}

function tokens(text) {
  const out = [];
  String(text).split(/\n+/).map(s => s.trim()).filter(Boolean).forEach((p, pi) => p.split(/\s+/).forEach((w, wi) => out.push({ w, p: pi, first: wi === 0 })));
  return out;
}
function copyHTML(tk, a, b) {
  let html = '', open = -1, buf = [];
  const flush = () => { if (buf.length) html += `<p${html ? '' : ' class="first"'}>${esc(buf.join(' '))}</p>`; buf = []; };
  for (let i = a; i < b; i++) { if (tk[i].p !== open) { flush(); open = tk[i].p; } buf.push(tk[i].w); }
  flush();
  return html;
}

function frameStyle(f) { return `left:${f.x / COLS * 100}%;top:${f.y / ROWS * 100}%;width:${f.w / COLS * 100}%;height:${f.h / ROWS * 100}%;`; }
function frameClass(f) { return 'np-frame' + (f.x + f.w === COLS ? ' edge-r' : '') + (f.y + f.h === ROWS ? ' edge-b' : '') + (f.border ? ' np-border' : '') + (TINTS[f.tint] ? ' np-tint' : ''); }
const tintStyle = f => TINTS[f.tint] ? `background:${TINTS[f.tint]};${f.tint === 'dark' ? 'color:#fff;' : ''}` : '';

/** HTML inside one story box for a given set of choices. */
function storyHTML(o) {
  const { f, s, start, from, to, pics, frac, headPt, bodyPt, lead, cols, side, copy, bal, colour, src } = o;
  const dark = f.tint === 'dark';
  const pic = pics.length ? `<div class="np-pics n${side ? 1 : pics.length} ${f.photoFit === 'whole' ? 'whole' : ''}" style="${side ? 'width' : 'height'}:${(frac * 100).toFixed(1)}%">${pics.map(m => `<figure>${src ? `<img src="${esc(src(m.url))}" alt="${esc(m.caption)}">` : '<div class="ph"></div>'}${m.caption || m.credit ? `<figcaption>${esc(m.caption)}${m.credit ? (m.caption ? ' · ' : '') + esc(m.credit) : ''}</figcaption>` : ''}</figure>`).join('')}</div>` : '';
  const align = ['left', 'center', 'right', 'justify'].includes(f.align) ? f.align : '';
  const head = start
    ? `${s.kicker ? `<div class="np-kick">${esc(s.kicker)}</div>` : ''}<h2 style="font-size:${headPt.toFixed(1)}pt;color:${dark ? '#fff' : colour};${align && align !== 'justify' ? `text-align:${align};` : ''}">${esc(s.title)}</h2>${s.demo ? '<div class="np-demo">কাল্পনিক নমুনা • প্রকাশযোগ্য সংবাদ নয়</div>' : ''}${s.deck && f.w >= 4 ? `<p class="np-deck">${esc(s.deck)}</p>` : ''}<div class="np-by"${dark ? ' style="color:#ddd"' : ''}>${esc(String(s.byline || '').trim() || 'নিজস্ব সংবাদদাতা')}${s.location ? ' · ' + esc(s.location) : ''}</div>`
    : `${from ? `<div class="np-from">◀ ${bn(from)} পাতার পর</div>` : ''}${from ? `<h2 style="font-size:${headPt.toFixed(1)}pt;color:${dark ? '#fff' : colour}">${esc(shortTitle(s))}</h2>` : ''}`;
  const quote = start && (f.quote === true || o.autoQuote) ? pullQuote(s) : '';
  return `<div class="np-in">${head}<div class="np-main ${side ? 'side ' + side : ''}">${pic}<div class="np-text">${quote ? `<div class="np-quote">“${esc(quote)}”</div>` : ''}<div class="np-copy${bal ? ' bal' : ''}" style="column-count:${cols};font-size:${bodyPt}pt;line-height:${lead};${align ? `text-align:${align};` : ''}">${copy}</div>${to ? `<div class="np-jump">এরপর ${bn(to)} পাতায় ▶</div>` : ''}</div></div></div>`;
}
export function shortTitle(s) {
  if (s.short) return s.short;
  const w = String(s.title || '').split(/\s+/);
  return w.length > 5 ? w.slice(0, 5).join(' ') + '…' : w.join(' ');
}
/** A sentence lifted from the story itself — never invented text. */
function pullQuote(s) {
  const list = bodyOf(s).split(/(?<=[।?!])\s*/).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x.length >= 35 && x.length <= 130);
  return list[1] || list[0] || '';
}

function fitFrame(e, f, s, part, size, startAt, usedPics, index) {
  const W = size[0] * f.w / COLS - 0.5, H = size[1] * f.h / ROWS - 1.5;   // a hair under, so paper never clips a line
  const tk = tokens(bodyOf(s)), start = part.index === 0, hasNext = part.next !== null;
  const basePt = clamp(Number(e.fontSize) || 10, 8, 14), auto = e.autofit !== false;
  const scale = Math.pow(size[0] / PX_MM / 192, 0.55);
  const base = ({ 2: 12, 3: 14.5, 4: 17, 5: 19, 6: 22, 7: 25, 8: 28, 9: 30, 10: 33, 11: 35, 12: 38 })[f.w] || 14;
  const want = start ? base * scale * (HEAD_SCALE[f.headSize] || 1) : Math.min(15, base * 0.7) * scale;
  const colour = HEAD_COLOURS[f.colour] || ['#0878aa', '#171717', '#1d6b2d', '#171717', '#b52626'][index % 5];
  const all = images(s);
  const n = f.photo === 'none' ? 0 : f.photoCount ? clamp(f.photoCount | 0, 1, 6) : start && !hasNext && f.w * f.h >= 96 ? 3 : 1;
  const pics = f.photo === 'none' ? [] : all.slice(usedPics, usedPics + n);
  const side = !pics.length ? '' : f.photo === 'left' ? 'left' : f.photo === 'right' ? 'right' : f.photo === 'top' ? '' : W > H * 1.55 ? 'left' : '';
  const colW = 46 * PX_MM * Math.sqrt(basePt / 10);
  const o = { f, s, start, from: part.from, to: null, pics, frac: 0.42, headPt: want, bodyPt: basePt, lead: 1.5, side, copy: '', bal: false, colour, src: null };
  const setCols = () => { o.cols = f.cols ? clamp(f.cols | 0, 1, 6) : clamp(Math.round((side ? W * (1 - o.frac) : W) / colW), 1, 6); };
  setCols();
  const box = document.createElement('div');
  box.className = 'np-sheet' + (e.rules !== false ? ' np-rules' : '');
  box.style.cssText = 'padding:0;display:block;overflow:visible;width:auto;height:auto';
  box.innerHTML = `<div class="${frameClass(f)}" style="position:static;width:${W}px;height:${H}px"></div>`;
  host.replaceChildren(box);
  const el = box.firstChild;
  const draw = () => { el.innerHTML = storyHTML(o); return el.querySelector('.np-copy'); };
  const ok = c => c.scrollWidth <= c.clientWidth + 1 && c.scrollHeight <= c.clientHeight + 1;
  const fits = (b, to) => { o.to = to; o.copy = copyHTML(tk, startAt, b); return ok(draw()); };
  // Headline: shrink until it takes at most a share of the box.
  const headOK = () => {
    o.copy = ''; draw();
    const h2 = el.querySelector('h2');
    if (!h2) return true;
    const top = el.querySelector('.np-main').offsetTop - el.querySelector('.np-in').offsetTop;
    return top <= H * 0.46 && h2.scrollWidth <= h2.clientWidth + 1;
  };
  while (o.headPt > 9.5 && !headOK()) o.headPt *= 0.93;

  const rest = tk.length - startAt;
  const res = { start: startAt, end: startAt, words: 0, left: 0, fill: 1, redundant: false, tooSmall: false, pics: pics.length };
  const usable = draw().clientHeight > basePt * 1.4 * 96 / 72;
  if (!usable) res.tooSmall = true;
  let done = false;
  if (rest <= 0) {
    if (!start) res.redundant = true;
    done = true; res.fill = pics.length ? 1 : 0;
  } else if (fits(tk.length, null)) {
    done = true;
    if (pics.length && auto && rest > 0) {          // short text: give the space to the photograph
      let lo = o.frac, hi = 0.76;
      for (let i = 0; i < 6; i++) { const mid = (lo + hi) / 2; o.frac = mid; setCols(); if (fits(tk.length, null)) lo = mid; else hi = mid; }
      o.frac = lo; setCols(); fits(tk.length, null);
    }
  } else if (pics.length && auto && !hasNext) {     // long text: try a smaller photograph first
    let lo = 0.2, hi = 0.42;
    o.frac = lo; setCols();
    if (fits(tk.length, null)) {
      done = true;
      for (let i = 0; i < 5; i++) { const mid = (lo + hi) / 2; o.frac = mid; setCols(); if (fits(tk.length, null)) lo = mid; else hi = mid; }
      o.frac = lo; setCols(); fits(tk.length, null);
    } else { o.frac = 0.36; setCols(); }
  }
  if (!done && auto && !hasNext) {                   // a line or two too long: tighten rather than cut
    const keep = o.headPt;
    for (const [d, l, hk] of [[0, 1.44, 1], [0, 1.44, 0.88], [-0.3, 1.42, 0.88], [-0.6, 1.4, 0.82]]) {
      o.bodyPt = basePt + d; o.lead = l; o.headPt = Math.max(9.5, keep * hk);
      if (fits(tk.length, null)) { done = true; break; }
    }
    if (!done) { o.bodyPt = basePt; o.lead = 1.5; o.headPt = keep; }
  }
  const tight = o.lead < 1.5;
  const used = () => {                               // share of the copy area carrying text
    const c = draw(), end = document.createElement('i');
    c.lastElementChild?.append(end);
    const a = c.getBoundingClientRect(), b = end.getBoundingClientRect();
    const col = clamp(Math.floor((b.left - a.left + 2) / (a.width / o.cols)), 0, o.cols - 1);
    return a.height ? clamp((col * a.height + (b.bottom - a.top)) / (o.cols * a.height), 0, 1) : 1;
  };
  if (done && rest > 0) {
    o.to = null; o.copy = copyHTML(tk, startAt, tk.length);
    res.end = tk.length;
    res.fill = used();
    if (auto && !tight && res.fill < 0.94) {                  // still short: bigger headline, then roomier text
      if (start && (f.headSize || 'auto') === 'auto') for (const k of [1.5, 1.3, 1.15]) { const keep = o.headPt; o.headPt = keep * k; if (headOK() && fits(tk.length, null)) break; o.headPt = keep; }
      if (start && res.fill < 0.62 && !pics.length && f.quote !== false && f.w * f.h >= 16 && words(bodyOf(s)) >= 24) { o.autoQuote = true; if (!pullQuote(s) || !fits(tk.length, null)) o.autoQuote = false; }
      const ladder = [[0.4, 1.55], [0.8, 1.55], [1.2, 1.6], [1.6, 1.64], [2, 1.7], [2.5, 1.78], [3, 1.85]];
      let best = [0, 1.5];
      for (const [d, l] of ladder) { o.bodyPt = basePt + d; o.lead = l; if (fits(tk.length, null)) best = [d, l]; else break; }
      o.bodyPt = basePt + best[0]; o.lead = best[1];
      fits(tk.length, null);
      res.fill = used();
    }
    o.bal = res.fill < 0.9 && o.cols > 1;
  } else if (!done) {                                // split: the rest goes to the next box
    let lo = startAt, hi = tk.length;
    const to = hasNext ? part.to : null;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (fits(mid, to)) lo = mid; else hi = mid; }
    if (hasNext && tk.length - lo < 14) lo = Math.max(startAt, tk.length - 14);   // never jump a stub
    o.to = to; o.copy = copyHTML(tk, startAt, lo);
    res.end = lo; res.left = tk.length - lo;
    if (lo === startAt) res.tooSmall = true;
  }
  res.words = res.end - startAt;
  if (el.querySelector('.np-in')) { draw(); const i = el.querySelector('.np-in'); if (i.scrollHeight > i.clientHeight + 2) res.tooSmall = true; }
  res.opts = { ...o, f: null, s: null };
  return res;
}

/** Lay out the whole edition. Returns per-frame layout plus a report the editor shows. */
export function layout(e, stories, publication) {
  measureHost(e);
  const pub = pubOf(e, publication), byId = new Map(stories.map(s => [s.id, s]));
  const frames = {}, report = {}, total = e.pages.length;
  for (const [id, chain] of threads(e)) {
    const s = byId.get(id);
    if (!s) { chain.forEach(c => { frames[c.frame.id] = { missing: true }; }); report[id] = { missing: true, chain }; continue; }
    let at = 0, pics = 0, last = null;
    chain.forEach(({ page, frame }, i) => {
      const next = chain[i + 1] || null, prev = chain[i - 1];
      const size = bodySize(e, pub, e.pages[page], total);
      const index = e.pages[page].frames.filter(f => f.kind === 'story').findIndex(f => f.id === frame.id);
      const part = { index: i, next: next ? next.page : null, to: next && next.page !== page ? next.page + 1 : null, from: prev && prev.page !== page ? prev.page + 1 : null };
      const key = JSON.stringify([frame.w, frame.h, frame.x + frame.w === COLS, frame.y + frame.h === ROWS, { ...frame, id: 0, x: 0, y: 0 }, part, size, at, pics, index % 5, e.fontSize, e.autofit, e.rules,
        s.title, s.short, s.kicker, s.deck, s.body, s.byline, s.location, s.demo, images(s).map(m => [m.url.length, m.url.slice(-24), m.caption, m.credit])]);
      let r = cache.get(key);
      if (!r) { r = fitFrame(e, frame, s, part, size, at, pics, Math.max(0, index)); if (cache.size > 900) cache.clear(); cache.set(key, r); }
      frames[frame.id] = r;
      at = r.end; pics += r.pics; last = r;
    });
    report[id] = { chain, left: last ? last.left : 0, total: tokens(bodyOf(s)).length };
  }
  host.replaceChildren();
  return { frames, report, pub };
}

function frameHTML(e, f, ctx) {
  const { lay, byId, assets, src } = ctx;
  const img = f.assetId && assets[f.assetId]?.url;
  if (f.kind === 'ad') return img || f.text || f.title
    ? `<div class="np-ad${img && !f.text && !f.title ? ' pic' : ''}">${img && !f.text && !f.title ? '' : '<small>বিজ্ঞাপন</small>'}${img ? `<img src="${esc(src(img))}" alt="${esc(f.title || 'Advertisement')}">` : ''}${f.title ? `<h3>${esc(f.title)}</h3>` : ''}${f.text ? `<p>${esc(f.text)}</p>` : ''}</div>` : '';
  if (f.kind === 'photo') {
    const m = img ? { url: img, caption: f.caption, credit: '' } : images(byId.get(f.storyId))[0];
    return m ? `<div class="np-photo ${f.photoFit === 'whole' ? 'whole' : ''}"><img src="${esc(src(m.url))}" alt="${esc(f.caption || m.caption)}"><p>${esc(f.caption || m.caption)}${m.credit ? ' · ' + esc(m.credit) : ''}</p></div>` : '';
  }
  if (f.kind === 'notice') return f.title || f.text ? `<div class="np-notice">${f.title ? `<h3>${esc(f.title)}</h3>` : ''}<p>${esc(f.text)}</p></div>` : '';
  if (f.kind === 'band') return `<div class="np-band">${esc(f.title || '')}</div>`;
  const r = lay.frames[f.id], s = byId.get(f.storyId);
  return r?.opts && s ? storyHTML({ ...r.opts, f, s, src }) : '';
}

function sheetShell(e, pub, page, i, total, body, proof) {
  const p = esc;
  const head = page.masthead === 'full'
    ? `<header class="np-mast"><div class="np-tag">${p(pub.tagline)}</div><h1 class="np-tri">${p(pub.name)}</h1><div class="np-eng np-tri">${p(pub.englishName)}</div></header><div class="np-issue"><span>Vol. ${p(e.volume || pub.volume)}</span><span>Issue ${p(e.issue || '1')}</span><span>${p(dateLabel(e.editionDate || pub.date))}</span>${e.showFrequency !== false && pub.frequency ? `<span>${p(pub.frequency)}</span>` : ''}<span>R.N.I. ${p(pub.registration)}</span><span>${p(pub.price)}</span><span>Page ${i + 1} of ${total}</span></div>`
    : page.masthead === 'none' ? ''
      : `<header class="np-strip"><b class="np-tri">${p(pub.name)}</b><span class="sec" style="font-family:inherit">${p(page.name)}</span><b>${bn(i + 1)}</b></header><div class="np-issue"><span>${p(dateLabel(e.editionDate || pub.date))}</span><span>R.N.I. ${p(pub.registration)}</span><span>Issue ${p(e.issue || '1')}</span></div>`;
  return `<section class="np-sheet${e.bw ? ' bw' : ''}" data-sheet="${i}" style="--accent:${accentOf(pub)}">${head}<div class="np-body${e.rules !== false ? ' np-rules' : ''}">${body}</div><footer class="np-foot"><span>${p(pub.footer || pub.englishName)} · digitalindiandigitalnews2019@gmail.com</span><span>${p(e.title)} · Page ${i + 1}</span></footer>${proof ? '<div class="np-proof">PROOF — NOT FOR PRINT</div>' : ''}</section>`;
}

/** One page. opts.editor(frame) may add overlay HTML inside each box. */
export function pageHTML(e, i, stories, lay, assets, opts = {}) {
  const ctx = { lay, byId: opts.byId || new Map(stories.map(s => [s.id, s])), assets: assets || {}, src: opts.src || screenURL };
  const page = e.pages[i];
  const body = page.frames.map(f => {
    const inner = frameHTML(e, f, ctx), extra = opts.editor ? opts.editor(f, inner) : '';
    return inner || extra ? `<div class="${frameClass(f)}" data-frame="${esc(f.id)}" style="${frameStyle(f)}${tintStyle(f)}">${inner}${extra}</div>` : '';
  }).join('');
  return sheetShell(e, lay.pub, page, i, e.pages.length, body, opts.proof);
}

const toDataURL = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsDataURL(blob); });

export async function documentHTML(e, stories, lay, assets, { embed = false, proof = false } = {}) {
  let font = FONT_URL;
  if (embed) { const r = await fetch(FONT_URL); if (!r.ok) throw Error('The Bengali font could not be loaded.'); font = await toDataURL(await r.blob()); }
  const [w, h] = trim(e), src = embed ? u => u : screenURL;
  const pages = e.pages.map((_, i) => pageHTML(e, i, stories, lay, assets, { src, proof })).join('');
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(lay.pub.englishName)} · ${esc(e.title)} · Issue ${esc(e.issue)}</title><style>${pageCSS(e, font)}
html,body{margin:0}body{background:#e5e8e7}.np-sheet{margin:8mm auto}
@page{size:${w}mm ${h}mm;margin:0}@media print{body{background:#fff}.np-sheet{margin:0;height:calc(${h}mm - .4mm);padding-bottom:5.6mm;break-inside:avoid;break-after:page}.np-sheet:last-child{break-after:auto}}</style></head><body>${pages}</body></html>`;
}

/** Print through a hidden frame (no pop-up to be blocked). Checks nothing is clipped before printing. */
export async function printEdition(e, stories, lay, assets, proof) {
  document.getElementById('np-print')?.remove();
  const fr = document.createElement('iframe');
  fr.id = 'np-print';
  fr.title = 'Print';
  fr.style.cssText = 'position:fixed;left:-30000px;top:0;width:1600px;height:1200px;border:0';
  const html = await documentHTML(e, stories, lay, assets, { proof });
  await new Promise(ok => { fr.onload = ok; fr.srcdoc = html; document.body.append(fr); });
  const d = fr.contentDocument;
  await d.fonts.ready;
  await Promise.all(Array.from(d.images).map(i => i.decode().catch(() => {})));
  const broken = Array.from(d.images).filter(i => !i.naturalWidth).length;
  const clipped = Array.from(d.querySelectorAll('.np-copy')).filter(c => c.scrollWidth > c.clientWidth + 2).length;
  if (!proof && (broken || clipped)) { fr.remove(); throw Error(broken ? 'A photograph could not be loaded.' : 'Some text would be cut on paper. Reload the page and try again.'); }
  fr.contentWindow.focus();
  fr.contentWindow.print();
}
