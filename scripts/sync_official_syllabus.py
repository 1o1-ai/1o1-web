#!/usr/bin/env python3
"""Apply official syllabus.txt chapter list to portal curriculum + question bank."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURR_PATH = ROOT / "portal" / "data" / "cbse10-curriculum.json"
BANK_PATH = ROOT / "portal" / "data" / "cbse10-verified-questions.json"
SYLLABUS_PATH = Path(r"C:\Knowledge\EDUCATION\CBSE-10-MATH-SCIENCE\syllabus.txt")

# Keep in sync with Brahmando modules/cbse10/chapters.py
SCIENCE_CHAPTERS = [
    ("chem-reactions", "Chemical Reactions and Equations", ["chemical reaction", "balanced equation", "displacement", "double displacement"]),
    ("acids-bases", "Acids, Bases and Salts", ["acid", "base", "salt", "ph scale"]),
    ("metals", "Metals and Non-Metals", ["metal", "non-metal", "reactivity series", "ionic compound"]),
    ("carbon", "Carbon and Its Compounds", ["carbon compound", "covalent", "hydrocarbon", "ethanol"]),
    ("life", "Life Processes", ["life process", "nutrition", "photosynthesis", "respiration"]),
    ("control", "Control and Coordination", ["control and coordination", "nervous system", "reflex", "hormone"]),
    ("reproduction", "How Do Organisms Reproduce?", ["reproduction", "asexual", "sexual reproduction", "family planning"]),
    ("heredity", "Heredity", ["heredity", "mendel", "gene", "chromosome"]),
    ("light", "Light – Reflection and Refraction", ["reflection", "refraction", "mirror", "lens"]),
    ("human-eye", "The Human Eye and the Colourful World", ["human eye", "colourful world", "myopia", "dispersion"]),
    ("electricity", "Electricity", ["electric current", "ohm's law", "resistance", "resistivity"]),
    ("magnetism", "Magnetic Effects of Electric Current", ["magnetic field", "electromagnet", "fleming", "solenoid"]),
    ("sources-of-energy", "Sources of Energy", ["source of energy", "solar energy", "wind energy", "fossil fuel"]),
]

MATH_CHAPTERS = [
    ("real-numbers", "Real Numbers", ["real number", "irrational", "fundamental theorem", "hcf"]),
    ("polynomials", "Polynomials", ["polynomial", "zeroes of", "zeros of", "quadratic polynomial"]),
    ("linear-eq", "Pair of Linear Equations in Two Variables", ["linear equation", "pair of linear", "two variables", "consistent"]),
    ("quadratic", "Quadratic Equations", ["quadratic equation", "discriminant", "quadratic formula"]),
    ("ap", "Arithmetic Progressions", ["arithmetic progression", "common difference", "nth term", "sum of n terms"]),
    ("triangles", "Triangles", ["triangle", "similar", "congruence", "pythagoras"]),
    ("coordinate", "Coordinate Geometry", ["coordinate", "distance formula", "section formula", "area of triangle"]),
    ("trigonometry", "Introduction to Trigonometry", ["trigonometric", "sin", "cos", "tan"]),
    ("trig-apps", "Some Applications of Trigonometry", ["angle of elevation", "angle of depression", "height and distance"]),
    ("circles", "Circles", ["circle", "tangent", "chord", "arc"]),
    ("constructions", "Constructions", ["construction", "construct a triangle", "divide a line segment", "draw tangents"]),
    ("areas-circles", "Areas Related to Circles", ["area of sector", "area of segment", "perimeter of sector"]),
    ("surface-volume", "Surface Areas and Volumes", ["surface area", "volume", "frustum", "hemisphere"]),
    ("statistics", "Statistics", ["mean", "median", "mode", "frequency"]),
    ("probability", "Probability", ["probability", "random experiment", "elementary event", "complementary"]),
]

SCIENCE_DISCIPLINE = {
    "light": "physics",
    "human-eye": "physics",
    "electricity": "physics",
    "magnetism": "physics",
    "sources-of-energy": "physics",
    "chem-reactions": "chemistry",
    "acids-bases": "chemistry",
    "metals": "chemistry",
    "carbon": "chemistry",
}

LEGACY_ALIASES = {"environment": "sources-of-energy"}


def discipline(ch_id: str, subject: str) -> str:
    if subject == "mathematics":
        return "miscellaneous"
    return SCIENCE_DISCIPLINE.get(ch_id, "biology")


def build_subjects():
    return {
        "science": {
            "code": "086",
            "chapters": [
                {
                    "id": cid,
                    "title": title,
                    "keywords": kws,
                    "discipline": discipline(cid, "science"),
                    "syllabus_order": i + 1,
                }
                for i, (cid, title, kws) in enumerate(SCIENCE_CHAPTERS)
            ],
        },
        "mathematics": {
            "code": "041",
            "chapters": [
                {
                    "id": cid,
                    "title": title,
                    "keywords": kws,
                    "discipline": "miscellaneous",
                    "syllabus_order": i + 1,
                }
                for i, (cid, title, kws) in enumerate(MATH_CHAPTERS)
            ],
        },
    }


def normalize_chapter(ch: str) -> str:
    c = (ch or "").strip().lower()
    return LEGACY_ALIASES.get(c, c)


def sync_curriculum() -> None:
    data = json.loads(CURR_PATH.read_text(encoding="utf-8"))
    data["subjects"] = build_subjects()
    data["syllabus_source"] = str(SYLLABUS_PATH)
    data["syllabus_official"] = True
    if SYLLABUS_PATH.is_file():
        data["syllabus_sha_note"] = f"Synced from {SYLLABUS_PATH.name}"
    # Remap embedded verifiedQuestions chapter tags if present
    for q in data.get("verifiedQuestions", []):
        if q.get("chapter"):
            q["chapter"] = normalize_chapter(q["chapter"])
    CURR_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {CURR_PATH}")


def sync_bank() -> int:
    if not BANK_PATH.is_file():
        return 0
    data = json.loads(BANK_PATH.read_text(encoding="utf-8"))
    n = 0
    for q in data.get("questions", []):
        old = q.get("chapter", "")
        new = normalize_chapter(old)
        if new != old:
            q["chapter"] = new
            n += 1
    BANK_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Remapped {n} question chapter tag(s) in {BANK_PATH}")
    return n


def main() -> int:
    if not SYLLABUS_PATH.is_file():
        print(f"Warning: syllabus not found at {SYLLABUS_PATH}", file=sys.stderr)
    sync_curriculum()
    sync_bank()
    print(f"Science chapters: {len(SCIENCE_CHAPTERS)}, Mathematics chapters: {len(MATH_CHAPTERS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
