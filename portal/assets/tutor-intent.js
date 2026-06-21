/**
 * Chat intent routing — verified MCQs bypass LLM; strict fetch vs explain vs peer.
 */
(function (global) {
  const WORD_NUM = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    a: 1, an: 1,
  };

  /** Bare "3" or "1" in study room = N questions */
  function parseBareCount(msg) {
    const t = msg.trim().toLowerCase();
    if (/^\d{1,2}$/.test(t)) {
      const n = parseInt(t, 10);
      if (n >= 1 && n <= 20) return n;
    }
    if (/^(one|two|three|four|five|six|seven|eight|nine|ten)$/.test(t)) {
      return WORD_NUM[t] || null;
    }
    return null;
  }

  /** "i want 3", "need 5", "give me 2" */
  function parseWantNeedCount(msg) {
    const m = msg.toLowerCase();
    const wm = m.match(
      /\b(?:i\s+)?(?:want|need|get|give me|show me|fetch|send)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/
    );
    if (!wm) return null;
    const token = wm[1];
    if (/^\d+$/.test(token)) return Math.min(20, parseInt(token, 10));
    return Math.min(20, WORD_NUM[token] || 1);
  }

  /** User wants N questions from bank — not casual mention of "the question" */
  function isQuestionFetchIntent(msg) {
    const m = msg.toLowerCase().trim();
    if (/\b(the|this|that|above|below)\s+question\b/.test(m)) return false;
    if (/\bquestion(s)?\s+(and|or)\s+answer/.test(m)) return false;
    if (/\b(not\s+sync|do you agree|wrong|mistake|error)\b/.test(m)) return false;

    if (parseBareCount(msg) != null) return true;
    if (parseWantNeedCount(msg) != null) return true;

    if (/\b(give|show|get|need|want|fetch|start|practice|attempt)\b.*\b(question|mcq|quiz)/.test(m)) return true;
    if (/\b(sample|any)\b.*\b(question|mcq|questions|mcqs)\b/.test(m)) return true;
    if (/\b(one|two|three|four|five|\d+|a|an)(\s+\w+){0,2}\s+(question|mcq|questions|mcqs)\b/.test(m)) return true;
    if (/\b(question|mcq|questions|mcqs)\s+on\b/.test(m)) return true;
    if (/\bchapter\s+quiz\b/.test(m)) return true;
    if (/\bboard\s+mock\b/.test(m)) return true;
    return false;
  }

  function parseQuestionCount(msg) {
    const bare = parseBareCount(msg);
    if (bare != null) return bare;
    const want = parseWantNeedCount(msg);
    if (want != null) return want;

    const m = msg.toLowerCase();
    if (/\b(sample|any)\b/.test(m) && /\b(question|mcq)/.test(m)) return 1;
    const digit = m.match(/(\d+)\s*(?:question|mcq|questions|mcqs)/);
    if (digit) return Math.min(20, parseInt(digit[1], 10));
    const word = m.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+(?:question|mcq|questions|mcqs)/);
    if (word) return Math.min(20, WORD_NUM[word[1]] || 1);
    if (/\b(a|an)\s+question\b/.test(m)) return 1;
    if (/\bone\s+question\b/.test(m)) return 1;
    return 5;
  }

  function isBankSyncComplaint(msg) {
    const m = msg.toLowerCase();
    if (/\bquestion(s)?\s+(and|or)\s+answers?\b/.test(m)) return true;
    if (/\b(not\s+sync|don'?t\s+match|do not match|answers?\s+(don'?t|do not)\s+match)\b/.test(m)) return true;
    if (/\b(options?\s+(look|seem)\s+(wrong|odd|off)|typo|garbled|minus sign)\b/.test(m)) return true;
    return false;
  }

  function isExplainOrAnswerIntent(msg) {
    const m = msg.toLowerCase();
    if (isQuestionFetchIntent(msg)) return false;
    if (isBankSyncComplaint(msg)) return false;
    if (/\b(do you agree|wrong option|mistake in the paper|error in the question)\b/.test(m)) return false;
    return /\b(explain|why|how|answer|solution|worked|step|reasoning|provide the answer)\b/.test(m);
  }

  function findPeerMention(msg, activePeers) {
    const lower = msg.toLowerCase();
    for (const p of activePeers || []) {
      const parts = p.name.toLowerCase().split(/\s+/);
      if (lower.includes(p.name.toLowerCase())) return p;
      if (parts[0].length > 2 && lower.includes(parts[0])) return p;
    }
    return null;
  }

  global.AnyoTutorIntent = {
    isQuestionFetchIntent,
    parseQuestionCount,
    isBankSyncComplaint,
    isExplainOrAnswerIntent,
    findPeerMention,
  };
})(typeof window !== 'undefined' ? window : globalThis);
