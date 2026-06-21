/**
 * Academy bot roster, chat moderation, and human-like study-room behaviour.
 */
(function (global) {
  const MAX_PEERS = 2;
  const PERSONAL_BLOCK =
    /\b(phone|mobile|whatsapp|instagram|snapchat|telegram|contact\s*number|your\s*number|call\s*me|meet\s*me|address|where\s*do\s*you\s*live|email\s*me|personal\s*info|real\s*name|facebook|tiktok|date\s*me|boyfriend|girlfriend|snap me|dm me)\b/i;

  const TIMEPASS_BLOCK =
    /\b(bored|timepass|time pass|cricket|movie|netflix|game|gaming|gf|bf|party|weekend plan|what'?s up|wassup|boredom)\b/i;

  const MODERATION_REPLY =
    "Let's keep this about CBSE prep — no personal contact or off-topic chat here. Ask about the chapter or quiz instead.";

  const TIMEPASS_WARN =
    "Casual chat is ok for a minute — but this room is for board prep. No personal topics, please.";

  const STUDY_CHATTER = [
    'Anyone doing the chapter quiz?',
    'Board paper 2024 was tough on MCQs…',
    'Stuck on Q3 — options look similar',
    'Going through polynomials again tonight',
    'Has anyone tried the 5-question set from last 3 years?',
    'Section A timing is the real challenge',
    "My school pre-board is next month",
  ];

  const ACCEPT_LINES = [
    'Sure, joining your study room 👍',
    "Ok — let's study together",
    'Coming in. Which chapter?',
    'Fine by me. Science or maths?',
  ];

  const DECLINE_LINES = [
    'Sorry, in another group right now',
    "Can't join — family dinner",
    'Maybe later? Doing a mock test',
    'Not free this session, try again?',
  ];

  const LEAVE_LINES = [
    'Need to log off — dinner time at home',
    'Parent called, leaving the room now',
    'Got to join another study batch — bye',
    'Battery low on tablet, signing off',
    'Break — back in an hour maybe',
  ];

  const PEER_STUDY_REPLIES = [
    'Yeah the PDF text is messy sometimes — minus signs get dropped.',
    'I agree, check the marking scheme PDF if options look odd.',
    'Happens with scanned papers — trust the verified option letters.',
    'Same chapter — I got confused on sign too.',
    'Let\'s compare with the board solution set later.',
  ];

  const PEER_TIMEPASS = [
    'Haha same — but we should get back to MCQs soon',
    'Board is close though 😅',
    'One more question then I need a break',
  ];

  let roster = null;

  async function loadRoster() {
    if (roster) return roster;
    const paths = [
      '/portal/data/academy-bots.json',
      '../../data/academy-bots.json',
      '../data/academy-bots.json',
    ];
    for (const p of paths) {
      try {
        const res = await fetch(p);
        if (res.ok) {
          roster = await res.json();
          return roster;
        }
      } catch {
        /* try next */
      }
    }
    roster = { teachers: [], students: [], totalStudents: 0, totalTeachers: 0 };
    return roster;
  }

  function getPerson(id) {
    if (!roster) return null;
    return (
      roster.teachers.find((t) => t.id === id) ||
      roster.students.find((s) => s.id === id) ||
      null
    );
  }

  function isPersonalQuestion(text) {
    return PERSONAL_BLOCK.test(text || '');
  }

  function isTimepassChat(text) {
    return TIMEPASS_BLOCK.test(text || '');
  }

  function moderationReply() {
    return MODERATION_REPLY;
  }

  function timepassWarning() {
    return TIMEPASS_WARN;
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomDelay(minMs, maxMs) {
    return minMs + Math.random() * (maxMs - minMs);
  }

  function simulateInviteResponse(bot) {
    const r = Math.random();
    if (r < 0.42) return { type: 'accept', delay: randomDelay(2000, 8000) };
    if (r < 0.78) return { type: 'decline', delay: randomDelay(1500, 6000) };
    return { type: 'timeout', delay: randomDelay(12000, 22000) };
  }

  function pickStudyMessage(subject) {
    return randomItem(STUDY_CHATTER);
  }

  /** Bot may leave after joining — with or without message */
  function scheduleBotLeave(bot, onLeave) {
    if (Math.random() > 0.45) return null;
    const delay = randomDelay(75000, 200000);
    return setTimeout(() => {
      const silent = Math.random() < 0.25;
      onLeave(bot, silent ? null : randomItem(LEAVE_LINES));
    }, delay);
  }

  function scheduleBotChatter(bot, onMessage, subject) {
    const timers = [];
    if (Math.random() < 0.5) {
      timers.push(
        setTimeout(() => {
          if (Math.random() < 0.4) onMessage(bot, pickStudyMessage(subject));
        }, randomDelay(35000, 90000))
      );
    }
    if (Math.random() < 0.22) {
      timers.push(
        setTimeout(() => {
          onMessage(bot, randomItem(PEER_TIMEPASS));
        }, randomDelay(50000, 130000))
      );
    }
    return timers;
  }

  function peerReply(bot, msg) {
    const m = (msg || '').toLowerCase();
    if (isPersonalQuestion(msg)) {
      return { type: 'warn', text: moderationReply() };
    }
    if (isTimepassChat(msg)) {
      return { type: 'timepass', text: randomItem(PEER_TIMEPASS), warn: timepassWarning() };
    }
    if (/\b(sync|wrong|mistake|minus|sign|agree|error|pdf|typo)\b/.test(m)) {
      return { type: 'study', text: randomItem(PEER_STUDY_REPLIES) };
    }
    if (/\b(hi|hello|hey|namaste)\b/.test(m)) {
      return { type: 'study', text: `Hey — I'm on ${bot.subject === 'science' ? 'Science' : 'Maths'} too. Which MCQ are you on?` };
    }
    if (Math.random() < 0.35) {
      return { type: 'study', text: pickStudyMessage(bot.subject) };
    }
    return null;
  }

  global.AnyoBots = {
    MAX_PEERS,
    loadRoster,
    getPerson,
    getRoster: () => roster,
    isPersonalQuestion,
    isTimepassChat,
    moderationReply,
    timepassWarning,
    simulateInviteResponse,
    acceptLine: () => randomItem(ACCEPT_LINES),
    declineLine: () => randomItem(DECLINE_LINES),
    scheduleBotChatter,
    scheduleBotLeave,
    peerReply,
    STUDY_CHATTER,
  };
})(typeof window !== 'undefined' ? window : globalThis);
