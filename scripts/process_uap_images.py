#!/usr/bin/env python3
"""Resize UAP source images for GitHub Pages (from C:\\1o1\\images)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageOps

SRC = Path(r"C:\1o1\images")
OUT = Path(__file__).resolve().parent.parent / "assets" / "uap"

GALLERY_MAX = 1280
GALLERY_QUALITY = 82
THUMB_MAX = 420
HERO_MAX = 960
TEAM_MAX = 640
ROSTER_MAX = 480


def safe_name(path: Path, idx: int) -> str:
    stem = re.sub(r"[^a-zA-Z0-9]+", "-", path.stem.lower()).strip("-")[:40]
    return f"{idx:02d}-{stem or 'photo'}"


def save_webp(img: Image.Image, dest: Path, quality: int = GALLERY_QUALITY) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=quality, method=6)


def fit_max(img: Image.Image, max_side: int) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) <= max_side:
        return img
    if w >= h:
        nw = max_side
        nh = int(h * max_side / w)
    else:
        nh = max_side
        nw = int(w * max_side / h)
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def main() -> None:
    files = sorted(
        [p for p in SRC.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")],
        key=lambda p: (p.suffix.lower() != ".jpeg", p.name),
    )
    if not files:
        raise SystemExit(f"No images in {SRC}")

    manifest: dict = {"gallery": [], "hero": [], "team": [], "featured": []}

    whatsapp = [p for p in files if "whatsapp" in p.name.lower()]
    large = [p for p in files if p not in whatsapp]

    # Team / reunion portraits (WhatsApp set)
    for i, path in enumerate(whatsapp, start=1):
        with Image.open(path) as im:
            img = fit_max(im, TEAM_MAX)
            base = f"team-{i:02d}"
            save_webp(img, OUT / "team" / f"{base}.webp")
            manifest["team"].append({"id": base, "src": f"team/{base}.webp", "source": path.name})

    # Pick hero from first 6 large + 2 team
    hero_candidates = large[:8] if len(large) >= 8 else large
    for i, path in enumerate(hero_candidates[:6], start=1):
        with Image.open(path) as im:
            img = fit_max(im, HERO_MAX)
            base = f"hero-{i:02d}"
            save_webp(img, OUT / "hero" / f"{base}.webp", quality=78)
            manifest["hero"].append({"id": base, "src": f"hero/{base}.webp", "source": path.name})

    # Full gallery
    for i, path in enumerate(large, start=1):
        with Image.open(path) as im:
            img = fit_max(im, GALLERY_MAX)
            base = safe_name(path, i)
            gal = OUT / "gallery" / f"{base}.webp"
            thumb = OUT / "gallery" / "thumbs" / f"{base}.webp"
            save_webp(img, gal)
            save_webp(fit_max(img, THUMB_MAX), thumb, quality=76)
            entry = {
                "id": base,
                "src": f"gallery/{base}.webp",
                "thumb": f"gallery/thumbs/{base}.webp",
                "source": path.name,
            }
            manifest["gallery"].append(entry)
            if i <= 3:
                manifest["featured"].append(entry)

    # Roster fallbacks: cycle team photos for slots without dedicated portraits
    roster = []
    team_files = sorted((OUT / "team").glob("*.webp"))
    for slot in range(1, 28):
        if slot <= len(team_files):
            roster.append({"slot": slot, "src": f"team/team-{slot:02d}.webp"})
        elif team_files:
            roster.append({"slot": slot, "src": f"team/team-{((slot - 1) % len(team_files)) + 1:02d}.webp"})
    manifest["rosterFallback"] = roster

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
    print(f"Processed {len(files)} sources -> {OUT}")
    print(f"  gallery: {len(manifest['gallery'])}, hero: {len(manifest['hero'])}, team: {len(manifest['team'])}")
    print(f"  total output: {total / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
