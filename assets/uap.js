(function () {
  'use strict';

  /** Photo files: assets/uap/photos/01.jpg … 27.jpg (add when images are ready) */
  var PHOTO_BASE = '../assets/uap/photos/';

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
      teamTitle: 'ঋতমা Academy — শিক্ষার্থী দল',
      teamIntro: 'উত্তরপাড়া অমরেন্দ্র বিদ্যাপীথের এই শিক্ষার্থীরা ঋতমা Academy গড়ে তুলেছেন।',
      alsoTitle: 'এবং',
      photoSoon: 'ছবি শীঘ্রই',
      galleryTitle: 'গ্যালারি',
      galleryHint: 'ছবি যোগ করতে assets/uap/photos/01.jpg … 27.jpg ফাইল রাখুন।',
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
      teamTitle: 'Rhytoma Academy — student team',
      teamIntro: 'These Uttarpara Amarendra Vidyapith students built Rhytoma Academy.',
      alsoTitle: 'And also',
      photoSoon: 'Photo coming soon',
      galleryTitle: 'Gallery',
      galleryHint: 'Drop images as assets/uap/photos/01.jpg … 27.jpg when ready.',
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

  function padId(id) {
    return id < 10 ? '0' + id : String(id);
  }

  function renderRoster(containerId, members) {
    var root = document.getElementById(containerId);
    if (!root) return;
    root.innerHTML = '';

    members.forEach(function (member) {
      var card = document.createElement('article');
      card.className = 'uap-member';
      card.setAttribute('data-photo-id', padId(member.id));

      var photoWrap = document.createElement('div');
      photoWrap.className = 'uap-photo';

      var img = document.createElement('img');
      img.src = PHOTO_BASE + padId(member.id) + '.jpg';
      img.alt = lang === 'bn' ? member.bn : member.en;
      img.loading = 'lazy';
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        img.style.display = 'none';
        photoWrap.classList.add('uap-photo--empty');
        var ph = document.createElement('span');
        ph.className = 'uap-photo-placeholder';
        ph.textContent = t('photoSoon');
        photoWrap.appendChild(ph);
      });
      photoWrap.appendChild(img);

      var name = document.createElement('h3');
      name.className = 'uap-name';
      name.textContent = lang === 'bn' ? member.bn : member.en;
      if (lang === 'en' && member.bn) {
        name.setAttribute('lang', 'bn');
        name.dataset.bn = member.bn;
      }

      var num = document.createElement('span');
      num.className = 'uap-num';
      num.textContent = String(member.id);

      card.appendChild(photoWrap);
      card.appendChild(name);
      card.appendChild(num);
      root.appendChild(card);
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

  applyLang();
})();
