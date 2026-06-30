/**
 * Brahmando Practice Test Studio — student panel overlay
 * Loaded by education-portal.js when student requests a practice test.
 */
(function (global) {
  'use strict';

  function PracticeStudio(config) {
    this.apiUrl = (config.apiUrl || '').replace(/\/$/, '');
    this.embedKey = config.embedKey || '';
    this.primary = config.primaryColor || '#0d9488';
    this.onClose = config.onClose || function () {};
    this.session = null;
    this.step = 'setup';
    this.overlay = null;
  }

  PracticeStudio.prototype.headers = function () {
    var h = { 'Content-Type': 'application/json' };
    if (this.embedKey) h['X-Education-Embed-Key'] = this.embedKey;
    return h;
  };

  PracticeStudio.prototype.open = function (defaults) {
    var self = this;
    defaults = defaults || {};
    if (this.overlay) this.overlay.remove();

    this.overlay = document.createElement('div');
    this.overlay.className = 'eps-overlay';
    this.overlay.innerHTML = this._shellHtml();
    document.body.appendChild(this.overlay);

    var style = document.createElement('style');
    style.textContent = this._css();
    this.overlay.appendChild(style);

    this._bindSetup(defaults);
    this._renderStep();
  };

  PracticeStudio.prototype.close = function () {
    if (this.overlay) this.overlay.remove();
    this.overlay = null;
    this.onClose();
  };

  PracticeStudio.prototype._css = function () {
    var p = this.primary;
    return (
      '.eps-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}' +
      '.eps-modal{width:min(920px,100%);max-height:92vh;background:linear-gradient(165deg,#fff 0%,#f8fafc 100%);border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.8)}' +
      '.eps-head{background:linear-gradient(135deg,' + p + ',#0f766e);color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:flex-start}' +
      '.eps-head h2{margin:0;font-size:1.25rem;font-weight:700}.eps-head p{margin:6px 0 0;opacity:.9;font-size:.85rem}' +
      '.eps-close{background:rgba(255,255,255,.2);border:none;color:#fff;width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:1.1rem}' +
      '.eps-steps{display:flex;gap:8px;padding:12px 24px;background:#f0fdfa;border-bottom:1px solid #ccfbf1}' +
      '.eps-step{flex:1;text-align:center;font-size:.75rem;padding:8px;border-radius:10px;color:#64748b;font-weight:600}' +
      '.eps-step.active{background:' + p + ';color:#fff}.eps-step.done{background:#99f6e4;color:#115e59}' +
      '.eps-body{flex:1;overflow-y:auto;padding:24px}' +
      '.eps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}' +
      '.eps-field label{display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}' +
      '.eps-field input,.eps-field select{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:.9rem}' +
      '.eps-btn{background:' + p + ';color:#fff;border:none;padding:12px 20px;border-radius:12px;font-weight:600;cursor:pointer;font-size:.9rem}' +
      '.eps-btn.secondary{background:#e2e8f0;color:#334155}.eps-btn:disabled{opacity:.5;cursor:not-allowed}' +
      '.eps-qcard{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.04)}' +
      '.eps-qnum{font-size:.7rem;font-weight:700;color:' + p + ';text-transform:uppercase;margin-bottom:6px}' +
      '.eps-qtext{font-size:.95rem;color:#1e293b;margin-bottom:12px;line-height:1.5}' +
      '.eps-opt{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:6px;cursor:pointer}' +
      '.eps-opt:hover{border-color:' + p + '}.eps-opt input{margin:0}' +
      '.eps-textarea{width:100%;min-height:80px;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:.9rem;resize:vertical}' +
      '.eps-result-eval{border-left:4px solid #22c55e;background:#f0fdf4;padding:14px;border-radius:0 12px 12px 0;margin-bottom:12px}' +
      '.eps-result-pending{border-left:4px solid #f59e0b;background:#fffbeb;padding:14px;border-radius:0 12px 12px 0;margin-bottom:12px}' +
      '.eps-score{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px}' +
      '.eps-score-card{flex:1;min-width:120px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;text-align:center}' +
      '.eps-score-card strong{display:block;font-size:1.75rem;color:' + p + '}' +
      '.eps-foot{padding:16px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;gap:12px;background:#fafafa}' +
      '.eps-loading{text-align:center;padding:40px;color:#64748b}'
    );
  };

  PracticeStudio.prototype._shellHtml = function () {
    return (
      '<div class="eps-modal">' +
      '<div class="eps-head"><div><h2>📝 Practice Test Studio</h2><p>RAG-grounded questions · Submit for evaluation</p></div>' +
      '<button type="button" class="eps-close" aria-label="Close">✕</button></div>' +
      '<div class="eps-steps">' +
      '<div class="eps-step" data-step="setup">1 · Configure</div>' +
      '<div class="eps-step" data-step="answer">2 · Answer</div>' +
      '<div class="eps-step" data-step="results">3 · Results</div></div>' +
      '<div class="eps-body eps-content"></div>' +
      '<div class="eps-foot eps-footer"></div></div>'
    );
  };

  PracticeStudio.prototype._el = function (sel) {
    return this.overlay.querySelector(sel);
  };

  PracticeStudio.prototype._renderStep = function () {
    var steps = this.overlay.querySelectorAll('.eps-step');
    steps.forEach(function (s) {
      var n = s.dataset.step;
      s.classList.remove('active', 'done');
      if (n === this.step) s.classList.add('active');
      else if (['setup', 'answer', 'results'].indexOf(n) < ['setup', 'answer', 'results'].indexOf(this.step)) s.classList.add('done');
    }, this);

    if (this.step === 'setup') this._renderSetup();
    else if (this.step === 'answer') this._renderAnswer();
    else if (this.step === 'results') this._renderResults();
  };

  PracticeStudio.prototype._bindSetup = function (defaults) {
    var self = this;
    this.defaults = defaults;
    this._el('.eps-close').onclick = function () { self.close(); };
  };

  PracticeStudio.prototype._renderSetup = function () {
    var d = this.defaults || {};
    this._el('.eps-content').innerHTML =
      '<p style="color:#64748b;margin:0 0 16px">Questions are drawn from our verified knowledge base. Evaluation uses only RAG data — uncertain answers are flagged for teacher review.</p>' +
      '<div class="eps-grid">' +
      this._field('subject', 'Subject', d.subject || 'Science') +
      this._field('topic', 'Topic', d.topic || 'General') +
      this._field('board', 'Board', d.board || 'CBSE') +
      this._field('grade', 'Grade', d.grade || '10') +
      '<div class="eps-field"><label>Questions</label><select id="eps-count"><option>3</option><option selected>5</option><option>8</option><option>10</option></select></div>' +
      '<div class="eps-field"><label>Difficulty</label><select id="eps-diff"><option>easy</option><option selected>medium</option><option>hard</option></select></div>' +
      '</div>';
    var sel = this._el('#eps-count');
    if (sel && d.count) sel.value = String(Math.min(10, d.count));

    var self = this;
    this._el('.eps-footer').innerHTML = '<span></span><button type="button" class="eps-btn" id="eps-start">Start practice test →</button>';
    this._el('#eps-start').onclick = function () { self._startTest(); };
  };

  PracticeStudio.prototype._field = function (id, label, val) {
    return '<div class="eps-field"><label>' + label + '</label><input id="eps-' + id + '" value="' + String(val).replace(/"/g, '&quot;') + '"/></div>';
  };

  PracticeStudio.prototype._startTest = function () {
    var self = this;
    var body = {
      actor: 'student',
      subject: this._el('#eps-subject').value,
      topic: this._el('#eps-topic').value,
      board: this._el('#eps-board').value,
      grade: this._el('#eps-grade').value,
      count: parseInt(this._el('#eps-count').value, 10) || 5,
      difficulty: this._el('#eps-diff').value,
    };
    this._el('.eps-content').innerHTML = '<div class="eps-loading">Building your test from knowledge base…</div>';
    this._el('.eps-footer').innerHTML = '';

    fetch(this.apiUrl + '/practice/start', { method: 'POST', headers: this.headers(), body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.detail || 'Could not start test');
        self.session = res.data;
        self.step = 'answer';
        self._renderStep();
      })
      .catch(function (e) {
        self._el('.eps-content').innerHTML = '<p style="color:#b91c1c">' + (e.message || 'Failed') + '</p>';
        self._el('.eps-footer').innerHTML = '<button type="button" class="eps-btn secondary eps-close2">Close</button>';
        self._el('.eps-close2').onclick = function () { self.close(); };
      });
  };

  PracticeStudio.prototype._renderAnswer = function () {
    var s = this.session;
    var html = '<p style="margin:0 0 16px;color:#64748b">' + s.board + ' · ' + s.subject + ' · ' + s.topic + ' · ' + s.question_count + ' questions</p>';
    var self = this;
    (s.questions || []).forEach(function (q, idx) {
      html += '<div class="eps-qcard" data-qid="' + q.id + '">';
      html += '<div class="eps-qnum">Question ' + (idx + 1) + ' · ' + (q.type || 'short').toUpperCase() + ' · ' + (q.marks || 1) + ' mark(s)</div>';
      html += '<div class="eps-qtext">' + self._esc(q.question) + '</div>';
      if (q.type === 'mcq' && q.options && q.options.length) {
        q.options.forEach(function (opt, oi) {
          html += '<label class="eps-opt"><input type="radio" name="q_' + q.id + '" value="' + self._esc(opt) + '"/> ' + self._esc(opt) + '</label>';
        });
      } else {
        html += '<textarea class="eps-textarea" data-qid="' + q.id + '" placeholder="Type your answer…"></textarea>';
      }
      html += '</div>';
    });
    this._el('.eps-content').innerHTML = html;
    this._el('.eps-footer').innerHTML =
      '<button type="button" class="eps-btn secondary" id="eps-back">← Back</button>' +
      '<button type="button" class="eps-btn" id="eps-submit">Submit for evaluation ✓</button>';
    this._el('#eps-back').onclick = function () { self.step = 'setup'; self._renderStep(); };
    this._el('#eps-submit').onclick = function () { self._submit(); };
  };

  PracticeStudio.prototype._collectAnswers = function () {
    var answers = {};
    (this.session.questions || []).forEach(function (q) {
      var radio = document.querySelector('input[name="q_' + q.id + '"]:checked');
      if (radio) answers[q.id] = radio.value;
      else {
        var ta = document.querySelector('textarea[data-qid="' + q.id + '"]');
        if (ta) answers[q.id] = ta.value;
      }
    });
    return answers;
  };

  PracticeStudio.prototype._submit = function () {
    var self = this;
    var answers = this._collectAnswers();
    this._el('.eps-content').innerHTML = '<div class="eps-loading">Evaluating using knowledge base only…</div>';
    this._el('.eps-footer').innerHTML = '';

    fetch(this.apiUrl + '/practice/' + this.session.id + '/submit', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ actor: 'student', answers: answers }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.detail || 'Evaluation failed');
        self.session.evaluation = res.data.evaluation;
        self.step = 'results';
        self._renderStep();
      })
      .catch(function (e) {
        self._el('.eps-content').innerHTML = '<p style="color:#b91c1c">' + (e.message || 'Failed') + '</p>';
      });
  };

  PracticeStudio.prototype._renderResults = function () {
    var ev = this.session.evaluation || {};
    var sum = ev.summary || {};
    var self = this;
    var html =
      '<div class="eps-score">' +
      '<div class="eps-score-card"><strong>' + (sum.percentage || 0) + '%</strong>Score</div>' +
      '<div class="eps-score-card"><strong>' + (sum.evaluated_count || 0) + '</strong>Evaluated</div>' +
      '<div class="eps-score-card"><strong>' + (sum.non_evaluated_count || 0) + '</strong>Needs review</div>' +
      '<div class="eps-score-card"><strong>' + (sum.marks_awarded || 0) + '/' + (sum.max_marks || 0) + '</strong>Marks</div></div>';

    if (ev.disclaimer) html += '<p style="font-size:.85rem;color:#64748b;margin-bottom:16px">' + self._esc(ev.disclaimer) + '</p>';

    (ev.evaluated || []).forEach(function (item) {
      html += '<div class="eps-result-eval"><strong>✓ Q: ' + self._esc(item.question.slice(0, 80)) + '…</strong>';
      html += '<p style="margin:8px 0;font-size:.85rem">' + self._esc(item.feedback) + '</p>';
      html += '<small>Marks: ' + item.marks_awarded + '/' + item.max_marks + ' · Score: ' + item.score + '%</small></div>';
    });

    (ev.non_evaluated || []).forEach(function (item) {
      html += '<div class="eps-result-pending"><strong>⏳ Needs review</strong>';
      html += '<p style="margin:8px 0;font-size:.85rem">' + self._esc(item.reason) + '</p>';
      html += '<small>Please ask your teacher to review, or leave with us — Brahmando will manually review flagged answers.</small></div>';
    });

    this._el('.eps-content').innerHTML = html;
    this._el('.eps-footer').innerHTML =
      '<button type="button" class="eps-btn secondary" id="eps-new">New test</button>' +
      '<button type="button" class="eps-btn" id="eps-done">Done</button>';
    this._el('#eps-new').onclick = function () { self.session = null; self.step = 'setup'; self._renderStep(); };
    this._el('#eps-done').onclick = function () { self.close(); };
  };

  PracticeStudio.prototype._esc = function (s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  global.EducationPracticeStudio = PracticeStudio;
})(typeof window !== 'undefined' ? window : this);
