(function () {
  'use strict';

  var API_BASE = resolveApiBase();

  function resolveApiBase() {
    var params = new URLSearchParams(location.search);
    var explicit = params.get('api');
    if (explicit) return explicit.replace(/\/$/, '');
    if (location.hostname.endsWith('yogabrata.com')) {
      return location.origin + '/wb-academy';
    }
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8140';
    }
    return location.origin + '/wb-academy';
  }

  var COPY = {
    bn: {
      back: '← Yogabrata',
      pageTitle: 'ঋতমা Academy',
      apiChecking: 'একাডেমি API যাচাই হচ্ছে…',
      apiOnline: 'একাডেমি API সচল',
      apiOffline: 'API এখনও ডিপ্লয় হচ্ছে — UI কাজ করবে, উত্তর পরে',
      eyebrow: 'পশ্চিমবঙ্গ বোর্ড · TruthGuard',
      heroTitle: 'ঋতমা Academy',
      heroLede: 'WBBSE/WBCHSE — শুধুমাত্র যাচাইকৃত পাঠ্যপুস্তক থেকে AI উত্তর। কোনো ভুয়ো তথ্য নয়।',
      schoolTitle: 'উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথ',
      schoolMeta: 'উত্তরপাড়া, হুগলি · প্রত. ১৯৩৯ · WBBSE / WBCHSE',
      schoolBody: 'এই একাডেমি উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথের শিক্ষার্থীদের একটি প্রচেষ্টা — বাংলা মাধ্যমিক পাঠ্যক্রম (ক্লাস I–XII)। স্বাধীনতাসংগ্রামী অমরেন্দ্রনাথ চট্টোপাধ্যায়ের নামে প্রতিষ্ঠিত; উত্তরপাড়া, হিন্দমোটর, বেলুর, সিরামপুর ও আশপাশের এলাকা থেকে শিক্ষার্থী আসে।',
      wikiLink: 'উইকিপিডিয়া →',
      fact1: '~১৫০০ শিক্ষার্থী',
      fact2: 'বাংলা মাধ্যম',
      fact3: 'মাধ্যমিক ও উচ্চ মাধ্যমিক',
      fact4: 'উত্তরপাড়া, WB',
      tabPractice: 'অভ্যাস পরীক্ষা',
      tabChat: 'জিজ্ঞাসা করুন',
      tabLab: 'Eval Lab',
      practiceHint: 'TruthGuard-ভিত্তিক WBBSE ও WBCHSE মক টেস্ট।',
      openPractice: 'পূর্ণ অভ্যাস পৃষ্ঠা',
      openLab: 'প্রশিক্ষণ ল্যাব',
      labDesc: 'মানুষের রিভিউয়ার AI উত্তর যাচাই করে — TruthGuard প্রশিক্ষণ। লগইন: yoga / yoga',
      actorStudent: 'শিক্ষার্থী',
      actorTeacher: 'শিক্ষক',
      actorSchool: 'বিদ্যালয়',
      actorCoaching: 'কোচিং',
      chatPlaceholder: 'WBBSE সিলেবাস, অনুশীলন বা কোনো অধ্যায় সম্পর্কে জিজ্ঞাসা…',
      sendBtn: 'পাঠান',
      sampleBtn: 'নমুনা প্রশ্ন',
      sampleQ: 'ক্লাস দশ WBBSE বিজ্ঞান — সালোকসংশ্লেষণ সম্পর্কে ৫টি MCQ তৈরি করুন।',
      thinking: 'চিন্তা করছে…',
      errOffline: 'API অফলাইন। পরে আবার চেষ্টা করুন।',
    },
    en: {
      back: '← Yogabrata',
      pageTitle: 'Rhytoma Academy',
      apiChecking: 'Checking academy API…',
      apiOnline: 'Academy API online',
      apiOffline: 'API deploying — UI works; answers when live',
      eyebrow: 'West Bengal Board · TruthGuard',
      heroTitle: 'Rhytoma (ঋতমা) Academy',
      heroLede: 'WBBSE/WBCHSE — AI answers from verified textbooks only. No hallucination.',
      schoolTitle: 'Uttarpara Amarendra Vidyapith',
      schoolMeta: 'Uttarpara, Hooghly · Est. 1939 · WBBSE / WBCHSE',
      schoolBody: 'This academy is a student-led attempt from Uttarpara Amarendra Vidyapith — a Bengali-medium boys\' school (Classes I–XII) in Hooghly. Named for freedom fighter Amarendra Nath Chattopadhyay; students come from Uttarpara, Hindmotor, Bally, Belur, Serampore, and nearby areas.',
      wikiLink: 'Wikipedia →',
      fact1: '~1500 students',
      fact2: 'Bengali medium',
      fact3: 'Madhyamik & HS',
      fact4: 'Uttarpara, WB',
      tabPractice: 'Practice Test',
      tabChat: 'Ask (Student)',
      tabLab: 'Eval Lab',
      practiceHint: 'TruthGuard-grounded WBBSE & WBCHSE mock tests.',
      openPractice: 'Open full practice page',
      openLab: 'Training lab',
      labDesc: 'Human reviewers validate AI answers for TruthGuard training. Login: yoga / yoga',
      actorStudent: 'Student',
      actorTeacher: 'Teacher',
      actorSchool: 'School',
      actorCoaching: 'Coaching',
      chatPlaceholder: 'Ask about WBBSE syllabus, practice, or a topic…',
      sendBtn: 'Send',
      sampleBtn: 'Sample question',
      sampleQ: 'Generate 5 MCQs on photosynthesis for WBBSE Class 10 Science.',
      thinking: 'Thinking…',
      errOffline: 'API offline. Try again when deployed.',
    },
  };

  var lang = localStorage.getItem('rhytoma_lang') || 'bn';
  var apiOnline = false;

  function t(key) {
    return (COPY[lang] || COPY.en)[key] || COPY.en[key] || key;
  }

  function applyLang() {
    document.body.classList.remove('lang-bn', 'lang-en');
    document.body.classList.add('lang-' + lang);
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (COPY[lang][k]) el.textContent = COPY[lang][k];
    });
    document.querySelectorAll('[data-i18n-opt]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-opt');
      if (COPY[lang][k]) el.textContent = COPY[lang][k];
    });
    var chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = t('chatPlaceholder');
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    var medium = lang === 'bn' ? 'Bengali' : 'English';
    var pf = document.getElementById('practiceFrame');
    if (pf) {
      pf.src = '/wb-academy/widget/practice-test.html?medium=' + encodeURIComponent(medium) + '&track=wbbse';
    }
    localStorage.setItem('rhytoma_lang', lang);
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      lang = btn.dataset.lang;
      applyLang();
    });
  });

  document.querySelectorAll('.tool-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var tool = tab.dataset.tool;
      document.querySelectorAll('.tool-tab').forEach(function (t) {
        t.classList.toggle('active', t === tab);
      });
      document.querySelectorAll('.tool-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + tool);
      });
    });
  });

  function appendChat(role, text) {
    var log = document.getElementById('chatLog');
    var div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function checkHealth() {
    var el = document.getElementById('apiStatus');
    try {
      var res = await fetch(API_BASE + '/health', { cache: 'no-store' });
      if (!res.ok) throw new Error('offline');
      var data = await res.json();
      apiOnline = data.status === 'ok';
      el.classList.toggle('online', apiOnline);
      el.classList.toggle('offline', !apiOnline);
      el.querySelector('[data-i18n]').textContent = apiOnline ? t('apiOnline') : t('apiOffline');
    } catch (e) {
      apiOnline = false;
      el.classList.add('offline');
      el.querySelector('[data-i18n]').textContent = t('apiOffline');
    }
  }

  async function sendChat(message) {
    appendChat('user', message);
    appendChat('bot', t('thinking'));
    var log = document.getElementById('chatLog');
    var pending = log.lastChild;

    if (!apiOnline) {
      pending.textContent = t('errOffline');
      return;
    }

    var body = {
      actor: document.getElementById('actorSelect').value,
      message: message,
      context: {
        grade: document.getElementById('gradeSelect').value,
        board: document.getElementById('boardSelect').value,
        language_medium: lang === 'bn' ? 'Bengali' : 'English',
      },
    };

    try {
      var res = await fetch(API_BASE + '/actors/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      var answer = data.answer || data.message || JSON.stringify(data);
      if (data.action === 'open_practice_page' && data.practice_defaults) {
        answer += '\n\n→ Open Practice tab for a mock test.';
      }
      pending.textContent = answer;
      pending.className = 'chat-msg bot';
    } catch (err) {
      pending.textContent = String(err.message || t('errOffline'));
    }
  }

  document.getElementById('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('chatInput');
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    sendChat(msg);
  });

  document.getElementById('sampleBtn').addEventListener('click', function () {
    document.getElementById('chatInput').value = t('sampleQ');
  });

  applyLang();
  checkHealth();
  setInterval(checkHealth, 60000);
})();
