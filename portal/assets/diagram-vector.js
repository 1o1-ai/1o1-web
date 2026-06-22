/**
 * Render diagramVector JSON (SVG-like) for CBSE master catalog questions.
 */
(function (global) {
  'use strict';

  function el(name, attrs) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v != null && v !== '') node.setAttribute(k, String(v));
    });
    return node;
  }

  function renderElement(spec) {
    const shape = spec.shape || 'line';
    if (shape === 'polyline' || shape === 'polygon') {
      return el(shape, {
        points: spec.points,
        fill: spec.fill || 'none',
        stroke: spec.stroke || '#3b82f6',
        'stroke-width': spec.strokeWidth || 2,
      });
    }
    if (shape === 'circle') {
      return el('circle', {
        cx: spec.cx,
        cy: spec.cy,
        r: spec.r || 8,
        fill: spec.fill || 'none',
        stroke: spec.stroke || '#3b82f6',
        'stroke-width': spec.strokeWidth || 2,
      });
    }
    if (shape === 'rect') {
      return el('rect', {
        x: spec.x,
        y: spec.y,
        width: spec.width,
        height: spec.height,
        fill: spec.fill || 'none',
        stroke: spec.stroke || '#3b82f6',
        'stroke-width': spec.strokeWidth || 2,
      });
    }
    return el('line', {
      x1: spec.x1,
      y1: spec.y1,
      x2: spec.x2,
      y2: spec.y2,
      stroke: spec.stroke || '#3b82f6',
      'stroke-width': spec.strokeWidth || 2,
    });
  }

  function renderDiagramVector(diagramVector, target) {
    if (!diagramVector || !target) return null;
    const viewBox = diagramVector.viewBox || '0 0 400 300';
    const svg = el('svg', {
      viewBox,
      width: '100%',
      height: 'auto',
      role: 'img',
      'aria-label': diagramVector.type || 'Question diagram',
    });
    (diagramVector.elements || []).forEach((spec) => {
      svg.appendChild(renderElement(spec));
    });
    target.innerHTML = '';
    if (diagramVector.caption) {
      const cap = document.createElement('p');
      cap.className = 'diagram-caption';
      cap.style.cssText = 'font-size:0.72rem;color:#94a3b8;margin:0 0 6px';
      cap.textContent = diagramVector.caption;
      target.appendChild(cap);
    }
    target.appendChild(svg);
    return svg;
  }

  global.CBSE10DiagramVector = { renderDiagramVector };
})(typeof window !== 'undefined' ? window : globalThis);
