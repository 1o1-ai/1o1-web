var J = Object.defineProperty;
var K = (t, n, e) => n in t ? J(t, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[n] = e;
var u = (t, n, e) => K(t, typeof n != "symbol" ? n + "" : n, e);
const x = {};
async function X() {
  var e, s, o, r;
  if (x.data) return x.data;
  const n = await (await fetch("/portal/data/cbse10-curriculum.json")).json();
  return x.data = {
    subjects: {
      science: { chapters: ((s = (e = n.subjects) == null ? void 0 : e.science) == null ? void 0 : s.chapters) || [] },
      mathematics: { chapters: ((r = (o = n.subjects) == null ? void 0 : o.mathematics) == null ? void 0 : r.chapters) || [] }
    }
  }, x.data;
}
function Q(t, n) {
  var s;
  const e = ((s = n.subjects[t]) == null ? void 0 : s.chapters) || [];
  return e[Math.floor(Math.random() * e.length)];
}
function V(t) {
  const n = [];
  return t.forEach((e) => {
    e.keywords.forEach((s) => {
      const o = s.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
      o.length >= 4 && n.push(o);
    }), n.push(e.title.split(/\s+/)[0]);
  }), [...new Set(n.map((e) => e.toLowerCase()))];
}
function y(t) {
  const n = [...t];
  for (let e = n.length - 1; e > 0; e--) {
    const s = Math.floor(Math.random() * (e + 1));
    [n[e], n[s]] = [n[s], n[e]];
  }
  return n;
}
function H(t) {
  return y(t.split("")).join("");
}
function S(t, n) {
  var i;
  const e = ((i = n.subjects[t]) == null ? void 0 : i.chapters) || [], s = V(e), o = s[Math.floor(Math.random() * s.length)] || "science", r = e.find((a) => a.keywords.some((c) => c.includes(o))) || e[0];
  return { term: o, chapter: r };
}
function Y(t, n) {
  var r, i;
  const e = [
    { expr: "V = IR", hint: "Ohm law", chapter: "electricity" },
    { expr: "F = ma", hint: "Newton second law", chapter: "life" },
    { expr: "a² + b² = c²", hint: "Pythagoras", chapter: "triangles" },
    { expr: "sin²θ + cos²θ = 1", hint: "Trig identity", chapter: "trigonometry" },
    { expr: "2H₂ + O₂ → 2H₂O", hint: "Water formation", chapter: "chem-reactions" }
  ], s = new Set((((r = n.subjects.science) == null ? void 0 : r.chapters) || []).concat(((i = n.subjects.mathematics) == null ? void 0 : i.chapters) || []).map((a) => a.id)), o = e.filter((a) => s.has(a.chapter));
  return o[Math.floor(Math.random() * o.length)] || e[0];
}
function Z(t, n) {
  const e = Q(t, n);
  return { question: `What concept is central to ${e.title}?`, answer: e.keywords[0] || e.title, chapter: e };
}
const _ = "brahmando-cg-v1:";
function A(t) {
  try {
    return JSON.parse(localStorage.getItem(_ + t) || "{}");
  } catch {
    return {};
  }
}
function j(t, n) {
  localStorage.setItem(_ + t, JSON.stringify(n));
}
function tt(t, n) {
  t.innerHTML = "";
  const e = document.createElement("div");
  return e.className = "cg-wrap", e.innerHTML = `<header class="cg-head"><h2>${n}</h2><p class="cg-tagline">Curriculum-generated · adaptive</p></header><div class="cg-body"></div>`, t.appendChild(e), e.querySelector(".cg-body");
}
function q(t, n, e) {
  let s = t.querySelector(".cg-feedback");
  s || (s = document.createElement("p"), s.className = "cg-feedback", t.appendChild(s)), s.textContent = e, s.dataset.ok = n ? "1" : "0";
}
class et {
  constructor() {
    u(this, "ctx");
    u(this, "round", null);
    u(this, "paused", !1);
    u(this, "panel");
    u(this, "hintsUsed", 0);
  }
  async generate(n) {
    this.ctx = n, this.panel = tt(n.root, this.title), this.round = await this.buildRound(n), this.paint();
  }
  start() {
    this.paused = !1, this.paint();
  }
  pause() {
    this.paused = !0;
  }
  resume() {
    this.paused = !1, this.paint();
  }
  submitAnswer(n) {
    if (!this.round || this.paused) return !1;
    const e = n.trim().toLowerCase() === this.round.answer.trim().toLowerCase();
    return q(this.panel, e, e ? "Correct!" : `Answer: ${this.round.answer}`), e && this.bumpXp(10), e;
  }
  hint() {
    var n;
    return this.hintsUsed += 1, ((n = this.round) == null ? void 0 : n.hint) || "Think about the chapter keyword.";
  }
  save() {
    const n = A(this.storageKey());
    n.lastGame = this.id, n.xp = (n.xp || 0) + 0, j(this.storageKey(), n);
  }
  load() {
    A(this.storageKey());
  }
  storageKey() {
    return `cg:${this.ctx.subject}:${this.id}`;
  }
  bumpXp(n) {
    const e = A(this.storageKey());
    e.xp = (e.xp || 0) + n, j(this.storageKey(), e);
  }
  paint() {
    var e;
    if (!this.round) return;
    this.panel.innerHTML = `
      <div class="cg-game">
        <p class="cg-prompt">${this.round.prompt}</p>
        <div class="cg-actions" id="cgActions"></div>
        <p class="cg-meta">${((e = this.round.meta) == null ? void 0 : e.chapter) || ""}</p>
      </div>`;
    const n = this.panel.querySelector("#cgActions");
    this.renderActions(n);
  }
  renderActions(n) {
    var e, s, o, r;
    if (!((s = (e = this.round) == null ? void 0 : e.options) != null && s.length)) {
      n.innerHTML = `<input type="text" class="cg-input" id="cgInput" aria-label="Answer" />
        <button type="button" class="cg-btn" id="cgSubmit">Submit</button>
        <button type="button" class="cg-btn cg-btn-ghost" id="cgHint">Hint</button>`, (o = n.querySelector("#cgSubmit")) == null || o.addEventListener("click", () => {
        const i = n.querySelector("#cgInput").value;
        this.submitAnswer(i);
      }), (r = n.querySelector("#cgHint")) == null || r.addEventListener("click", () => {
        q(this.panel, !0, this.hint());
      });
      return;
    }
    n.innerHTML = this.round.options.map(
      (i, a) => `<button type="button" class="cg-btn cg-opt" data-ans="${nt(i)}">${String.fromCharCode(65 + a)}. ${i}</button>`
    ).join(""), n.querySelectorAll(".cg-opt").forEach((i) => {
      i.addEventListener("click", () => {
        this.submitAnswer(i.dataset.ans || "");
      });
    });
  }
}
function nt(t) {
  return t.replace(/"/g, "&quot;");
}
let k = null;
async function st() {
  if (!k)
    try {
      k = (await (await fetch("/portal/data/cbse10-study-material.json")).json()).chapters || {};
    } catch {
      k = {};
    }
}
function w(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function it(t, n, e, s) {
  var a;
  const o = ((a = e.subjects[n]) == null ? void 0 : a.chapters) || [], r = (s == null ? void 0 : s.chapterId) || (s == null ? void 0 : s.chapter);
  if (r) {
    const c = o.find((l) => l.id === r || l.title === r);
    if (c) return c;
  }
  const i = w(t);
  return o.find(
    (c) => w(c.title) === i || c.keywords.some((l) => w(l) === i || w(l).includes(i) || i.includes(w(l))) || w(c.title).includes(i)
  );
}
function rt(t, n) {
  if (!k) return null;
  const e = k[t];
  if (!e) return null;
  const s = n.toLowerCase(), r = [
    ...e.syllabusOutline || [],
    ...e.scholarTips || [],
    ...(e.videos || []).flatMap((a) => (a.transcripts || []).map((c) => c.text || "")),
    ...(e.boardQuestions || []).map((a) => a.prompt || "")
  ].find((a) => a.toLowerCase().includes(s));
  if (r) return r.length > 220 ? `${r.slice(0, 217)}…` : r;
  const i = (e.syllabusOutline || []).slice(0, 2).join("; ");
  return i ? `Chapter focus: ${i}.` : null;
}
function ot(t, n, e) {
  var i;
  const s = t.trim(), o = (n == null ? void 0 : n.title) || (e == null ? void 0 : e.chapter) || "this chapter";
  return ((i = [
    {
      re: /hydrocarbon/i,
      text: `A **hydrocarbon** is an organic compound containing **only carbon and hydrogen**. Examples: methane (CH₄), ethene (C₂H₄). In *${o}*, hydrocarbons form homologous series (alkanes, alkenes, alkynes).`
    },
    {
      re: /photosynthesis/i,
      text: `**Photosynthesis** — plants make glucose using CO₂, water, sunlight, and chlorophyll; oxygen is released. Core to *${o}*.`
    },
    {
      re: /^(acid|base|salt)$/i,
      text: `**${s}** — in *${o}*: acids give H⁺ in water, bases give OH⁻; salts form from neutralisation.`
    },
    {
      re: /uniform\s*speed/i,
      text: "**Uniform speed** — equal distance in equal time; on a distance–time graph, a straight line through the origin."
    },
    {
      re: /ohm\s*law/i,
      text: "**Ohm's law** — V = IR at constant temperature (potential difference ∝ current)."
    },
    {
      re: /^metal$/i,
      text: "**Metal** — typically lustrous, malleable, conducts heat/electricity (e.g. sodium, copper). Classify using reactivity and position in the periodic table."
    },
    {
      re: /polynomial/i,
      text: "**Polynomial type** — classify by degree (linear, quadratic, cubic) and number of terms."
    },
    {
      re: /mendel/i,
      text: "**Mendel's genetics** — mid-19th century; laws of inheritance from pea-plant experiments."
    }
  ].find((a) => a.re.test(s))) == null ? void 0 : i.text) || null;
}
function at(t) {
  return `**${t.title}** is a CBSE Class 10 ${t.discipline || "science"} chapter. Key syllabus terms: ${t.keywords.slice(0, 4).join(", ")}.`;
}
function F(t, n, e, s) {
  if (s != null && s.fullWord && t.trim().length <= 2)
    return `The missing letter is **${t.toUpperCase()}** in the word **${s.fullWord}**. ` + F(s.fullWord, n, e, s);
  const o = (s == null ? void 0 : s.term) || (s == null ? void 0 : s.concept) || t, r = it(o, n, e, s), i = t.trim();
  if (r && w(i) === w(r.title))
    return at(r);
  if (s != null && s.chainLetter) {
    const c = s.chainLetter.toUpperCase(), l = s.term ? `In this word chain, the prior term ended with **${c}**, so the next valid CBSE term must **start with ${c}**.` : `This chain step requires a term starting with **${c}**.`, m = `**${i}** satisfies that rule and matches Class 10 ${n} vocabulary`, g = r ? ` under *${r.title}* (${r.discipline || "science"}).` : ".", f = r && r.keywords.length > 1 ? ` Other options may share the letter but belong to different concepts — ${i} is the syllabus-correct link.` : "";
    return `${l} ${m}${g}${f}`;
  }
  if (s != null && s.discipline && (s != null && s.oddReason))
    return `**${i}** is the odd one out — it belongs to **${s.discipline}**, while the others share a different discipline in the CBSE syllabus.`;
  if (s != null && s.item && (s != null && s.category))
    return `**${s.item}** is best classified as **${s.category}** for CBSE Class 10 ${n}.`;
  const a = ot(i, r, s);
  if (a) return a;
  if (r && k) {
    const c = rt(r.id, o);
    if (c) return `**${i}** (*${r.title}*): ${c}`;
  }
  if (r) {
    const c = r.keywords.filter((l) => w(l) !== w(o)).slice(0, 3);
    return `**${i}** — syllabus term in *${r.title}* (${r.discipline || n}). Related: ${c.join(", ") || "see Study Room notes"}.`;
  }
  if (/[=→²³θ]/.test(i)) {
    const c = s != null && s.hint ? ` (${s.hint})` : "";
    return `**${i}** — identify each symbol and unit${c}. Used in CBSE numericals.`;
  }
  return s != null && s.term && i !== s.term ? `For the term **${s.term}**, the answer **${i}** links to that concept in *${s.chapter || "your syllabus"}*.` : `**${i}** — review in Class 10 ${n} notes and connect it to the chapter shown above.`;
}
function O(t, n, e) {
  var i;
  if (!t) return "Read the prompt again — one thread in the syllabus fits best.";
  const s = t.meta || {}, o = t.answer.trim(), r = ((i = o[0]) == null ? void 0 : i.toUpperCase()) || "?";
  return s.chainLetter ? n <= 1 ? "The chain is a relay: the **last letter** of the previous word must link to the next glossary term — not just any look-alike option." : n === 2 ? "Every option may share the same opening letter — only one truly continues the syllabus chain from the word before." : `Still stuck? The correct link is ${o.length} characters and fits ${s.discipline || "science"} — discard terms from other units.` : e === "crossword" || t.prompt.toLowerCase().includes("unscramble") ? n <= 1 ? "Shuffle the letters mentally — think chapter keywords, not English dictionary words." : n === 2 ? `The unscrambled term begins with **${r}** and has ${o.replace(/\s/g, "").length} letters.` : "Board papers love this spelling — check the unit outline for the exact NCERT term." : e === "odd-one-out" ? n <= 1 ? "Three share a family; one wandered in from a different syllabus neighbourhood." : "Compare **disciplines** (biology vs chemistry vs physics), not just spelling." : e === "formula-scramble" || /[=→]/.test(o) ? n <= 1 ? "Balance symbols and subscripts — CBSE expects the standard textbook form." : `The expression involves **${s.hint || "symbols from your formula list"}** — recall the canonical layout.` : n <= 1 ? "Eliminate options that contradict the prompt — the syllabus leaves only one precise fit." : n === 2 ? `The answer opens with **${r}** (${o.length} chars) — cross-check your chapter glossary.` : s.discipline ? `Think ${s.discipline} — not a guess from another unit.` : "Review the concept named in the question stem before picking again.";
}
const h = 10, ct = `
 ╭─ManjuLAB─╮
 │ ⚗ ★ LEARN│
 ╰──────────╯`.trim();
function d(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const lt = {
  theme: "🦅 Nest Guard · Word Snake",
  tagline: "Chain syllabus words — each correct link sends the hawk after the snake!",
  intro: () => ({
    caption: "Act I — A snake slithers toward the eggs… the hawk watches from the ridge.",
    art: L(0, 0, !0)
  }),
  ongoing(t, n) {
    return {
      caption: `Question ${t + 1} — ${n} chain${n === 1 ? "" : "s"} solved; snake creeps, hawk circles…`,
      art: L(n, t, !0)
    };
  },
  afterAnswer(t, n, e) {
    const s = t + 1;
    return {
      caption: e ? `Hawk swoops! Snake recoils (${n}/${h} drives)` : "Wrong link — snake slides closer while the hawk stalls…",
      art: L(n, s, e)
    };
  },
  finale(t) {
    return t >= 10 ? {
      caption: "🏆 PERFECT — Hawk banishes the snake!",
      art: `
   🪺 NEST SAFE          ★
  🥚🥚 eggs warm     🦅═══⚡
       \\              /
        \\   ~ ~ ~ ~ ~/
         🐍 ✕  (snake fled!)
    HAWK: "Not today, egg-thief!"
`.trim()
    } : t >= 8 ? {
      caption: "💛 EGGS SAVED — Hawk shields the nest!",
      art: `
      🪺 NEST
     🥚🥚
       |\\___
    🦅===|===🐍
   Hawk blocks snake — chicks safe!
`.trim()
    } : {
      caption: "😿 Snake reached the nest — study more chains!",
      art: `
    🐍~~~>  🥚🥚  🪺
         snake at the eggs…
      🦅 . . . too far away
   Review word chains & try again!
`.trim()
    };
  },
  summaryMessage(t) {
    return t >= 10 ? "Flawless chains — hawk hero of the ridge!" : t >= 8 ? "Hawk saved the nest — one more run for a perfect guard!" : "Snake wins this round — chain more CBSE terms.";
  }
};
function L(t, n, e) {
  const r = n * 3 + (e ? 0 : 4), i = t * 5;
  let a = Math.min(43, Math.max(10, 12 + r - i)), c = Math.max(1, 3 + t * 4);
  !e && n > 0 && (c = Math.max(1, c - 3)), c = Math.min(c, a - 2);
  const l = Array(54).fill("·");
  l[49] = "🪺", l[50] = "🥚", l[Math.round(a)] = "🐍", l[Math.round(c)] = "🦅";
  const m = l.join(""), g = "█".repeat(t) + "░".repeat(h - t), f = Math.max(0, 49 - Math.round(a)), C = Math.max(0, Math.round(a) - Math.round(c));
  return `
╔══════════════════════════════════════════════════════════════════════╗
║  NEST GUARD · Word Snake                                             ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  RIDGE  ${m}  NEST                                               ║
║         🦅 hawk ←${String(C).padStart(2)}→ 🐍 snake ←${String(f).padStart(2)}→ 🪺🥚          ║
║                                                                      ║
║  Chain progress  [${g}]  ${t}/${h}                         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`.trim();
}
const ut = {
  theme: "🛍️ Mall Quest · Crossword",
  tagline: "Unscramble terms — each correct answer unlocks a shop!",
  intro: () => ({
    caption: "Class X student enters the syllabus mall…",
    art: N(0)
  }),
  afterAnswer(t, n, e) {
    const o = ["👕", "💍", "📚", "👟", "🧪", "🎨", "🎵", "🥤", "🔢", "🎁"][Math.min(e ? n - 1 : t, 9)] || "🏬";
    return {
      caption: e ? `Bagged item ${o} · ${n} stops` : "Window shopping only… next aisle!",
      art: N(e ? n : Math.max(0, n))
    };
  },
  finale(t) {
    return {
      caption: t >= 8 ? "🎉 Shopping spree complete!" : "🛒 Partial haul — keep unscrambling!",
      art: `
  * VICTORY MALL EXIT *
 .---------------------.
 | BAGS: ${String(t).padStart(2)} / 10       |
 '---------------------'
        \\  (^o^)/
         | CBSE X |
        /|\\  ${t >= 10 ? "MAX LOOT!" : t >= 8 ? "saved chick… j/k saved cash!" : "retry sale!"}
`.trim()
    };
  },
  summaryMessage(t) {
    return t >= 10 ? "Perfect mall run — vocabulary fashion icon!" : t >= 8 ? "Solid haul — almost cleared the syllabus mall." : "More unscrambling before the next shopping trip.";
  }
};
function N(t) {
  return `
  MALL MAP  [${"🛍️".repeat(Math.min(t, 5)) || "·"}]
  Q→ shop row ${Math.min(t, 10)}/10
       \\  (o_o)  student
        |  ${t >= 3 ? "hoodie" : "window"} shopping
       /|\\
`.trim();
}
const ht = {
  theme: "🐭 Tom & Jerry · Concept Ladder",
  tagline: "Climb with correct concepts — Jerry rises, Tom slips!",
  intro: () => ({ caption: "Jerry starts the ladder… Tom lurks below.", art: G(0) }),
  afterAnswer(t, n, e) {
    return {
      caption: e ? "Jerry up a rung!" : "Tom swats — Jerry drops a step!",
      art: G(n)
    };
  },
  finale(t) {
    return {
      caption: t >= 8 ? "🧀 Jerry wins the cheese attic!" : "🐱 Tom guards the ladder…",
      art: `
    ${t >= 8 ? "🧀 CHEESE" : "     "}
      |Jerry|
      |  |  |  score ${t}/10
      |  |  |
   Tom${t >= 8 ? " (dizzy)" : " (grin)"}
`.trim()
    };
  },
  summaryMessage: (t) => t >= 8 ? "Concept king — Tom never had a chance." : "More ladder runs needed."
};
function G(t, n) {
  const e = Math.min(9, Math.max(1, t + 1));
  return `
      🧀
    ${"|".repeat(e)} Jerry↑
    ${"|".repeat(10 - e)} Tom↓
  rungs climbed: ${t}
`.trim();
}
const dt = {
  theme: "🏜️ Road Runner · Formula Scramble",
  tagline: "Fix the formula — leave Wile E. in the dust!",
  intro: () => ({ caption: "Beep beep! Unscramble before the trap snaps.", art: I(0) }),
  afterAnswer(t, n, e) {
    return {
      caption: e ? "Meep-meep! Another formula fixed!" : "ACME trap wobble — try next!",
      art: I(n)
    };
  },
  finale(t) {
    return {
      caption: t >= 8 ? "🌵 Road Runner escapes!" : "💥 ACME crate falls on Coyote.",
      art: `
   ${t >= 8 ? "BEEP!" : "bonk"}
  🐦💨    ${t >= 10 ? "🏆" : ""}
       🐺 Wile E.  score ${t}/10
`.trim()
    };
  },
  summaryMessage: (t) => t >= 8 ? "Physics formulas = turbo boots!" : "Coyote catches your typo — rerun."
};
function I(t) {
  return `
  🐦~${"~".repeat(Math.min(t, 8))}>  dust trail
  🧨 trap ${t >= 5 ? "MISFIRE" : "ARMED"}
`.trim();
}
const pt = {
  theme: "🐭 Mickey · Vocabulary Maze",
  tagline: "Collect terms — Minnie marks the safe path!",
  intro: () => ({ caption: "Hot dog! Navigate the term maze.", art: U(0) }),
  afterAnswer(t, n, e) {
    return { caption: e ? "Ha-ha! Correct term collected!" : "Wrong turn — Goofy laugh echo…", art: U(n) };
  },
  finale(t) {
    return {
      caption: t >= 8 ? "⭐ Mouseketools victory!" : "Almost out of the maze…",
      art: `🐭${"★".repeat(Math.min(t, 5))}  Minnie 🎀  score ${t}/10`
    };
  },
  summaryMessage: (t) => t >= 8 ? "Mousetastic vocabulary!" : "Mickey says: review chapter paths."
};
function U(t) {
  return `
  +-${"-".repeat(Math.min(t, 8))}+
  |🐭 → ${"·".repeat(8 - Math.min(t, 8))} ⭐|
  collect: ${t}/10
`.trim();
}
const mt = {
  theme: "🦆 Donald · Concept Dominoes",
  tagline: "Match pairs — keep Donald's temper cool!",
  intro: () => ({ caption: "Aw phooey! Match the domino chain.", art: "🦆 Donald  [??|??|??]" }),
  afterAnswer(t, n, e) {
    return {
      caption: e ? "Quack yeah! Tile matched!" : "Donald stubbed his toe…",
      art: `🦆 [${"|■".repeat(Math.min(n, 5))}${"|?".repeat(Math.max(0, 3 - Math.min(n, 3)))}] ${n}/10`
    };
  },
  finale(t) {
    return {
      caption: t >= 8 ? "🎩 Domino master — no tantrum!" : "Donald quacks in frustration…",
      art: `🦆 ${t >= 8 ? "(^◡^)" : "(>_<)"}  tiles ${t}/10`
    };
  },
  summaryMessage: (t) => t >= 8 ? "Concept dominoes toppled perfectly!" : "Match more pairs for Donald's smile."
}, gt = {
  theme: "🃏 Jerry · Definition Match",
  tagline: "Flip memory cards — dodge Tom's paw!",
  intro: () => ({ caption: "Memory lane in the kitchen…", art: "🃏 🃏 🃏  Tom lurking…" }),
  afterAnswer(t, n, e) {
    return {
      caption: e ? "Pair found — Jerry snickers!" : "Tom pounces — miss!",
      art: `🐭 pairs:${n}  Tom:${10 - n}  [${"✓".repeat(n)}${"?".repeat(Math.max(0, 3 - n % 4))}]`
    };
  },
  finale(t) {
    return { caption: t >= 8 ? "All pairs — Jerry naps on cheese!" : "Tom wins this round.", art: `🐭💤 score ${t}/10` };
  },
  summaryMessage: (t) => t >= 8 ? "Memory champion!" : "Flip more definitions."
}, ft = {
  theme: "🐕 Bluey · Scientific Anagrams",
  tagline: "Unscramble with the Heeler family!",
  intro: () => ({ caption: "Magic Xylophone time — unscramble!", art: "🐕 Bluey  🐕 Bingo  🎵" }),
  afterAnswer(t, n, e) {
    return {
      caption: e ? "Wackadoo! Letter fixed!" : "Oh biscuits…",
      art: `🐕${"★".repeat(Math.min(n, 6))}  words ${n}/10`
    };
  },
  finale(t) {
    return { caption: t >= 8 ? "Game of Grannies victory!" : "Keep playing outside…", art: `🏡 Heeler house · score ${t}/10` };
  },
  summaryMessage: (t) => t >= 8 ? "Anagram adventure complete!" : "More unscrambling at the park."
}, yt = {
  theme: "✏️ Donald · Missing Letter",
  tagline: "Fill the blank — comic bubble challenge!",
  intro: () => ({ caption: "Donald's chalkboard…", art: "🦆  W _ R D" }),
  afterAnswer(t, n, e) {
    return { caption: e ? "Letter nailed!" : "Aw phooey!", art: `🦆 ${"_".repeat(Math.max(0, 3 - Math.floor(n / 3)))}→${n}/10` };
  },
  finale(t) {
    return { caption: `Score ${t}/10`, art: `🦆 ${t >= 8 ? "SPELLING STAR" : "BACK TO SCHOOL"}` };
  },
  summaryMessage: (t) => t >= 8 ? "Letters mastered!" : "Practice more blanks."
}, bt = {
  theme: "⚖️ Tom · Odd One Out",
  tagline: "Spot the mismatch — Jerry swaps the cheese!",
  intro: () => ({ caption: "Three look alike… one is Jerry's trick.", art: "🧀 🧀 🧀 ?" }),
  afterAnswer(t, n, e) {
    return { caption: e ? "Tom spotted the fake!" : "Jerry swapped it!", art: `🐱 eye:${n}/10` };
  },
  finale(t) {
    return { caption: t >= 8 ? "Tom wins!" : "Jerry escapes…", art: `🐱 vs 🐭  ${t}/10` };
  },
  summaryMessage: (t) => t >= 8 ? "Sharp eye!" : "Odd ones hide in the syllabus."
}, wt = {
  theme: "📂 Goofy · Classification",
  tagline: "Sort into bins — gawrsh, labels matter!",
  intro: () => ({ caption: "Goofy's science shelves…", art: "📦 📦 📦  Goofy ?" }),
  afterAnswer(t, n, e) {
    return { caption: e ? "Sorted right!" : "Wrong bin — hyuck!", art: `📂 ${n}/10 sorted` };
  },
  finale(t) {
    return { caption: `Bins filled: ${t}/10`, art: `🐕 Goofy ${t >= 8 ? "(proud)" : "(confused)"}` };
  },
  summaryMessage: (t) => t >= 8 ? "Classification guru!" : "Review category trees."
}, $t = {
  theme: "⏳ Road Runner · Timeline",
  tagline: "Order events — history at desert speed!",
  intro: () => ({ caption: "Desert history highway…", art: "🏜️ ───●───●───?" }),
  afterAnswer(t, n, e) {
    return { caption: e ? "Timeline slot locked!" : "Wrong era!", art: `🏜️ markers: ${n}/10` };
  },
  finale(t) {
    return { caption: `Timeline score ${t}/10`, art: `🐦💨 ${t >= 8 ? "finish!" : "loop back"}` };
  },
  summaryMessage: (t) => t >= 8 ? "Historian hare!" : "Reorder and retry."
}, kt = {
  theme: "📊 Mickey · Graph Detective",
  tagline: "Read the chart — magnifying glass ready!",
  intro: () => ({ caption: "Case file: mysterious graph…", art: "🔍 Mickey  📈 ???" }),
  afterAnswer(t, n, e) {
    return { caption: e ? "Clue found!" : "Red herring!", art: `🔍 clues:${n}/10` };
  },
  finale(t) {
    return { caption: t >= 8 ? "Case closed!" : "Graph still fuzzy…", art: `🐭 detective ${t}/10` };
  },
  summaryMessage: (t) => t >= 8 ? "Graph guru!" : "Study motion graphs more."
}, D = {
  crossword: ut,
  "word-snake": lt,
  "formula-scramble": dt,
  "concept-ladder": ht,
  maze: pt,
  dominoes: mt,
  "definition-match": gt,
  anagram: ft,
  "missing-letter": yt,
  "odd-one-out": bt,
  classification: wt,
  timeline: $t,
  "graph-detective": kt
};
class p extends et {
  constructor(e) {
    super();
    u(this, "id");
    u(this, "title");
    u(this, "story");
    u(this, "buildSessionRounds");
    u(this, "inputMode");
    u(this, "rounds", []);
    u(this, "questionIndex", 0);
    u(this, "score", 0);
    u(this, "sessionDone", !1);
    u(this, "sceneArt", "");
    u(this, "sceneCaption", "");
    u(this, "awaitingNext", !1);
    u(this, "lastOk", !1);
    u(this, "lastExplanation", "");
    u(this, "lastUserAnswer", "");
    u(this, "hintPanelOpen", !1);
    this.id = e.id, this.title = e.title, this.story = D[e.storyId || e.id] || D.crossword, this.buildSessionRounds = e.buildRounds, this.inputMode = e.inputMode || "text";
  }
  async generate(e) {
    this.ctx = e, await st(), this.rounds = this.buildSessionRounds(e), this.questionIndex = 0, this.score = 0, this.sessionDone = !1, this.awaitingNext = !1, this.hintsUsed = 0, this.hintPanelOpen = !1;
    const s = this.story.intro();
    this.sceneArt = s.art, this.sceneCaption = s.caption, this.round = this.rounds[0] || null, this.panel = this.mountShell(e.root), this.paint();
  }
  buildRound(e) {
    return this.rounds[0] || { id: "x0", prompt: "…", answer: "" };
  }
  hint() {
    return this.hintsUsed += 1, this.hintPanelOpen = !0, O(this.round, this.hintsUsed, this.id);
  }
  submitAnswer(e) {
    if (!this.round || this.paused || this.sessionDone || this.awaitingNext) return !1;
    this.lastUserAnswer = e.trim();
    const s = this.lastUserAnswer.toLowerCase() === this.round.answer.trim().toLowerCase();
    s && (this.score += 1, this.bumpXp(10)), this.lastOk = s;
    const o = this.story.afterAnswer(this.questionIndex, this.score, s);
    return this.sceneArt = o.art, this.sceneCaption = o.caption, this.lastExplanation = F(
      this.round.answer,
      this.ctx.subject,
      this.ctx.curriculum,
      this.round.meta
    ), this.awaitingNext = !0, this.paintReveal(), s;
  }
  goNext() {
    if (this.awaitingNext = !1, this.questionIndex += 1, this.hintsUsed = 0, this.hintPanelOpen = !1, this.lastUserAnswer = "", this.questionIndex >= h) {
      this.finishSession();
      return;
    }
    if (this.round = this.rounds[this.questionIndex], this.story.ongoing) {
      const e = this.story.ongoing(this.questionIndex, this.score);
      this.sceneArt = e.art, this.sceneCaption = e.caption;
    }
    this.paint();
  }
  finishSession() {
    this.sessionDone = !0;
    const e = this.story.finale(this.score);
    this.sceneArt = e.art, this.sceneCaption = e.caption;
    const s = A(this.storageKey());
    s.stars = Math.max(s.stars || 0, this.score), s.xp = (s.xp || 0) + this.score * 10, j(this.storageKey(), s), this.paintSummary();
  }
  mountShell(e) {
    e.innerHTML = "";
    const s = document.createElement("div");
    return s.className = "cg-wrap", s.innerHTML = `

      <pre class="cg-brand" aria-label="ManjuLAB">${d(ct)}</pre>

      <header class="cg-head">

        <h2>${d(this.story.theme)}</h2>

        <p class="cg-tagline">${d(this.story.tagline)}</p>

      </header>

      <div class="cg-body"></div>`, e.appendChild(s), s.querySelector(".cg-body");
  }
  paint() {
    !this.round || this.sessionDone || this.awaitingNext || (this.panel.innerHTML = `

      <div class="cg-session-bar">

        <span>Q <strong>${this.questionIndex + 1}</strong> / ${h}</span>

        <span>Score <strong>${this.score}</strong></span>

      </div>

      <p class="cg-story-caption">${d(this.sceneCaption)}</p>

      <pre class="cg-ascii" aria-label="Story scene">${d(this.sceneArt)}</pre>

      <div class="cg-game">

        <p class="cg-prompt">${this.round.prompt}</p>

        <div class="cg-actions" id="cgActions"></div>

        <div class="cg-hint-panel" id="cgHintPanel" hidden aria-live="polite"></div>

      </div>`, this.renderActions(this.panel.querySelector("#cgActions")), this.hintPanelOpen && this.refreshHintPanel());
  }
  refreshHintPanel() {
    const e = this.panel.querySelector("#cgHintPanel");
    e && (e.hidden = !1, e.className = "cg-hint-panel cg-hint-panel--open", e.innerHTML = `

      <p class="cg-hint-label">Clue ${this.hintsUsed}</p>

      <div class="cg-hint-text">${B(O(this.round, this.hintsUsed, this.id))}</div>`);
  }
  bindHintButton(e) {
    var s;
    (s = e.querySelector("#cgHint")) == null || s.addEventListener("click", () => {
      this.hint(), this.refreshHintPanel();
      const o = e.querySelector("#cgHint");
      o && (o.textContent = this.hintsUsed >= 3 ? "No more clues" : "Another clue"), o && this.hintsUsed >= 3 && (o.disabled = !0);
    });
  }
  paintReveal() {
    var o;
    if (!this.round) return;
    const e = this.lastOk ? `Correct — ${this.score}/${h} so far` : "Not quite — read the explanation below", s = !this.lastOk && this.lastUserAnswer ? `<p class="cg-reveal-yours"><span>You chose:</span> ${d(this.lastUserAnswer)}</p>` : "";
    this.panel.innerHTML = `

      <div class="cg-session-bar">

        <span>Q <strong>${this.questionIndex + 1}</strong> / ${h}</span>

        <span>Score <strong>${this.score}</strong></span>

      </div>

      <p class="cg-story-caption">${d(this.sceneCaption)}</p>

      <pre class="cg-ascii" aria-label="Story scene">${d(this.sceneArt)}</pre>

      <div class="cg-reveal" data-ok="${this.lastOk ? "1" : "0"}">

        <p class="cg-reveal-verdict">${d(e)}</p>

        ${s}

        <p class="cg-reveal-answer"><span>Correct answer:</span> <strong>${d(this.round.answer)}</strong></p>

        <h3 class="cg-reveal-why">Why this is the answer</h3>

        <div class="cg-reveal-learn">${B(this.lastExplanation)}</div>

        <button type="button" class="cg-btn cg-btn-next" id="cgNext">${this.questionIndex + 1 >= h ? "See results" : "Next question →"}</button>

      </div>`, (o = this.panel.querySelector("#cgNext")) == null || o.addEventListener("click", () => this.goNext());
  }
  paintSummary() {
    var e;
    this.panel.innerHTML = `

      <div class="cg-session-bar cg-session-bar--done">

        <span>Session complete</span>

        <span>Score <strong>${this.score}</strong> / ${h}</span>

      </div>

      <p class="cg-story-caption">${d(this.sceneCaption)}</p>

      <pre class="cg-ascii" aria-label="Story finale">${d(this.sceneArt)}</pre>

      <p class="cg-summary">${d(this.story.summaryMessage(this.score))}</p>

      <button type="button" class="cg-btn" id="cgReplay">Play again</button>`, (e = this.panel.querySelector("#cgReplay")) == null || e.addEventListener("click", () => {
      this.generate(this.ctx), this.start();
    });
  }
  renderActions(e) {
    var o, r, i;
    if (this.inputMode === "options" && ((r = (o = this.round) == null ? void 0 : o.options) != null && r.length)) {
      e.innerHTML = this.round.options.map(
        (a, c) => `<button type="button" class="cg-btn cg-opt" data-ans="${Mt(a)}">${String.fromCharCode(65 + c)}. ${d(a)}</button>`
      ).join("") + '<button type="button" class="cg-btn cg-btn-ghost cg-hint-btn" id="cgHint">Show clue</button>', e.querySelectorAll(".cg-opt").forEach((a) => {
        a.addEventListener("click", () => this.submitAnswer(a.dataset.ans || ""));
      }), this.bindHintButton(e);
      return;
    }
    e.innerHTML = `<input type="text" class="cg-input" id="cgInput" aria-label="Answer" autocomplete="off" />

      <button type="button" class="cg-btn" id="cgSubmit">Submit</button>

      <button type="button" class="cg-btn cg-btn-ghost cg-hint-btn" id="cgHint">Show clue</button>`;
    const s = e.querySelector("#cgInput");
    (i = e.querySelector("#cgSubmit")) == null || i.addEventListener("click", () => this.submitAnswer(s.value)), s.addEventListener("keydown", (a) => {
      a.key === "Enter" && !this.awaitingNext && this.submitAnswer(s.value);
    }), this.bindHintButton(e), s.focus();
  }
}
function B(t) {
  return t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").split(`
`).map((n) => `<p>${n}</p>`).join("");
}
function Mt(t) {
  return t.replace(/"/g, "&quot;");
}
function T(t, n) {
  if (!t.length)
    return [{ id: "x0", prompt: "No curriculum data.", answer: "study", hint: "Reload" }];
  for (; t.length < n; ) {
    const e = t[t.length % t.length];
    t.push({ ...e, id: `x${t.length + 1}` });
  }
  return t.slice(0, n);
}
function b(t, n) {
  return {
    chapter: (t == null ? void 0 : t.title) || "",
    chapterId: (t == null ? void 0 : t.id) || "",
    discipline: (t == null ? void 0 : t.discipline) || "",
    ...n
  };
}
function St(t, n = h) {
  var r;
  const e = /* @__PURE__ */ new Set(), s = [];
  let o = 0;
  for (; s.length < n && o < n * 30; ) {
    o += 1;
    const { term: i, chapter: a } = S(t.subject, t.curriculum), c = i.toUpperCase().replace(/\s/g, "");
    !c || e.has(c) || (e.add(c), s.push({
      id: `xw${s.length + 1}`,
      prompt: `Clue: ${(a == null ? void 0 : a.keywords[0]) || "Chapter vocabulary"}. Unscramble: <strong>${H(c)}</strong>`,
      answer: c,
      hint: `Starts with ${(r = i[0]) == null ? void 0 : r.toUpperCase()}`,
      meta: b(a, { term: i })
    }));
  }
  return T(s, n);
}
function R(t) {
  return t.trim().split(/\s+/)[0].toLowerCase();
}
function P(t) {
  return t.trim().split(/\s+/)[0];
}
const Ct = {
  a: ["acid", "atom", "anion", "amplitude", "alkali"],
  b: ["base", "bond", "biomass", "bacteria", "bleach"],
  c: ["carbon", "catalyst", "covalent", "chlorophyll", "conductor"],
  d: ["diffusion", "density", "decomposition", "dilution", "displacement"],
  e: ["electron", "element", "energy", "enzyme", "equation"],
  f: ["force", "fusion", "filament", "fertilization", "frequency"],
  g: ["gene", "gravity", "glycerol", "generator", "ground"],
  h: ["hydrogen", "homologous", "hydrocarbon", "hormone", "heat"],
  i: ["ion", "isomer", "indicator", "insulator", "inertia"],
  l: ["light", "lens", "litmus", "lactic", "longitude"],
  m: ["metal", "molecule", "mitosis", "micelle", "magnet"],
  n: ["nucleus", "neuron", "nitrogen", "non-metal", "neutral"],
  o: ["osmosis", "oxidation", "oxygen", "ohm", "organism"],
  p: ["photosynthesis", "proton", "polymer", "potential", "pollination"],
  r: ["respiration", "resistance", "refraction", "reaction", "reflection"],
  s: ["sodium", "solute", "solvent", "series", "saponification"],
  t: ["tissue", "titration", "transpiration", "tetravalency", "trajectory"],
  v: ["valency", "voltage", "vapour", "velocity", "vitamin"],
  w: ["work", "wavelength", "water", "wire", "weight"]
};
function vt(t) {
  const n = Object.values(Ct).flat(), e = [...t, ...n], s = /* @__PURE__ */ new Set(), o = [];
  for (const r of e) {
    const i = R(r);
    i.length < 3 || s.has(i) || (s.add(i), o.push(i));
  }
  return o;
}
function W(t, n, e) {
  const s = e == null ? void 0 : e.toLowerCase();
  return t.filter((o) => o.startsWith(n) && o !== s);
}
function xt(t, n = h) {
  var l;
  const e = ((l = t.curriculum.subjects[t.subject]) == null ? void 0 : l.chapters) || [], s = [...new Set(e.flatMap((m) => m.keywords).filter((m) => m.length > 3))], o = s.length ? s : ["energy", "electron", "element", "equation"], r = vt(o), i = [];
  let a = P(o[0] || "energy"), c = 0;
  for (; i.length < n && c < n * 80; ) {
    c += 1;
    const m = R(a).slice(-1).toLowerCase(), g = W(r, m, R(a));
    if (g.length < 4) {
      const $ = r.filter(
        (M) => W(r, M.slice(-1), M).length >= 4
      );
      a = P($[i.length % Math.max($.length, 1)] || o[i.length % o.length]);
      continue;
    }
    const f = g[i.length % g.length], C = y(g.filter(($) => $ !== f)).slice(0, 3);
    if (C.length < 3) continue;
    const z = y([f, ...C]).slice(0, 4), v = e.find(($) => $.keywords.some((M) => R(M) === f || M.toLowerCase().includes(f))) || e[0];
    i.push({
      id: `snake${i.length + 1}`,
      prompt: `Word chain: which CBSE term correctly follows "<strong>${a}</strong>"?`,
      answer: f,
      options: z,
      hint: "",
      meta: b(v, { term: f, chainLetter: m, discipline: (v == null ? void 0 : v.discipline) || "" })
    }), a = f;
  }
  return T(i, n);
}
function At(t, n = h) {
  var o;
  const e = ((o = t.curriculum.subjects[t.subject]) == null ? void 0 : o.chapters) || [], s = [];
  for (let r = 0; r < n; r++) {
    const i = Y(t.subject, t.curriculum), a = e.find((c) => c.id === i.chapter);
    s.push({
      id: `fs${r + 1}`,
      prompt: `Unscramble: <code>${H(i.expr.replace(/\s/g, ""))}</code> (${i.hint})`,
      answer: i.expr.replace(/\s/g, ""),
      hint: i.hint,
      meta: b(a, { hint: i.hint })
    });
  }
  return s;
}
function Rt(t, n = h) {
  var s;
  const e = [];
  for (let o = 0; o < n; o++) {
    const r = Z(t.subject, t.curriculum);
    e.push({
      id: `lad${o + 1}`,
      prompt: r.question,
      answer: r.answer.split(" ")[0],
      options: y([r.answer.split(" ")[0], "definition", "unrelated", "none"]).slice(0, 4),
      hint: (s = r.chapter) == null ? void 0 : s.title,
      meta: b(r.chapter, { term: r.answer, concept: r.answer })
    });
  }
  return e;
}
function Et(t, n = h) {
  const e = [];
  for (let s = 0; s < n; s++) {
    const { term: o, chapter: r } = S(t.subject, t.curriculum), i = o.split(" ")[0];
    e.push({
      id: `maze${s + 1}`,
      prompt: "Collect the correct syllabus term:",
      answer: i,
      options: y([i, "misconception", "random", "off-syllabus"]).slice(0, 4),
      hint: (r == null ? void 0 : r.title) || "",
      meta: b(r, { term: i })
    });
  }
  return e;
}
function Tt(t, n = h) {
  var o;
  const e = ((o = t.curriculum.subjects[t.subject]) == null ? void 0 : o.chapters) || [], s = [];
  for (let r = 0; r < n; r++) {
    const i = e[r % Math.max(e.length, 1)], a = (i == null ? void 0 : i.keywords[0]) || "acid";
    s.push({
      id: `dom${r + 1}`,
      prompt: `Match concept "<strong>${a}</strong>" to its chapter/application:`,
      answer: (i == null ? void 0 : i.title) || a,
      options: y([(i == null ? void 0 : i.title) || a, "Unrelated", "Random unit", "None"]).slice(0, 4),
      meta: b(i, { concept: a })
    });
  }
  return T(s, n);
}
function Lt(t, n = h) {
  const e = [];
  for (let s = 0; s < n; s++) {
    const { term: o, chapter: r } = S(t.subject, t.curriculum), i = (r == null ? void 0 : r.keywords[0]) || o;
    e.push({
      id: `def${s + 1}`,
      prompt: `Which definition matches "<strong>${o}</strong>"?`,
      answer: i.split(" ")[0],
      options: y([i.split(" ")[0], "Opposite", "Unrelated", "None"]).slice(0, 4),
      meta: b(r, { term: o })
    });
  }
  return e;
}
function jt(t, n = h) {
  const e = [];
  for (let s = 0; s < n; s++) {
    const { term: o, chapter: r } = S(t.subject, t.curriculum), i = o.replace(/\s/g, "");
    e.push({
      id: `ana${s + 1}`,
      prompt: `Unscramble: <strong>${H(i).toUpperCase()}</strong>`,
      answer: i,
      hint: r == null ? void 0 : r.title,
      meta: b(r, { term: i })
    });
  }
  return e;
}
function Ht(t, n = h) {
  const e = [];
  for (let s = 0; s < n; s++) {
    const { term: o, chapter: r } = S(t.subject, t.curriculum), i = o.replace(/\s/g, "").toUpperCase(), a = Math.floor(i.length / 2);
    e.push({
      id: `ml${s + 1}`,
      prompt: `Complete: ${i.slice(0, a)}_<strong>?</strong>${i.slice(a + 1)}`,
      answer: i[a],
      hint: `Word: ${i.length} letters`,
      meta: b(r, { fullWord: i, term: i })
    });
  }
  return e;
}
function qt(t, n = h) {
  var i;
  const e = ((i = t.curriculum.subjects[t.subject]) == null ? void 0 : i.chapters) || [], s = e.filter((a) => a.discipline === "chemistry"), o = e.filter((a) => a.discipline === "biology"), r = [];
  for (let a = 0; a < n; a++) {
    const c = s.length >= 2 && o.length ? [...s.slice(0, 2).map((g) => g.title), o[0].title] : e.slice(0, 3).map((g) => g.title), l = o[0] || e[e.length - 1], m = (l == null ? void 0 : l.title) || c[c.length - 1];
    r.push({
      id: `ooo${a + 1}`,
      prompt: "Odd one out (discipline mismatch):",
      answer: m,
      options: y([...c].slice(0, 4)),
      meta: b(l, { oddReason: "discipline", discipline: (l == null ? void 0 : l.discipline) || "" })
    });
  }
  return T(r, n);
}
function Ot(t, n = h) {
  const e = [];
  for (let s = 0; s < n; s++) {
    const o = t.subject === "science" ? "Sodium" : "Quadratic", r = t.subject === "science" ? "Metal" : "Polynomial type";
    e.push({
      id: `cls${s + 1}`,
      prompt: `Classify "<strong>${o}</strong>":`,
      answer: r,
      options: y([r, "Non-metal", "Acid", "Salt"]).slice(0, 4),
      meta: { item: o, category: r }
    });
  }
  return e;
}
function Nt(t, n = h) {
  const e = [];
  for (let s = 0; s < n; s++)
    e.push({
      id: `tl${s + 1}`,
      prompt: "Which came first historically: Mendel genetics, Ohm law, or NCERT 2026 syllabus?",
      answer: "Ohm law",
      options: y(["Ohm law", "Mendel genetics", "NCERT 2026 syllabus", "Same year"]),
      meta: { hint: "Georg Ohm, 1827" }
    });
  return e;
}
function Gt(t, n = h) {
  var r;
  const s = (((r = t.curriculum.subjects[t.subject]) == null ? void 0 : r.chapters) || []).find((i) => i.id.includes("motion") || i.title.toLowerCase().includes("motion")), o = [];
  for (let i = 0; i < n; i++)
    o.push({
      id: `gd${i + 1}`,
      prompt: "Distance-time graph: straight line through origin means?",
      answer: "uniform speed",
      options: y(["uniform speed", "at rest", "acceleration", "random"]),
      hint: "Motion graphs",
      meta: b(s, { term: "uniform speed" })
    });
  return o;
}
class It extends p {
  constructor() {
    super({ id: "crossword", title: "Crossword", buildRounds: St, inputMode: "text" });
  }
}
class Ut extends p {
  constructor() {
    super({ id: "word-snake", title: "Word Snake", buildRounds: xt, inputMode: "options" });
  }
}
class Dt extends p {
  constructor() {
    super({ id: "formula-scramble", title: "Formula Scramble", buildRounds: At, inputMode: "text" });
  }
}
class Bt extends p {
  constructor() {
    super({ id: "concept-ladder", title: "Concept Ladder", buildRounds: Rt, inputMode: "options" });
  }
}
class Pt extends p {
  constructor() {
    super({ id: "maze", title: "Vocabulary Maze", buildRounds: Et, inputMode: "options" });
  }
}
class Wt extends p {
  constructor() {
    super({ id: "dominoes", title: "Concept Dominoes", buildRounds: Tt, inputMode: "options" });
  }
}
class _t extends p {
  constructor() {
    super({ id: "definition-match", title: "Definition Match", buildRounds: Lt, inputMode: "options" });
  }
}
class Ft extends p {
  constructor() {
    super({ id: "anagram", title: "Scientific Anagrams", buildRounds: jt, inputMode: "text" });
  }
}
class zt extends p {
  constructor() {
    super({ id: "missing-letter", title: "Missing Letter", buildRounds: Ht, inputMode: "text" });
  }
}
class Jt extends p {
  constructor() {
    super({ id: "odd-one-out", title: "Odd One Out", buildRounds: qt, inputMode: "options" });
  }
}
class Kt extends p {
  constructor() {
    super({ id: "classification", title: "Classification", buildRounds: Ot, inputMode: "options" });
  }
}
class Xt extends p {
  constructor() {
    super({ id: "timeline", title: "Timeline Builder", buildRounds: Nt, inputMode: "options" });
  }
}
class Qt extends p {
  constructor() {
    super({ id: "graph-detective", title: "Graph Detective", buildRounds: Gt, inputMode: "options" });
  }
}
const E = {
  crossword: () => new It(),
  "word-snake": () => new Ut(),
  "formula-scramble": () => new Dt(),
  "concept-ladder": () => new Bt(),
  maze: () => new Pt(),
  dominoes: () => new Wt(),
  "definition-match": () => new _t(),
  anagram: () => new Ft(),
  "missing-letter": () => new zt(),
  "odd-one-out": () => new Jt(),
  classification: () => new Kt(),
  timeline: () => new Xt(),
  "graph-detective": () => new Qt()
};
function Vt(t) {
  var e;
  const n = (e = E[t]) == null ? void 0 : e.call(E);
  return (n == null ? void 0 : n.title) || t;
}
async function Yt() {
  const t = new URLSearchParams(location.search), n = t.get("game") || "crossword", e = t.get("subject") === "mathematics" ? "mathematics" : "science", s = document.getElementById("gameRoot"), o = document.getElementById("gameTitle"), r = document.getElementById("playSubject");
  if (r && (r.value = e, r.addEventListener("change", () => {
    sessionStorage.setItem("cbse10_game_subject", r.value), location.search = `?game=${encodeURIComponent(n)}&subject=${encodeURIComponent(r.value)}`;
  })), o && (o.textContent = Vt(n)), !s) return;
  const i = E[n];
  if (!i) {
    s.innerHTML = '<p class="cg-error">Unknown game. Return to Game Room.</p>';
    return;
  }
  const a = await X(), c = i();
  await c.generate({ subject: e, root: s, curriculum: a }), c.start(), c.load();
}
Yt().catch((t) => {
  const n = document.getElementById("gameRoot");
  n && (n.textContent = String(t));
});
export {
  E as GAME_REGISTRY,
  Vt as gameTitle
};
