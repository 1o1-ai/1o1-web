#!/usr/bin/env node
// Refresh the static news snapshot consumed by the JanDrishti dashboard.
// RSS links are published by ABP Ananda at https://bengali.abplive.com/rss.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = resolve(ROOT, 'data/news-summary.json');
const argIndex = process.argv.indexOf('--output');
const OUT = resolve(argIndex >= 0 && process.argv[argIndex + 1] ? process.argv[argIndex + 1] : DEFAULT_OUT);
const LOOKBACK_DAYS = 7;
const MAX_ITEMS = 12;
const FEEDS = [
  { id: 'abp-district', publisher: 'ABP Ananda', section: 'District News', url: 'https://bengali.abplive.com/district/feed' },
  { id: 'abp-kolkata', publisher: 'ABP Ananda', section: 'Kolkata', url: 'https://bengali.abplive.com/news/kolkata/feed' },
  { id: 'abp-states', publisher: 'ABP Ananda', section: 'West Bengal', url: 'https://bengali.abplive.com/states/feed' }
];

const LOCAL_SOURCES = [
  { id: 'ukm-notices', publisher: 'Uttarpara-Kotrung Municipality', section: 'Municipal notices', url: 'https://www.uttarparamunicipality.in/news-event.php', kind: 'municipal' },
  { id: 'hooghly-notices', publisher: 'Hooghly District Administration', section: 'District notices', url: 'https://hooghly.nic.in/notice_category/important-notices/', kind: 'district' }
];
const CURATED_ITEMS = [
  {
    id: 'abp-uttarpara-ed-20261030', source_id: 'abp-district', publisher: 'ABP Ananda', section: 'District News',
    title: 'ED searches a Uttarpara residence in a bank-fraud investigation',
    summary: 'ABP Ananda reports that the Enforcement Directorate searched a chartered accountant’s Uttarpara residence on 30 October as part of a wider investigation. The report describes an ongoing probe; allegations are not findings of guilt.',
    url: 'https://bengali.abplive.com/district/ed-raid-in-uttarpara-howrah-and-lake-town-i-bank-fraud-case-district-news-update-1197761',
    published_at: '2026-10-30', localities: ['Uttarpara']
  },
  {
    id: 'publicapp-hindmotor-20261030', source_id: 'public-app-local', publisher: 'Public App · Serampore-Uttarpara', section: 'Local report',
    title: 'Police report four detentions after an operation in Hindmotor',
    summary: 'Public App’s Serampore-Uttarpara local feed reported a police operation in Hindmotor on 30 October. This is a secondary local report; check the police or court record before operational use.',
    url: 'https://public.app/video/sp_0hi1ifdqi3hqg',
    published_at: '2026-10-30', localities: ['Hindmotor', 'Uttarpara']
  }
];

const LOCALITIES = [
  { name: 'Uttarpara', en: /\buttarpara\b/i, bn: ['উত্তরপাড়া', 'উত্তরপাড়া', 'উত্তরপাড়া-কোতরং', 'উত্তরপাড়া-কোটরং'] },
  { name: 'Konnagar', en: /\bkonnagar\b/i, bn: ['কোন্নগর'] },
  { name: 'Hindmotor', en: /\bhindmotor\b/i, bn: ['হিন্দমোটর', 'হিন্দ মোটর'] },
  { name: 'Makhla', en: /\bmakhla\b/i, bn: ['মাখলা'] },
  { name: 'Bhadrakali', en: /\bbhadrakali\b/i, bn: ['ভদ্রকালী'] },
  { name: 'Kanaipur', en: /\bkanaipur\b/i, bn: ['কানাইপুর'] },
  { name: 'Nabagram', en: /\bnabagram\b/i, bn: ['নবগ্রাম'] },
  { name: 'Raghunathpur', en: /\braghunathpur\b/i, bn: ['রঘুনাথপুর'] },
];

function decodeEntities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&([a-z]+);/gi, (all, n) => Object.hasOwn(named, n.toLowerCase()) ? named[n.toLowerCase()] : all);
}

function plainText(value) {
  return decodeEntities(value)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function field(xml, name) {
  const m = xml.match(new RegExp('<(?:[A-Za-z0-9_-]+:)?' + name + '\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?' + name + '\\s*>', 'i'));
  return m ? decodeEntities(m[1]).trim() : '';
}

function itemsFrom(xml) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)];
  return blocks.map((m) => {
    const b = m[2];
    const title = plainText(field(b, 'title')).slice(0, 260);
    let link = field(b, 'link');
    if (!link) {
      const attr = b.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      link = attr ? decodeEntities(attr[1]) : '';
    }
    const description = field(b, 'description') || field(b, 'summary') || field(b, 'content');
    const dateText = field(b, 'pubDate') || field(b, 'published') || field(b, 'updated') || field(b, 'date');
    const published = Date.parse(dateText);
    return { title, url: link.trim(), summary: plainText(description).slice(0, 360), published_at: Number.isFinite(published) ? new Date(published).toISOString() : null };
  }).filter(x => x.title && /^https?:\/\//i.test(x.url));
}

function matchLocalities(item) {
  const hay = item.title + ' ' + item.summary;
  return LOCALITIES.filter(x => x.en.test(hay) || x.bn.some(term => hay.includes(term))).map(x => x.name);
}

function cleanUrl(value) {
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) u.searchParams.delete(key);
    return u.href;
  } catch { return ''; }
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: { 'User-Agent': 'Brahmexa-JanDrishti-NewsDigest/1.0 (+https://yogabrata.com/jandrishti/)', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(18000)
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const xml = await response.text();
  if (!/<(rss|feed)\b/i.test(xml)) throw new Error('Response was not RSS or Atom XML');
  return itemsFrom(xml);
}


async function fetchLocalPage(source) {
  const response = await fetch(source.url, {
    headers: { 'User-Agent': 'Brahmexa-JanDrishti-NewsDigest/1.0 (+https://yogabrata.com/jandrishti/)', 'Accept': 'text/html' },
    signal: AbortSignal.timeout(18000)
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const html = await response.text();
  if (!/<html|<body/i.test(html)) throw new Error('Response was not HTML');
  const blocks = source.kind === 'municipal'
    ? [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi)].map(m => m[1])
    : [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)].map(m => m[1]);
  const out = [];
  for (const block of blocks) {
    const cells = [...block.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]\s*>/gi)].map(m => m[1]);
    const titleHtml = source.kind === 'district' ? (cells[0] || block) : block;
    const title = plainText(titleHtml).replace(/\b(download|view|click here)\b/gi, '').replace(/[|:*]+$/g, '').trim().slice(0, 260);
    if (title.length < 12) continue;
    const anchors = [...titleHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/gi)];
    const href = anchors[0]?.[1] || [...block.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)][0]?.[1];
    if (!href) continue;
    const url = cleanUrl(new URL(decodeEntities(href), source.url).href);
    if (!url) continue;
    const localities = source.kind === 'municipal' ? ['Uttarpara'] : matchLocalities({ title, summary: '' });
    if (!localities.length) continue;
    const rawDate = plainText(block).match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);
    const published_at = rawDate ? new Date(Date.UTC(+rawDate[3], +rawDate[2] - 1, +rawDate[1])).toISOString() : null;
    out.push({ id: createHash('sha256').update(url).digest('hex').slice(0, 16), publisher: source.publisher, section: source.section, title, summary: source.kind === 'municipal' ? 'Official municipality notice. Open the source document for details and dates.' : 'Official district notice. Open the source document for details and dates.', url, published_at, localities, source_id: source.id });
    if (out.length >= (source.kind === 'municipal' ? 8 : 10)) break;
  }
  return out;
}

async function main() {
  const previous = (() => { try { return JSON.parse(readFileSync(OUT, 'utf8')); } catch { return null; } })();
  const checked = [];
  const fresh = [];
  for (const feed of FEEDS) {
    try {
      const entries = await fetchFeed(feed);
      checked.push({ id: feed.id, publisher: feed.publisher, section: feed.section, url: feed.url, status: 'ok', fetched_items: entries.length });
      for (const entry of entries) {
        const localities = matchLocalities(entry);
        if (!localities.length) continue;
        const published = entry.published_at ? Date.parse(entry.published_at) : NaN;
        if (Number.isFinite(published) && Date.now() - published > LOOKBACK_DAYS * 86400000) continue;
        const url = cleanUrl(entry.url);
        if (!url) continue;
        fresh.push({
          id: createHash('sha256').update(url).digest('hex').slice(0, 16),
          publisher: feed.publisher,
          section: feed.section,
          title: entry.title,
          summary: entry.summary || 'Open the publisher report for the full story.',
          url,
          published_at: entry.published_at,
          localities,
          source_id: feed.id
        });
      }
    } catch (error) {
      checked.push({ id: feed.id, publisher: feed.publisher, section: feed.section, url: feed.url, status: 'error', error: String(error.message || error).slice(0, 180) });
    }
  }


  for (const source of LOCAL_SOURCES) {
    try {
      const entries = await fetchLocalPage(source);
      checked.push({ id: source.id, publisher: source.publisher, section: source.section, url: source.url, status: 'ok', fetched_items: entries.length });
      fresh.push(...entries);
    } catch (error) {
      checked.push({ id: source.id, publisher: source.publisher, section: source.section, url: source.url, status: 'error', error: String(error.message || error).slice(0, 180) });
    }
  }

  if (!checked.some(x => x.status === 'ok')) throw new Error('Every news feed failed; keeping the existing snapshot unchanged.');
  const failedIds = new Set(checked.filter(x => x.status !== 'ok').map(x => x.id));
  const old = Array.isArray(previous && previous.items) ? previous.items : [];
  const cutoff = Date.now() - LOOKBACK_DAYS * 86400000;
  const keepOld = old.filter(x => failedIds.has(x.source_id) && (!x.published_at || Date.parse(x.published_at) >= cutoff));
  const unique = new Map();
  for (const item of [...fresh, ...keepOld]) {
    const url = cleanUrl(item.url);
    if (!url) continue;
    const prior = unique.get(url);
    if (!prior || (item.localities || []).length > prior.localities.length) unique.set(url, { ...item, url });
  }
  const items = [...unique.values()].sort((a, b) => {
    const ta = Date.parse(a.published_at || '') || 0;
    const tb = Date.parse(b.published_at || '') || 0;
    return tb - ta || b.localities.length - a.localities.length;
  }).slice(0, MAX_ITEMS);
  const out = {
    schema: 'jandrishti.news/v1',
    geography: 'Uttarpara Assembly constituency (AC 185)',
    last_checked_at: new Date().toISOString(),
    refresh_interval_hours: 4,
    lookback_days: LOOKBACK_DAYS,
    sources: checked,
    items
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log('Wrote ' + items.length + ' constituency news item(s) from ' + checked.filter(x => x.status === 'ok').length + '/' + FEEDS.length + ' feed(s) to ' + OUT);
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
