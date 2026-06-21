#!/usr/bin/env python3
"""Validate academy bot roster and presence constraints."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOTS = ROOT / "portal" / "data" / "academy-bots.json"


def main() -> int:
    failed = 0
    if not BOTS.is_file():
        print(f"FAIL missing {BOTS}")
        return 1

    data = json.loads(BOTS.read_text(encoding="utf-8"))
    teachers = data.get("teachers") or []
    students = data.get("students") or []

    if len(students) != 165:
        print(f"FAIL expected 165 students, got {len(students)}")
        failed += 1
    else:
        print("OK   165 student bots")

    if len(teachers) < 8:
        print(f"FAIL expected at least 8 teachers, got {len(teachers)}")
        failed += 1
    else:
        print(f"OK   {len(teachers)} teacher bots")

    sujoy = next((t for t in teachers if t.get("name") == "Sujoy Das"), None)
    if not sujoy:
        print("FAIL Sujoy Das teacher not found")
        failed += 1
    elif "Don Bosco Liluah" not in sujoy.get("school", ""):
        print("FAIL Sujoy Das school mismatch")
        failed += 1
    elif sujoy.get("subject") != "mathematics":
        print("FAIL Sujoy Das should teach mathematics")
        failed += 1
    else:
        print("OK   Sujoy Das · Don Bosco Liluah · mathematics")

    for group, label in ((teachers, "teacher"), (students, "student")):
        for p in group:
            if not p.get("photo"):
                print(f"FAIL {label} {p.get('id')} missing photo")
                failed += 1
            if not p.get("location"):
                print(f"FAIL {label} {p.get('name')} missing location")
                failed += 1
            if p.get("isBot") is not True:
                print(f"FAIL {label} {p.get('name')} isBot not true")
                failed += 1

    math_t = sum(1 for t in teachers if t.get("subject") == "mathematics")
    sci_t = sum(1 for t in teachers if t.get("subject") == "science")
    if math_t < 3 or sci_t < 3:
        print(f"FAIL teacher subject mix: math={math_t} science={sci_t}")
        failed += 1
    else:
        print(f"OK   teachers math={math_t} science={sci_t}")

    # Static assets exist
    for rel in (
        "portal/assets/presence.js",
        "portal/assets/bots.js",
        "portal/education/admin.html",
        "portal/education/admin.js",
    ):
        p = ROOT / rel
        if not p.is_file():
            print(f"FAIL missing {rel}")
            failed += 1
        else:
            print(f"OK   {rel}")

    room = (ROOT / "portal/education/cbse10/room.html").read_text(encoding="utf-8")
    for token in ("peersOuterPanel", "presence.js", "bots.js"):
        if token not in room:
            print(f"FAIL room.html missing {token}")
            failed += 1
    if failed == 0:
        print("OK   room.html wired for peers panel")

    admin_js = (ROOT / "portal/education/admin.js").read_text(encoding="utf-8")
    if "yogabrata" not in admin_js or "aam" not in admin_js:
        print("FAIL admin credentials not in admin.js")
        failed += 1
    else:
        print("OK   admin login yogabrata/aam")

    print(f"\n{'All bot checks passed' if failed == 0 else f'{failed} check(s) failed'}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
