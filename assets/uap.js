(function () {
  'use strict';

  var ASSET_BASE = '../assets/uap/';
  var manifest = null;
  var lightboxList = [];
  var lightboxIdx = 0;

  var TEAM_PRIMARY = [
    { id: 1, bn: 'প্রশান্ত মুখার্জি', en: 'Prashant Mukherjee' },
    { id: 2, bn: 'অমরনাথ খাঁ', en: 'Amarnath Khan' },
    { id: 3, bn: 'হারু দাস', en: 'Haru Das' },
    { id: 4, bn: 'শেখরজিৎ বিশ্বাস', en: 'Shekharjit Biswas' },
    { id: 5, bn: 'সুপ্রতিম বল', en: 'Supratim Bol' },
    { id: 6, bn: 'চন্দন গোস্বামী', en: 'Chandan Goswami' },
    { id: 7, bn: 'বিশ্বরঞ্জন চ্যাটার্জি', en: 'Bishwaranjan Chatterjee' },
    { id: 8, bn: 'প্রদীপ দে', en: 'Pradip De' },
    { id: 9, bn: 'যোগোব্রত মুখার্জি', en: 'Yogobrata Mukherjee' },
    { id: 10, bn: 'সুদীপ্ত কর', en: 'Sudipta Kar' },
    { id: 11, bn: 'শোভন চ্যাটার্জী', en: 'Shobhan Chatterjee' },
    { id: 12, bn: 'শুভেন্দু চন্দ্র', en: 'Shubhendu Chandra' },
    { id: 13, bn: 'শ্রীকান্ত পাল', en: 'Srikanta Pal' },
    { id: 14, bn: 'স্বরূপ', en: 'Swarup' },
    { id: 15, bn: 'সমীর মন্ডল', en: 'Samir Mondal' },
    { id: 16, bn: 'সুব্রত মুখার্জি', en: 'Subrata Mukherjee' },
    { id: 17, bn: 'সুজয় দে', en: 'Sujay De' },
    { id: 18, bn: 'সমর ধর', en: 'Samar Dhar' },
    { id: 19, bn: 'উত্তম মুখার্জি', en: 'Uttam Mukherjee' },
    { id: 20, bn: 'চিরঞ্জীব বোস', en: 'Chiranjib Bose' },
    { id: 21, bn: 'সোমনাথ মিত্র', en: 'Somanath Mitra' },
    { id: 22, bn: 'অনির্বাণ মুখার্জি', en: 'Anirban Mukherjee' },
    { id: 23, bn: 'গণেশ দে', en: 'Ganesh De' },
    { id: 24, bn: 'সোমনাথ ঘোষ', en: 'Somanath Ghosh' },
  ];

  var TEAM_ALSO = [
    { id: 25, bn: 'তন্ময় বসু', en: 'Tanmay Basu' },
    { id: 26, bn: 'রাতুল রায়', en: 'Ratul Ray' },
    { id: 27, bn: 'বাসব কর', en: 'Basab Kar' },
  ];

  var COPY = {
    bn: {
      back: '← Yogabrata',
      backRhytoma: '← ঋতমা Academy',
      pageTitle: 'উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথ',
      eyebrow: 'হুগলি · WBBSE / WBCHSE · Est. 1939',
      heroTitle: 'উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথ',
      heroLede: 'বাংলা মাধ্যমিক পাঠ্যক্রম (ক্লাস I–XII) — স্বাধীনতাসংগ্রামী অমরেন্দ্রনাথ চট্টোপাধ্যায়ের নামে প্রতিষ্ঠিত।',
      aboutTitle: 'বিদ্যালয় সম্পর্কে',
      aboutBody: 'উত্তরপাড়া, হিন্দমোটর, বেলুর, সিরামপুর ও আশপাশের এলাকা থেকে প্রায় ১,৫০০ শিক্ষার্থী এখানে পড়াশোনা করে। ঋতমা Academy এই বিদ্যালয়ের শিক্ষার্থীদের একটি TruthGuard-ভিত্তিক পশ্চিমবঙ্গ বোর্ড শিক্ষা প্রচেষ্টা।',
      wikiLink: 'উইকিপিডিয়া →',
      rhytomaLink: 'ঋতমা Academy খুলুন →',
      reunionTitle: 'UAV · পুনর্মিলন ও স্মৃতি',
      reunionIntro: 'অমরেন্দ্র বিদ্যাপীথের শিক্ষার্থীরা — একসাথে, একই ছাত্রাবাস, একই স্কুল প্রাঙ্গণ।',
      galleryTitle: 'গ্যালারি',
      galleryIntro: 'বিদ্যালয়ের মুহূর্ত — উত্সব, পুনর্মিলন, সহপাঠী।',
      teamTitle: 'ঋতমা Academy — শিক্ষার্থী দল',
      teamIntro: 'উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথের এই শিক্ষার্থীরা ঋতমা Academy গড়ে তুলেছেন।',
      alsoTitle: 'এবং',
      photoSoon: 'ছবি শীঘ্রই',
      fact1: '~১৫০০ শিক্ষার্থী',
      fact2: 'বাংলা মাধ্যম',
      fact3: 'মাধ্যমিক ও উচ্চ মাধ্যমিক',
      fact4: 'উত্তরপাড়া, হুগলি',
    },
    en: {
      back: '← Yogabrata',
      backRhytoma: '← Rhytoma Academy',
      pageTitle: 'Uttarpara Amarendra Vidyapith',
      eyebrow: 'Hooghly · WBBSE / WBCHSE · Est. 1939',
      heroTitle: 'Uttarpara Amarendra Vidyapith',
      heroLede: 'Bengali-medium boys\' school (Classes I–XII), named for freedom fighter Amarendra Nath Chattopadhyay.',
      aboutTitle: 'About the school',
      aboutBody: 'Around 1,500 students from Uttarpara, Hindmotor, Bally, Belur, Serampore, and nearby towns study here. Rhytoma Academy is a student-led TruthGuard West Bengal Board education initiative from this school.',
      wikiLink: 'Wikipedia →',
      rhytomaLink: 'Open Rhytoma Academy →',
      reunionTitle: 'UAV · Reunion & memories',
      reunionIntro: 'Amarendra Vidyapith students together — same dormitory, same school grounds.',
      galleryTitle: 'Gallery',
      galleryIntro: 'School moments — festivals, reunions, classmates.',
      teamTitle: 'Rhytoma Academy — student team',
      teamIntro: 'These Uttarpara Amarendra Vidyapith students built Rhytoma Academy.',
      alsoTitle: 'And also',
      photoSoon: 'Photo coming soon',
      fact1: '~1,500 students',
      fact2: 'Bengali medium',
      fact3: 'Madhyamik & HS',
      fact4: 'Uttarpara, Hooghly',
    },
  };

  var lang = localStorage.getItem('rhytoma_lang') || 'bn';

  function t(key) {
    return (COPY[lang] || COPY.en)[key] || COPY.en[key] || key;
  }

  function asset(path) {
    return ASSET_BASE + path;
  }

  function rosterPhoto(slot) {
    if (!manifest || !manifest.rosterFallback) return null;
    var hit = manifest.rosterFallback.find(function (r) { return r.slot === slot; });
    return hit ? hit.src : null;
  }

  function renderRoster(containerId, members) {
    var root = document.getElementById(containerId);
    if (!root) return;
    root.innerHTML = '';

    members.forEach(function (member) {
      var card = document.createElement('article');
      card.className = 'uap-member';
      card.setAttribute('data-photo-id', String(member.id));

      var photoWrap = document.createElement('div');
      photoWrap.className = 'uap-photo';

      var src = rosterPhoto(member.id);
      if (src) {
        var img = document.createElement('img');
        img.src = asset(src);
        img.alt = lang === 'bn' ? member.bn : member.en;
        img.loading = 'lazy';
        photoWrap.appendChild(img);
      } else {
        photoWrap.classList.add('uap-photo--empty');
        var ph = document.createElement('span');
        ph.className = 'uap-photo-placeholder';
        ph.textContent = member.bn.charAt(0);
        photoWrap.appendChild(ph);
      }

      var name = document.createElement('h3');
      name.className = 'uap-name';
      name.textContent = lang === 'bn' ? member.bn : member.en;

      var num = document.createElement('span');
      num.className = 'uap-num';
      num.textContent = String(member.id);

      card.appendChild(photoWrap);
      card.appendChild(name);
      card.appendChild(num);
      root.appendChild(card);
    });
  }

  function buildHero(m) {
    var slides = document.getElementById('heroSlides');
    var polaroids = document.getElementById('heroPolaroids');
    if (!slides || !m.hero || !m.hero.length) return;

    m.hero.forEach(function (item, i) {
      var slide = document.createElement('div');
      slide.className = 'uap-hero-slide' + (i === 0 ? ' active' : '');
      slide.style.backgroundImage = 'url(' + asset(item.src) + ')';
      slides.appendChild(slide);
    });

    m.hero.slice(0, 3).forEach(function (item, i) {
      var p = document.createElement('figure');
      p.className = 'uap-polaroid';
      p.style.setProperty('--rot', (i - 1) * 6 + 'deg');
      p.innerHTML = '<img src="' + asset(item.src) + '" alt="" loading="lazy" />';
      polaroids.appendChild(p);
    });

    var idx = 0;
    setInterval(function () {
      var all = slides.querySelectorAll('.uap-hero-slide');
      if (all.length < 2) return;
      all[idx].classList.remove('active');
      idx = (idx + 1) % all.length;
      all[idx].classList.add('active');
    }, 5500);
  }

  function buildFilmstrip(m) {
    var a = document.getElementById('filmstripA');
    var b = document.getElementById('filmstripB');
    if (!a || !b || !m.gallery || !m.gallery.length) return;

    var picks = m.gallery.slice(0, 16);
    function fill(el) {
      picks.concat(picks).forEach(function (item) {
        var img = document.createElement('img');
        img.src = asset(item.thumb || item.src);
        img.alt = '';
        img.loading = 'lazy';
        el.appendChild(img);
      });
    }
    fill(a);
    fill(b);
  }

  function buildReunion(m) {
    var strip = document.getElementById('reunionStrip');
    if (!strip || !m.team || !m.team.length) return;

    m.team.forEach(function (item, i) {
      var fig = document.createElement('figure');
      fig.className = 'uap-reunion-card';
      fig.style.setProperty('--delay', i * 0.08 + 's');
      var img = document.createElement('img');
      img.src = asset(item.src);
      img.alt = lang === 'bn' ? 'UAV পুনর্মিলন' : 'UAV reunion';
      img.loading = 'lazy';
      fig.appendChild(img);
      fig.addEventListener('click', function () {
        openLightbox([asset(item.src)], 0);
      });
      strip.appendChild(fig);
    });
  }

  function buildMasonry(m) {
    var root = document.getElementById('galleryMasonry');
    if (!root || !m.gallery) return;

    lightboxList = m.gallery.map(function (item) {
      return asset(item.src);
    });

    m.gallery.forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'uap-masonry-item';
      if (i % 5 === 0) btn.classList.add('uap-masonry-item--tall');
      if (i % 7 === 2) btn.classList.add('uap-masonry-item--wide');
      btn.innerHTML = '<img src="' + asset(item.thumb || item.src) + '" alt="" loading="lazy" />';
      btn.addEventListener('click', function () {
        openLightbox(lightboxList, i);
      });
      root.appendChild(btn);
    });
  }

  function openLightbox(list, idx) {
    lightboxList = list;
    lightboxIdx = idx;
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    if (!lb || !img) return;
    img.src = lightboxList[lightboxIdx];
    lb.hidden = false;
    document.body.classList.add('uap-lightbox-open');
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (lb) lb.hidden = true;
    document.body.classList.remove('uap-lightbox-open');
  }

  function stepLightbox(delta) {
    if (!lightboxList.length) return;
    lightboxIdx = (lightboxIdx + delta + lightboxList.length) % lightboxList.length;
    document.getElementById('lightboxImg').src = lightboxList[lightboxIdx];
  }

  function bindLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.querySelector('.uap-lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.uap-lightbox-prev').addEventListener('click', function () { stepLightbox(-1); });
    lb.querySelector('.uap-lightbox-next').addEventListener('click', function () { stepLightbox(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  function applyLang() {
    document.body.classList.remove('lang-bn', 'lang-en');
    document.body.classList.add('lang-' + lang);
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (COPY[lang][k]) el.textContent = COPY[lang][k];
    });

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    renderRoster('rosterPrimary', TEAM_PRIMARY);
    renderRoster('rosterAlso', TEAM_ALSO);
    localStorage.setItem('rhytoma_lang', lang);
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      lang = btn.dataset.lang;
      applyLang();
    });
  });

  function initVisuals(m) {
    manifest = m;
    buildHero(m);
    buildFilmstrip(m);
    buildReunion(m);
    buildMasonry(m);
    applyLang();
  }

  bindLightbox();
  fetch(ASSET_BASE + 'manifest.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(initVisuals)
    .catch(function () {
      applyLang();
    });
})();
