/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.
*/
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var api = window.AnyoApi;
  var auth = window.AnyoAuth;
  var health = window.AnyoHealth;

  var state = {
    user: null,
    boardsPayload: null,
    selection: null,
    chapters: [],
    chapter: null,
    liveCounts: {},
    questions: [],
    qOffset: 0,
    qTotal: 0,
    qExcluded: null,
    quiz: null,
    practice: null,
  };

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 3200);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Every request funnels through here, so a 401 surfaces the credential bar
     once, from one place, rather than each caller inventing its own copy. */
  function call(spec) {
    return api.call(spec).then(function (res) {
      if (res && res.status === 401) handleUnauthorized(res);
      return res;
    });
  }

  function subjectLabel(sub) {
    return sub.label || sub.subject_id || '';
  }

  /* ── boot ───────────────────────────────────────────────────────── */

  function boot(user) {
    state.user = user;
    $('appShell').hidden = false;
    $('room').hidden = false;
    $('signedAs').textContent = 'Signed in as ' + auth.labelFor(user);
    $('apiBaseLabel').textContent = api.base().replace('https://', '');
    $('btnLogout').onclick = function () {
      auth.logout();
      location.reload();
    };
    wireApiToken();
    loadBoards();
  }

  /* ── Education API credential ───────────────────────────────────────
     Signing into this UI is not the same as holding an API token, and the
     two being conflated is what makes a 401 here so confusing. The pill
     states plainly whether a token is present. */
  function refreshTokenPill() {
    var has = !!api.token();
    $('tokenPill').hidden = has;
    $('btnToken').textContent = has ? 'API token ✓' : 'API token';
  }

  function showTokenBar(message) {
    $('tokenBar').hidden = false;
    $('apiToken').value = api.token();
    $('tokenNote').textContent = message
      || 'Ask an operator for a client JWT. It is kept in this tab only, never stored in the site.';
  }

  function wireApiToken() {
    refreshTokenPill();
    $('btnToken').onclick = function () {
      if ($('tokenBar').hidden) showTokenBar();
      else $('tokenBar').hidden = true;
    };
    $('btnTokenSave').onclick = function () {
      api.setToken($('apiToken').value.trim());
      $('tokenBar').hidden = true;
      refreshTokenPill();
      location.reload();
    };
    $('btnTokenClear').onclick = function () {
      api.setToken('');
      $('apiToken').value = '';
      refreshTokenPill();
      showTokenBar('Token cleared.');
    };
    if (!api.token()) showTokenBar('This API needs a client token. Signing in above does not provide one.');
  }

  /* Called by any request path that sees a 401. */
  function handleUnauthorized(res) {
    var detail = (res && res.body && res.body.detail) || '';
    showTokenBar(
      api.token()
        ? 'The API rejected this token (401). ' + (detail
            || 'It was probably minted with a different signing secret than the server uses.')
        : 'This API needs a client token. Signing in above does not provide one.'
    );
    refreshTokenPill();
  }

  /* ── class picker ───────────────────────────────────────────────── */

  function loadBoards() {
    $('filterStatus').textContent = 'Loading catalogue…';
    return call({ method: 'GET', path: '/v1/boards', timeout_ms: 30000 }).then(function (res) {
      if (!res.ok || !res.json) {
        $('filterStatus').textContent = 'Catalogue failed (' + res.status + ')';
        return;
      }
      state.boardsPayload = res.json;
      fillBoards();
      applySelection();
    });
  }

  function fillBoards() {
    var sel = $('selBoard');
    sel.innerHTML = '';
    (state.boardsPayload.boards || []).forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.board;
      o.textContent = b.board;
      sel.appendChild(o);
    });
    fillGrades();
  }

  function currentBoard() {
    var id = $('selBoard').value;
    return (state.boardsPayload.boards || []).find(function (b) { return b.board === id; });
  }

  function fillGrades() {
    var board = currentBoard();
    var sel = $('selGrade');
    sel.innerHTML = '';
    (board && board.grades || []).forEach(function (g) {
      var o = document.createElement('option');
      o.value = g.grade;
      o.textContent = 'Class ' + g.grade;
      sel.appendChild(o);
    });
    ['12', '10', '11'].some(function (p) {
      if ([].some.call(sel.options, function (o) { return o.value === p; })) {
        sel.value = p;
        return true;
      }
      return false;
    });
    fillStreams();
  }

  function currentGrade() {
    var board = currentBoard();
    var g = $('selGrade').value;
    return (board && board.grades || []).find(function (x) { return x.grade === g; });
  }

  function fillStreams() {
    var grade = currentGrade();
    var sel = $('selStream');
    sel.innerHTML = '';
    (grade && grade.streams || []).forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.stream;
      o.textContent = (s.label || s.stream) + (s.chapter_count != null ? ' · ' + s.chapter_count + ' ch' : '');
      sel.appendChild(o);
    });
    if ([].some.call(sel.options, function (o) { return o.value === 'science'; })) sel.value = 'science';
    fillSubjects();
  }

  function currentStream() {
    var grade = currentGrade();
    var s = $('selStream').value;
    return (grade && grade.streams || []).find(function (x) { return x.stream === s; });
  }

  function fillSubjects() {
    var stream = currentStream();
    var sel = $('selSubject');
    sel.innerHTML = '';
    (stream && stream.subjects || []).forEach(function (sub) {
      var o = document.createElement('option');
      o.value = sub.subject_id;
      o.textContent = subjectLabel(sub) + (sub.chapter_count != null ? ' · ' + sub.chapter_count + ' ch' : '');
      sel.appendChild(o);
    });
    if ([].some.call(sel.options, function (o) { return o.value === 'physics'; })) sel.value = 'physics';
  }

  function applySelection() {
    var stream = currentStream();
    var sub = (stream && stream.subjects || []).find(function (s) {
      return s.subject_id === $('selSubject').value;
    });
    if (!stream || !sub) {
      $('filterStatus').textContent = 'Incomplete selection';
      return;
    }
    state.selection = {
      board: $('selBoard').value,
      grade: $('selGrade').value,
      stream: stream.stream,
      subject: sub.subject_id,
      subjectLabel: subjectLabel(sub),
      sku: stream.sku || '',
    };
    state.liveCounts = {};
    state.questions = [];
    state.qOffset = 0;
    $('roomTitle').textContent = state.selection.subjectLabel;
    $('roomMeta').textContent =
      state.selection.board + ' · Class ' + state.selection.grade +
      ' · ' + state.selection.stream +
      (state.selection.sku ? ' · ' + state.selection.sku : '') +
      ' — live bank size from /v1/questions';
    $('filterStatus').textContent = state.selection.subjectLabel;
    $('chatLog').innerHTML = '';
    pushChatMeta('Tutor ready for ' + state.selection.subjectLabel + '.');
    loadChapters().then(function () {
      if (!$('pane-atlas').hidden) refreshAtlas();
      if (!$('pane-drill').hidden) resetAndLoadQuestions();
    });
  }

  /* ── chapters ───────────────────────────────────────────────────── */

  function loadChapters() {
    var s = state.selection;
    $('chapterList').innerHTML = '<p class="muted">Loading…</p>';
    return call({
      method: 'GET', path: '/v1/chapters', timeout_ms: 30000,
      query: { board: s.board, grade: s.grade, stream: s.stream, subject: s.subject },
    }).then(function (res) {
      if (!res.ok) {
        $('chapterList').innerHTML = '<p class="muted">Failed (' + res.status + ').</p>';
        return;
      }
      state.chapters = res.json.chapters || [];
      $('chapterCount').textContent = state.chapters.length;
      renderChapters();
      if (state.chapters.length) selectChapter(state.chapters[0], true);
    });
  }

  function chapterMetaText(ch) {
    var live = state.liveCounts[ch.id];
    if (live != null) return live + ' live';
    if (ch.question_count != null) return ch.question_count + ' q (hint)';
    return ch.id;
  }

  function renderChapters() {
    var host = $('chapterList');
    host.innerHTML = '';
    state.chapters.forEach(function (ch) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter' + (state.chapter && state.chapter.id === ch.id ? ' is-active' : '');
      btn.innerHTML =
        '<span class="chapter-title">' + esc(ch.title || ch.id) + '</span>' +
        '<span class="chapter-meta">' + esc(chapterMetaText(ch)) + '</span>';
      btn.addEventListener('click', function () { selectChapter(ch); });
      host.appendChild(btn);
    });
  }

  function selectChapter(ch, silent) {
    state.chapter = ch;
    renderChapters();
    $('quizTopic').value = ch.title || '';
    renderAtlas();
    if (!$('pane-drill').hidden) resetAndLoadQuestions();
    if (!silent && !$('pane-tutor').hidden) pushChatMeta('Chapter: ' + (ch.title || ch.id));
  }

  /* ── Atlas ──────────────────────────────────────────────────────── */

  function refreshAtlas() {
    if (!state.selection || !state.chapters.length) return;
    $('atlasStatus').textContent = 'Sampling live totals (one call per chapter)…';
    var s = state.selection;
    var i = 0;
    state.liveCounts = {};

    function next() {
      if (i >= state.chapters.length) {
        $('atlasStatus').textContent =
          'Live totals loaded for ' + state.chapters.length + ' chapters · disc area ∝ questions';
        renderChapters();
        renderAtlas();
        return;
      }
      var ch = state.chapters[i++];
      $('atlasStatus').textContent = 'Live count ' + i + '/' + state.chapters.length + ' · ' + (ch.title || ch.id);
      call({
        method: 'GET', path: '/v1/questions', timeout_ms: 30000,
        query: {
          board: s.board, grade: s.grade, stream: s.stream, subject: s.subject,
          chapter: ch.id, limit: '1',
        },
      }).then(function (res) {
        state.liveCounts[ch.id] = res.ok && res.json ? (res.json.total || 0) : 0;
        renderAtlas();
        next();
      });
    }
    next();
  }

  function renderAtlas() {
    var host = $('atlasSky');
    host.innerHTML = '';
    if (!state.chapters.length) return;
    var max = 1;
    state.chapters.forEach(function (ch) {
      var n = state.liveCounts[ch.id];
      if (n == null) n = ch.question_count || 0;
      if (n > max) max = n;
    });
    var golden = Math.PI * (3 - Math.sqrt(5));
    state.chapters.forEach(function (ch, idx) {
      var n = state.liveCounts[ch.id];
      var usingLive = n != null;
      if (n == null) n = ch.question_count || 0;
      var t = idx / Math.max(state.chapters.length - 1, 1);
      var r = 18 + Math.sqrt(Math.max(n, 0) / max) * 42;
      var angle = idx * golden;
      var radius = 12 + t * 38;
      var x = 50 + Math.cos(angle) * radius;
      var y = 50 + Math.sin(angle) * radius * 0.78;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'atlas-node' + (state.chapter && state.chapter.id === ch.id ? ' is-active' : '');
      btn.style.left = x + '%';
      btn.style.top = y + '%';
      btn.style.width = r + 'px';
      btn.style.height = r + 'px';
      btn.title = (ch.title || ch.id) + ' — ' + n + (usingLive ? ' live' : ' hint');
      btn.innerHTML = '<span>' + esc((ch.title || ch.id).split(' ').slice(0, 2).join(' ')) +
        '</span><small>' + n + (usingLive ? '' : '?') + '</small>';
      btn.addEventListener('click', function () { selectChapter(ch); switchMode('drill'); });
      host.appendChild(btn);
    });
  }

  /* ── Reality scan ───────────────────────────────────────────────── */

  function realityScan() {
    if (!state.selection || !state.chapters.length) return;
    var s = state.selection;
    var tbody = $('realityTable').querySelector('tbody');
    tbody.innerHTML = '';
    $('realityStatus').textContent = 'Scanning…';
    var i = 0;
    var stale = 0, empty = 0, ok = 0;

    function next() {
      if (i >= state.chapters.length) {
        $('realityStatus').textContent =
          'Done · ' + ok + ' aligned, ' + stale + ' stale hints, ' + empty + ' empty banks';
        return;
      }
      var ch = state.chapters[i++];
      call({
        method: 'GET', path: '/v1/questions', timeout_ms: 30000,
        query: {
          board: s.board, grade: s.grade, stream: s.stream, subject: s.subject,
          chapter: ch.id, limit: '1',
        },
      }).then(function (res) {
        var live = res.ok && res.json ? (res.json.total || 0) : -1;
        var hint = ch.question_count == null ? 0 : ch.question_count;
        var excl = res.json && res.json.excluded
          ? 'u=' + (res.json.excluded.unrenderable || 0) + ' d=' + (res.json.excluded.duplicate || 0)
          : '—';
        var verdict, cls;
        if (live < 0) { verdict = 'error'; cls = 'verdict-empty'; }
        else if (hint === 0 && live === 0) { verdict = 'empty bank'; cls = 'verdict-empty'; empty++; }
        else if (hint === 0 && live > 0) { verdict = 'stale hint'; cls = 'verdict-stale'; stale++; }
        else if (hint > 0 && live === 0) { verdict = 'hint>live'; cls = 'verdict-stale'; stale++; }
        else { verdict = 'aligned'; cls = 'verdict-ok'; ok++; }
        state.liveCounts[ch.id] = Math.max(live, 0);

        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + esc(ch.title || ch.id) + '</td>' +
          '<td>' + hint + '</td>' +
          '<td>' + (live < 0 ? '—' : live) + '</td>' +
          '<td>' + esc(excl) + '</td>' +
          '<td class="' + cls + '">' + verdict + '</td>';
        tbody.appendChild(tr);
        $('realityStatus').textContent = 'Scanning ' + i + '/' + state.chapters.length + '…';
        next();
      });
    }
    next();
  }

  /* ── Tutor ──────────────────────────────────────────────────────── */

  function pushChat(role, text) {
    var div = document.createElement('div');
    div.className = 'bubble bubble--' + role;
    div.textContent = text;
    $('chatLog').appendChild(div);
    $('chatLog').scrollTop = $('chatLog').scrollHeight;
  }

  function pushChatMeta(text) {
    var div = document.createElement('div');
    div.className = 'bubble bubble--meta';
    div.textContent = text;
    $('chatLog').appendChild(div);
  }

  function sendChat(ev) {
    ev.preventDefault();
    var msg = $('chatInput').value.trim();
    if (!msg || !state.selection) return;
    var s = state.selection;
    pushChat('user', msg);
    $('chatInput').value = '';
    $('chatSend').disabled = true;
    pushChatMeta('Thinking…');

    var context = {
      board: s.board, subject: s.subjectLabel, grade: String(s.grade), smart_board: true,
    };
    if (state.chapter) {
      context.topic = state.chapter.title || state.chapter.id;
      context.chapter = state.chapter.id;
    }

    call({
      method: 'POST', path: '/actors/chat', timeout_ms: 120000,
      body: { actor: $('chatActor').value, message: msg, context: context },
    }).then(function (res) {
      $('chatSend').disabled = false;
      var log = $('chatLog');
      if (log.lastChild && log.lastChild.classList.contains('bubble--meta')) log.removeChild(log.lastChild);
      if (!res.ok) {
        pushChat('ai', 'Failed (' + res.status + '). ' + (res.error || JSON.stringify(res.json || {})));
        return;
      }
      var j = res.json || {};
      pushChat('ai', j.answer || j.lesson_plan || j.content || JSON.stringify(j, null, 2));
    });
  }

  /* ── Questions ──────────────────────────────────────────────────── */

  function resetAndLoadQuestions() {
    state.questions = [];
    state.qOffset = 0;
    state.qTotal = 0;
    $('questionList').innerHTML = '';
    loadQuestions();
  }

  function loadQuestions() {
    if (!state.selection) return;
    var s = state.selection;
    $('drillStats').textContent = 'Loading…';
    var query = {
      board: s.board, grade: s.grade, stream: s.stream, subject: s.subject,
      limit: '20', offset: String(state.qOffset),
    };
    if (state.chapter) query.chapter = state.chapter.id;
    return call({ method: 'GET', path: '/v1/questions', query: query, timeout_ms: 45000 }).then(function (res) {
      if (!res.ok) {
        $('drillStats').textContent = 'Failed (' + res.status + ')';
        return;
      }
      var page = res.json;
      state.qTotal = page.total || 0;
      state.qExcluded = page.excluded || null;
      state.questions = state.questions.concat(page.questions || []);
      state.qOffset += (page.limit || 20);
      renderQuestions();
    });
  }

  function renderQuestions() {
    var hideFig = $('filterNoFigure').checked;
    var objOnly = $('filterObjective').checked;
    var shown = state.questions.filter(function (q) {
      if (hideFig && q.has_figure) return false;
      if (objOnly && !q.is_objective) return false;
      return true;
    });
    var host = $('questionList');
    host.innerHTML = '';
    if (!shown.length) {
      host.innerHTML = '<p class="muted">No questions match filters. Class XII has almost no objective items — try Generate paper in Quiz.</p>';
    }
    shown.forEach(function (q) {
      var card = document.createElement('article');
      card.className = 'q-card';
      var tags = ['<span class="tag">' + esc(q.type || 'UNSPECIFIED') + '</span>'];
      if (q.declared_type && q.declared_type !== q.type) {
        tags.push('<span class="tag tag--warn">declared ' + esc(q.declared_type) + '</span>');
      }
      if (q.pool) tags.push('<span class="tag tag--muted">' + esc(q.pool) + '</span>');
      if (q.has_figure) tags.push('<span class="tag tag--warn">figure</span>');
      if (q.answer_available) tags.push('<span class="tag">self-check available</span>');
      var opts = '';
      if (q.options && q.options.length) {
        opts = '<ol class="opts">' + q.options.map(function (o) {
          return '<li>' + esc(typeof o === 'string' ? o : (o.text || JSON.stringify(o))) + '</li>';
        }).join('') + '</ol>';
      }
      card.innerHTML =
        '<div class="q-meta">' + tags.join('') + '</div>' +
        '<h3>' + esc(q.prompt || '(empty)') + '</h3>' + opts;
      host.appendChild(card);
    });
    var excl = state.qExcluded
      ? ' · withheld u=' + (state.qExcluded.unrenderable || 0) + ' d=' + (state.qExcluded.duplicate || 0)
      : '';
    $('drillStats').textContent =
      'Showing ' + shown.length + ' of ' + state.questions.length + ' loaded · bank total ' + state.qTotal + excl;
    $('loadMoreQ').disabled = state.qOffset >= state.qTotal;
  }

  /* ── Quiz ───────────────────────────────────────────────────────── */

  function updateQuizBlurb() {
    if (!state.selection) return;
    $('quizSetupNote').textContent = String(state.selection.grade) === '12'
      ? 'Class XII has ~0 objective board questions. Prefer Generate paper.'
      : 'Class X has usable objective items — try From board bank.';
  }

  function quizFromBank() {
    var want = parseInt($('quizCount').value, 10) || 5;
    var s = state.selection;
    var collected = [];
    var offset = 0;
    var total = Infinity;
    $('quizSetupNote').textContent = 'Scanning bank…';

    function page() {
      if (collected.length >= want || offset >= total) {
        var items = collected.slice(0, want).map(function (q) {
          return {
            kind: 'mcq',
            prompt: q.prompt,
            options: q.options.map(function (o) {
              return typeof o === 'string' ? o : (o.text || String(o));
            }),
            id: q.id,
          };
        });
        if (!items.length) {
          $('quizSetupNote').textContent = 'No objective questions — use Generate paper.';
          return;
        }
        startQuiz(items);
        return;
      }
      var query = {
        board: s.board, grade: s.grade, stream: s.stream, subject: s.subject,
        limit: '50', offset: String(offset),
      };
      if (state.chapter) query.chapter = state.chapter.id;
      call({ method: 'GET', path: '/v1/questions', query: query, timeout_ms: 45000 }).then(function (res) {
        if (!res.ok) { $('quizSetupNote').textContent = 'Bank fetch failed.'; return; }
        total = res.json.total || 0;
        (res.json.questions || []).forEach(function (q) {
          if (q.is_objective && q.options && q.options.length && !q.has_figure) collected.push(q);
        });
        offset += res.json.limit || 50;
        page();
      });
    }
    page();
  }

  function quizGenerate() {
    var s = state.selection;
    var topic = $('quizTopic').value.trim() || (state.chapter && state.chapter.title) || s.subjectLabel;
    $('quizGenerate').disabled = true;
    $('quizSetupNote').textContent = 'Generating… up to ~90s';
    call({
      method: 'POST', path: '/exams/generate', timeout_ms: 150000,
      body: {
        subject: s.subjectLabel, topic: topic, board: s.board,
        grade: String(s.grade), difficulty: 'medium',
        count: parseInt($('quizCount').value, 10) || 5,
      },
    }).then(function (res) {
      $('quizGenerate').disabled = false;
      if (!res.ok) { $('quizSetupNote').textContent = 'Generate failed (' + res.status + ').'; return; }
      $('quizSetup').hidden = true;
      $('quizRun').hidden = true;
      $('quizGenerated').hidden = false;
      $('quizGenerated').textContent = res.json.content || res.json.answer || JSON.stringify(res.json, null, 2);
    });
  }

  function startQuiz(items) {
    state.quiz = { items: items, index: 0, picks: [] };
    $('quizSetup').hidden = true;
    $('quizGenerated').hidden = true;
    $('quizRun').hidden = false;
    renderQuizCard();
  }

  function renderQuizCard() {
    var qz = state.quiz;
    var item = qz.items[qz.index];
    $('quizProgress').textContent = 'Question ' + (qz.index + 1) + ' of ' + qz.items.length;
    $('quizPrev').disabled = qz.index === 0;
    $('quizNext').textContent = qz.index === qz.items.length - 1 ? 'Finish' : 'Next';
    var host = $('quizCard');
    host.innerHTML = '<h3>' + esc(item.prompt) + '</h3>';
    (item.options || []).forEach(function (opt, oi) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt-btn' + (qz.picks[qz.index] === oi ? ' is-picked' : '');
      b.textContent = opt;
      b.addEventListener('click', function () { qz.picks[qz.index] = oi; renderQuizCard(); });
      host.appendChild(b);
    });
    var note = document.createElement('p');
    note.className = 'muted';
    note.style.marginTop = '0.8rem';
    note.textContent = 'API does not return answer keys — choices are recorded locally only.';
    host.appendChild(note);
  }

  function quizNext() {
    var qz = state.quiz;
    if (qz.index >= qz.items.length - 1) {
      var answered = qz.picks.filter(function (p) { return p != null; }).length;
      toast('Quiz complete — ' + answered + '/' + qz.items.length + ' answered');
      quizExit();
      return;
    }
    qz.index += 1;
    renderQuizCard();
  }

  function quizPrev() {
    if (!state.quiz || state.quiz.index === 0) return;
    state.quiz.index -= 1;
    renderQuizCard();
  }

  function quizExit() {
    state.quiz = null;
    $('quizRun').hidden = true;
    $('quizGenerated').hidden = true;
    $('quizSetup').hidden = false;
  }

  /* ── Practice / plan ────────────────────────────────────────────── */

  function startPractice(ev) {
    ev.preventDefault();
    var s = state.selection;
    $('practicePanel').hidden = false;
    $('practicePanel').innerHTML = '<p class="muted">Starting…</p>';
    call({
      method: 'POST', path: '/practice/start', timeout_ms: 90000,
      body: {
        subject: s.subjectLabel, grade: String(s.grade), board: s.board, track: 'cbse',
        count: parseInt($('practiceCount').value, 10) || 5,
        difficulty: $('practiceDiff').value, actor: 'student',
        session_kind: 'practice', evaluation_mode: 'computer',
        student_name: $('practiceName').value.trim(),
        topic: (state.chapter && state.chapter.title) || 'General',
      },
    }).then(function (res) {
      if (!res.ok) {
        $('practicePanel').innerHTML = '<p>Failed (' + res.status + ')</p><pre class="generated">' +
          esc(JSON.stringify(res.json || res.error, null, 2)) + '</pre>';
        return;
      }
      var session = res.json;
      var qs = session.questions || session.items || [];
      var html = '<p><strong>Session</strong> ' + esc(session.id || '') +
        ' · ' + esc(String(session.grade || '')) + ' · ' + esc(session.subject || '') + '</p>';
      if (!qs.length) {
        html += '<pre class="generated" style="max-height:420px;overflow:auto">' +
          esc(JSON.stringify(session, null, 2)) + '</pre>';
      } else {
        qs.forEach(function (q, i) {
          html += '<div class="practice-q"><span class="tag">Q' + (i + 1) + '</span>' +
            '<h3 style="margin:0.4rem 0 0;font-size:1rem;white-space:pre-wrap">' +
            esc(q.prompt || q.question || q.text || JSON.stringify(q)) + '</h3></div>';
        });
      }
      $('practicePanel').innerHTML = html;
    });
  }

  function makePlan(ev) {
    ev.preventDefault();
    var s = state.selection;
    var objs = $('planObjectives').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!objs.length && state.chapter) objs = [state.chapter.title];
    if (!objs.length) objs = [s.subjectLabel];
    $('planOut').hidden = false;
    $('planOut').textContent = 'Generating…';
    call({
      method: 'POST', path: '/teacher/plan', timeout_ms: 120000,
      body: {
        subject: s.subjectLabel, grade: String(s.grade),
        duration_minutes: parseInt($('planMins').value, 10) || 45,
        objectives: objs, smart_board: true,
      },
    }).then(function (res) {
      $('planOut').textContent = res.ok
        ? (res.json.lesson_plan || res.json.content || JSON.stringify(res.json, null, 2))
        : 'Failed (' + res.status + ')';
    });
  }

  /* ── Simple Health (8787-style, lighter) ────────────────────────── */

  function pillClass(category) {
    if (category === 'OK') return 'pill pill--ok';
    if (category === 'SERVER_ERROR' || category === 'NETWORK') return 'pill pill--err';
    return 'pill pill--warn';
  }

  function runHealthCheck() {
    $('btnHealthCheck').disabled = true;
    $('healthState').textContent = 'Checking…';
    $('healthSummary').innerHTML = '';
    $('healthResults').innerHTML = '';

    Promise.all([
      health.versionDrift(api),
      health.runCoreProbe(api),
    ]).then(function (pair) {
      var versions = pair[0];
      var rows = pair[1];
      var counts = {};
      rows.forEach(function (r) { counts[r.category] = (counts[r.category] || 0) + 1; });

      var order = ['OK', 'AUTH', 'FORBIDDEN', 'NOT_FOUND', 'SERVER_ERROR', 'NETWORK', 'OTHER'];
      $('healthSummary').innerHTML =
        '<div class="stat"><b>' + esc(versions.health || '?') + '</b><span>/health</span></div>' +
        '<div class="stat"><b>' + esc(versions.root || '?') + '</b><span>service</span></div>' +
        '<div class="stat"><b>' + esc(versions.openapi || '?') + '</b><span>openapi</span></div>' +
        order.filter(function (k) { return counts[k]; }).map(function (k) {
          var tone = k === 'OK' ? 'ok' : (k === 'SERVER_ERROR' || k === 'NETWORK' ? 'err' : 'warn');
          return '<div class="stat stat--' + tone + '"><b>' + counts[k] + '</b><span>' + k + '</span></div>';
        }).join('');

      var hs = versions.healthStatus || {};
      var degraded = hs.degraded ? ' · degraded' : '';
      var groups = {};
      rows.forEach(function (r) {
        (groups[r.category] = groups[r.category] || []).push(r);
      });

      var html = '<div class="health-group"><h4>Service</h4>' +
        '<div class="pulse-row"><span class="pill pill--ok">' +
        (hs.status || 'n/a') + '</span><code>education-portal' + degraded +
        '</code><span class="muted"></span></div></div>';

      order.forEach(function (cat) {
        if (!groups[cat]) return;
        html += '<div class="health-group"><h4>' + cat + ' · ' + groups[cat].length + '</h4>';
        groups[cat].forEach(function (r) {
          html += '<div class="pulse-row"><span class="' + pillClass(cat) + '">' +
            (r.status || 'ERR') + '</span><code>' + esc(r.path) +
            '</code><span class="muted">' + (r.ms != null ? r.ms + 'ms' : '') +
            '</span></div>';
        });
        html += '</div>';
      });

      $('healthResults').innerHTML = html;
      $('healthState').textContent = 'Done · ' + rows.length + ' endpoints';
      $('btnHealthCheck').disabled = false;
    }).catch(function (err) {
      $('healthState').textContent = String(err.message || err);
      $('btnHealthCheck').disabled = false;
    });
  }

  /* ── modes ──────────────────────────────────────────────────────── */

  function switchMode(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.classList.toggle('is-active', b.dataset.mode === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.pane'), function (p) {
      var on = p.id === 'pane-' + name;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    if (name === 'drill' && state.selection && !state.questions.length) resetAndLoadQuestions();
    if (name === 'quiz') updateQuizBlurb();
    if (name === 'atlas') renderAtlas();
    if (name === 'health' && !$('healthResults').innerHTML) runHealthCheck();
  }

  function init() {
    auth.mountGate(boot);

    $('selBoard').addEventListener('change', function () { fillGrades(); applySelection(); });
    $('selGrade').addEventListener('change', function () { fillStreams(); applySelection(); });
    $('selStream').addEventListener('change', function () { fillSubjects(); applySelection(); });
    $('selSubject').addEventListener('change', applySelection);
    $('classForm').addEventListener('submit', function (e) { e.preventDefault(); applySelection(); });

    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.addEventListener('click', function () { switchMode(b.dataset.mode); });
    });

    $('btnRefreshAtlas').addEventListener('click', refreshAtlas);
    $('btnRealityScan').addEventListener('click', realityScan);
    $('chatForm').addEventListener('submit', sendChat);
    $('filterNoFigure').addEventListener('change', renderQuestions);
    $('filterObjective').addEventListener('change', renderQuestions);
    $('loadMoreQ').addEventListener('click', loadQuestions);
    $('quizFromBank').addEventListener('click', quizFromBank);
    $('quizGenerate').addEventListener('click', quizGenerate);
    $('quizNext').addEventListener('click', quizNext);
    $('quizPrev').addEventListener('click', quizPrev);
    $('quizExit').addEventListener('click', quizExit);
    $('practiceForm').addEventListener('submit', startPractice);
    $('planForm').addEventListener('submit', makePlan);
    $('btnHealthCheck').addEventListener('click', runHealthCheck);
  }

  init();
})();
