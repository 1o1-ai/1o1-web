/**
 * Tiered education content cache — official immutable assets vs growing supplemental shards.
 * See docs/education/CONTENT_CACHE_ARCHITECTURE.md
 */
(function (global) {
  'use strict';

  const DB_NAME = 'anyo-education-cache-v1';
  const DB_VERSION = 1;
  const TIER = { OFFICIAL: 'T1', SUPPLEMENTAL: 'T2', SESSION: 'T3' };

  let dbPromise = null;
  const memory = {
    chapters: new Map(),
    index: new Map(),
    stats: { hit: 0, miss: 0 },
  };

  function dataRoot() {
    const p = global.location?.pathname || '';
    if (p.includes('/portal/education/')) return '../../data/';
    if (p.includes('/education/')) return '../../data/';
    return '/portal/data/';
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    if (!global.indexedDB) return Promise.resolve(null);
    dbPromise = new Promise((resolve, reject) => {
      const req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('official')) {
          db.createObjectStore('official', { keyPath: 'sha256' });
        }
        if (!db.objectStoreNames.contains('json')) {
          db.createObjectStore('json', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function idbGet(store, key) {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbPut(store, row) {
    const db = await openDb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function recordStat(hit, tier, op) {
    if (hit) memory.stats.hit += 1;
    else memory.stats.miss += 1;
    global.EducationPerf?.record?.('cache_' + op, {
      durationMs: 0,
      usedAi: false,
      source: hit ? 'cache_hit' : 'cache_miss',
      extra: { tier, hit },
    });
  }

  /** T1 — binary official asset (PDF page cache, image) keyed by sha256 */
  async function getOfficialBlob(sha256, fetchUrl) {
    if (!sha256) return null;
    const cached = await idbGet('official', sha256);
    if (cached?.blob) {
      recordStat(true, TIER.OFFICIAL, 'official_blob');
      return cached.blob;
    }
    if (!fetchUrl) {
      recordStat(false, TIER.OFFICIAL, 'official_blob');
      return null;
    }
    const res = await fetch(fetchUrl);
    if (!res.ok) {
      recordStat(false, TIER.OFFICIAL, 'official_blob');
      return null;
    }
    const blob = await res.blob();
    await idbPut('official', { sha256, blob, url: fetchUrl, cachedAt: Date.now() });
    recordStat(false, TIER.OFFICIAL, 'official_blob');
    return blob;
  }

  async function fetchJson(path) {
    const url = path.startsWith('http') ? path : dataRoot() + path.replace(/^\//, '');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    return res.json();
  }

  async function getStudyMaterialIndex(sku) {
    sku = sku || 'cbse10';
    const memKey = sku + ':study-index';
    if (memory.index.has(memKey)) return memory.index.get(memKey);

    const indexPath = sku + '/study-material/index.json';
    try {
      const index = await fetchJson(indexPath);
      memory.index.set(memKey, index);
      return index;
    } catch {
      return null;
    }
  }

  /** T2 — one chapter shard; falls back to monolith slice */
  async function getChapterStudyMaterial(sku, chapterId, monolithFallback) {
    const memKey = (sku || 'cbse10') + ':' + chapterId;
    if (memory.chapters.has(memKey)) {
      recordStat(true, TIER.SUPPLEMENTAL, 'chapter_study');
      return memory.chapters.get(memKey);
    }

    const index = await getStudyMaterialIndex(sku);
    const contentPack = index?.content_pack || '';
    const idbKey = 'chapter://' + sku + '/' + contentPack + '/' + chapterId;

    const cached = await idbGet('json', idbKey);
    if (cached?.data && cached.contentPack === contentPack) {
      memory.chapters.set(memKey, cached.data);
      recordStat(true, TIER.SUPPLEMENTAL, 'chapter_study');
      return cached.data;
    }

    if (index?.chapters) {
      const meta = index.chapters.find((c) => c.chapterId === chapterId);
      if (meta?.path) {
        try {
          const shard = await fetchJson(meta.path);
          const ch = shard.chapter || shard;
          memory.chapters.set(memKey, ch);
          await idbPut('json', { key: idbKey, contentPack, data: ch, cachedAt: Date.now() });
          recordStat(false, TIER.SUPPLEMENTAL, 'chapter_study');
          return ch;
        } catch {
          /* monolith fallback */
        }
      }
    }

    if (monolithFallback?.chapters?.[chapterId]) {
      const ch = monolithFallback.chapters[chapterId];
      memory.chapters.set(memKey, ch);
      recordStat(false, TIER.SUPPLEMENTAL, 'chapter_study_monolith');
      return ch;
    }

    recordStat(false, TIER.SUPPLEMENTAL, 'chapter_study');
    return null;
  }

  /** T1 — figure vector for one question from manifest */
  async function getFigureEntry(manifest, questionId) {
    if (!manifest?.figures || !questionId) return null;
    const memKey = 'fig:' + questionId;
    if (memory.chapters.has(memKey)) return memory.chapters.get(memKey);
    const entry = manifest.figures.find((f) => f.questionId === questionId);
    if (entry) memory.chapters.set(memKey, entry);
    return entry || null;
  }

  function stats() {
    return { ...memory.stats, memoryChapters: memory.chapters.size };
  }

  global.EducationContentCache = {
    TIER,
    getOfficialBlob,
    getChapterStudyMaterial,
    getStudyMaterialIndex,
    getFigureEntry,
    stats,
    dataRoot,
  };
})(typeof window !== 'undefined' ? window : globalThis);
