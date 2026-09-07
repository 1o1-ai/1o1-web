# Author: Yogabrata Mukhopadhyay
# Organization: Brahmexa
# Copyright (c) 2026 Brahmexa. All rights reserved.
"""Validate JSI preview files, JSON, and route shells."""

from __future__ import annotations

import json
from pathlib import Path

YM_ROOT = Path(__file__).resolve().parents[1]
YM_FAIL = 0


def ym_ok(ym_msg: str) -> None:
    print("OK  ", ym_msg)


def ym_bad(ym_msg: str) -> None:
    global YM_FAIL
    YM_FAIL += 1
    print("FAIL", ym_msg)


def ym_need(ym_rel: str) -> Path:
    ym_path = YM_ROOT / ym_rel
    if not ym_path.is_file() or ym_path.stat().st_size < 32:
        ym_bad("missing or tiny: " + ym_rel)
    else:
        ym_ok(ym_rel + f" ({ym_path.stat().st_size} bytes)")
    return ym_path


def main() -> int:
    for ym_rel in (
        "index.html",
        "css/jsi.css",
        "js/ym_app.js",
        "js/ym_architecture.js",
        "js/ym_scenarios.js",
        "assets/yoga-mukhopadhyay.jpg",
        "assets/jsi-logo.webp",
        "assets/swan-hero.webp",
        "infrastructure/index.html",
        "local-llm/index.html",
        "knowledge/index.html",
        "workflows/index.html",
        "swan/index.html",
        "operations/index.html",
        "see-ai-at-work/index.html",
    ):
        ym_need(ym_rel)

    ym_home = (YM_ROOT / "index.html").read_text(encoding="utf-8")
    for ym_token in (
        "noindex",
        "yoga-mukhopadhyay.jpg",
        "mailto:hello@jsisoftwaresolutions.com",
        "Interactive demo",
        "ym-scenarios",
        "Brahmexa LLC",
        "KAIORB",
        "KAI247",
        "jsi-watermark",
        "jsi-brand-mark",
        "pk_jsi_site",
        "ym-arch-stack",
    ):
        if ym_token in ym_home:
            ym_ok("home contains " + ym_token)
        else:
            ym_bad("home missing " + ym_token)

    for ym_forbidden in ("jsi-constellation", "orb orb-cyan", "jsi-arch-orbit"):
        if ym_forbidden in ym_home:
            ym_bad("home still has circular markup: " + ym_forbidden)
        else:
            ym_ok("home dropped " + ym_forbidden)

    for ym_name in ("site.json", "solutions.json", "scenarios.json", "architecture.json", "leadership.json", "offerings.json"):
        ym_path = YM_ROOT / "data" / ym_name
        try:
            ym_obj = json.loads(ym_path.read_text(encoding="utf-8"))
            ym_ok("json " + ym_name)
        except Exception as ym_exc:  # noqa: BLE001
            ym_bad("json " + ym_name + " " + str(ym_exc))
            continue
        if ym_name == "solutions.json" and len(ym_obj.get("items") or []) != 6:
            ym_bad("expected 6 solutions")
        if ym_name == "scenarios.json" and len(ym_obj.get("items") or []) != 3:
            ym_bad("expected 3 scenarios")
        if ym_name == "leadership.json":
            if "Yoga" not in (ym_obj.get("biography") or "") and "Yoga" not in (ym_obj.get("shortName") or ""):
                ym_bad("leadership missing Yoga")
            if not (YM_ROOT / "assets" / "yoga-mukhopadhyay.jpg").is_file():
                ym_bad("CEO portrait file missing")

    ym_parent = (YM_ROOT.parent / "index.html").read_text(encoding="utf-8")
    if 'href="/jsi/"' in ym_parent and "In Flight" in ym_parent:
        ym_ok("yogabrata home circle points at /jsi/ with In Flight")
    else:
        ym_bad("yogabrata home missing JSI circle")

    print("FAIL count", YM_FAIL)
    return 1 if YM_FAIL else 0


if __name__ == "__main__":
    raise SystemExit(main())
