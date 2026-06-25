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
    return options.map((o) => cleanQuestionText(formatMathText(o)));
  }

  /** Strip PDF ingest noise (reversed headers, set codes, empty options). */
  function cleanQuestionText(text) {
    if (!text) return '';
    let t = formatMathText(String(text));
    t = t.replace(/\*[\d/]+(?:-\d+)?\*[\s\d#]*\*[A-Z]+\*[\s\S]*$/i, '').trim();
    t = t.replace(/\*ECNEICS\*/gi, '').replace(/#\s*\*/g, '').trim();
    t = t.replace(/\s+\?\s*$/,'').trim();
    t = t.replace(/\s*\[Set-\d+\s+Ref\s+Key\]\s*/gi, ' ').trim();
    t = t.replace(/\s*\[(?:Set-\d+\s*)?(?:Ref\s*)?Key\]\s*/gi, ' ').trim();
    t = t.replace(/\s*\[Approved[^\]]*\]\s*/gi, ' ').trim();
    t = t.replace(/\s*\[(?:VOLTAIC|CBSE|internal)[^\]]*\]\s*/gi, ' ').trim();
    return t.replace(/\s{2,}/g, ' ').trim();
  }

  /** Strip AI source tags, mark breakdowns, and step labels from catalog solutions. */
  function cleanSolutionText(text) {
    if (!text) return '';
    let t = String(text);
    t = t.replace(/\[[^\]]{2,120}\]/g, ' ');
    t = t.replace(/\(\s*\d+(?:\.\d+)?\s*Marks?\s*\)/gi, '');
    t = t.replace(/\b\d+(?:\.\d+)?\s*Marks?\b/gi, '');
    t = t.replace(/Step\s*\d+\s*:\s*/gi, '\n• ');
    t = t.replace(/Result validated cleanly\.?/gi, '');
    t = t.replace(/We first write down given quantities\.?\s*/gi, '');
    t = t.replace(/Next, we invoke standard formulas\.?\s*/gi, '');
    t = t.replace(/Substituting variables allows calculation step-by-step\.?\s*/gi, '');
    t = t.replace(/The final derived value matches class standards perfectly\.?/gi, '');
    t = t.replace(/To solve:\s*"[^"]*"\.\s*/gi, '');
    t = t.replace(/Formula definition\s*&\s*statement verification/gi, '');
    t = t.replace(/Correct substitution in algebraic equation/gi, '');
    t = t.replace(/Calculating final numerical response/gi, '');
    t = t
      .split('\n')
      .map((line) => line.replace(/\s{2,}/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
    return t.replace(/\n{3,}/g, '\n\n').trim();
  }

  global.AnyoQuestionFormat = {
    formatMathText,
    formatOptions,
    cleanQuestionText,
    cleanSolutionText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
