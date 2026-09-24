/**

 * Shared education hub rendering — single CBSE10 UI for all countries/tracks.

 */

(function (global) {

  const FLAG_CLASS = {

    india: 'portal--country-india',

    bangladesh: 'portal--country-generic',

    pakistan: 'portal--country-generic',

    singapore: 'portal--country-singapore',

    uk: 'portal--country-uk',

    canada: 'portal--country-canada',

    usa: 'portal--country-usa',

    japan: 'portal--country-generic',

    'south-korea': 'portal--country-generic',

    finland: 'portal--country-generic',

    malaysia: 'portal--country-generic',

    nigeria: 'portal--country-generic',

    philippines: 'portal--country-generic',

  };



  const STYLE_CYCLE = ['portal--saas', 'portal--caregiver', 'portal--rhytoma', 'portal--international'];
  const TRACK_ICONS = ['📐', '⚛️', '🧪', '📚', '🎓'];

  const SUBJECT_PORTAL_CSS = {

    science: 'portal--saas',

    mathematics: 'portal--caregiver',

    math: 'portal--caregiver',

    physics: 'portal--saas',

    chemistry: 'portal--international',

    biology: 'portal--rhytoma',

    sat: 'portal--saas',

    act: 'portal--caregiver',

  };



  /** Track hub circles — Study · Game (WIP) · Exam · Forum (same for every country). */

  const TRACK_SERVICES = [

    { slug: 'room', title: 'Study Room', icon: '📖', sub: 'Subject → chapter → evaluate prep', file: 'room.html', css: 'portal--saas' },

    {
      slug: 'game',
      title: 'Game Room',
      icon: '🎮',
      sub: 'Work in progress',
      file: 'game-room.html',
      css: 'portal--saas portal--game-room',
      disabled: true,
    },

    { slug: 'exam', title: 'Exam Center', icon: '📝', sub: 'Practice Test · Board paper · exam format', file: 'exam-center.html', css: 'portal--caregiver' },

    { slug: 'forum', title: 'Discussion Forum', icon: '💬', sub: 'Chapter threads · Sahadeva AI', file: 'forum.html', css: 'portal--rhytoma' },

  ];



  function esc(s) {

    return String(s || '')

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/"/g, '&quot;');

  }



  function flagClass(id) {

    return FLAG_CLASS[id] || 'portal--country-generic';

  }



  function flagMedallion(country, large) {

    const cls = flagClass(country?.id || country);

    const label = country?.title || country?.id || 'Country';

    const emoji = country?.flag || '🌍';

    const sizeCls = large ? ' flag-medallion--lg' : '';

    return `<div class="flag-medallion${sizeCls} ${cls === 'portal--country-generic' ? 'globe-medallion' : ''}" aria-label="Flag of ${esc(label)}">

      <span class="flag-emoji" aria-hidden="true">${emoji}</span>

    </div>`;

  }



  function portalCircle(opts) {

    const {

      href,

      title,

      subtitle,

      icon,

      css = 'portal--saas',

      extraClass = '',

      disabled = false,

      tag = href && !disabled ? 'a' : 'button',

      attrs = '',

    } = opts;

    const inner = `

      <div class="portal-ring"></div>

      <div class="portal-orbit"></div>

      <div class="portal-core">

        ${icon ? `<span class="portal-icon" aria-hidden="true">${icon}</span>` : flagMedallion({ flag: icon, title }, false)}

        <span class="portal-title">${esc(title)}</span>

        <span class="portal-sub">${esc(subtitle || '')}</span>

      </div>`;

    if (tag === 'a') {

      return `<a class="portal ${css}${extraClass ? ` ${extraClass}` : ''}" href="${esc(href)}"${attrs}>${inner}</a>`;

    }

    const titleAttr = attrs.includes('title=') ? '' : ' title="Coming soon"';

    return `<button type="button" class="portal ${css}${extraClass ? ` ${extraClass}` : ''} is-static" disabled${titleAttr}${attrs}>${inner}</button>`;

  }



  function createSubjectPortalButton(opts) {

    const {

      subjectClass = '',

      portalCss,

      icon = '📘',

      title,

      subtitle = '',

      dataset = {},

    } = opts || {};

    const css = portalCss || SUBJECT_PORTAL_CSS[subjectClass] || 'portal--saas';

    const btn = document.createElement('button');

    btn.type = 'button';

    btn.className = `portal ${css} sr-subject-circle ${subjectClass}`.trim();

    Object.entries(dataset).forEach(([k, v]) => {

      btn.dataset[k] = v;

    });

    btn.innerHTML = `

      <div class="portal-ring"></div>

      <div class="portal-orbit"></div>

      <div class="portal-core">

        <span class="portal-icon" aria-hidden="true">${icon}</span>

        <span class="portal-title">${esc(title)}</span>

        <span class="portal-sub">${esc(subtitle)}</span>

      </div>`;

    return btn;

  }



  function trackServiceCircles(baseHref) {

    const base = (baseHref || '').replace(/\/?index\.html?$/, '').replace(/\/$/, '');

    return TRACK_SERVICES.map((svc) =>

      portalCircle({

        href: svc.disabled ? '' : `${base}/${svc.file}`,

        title: svc.title,

        subtitle: svc.sub,

        icon: svc.icon,

        css: svc.css,

        disabled: !!svc.disabled,

        extraClass: svc.disabled ? 'portal--wip' : '',

        attrs: svc.disabled ? ' title="Work in progress — coming soon"' : '',

      })

    ).join('\n');

  }



  function countryTrackCircles(country, microservices) {

    return (microservices || []).map((svc, i) =>

      portalCircle({

        href: svc.href || `/portal/education/${country.slug}/${svc.slug}/index.html`,

        title: svc.title,

        subtitle: svc.subtitle || '',

        icon: TRACK_ICONS[i % TRACK_ICONS.length],

        css: STYLE_CYCLE[i % STYLE_CYCLE.length],

      })

    ).join('\n');

  }



  /** CBSE10-identical track hub markup (header + main). */

  function renderTrackHubPage(opts) {

    const {

      backHref = '/portal/education/',

      backLabel = 'Anyo Brahmando Academy',

      title,

      openBadge = false,

      eyebrow = '',

      heroLead = 'Study room is open to all — no login required. Master catalog with board & explore questions.',

      baseHref,

      footerNote = '📚 AI study guides in Study Room',

    } = opts;

    const badge = openBadge ? ' <span class="sr-open-badge">Open</span>' : '';

    return `

      <header class="portal-header">

        <a class="back-link" href="${esc(backHref)}">← ${esc(backLabel)}</a>

        <h1>${esc(title)}${badge}</h1>

      </header>

      <main class="portal-main">

        <div class="portal-hero">

          <p class="eyebrow">${esc(eyebrow)}</p>

          <h2>Choose your space</h2>

          <p>${esc(heroLead)}</p>

        </div>

        <div class="portal-circle-grid cbse10-hub-grid">

          ${trackServiceCircles(baseHref)}

        </div>

        <p class="portal-note">${footerNote}</p>

      </main>`;

  }



  /** India-style country hub markup — track picker circles only. */

  function renderCountryHubPage(opts) {

    const {

      backHref = '/portal/education/',

      title,

      eyebrow = '',

      heroTitle = 'Board-aligned study rooms',

      heroLead = '',

      trackCirclesHtml,

      footerHtml = 'Also explore <a href="/portal/education/international/">International exams</a> (SAT, TOEFL, GRE) connected to every country hub.',

    } = opts;

    return `

      <header class="portal-header">

        <a class="back-link" href="${esc(backHref)}">← Brahmexa Anyo Academy</a>

        <h1>${esc(title)}</h1>

      </header>

      <main class="portal-main">

        <div class="portal-hero">

          <p class="eyebrow">${esc(eyebrow)}</p>

          <h2>${esc(heroTitle)}</h2>

          <p>${esc(heroLead)}</p>

        </div>

        <div class="portal-circle-grid cbse10-hub-grid">${trackCirclesHtml}</div>

        <p class="portal-note">${footerHtml}</p>

      </main>`;

  }



  global.AnyoEducationHub = {

    esc,

    flagClass,

    flagMedallion,

    portalCircle,

    createSubjectPortalButton,

    SUBJECT_PORTAL_CSS,

    trackServiceCircles,

    countryTrackCircles,

    renderTrackHubPage,

    renderCountryHubPage,

    TRACK_SERVICES,

    TRACK_ICONS,

    STYLE_CYCLE,

    MANIFEST_URL: '/portal/education/assets/world-countries.json',

  };

})(window);

