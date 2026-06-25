#!/usr/bin/env python3
"""Export VOLTAIC CBSE-10 Study Material → portal board questions + enriched study JSON."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
STUDY_ROOT = Path(r"C:\Knowledge\EDUCATION\CBSE-10-MATH-SCIENCE\Study Material")
PORTAL_DATA = REPO / "portal" / "data"
PORTAL_DATA_101 = Path(r"c:\Users\whizy\source\repos\1o1-web\portal\data")

# filename stem → portal chapterId (must match cbse10-study-material.json)
CHAPTER_ID_BY_FILE: dict[str, str] = {
    "acids-bases-salts": "acids-bases",
    "carbon-compounds": "carbon",
    "chem-reactions": "chem-reactions",
    "control-coordination": "control",
    "electricity": "electricity",
    "heredity": "heredity",
    "human-eye-colourful-world": "human-eye",
    "life-processes": "life",
    "light-reflection-refraction": "light",
    "magnetic-effects-current": "magnetism",
    "metals-non-metals": "metals",
    "organisms-reproduce": "reproduction",
    "sources-energy": "sources-of-energy",
    "applications-trigonometry": "trig-apps",
    "arithmetic-progressions": "ap",
    "areas-circles": "areas-circles",
    "circles": "circles",
    "constructions": "constructions",
    "coordinate-geometry": "coordinate",
    "intro-trigonometry": "trigonometry",
    "linear-equations": "linear-eq",
    "polynomials": "polynomials",
    "probability": "probability",
    "quadratic-equations": "quadratic",
    "real-numbers": "real-numbers",
    "statistics": "statistics",
    "surface-areas-volumes": "surface-volume",
    "triangles": "triangles",
}

QUESTION_RE = re.compile(
    r"### Question #\d+: \[ID: ([^\]]+)\]\s*\n"
    r'- \*\*Question\*\*: "((?:[^"\\]|\\.)*)"\s*\n'
    r"- \*\*Sizing & Weightage\*\*: (\d+) Marks[^|]*\| \*\*Type\*\*: ([^\n]+)",
    re.MULTILINE,
)

THREAD_TITLE_RE = re.compile(r"^#### Thread #\d+: (.+)$", re.MULTILINE)
THREAD_QUERY_RE = re.compile(
    r'💬 \*\*Original Query \(@[^)]+\)\*\*:\s*\n> "([^"]+)"',
    re.MULTILINE,
)


def parse_board_questions(md: str, subject: str, chapter_id: str) -> list[dict]:
    out: list[dict] = []
    for qid, prompt, marks_s, qtype in QUESTION_RE.findall(md):
        marks = int(marks_s)
        qtype_clean = qtype.strip()
        is_mcq = "mcq" in qtype_clean.lower()
        out.append(
            {
                "id": qid,
                "subject": subject,
                "chapterId": chapter_id,
                "prompt": prompt.replace('\\"', '"'),
                "marks": marks,
                "type": qtype_clean,
                "approved": True,
                "source": "voltaic-study-material",
                "options": [] if not is_mcq else [],
            }
        )
    return out


def parse_discussion_threads(md: str, subject: str, chapter_id: str) -> list[dict]:
    titles = THREAD_TITLE_RE.findall(md)
    queries = THREAD_QUERY_RE.findall(md)
    threads: list[dict] = []
    for i, title in enumerate(titles[:50]):
        body = queries[i] if i < len(queries) else ""
        threads.append(
            {
                "id": f"voltaic_{chapter_id}_{i:03d}",
                "title": title.strip(),
                "subject": subject,
                "chapter": chapter_id,
                "preview": body[:500],
                "source": "voltaic-discussion-board",
            }
        )
    return threads


def enrich_study_material(study_path: Path, by_chapter: dict[str, list[dict]], discussions: dict[str, list[dict]]) -> dict:
    if study_path.is_file():
        data = json.loads(study_path.read_text(encoding="utf-8"))
    else:
        data = {"version": 1, "sku": "cbse10", "chapters": {}}

    chapters = data.setdefault("chapters", {})
    for cid, questions in by_chapter.items():
        ch = chapters.setdefault(cid, {"chapterId": cid})
        ch["boardQuestions"] = questions
        ch["boardQuestionCount"] = len(questions)
        ch["sectionsApproved"] = ["B", "C", "D", "E"]
        if cid in discussions:
            ch["discussionThreads"] = discussions[cid]
            ch["discussionThreadCount"] = len(discussions[cid])
    data["board_question_count"] = sum(len(v) for v in by_chapter.values())
    data["sections_b_e_approved"] = True
    data["generated_at"] = datetime.now(timezone.utc).isoformat()
    return data


def main() -> int:
    if not STUDY_ROOT.is_dir():
        print(f"SKIP: Study Material not found at {STUDY_ROOT}")
        return 1

    all_questions: list[dict] = []
    by_chapter: dict[str, list[dict]] = {}
    discussions: dict[str, list[dict]] = {}

    for subject_dir in ("mathematics", "science"):
        subj_path = STUDY_ROOT / subject_dir
        if not subj_path.is_dir():
            continue
        for md_path in sorted(subj_path.glob("*.md")):
            if md_path.name.endswith("-discussion.md"):
                continue
            stem = md_path.stem
            chapter_id = CHAPTER_ID_BY_FILE.get(stem, stem)
            text = md_path.read_text(encoding="utf-8")
            qs = parse_board_questions(text, subject_dir, chapter_id)
            if qs:
                by_chapter[chapter_id] = qs
                all_questions.extend(qs)

            disc_path = subj_path / f"{stem}-discussion.md"
            if disc_path.is_file():
                disc_md = disc_path.read_text(encoding="utf-8")
                threads = parse_discussion_threads(disc_md, subject_dir, chapter_id)
                if threads:
                    discussions[chapter_id] = threads

    board_out = {
        "sku": "cbse10",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRoot": str(STUDY_ROOT),
        "sectionsApproved": ["B", "C", "D", "E"],
        "note": "Approved VOLTAIC board questions from Study Material — use for mock Sections B–E.",
        "questions": all_questions,
        "stats": {
            "total": len(all_questions),
            "by_marks": {},
            "by_subject": {},
        },
    }
    for q in all_questions:
        m = str(q["marks"])
        board_out["stats"]["by_marks"][m] = board_out["stats"]["by_marks"].get(m, 0) + 1
        s = q["subject"]
        board_out["stats"]["by_subject"][s] = board_out["stats"]["by_subject"].get(s, 0) + 1

    study_src = PORTAL_DATA_101 / "cbse10-study-material.json"
    if not study_src.is_file():
        study_src = PORTAL_DATA / "cbse10-study-material.json"
    enriched = enrich_study_material(study_src, by_chapter, discussions)

    ai_path = STUDY_ROOT / "ai-instructions.md"
    if ai_path.is_file():
        enriched["ai_instructions"] = ai_path.read_text(encoding="utf-8")[:8000]

    for out_dir in (PORTAL_DATA, PORTAL_DATA_101):
        out_dir.mkdir(parents=True, exist_ok=True)
        board_path = out_dir / "cbse10-board-questions.json"
        study_path = out_dir / "cbse10-study-material.json"
        board_path.write_text(json.dumps(board_out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        study_path.write_text(json.dumps(enriched, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote {board_path} ({len(all_questions)} approved questions)")
        print(f"Wrote {study_path} (enriched {len(by_chapter)} chapters, {sum(len(v) for v in discussions.values())} discussion threads)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
