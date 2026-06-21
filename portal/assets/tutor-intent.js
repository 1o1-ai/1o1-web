/**
 * Chat intent routing — verified MCQs bypass LLM; strict fetch vs explain vs peer.
 */
(function (global) {
  const WORD_NUM = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    a: 1, an: 1,
  };

  /** User wants N questions from bank — not casual mention of "the question" */
  function isQuestionFetchIntent(msg) {
    const m = msg.toLowerCase().trim();
    if (/\b(the|this|that|above|below)\s+question\b/.test(m)) return false;
    if (/\bquestion(s)?\s+(and|or)\s+answer/.test(m)) return false;
    if (/\b(not\s+sync|do you agree|wrong|mistake|error)\b/.test(m)) return false;

    if (/\b(give|show|get|need|want|fetch|start|practice|attempt)\b.*\b(question|mcq|quiz)/.test(m)) return true;
    if (/\b(sample|any)\b.*\b(question|mcq|questions|mcqs)\b/.test(m)) return true;
    if (/\b(one|two|three|four|five|\d+|a|an)(\s+\w+){0,2}\s+(question|mcq|questions|mcqs)\b/.test(m)) return true;
    if (/\b(question|mcq|questions|mcqs)\s+on\b/.test(m)) return true;
    if (/\bchapter\s+quiz\b/.test(m)) return true;
    if (/\bboard\s+mock\b/.test(m)) return true;
    return false;
  }

  function parseQuestionCount(msg) {
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

  function isExplainOrAnswerIntent(msg) {
    const m = msg.toLowerCase();
    if (isQuestionFetchIntent(msg)) return false;
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
    isExplainOrAnswerIntent,
    findPeerMention,
  };
})(typeof window !== 'undefined' ? window : globalThis);
