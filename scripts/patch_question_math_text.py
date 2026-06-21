#!/usr/bin/env python3
"""Patch verified question JSON — restore missing minus signs in known PDF garble."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / "portal" / "data" / "cbse10-verified-questions.json",
    ROOT / "portal" / "data" / "cbse10-curriculum.json",
]

LINEAR_FIX = (
    "If x = 1 and y = 2 is a solution of the pair of linear equations "
    "2x − 3y + a = 0 and 2x + 3y − b = 0, then :"
)
LINEAR_OLD = re.compile(
    r"If x = 1 and y = 2 is a solution of the pair of linear equations "
    r"2x 3y \+ a = 0 and 2x \+ 3y b = 0, then :",
    re.I,
)


def fix_prompt(text: str) -> str:
    if LINEAR_OLD.search(text):
        return LINEAR_FIX
    t = text
    t = re.sub(
        r"2x\s+3y\s+\+\s*a\s*=\s*0\s+and\s+2x\s*\+\s*3y\s+b\s*=\s*0",
        "2x − 3y + a = 0 and 2x + 3y − b = 0",
        t,
        flags=re.I,
    )
    return t


def patch_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    qs = data.get("questions") or data.get("verifiedQuestions") or []
    for q in qs:
        prompt = q.get("prompt") or q.get("question") or ""
        fixed = fix_prompt(prompt)
        if fixed != prompt:
            if "prompt" in q:
                q["prompt"] = fixed
            if "question" in q:
                q["question"] = fixed
            n += 1
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return n


def main() -> None:
    for f in FILES:
        if f.is_file():
            print(f"Patched {patch_file(f)} prompts in {f.name}")


if __name__ == "__main__":
    main()
