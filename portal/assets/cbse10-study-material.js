/**
 * CBSE 10 study material loader (VOLTAIC AI-generated guides).
 */
(function (global) {
  'use strict';

  let catalog = null;

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return fetch('../../data/cbse10-study-material.json')
      .then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      })
      .then((data) => {
        catalog = data;
        return data;
      });
  }

  function chapter(chapterId) {
    return catalog?.chapters?.[chapterId] || null;
  }

  function isValidYoutubeId(id) {
    if (!id || id.length < 8 || id.length > 15) return false;
    if (/^(ap|prob|stats|triangles|circles|linear|quadratic|construct|areas|solids|energy|magnetism|heights)\d*$/i.test(id)) {
      return false;
    }
    return /^[A-Za-z0-9_-]+$/.test(id);
  }

  function mdToHtml(text) {
    if (!text) return '';
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return esc(text)
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  function buildReadText(ch) {
    const parts = [ch.title, ch.disclaimer || ''];
    if (ch.syllabusOutline?.length) {
      parts.push('Syllabus outline. ' + ch.syllabusOutline.join('. '));
    }
    if (ch.studySummary) parts.push(ch.studySummary.replace(/[#*]/g, ''));
    (ch.videos || []).forEach((v) => {
      parts.push(`Video lesson: ${v.title}.`);
      (v.transcripts || []).slice(0, 6).forEach((t) => parts.push(t.text));
    });
    (ch.scholarTips || []).forEach((t) => parts.push(t));
    return parts.join('\n\n').slice(0, 12000);
  }

  let utterance = null;

  function readAloud(ch) {
    if (!global.speechSynthesis) return false;
    global.speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(buildReadText(ch));
    utterance.rate = 0.92;
    utterance.pitch = 1;
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function stopReadAloud() {
    global.speechSynthesis?.cancel();
    utterance = null;
  }

  function renderLearnView(ch, root) {
    if (!root || !ch) return;
    root.innerHTML = '';

    const disclaimer = document.createElement('p');
    disclaimer.className = 'sr-ai-disclaimer';
    disclaimer.textContent =
      ch.disclaimer || 'AI-generated study guide — verify with NCERT and your teacher.';
    root.appendChild(disclaimer);

    if (ch.syllabusOutline?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Syllabus outline</h3><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('ul');
      ch.syllabusOutline.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    if (ch.studySummary) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Study guide</h3><div class="sr-learn-body"></div>';
      sec.querySelector('.sr-learn-body').innerHTML = mdToHtml(ch.studySummary);
      root.appendChild(sec);
    }

    if (ch.videos?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Video lessons</h3>';
      ch.videos.forEach((v) => {
        const card = document.createElement('div');
        card.className = 'sr-video-card';
        const title = document.createElement('h4');
        title.textContent = v.title + (v.presenter ? ` · ${v.presenter}` : '');
        card.appendChild(title);

        if (v.youtubeId && isValidYoutubeId(v.youtubeId)) {
          const wrap = document.createElement('div');
          wrap.className = 'sr-video-embed';
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube-nocookie.com/embed/${v.youtubeId}?rel=0&modestbranding=1`;
          iframe.title = v.title;
          iframe.allow =
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          iframe.loading = 'lazy';
          wrap.appendChild(iframe);
          card.appendChild(wrap);
        } else if (v.url) {
          const a = document.createElement('a');
          a.href = v.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'Open video link';
          card.appendChild(a);
        }

        if (v.transcripts?.length) {
          const ts = document.createElement('details');
          ts.className = 'sr-transcripts';
          ts.innerHTML = '<summary>Micro-lesson timestamps</summary><ul></ul>';
          const ul = ts.querySelector('ul');
          v.transcripts.forEach((t) => {
            const li = document.createElement('li');
            li.innerHTML = `<time>${t.time}</time> ${t.text}`;
            ul.appendChild(li);
          });
          card.appendChild(ts);
        }
        sec.appendChild(card);
      });
      root.appendChild(sec);
    }

    if (ch.scholarTips?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Peer tips</h3><ul class="sr-learn-list"></ul>';
      const ul = sec.querySelector('ul');
      ch.scholarTips.forEach((tip) => {
        const li = document.createElement('li');
        li.textContent = tip;
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    if (ch.links?.length) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Reference links</h3><ul class="sr-learn-links"></ul>';
      const ul = sec.querySelector('ul');
      ch.links.slice(0, 8).forEach((l) => {
        if (/youtube/i.test(l.url)) return;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = l.label;
        li.appendChild(a);
        ul.appendChild(li);
      });
      root.appendChild(sec);
    }

    const actions = document.createElement('div');
    actions.className = 'sr-learn-actions';
    actions.innerHTML = `
      <button type="button" class="btn-portal btn-portal-ghost" id="btnReadAloud">🔊 Read aloud</button>
      <button type="button" class="btn-portal btn-portal-ghost" id="btnStopRead">Stop audio</button>
      <a class="btn-portal btn-portal-primary" id="learnForumLink" href="forum.html">Peer discussions →</a>
      <button type="button" class="btn-portal btn-portal-ghost" id="learnToEvaluateBtn">Try Evaluate</button>
    `;
    root.appendChild(actions);

    actions.querySelector('#btnReadAloud')?.addEventListener('click', () => readAloud(ch));
    actions.querySelector('#btnStopRead')?.addEventListener('click', stopReadAloud);
    const forumLink = actions.querySelector('#learnForumLink');
    if (forumLink) {
      forumLink.href = `forum.html?subject=${encodeURIComponent(ch.subject)}&chapter=${encodeURIComponent(ch.chapterId)}`;
    }
    actions.querySelector('#learnToEvaluateBtn')?.addEventListener('click', () => {
      global.dispatchEvent(new CustomEvent('cbse10:switch-evaluate'));
    });
  }

  global.CBSE10StudyMaterial = {
    load,
    chapter,
    renderLearnView,
    readAloud,
    stopReadAloud,
    isValidYoutubeId,
  };
})(typeof window !== 'undefined' ? window : globalThis);
