/**
 * Display-time cleanup for PDF-extracted CBSE math text (missing minus signs, etc.).
 */
(function (global) {
  function formatMathText(text) {
    if (!text) return '';
    let t = String(text);

    // Known linear-equations pair from board papers (minus stripped by PDF extract)
    t = t.replace(
      /2x\s+3y\s+\+\s*a\s*=\s*0\s+and\s+2x\s*\+\s*3y\s+b\s*=\s*0/gi,
      '2x − 3y + a = 0 and 2x + 3y − b = 0'
    );
    t = t.replace(
      /2x\s*-\s*3y\s*\+\s*a\s*=\s*0/gi,
      '2x − 3y + a = 0'
    );
    t = t.replace(/2x\s*\+\s*3y\s+b\s*=\s*0/gi, '2x + 3y − b = 0');

    // Generic: "2x 3y" at start of equation fragment -> subtraction
    t = t.replace(/(\d*)x\s+(\d*)y(\s*[+\−\-])/g, (m, a, b, tail) => {
      if (m.includes('−') || m.includes('-')) return m;
      return `${a || ''}x − ${b || ''}y${tail}`;
    });

    // Missing minus before isolated b in "3y b = 0"
    t = t.replace(/(\d*y)\s+([a-z])\s*=\s*0/gi, (m, ypart, varName) => {
      if (varName.length === 1 && !m.includes('−') && !m.includes('-')) {
        return `${ypart} − ${varName} = 0`;
      }
      return m;
    });

    return t.replace(/\s+/g, ' ').trim();
  }

  function formatOptions(options) {
    if (!Array.isArray(options)) return options;
    return options.map((o) => formatMathText(o));
  }

  global.AnyoQuestionFormat = { formatMathText, formatOptions };
})(typeof window !== 'undefined' ? window : globalThis);
