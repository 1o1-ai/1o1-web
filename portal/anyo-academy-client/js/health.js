/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  API pulse — folds the earlier Education API sanity assessment into the study client.
*/
(function (global) {
  'use strict';

  var CORE_GETS = [
    '/health', '/', '/modules', '/client/scopes', '/actors/samples',
    '/billing/plans', '/practice/config', '/knowledge/taxonomy',
    '/geo/country', '/abhyas/health', '/abhyas/v1/config',
    '/cbse10/curriculum', '/cbse10/manifest', '/v1/boards',
  ];

  var KNOWN_GAPS = [
    { title: 'Class XII objective bank', body: 'CBSE XII yields ~0 is_objective questions — claimed MCQs without options are downgraded to UNSPECIFIED.' },
    { title: 'question_count is a hint', body: 'Chapter question_count comes from curriculum metadata. Trust /v1/questions total.' },
    { title: 'No answer keys', body: 'answer_available may be true, but keys never cross the API boundary.' },
    { title: 'Version drift', body: 'OpenAPI, GET /, and /health can disagree on version strings.' },
    { title: '/knowledge/search grade 12', body: 'Filter accepted; often returns count: 0. Use /v1/questions for curriculum.' },
    { title: 'Abhyas public config', body: 'Public /abhyas/v1/config is Class 10 only; XII routes are JWT-gated.' },
    { title: 'Generative latency', body: '/actors/chat and /exams/generate often need 60–90s.' },
  ];

  function categorize(status) {
    if (status >= 200 && status < 300) return 'OK';
    if (status === 401) return 'AUTH';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 422) return 'VALIDATION';
    if (status >= 500) return 'SERVER_ERROR';
    if (status === 0) return 'NETWORK';
    return 'OTHER';
  }

  function runCoreProbe(api) {
    var results = [];
    var chain = Promise.resolve();
    CORE_GETS.forEach(function (path) {
      chain = chain.then(function () {
        return api.call({ method: 'GET', path: path, timeout_ms: 30000 }).then(function (res) {
          results.push({
            path: path,
            status: res.status,
            ms: res.elapsed_ms,
            category: categorize(res.status),
            snippet: res.json
              ? JSON.stringify(res.json).slice(0, 120)
              : (res.error || res.text || '').slice(0, 120),
          });
        });
      });
    });
    return chain.then(function () { return results; });
  }

  function runOpenApiSweep(api) {
    return api.call({ method: 'GET', path: '/openapi.json', timeout_ms: 45000 }).then(function (specRes) {
      if (!specRes.ok || !specRes.json) {
        return { error: 'openapi failed (' + specRes.status + ')', results: [], skipped: [] };
      }
      var paths = specRes.json.paths || {};
      var targets = [];
      var skipped = [];
      Object.keys(paths).forEach(function (path) {
        var methods = paths[path];
        if (!methods.get) return;
        if (/\{[^}]+\}/.test(path)) {
          skipped.push(path);
          return;
        }
        targets.push(path);
      });

      var results = [];
      var index = 0;
      var CONCURRENCY = 4;

      function worker() {
        if (index >= targets.length) return Promise.resolve();
        var path = targets[index++];
        return api.call({ method: 'GET', path: path, timeout_ms: 25000 }).then(function (res) {
          results.push({
            path: path,
            status: res.status,
            ms: res.elapsed_ms,
            category: categorize(res.status),
          });
          return worker();
        });
      }

      var workers = [];
      for (var i = 0; i < CONCURRENCY; i++) workers.push(worker());
      return Promise.all(workers).then(function () {
        var counts = {};
        results.forEach(function (r) {
          counts[r.category] = (counts[r.category] || 0) + 1;
        });
        return {
          version: (specRes.json.info && specRes.json.info.version) || '?',
          ops: Object.keys(paths).length,
          results: results,
          skipped: skipped,
          counts: counts,
        };
      });
    });
  }

  function versionDrift(api) {
    return Promise.all([
      api.call({ method: 'GET', path: '/openapi.json', timeout_ms: 30000 }),
      api.call({ method: 'GET', path: '/', timeout_ms: 20000 }),
      api.call({ method: 'GET', path: '/health', timeout_ms: 20000 }),
    ]).then(function (rows) {
      return {
        openapi: rows[0].json && rows[0].json.info ? rows[0].json.info.version : null,
        root: rows[1].json ? rows[1].json.version : null,
        health: rows[2].json ? rows[2].json.version : null,
        healthStatus: rows[2].json || null,
      };
    });
  }

  global.AnyoHealth = {
    CORE_GETS: CORE_GETS,
    KNOWN_GAPS: KNOWN_GAPS,
    categorize: categorize,
    runCoreProbe: runCoreProbe,
    runOpenApiSweep: runOpenApiSweep,
    versionDrift: versionDrift,
  };
})(typeof window !== 'undefined' ? window : globalThis);
