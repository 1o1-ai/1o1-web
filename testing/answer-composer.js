/**
 * Abhyas Answer Composer — math/science symbol toolbar, drawing canvas, image upload.
 * Serializes to plain text (text-only) or JSON {"text":"…","images":[…]} when attachments present.
 */
(function (global) {
  'use strict';

  var STYLE_ID = 'answer-composer-styles';
  var MAX_IMAGES = 3;
  var MAX_IMAGE_BYTES = 2 * 1024 * 1024;

  var SYMBOL_GROUPS = [
    {
      label: 'Math',
      symbols: [
        { t: '+', l: '+' }, { t: '−', l: '−' }, { t: '×', l: '×' }, { t: '÷', l: '÷' },
        { t: '±', l: '±' }, { t: '=', l: '=' }, { t: '≠', l: '≠' }, { t: '≈', l: '≈' },
        { t: '<', l: '<' }, { t: '>', l: '>' }, { t: '≤', l: '≤' }, { t: '≥', l: '≥' },
        { t: '∞', l: '∞' }, { t: 'π', l: 'π' }, { t: '°', l: '°' }, { t: '∴', l: '∴' },
      ],
    },
    {
      label: 'Roots',
      symbols: [
        { t: '√( )', l: '√', cursor: -2 }, { t: '∛( )', l: '∛', cursor: -2 },
        { t: 'x²', l: 'x²' }, { t: 'x³', l: 'x³' }, { t: 'xⁿ', l: 'xⁿ' },
        { t: '½', l: '½' }, { t: '¼', l: '¼' }, { t: '¾', l: '¾' },
        { t: '( )/( )', l: 'a/b', cursor: -6 },
      ],
    },
    {
      label: 'Algebra',
      symbols: [
        { t: '( )', l: '( )', cursor: -2 }, { t: '[ ]', l: '[ ]', cursor: -2 },
        { t: '| |', l: '|x|', cursor: -2 }, { t: '∑', l: '∑' }, { t: '∏', l: '∏' },
        { t: '∫', l: '∫' }, { t: '∂', l: '∂' }, { t: '∆', l: '∆' },
        { t: 'log', l: 'log' }, { t: 'ln', l: 'ln' },
      ],
    },
    {
      label: 'Geometry',
      symbols: [
        { t: '∠', l: '∠' }, { t: '⊥', l: '⊥' }, { t: '∥', l: '∥' }, { t: '△', l: '△' },
        { t: '□', l: '□' }, { t: '○', l: '○' }, { t: '≅', l: '≅' }, { t: '∼', l: '∼' },
        { t: 'sin', l: 'sin' }, { t: 'cos', l: 'cos' }, { t: 'tan', l: 'tan' },
      ],
    },
    {
      label: 'Chem',
      symbols: [
        { t: '→', l: '→' }, { t: '⇌', l: '⇌' }, { t: '↑', l: '↑' }, { t: '↓', l: '↓' },
        { t: '(s)', l: '(s)' }, { t: '(l)', l: '(l)' }, { t: '(g)', l: '(g)' }, { t: '(aq)', l: '(aq)' },
        { t: 'H₂O', l: 'H₂O' }, { t: 'CO₂', l: 'CO₂' }, { t: 'H⁺', l: 'H⁺' }, { t: 'OH⁻', l: 'OH⁻' },
      ],
    },
    {
      label: 'Physics',
      symbols: [
        { t: 'λ', l: 'λ' }, { t: 'Ω', l: 'Ω' }, { t: 'η', l: 'η' }, { t: 'ρ', l: 'ρ' },
        { t: 'ν', l: 'ν' }, { t: 'μ', l: 'μ' }, { t: 'σ', l: 'σ' }, { t: 'θ', l: 'θ' },
        { t: 'F = ', l: 'F=' }, { t: 'v = ', l: 'v=' }, { t: 'a = ', l: 'a=' }, { t: 'W = ', l: 'W=' },
      ],
    },
  ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent = [
      '.answer-composer { margin-top: 4px; }',
      '.ac-toolbar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }',
      '.ac-sym-groups { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-start; }',
      '.ac-sym-group { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding: 6px 8px; border-radius: 12px; background: var(--bg, #f8fafc); border: 1px solid var(--line, rgba(15,23,42,.08)); }',
      '.ac-sym-group-label { font-size: 0.62rem; font-weight: 800; color: var(--muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 2px; }',
      '.ac-sym-btn { min-width: 30px; height: 30px; padding: 0 7px; border-radius: 8px; border: 1px solid var(--line, rgba(15,23,42,.1)); background: var(--surface, #fff); font-size: 0.82rem; font-weight: 600; cursor: pointer; line-height: 1; transition: border-color .15s, background .15s; }',
      '.ac-sym-btn:hover { border-color: var(--teal, #0d9488); background: #f0fdfa; }',
      '.ac-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }',
      '.ac-action-btn { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line, rgba(15,23,42,.1)); background: var(--surface, #fff); font-size: 0.78rem; font-weight: 700; cursor: pointer; }',
      '.ac-action-btn:hover { border-color: var(--teal, #0d9488); }',
      '.ac-action-btn.active { background: #ecfdf5; border-color: var(--teal, #0d9488); color: var(--teal, #0d9488); }',
      '.ac-textarea { width: 100%; min-height: 100px; padding: 14px; border: 2px solid var(--line, rgba(15,23,42,.08)); border-radius: 14px; font-size: 0.95rem; resize: vertical; font-family: "Segoe UI Symbol", "Cambria Math", "DM Sans", system-ui, sans-serif; line-height: 1.55; }',
      '.ac-textarea.long { min-height: 160px; }',
      '.ac-textarea:focus { outline: none; border-color: var(--teal, #0d9488); }',
      '.ac-draw-panel { margin-top: 10px; padding: 12px; border: 1px dashed var(--line, rgba(15,23,42,.15)); border-radius: 14px; background: var(--bg, #f8fafc); }',
      '.ac-draw-panel.hidden { display: none; }',
      '.ac-canvas-wrap { overflow: auto; border-radius: 10px; border: 1px solid var(--line, rgba(15,23,42,.12)); background: #fff; margin-bottom: 8px; }',
      '.ac-canvas { display: block; width: 100%; max-width: 520px; height: auto; touch-action: none; cursor: crosshair; }',
      '.ac-draw-tools { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }',
      '.ac-color { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(15,23,42,.15); cursor: pointer; }',
      '.ac-color.selected { box-shadow: 0 0 0 2px var(--teal, #0d9488); }',
      '.ac-attachments { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }',
      '.ac-thumb { position: relative; width: 88px; height: 66px; border-radius: 10px; overflow: hidden; border: 1px solid var(--line, rgba(15,23,42,.12)); background: #fff; }',
      '.ac-thumb img { width: 100%; height: 100%; object-fit: cover; }',
      '.ac-thumb button { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border: none; border-radius: 50%; background: rgba(15,23,42,.75); color: #fff; font-size: 0.7rem; cursor: pointer; line-height: 1; }',
      '.ac-hint { font-size: 0.72rem; color: var(--muted, #64748b); margin-top: 6px; }',
    ].join('\n');
    document.head.appendChild(css);
  }

  function parseAnswer(raw) {
    var s = String(raw || '').trim();
    if (!s) return { text: '', images: [] };
    if (s.charAt(0) === '{') {
      try {
        var obj = JSON.parse(s);
        if (obj && typeof obj === 'object' && ('text' in obj || 'images' in obj)) {
          return {
            text: String(obj.text || ''),
            images: Array.isArray(obj.images) ? obj.images.slice(0, MAX_IMAGES) : [],
          };
        }
      } catch (e) { /* plain text */ }
    }
    return { text: s, images: [] };
  }

  function serializeAnswer(text, images) {
    var t = String(text || '').trim();
    var imgs = (images || []).filter(function (img) { return img && img.data; });
    if (!imgs.length) return t;
    return JSON.stringify({ text: t, images: imgs.map(function (img) {
      return { type: img.type || 'upload', name: img.name || 'attachment.png', data: img.data };
    }) });
  }

  function hasContent(parsed) {
    if (!parsed) return false;
    if (String(parsed.text || '').trim()) return true;
    return !!(parsed.images && parsed.images.length);
  }

  function insertAtCursor(ta, text, cursorOffset) {
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var val = ta.value;
    ta.value = val.slice(0, start) + text + val.slice(end);
    var pos = start + text.length + (cursorOffset || 0);
    if (pos < 0) pos = 0;
    ta.setSelectionRange(pos, pos);
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function resizeDataUrl(dataUrl, maxW, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        var scale = w > maxW ? (maxW / w) : 1;
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality != null ? quality : 0.85));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function dataUrlBytes(dataUrl) {
    var base64 = String(dataUrl || '').split(',')[1] || '';
    return Math.ceil((base64.length * 3) / 4);
  }

  function mount(container, options) {
    injectStyles();
    options = options || {};
    var parsed = parseAnswer(options.value || '');
    var images = parsed.images.slice();
    var drawingOpen = false;
    var penColor = '#0f172a';
    var drawing = false;
    var lastX = 0;
    var lastY = 0;
    var canvasDirty = false;

    container.innerHTML = '';
    container.className = 'answer-composer';

    var toolbar = document.createElement('div');
    toolbar.className = 'ac-toolbar';

    var symWrap = document.createElement('div');
    symWrap.className = 'ac-sym-groups';
    SYMBOL_GROUPS.forEach(function (group) {
      var g = document.createElement('div');
      g.className = 'ac-sym-group';
      var lbl = document.createElement('span');
      lbl.className = 'ac-sym-group-label';
      lbl.textContent = group.label;
      g.appendChild(lbl);
      group.symbols.forEach(function (sym) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ac-sym-btn';
        btn.title = sym.t;
        btn.textContent = sym.l;
        btn.onclick = function () { insertAtCursor(textarea, sym.t, sym.cursor || 0); notify(); };
        g.appendChild(btn);
      });
      symWrap.appendChild(g);
    });
    toolbar.appendChild(symWrap);

    var actions = document.createElement('div');
    actions.className = 'ac-actions';
    var drawBtn = document.createElement('button');
    drawBtn.type = 'button';
    drawBtn.className = 'ac-action-btn';
    drawBtn.textContent = '✏️ Draw diagram';
    var uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'ac-action-btn';
    uploadBtn.textContent = '📷 Upload image';
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif';
    fileInput.style.display = 'none';
    actions.appendChild(drawBtn);
    actions.appendChild(uploadBtn);
    actions.appendChild(fileInput);
    toolbar.appendChild(actions);
    container.appendChild(toolbar);

    var textarea = document.createElement('textarea');
    textarea.className = 'ac-textarea' + (options.isLong ? ' long' : '');
    textarea.placeholder = options.placeholder || 'Type your answer — use symbols above for math, chemistry & physics…';
    textarea.value = parsed.text;
    textarea.dataset.qid = options.qid || '';
    container.appendChild(textarea);

    var drawPanel = document.createElement('div');
    drawPanel.className = 'ac-draw-panel hidden';
    drawPanel.innerHTML = [
      '<div class="ac-canvas-wrap"><canvas class="ac-canvas" width="520" height="280"></canvas></div>',
      '<div class="ac-draw-tools">',
      '<span style="font-size:0.72rem;font-weight:700;color:var(--muted,#64748b)">Pen:</span>',
      '<button type="button" class="ac-color selected" data-color="#0f172a" style="background:#0f172a" title="Black"></button>',
      '<button type="button" class="ac-color" data-color="#1d4ed8" style="background:#1d4ed8" title="Blue"></button>',
      '<button type="button" class="ac-color" data-color="#dc2626" style="background:#dc2626" title="Red"></button>',
      '<button type="button" class="ac-action-btn" data-tool="eraser">Eraser</button>',
      '<button type="button" class="ac-action-btn" data-tool="clear">Clear</button>',
      '<button type="button" class="ac-action-btn" data-tool="save">Add drawing to answer</button>',
      '</div>',
      '<p class="ac-hint">Use finger or mouse to sketch. Click “Add drawing to answer” when done — or upload a photo from your drawing app.</p>',
    ].join('');
    container.appendChild(drawPanel);

    var attachments = document.createElement('div');
    attachments.className = 'ac-attachments';
    container.appendChild(attachments);

    var canvas = drawPanel.querySelector('.ac-canvas');
    var ctx = canvas.getContext('2d');

    function fillCanvasWhite() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      canvasDirty = false;
    }
    fillCanvasWhite();

    function notify() {
      if (typeof options.onChange === 'function') {
        options.onChange(serializeAnswer(textarea.value, images), composer);
      }
    }

    function renderAttachments() {
      attachments.innerHTML = '';
      images.forEach(function (img, idx) {
        var wrap = document.createElement('div');
        wrap.className = 'ac-thumb';
        var im = document.createElement('img');
        im.src = img.data;
        im.alt = img.name || 'Attachment';
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.textContent = '×';
        rm.title = 'Remove';
        rm.onclick = function () {
          images.splice(idx, 1);
          renderAttachments();
          notify();
        };
        wrap.appendChild(im);
        wrap.appendChild(rm);
        attachments.appendChild(wrap);
      });
    }

    function addImage(dataUrl, meta) {
      if (images.length >= MAX_IMAGES) {
        alert('Maximum ' + MAX_IMAGES + ' images per answer.');
        return;
      }
      if (dataUrlBytes(dataUrl) > MAX_IMAGE_BYTES) {
        alert('Image is too large. Try a smaller photo or simpler drawing.');
        return;
      }
      images.push({
        type: (meta && meta.type) || 'upload',
        name: (meta && meta.name) || 'attachment.jpg',
        data: dataUrl,
      });
      renderAttachments();
      notify();
    }

    textarea.addEventListener('input', notify);

    drawBtn.onclick = function () {
      drawingOpen = !drawingOpen;
      drawPanel.classList.toggle('hidden', !drawingOpen);
      drawBtn.classList.toggle('active', drawingOpen);
      if (drawingOpen) fillCanvasWhite();
    };

    uploadBtn.onclick = function () { fileInput.click(); };

    fileInput.onchange = function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      if (!file.type.match(/^image\//)) {
        alert('Please choose an image file (PNG, JPEG, WebP).');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        resizeDataUrl(reader.result, 720, 0.82).then(function (url) {
          addImage(url, { type: 'upload', name: file.name });
        }).catch(function () { alert('Could not read image.'); });
      };
      reader.readAsDataURL(file);
    };

    drawPanel.querySelectorAll('.ac-color').forEach(function (btn) {
      btn.onclick = function () {
        penColor = btn.getAttribute('data-color');
        drawPanel.querySelectorAll('.ac-color').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      };
    });

    function canvasPos(e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0].clientX);
      var clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0].clientY);
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function startDraw(e) {
      e.preventDefault();
      drawing = true;
      var p = canvasPos(e);
      lastX = p.x;
      lastY = p.y;
    }

    function moveDraw(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = canvasPos(e);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penColor === 'eraser' ? 14 : 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (penColor === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      lastX = p.x;
      lastY = p.y;
      canvasDirty = true;
    }

    function endDraw() { drawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    drawPanel.querySelector('[data-tool="eraser"]').onclick = function () {
      penColor = 'eraser';
      drawPanel.querySelectorAll('.ac-color').forEach(function (b) { b.classList.remove('selected'); });
    };
    drawPanel.querySelector('[data-tool="clear"]').onclick = fillCanvasWhite;
    drawPanel.querySelector('[data-tool="save"]').onclick = function () {
      if (!canvasDirty) {
        alert('Draw something on the canvas first, or upload an image.');
        return;
      }
      var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resizeDataUrl(dataUrl, 720, 0.82).then(function (url) {
        addImage(url, { type: 'drawing', name: 'drawing.jpg' });
        fillCanvasWhite();
        drawingOpen = false;
        drawPanel.classList.add('hidden');
        drawBtn.classList.remove('active');
      });
    };

    renderAttachments();

    var composer = {
      getValue: function () { return serializeAnswer(textarea.value, images); },
      setValue: function (val) {
        var p = parseAnswer(val);
        textarea.value = p.text;
        images = p.images.slice();
        renderAttachments();
        notify();
      },
      hasContent: function () { return hasContent(parseAnswer(serializeAnswer(textarea.value, images))); },
      focus: function () { textarea.focus(); },
      destroy: function () { container.innerHTML = ''; },
    };

    return composer;
  }

  function formatDisplayText(raw) {
    var p = parseAnswer(raw);
    var out = p.text || '';
    if (p.images && p.images.length) {
      out += (out ? '\n\n' : '') + '[' + p.images.length + ' diagram/image attachment(s) included]';
    }
    return out;
  }

  function appendToPdf(doc, raw, x, y, maxWidth, lineHeight) {
    lineHeight = lineHeight || 13;
    var p = parseAnswer(raw);
    var lines = doc.splitTextToSize(String(p.text || '(no text)'), maxWidth);
    lines.forEach(function (line) {
      if (y > 780) { doc.addPage(); y = 48; }
      doc.text(line, x, y);
      y += lineHeight;
    });
    (p.images || []).forEach(function (img, idx) {
      if (y > 620) { doc.addPage(); y = 48; }
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Attachment ' + (idx + 1) + ':', x, y);
      y += 12;
      try {
        var fmt = (img.data || '').indexOf('image/png') >= 0 ? 'PNG' : 'JPEG';
        var imgW = 220;
        var imgH = 140;
        if (y + imgH > 780) { doc.addPage(); y = 48; }
        doc.addImage(img.data, fmt, x, y, imgW, imgH);
        y += imgH + 10;
      } catch (e) {
        doc.setFont('helvetica', 'normal');
        doc.text('[image attached — see digital answer pack]', x, y);
        y += lineHeight;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    });
    return y;
  }

  global.AnswerComposer = {
    mount: mount,
    parse: parseAnswer,
    serialize: serializeAnswer,
    hasContent: hasContent,
    formatDisplayText: formatDisplayText,
    appendToPdf: appendToPdf,
  };
})(typeof window !== 'undefined' ? window : globalThis);
