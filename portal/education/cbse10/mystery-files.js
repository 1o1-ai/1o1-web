/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Mystery Files — a narrative detective game for CBSE Class 10.
  Each level is a self-contained CASE with an authored story. Correct answers to
  chapter questions pin CLUE CARDS to the evidence board; wrong answers and
  timeouts burn LEADS. Once every clue slot is filled the detective faces the
  DEDUCTION — four suspects, one culprit — and a wrong accusation costs another
  lead. Run out of leads and the case goes cold; solve it and it is stamped
  CLOSED for good.

  Level design:
    Cases 1-2  4 clues · 3 leads · no timer  · difficulty mix 70/30/0
    Cases 3-4  5 clues · 3 leads · 45 s/question · mix 45/45/10
    Cases 5-6  5 clues · 2 leads · 30 s/question · mix 30/50/20 + one red herring
  Ranks run Trainee → Constable → Sub-Inspector → Inspector → ACP → Commissioner
  → Legendary Detective, one step per case closed. Progress persists in
  localStorage under 'mf10_progress'.
*/
(function () {
  'use strict';

  var Bank = window.CBSE10QuizBank;
  if (!Bank) return;

  var STORAGE_KEY = 'mf10_progress';

  var RANKS = [
    'Trainee', 'Constable', 'Sub-Inspector', 'Inspector',
    'ACP', 'Commissioner', 'Legendary Detective',
  ];

  /* Suspect avatar hues — distinct enough that four line-up cards never blur. */
  var HUES = [204, 344, 42, 138];

  /* ────────────────────────────────────────────────────────────────────
     THE CASE FILES
     Clue texts are written against the CHAPTER'S CONCEPT AREA, not against any
     single bank question, so slot N reads correctly whichever question fills it.
     `redHerring` marks a clue slot that misleads on purpose; it is only ever
     revealed as false in the resolution.
     ──────────────────────────────────────────────────────────────────── */
  var CASES = [
    {
      title: 'The Vanishing Current',
      emoji: '⚡',
      chapterLabel: 'Science · Electricity',
      subject: 'science',
      chapters: ['electricity'],
      clueCount: 4,
      leads: 3,
      timer: 0,
      mix: [0.7, 0.3, 0],
      redHerring: -1,
      intro:
        'Malabar Heights, Tower C. For three nights running the society\'s main energy ' +
        'meter has spun like a festival top at the stroke of midnight — yet every flat ' +
        'sits dark and every family asleep. Secretary Mr. Pillai swears nobody is awake; ' +
        'the watchman swears nobody has entered. Still, the June bill has tripled and the ' +
        'residents\' welfare fund is bleeding dry. You are called in while the meter is ' +
        'still ticking. Somewhere between the transformer and the fourth-floor landing, ' +
        'current is vanishing into a pocket that appears on no building plan. Trace the ' +
        'load, Detective. Electricity always leaves a trail of heat and numbers — you ' +
        'only have to learn to read it.',
      clues: [
        'The service cable feeding Tower C runs warm at midnight though the meter room is stone cold. Current passing through a conductor dissipates heat — so a heavy load is flowing somewhere it was never meant to.',
        'You clamp a meter on the riser: the phantom draw sits steady at 220 V. Multiply current by voltage and the missing units on the society bill line up almost exactly. This is theft, not an accounting slip.',
        'Behind the fourth-floor landing hides a spliced tap that bypasses the meter entirely, protected by a fuse rated far above the line — deliberately over-sized so a big appliance load could never trip it.',
        'The tap feeds a bank of machines wired in parallel, each pulling the full supply voltage at once. Only a resident with landing access and a locked storeroom could hide a rig that hungry.',
      ],
      deduction:
        'Q: A cable warm at midnight, a metered 220 V phantom load, an over-rated fuse behind the fourth-floor landing, and a parallel bank of machines behind a locked door. Name the thief and the method.',
      suspects: [
        { name: 'Ravi Menon', motive: 'Flat 4B. Runs an unlicensed crypto rig and cannot afford its power bill.', theory: 'Cut a tap into the riser upstream of the meter and ran a parallel bank of machines behind an over-rated fuse.' },
        { name: 'Bhola', motive: 'Night watchman. Sleeps beside the meter room and holds every spare key.', theory: 'Leaves the meter-room lights and heater burning through the night.' },
        { name: 'Mr. Pillai', motive: 'Society secretary. Controls the welfare fund and its ledgers.', theory: 'No current was lost at all — he inflated the bill inside the society accounts.' },
        { name: 'Latha', motive: 'The old electrician\'s widow. Knows Tower C\'s wiring better than the plans do.', theory: 'A short circuit in the decades-old wiring is wasting the power as heat.' },
      ],
      culprit: 0,
      resolution:
        'Ravi Menon of flat 4B was mining through the night on stolen supply. He spliced a tap into the riser above the meter, fitted a deliberately over-rated fuse so the heavy load would never blow it, and wired his machines in parallel so each drew the full 220 V. Power is voltage times current — the heat in the cable and the missing units on the bill were the same number, read twice.',
    },

    {
      title: 'The Corroded Crown',
      emoji: '👑',
      chapterLabel: 'Science · Metals + Chemical Reactions',
      subject: 'science',
      chapters: ['metals', 'chem-reactions'],
      clueCount: 4,
      leads: 3,
      timer: 0,
      mix: [0.7, 0.3, 0],
      redHerring: -1,
      intro:
        'The Baroda Heritage Museum opens its "Silver Road" exhibition at dawn. At five ' +
        'in the morning curator Dr. Sen unlocks the vault and stops breathing: the ' +
        'centrepiece, an eighteenth-century silver crown, has turned an ugly, sooty black ' +
        'overnight. The insurance inspector mutters "acid attack." Dr. Sen whispers ' +
        '"sabotage." Yet the display case was sealed, the alarm never tripped, and no lock ' +
        'was forced. Was the crown poisoned, switched, or simply betrayed by its own ' +
        'chemistry? You have until the ribbon-cutting to tell a crime from a tarnish. ' +
        'Everything in this room reacts with something, Detective. Find what touched the ' +
        'silver.',
      clues: [
        'A corner of the black film wipes away to bright metal beneath. The crown was neither switched nor painted — its surface has chemically changed. This is a reaction product, not a replacement.',
        'A new "humidity gel" was placed in the case last night, and its label lists a sulphur compound. Silver reacts readily with sulphur in the surrounding air, coating itself in a black layer.',
        'A polishing cloth in the bin carries a fresh copper-coloured stain: someone had been running displacement tests, proving they understood the reactivity series well enough to predict what silver would and would not do.',
        'The gel was signed out by a staff member who also ordered the case sealed airtight for the night — trapping the fumes against the metal exactly where they would do the most damage.',
      ],
      deduction:
        'Q: A black film over bright silver, a sulphur-bearing gel signed into a case ordered sealed airtight, and a cloth showing practice displacement tests. Who blackened the crown, and by what chemistry?',
      suspects: [
        { name: 'Dr. Sen', motive: 'Curator. An insurance payout would rescue her failing museum.', theory: 'Faked the sabotage entirely — the crown was never damaged at all.' },
        { name: 'Anil', motive: 'Restoration intern, passed over for the exhibition credit he was promised.', theory: 'Planted a sulphur-releasing gel and sealed the case, letting the silver tarnish overnight.' },
        { name: 'Ratna', motive: 'Rival collector who wants the crown to fail its debut and sell cheap.', theory: 'Swapped the genuine crown for a blackened electroplated fake.' },
        { name: 'Kaka', motive: 'The old night guard, rumoured to have been bribed to look away.', theory: 'Splashed dilute acid across the crown to corrode the metal.' },
      ],
      culprit: 1,
      resolution:
        'Anil, the intern denied his credit, planted a sulphur-releasing gel and had the display case sealed airtight. Silver reacts with sulphur compounds in the air to form black silver sulphide — a surface tarnish, not a theft and not an acid burn. Because only the outermost layer had reacted, a careful polish reversed it and the crown caught the light again minutes before the ribbon was cut.',
    },

    {
      title: 'The Greenhouse Ghost',
      emoji: '🌺',
      chapterLabel: 'Science · Life Processes',
      subject: 'science',
      chapters: ['life'],
      clueCount: 5,
      leads: 3,
      timer: 45,
      mix: [0.45, 0.45, 0.1],
      redHerring: -1,
      intro:
        'On the terrace of Kalyani Nursery stands a sealed glasshouse of prize orchids — ' +
        'Mrs. D\'Souza\'s life\'s work, booked for the National Flower Show. Every ' +
        'full-moon night, without a single exception, the blooms droop and the leaves ' +
        'yellow by morning, though the doors stay locked and the thermostat never wavers. ' +
        'Old Fernandes the gardener crosses himself and blames a jilted spirit that ' +
        'walks by moonlight. But plants do not wilt for ghosts, Detective. They wilt for ' +
        'want of light, water, air, or the quiet chemistry running inside their own cells. ' +
        'The moon here is only a clock. Something has been set to it. Find out what these ' +
        'orchids are being starved of.',
      clues: [
        'The damage always follows the night and never the day. Whatever harms the orchids works in the hours when photosynthesis has stopped and only respiration continues — consuming oxygen, giving out carbon dioxide.',
        'The soil is properly moist yet the leaves hang limp. Water is reaching the roots but not the tips: something is throttling transpiration, and with it the pull that drags water up the xylem.',
        'A logger left in the glasshouse shows the sealed air turning heavy and stale on each "ghost" night. With the vents shut, the plants\' own respiration is enough to spoil the enclosed atmosphere.',
        'The automatic vent fan runs off a lunar-dial timer, and someone has set it to switch OFF on full-moon nights — sealing the house shut at precisely the hours the orchids most need gaseous exchange.',
        'Only somebody who knew that plants breathe in the dark would understand that closing the vents at night, rather than in daylight, would do the killing quietly and leave no mark.',
      ],
      deduction:
        'Q: Damage only after dark, moist soil under limp leaves, stale trapped air, and a vent timer set to seal the house on full-moon nights. Who is the ghost, and what is actually killing the orchids?',
      suspects: [
        { name: 'Fernandes', motive: 'Gardener. Wants the glasshouse closed so his own outdoor beds are entered for the show.', theory: 'Rigged the vent timer to seal the house on full-moon nights, suffocating the plants in their own respired air.' },
        { name: 'Mrs. D\'Souza', motive: 'Owner. Quietly over-insured the collection last season.', theory: 'Poisoned her own irrigation supply to claim on the policy.' },
        { name: 'Mr. Sharma', motive: 'Neighbour. Complains loudly that the terrace glasshouse blocks his view.', theory: 'A broken pane is letting in a cold night draught that shocks the blooms.' },
        { name: 'Priya', motive: 'Apprentice. Has been selling cuttings from the collection on the side.', theory: 'Over-watered the pots until the roots drowned and rotted.' },
      ],
      culprit: 0,
      resolution:
        'Fernandes set the vent timer to shut on full-moon nights — a calendar he could blame on a ghost. Sealed in darkness the orchids kept respiring: oxygen fell, carbon dioxide climbed, the stomata closed and transpiration stopped, so water never reached the leaves however wet the soil. Plants breathe day and night; only photosynthesis needs light. The haunting was a fan switch.',
    },

    {
      title: 'The Blinding Beacon',
      emoji: '🔦',
      chapterLabel: 'Science · Light + Human Eye',
      subject: 'science',
      chapters: ['light', 'eye'],
      clueCount: 5,
      leads: 3,
      timer: 45,
      mix: [0.45, 0.45, 0.1],
      redHerring: -1,
      intro:
        'For ninety years the Vengurla lighthouse has thrown a straight and honest beam ' +
        'across the rocks. Now keeper Tandel reports that the light "bends wrong" after ' +
        'dusk, and two fishing boats have already run aground on a reef the beam should ' +
        'have warned them off. Down the coast, old Fonseca — who lost the lamp-glass ' +
        'contract to another family a lifetime ago — has quietly reopened his ' +
        'grandfather\'s glassworks. Coincidence, perhaps. Light travels in straight lines, ' +
        'Detective, until something persuades it to turn: a lens, a mirror, a change of ' +
        'medium. Somebody has taught this honest beam to lie. Follow the ray, find the ' +
        'trick, and put the boats back on course before the next tide.',
      clues: [
        'The beam leaves the lamp true and exits the tower deflected. Light runs straight until it crosses into a new medium, where it refracts — so the bending is happening inside the glass, not inside the bulb.',
        'The replacement lens is noticeably thicker than the original. A shorter focal length converges the beam too soon, dropping the bright spot short of the reef instead of laying it across the danger.',
        'At the beam\'s edges the white light splays into faint colours. That dispersion betrays a prism-like optical grade of glass that no lighthouse would ever be fitted with.',
        'Sailors report the false glow sits to one side of the true rock. The eye trusts whichever single bright image it forms and steers straight at it — an illusion built out of a shifted converging lens.',
        'The lens crate carries the stamp of a glassworks that reopened only weeks before the beam first bent. The supplier and the sabotage share a date.',
      ],
      deduction:
        'Q: A beam that leaves true and exits bent, a thicker lens focusing short, colour fringing at the edges, and a crate stamped by a newly reopened glassworks. Who wrecked the boats, and how?',
      suspects: [
        { name: 'Fonseca', motive: 'Rival glassmaker, still bitter about the lamp-glass contract he lost decades ago.', theory: 'Supplied a thicker, wrong-grade lens whose short focal length refracts and mis-aims the beam.' },
        { name: 'Tandel', motive: 'Keeper. Wants the old tower automated and himself pensioned off with honour.', theory: 'Simply misaligned the lamp housing so the beam points off-axis.' },
        { name: 'Capt. Boodh', motive: 'Salvage captain. Profits from every hull that touches the reef.', theory: 'Planted a decoy lamp out on the rocks to draw boats onto them.' },
        { name: 'Meera', motive: 'Government surveyor, said to have been paid to condemn the lighthouse.', theory: 'The tower itself has tilted on its foundation; nothing optical is wrong at all.' },
      ],
      culprit: 0,
      resolution:
        'Fonseca fitted the tower with a thicker, wrong-grade lens from his reopened glassworks. Its shorter focal length refracted and converged the beam too early, while the prism-like glass dispersed the edges into colour — casting a bright false image well to one side of the reef. The sailors\' eyes trusted that single bright spot and steered onto the rocks. The correct lens was refitted, and the beam flies straight again.',
    },

    {
      title: 'The Probability Heist',
      emoji: '🎲',
      chapterLabel: 'Mathematics · Probability + Statistics',
      subject: 'mathematics',
      chapters: ['probability', 'statistics'],
      clueCount: 5,
      leads: 2,
      timer: 30,
      mix: [0.3, 0.5, 0.2],
      redHerring: 1,
      intro:
        'The St. Xavier\'s winter fête runs a charity casino night, and its star attraction ' +
        'is Lucky Sevens: roll two dice, make a seven, take triple your stake. It is ' +
        'advertised as a fair game of pure chance, and for eleven quiet years it has earned ' +
        'the school library its shelves. This year the table haemorrhaged forty thousand ' +
        'rupees in a single evening, and treasurer Mr. Joshi now stands accused of skimming ' +
        'the float. But numbers do not lie even when people do, Detective. A fair die has a ' +
        'shape that the odds and the averages must obey. If this table bled, then either ' +
        'the dice or the payout broke a law of probability. Go and audit chance itself.',
      clues: [
        'Two fair dice give thirty-six equally likely outcomes, and exactly six of them sum to seven. A true seven should therefore turn up about one roll in six — which is precisely the frequency the triple payout was priced for.',
        'The float came up forty thousand short and Mr. Joshi signed every single cash slip that night. On paper, the trail runs straight to the treasurer\'s desk.',
        'A tally of six hundred recorded rolls shows sevens landing far more often than a sixth of the time. The observed frequency distribution is skewed high, not the flat, predictable pattern honest dice produce.',
        'The mean of the two-dice sums has drifted away from the fair value of seven, which can only happen if the pips are weighted — certain faces, and with them the winning total, come up more than their share.',
        'With sevens over-frequent, a triple payout turns the expected value against the house on every single roll. The table was built, mathematically, to lose — by whoever placed the dice on it.',
      ],
      deduction:
        'Q: Sevens landing far above one in six across six hundred rolls, a sample mean drifting off the fair value, a triple payout priced for honest dice — and a signed pile of cash slips. Who drained the float?',
      suspects: [
        { name: 'Mr. Joshi', motive: 'Treasurer. Every rupee of the float passed through his hands.', theory: 'Skimmed the cash directly; the dice on the table were perfectly fair.' },
        { name: 'Deepa', motive: 'Stall volunteer, demoted from fête committee in September and furious about it.', theory: 'Swapped in loaded dice weighted toward seven, breaking the payout mathematics from the inside.' },
        { name: 'Karan', motive: 'A student who won steadily at the table all evening.', theory: 'Nothing but luck — an unusual run well within ordinary variance.' },
        { name: 'Mr. Rao', motive: 'PT teacher who runs the rival raffle stall across the hall.', theory: 'Miscounted the payouts by hand and over-paid the winners all night.' },
      ],
      culprit: 1,
      resolution:
        'Deepa swapped in loaded dice weighted to favour seven. Across six hundred rolls the frequency of sevens ran far above the fair one-in-six, and the sample mean of the sums drifted off the honest value of seven — arithmetic proof of biased pips rather than missing cash. At triple odds, over-frequent sevens made the game\'s expected value negative and the float drained itself. The pile of signed cash slips was a red herring: it recorded Mr. Joshi doing his job honestly, and the treasurer was cleared the same night.',
    },

    {
      title: 'The Impossible Triangle',
      emoji: '📐',
      chapterLabel: 'Mathematics · Triangles + Trigonometry',
      subject: 'mathematics',
      chapters: ['triangles', 'trigonometry'],
      clueCount: 5,
      leads: 2,
      timer: 30,
      mix: [0.3, 0.5, 0.2],
      redHerring: 2,
      intro:
        'Two survey maps of the same hillside plot at Panvel have landed on the tehsildar\'s ' +
        'desk, and a builder\'s fortune rides on which one is genuine. Both claim to ' +
        'describe the identical triangular field between the banyan, the well and the ' +
        'boundary stone — yet their measurements cannot possibly both be true. One surveyor ' +
        'is honest. One has forged a plan to stretch the land. There is no witness, no ' +
        'confession, and no photograph: only numbers inked on paper. But geometry keeps ' +
        'its own honesty, Detective. Sides, angles, similarity and the ratios of a right ' +
        'triangle must all agree with one another, or the map is a lie. Measure the ' +
        'impossible, and name the forger.',
      clues: [
        'Both maps list the same three angles but different side lengths. By similarity the sides of one must then be a fixed multiple of the other throughout — and on one map that ratio simply does not hold, so it is drawn to no consistent scale at all.',
        'The corner at the well is a right angle, which lets Pythagoras act as a referee: on the honest map the two legs and the hypotenuse satisfy the relation exactly, and on the other they miss it by metres.',
        'The suspect map carries the older, faded government seal, stamped and counter-signed in the proper ink. Surely the aged and official-looking plan is the authentic one.',
        'Taking the measured angle of elevation to the top of the banyan together with one known ground distance, trigonometry fixes the field\'s depth precisely — and only one of the two maps yields a real, positive length.',
        'The three interior angles written on the false map sum to more than 180°, which no triangle on flat ground can do. Somebody fabricated the angles outright to enlarge the plot on paper.',
      ],
      deduction:
        'Q: One map breaks the similarity ratio, fails Pythagoras at the right-angled corner, yields an impossible length by trigonometry, and lists angles summing past 180°. Who forged it, and why did it fail?',
      suspects: [
        { name: 'Gaikwad', motive: 'Builder. Every extra square metre on paper is money in his pocket.', theory: 'Paid for a map with fabricated angles and sides so the plot would measure larger than it is.' },
        { name: 'Rane', motive: 'Surveyor, elderly and half-blind, who drew one of the two plans.', theory: 'An honest measurement error crept in; there was no forgery at all.' },
        { name: 'Patil', motive: 'Neighbour who has disputed the boundary stone for two decades.', theory: 'Physically moved the boundary stone, so both maps are faithful to different ground.' },
        { name: 'Fatima', motive: 'Record-room clerk who filed both documents on the same afternoon.', theory: 'Accidentally swapped the two maps between their case folders.' },
      ],
      culprit: 0,
      resolution:
        'Gaikwad the builder paid to have the plot enlarged on paper, and his map failed every test geometry could set it: the sides broke the similarity ratio, the right-angled corner refused Pythagoras, trigonometry returned an impossible length, and the interior angles summed past 180°. The faded official seal was a red herring — an old stamp makes a document look authentic, never correct. The consistent map named the true, smaller field, and Rane was cleared of any error.',
    },
  ];

  /* ── DOM ──────────────────────────────────────────────────────────── */
  var el = {};
  var DOM_IDS = [
    'home', 'folders', 'rankName', 'rankMeta',
    'case', 'exitCase', 'caseTitle', 'leads',
    'clueStage', 'string', 'stringLine', 'clues', 'cluesEmpty',
    'timerWrap', 'timerFill', 'progress', 'chapterTag', 'transcript',
    'options', 'suspects', 'note', 'nextBtn',
    'sweep', 'overlay', 'overlayBody',
  ];

  var state = null;
  var progress = { solved: [], rank: 0 };
  var timerId = null;
  var typeId = null;

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    DOM_IDS.forEach(function (k) { el[k] = $('mf-' + k); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Progress ─────────────────────────────────────────────────────── */
  function loadProgress() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && Array.isArray(raw.solved)) {
        progress.solved = raw.solved.filter(function (n) {
          return typeof n === 'number' && n >= 0 && n < CASES.length;
        });
        progress.rank = Math.min(progress.solved.length, RANKS.length - 1);
      }
    } catch (e) { /* private mode — the board simply starts fresh */ }
  }

  function saveProgress() {
    progress.rank = Math.min(progress.solved.length, RANKS.length - 1);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        solved: progress.solved,
        rank: progress.rank,
      }));
    } catch (e) { /* nothing persists, but play continues */ }
  }

  function isSolved(i) { return progress.solved.indexOf(i) >= 0; }
  function isUnlocked(i) { return i === 0 || isSolved(i - 1); }

  /* ── Question selection ───────────────────────────────────────────── */
  /* Turn a difficulty mix such as [0.45, 0.45, 0.10] into an actual list of
     difficulty levels of the requested length, largest-remainder rounded. */
  function difficultyPlan(mix, count) {
    var raw = mix.map(function (f) { return f * count; });
    var counts = raw.map(function (v) { return Math.floor(v); });
    var used = counts.reduce(function (a, b) { return a + b; }, 0);
    var order = raw
      .map(function (v, i) { return { i: i, frac: v - Math.floor(v) }; })
      .sort(function (a, b) { return b.frac - a.frac; });
    var k = 0;
    while (used < count && order.length) {
      counts[order[k % order.length].i] += 1;
      used += 1;
      k += 1;
    }
    var plan = [];
    counts.forEach(function (n, idx) {
      for (var j = 0; j < n; j++) plan.push(idx + 1);
    });
    return Bank.shuffle(plan);
  }

  /* Draw `count` distinct bank questions for a case, honouring its chapters and
     difficulty mix. If a chapter pool is too thin the search widens to the whole
     subject rather than repeating the same question twice. */
  function drawCaseQuestions(def, count) {
    var pool = Bank.all.filter(function (q) {
      return def.chapters.indexOf(q.chapter) >= 0;
    });
    if (pool.length < count) {
      pool = Bank.all.filter(function (q) { return q.subject === def.subject; });
    }
    if (!pool.length) pool = Bank.all.slice();

    var plan = difficultyPlan(def.mix, count);
    var used = {};
    var out = [];

    plan.forEach(function (want) {
      var cands = pool.filter(function (q) { return q.difficulty === want && !used[q.id]; });
      if (!cands.length) cands = pool.filter(function (q) { return !used[q.id]; });
      if (!cands.length) { used = {}; cands = pool.slice(); }
      var pick = cands[Math.floor(Math.random() * cands.length)];
      used[pick.id] = true;
      out.push(pick);
    });
    return out;
  }

  /* Re-shuffle a COPY of the options for display and remap the answer index.
     `order[newIndex] = oldIndex`, so the correct option's new position is exactly
     where the old answer index appears in `order`. The bank object is untouched. */
  function forDisplay(q) {
    var order = Bank.shuffle([0, 1, 2, 3]);
    return {
      question: q.question,
      explain: q.explain,
      chapterTitle: q.chapterTitle,
      subjectLabel: q.subjectLabel,
      difficulty: q.difficulty,
      options: order.map(function (i) { return q.options[i]; }),
      answer: order.indexOf(q.answer),
    };
  }

  /* ── Case board ───────────────────────────────────────────────────── */
  function renderRank() {
    var n = progress.solved.length;
    el.rankName.textContent = RANKS[Math.min(n, RANKS.length - 1)];
    el.rankMeta.textContent = n + ' / ' + CASES.length + ' cases closed';
  }

  function renderBoard() {
    renderRank();
    el.folders.innerHTML = '';
    CASES.forEach(function (def, i) {
      var solved = isSolved(i);
      var unlocked = isUnlocked(i);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mf-folder' + (solved ? ' is-solved' : '') + (unlocked ? '' : ' is-locked');
      b.setAttribute('data-tab', 'Case ' + (i + 1));
      b.disabled = !unlocked;
      b.setAttribute('data-case', String(i));

      var timerTag = def.timer ? def.timer + 's / question' : 'No timer';
      b.innerHTML =
        '<span class="mf-folder-emoji">' + def.emoji + '</span>' +
        '<span class="mf-folder-title">' + escapeHtml(unlocked ? def.title : 'Sealed File') + '</span>' +
        '<span class="mf-folder-chapter">' +
          escapeHtml(unlocked ? def.chapterLabel : 'Close the previous case to untie this folder.') +
        '</span>' +
        '<span class="mf-folder-spec">' +
          '<span>' + def.clueCount + ' clues</span>' +
          '<span>' + def.leads + ' leads</span>' +
          '<span>' + timerTag + '</span>' +
        '</span>' +
        (solved ? '<span class="mf-stamp">CLOSED</span>' : '') +
        (unlocked ? '' : '<span class="mf-folder-lock">🪢</span>');

      el.folders.appendChild(b);
    });
  }

  function showHome() {
    stopTimer();
    stopTyping();
    closeOverlay();
    state = null;
    el.case.hidden = true;
    el.home.hidden = false;
    renderBoard();
  }

  /* ── Typewriter (case intro / resolution only) ────────────────────── */
  function stopTyping() {
    if (typeId) { clearInterval(typeId); typeId = null; }
  }

  function typeInto(node, text) {
    stopTyping();
    if (!node) return;
    node.textContent = '';
    node.classList.add('is-typing');
    var i = 0;
    typeId = setInterval(function () {
      i += 3;
      node.textContent = text.slice(0, i);
      if (i >= text.length) {
        node.textContent = text;
        node.classList.remove('is-typing');
        stopTyping();
      }
    }, 16);
    // Clicking anywhere in the card reveals the rest at once.
    node.addEventListener('click', function () {
      stopTyping();
      node.textContent = text;
      node.classList.remove('is-typing');
    });
  }

  /* ── Overlay ──────────────────────────────────────────────────────── */
  function openOverlay(html) {
    el.overlayBody.innerHTML = html;
    el.overlay.hidden = false;
  }

  function closeOverlay() {
    stopTyping();
    el.overlay.hidden = true;
  }

  /* ── Case lifecycle ───────────────────────────────────────────────── */
  function openCaseBrief(index) {
    var def = CASES[index];
    openOverlay(
      '<p class="mf-card-kicker">Case File ' + (index + 1) + ' · ' + escapeHtml(def.chapterLabel) + '</p>' +
      '<span class="mf-card-emoji">' + def.emoji + '</span>' +
      '<h2>' + escapeHtml(def.title) + '</h2>' +
      '<p class="mf-typed" id="mf-introText"></p>' +
      '<div class="mf-card-brief">' +
        '<span>' + def.clueCount + ' clues to pin</span>' +
        '<span>' + def.leads + ' leads to burn</span>' +
        '<span>' + (def.timer ? def.timer + 's per question' : 'Take your time') + '</span>' +
      '</div>' +
      '<div class="mf-actions">' +
        '<button type="button" class="mf-btn" data-act="begin" data-case="' + index + '">Open the file →</button>' +
        '<button type="button" class="mf-btn mf-btn--ghost" data-act="board">Case board</button>' +
      '</div>'
    );
    typeInto($('mf-introText'), def.intro);
  }

  function beginCase(index) {
    var def = CASES[index];
    state = {
      index: index,
      def: def,
      queue: drawCaseQuestions(def, def.clueCount + def.leads).map(forDisplay),
      cluesEarned: 0,
      leadsLeft: def.leads,
      phase: 'question',
      current: null,
      suspectOrder: null,
      secondsLeft: 0,
    };

    closeOverlay();
    el.home.hidden = true;
    el.case.hidden = false;
    el.caseTitle.textContent = 'Case ' + (index + 1) + ' · ' + def.title;
    el.clues.innerHTML = '';
    el.cluesEmpty.hidden = false;
    el.stringLine.setAttribute('points', '');
    el.note.classList.remove('is-on');
    el.nextBtn.hidden = true;
    el.suspects.hidden = true;
    el.options.hidden = false;
    renderLeads();
    nextQuestion();
  }

  function renderLeads() {
    el.leads.innerHTML = '';
    for (var i = 0; i < state.def.leads; i++) {
      var s = document.createElement('span');
      s.className = 'mf-lead' + (i >= state.leadsLeft ? ' is-burnt' : '');
      s.textContent = '🔍';
      el.leads.appendChild(s);
    }
  }

  /* ── Evidence board ───────────────────────────────────────────────── */
  function pinClue(slot) {
    el.cluesEmpty.hidden = true;
    var card = document.createElement('article');
    card.className = 'mf-clue';
    card.innerHTML =
      '<span class="mf-clue-pin"></span>' +
      '<span class="mf-clue-no">Clue ' + (slot + 1) + ' of ' + state.def.clueCount + '</span>' +
      '<span class="mf-clue-text">' + escapeHtml(state.def.clues[slot]) + '</span>';
    el.clues.appendChild(card);
    // The flip animation moves the card, so wait for it before measuring pins.
    setTimeout(drawString, 720);
  }

  /* Connect the pins with a red string. Points are measured in the clue stage's
     own pixel space, which is also the SVG's viewBox space. */
  function drawString() {
    if (!state || el.case.hidden) return;
    var stage = el.clueStage;
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    if (!w || !h) return;

    el.string.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var grad = document.getElementById('mfString');
    if (grad) {
      grad.setAttribute('x1', '0');
      grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '0');
      grad.setAttribute('y2', String(h));
    }

    var pts = [];
    var cards = el.clues.querySelectorAll('.mf-clue');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      pts.push((c.offsetLeft + 18) + ',' + c.offsetTop);
    }
    el.stringLine.setAttribute('points', pts.length > 1 ? pts.join(' ') : '');
  }

  /* ── Question flow ────────────────────────────────────────────────── */
  function nextQuestion() {
    stopTimer();
    el.note.classList.remove('is-on');
    el.nextBtn.hidden = true;

    if (state.cluesEarned >= state.def.clueCount) { startDeduction(); return; }
    if (!state.queue.length) {
      state.queue = drawCaseQuestions(state.def, 4).map(forDisplay);
    }

    var q = state.queue.shift();
    state.current = q;
    state.phase = 'question';

    el.suspects.hidden = true;
    el.options.hidden = false;
    el.progress.textContent = 'Clue ' + (state.cluesEarned + 1) + ' of ' + state.def.clueCount;
    el.chapterTag.textContent = q.chapterTitle;
    el.transcript.textContent = 'Q: ' + q.question;

    el.options.innerHTML = '';
    q.options.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mf-opt';
      b.innerHTML = '<span class="mf-opt-key">' + 'ABCD'[i] + '</span><span>' + escapeHtml(text) + '</span>';
      b.addEventListener('click', function () { answerQuestion(i); });
      el.options.appendChild(b);
    });

    if (state.def.timer) startTimer(state.def.timer);
    else el.timerWrap.hidden = true;
  }

  function startTimer(seconds) {
    state.secondsLeft = seconds;
    el.timerWrap.hidden = false;
    el.timerFill.style.width = '100%';
    el.timerFill.classList.remove('is-low');
    timerId = setInterval(function () {
      state.secondsLeft -= 0.1;
      var pct = Math.max(0, (state.secondsLeft / seconds) * 100);
      el.timerFill.style.width = pct + '%';
      if (pct < 30) el.timerFill.classList.add('is-low');
      if (state.secondsLeft <= 0) answerQuestion(-1);
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function answerQuestion(chosen) {
    if (state.phase !== 'question') return;
    stopTimer();
    state.phase = 'reviewing';

    var q = state.current;
    var ok = chosen === q.answer;

    var buttons = el.options.querySelectorAll('.mf-opt');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (i === q.answer) buttons[i].classList.add('is-correct');
      else if (i === chosen) buttons[i].classList.add('is-wrong');
    }

    if (ok) {
      var slot = state.cluesEarned;
      state.cluesEarned += 1;
      pinClue(slot);
      showNote(true, 'Clue recovered', q.explain);
    } else {
      state.leadsLeft -= 1;
      renderLeads();
      showNote(false, chosen === -1 ? 'Lead burnt — the trail went cold while you hesitated' : 'Lead burnt',
        'The answer was "' + q.options[q.answer] + '". ' + q.explain);
    }

    if (state.leadsLeft <= 0) {
      setTimeout(caseCold, 1500);
    } else {
      el.nextBtn.textContent = state.cluesEarned >= state.def.clueCount
        ? 'Make the deduction →'
        : 'Next lead →';
      el.nextBtn.hidden = false;
    }
  }

  function showNote(ok, heading, body) {
    el.note.dataset.ok = ok ? '1' : '0';
    el.note.innerHTML =
      '<b>Forensic note · ' + escapeHtml(heading) + '</b>' +
      '<em>' + (ok ? '✔' : '✖') + '</em> ' + escapeHtml(body);
    el.note.classList.add('is-on');
  }

  /* ── Deduction ────────────────────────────────────────────────────── */
  function startDeduction() {
    stopTimer();
    state.phase = 'deduction';
    el.timerWrap.hidden = true;
    el.options.hidden = true;
    el.options.innerHTML = '';
    el.note.classList.remove('is-on');
    el.nextBtn.hidden = true;
    el.progress.textContent = 'Final deduction';
    el.chapterTag.textContent = 'The line-up';
    el.transcript.textContent = state.def.deduction;

    // Shuffle the line-up and remap the culprit index the same way options are
    // remapped: order[newIndex] = oldIndex, so the culprit's new seat is
    // order.indexOf(oldCulpritIndex).
    var order = Bank.shuffle([0, 1, 2, 3]);
    state.suspectOrder = order;
    state.culpritSeat = order.indexOf(state.def.culprit);

    renderSuspects();
  }

  function renderSuspects() {
    el.suspects.hidden = false;
    el.suspects.innerHTML = '';
    state.suspectOrder.forEach(function (srcIdx, seat) {
      var s = state.def.suspects[srcIdx];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mf-suspect';
      b.style.setProperty('--mf-hue', String(HUES[seat % HUES.length]));
      b.style.animationDelay = (seat * 0.07) + 's';
      b.innerHTML =
        '<span class="mf-face">' + escapeHtml(s.name.charAt(0)) + '</span>' +
        '<span class="mf-suspect-name">' + escapeHtml(s.name) + '</span>' +
        '<span class="mf-suspect-motive">' + escapeHtml(s.motive) + '</span>' +
        '<span class="mf-suspect-theory">' + escapeHtml(s.theory) + '</span>';
      b.addEventListener('click', function () { accuse(seat); });
      el.suspects.appendChild(b);
    });
  }

  function accuse(seat) {
    if (state.phase !== 'deduction') return;
    state.phase = 'verdict';

    var cards = el.suspects.querySelectorAll('.mf-suspect');
    for (var i = 0; i < cards.length; i++) cards[i].disabled = true;

    if (seat === state.culpritSeat) {
      cards[seat].classList.add('is-guilty');
      setTimeout(solveCase, 700);
      return;
    }

    cards[seat].classList.add('is-cleared');
    state.leadsLeft -= 1;
    renderLeads();

    if (state.leadsLeft <= 0) {
      showNote(false, 'Wrong accusation', 'That theory does not fit the evidence, and you are out of leads.');
      setTimeout(caseCold, 1500);
      return;
    }

    showNote(false, 'Wrong accusation',
      'That theory contradicts what is pinned to your board. A lead is burnt — re-read the clue cards, then accuse again.');
    el.nextBtn.textContent = 'Accuse again →';
    el.nextBtn.hidden = false;
  }

  /* ── Endings ──────────────────────────────────────────────────────── */
  function sweep() {
    el.sweep.classList.remove('is-on');
    void el.sweep.offsetWidth;                      // force reflow to restart
    el.sweep.classList.add('is-on');
  }

  function solveCase() {
    stopTimer();
    state.phase = 'ended';
    var def = state.def;
    var index = state.index;
    var firstTime = !isSolved(index);
    if (firstTime) { progress.solved.push(index); saveProgress(); }
    sweep();

    var n = progress.solved.length;
    var rankLine = firstTime
      ? '<div class="mf-card-rank">Case ' + (index + 1) + ' stamped closed. You are now <b>' +
        RANKS[Math.min(n, RANKS.length - 1)] + '</b> — ' + n + ' of ' + CASES.length + ' files shut.' +
        (index + 1 < CASES.length ? ' Case ' + (index + 2) + ' has been untied for you.' : ' Every file on the board is closed.') +
        '</div>'
      : '<div class="mf-card-rank">Re-opened and re-closed. Rank unchanged at <b>' +
        RANKS[Math.min(n, RANKS.length - 1)] + '</b>.</div>';

    openOverlay(
      '<p class="mf-card-kicker">Case File ' + (index + 1) + ' · Verdict</p>' +
      '<span class="mf-closed-stamp">CLOSED</span>' +
      '<h2>' + escapeHtml(def.title) + '</h2>' +
      '<p class="mf-typed" id="mf-resolutionText"></p>' +
      rankLine +
      '<div class="mf-actions">' +
        (index + 1 < CASES.length
          ? '<button type="button" class="mf-btn" data-act="open" data-case="' + (index + 1) + '">Next case →</button>'
          : '') +
        '<button type="button" class="mf-btn mf-btn--ghost" data-act="board">Case board</button>' +
      '</div>'
    );
    typeInto($('mf-resolutionText'), def.resolution);
  }

  function caseCold() {
    stopTimer();
    state.phase = 'ended';
    var index = state.index;
    var def = state.def;
    openOverlay(
      '<p class="mf-card-kicker">Case File ' + (index + 1) + ' · Suspended</p>' +
      '<span class="mf-card-emoji">🥶</span>' +
      '<h2>Case gone cold</h2>' +
      '<p class="mf-typed" id="mf-coldText"></p>' +
      '<div class="mf-card-brief">' +
        '<span>' + state.cluesEarned + ' of ' + def.clueCount + ' clues recovered</span>' +
        '<span>0 leads left</span>' +
      '</div>' +
      '<div class="mf-actions">' +
        '<button type="button" class="mf-btn" data-act="retry" data-case="' + index + '">Reopen the case</button>' +
        '<button type="button" class="mf-btn mf-btn--ghost" data-act="board">Case board</button>' +
      '</div>'
    );
    typeInto($('mf-coldText'),
      'Every lead is burnt and the trail has frozen over. ' + def.title +
      ' goes back into the cabinet unsolved — but files here are never truly shut. ' +
      'Revise the chapter, come back, and work the evidence again.');
  }

  /* ── Boot ─────────────────────────────────────────────────────────── */
  function init() {
    cacheDom();
    loadProgress();
    renderBoard();

    el.folders.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.mf-folder');
      if (!btn || btn.disabled) return;
      openCaseBrief(parseInt(btn.getAttribute('data-case'), 10));
    });

    el.overlay.addEventListener('click', function (ev) {
      var act = ev.target.closest('[data-act]');
      if (!act) return;
      var a = act.getAttribute('data-act');
      var idx = parseInt(act.getAttribute('data-case'), 10);
      if (a === 'begin') beginCase(idx);
      else if (a === 'retry') beginCase(idx);
      else if (a === 'open') { closeOverlay(); openCaseBrief(idx); }
      else if (a === 'board') showHome();
    });

    el.nextBtn.addEventListener('click', function () {
      if (!state) return;
      if (state.phase === 'verdict') {
        // A wrong accusation: put the line-up back up for another attempt.
        state.phase = 'deduction';
        el.note.classList.remove('is-on');
        el.nextBtn.hidden = true;
        renderSuspects();
      } else {
        nextQuestion();
      }
    });

    el.exitCase.addEventListener('click', showHome);

    window.addEventListener('resize', drawString);

    // Keyboard: A–D pick an option, Enter/Space advances.
    document.addEventListener('keydown', function (ev) {
      if (!el.overlay.hidden || !state || el.case.hidden) return;
      var idx = 'ABCD'.indexOf(ev.key.toUpperCase());
      if (idx >= 0) {
        var list = state.phase === 'deduction'
          ? el.suspects.querySelectorAll('.mf-suspect')
          : el.options.querySelectorAll('.mf-opt');
        var btn = list[idx];
        if (btn && !btn.disabled) { ev.preventDefault(); btn.click(); }
      } else if ((ev.key === 'Enter' || ev.key === ' ') && !el.nextBtn.hidden) {
        ev.preventDefault();
        el.nextBtn.click();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
