"""Smoke-test yogabrata SaaS portal flows."""
from __future__ import annotations

import sys
from curl_cffi import requests as cr

BASE = "http://127.0.0.1:8765"
CHECKS: list[tuple[str, str, list[str]]] = [
    ("/", "Homepage", ["ManjuLAB Online Portal", "Anyo Brahmando Academy"]),
    ("/portal/", "SaaS hub", ["Anyo Brahmando Academy", "different path"]),
    ("/portal/education/", "Academy", ["Anyo Brahmando Academy", "different path"]),
    ("/portal/education/cbse10/index.html", "CBSE10 hub", ["Study Room", "Exam Center", "Discussion Forum"]),
    ("/portal/education/cbse10/room.html", "Study room", ["phaseSubject", "cbse10-room.js", "backFromEvaluate", "evalResults"]),
    ("/portal/education/cbse10/practice.html", "Practice", ["Chapter practice", "board mock"]),
    ("/portal/education/cbse10/forum.html", "Forum", ["Sahadeva", "Discussion Forum", "forum-main"]),
    ("/portal/data/cbse10-forum.json", "Forum data", ['"sahadeva"', '"threads"']),
    ("/portal/education/admin.html", "Admin", ["Presence admin", "admin.js"]),
    ("/portal/data/academy-bots.json", "Bot roster", ["Sujoy Das", "Don Bosco Liluah"]),
    ("/portal/education/cbse10/progress.html", "Progress", ["My Progress"]),
    ("/portal/education/cbse10/report.html", "Report", ["Guardian"]),
    ("/portal/data/cbse10-curriculum.json", "Curriculum JSON", ['"sku": "cbse10-core"']),
]

def main() -> int:
    session = cr.Session(impersonate="chrome120")
    failed = 0
    for path, name, needles in CHECKS:
        url = BASE + path
        try:
            r = session.get(url, timeout=15)
            ok = r.status_code == 200
            for n in needles:
                if n not in r.text:
                    ok = False
                    print(f"FAIL {name}: missing '{n}'")
            if ok:
                print(f"OK   {name} ({path})")
            else:
                if r.status_code != 200:
                    print(f"FAIL {name}: HTTP {r.status_code}")
                failed += 1
        except Exception as exc:
            print(f"FAIL {name}: {exc}")
            failed += 1

    js = session.get(BASE + "/portal/assets/portal.js", timeout=15).text
    for token in ["Anyo Brahmando Academy", "no demo login gate"]:
        if token not in js:
            print(f"FAIL portal.js: missing {token}")
            failed += 1
        else:
            print(f"OK   portal.js contains {token}")
    for token in ["DEMO_USER = 'yoga'", "DEMO_PASS = 'yoga'"]:
        if token in js:
            print(f"FAIL portal.js: demo login still present ({token})")
            failed += 1

    print(f"\n{'All checks passed' if failed == 0 else f'{failed} check(s) failed'}")
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
