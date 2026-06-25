/**
 * Study Room Provision — register SKU/section labs and media capabilities.
 * Usage: StudyRoomProvision.register({ id, match, sections, renderLearn, renderPractice })
 */
(function (global) {
  'use strict';

  const registry = [];

  function register(spec) {
    if (!spec?.id) throw new Error('StudyRoomProvision.register requires id');
    registry.push(spec);
  }

  function resolve(ctx) {
    return registry.find((r) => {
      try {
        return r.match(ctx);
      } catch {
        return false;
      }
    });
  }

  function capabilities(ctx) {
    const spec = resolve(ctx);
    const sec = spec?.sections?.[ctx.subjectId] || spec?.sections?.[ctx.legacySection] || null;
    return {
      spec,
      section: sec,
      needsMic: !!(sec?.needsMic || sec?.mode === 'speaking'),
      needsAudio: !!(sec?.needsAudio || sec?.mode === 'listening'),
      mode: sec?.mode || null,
    };
  }

  function renderLearn(container, ctx) {
    const cap = capabilities(ctx);
    if (!cap.spec?.renderLearn) return false;
    cap.spec.renderLearn(container, ctx, cap);
    return true;
  }

  function renderPractice(container, ctx) {
    const cap = capabilities(ctx);
    if (!cap.spec?.renderPractice) return false;
    cap.spec.renderPractice(container, ctx, cap);
    return true;
  }

  function intentLabels(ctx) {
    const cap = capabilities(ctx);
    if (!cap.section) return null;
    return {
      learn: cap.section.learnLabel || 'Learn',
      learnSub: cap.section.learnSub || 'Study guides & skill walkthrough',
      practice: cap.section.practiceLabel || 'Evaluate',
      practiceSub: cap.section.practiceSub || 'Practice items when available',
    };
  }

  function mountMediaStrip(host, ctx) {
    if (!host) return;
    const cap = capabilities(ctx);
    host.innerHTML = '';
    host.classList.remove('hidden');
    const chips = [];
    if (cap.needsMic) chips.push('🎙 Microphone');
    if (cap.needsAudio) chips.push('🔊 Audio playback');
    if (cap.mode === 'reading') chips.push('📖 Passage');
    if (cap.mode === 'writing') chips.push('✍️ Timed writing');
    if (!chips.length) {
      host.classList.add('hidden');
      return;
    }
    host.innerHTML = `<span class="sr-prov-strip-label">This section uses:</span> ${chips
      .map((c) => `<span class="sr-prov-chip">${c}</span>`)
      .join('')}`;
  }

  global.StudyRoomProvision = {
    register,
    resolve,
    capabilities,
    renderLearn,
    renderPractice,
    intentLabels,
    mountMediaStrip,
    _registry: registry,
  };
})(typeof window !== 'undefined' ? window : globalThis);
