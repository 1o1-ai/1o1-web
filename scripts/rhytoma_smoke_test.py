#!/usr/bin/env python3
"""Smoke tests for Rhytoma Academy (yogabrata.com + api.brahmando.com)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

API = "https://api.brahmando.com/wb-academy"
SITE = "https://yogabrata.com"

CHECKS: list[tuple[str, str, int | None]] = [
    ("API health", f"{API}/health", 200),
    ("API root", f"{API}/", 200),
    ("Practice config", f"{API}/practice/config", 200),
    ("Practice widget", f"{API}/widget/practice-test.html", 200),
    ("Training lab", f"{API}/training-lab", 200),
    ("Knowledge taxonomy", f"{API}/knowledge/taxonomy", 200),
    ("Site landing", f"{SITE}/", 200),
    ("Rhytoma page", f"{SITE}/rhytoma/", 200),
    ("UAP page", f"{SITE}/uap/", 200),
    ("UAP manifest", f"{SITE}/assets/uap/manifest.json", 200),
]


def get(url: str, method: str = "GET", body: dict | None = None) -> tuple[int, str]:
    data = None
    headers = {"User-Agent": "Mozilla/5.0 (RhytomaSmokeTest/1.0)"}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read(500).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read(200).decode("utf-8", errors="replace")


def main() -> int:
    failed = 0
    print("Rhytoma smoke tests\n" + "=" * 40)
    for name, url, expect in CHECKS:
        code, _ = get(url)
        ok = expect is None or code == expect
        mark = "OK" if ok else "FAIL"
        print(f"  [{mark}] {name}: {code} {url}")
        if not ok:
            failed += 1

    code, raw = get(
        f"{API}/actors/chat",
        method="POST",
        body={
            "actor": "student",
            "message": "WBBSE class 10 science — one line on photosynthesis",
            "context": {"grade": "10", "board": "WBBSE", "language_medium": "English"},
        },
    )
    chat_ok = code == 200 and "answer" in raw
    print(f"  [{'OK' if chat_ok else 'FAIL'}] Actor chat: {code}")
    if not chat_ok:
        failed += 1
        print(f"       {raw[:200]}")

    code, _ = get(f"{API}/health")
    health = json.loads(_) if code == 200 else {}
    print(f"\n  Service: {health.get('service', '?')}  collection: {health.get('collection', '?')}")
    print(f"\n{'All passed' if failed == 0 else f'{failed} failed'}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
