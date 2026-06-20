(function () {
  'use strict';

  /* ── Starfield (Brahmando cosmic background) ── */
  var canvas = document.getElementById('cosmos');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var stars = [];
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: Math.floor((canvas.width * canvas.height) / 9000) }, function () {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.5 + 0.2,
          s: Math.random() * 0.02 + 0.005,
        };
      });
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(function (st) {
        st.a += st.s * (Math.random() > 0.5 ? 1 : -1);
        if (st.a < 0.15) st.a = 0.15;
        if (st.a > 0.85) st.a = 0.85;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(226, 232, 240, ' + st.a + ')';
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  /* ── Tab switching ── */
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var id = tab.dataset.tab;
      tabs.forEach(function (t) {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var show = p.id === 'panel-' + id;
        p.classList.toggle('active', show);
        p.hidden = !show;
      });
      history.replaceState(null, '', '#' + id);
    });
  });

  if (location.hash === '#rhytoma') {
    document.querySelector('[data-tab="rhytoma"]').click();
  }

  /* ── Rhytoma i18n ── */
  var COPY = {
    bn: {
      eyebrow: 'পশ্চিমবঙ্গ বোর্ড · TruthGuard',
      title: 'ঋতমা Academy — West Bengal Board',
      lede: 'WBBSE মাধ্যমিক ও WBCHSE উচ্চ মাধ্যমিক — বাংলা, ইংরেজি ও হিন্দি মাধ্যমে। AI উত্তর শুধুমাত্র যাচাইকৃত পাঠ্যপুস্তক ও সিলেবাস থেকে — কোনো ভুয়ো তথ্য নয়।',
      s1: 'মাধ্যমিক V–X', s2: 'উচ্চ মাধ্যমিক', s3: 'মাধ্যম', s4: 'ভুয়ো তথ্য নয়',
      actorsLabel: 'কার জন্য',
      a1t: 'শিক্ষার্থী', a1d: 'অভ্যাস পরীক্ষা, প্রশ্নের ধারা, পড়াশোনা',
      a2t: 'শিক্ষক', a2d: 'প্রশ্নপত্র, পাঠ পরিকল্পনা, মূল্যায়ন',
      a3t: 'বিদ্যালয়', a3d: 'সিলেবাস ঘণ্টা, সাময়িক পরিকল্পনা',
      a4t: 'কোচিং', a4d: 'মক টেস্ট, ডায়াগনস্টিক',
      practice: '📝 অভ্যাস পরীক্ষা', lab: '🔬 TruthGuard Eval Lab', csr: 'Brahmando CSR →',
      preview: 'লাইভ প্রিভিউ', previewNote: 'API এখনও ডিপ্লয় হচ্ছে — ক্লাস্টার লাইভ হলে উপরের বোতাম ব্যবহার করুন।',
    },
    en: {
      eyebrow: 'West Bengal Board · TruthGuard',
      title: 'Rhytoma (ঋতমা) Academy — WB',
      lede: 'WBBSE Madhyamik & WBCHSE Higher Secondary — Bengali, English & Hindi mediums. AI answers grounded in verified textbooks only — no hallucination.',
      s1: 'Madhyamik V–X', s2: 'Higher Secondary', s3: 'Mediums', s4: 'No hallucination',
      actorsLabel: "Who it's for",
      a1t: 'Student', a1d: 'Practice tests, past-paper trends, study help',
      a2t: 'Teacher', a2d: 'Question papers, lesson plans, grading',
      a3t: 'School', a3d: 'Syllabus hours, term planning',
      a4t: 'Coaching', a4d: 'Mock tests, diagnostics, batches',
      practice: '📝 Practice Test', lab: '🔬 TruthGuard Eval Lab', csr: 'CSR on Brahmando →',
      preview: 'Live practice preview', previewNote: 'If empty, wb-academy API is still deploying.',
    },
    hi: {
      eyebrow: 'पश्चिम बंगाल बोर्ड · TruthGuard',
      title: 'ऋतमा Academy — WB',
      lede: 'WBBSE माध्यमिक और WBCHSE उच्च माध्यमिक — बंगाली, अंग्रेज़ी और हिंदी माध्यम। केवल सत्यापित पाठ्य पुस्तकों से AI उत्तर — कोई गलत जानकारी नहीं।',
      s1: 'माध्यमिक V–X', s2: 'उच्च माध्यमिक', s3: 'माध्यम', s4: 'कोई भ्रम नहीं',
      actorsLabel: 'किसके लिए',
      a1t: 'छात्र', a1d: 'अभ्यास, पिछले पेपर, अध्ययन',
      a2t: 'शिक्षक', a2d: 'प्रश्न पत्र, पाठ योजना',
      a3t: 'स्कूल', a3d: 'पाठ्यक्रम, समय-सारणी',
      a4t: 'कोचिंग', a4d: 'मॉक टेस्ट, डायग्नोस्टिक',
      practice: '📝 अभ्यास परीक्षा', lab: '🔬 TruthGuard Eval Lab', csr: 'Brahmando CSR →',
      preview: 'लाइव पूर्वावलोकन', previewNote: 'API अभी डिप्लॉय हो रहा है।',
    },
  };

  function applyLang(lang) {
    document.body.classList.remove('lang-bn', 'lang-en', 'lang-hi');
    document.body.classList.add('lang-' + lang);
    var c = COPY[lang] || COPY.en;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (c[key]) el.textContent = c[key];
    });
    document.querySelectorAll('[data-i18n-href]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-href');
      if (c[key]) el.textContent = c[key];
    });
    var iframe = document.querySelector('.preview-frame iframe');
    if (iframe) {
      var medium = lang === 'bn' ? 'Bengali' : (lang === 'hi' ? 'Hindi' : 'English');
      iframe.src = '/wb-academy/widget/practice-test.html?medium=' + encodeURIComponent(medium);
    }
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    localStorage.setItem('yogabrata_lang', lang);
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
  });

  applyLang(localStorage.getItem('yogabrata_lang') || 'bn');
})();
