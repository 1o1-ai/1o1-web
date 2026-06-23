/**
 * Sahadeva — ManjuLAB Study Assistant on CBSE10 forum sidebar.
 * Chapter guidance via education-portal /actors/chat (RAG + disclaimer).
 */
(function (global) {
  'use strict';

  const DISCLAIMER =
    'AI guidance only — not official CBSE marking. Verify with NCERT and your teacher.';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function apiBase(cfg) {
    return (cfg && cfg.educationApiBase) || 'https://api.brahmando.com/education';
  }

  function mount(cardEl, getFilters, cfg) {
    if (!cardEl) return;

    cardEl.innerHTML =
      '<div class="sahadeva-avatar" aria-hidden="true">🛡️</div>' +
      '<strong>Sahadeva</strong>' +
      '<span>ManjuLAB Study Assistant</span>' +
      '<p class="hint sahadeva-tagline">Ask about the chapter you selected — predictions with disclaimer.</p>' +
      '<div class="sahadeva-chat" id="sahadevaChat" aria-live="polite"></div>' +
      '<form class="sahadeva-form" id="sahadevaForm">' +
      '<input type="text" id="sahadevaInput" maxlength="400" placeholder="e.g. key points for this chapter?" autocomplete="off" />' +
      '<button type="submit" class="btn-portal btn-portal-primary sahadeva-send">Ask</button>' +
      '</form>' +
      '<p class="disclaimer sahadeva-foot">' +
      esc(DISCLAIMER) +
      '</p>';

    const chat = cardEl.querySelector('#sahadevaChat');
    const form = cardEl.querySelector('#sahadevaForm');
    const input = cardEl.querySelector('#sahadevaInput');
    let busy = false;

    function append(role, text) {
      const row = document.createElement('div');
      row.className = 'sahadeva-msg sahadeva-msg-' + role;
      row.textContent = text;
      chat.appendChild(row);
      chat.scrollTop = chat.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = (input.value || '').trim();
      if (!message || busy) return;

      const filters = typeof getFilters === 'function' ? getFilters() : {};
      const subject = filters.subject || 'science';
      const chapter = filters.chapter || '';

      busy = true;
      input.disabled = true;
      append('user', message);
      input.value = '';
      append('typing', 'Sahadeva is thinking…');

      const context = {
        subject: subject === 'mathematics' ? 'Mathematics' : 'Science',
        chapter: chapter && chapter !== 'all' ? chapter : '',
        grade: '10',
        board: 'CBSE',
        sku: 'cbse10-core',
        assistant: 'sahadeva',
      };

      try {
        const res = await fetch(apiBase(cfg).replace(/\/$/, '') + '/actors/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ actor: 'student', message: message, context: context }),
        });
        chat.removeChild(chat.lastChild);
        if (!res.ok) {
          const errText = await res.text();
          append('error', 'Could not reach tutor API (' + res.status + '). ' + errText.slice(0, 120));
          return;
        }
        const data = await res.json();
        const reply =
          data.answer ||
          data.reply ||
          data.message ||
          data.content ||
          (typeof data === 'string' ? data : '');
        append('assistant', String(reply).slice(0, 2000));
      } catch (err) {
        if (chat.lastChild) chat.removeChild(chat.lastChild);
        append('error', 'Network error — try again when online.');
      } finally {
        busy = false;
        input.disabled = false;
        input.focus();
      }
    });
  }

  global.SahadevaAssistant = { mount, DISCLAIMER };
})(typeof window !== 'undefined' ? window : globalThis);
