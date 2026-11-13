/* ==========================================================================
   Digital Indian Golden India (ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া)
   Interactive Newsroom Engine, Sovereign Coin Renderer & Reader Application
   ========================================================================== */

(function () {
  'use strict';

  // 1. 12 Sovereign Coin Color Editions (Matching digital_indian_golden_india_logos.html)
  const COIN_THEMES = [
    {
      id: 'teal',
      name: '01 • Peacock Teal & Gold (Original)',
      outerGrad: 'url(#tealOuter)',
      innerGrad: 'url(#tealInner)',
      coreBg: '#032535',
      nodeAccent: '#5ce1ff',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'red-white-core',
      name: '02 • Red & White (Crimson Rim)',
      outerGrad: 'url(#crimsonGrad)',
      innerGrad: 'url(#pearlWhiteRadial)',
      coreBg: '#b80012',
      nodeAccent: '#d90429',
      chakraStroke: '#b80012',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'white-red-core',
      name: '03 • White & Red (Pearl Rim)',
      outerGrad: 'url(#pearlWhiteOuter)',
      innerGrad: 'url(#crimsonGrad)',
      coreBg: '#ffffff',
      nodeAccent: '#ffffff',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#crimsonGrad)',
      topTextFill: '#b80012',
      botTextFill: '#8d0801',
      dashedStroke: '#b80012'
    },
    {
      id: 'saffron-teal-mix',
      name: '04 • Mixed: Saffron + Teal',
      outerGrad: 'url(#saffronTealMixOuter)',
      innerGrad: 'url(#saffronTealMixInner)',
      coreBg: '#02202e',
      nodeAccent: '#ffe57f',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'tiranga-mix',
      name: '05 • Mixed: Tiranga Tricolor',
      outerGrad: 'url(#tirangaMixedOuter)',
      innerGrad: 'url(#pearlWhiteRadial)',
      coreBg: '#0a2463',
      nodeAccent: '#ff7b00',
      chakraStroke: '#0a2463',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: '#fff6c4',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'lightblue',
      name: '06 • Light Sky Blue & Gold',
      outerGrad: 'url(#skyOuter)',
      innerGrad: 'url(#skyInner)',
      coreBg: '#013a63',
      nodeAccent: '#b3e5fc',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'orange',
      name: '07 • Saffron Orange & Gold',
      outerGrad: 'url(#orangeOuter)',
      innerGrad: 'url(#orangeInner)',
      coreBg: '#4e1402',
      nodeAccent: '#fff3b0',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'emerald',
      name: '08 • Royal Emerald Green',
      outerGrad: 'url(#emeraldOuter)',
      innerGrad: 'url(#emeraldInner)',
      coreBg: '#022412',
      nodeAccent: '#a7f3d0',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'ruby',
      name: '09 • Imperial Ruby Crimson',
      outerGrad: 'url(#rubyOuter)',
      innerGrad: 'url(#rubyInner)',
      coreBg: '#2b040e',
      nodeAccent: '#ffd166',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'indigo',
      name: '10 • Royal Sapphire Indigo',
      outerGrad: 'url(#indigoOuter)',
      innerGrad: 'url(#indigoInner)',
      coreBg: '#070a2b',
      nodeAccent: '#82b1ff',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'red-navy-gold-mix',
      name: '11 • Mixed: Crimson + Sapphire',
      outerGrad: 'url(#redNavyMixOuter)',
      innerGrad: 'url(#redNavyMixInner)',
      coreBg: '#1b0308',
      nodeAccent: '#5ce1ff',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    },
    {
      id: 'aurora-magenta-cyan',
      name: '12 • Mixed: Magenta + Cyber Blue',
      outerGrad: 'url(#auroraMixOuter)',
      innerGrad: 'url(#auroraMixInner)',
      coreBg: '#190438',
      nodeAccent: '#5ce1ff',
      chakraStroke: 'url(#goldMetallic)',
      lotusFill: 'url(#goldMetallic)',
      topTextFill: '#ffffff',
      botTextFill: 'url(#goldMetallic)',
      dashedStroke: 'url(#goldMetallic)'
    }
  ];

  function buildCoinSVG(theme, isAnimated) {
    const spinCW = isAnimated ? 'class="anim-spin-cw"' : '';
    const spinCCW = isAnimated ? 'class="anim-spin-ccw"' : '';
    const coreAnim = isAnimated ? 'class="anim-core"' : '';
    return `
      <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Digital Indian Golden India Sovereign Emblem">
        <circle cx="120" cy="120" r="114" fill="${theme.outerGrad}" stroke="url(#goldMetallic)" stroke-width="5" />
        <circle cx="120" cy="120" r="107" fill="none" stroke="${theme.dashedStroke}" stroke-width="1.2" stroke-dasharray="4 4" ${spinCW} />
        <circle cx="120" cy="120" r="74" fill="${theme.innerGrad}" stroke="url(#goldMetallic)" stroke-width="2.5" />
        <text fill="${theme.topTextFill}" font-family="'Noto Serif Bengali', 'Hind Siliguri', sans-serif" font-size="14.5" font-weight="800">
          <textPath href="#topArcPath" startOffset="50%" text-anchor="middle">ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া</textPath>
        </text>
        <text fill="${theme.botTextFill}" font-family="'Cinzel', serif" font-size="11.2" font-weight="800" letter-spacing="1.3">
          <textPath href="#botArcPathUpright" startOffset="50%" text-anchor="middle">★ DIGITAL INDIAN GOLDEN INDIA ★</textPath>
        </text>
        <g ${spinCCW} stroke="${theme.chakraStroke}" stroke-width="1.6" opacity="0.9">
          <circle cx="120" cy="120" r="56" fill="none" stroke-dasharray="10 6" />
          <line x1="120" y1="64" x2="120" y2="176" />
          <line x1="64" y1="120" x2="176" y2="120" />
          <line x1="80" y1="80" x2="160" y2="160" />
          <line x1="160" y1="80" x2="80" y2="160" />
          <circle cx="120" cy="64" r="3.5" fill="url(#goldMetallic)" />
          <circle cx="176" cy="120" r="3.5" fill="${theme.nodeAccent}" />
          <circle cx="120" cy="176" r="3.5" fill="url(#goldMetallic)" />
          <circle cx="64" cy="120" r="3.5" fill="${theme.nodeAccent}" />
        </g>
        <g ${coreAnim}>
          <circle cx="120" cy="120" r="34" fill="url(#goldMetallic)" />
          <circle cx="120" cy="120" r="29" fill="${theme.coreBg}" />
          <path d="M120 97 C128 110, 128 122, 120 133 C112 122, 112 110, 120 97 Z" fill="${theme.lotusFill}" />
          <path d="M120 133 C109 124, 101 116, 100 105 C110 108, 116 118, 120 133 Z" fill="${theme.lotusFill}" opacity="0.9" />
          <path d="M120 133 C131 124, 139 116, 140 105 C130 108, 124 118, 120 133 Z" fill="${theme.lotusFill}" opacity="0.9" />
          <circle cx="120" cy="93" r="2.8" fill="${theme.nodeAccent}" />
        </g>
      </svg>
    `;
  }

  // 2. Enrich Raw WordPress Data with Correspondents, Locations, Categories & Clean Paragraphs
  const rawPosts = Array.isArray(window.DIGI_NEWS_DATA) ? window.DIGI_NEWS_DATA : [];

  function enrichArticle(post) {
    const fullText = (post.paragraphs || []).join(' ');
    const combined = post.title + ' ' + fullText;

    // Correspondent Detection
    let reporter = 'ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া ডেস্ক';
    if (/সেখ আব্দুল আজিম|আব্দুল আজিম/.test(combined)) {
      reporter = 'সেখ আব্দুল আজিম';
    } else if (/পুলক চক্রবর্তী/.test(combined)) {
      reporter = 'পুলক চক্রবর্তী';
    } else if (/খন্দকার ফজলে মুর্শেদ/.test(combined)) {
      reporter = 'খন্দকার ফজলে মুর্শেদ';
    } else if (/শুভঙ্কর মুখার্জী/.test(combined)) {
      reporter = 'শুভঙ্কর মুখার্জী';
    }

    // Location / Dateline Detection
    let location = 'পশ্চিমবঙ্গ';
    let districtTag = 'রাজ্য';
    if (/ডানকুনি/.test(combined)) {
      location = 'ডানকুনি • হুগলি';
      districtTag = 'ডানকুনি ও হুগলি';
    } else if (/চন্ডীতলা|চন্ডিতলা|নবাবপুর|ফুরফুরা/.test(combined)) {
      location = 'চন্ডীতলা • হুগলি';
      districtTag = 'চন্ডীতলা ও হুগলি';
    } else if (/চুঁচুড়া/.test(combined)) {
      location = 'চুঁচুড়া • হুগলি';
      districtTag = 'চুঁচুড়া ও হুগলি';
    } else if (/উত্তরপাড়া/.test(combined)) {
      location = 'উত্তরপাড়া • হুগলি';
      districtTag = 'উত্তরপাড়া ও হুগলি';
    } else if (/পুরশুড়া|পুড়শুড়া/.test(combined)) {
      location = 'পুরশুড়া • হুগলি';
      districtTag = 'ডানকুনি ও হুগলি';
    } else if (/হাওড়া|ব্যাঁটরা|রামকৃষ্ণপুর/.test(combined)) {
      location = 'হাওড়া';
      districtTag = 'হাওড়া ও কলকাতা';
    } else if (/বীরভূম|মহম্মদবাজার|অনুব্রত/.test(combined)) {
      location = 'মহম্মদবাজার • বীরভূম';
      districtTag = 'বীরভূম ও অন্যান্য';
    } else if (/মুর্শিদাবাদ|সালার/.test(combined)) {
      location = 'সালার • মুর্শিদাবাদ';
      districtTag = 'বীরভূম ও অন্যান্য';
    } else if (/নদিয়া|নদীয়া|পলাশীপাড়া/.test(combined)) {
      location = 'পলাশীপাড়া • নদিয়া';
      districtTag = 'বীরভূম ও অন্যান্য';
    } else if (/কলকাতা|কৃষ্ণপদ মেমোরিয়াল|কালীঘাট/.test(combined)) {
      location = 'কলকাতা';
      districtTag = 'হাওড়া ও কলকাতা';
    } else if (/বাংলাদেশ|হাসিনা|আফরান নিশো/.test(combined)) {
      location = 'ঢাকা • আন্তর্জাতিক';
      districtTag = 'দেশ ও আন্তর্জাতিক';
    } else if (/রোহিত|শামি|শামী|কোহলি|বিসিসিআই|অস্ট্রেলিয়া/.test(combined)) {
      location = 'ভারতীয় ক্রিকেট ডেস্ক';
      districtTag = 'খেলাধুলা';
    }

    // Smart Multi-Beat Categorization
    const beats = new Set();
    (post.categories || []).forEach(c => {
      if (c === 'রাজ্য') beats.add('রাজ্য ও জেলা');
      if (c === 'কলকাতা') beats.add('কলকাতা ও হুগলি');
      if (c === 'রাজনীতি') beats.add('রাজনীতি');
      if (c === 'দেশ') beats.add('দেশ ও বিদেশ');
      if (c === 'খেলা') beats.add('খেলাধুলা');
      if (c === 'ব্যবসা') beats.add('ব্যবসা ও অর্থনীতি');
      if (c === 'স্বাস্থ' || c === 'শিক্ষা') beats.add('স্বাস্থ্য ও সমাজ');
      if (c === 'বিনোদন') beats.add('বিনোদন ও সংস্কৃতি');
    });

    if (/হুগলি|ডানকুনি|চন্ডীতলা|চুঁচুড়া|উত্তরপাড়া|পুরশুড়া|কলকাতা|হাওড়া/.test(location)) {
      beats.add('কলকাতা ও হুগলি');
      beats.add('রাজ্য ও জেলা');
    }
    if (/বীরভূম|মুর্শিদাবাদ|নদিয়া|পুলিশ|পৌরভবন|অন্নপূর্ণা|দুয়ারে/.test(combined)) {
      beats.add('রাজ্য ও জেলা');
    }
    if (/তৃণমূল|নির্বাচন|ভোট|SIR|হাসিনা|চেয়ারম্যান|সাংসদ|বিধায়ক/.test(combined)) {
      beats.add('রাজনীতি');
    }
    if (/চিকিৎসালয়|টীকাকরন|স্বাস্থ্য|হাসপাতাল|দময়ন্তী|মাতৃভাষা|সমাজসেবা|হুইল চেয়ার|বাল্যবিবাহ|১১ বছর/.test(combined)) {
      beats.add('স্বাস্থ্য ও সমাজ');
    }
    if (/ফলের দাম|সোনার বিস্কুট|ইউপিআই|অ্যাপেল|ব্যবসায়ী|টাকা|অন্নপূর্ণা যোজনা/.test(combined)) {
      beats.add('ব্যবসা ও অর্থনীতি');
    }
    if (/কিশোর কুমার|ধর্মেন্দ্র|রূপসা|আফরান নিশো|মাতৃভাষা দিবস|রাশি/.test(combined)) {
      beats.add('বিনোদন ও সংস্কৃতি');
    }
    if (/ফুটবল|শ্যুটার|ক্রিকেট|রোহিত|শামি|শামী/.test(combined)) {
      beats.add('খেলাধুলা');
    }
    if (/বাংলাদেশ|কেন্দ্র|ভারত|মুম্বাই/.test(combined)) {
      beats.add('দেশ ও বিদেশ');
    }
    if (beats.size === 0) {
      beats.add('রাজ্য ও জেলা');
    }

    // Format readable paragraphs (split overly long single-block paragraphs into 3-sentence chunks)
    const cleanParagraphs = [];
    (post.paragraphs || []).forEach(rawP => {
      const cleaned = rawP
        .replace(/##+/g, '')
        .replace(/\*\*/g, '')
        .replace(/—+/g, ' — ')
        .trim();
      const sentences = cleaned.split(/(?<=[।?!])\s+/);
      let chunk = [];
      sentences.forEach(s => {
        if (!s.trim()) return;
        chunk.push(s.trim());
        if (chunk.join(' ').length > 280) {
          cleanParagraphs.push(chunk.join(' '));
          chunk = [];
        }
      });
      if (chunk.length > 0) {
        cleanParagraphs.push(chunk.join(' '));
      }
    });

    const dateObj = new Date(post.date);
    const formattedDateBn = dateObj.toLocaleDateString('bn-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      ...post,
      reporter,
      location,
      districtTag,
      beats: Array.from(beats),
      primaryBeat: Array.from(beats)[0] || 'রাজ্য ও জেলা',
      formattedDateBn,
      cleanParagraphs: cleanParagraphs.length ? cleanParagraphs : [post.excerpt]
    };
  }

  const ARTICLES = rawPosts.map(enrichArticle);

  // State
  let currentCategory = 'সব খবর';
  let currentDistrict = 'সব এলাকা';
  let currentReporter = '';
  let searchQuery = '';
  let visibleCount = 12;
  let currentReaderFontSize = 1.08;
  let activeBrandTheme = 'teal';
  let isSpeaking = false;

  const CATEGORIES = [
    'সব খবর',
    'রাজ্য ও জেলা',
    'কলকাতা ও হুগলি',
    'রাজনীতি',
    'দেশ ও বিদেশ',
    'খেলাধুলা',
    'ব্যবসা ও অর্থনীতি',
    'স্বাস্থ্য ও সমাজ',
    'বিনোদন ও সংস্কৃতি'
  ];

  const DISTRICTS = [
    'সব এলাকা',
    'ডানকুনি ও হুগলি',
    'চন্ডীতলা ও হুগলি',
    'চুঁচুড়া ও হুগলি',
    'উত্তরপাড়া ও হুগলি',
    'হাওড়া ও কলকাতা',
    'বীরভূম ও অন্যান্য',
    'দেশ ও আন্তর্জাতিক'
  ];

  // 3. Initialize Masthead Coin & Theme Switcher
  function setBrandEdition(themeId) {
    const theme = COIN_THEMES.find(t => t.id === themeId) || COIN_THEMES[0];
    activeBrandTheme = theme.id;
    document.documentElement.setAttribute('data-brand-edition', theme.id);

    const mastheadCoin = document.getElementById('mastheadCoinStage');
    if (mastheadCoin) {
      mastheadCoin.innerHTML = buildCoinSVG(theme, true);
    }
    const footerCoin = document.getElementById('footerCoinStage');
    if (footerCoin) {
      footerCoin.innerHTML = buildCoinSVG(theme, false);
    }
    const sel = document.getElementById('brandEditionSelect');
    if (sel && sel.value !== theme.id) {
      sel.value = theme.id;
    }
    document.querySelectorAll('.logo-Option-card').forEach(el => {
      el.classList.toggle('active', el.dataset.themeId === theme.id);
    });
  }

  function initClockAndDate() {
    const dateEl = document.getElementById('liveBnDate');
    const clockEl = document.getElementById('liveBnClock');
    function tick() {
      const now = new Date();
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('bn-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('bn-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  // 4. Render Breaking News Ticker
  function renderTicker() {
    const track = document.getElementById('breakingTickerTrack');
    if (!track) return;
    const topItems = ARTICLES.slice(0, 12);
    const html = [...topItems, ...topItems].map(art => `
      <span class="ticker-item" data-article-id="${art.id}">
        <span class="ticker-cat-pill">${art.location}</span>
        <span>${art.title}</span>
      </span>
    `).join('');
    track.innerHTML = html;
    track.querySelectorAll('.ticker-item').forEach(item => {
      item.addEventListener('click', () => openArticleModal(Number(item.dataset.articleId)));
    });
  }

  // 5. Render Hero Bento Section
  function renderHero() {
    const leadContainer = document.getElementById('heroLeadContainer');
    const stackContainer = document.getElementById('heroStackContainer');
    if (!leadContainer || !stackContainer || ARTICLES.length === 0) return;

    const lead = ARTICLES[0];
    leadContainer.innerHTML = `
      <article class="hero-lead-card" data-article-id="${lead.id}">
        <div class="hero-lead-media">
          <img src="${lead.image}" alt="${lead.title.replace(/"/g, '&quot;')}" fetchpriority="high" loading="eager" />
          <div class="hero-badges-overlay">
            <span class="badge-exclusive">🔥 শীর্ষ প্রতিবেদন • EXCLUSIVE</span>
            <span class="badge-cat">${lead.location}</span>
          </div>
        </div>
        <div class="hero-lead-body">
          <div>
            <h2 class="hero-lead-title">${lead.title}</h2>
            <p class="hero-lead-excerpt" style="margin-top:0.65rem;">${lead.excerpt}</p>
          </div>
          <div class="article-meta-row">
            <span class="reporter-tag">✍️ ${lead.reporter}</span>
            <span>📅 ${lead.formattedDateBn}</span>
            <span class="read-more-pill">সম্পূর্ণ প্রতিবেদন পড়ুন →</span>
          </div>
        </div>
      </article>
    `;
    leadContainer.querySelector('.hero-lead-card').addEventListener('click', () => openArticleModal(lead.id));

    const stackItems = ARTICLES.slice(1, 5);
    stackContainer.innerHTML = stackItems.map(art => `
      <article class="hero-stack-card" data-article-id="${art.id}">
        <div class="stack-thumb">
          <img src="${art.image}" alt="${art.title.replace(/"/g, '&quot;')}" loading="eager" />
        </div>
        <div class="stack-info">
          <div class="stack-meta">
            <span style="color:var(--brand-primary);font-weight:800;">${art.location}</span>
            <span>•</span>
            <span>${art.formattedDateBn}</span>
          </div>
          <h3 class="stack-title">${art.title}</h3>
          <div class="stack-meta">
            <span>✍️ ${art.reporter}</span>
          </div>
        </div>
      </article>
    `).join('');

    stackContainer.querySelectorAll('.hero-stack-card').forEach(card => {
      card.addEventListener('click', () => openArticleModal(Number(card.dataset.articleId)));
    });
  }

  // 6. Render Category Tabs & District Pills
  function renderFilters() {
    const catBar = document.getElementById('categoryTabsBar');
    if (catBar) {
      catBar.innerHTML = CATEGORIES.map(cat => {
        const count = cat === 'সব খবর'
          ? ARTICLES.length
          : ARTICLES.filter(a => a.beats.includes(cat)).length;
        const activeClass = cat === currentCategory ? 'active' : '';
        return `
          <button class="cat-tab ${activeClass}" data-cat="${cat}" role="tab" aria-selected="${cat === currentCategory}">
            <span>${cat}</span>
            <span class="cat-count">${count}</span>
          </button>
        `;
      }).join('');

      catBar.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          currentCategory = btn.dataset.cat;
          currentReporter = '';
          visibleCount = 12;
          renderFilters();
          renderMainNewsGrid();
          document.getElementById('mainNewsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    const distBar = document.getElementById('districtPillsBar');
    if (distBar) {
      distBar.innerHTML = DISTRICTS.map(d => `
        <button class="district-pill ${d === currentDistrict ? 'active' : ''}" data-dist="${d}">
          ${d}
        </button>
      `).join('');

      distBar.querySelectorAll('.district-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          currentDistrict = btn.dataset.dist;
          visibleCount = 12;
          renderFilters();
          renderMainNewsGrid();
          document.getElementById('mainNewsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  }

  function createNewsCardHTML(art) {
    return `
      <article class="news-card" data-article-id="${art.id}">
        <div class="card-media">
          <img src="${art.image}" alt="${art.title.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" />
          <div class="card-badges">
            <span class="badge-cat">${art.primaryBeat}</span>
          </div>
          <span class="card-loc-badge">📍 ${art.location}</span>
        </div>
        <div class="card-body">
          <div>
            <h3 class="card-title">${art.title}</h3>
            <p class="card-excerpt" style="margin-top:0.5rem;">${art.excerpt}</p>
          </div>
          <div class="card-footer">
            <span class="reporter-tag">✍️ ${art.reporter}</span>
            <span>${art.formattedDateBn}</span>
          </div>
        </div>
      </article>
    `;
  }

  // 7. Filter & Render Main News Grid
  function getFilteredArticles() {
    return ARTICLES.filter(art => {
      if (currentCategory !== 'সব খবর' && !art.beats.includes(currentCategory)) {
        return false;
      }
      if (currentDistrict !== 'সব এলাকা' && art.districtTag !== currentDistrict) {
        return false;
      }
      if (currentReporter && art.reporter !== currentReporter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        const hay = (art.title + ' ' + art.excerpt + ' ' + art.location + ' ' + art.reporter + ' ' + art.cleanParagraphs.join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderMainNewsGrid() {
    const grid = document.getElementById('mainNewsGrid');
    const titleEl = document.getElementById('mainSectionTitle');
    const subEl = document.getElementById('mainSectionSubtitle');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const resetFilterBtn = document.getElementById('resetFiltersBtn');
    if (!grid) return;

    const filtered = getFilteredArticles();

    if (titleEl) {
      if (currentReporter) {
        titleEl.textContent = `প্রতিবেদক: ${currentReporter}-এর প্রতিবেদনসমূহ`;
      } else if (searchQuery.trim()) {
        titleEl.textContent = `অনুসন্ধান ফলাফল: "${searchQuery}"`;
      } else if (currentDistrict !== 'সব এলাকা') {
        titleEl.textContent = `${currentDistrict} — আঞ্চলিক সংবাদ`;
      } else {
        titleEl.textContent = currentCategory === 'সব খবর' ? 'সর্বশেষ সংবাদ ও বিশেষ প্রতিবেদন' : `${currentCategory} বিভাগ`;
      }
    }

    if (subEl) {
      subEl.textContent = `মোট ${filtered.length}টি যাচাইকৃত প্রতিবেদন পাওয়া গেছে`;
    }

    const isFiltered = currentCategory !== 'সব খবর' || currentDistrict !== 'সব এলাকা' || currentReporter !== '' || searchQuery.trim() !== '';
    if (resetFilterBtn) {
      resetFilterBtn.style.display = isFiltered ? 'inline-flex' : 'none';
    }

    const slice = filtered.slice(0, visibleCount);
    if (slice.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 3rem 1rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h3 style="font-size:1.25rem; margin-bottom:0.5rem;">কোনও সংবাদ খুঁজে পাওয়া যায়নি</h3>
          <p style="color:var(--text-muted); margin-bottom:1rem;">অন্য কোনও বিভাগ বা শব্দ দিয়ে অনুসন্ধান করুন।</p>
          <button class="btn-gold" id="emptyResetBtn">সব খবর দেখুন</button>
        </div>
      `;
      document.getElementById('emptyResetBtn')?.addEventListener('click', resetAllFilters);
    } else {
      grid.innerHTML = slice.map(createNewsCardHTML).join('');
      grid.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', () => openArticleModal(Number(card.dataset.articleId)));
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.style.display = filtered.length > visibleCount ? 'inline-block' : 'none';
    }
  }

  function resetAllFilters() {
    currentCategory = 'সব খবর';
    currentDistrict = 'সব এলাকা';
    currentReporter = '';
    searchQuery = '';
    const sInput = document.getElementById('newsSearchInput');
    if (sInput) sInput.value = '';
    visibleCount = 12;
    renderFilters();
    renderMainNewsGrid();
  }

  // 8. Render Dedicated Thematic Sections (Hooghly Desk, Sports Arena, Culture & Entertainment)
  function renderThematicSections() {
    const hooghlyGrid = document.getElementById('hooghlyDeskGrid');
    if (hooghlyGrid) {
      const hooghlyStories = ARTICLES.filter(a => /হুগলি|ডানকুনি|চন্ডীতলা|চুঁচুড়া|উত্তরপাড়া|পুরশুড়া|হাওড়া/.test(a.location)).slice(0, 6);
      hooghlyGrid.innerHTML = hooghlyStories.map(createNewsCardHTML).join('');
      hooghlyGrid.querySelectorAll('.news-card').forEach(c => {
        c.addEventListener('click', () => openArticleModal(Number(c.dataset.articleId)));
      });
    }

    const sportsGrid = document.getElementById('sportsArenaGrid');
    if (sportsGrid) {
      const sportsStories = ARTICLES.filter(a => a.beats.includes('খেলাধুলা')).slice(0, 6);
      sportsGrid.innerHTML = sportsStories.map(createNewsCardHTML).join('');
      sportsGrid.querySelectorAll('.news-card').forEach(c => {
        c.addEventListener('click', () => openArticleModal(Number(c.dataset.articleId)));
      });
    }

    const cultureGrid = document.getElementById('cultureDeskGrid');
    if (cultureGrid) {
      const cultureStories = ARTICLES.filter(a => a.beats.includes('বিনোদন ও সংস্কৃতি') || a.beats.includes('স্বাস্থ্য ও সমাজ')).slice(0, 6);
      cultureGrid.innerHTML = cultureStories.map(createNewsCardHTML).join('');
      cultureGrid.querySelectorAll('.news-card').forEach(c => {
        c.addEventListener('click', () => openArticleModal(Number(c.dataset.articleId)));
      });
    }
  }

  // 9. Full-Article Reader Modal (<dialog>)
  function openArticleModal(articleId) {
    const art = ARTICLES.find(a => a.id === articleId);
    const dialog = document.getElementById('articleReaderModal');
    if (!art || !dialog) return;

    stopSpeech();

    const bodyEl = document.getElementById('readerModalBody');
    const related = ARTICLES.filter(a => a.id !== art.id && a.beats.some(b => art.beats.includes(b))).slice(0, 3);

    bodyEl.innerHTML = `
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
        <span class="badge-exclusive">${art.primaryBeat}</span>
        <span class="badge-cat">📍 ${art.location}</span>
      </div>
      <h1 class="reader-title">${art.title}</h1>
      <div class="reader-byline">
        <div>
          <strong>✍️ প্রতিবেদক: ${art.reporter}</strong>
          <div style="color:var(--text-muted); font-size:0.78rem;">ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া • ভেরিফায়েড ডিসপ্যাচ</div>
        </div>
        <div style="text-align:right;">
          <div>📅 ${art.formattedDateBn}</div>
          <div style="color:var(--text-muted); font-size:0.76rem;">পাঠের সময়: ~২ মিনিট</div>
        </div>
      </div>
      <img class="reader-hero-img" src="${art.image}" alt="${art.title.replace(/"/g, '&quot;')}" />
      <div class="reader-content" id="readerArticleText" style="--reader-font-size:${currentReaderFontSize}rem;">
        ${art.cleanParagraphs.map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="reader-share-bar">
        <div style="font-size:0.84rem; font-weight:700; color:var(--text-secondary);">
          এই প্রতিবেদনটি শেয়ার করুন:
        </div>
        <div class="share-buttons">
          <button class="tool-pill-btn" id="shareWaBtn">🟢 WhatsApp</button>
          <button class="tool-pill-btn" id="shareFbBtn">🔵 Facebook</button>
          <button class="tool-pill-btn" id="copyArtLinkBtn">🔗 লিঙ্ক কপি করুন</button>
          <a class="tool-pill-btn" href="${art.origLink}" target="_blank" rel="noopener">🌐 মূল সূত্র</a>
        </div>
      </div>
      ${related.length ? `
        <div style="margin-top:2rem; padding-top:1.25rem; border-top:2px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; margin-bottom:1rem; font-family:var(--font-bn-serif);">আরও সম্পর্কিত প্রতিবেদন</h3>
          <div class="news-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
            ${related.map(r => `
              <div class="news-card related-card-item" data-rel-id="${r.id}" style="box-shadow:none;">
                <div class="card-media" style="aspect-ratio:16/9;">
                  <img src="${r.image}" alt="${r.title.replace(/"/g, '&quot;')}" loading="lazy" />
                </div>
                <div class="card-body" style="padding:0.75rem;">
                  <h4 style="font-size:0.92rem; line-height:1.35;">${r.title}</h4>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    const shareUrl = window.location.origin + window.location.pathname + `?article=${art.id}`;
    document.getElementById('shareWaBtn')?.addEventListener('click', () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(art.title + ' — ' + shareUrl)}`, '_blank');
    });
    document.getElementById('shareFbBtn')?.addEventListener('click', () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    });
    document.getElementById('copyArtLinkBtn')?.addEventListener('click', (e) => {
      navigator.clipboard?.writeText(shareUrl);
      e.currentTarget.textContent = '✅ কপি হয়েছে!';
    });

    bodyEl.querySelectorAll('.related-card-item').forEach(rc => {
      rc.addEventListener('click', () => openArticleModal(Number(rc.dataset.relId)));
    });

    const speakModalBtn = document.getElementById('modalSpeakBtn');
    if (speakModalBtn) {
      speakModalBtn.onclick = () => toggleSpeakText(art.title + '। ' + art.cleanParagraphs.join(' '), speakModalBtn);
    }

    if (!dialog.open) {
      dialog.showModal();
    }
    bodyEl.scrollTop = 0;
  }

  // 10. Web Speech API Audio News Reader
  function stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    const heroBtn = document.getElementById('playAudioBulletinBtn');
    if (heroBtn) {
      heroBtn.classList.remove('playing');
      heroBtn.innerHTML = '🔊 আজকের শীর্ষ ৫ হেডলাইন শুনুন';
    }
    const modalBtn = document.getElementById('modalSpeakBtn');
    if (modalBtn) {
      modalBtn.textContent = '🔊 শুনুন';
    }
  }

  function toggleSpeakText(text, btnEl, isHeroBulletin) {
    if (!('speechSynthesis' in window)) {
      alert('আপনার ব্রাউজারে অডিও রিডার উপলব্ধ নয়।');
      return;
    }
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(v => v.lang && v.lang.toLowerCase().includes('bn'));
    if (bnVoice) utter.voice = bnVoice;
    utter.lang = 'bn-IN';
    utter.rate = 0.95;

    utter.onend = () => stopSpeech();
    utter.onerror = () => stopSpeech();

    isSpeaking = true;
    if (isHeroBulletin) {
      btnEl.classList.add('playing');
      btnEl.innerHTML = '⏹️ বুলেটিন থামান (চলছে...)';
    } else {
      btnEl.textContent = '⏹️ থামান';
    }
    window.speechSynthesis.speak(utter);
  }

  // 11. Brand Logo Suite Modal (All 12 Circular Sovereign Editions)
  function renderLogoSuiteModal() {
    const grid = document.getElementById('logoSuiteModalGrid');
    if (!grid) return;
    grid.innerHTML = COIN_THEMES.map(theme => `
      <div class="logo-Option-card ${theme.id === activeBrandTheme ? 'active' : ''}" data-theme-id="${theme.id}">
        ${buildCoinSVG(theme, true)}
        <div style="font-weight:800; font-size:0.84rem;">${theme.name}</div>
        <button class="tool-pill-btn" style="font-size:0.72rem;">এই থিমটি প্রয়োগ করুন</button>
      </div>
    `).join('');

    grid.querySelectorAll('.logo-Option-card').forEach(card => {
      card.addEventListener('click', () => {
        setBrandEdition(card.dataset.themeId);
      });
    });
  }

  // 12. Institutional Info Pages Modal (About, Disclaimer, Privacy, Terms)
  const INFO_PAGES = {
    about: {
      title: 'আমাদের সম্পর্কে — Digital Indian Golden India',
      html: `
        <p><strong>ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া (Digital Indian Golden India)</strong> পশ্চিমবঙ্গ তথা ভারতের অন্যতম দ্রুতগতিসম্পন্ন ও নির্ভরযোগ্য ডিজিটাল সংবাদ ও বিনোদন প্ল্যাটফর্ম। কলকাতা, হুগলি (ডানকুনি, চন্ডীতলা, উত্তরপাড়া, চুঁচুড়া, পুরশুড়া), হাওড়া, বীরভূম, নদিয়া ও মুর্শিদাবাদ থেকে শুরু করে জাতীয় ও আন্তর্জাতিক স্তরের প্রতিটি গুরুত্বপূর্ণ খবর আমরা নির্ভীক ও নিরপেক্ষভাবে পাঠকদের কাছে পৌঁছে দিই।</p>
        <p>আমাদের লক্ষ্য শুধুমাত্র ব্রেকিং নিউজ পরিবেশন নয়—জনস্বার্থবাহী সরকারি প্রকল্প, গ্রামীণ স্বাস্থ্য পরিষেবা, শিক্ষা, ক্রীড়া এবং সাধারণ মানুষের প্রাত্যহিক সমস্যা ও সম্ভাবনার কথা তুলে ধরা।</p>
        <h3 style="margin-top:1rem;">আমাদের আঞ্চলিক ও বিশেষ ব্যুরো নেটওয়ার্ক</h3>
        <ul style="margin-left:1.25rem; display:flex; flex-direction:column; gap:0.4rem;">
          <li><strong>হুগলি ও শহরতলি ডেস্ক:</strong> সেখ আব্দুল আজিম (চন্ডীতলা, ডানকুনি ও নবাবপুর), পুলক চক্রবর্তী (চুঁচুড়া), শুভঙ্কর মুখার্জী (পুরশুড়া)</li>
          <li><strong>মুর্শিদাবাদ ও নদিয়া ব্যুরো:</strong> খন্দকার ফজলে মুর্শেদ ও আঞ্চলিক সংবাদদাতা দল</li>
          <li><strong>কলকাতা ও রাজ্য ডেস্ক:</strong> ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া কেন্দ্রীয় সম্পাদনা কক্ষ</li>
        </ul>
      `
    },
    disclaimer: {
      title: 'ডিসক্লেইমার ও সম্পাদকীয় নীতি (Disclaimer & Editorial Policy)',
      html: `
        <p><strong>ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া</strong>-য় প্রকাশিত সমস্ত সংবাদ, প্রতিবেদন, মতামত এবং তথ্য সংশ্লিষ্ট প্রতিবেদক, সরকারি বিজ্ঞপ্তি বা নির্ভরযোগ্য সংবাদ সূত্রের ওপর ভিত্তি করে প্রকাশিত।</p>
        <p>সরকারি প্রকল্প (যেমন অন্নপূর্ণা যোজনা, লক্ষ্মীর ভাণ্ডার, হজ টিকাকরণ বা ভ্রাম্যমাণ চিকিৎসালয়) সংক্রান্ত যে কোনও প্রতিবেদনে উল্লিখিত তথ্য পাঠকদের সুবিধার্থে প্রদান করা হয়। চূড়ান্ত আবেদনের পূর্বে সংশ্লিষ্ট সরকারি পোর্টাল বা দপ্তরে তথ্য যাচাই করার জন্য পাঠকদের অনুরোধ করা হচ্ছে।</p>
        <p>আমরা ভুয়ো খবর (Fake News) ও গুজবের বিরুদ্ধে জিরো-টলারেন্স নীতি অনুসরণ করি। কোনও প্রতিবেদনে তথ্যগত ত্রুটি পরিলক্ষিত হলে প্রমাণসহ আমাদের সম্পাদনা কক্ষে জানালে অবিলম্বে তা সংশোধন করা হয়।</p>
      `
    },
    privacy: {
      title: 'গোপনীয়তা নীতি (Privacy Policy)',
      html: `
        <p><strong>Digital Indian Golden India</strong> পাঠকদের ব্যক্তিগত তথ্যের গোপনীয়তা ও সুরক্ষাকে সর্বোচ্চ অগ্রাধিকার দেয়।</p>
        <p>পাঠকরা যখন আমাদের পোর্টালে সংবাদ পড়েন বা ‘সংবাদ পাঠান’ ফর্মের মাধ্যমে যোগাযোগ করেন, তখন প্রদত্ত নাম, ইমেইল বা ফোন নম্বর শুধুমাত্র সংবাদ যাচাই ও যোগাযোগের উদ্দেশ্যে ব্যবহৃত হয়। কোনও তৃতীয় পক্ষের কাছে পাঠকের ব্যক্তিগত তথ্য বিক্রি বা হস্তান্তর করা হয় না।</p>
      `
    },
    terms: {
      title: 'ব্যবহারের শর্তাবলী (Terms & Conditions)',
      html: `
        <p>এই ওয়েবসাইটের সমস্ত লোগো (Circular Sovereign Coin Emblem), প্রতিবেদন, ছবি এবং গ্রাফিক্স <strong>Digital Indian Golden India</strong>-র মেধাস্বত্বের অন্তর্ভুক্ত।</p>
        <p>উৎস উল্লেখ (Credit & Link) ছাড়া কোনও প্রতিবেদন বা ছবি হুবহু নকল করে বাণিজ্যিক উদ্দেশ্যে ব্যবহার করা নিষিদ্ধ। সামাজিক মাধ্যমে শেয়ার করার ক্ষেত্রে আমাদের অফিসিয়াল শেয়ার বাটন ব্যবহার করার অনুরোধ করা হচ্ছে।</p>
      `
    }
  };

  function openInfoModal(pageKey) {
    const page = INFO_PAGES[pageKey] || INFO_PAGES.about;
    const dialog = document.getElementById('infoPageModal');
    const titleEl = document.getElementById('infoModalTitle');
    const bodyEl = document.getElementById('infoModalBody');
    if (!dialog || !titleEl || !bodyEl) return;
    titleEl.textContent = page.title;
    bodyEl.innerHTML = page.html;
    dialog.showModal();
  }

  // 13. Wire Up All DOM Events on Load
  function init() {
    // Populate Brand Edition Selector
    const sel = document.getElementById('brandEditionSelect');
    if (sel) {
      sel.innerHTML = COIN_THEMES.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      sel.addEventListener('change', () => setBrandEdition(sel.value));
    }

    setBrandEdition('teal');
    initClockAndDate();
    renderTicker();
    renderHero();
    renderFilters();
    renderMainNewsGrid();
    renderThematicSections();
    renderLogoSuiteModal();

    // Light / Dark Mode Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn?.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        themeBtn.innerHTML = '🌙 ডার্ক মোড';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '☀️ লাইট মোড';
      }
    });

    // Search Input
    const searchInput = document.getElementById('newsSearchInput');
    const searchClear = document.getElementById('searchClearBtn');
    searchInput?.addEventListener('input', () => {
      searchQuery = searchInput.value;
      visibleCount = 12;
      renderMainNewsGrid();
    });
    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      renderMainNewsGrid();
    });

    // Load More & Reset Filters
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      visibleCount += 12;
      renderMainNewsGrid();
    });
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetAllFilters);

    // Trending Tag Chips
    document.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const kw = chip.dataset.keyword || '';
        if (searchInput) searchInput.value = kw;
        searchQuery = kw;
        currentCategory = 'সব খবর';
        currentDistrict = 'সব এলাকা';
        renderFilters();
        renderMainNewsGrid();
        document.getElementById('mainNewsSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Correspondent Cards
    document.querySelectorAll('.reporter-card').forEach(rc => {
      rc.addEventListener('click', () => {
        currentReporter = rc.dataset.reporter || '';
        currentCategory = 'সব খবর';
        currentDistrict = 'সব এলাকা';
        renderFilters();
        renderMainNewsGrid();
        document.getElementById('mainNewsSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Hero Audio Bulletin Button
    const heroAudioBtn = document.getElementById('playAudioBulletinBtn');
    heroAudioBtn?.addEventListener('click', () => {
      const top5 = ARTICLES.slice(0, 5).map((a, idx) => `খবর ${idx + 1}: ${a.location} থেকে, ${a.title}`).join('। ');
      const intro = `ডিজিটাল ইন্ডিয়ান গোল্ডেন ইন্ডিয়া সংবাদ বুলেটিনে আপনাদের স্বাগত। আজকের শীর্ষ খবরগুলি হলো— ${top5}। বিস্তারিত খবর পড়তে যেকোনো প্রতিবেদনে ক্লিক করুন।`;
      toggleSpeakText(intro, heroAudioBtn, true);
    });

    // Reader Modal Controls (Font Size, Print, Close, Light-Dismiss)
    document.getElementById('fontDecBtn')?.addEventListener('click', () => {
      currentReaderFontSize = Math.max(0.9, +(currentReaderFontSize - 0.1).toFixed(2));
      document.getElementById('readerArticleText')?.style.setProperty('--reader-font-size', `${currentReaderFontSize}rem`);
    });
    document.getElementById('fontIncBtn')?.addEventListener('click', () => {
      currentReaderFontSize = Math.min(1.5, +(currentReaderFontSize + 0.1).toFixed(2));
      document.getElementById('readerArticleText')?.style.setProperty('--reader-font-size', `${currentReaderFontSize}rem`);
    });
    document.getElementById('modalPrintBtn')?.addEventListener('click', () => window.print());

    // Open Modals
    document.getElementById('openLogoSuiteBtn')?.addEventListener('click', () => {
      document.getElementById('logoSuiteModal')?.showModal();
    });
    document.getElementById('mastheadCoinStage')?.addEventListener('click', () => {
      document.getElementById('logoSuiteModal')?.showModal();
    });
    document.getElementById('openTipModalBtn')?.addEventListener('click', () => {
      document.getElementById('citizenTipModal')?.showModal();
    });

    document.querySelectorAll('[data-info-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openInfoModal(btn.dataset.infoPage);
      });
    });

    document.querySelectorAll('[data-cat-jump]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        currentCategory = btn.dataset.catJump;
        currentDistrict = 'সব এলাকা';
        currentReporter = '';
        renderFilters();
        renderMainNewsGrid();
        document.getElementById('mainNewsSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Close & Backdrop Light-Dismiss for all <dialog> elements
    document.querySelectorAll('dialog.digi-modal').forEach(dlg => {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) {
          stopSpeech();
          dlg.close();
        }
      });
      dlg.querySelectorAll('[data-close-modal]').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
          stopSpeech();
          dlg.close();
        });
      });
    });

    // Citizen Tip Form Submission
    const tipForm = document.getElementById('citizenTipForm');
    tipForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('tipFormStatus');
      if (status) {
        status.style.display = 'block';
        status.textContent = '✅ ধন্যবাদ! আপনার সংবাদ ও তথ্য আমাদের সম্পাদনা কক্ষে জমা পড়েছে। আমাদের প্রতিনিধি দ্রুত আপনার সাথে যোগাযোগ করবেন।';
      }
      tipForm.reset();
    });

    // Deep-link support (?article=ID)
    const params = new URLSearchParams(window.location.search);
    const deepId = Number(params.get('article'));
    if (deepId) {
      openArticleModal(deepId);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
