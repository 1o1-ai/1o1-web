#!/usr/bin/env python3
"""Generate CBSE10 discussion forum threads using academy bot actors."""
from __future__ import annotations

import argparse
import json
import random
import re
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "portal" / "data"
CURRICULUM_PATH = DATA / "cbse10-curriculum.json"
BOTS_PATH = DATA / "academy-bots.json"
OUT_PATH = DATA / "cbse10-forum.json"

SAHADEVA = {
    "id": "sahadeva",
    "name": "Sahadeva",
    "role": "assistant",
    "author_role": "assistant",
    "location": "ManjuLAB Study Assistant · CBSE 10",
    "photo": "",
}

# Curated discussion seeds (informed by common CBSE Class 10 study forums)
SPECIAL_THREADS = [
    {
        "title": "How do fossils form and why are they important for evolution?",
        "subject": "science",
        "chapter": "heredity",
        "chapter_title": "Heredity",
        "tags": ["fossils", "evolution"],
        "op": "Can someone explain fossil formation in simple steps? Our teacher mentioned relative dating vs absolute dating — is that in syllabus?",
        "replies": [
            "Fossils form when organisms get buried in sediment and minerals replace organic matter over millions of years.",
            "Relative dating compares rock layers; absolute dating uses carbon-14 or uranium — CBSE usually asks basic concepts only.",
            "Remember: fossils show evolutionary links — archaeopteryx is a classic example teachers love.",
        ],
        "teacher": "Focus on NCERT definitions: fossil, evolution, and how Mendel links to variation. Diagram of sedimentary layers helps in board answers.",
    },
    {
        "title": "Best reference books for CBSE Class 10 Mathematics (besides NCERT)?",
        "subject": "mathematics",
        "chapter": "real-numbers",
        "chapter_title": "Real Numbers",
        "tags": ["books", "resources"],
        "op": "NCERT is clear but I need more practice for Standard Math. RD Sharma vs RS Aggarwal vs Educart — what do seniors recommend?",
        "replies": [
            "RD Sharma has huge question bank — good for daily practice but pick selected exercises, not everything.",
            "RS Aggarwal is slightly easier; I use it before mocks.",
            "Educart question bank aligns with latest pattern — useful for case-study MCQs.",
            "Don't skip NCERT examples — many board questions are NCERT-based with twisted numbers.",
        ],
        "teacher": "NCERT + previous year papers first. One reference book is enough; depth beats collecting five books.",
    },
]

CHAPTER_PROMPTS: dict[str, list[dict]] = {
    "chem-reactions": [
        {"title": "Balancing chemical equations quickly", "op": "I keep making mistakes balancing {kw}. Any trick for CBSE?" , "replies": ["Start with complex molecules, leave H and O for last.", "Check atom count on both sides after each coefficient change."]},
        {"title": "Rusting experiment — observations for lab record", "op": "What exactly should we write when iron nails rust in moist air?", "replies": ["Brown flaky deposit = hydrated iron(III) oxide.", "Need both oxygen and water — oil-coated nail control proves it."]},
    ],
    "acids-bases": [
        {"title": "pH scale numerical confusion", "op": "If pH changes from 5 to 3, how many times acidity increases?", "replies": ["100 times — each unit is factor of 10.", "Use 10^(5-3) = 100 for strong vs weak acid comparison questions."]},
        {"title": "Washing soda vs baking soda in daily life", "op": "Examiner asked uses — can we write same uses for both?", "replies": ["No — Na2CO3.10H2O is washing soda; NaHCO3 is baking soda.", "Baking soda for antacid and fire extinguisher; washing soda for cleaning."]},
    ],
    "metals": [
        {"title": "Reactivity series — must we memorise full list?", "op": "Which metals are essential for CBSE 10?", "replies": ["K Na Ca Mg Al Zn Fe Pb Cu Ag Au — at least up to copper.", "Displacement reactions use this — iron in copper sulphate is favourite."]},
    ],
    "carbon": [
        {"title": "Ethanol vs ethanoic acid functional groups", "op": "How to distinguish -OH and -COOH in one line?", "replies": ["Ethanol has alcohol group; ethanoic acid has carboxylic — turns blue litmus red.", "Esterification test links both — smell of ester in lab."]},
    ],
    "life": [
        {"title": "Photosynthesis equation — balanced form", "op": "Do we lose marks if we skip light/chlorophyll above arrow?", "replies": ["Write conditions above/below arrow — CBSE marking schemes show it.", "6CO2 + 6H2O -> C6H12O6 + 6O2 with chlorophyll and sunlight."]},
        {"title": "Difference aerobic vs anaerobic respiration", "op": "Yeast question came in preboard — products?", "replies": ["Anaerobic in yeast: ethanol + CO2 + energy.", "Muscles: lactic acid during heavy exercise — cramp link."]},
    ],
    "control": [
        {"title": "Reflex arc diagram order", "op": "Sequence from receptor to effector?", "replies": ["Receptor -> sensory neuron -> spinal cord -> motor neuron -> effector.", "Reflex is faster because brain is bypassed for urgent response."]},
    ],
    "reproduction": [
        {"title": "Binary fission in Amoeba vs Leishmania", "op": "Why plane of division differs?", "replies": ["Amoeba: any plane. Leishmania: definite orientation due to whip-like structure.", "Draw labelled diagrams — easy 3 marks if neat."]},
    ],
    "heredity": [
        {"title": "Monohybrid cross ratio", "op": "F2 phenotypic ratio for pea plant height?", "replies": ["3:1 dominant : recessive.", "Genotypic ratio 1:2:1 — don't mix them in short answers."]},
    ],
    "light": [
        {"title": "Mirror formula sign convention", "op": "Real image distance u and v signs?", "replies": ["Cartesian: object distance u negative; real image v negative for mirrors.", "Practice numericals from NCERT Exercise 9.2."]},
        {"title": "Lens power and focal length relation", "op": "If f = 0.5 m, power?", "replies": ["P = 1/f(m) = 2 D (dioptre).", "Convex positive, concave negative power."]},
    ],
    "electricity": [
        {"title": "Series vs parallel — which bulb brighter?", "op": "Same bulbs, same battery — parallel brighter?", "replies": ["Parallel gets full voltage each; series shares voltage.", "Household wiring is parallel so appliances get 220 V."]},
    ],
    "magnetism": [
        {"title": "Fleming's left hand rule — finger mapping", "op": "Thumb, fore, middle — what each?", "replies": ["Thumb = motion/force, Fore = field, Middle = current.", "Right hand rule is for generator — don't swap in exam."]},
    ],
    "environment": [
        {"title": "Food chain vs food web", "op": "Why food web is more realistic?", "replies": ["Organisms eat multiple sources — web shows interconnection.", "10% energy law applies at each trophic level."]},
        {"title": "Ozone layer depletion — CFC role", "op": "One mark answer expected?", "replies": ["CFCs release Cl radicals that destroy O3 in stratosphere.", "Montreal Protocol reduced CFC use — good one-liner for value-based Q."]},
    ],
    "real-numbers": [
        {"title": "Prove sqrt(2) is irrational — structure", "op": "Do we need full contradiction proof?", "replies": ["Yes — assume p/q in lowest terms, square both sides, show even/odd clash.", "NCERT Example 1 is the template — practise writing cleanly."]},
    ],
    "polynomials": [
        {"title": "Relationship between zeroes and coefficients", "op": "For ax²+bx+c, sum and product of zeroes?", "replies": ["Sum = -b/a, product = c/a.", "If zeroes given, write k[x² - (sum)x + product]."]},
    ],
    "linear-eq": [
        {"title": "Graphical method inconsistent pair", "op": "Parallel lines mean what?", "replies": ["No solution — a1/a2 = b1/b2 ≠ c1/c2.", "Intersecting: unique solution; coincident: infinite solutions."]},
    ],
    "quadratic": [
        {"title": "Discriminant D = 0 meaning", "op": "Equal roots — how to write root value?", "replies": ["D = b² - 4ac = 0 gives x = -b/2a (repeated).", "Nature of roots questions are fast 2-mark scoring."]},
    ],
    "ap": [
        {"title": "nth term vs sum formula — when to use Sn?", "op": "Word problems confuse me.", "replies": ["Sn when total over n terms asked; an = a+(n-1)d for single term.", "Write a, d, n first — table method saves time."]},
    ],
    "coordinate": [
        {"title": "Section formula internal division", "op": "Midpoint is special case?", "replies": ["m:n = 1:1 gives midpoint ((x1+x2)/2, (y1+y2)/2).", "Distance formula first — section builds on it."]},
    ],
    "triangles": [
        {"title": "BPT / Thales theorem statement", "op": "Figure question likely?", "replies": ["Line parallel to one side divides other two sides proportionally.", "Yes — 'in the given figure' proofs appear often; draw big neat diagrams."]},
    ],
    "circles": [
        {"title": "Tangent perpendicular to radius — proof idea", "op": "One step justification enough?", "replies": ["Tangent touches at one point; radius to point of contact is shortest distance.", "Use perpendicular => shortest distance from centre to line."]},
    ],
    "trigonometry": [
        {"title": "sin²A + cos²A = 1 — uses", "op": "How to simplify 1 - sin²θ?", "replies": ["Equals cos²θ.", "Identity proofs — convert all to sin/cos first."]},
    ],
    "trig-apps": [
        {"title": "Angle of elevation vs depression", "op": "Same triangle tricks?", "replies": ["Elevation: look up from horizontal; depression: look down.", "Alternate angles in parallel lines often link depression to elevation."]},
    ],
    "areas-circles": [
        {"title": "Area of segment formula", "op": "Sector minus triangle — always?", "replies": ["Segment area = sector - triangular portion.", "Keep θ in degrees if using πθr²/360."]},
    ],
    "surface-volume": [
        {"title": "Frustum bucket problem strategy", "op": "CSA vs TSA which formula?", "replies": ["Open bucket: usually CSA of frustum + base circle.", "Draw and label r1, r2, h, slant l before substituting."]},
    ],
    "statistics": [
        {"title": "Mean of grouped data — assumed mean", "op": "Which class mark to pick as a?", "replies": ["Central class with big frequency reduces calculation.", "fi*xi or di method — stay consistent in one paper."]},
    ],
    "probability": [
        {"title": "Elementary event probability sum", "op": "Why sum of all elementary = 1?", "replies": ["Exactly one outcome occurs in single trial.", "Impossible = 0, certain = 1 — bounds for every event."]},
    ],
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def pick_actor(pool: list, subject: str, rng: random.Random):
    filtered = [p for p in pool if p.get("subject") in (subject, "both", "mathematics", "science")]
    if not filtered:
        filtered = pool
    return rng.choice(filtered)


def make_post(author: dict, body: str, *, disclaimer: str | None = None, minutes_ago: int = 0) -> dict:
    ts = (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).isoformat()
    return {
        "author_id": author.get("id", "unknown"),
        "author_name": author["name"],
        "author_role": author.get("role", "student"),
        "location": author.get("location", ""),
        "photo": author.get("photo", ""),
        "body": body.strip(),
        "created_at": ts,
        **({"disclaimer": disclaimer} if disclaimer else {}),
    }


def expand_template(ch: dict, subject: str, tpl: dict, students: list, teachers: list, rng: random.Random, idx: int) -> dict:
    kw = (ch.get("keywords") or ["concept"])[0]
    title = tpl["title"]
    op_body = tpl["op"].replace("{kw}", kw)
    tid = f"thr_{subject[:3]}_{ch['id']}_{idx:04d}"
    posts = []
    op_author = pick_actor(students, subject, rng)
    posts.append(make_post(op_author, op_body, minutes_ago=rng.randint(60, 7200)))
    for j, reply in enumerate(tpl.get("replies", [])):
        posts.append(make_post(pick_actor(students, subject, rng), reply, minutes_ago=rng.randint(30, 7000 - j * 100)))
    if tpl.get("teacher"):
        tpool = [t for t in teachers if t.get("subject") in (subject, "both")] or teachers
        posts.append(make_post(rng.choice(tpool), tpl["teacher"], minutes_ago=rng.randint(10, 5000)))
    posts.sort(key=lambda p: p["created_at"], reverse=True)
    return {
        "id": tid,
        "title": title,
        "subject": subject,
        "chapter": ch["id"],
        "chapter_title": ch["title"],
        "tags": tpl.get("tags", ["chapter"]),
        "reply_count": len(posts),
        "posts": posts,
    }


def prediction_thread(ch: dict, subject: str, students: list, teachers: list, rng: random.Random, idx: int) -> dict:
    kw = (ch.get("keywords") or ["topic"])[0]
    title = f"Possible {ch['title']} questions for next board — Sahadeva analysis"
    tid = f"pred_{subject[:3]}_{ch['id']}_{idx:04d}"
    disclaimer = (
        "AI-generated prediction for practice only. Not affiliated with CBSE. "
        "Do not treat as leaked paper. Verify with NCERT and your teacher."
    )
    posts = [
        make_post(
            pick_actor(students, subject, rng),
            f"Has anyone seen repeated {kw} questions in 2023–2025 papers? What might come next year?",
            minutes_ago=8000,
        ),
        make_post(
            SAHADEVA,
            f"Based on verified ingested papers, {ch['title']} shows recurring MCQ patterns on {kw}. "
            f"Practice numericals combining {kw} with one previous-year twist. "
            f"Board often reuses NCERT exemplar structure with new numbers.",
            disclaimer=disclaimer,
            minutes_ago=7900,
        ),
        make_post(
            rng.choice([t for t in teachers if t.get("subject") in (subject, "both")] or teachers),
            "Use predictions to guide revision, not to skip chapters. Previous year papers remain the best source.",
            minutes_ago=7800,
        ),
    ]
    posts.sort(key=lambda p: p["created_at"], reverse=True)
    return {
        "id": tid,
        "title": title,
        "subject": subject,
        "chapter": ch["id"],
        "chapter_title": ch["title"],
        "tags": ["prediction", "sahadeva"],
        "reply_count": len(posts),
        "posts": posts,
    }


def fetch_web_hints(query: str, timeout: int = 8) -> str:
    """Optional lightweight web hint via DuckDuckGo HTML (best-effort)."""
    try:
        url = "https://html.duckduckgo.com/html/?q=" + urllib.request.quote(query)
        req = urllib.request.Request(url, headers={"User-Agent": "ManjuLAB-ForumBot/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        snippets = re.findall(r'class="result__snippet"[^>]*>([^<]+)', html)
        if snippets:
            return snippets[0].strip()[:280]
    except Exception:
        pass
    return ""


def build_threads(count: int, seed: int, use_web: bool) -> list:
    rng = random.Random(seed)
    curriculum = load_json(CURRICULUM_PATH)
    bots = load_json(BOTS_PATH)
    students = bots["students"]
    teachers = bots["teachers"]
    threads: list[dict] = []

    for st in SPECIAL_THREADS:
        ch = {"id": st["chapter"], "title": st["chapter_title"], "keywords": []}
        tpl = {
            "title": st["title"],
            "op": st["op"],
            "replies": st["replies"],
            "teacher": st.get("teacher", ""),
            "tags": st.get("tags", []),
        }
        t = expand_template(ch, st["subject"], tpl, students, teachers, rng, len(threads))
        t["tags"] = st.get("tags", t["tags"])
        if use_web:
            hint = fetch_web_hints(f"CBSE class 10 {st['title'][:40]}")
            if hint:
                t["posts"].insert(1, make_post(SAHADEVA, f"Web note: {hint}", minutes_ago=7500))
                t["reply_count"] = len(t["posts"])
        threads.append(t)

    chapters_meta: list[tuple[str, dict]] = []
    for sub in ("science", "mathematics"):
        for ch in curriculum["subjects"][sub]["chapters"]:
            chapters_meta.append((sub, ch))

    idx = 0
    while len(threads) < count:
        sub, ch = chapters_meta[idx % len(chapters_meta)]
        idx += 1
        prompts = CHAPTER_PROMPTS.get(ch["id"], [])
        if prompts:
            tpl = dict(rng.choice(prompts))
            tpl.setdefault("tags", ["chapter"])
        elif rng.random() < 0.15:
            threads.append(prediction_thread(ch, sub, students, teachers, rng, len(threads)))
            continue
        else:
            kw = rng.choice(ch.get("keywords") or ["concept"])
            tpl = {
                "title": f"Doubt in {ch['title']}: {kw}",
                "op": f"Can someone explain {kw} for CBSE 10 {sub}? I get stuck in textbook examples.",
                "replies": [
                    f"Revise NCERT {ch['title']} first — definition of {kw} is often one mark.",
                    "Try one previous year MCQ on this — pattern repeats.",
                ],
                "tags": ["chapter", "doubt"],
            }
        t = expand_template(ch, sub, tpl, students, teachers, rng, len(threads))
        if use_web and len(threads) % 12 == 0:
            hint = fetch_web_hints(f"CBSE 10 {ch['title']} study tips")
            if hint:
                t["posts"].append(make_post(SAHADEVA, f"Study hint: {hint}", minutes_ago=100))
                t["reply_count"] = len(t["posts"])
        threads.append(t)

    return threads[:count]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=235)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--web", action="store_true", help="Fetch optional web hints (slow)")
    ap.add_argument("--out", type=Path, default=OUT_PATH)
    args = ap.parse_args()
    threads = build_threads(args.count, args.seed, args.web)
    payload = {
        "version": 1,
        "sku": "cbse10-core",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "assistant": {"id": "sahadeva", "name": "Sahadeva", "brand": "ManjuLAB Study Assistant"},
        "threads": threads,
        "meta": {"thread_count": len(threads), "subjects": ["science", "mathematics"]},
    }
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(threads)} threads -> {args.out}")


if __name__ == "__main__":
    main()
