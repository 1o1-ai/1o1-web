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
        "css/home.css",
        "js/ym_app.js",
        "js/ym_architecture.js",
        "js/ym_scenarios.js",
        "assets/yoga-mukhopadhyay.jpg",
        "assets/jsi-logo.webp",
        "assets/swan-hero.webp",
        "assets/rampur-cutaway.webp",
        "assets/rampur-cutaway-1280.webp",
        "assets/rampur-cutaway-800.webp",
        "assets/rampur-cutaway-mobile.webp",
        "assets/rampur-cutaway-mobile-720.webp",
        "assets/rampur-cutaway-og.jpg",
        "assets/swan-reel-cbse.webp",
        "assets/swan-reel-abhyas.webp",
        "assets/swan-reel-quadratic.webp",
        "assets/swan-reel-quiz.webp",
        "infrastructure/index.html",
        "local-llm/index.html",
        "knowledge/index.html",
        "workflows/index.html",
        "swan/index.html",
        "operations/index.html",
        "see-ai-at-work/index.html",
        "offerings/index.html",
        "architecture/index.html",
        "nexus/index.html",
        "contact/index.html",
        "business/index.html",
        "websites/index.html",
        "seo/index.html",
        "marketing/index.html",
    ):
        ym_need(ym_rel)

    ym_home = (YM_ROOT / "index.html").read_text(encoding="utf-8")
    for ym_token in (
        "noindex",
        "mailto:hello@jsisoftwaresolutions.com",
        "Brahmexa LLC",
        "KAIORB",
        "KAI247",
        "jsi-brand-mark",
        "At your doorstep",
        "Explore Solutions",
        "75 kW",
        "id=\"offerings\"",
        "css/home.css",
        "Five connected systems",
        "Conceptual infrastructure illustration",
        "Mentha cooling",
        "Software Solutions entrance board",
        "Vector databases as software",
        "AI Compute",
        "Connected &amp; Secure",
        "Data &amp; Recovery",
        "Protected Power",
        "Engineered Cooling",
        "Future option",
        "Planned / subject to design",
        "Business AI",
        "Digital Growth",
        "Smart Classrooms",
        "Let’s talk",
        "/jsi/business/",
        "/jsi/websites/",
        "/jsi/seo/",
        "/jsi/marketing/",
        "/jsi/swan/",
        "/jsi/workflows/",
        "100+",
        "500+",
        "Thousands",
    ):
        if ym_token in ym_home:
            ym_ok("home contains " + ym_token)
        else:
            ym_bad("home missing " + ym_token)

    for ym_blocked in ("id=\"cosmos\"", "cosmic.js", "theme-picker.js", "nexus/widget.js", "jsi-watermark"):
        if ym_blocked in ym_home:
            ym_bad("home still loads blocking extra: " + ym_blocked)
        else:
            ym_ok("home omitted " + ym_blocked)

    # Check dedicated inner pages contain required components
    ym_contact = (YM_ROOT / "contact/index.html").read_text(encoding="utf-8")
    if "yoga-mukhopadhyay.jpg" in ym_contact or "jsi-leader" in ym_contact:
        ym_bad("contact still has CEO introduction")
    else:
        ym_ok("contact has no CEO introduction")

    ym_demo = (YM_ROOT / "see-ai-at-work/index.html").read_text(encoding="utf-8")
    if "Interactive demo" in ym_demo and "ym-scenarios" in ym_demo:
        ym_ok("demo contains Interactive demo and ym-scenarios")
    else:
        ym_bad("demo missing interactive demo elements")

    ym_nexus = (YM_ROOT / "nexus/index.html").read_text(encoding="utf-8")
    if "pk_jsi_site" in ym_nexus:
        ym_ok("nexus contains pk_jsi_site")
    else:
        ym_bad("nexus missing pk_jsi_site")

    ym_arch = (YM_ROOT / "architecture/index.html").read_text(encoding="utf-8")
    if "ym-arch-stack" in ym_arch:
        ym_ok("architecture contains ym-arch-stack")
    else:
        ym_bad("architecture missing ym-arch-stack")

    ym_swan = (YM_ROOT / "swan/index.html").read_text(encoding="utf-8")
    for ym_token in (
        "ym-swan-reel",
        "CBSE mock test",
        "Abhyas Learning module",
        "Quadratic equations",
        "pk_jsi_site",
    ):
        if ym_token in ym_swan:
            ym_ok("swan contains " + ym_token)
        else:
            ym_bad("swan missing " + ym_token)

    for ym_forbidden in ("jsi-constellation", "orb orb-cyan", "jsi-arch-orbit"):
        if ym_forbidden in ym_home:
            ym_bad("home still has circular markup: " + ym_forbidden)
        else:
            ym_ok("home dropped " + ym_forbidden)

    for ym_name in ("site.json", "solutions.json", "scenarios.json", "architecture.json", "leadership.json", "offerings.json", "metrics.json"):
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
        if ym_name == "metrics.json":
            ym_items = ym_obj.get("items") or []
            if len(ym_items) != 4:
                ym_bad("expected 4 metrics")
            ym_values = {str(ym_row.get("value")) for ym_row in ym_items}
            for ym_need_val in ("100+", "75 kW", "500+", "Thousands"):
                if ym_need_val not in ym_values:
                    ym_bad("metrics missing " + ym_need_val)
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
