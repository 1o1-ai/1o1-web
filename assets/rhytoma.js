(function () {
  'use strict';

  var API_FALLBACK = 'https://api.brahmando.com/wb-academy';
  var API_CANDIDATES = buildCandidates();

  var API_BASE = '';
  var lang = localStorage.getItem('rhytoma_lang') || 'bn';
  var apiOnline = false;

  function buildCandidates() {
    var params = new URLSearchParams(location.search);
    var explicit = params.get('api');
    if (explicit) return [explicit.replace(/\/$/, '')];

    var list = [];
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      list.push('http://127.0.0.1:8140');
    }
    list.push(location.origin.replace(/\/$/, '') + '/wb-academy');
    list.push(API_FALLBACK);
    return list.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  var COPY = {
    bn: {
      back: '← Yogabrata',
      pageTitle: 'ঋতমা Academy',
      apiChecking: 'একাডেমি API যাচাই হচ্ছে…',
      apiOnline: 'একাডেমি API সচল',
      apiOffline: 'একাডেমি API এখনো সচল নয় — চ্যাট ও পরীক্ষা API চালু হলে কাজ করবে',
      apiEndpoint: 'API',
      eyebrow: 'পশ্চিমবঙ্গ বোর্ড · TruthGuard',
      heroTitle: 'ঋতমা Academy',
      heroLede: 'WBBSE/WBCHSE — শুধুমাত্র যাচাইকৃত পাঠ্যপুস্তক থেকে AI উত্তর। কোনো ভুয়ো তথ্য নয়।',
      schoolTitle: 'উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথ',
      schoolMeta: 'উত্তরপাড়া, হুগলি · প্রত. ১৯৩৯ · WBBSE / WBCHSE',
      schoolBody: 'এই একাডেমি উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথের শিক্ষার্থীদের একটি প্রচেষ্টা — প্রশান্ত মুখার্জি, অমরনাথ খাঁ, হারু দাস, যোগোব্রত মুখার্জি ও অন্যান্য সহপাঠীদের নিয়ে গড়ে ওঠা TruthGuard পশ্চিমবঙ্গ বোর্ড শিক্ষা।',
      schoolPageLink: 'শিক্ষার্থী দল ও বিদ্যালয় পৃষ্ঠা →',
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
      embedOffline: 'একাডেমি API চালু হলে এখানে অভ্যাস পরীক্ষা ও ল্যাব লোড হবে।',
      actorStudent: 'শিক্ষার্থী',
      actorTeacher: 'শিক্ষক',
      actorSchool: 'বিদ্যালয়',
      actorCoaching: 'কোচিং',
      chatPlaceholder: 'WBBSE সিলেবাস, অনুশীলন বা কোনো অধ্যায় সম্পর্কে জিজ্ঞাসা…',
      chatDisabled: 'API অফলাইন — প্রশ্ন পাঠানো যাবে না',
      sendBtn: 'পাঠান',
      sampleBtn: 'নমুনা প্রশ্ন',
      sampleQ: 'ক্লাস দশ WBBSE বিজ্ঞান — সালোকসংশ্লেষণ সম্পর্কে ৫টি MCQ তৈরি করুন।',
      thinking: 'চিন্তা করছে…',
      errOffline: 'একাডেমি API পৌঁছানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    },
    en: {
      back: '← Yogabrata',
      pageTitle: 'Rhytoma Academy',
      apiChecking: 'Checking academy API…',
      apiOnline: 'Academy API online',
      apiOffline: 'Academy API not live yet — chat and tests work once the API is up',
      apiEndpoint: 'API',
      eyebrow: 'West Bengal Board · TruthGuard',
      heroTitle: 'Rhytoma (ঋতমা) Academy',
      heroLede: 'WBBSE/WBCHSE — AI answers from verified textbooks only. No hallucination.',
      schoolTitle: 'Uttarpara Amarendra Vidyapith',
      schoolMeta: 'Uttarpara, Hooghly · Est. 1939 · WBBSE / WBCHSE',
      schoolBody: 'This academy is a student-led attempt from Uttarpara Amarendra Vidyapith — built by Prashant Mukherjee, Amarnath Khan, Haru Das, Yogobrata Mukherjee, and fellow students listed on the school page.',
      schoolPageLink: 'Student team & school page →',
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
      embedOffline: 'Practice test and lab load here when the academy API is online.',
      actorStudent: 'Student',
      actorTeacher: 'Teacher',
      actorSchool: 'School',
      actorCoaching: 'Coaching',
      chatPlaceholder: 'Ask about WBBSE syllabus, practice, or a topic…',
      chatDisabled: 'API offline — cannot send questions',
      sendBtn: 'Send',
      sampleBtn: 'Sample question',
      sampleQ: 'Generate 5 MCQs on photosynthesis for WBBSE Class 10 Science.',
      thinking: 'Thinking…',
      errOffline: 'Could not reach the academy API. Try again shortly.',
    },
  };

  function t(key) {
    return (COPY[lang] || COPY.en)[key] || COPY.en[key] || key;
  }

  function widgetUrl(path, extraQuery) {
    var q = extraQuery ? ('?' + extraQuery) : '';
    if (!API_BASE) return '#';
    return API_BASE + path + q;
  }

  function updateApiLinks() {
    var medium = lang === 'bn' ? 'Bengali' : 'English';
    var practiceQ = 'medium=' + encodeURIComponent(medium) + '&track=wbbse';
    if (API_BASE) practiceQ += '&api=' + encodeURIComponent(API_BASE);

    var openPractice = document.getElementById('openPractice');
    var openLabLink = document.getElementById('openLabLink');
    if (openPractice) {
      openPractice.href = apiOnline ? widgetUrl('/widget/practice-test.html', practiceQ) : '#';
      openPractice.target = apiOnline ? '_blank' : '';
      openPractice.rel = apiOnline ? 'noopener' : '';
      openPractice.setAttribute('aria-disabled', apiOnline ? 'false' : 'true');
      openPractice.classList.toggle('btn-disabled', !apiOnline);
    }
    if (openLabLink) {
      openLabLink.href = apiOnline ? widgetUrl('/training-lab') : '#';
      openLabLink.target = apiOnline ? '_blank' : '';
      openLabLink.rel = apiOnline ? 'noopener' : '';
      openLabLink.setAttribute('aria-disabled', apiOnline ? 'false' : 'true');
      openLabLink.classList.toggle('btn-disabled', !apiOnline);
    }

    var pf = document.getElementById('practiceFrame');
    var lf = document.getElementById('labFrame');
    var po = document.getElementById('practiceOffline');
    var lo = document.getElementById('labOffline');

    if (pf) {
      if (apiOnline) {
        pf.src = widgetUrl('/widget/practice-test.html', practiceQ);
        pf.hidden = false;
        if (po) po.hidden = true;
      } else {
        pf.removeAttribute('src');
        pf.hidden = true;
        if (po) {
          po.hidden = false;
          po.textContent = t('embedOffline');
        }
      }
    }
    if (lf) {
      if (apiOnline) {
        lf.src = widgetUrl('/training-lab');
        lf.hidden = false;
        if (lo) lo.hidden = true;
      } else {
        lf.removeAttribute('src');
        lf.hidden = true;
        if (lo) {
          lo.hidden = false;
          lo.textContent = t('embedOffline');
        }
      }
    }

    var chatInput = document.getElementById('chatInput');
    var sendBtn = document.querySelector('#chatForm button[type="submit"]');
    if (chatInput) {
      chatInput.disabled = !apiOnline;
      chatInput.placeholder = apiOnline ? t('chatPlaceholder') : t('chatDisabled');
    }
    if (sendBtn) sendBtn.disabled = !apiOnline;

    var ep = document.getElementById('apiEndpoint');
    if (ep) {
      if (apiOnline && API_BASE) {
        ep.hidden = false;
        ep.textContent = '· ' + API_BASE.replace(/^https?:\/\//, '');
      } else {
        ep.hidden = true;
      }
    }
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
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    updateApiLinks();
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
      document.querySelectorAll('.tool-tab').forEach(function (tb) {
        tb.classList.toggle('active', tb === tab);
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

  async function probeApi(base) {
    var res = await fetch(base + '/health', { cache: 'no-store', mode: 'cors' });
    if (!res.ok) throw new Error('offline');
    var data = await res.json();
    if (data.status !== 'ok') throw new Error('offline');
    return base;
  }

  async function discoverApi() {
    var el = document.getElementById('apiStatus');
    el.classList.add('offline');
    el.querySelector('[data-i18n]').textContent = t('apiChecking');

    for (var i = 0; i < API_CANDIDATES.length; i++) {
      try {
        API_BASE = await probeApi(API_CANDIDATES[i]);
        apiOnline = true;
        el.classList.remove('offline');
        el.classList.add('online');
        el.querySelector('[data-i18n]').textContent = t('apiOnline');
        updateApiLinks();
        return;
      } catch (e) {
        /* try next */
      }
    }

    API_BASE = API_CANDIDATES[API_CANDIDATES.length - 1] || API_FALLBACK;
    apiOnline = false;
    el.classList.add('offline');
    el.querySelector('[data-i18n]').textContent = t('apiOffline');
    updateApiLinks();
  }

  async function checkHealth() {
    if (!API_BASE) return discoverApi();
    var el = document.getElementById('apiStatus');
    try {
      await probeApi(API_BASE);
      if (!apiOnline) {
        apiOnline = true;
        el.classList.add('online');
        el.classList.remove('offline');
        el.querySelector('[data-i18n]').textContent = t('apiOnline');
        updateApiLinks();
      }
    } catch (e) {
      apiOnline = false;
      el.classList.add('offline');
      el.classList.remove('online');
      el.querySelector('[data-i18n]').textContent = t('apiOffline');
      updateApiLinks();
      await discoverApi();
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
    if (!apiOnline) return;
    var input = document.getElementById('chatInput');
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    sendChat(msg);
  });

  document.getElementById('sampleBtn').addEventListener('click', function () {
    if (!apiOnline) return;
    document.getElementById('chatInput').value = t('sampleQ');
  });

  applyLang();
  discoverApi();
  setInterval(checkHealth, 60000);
})();
