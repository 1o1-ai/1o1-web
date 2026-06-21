#!/usr/bin/env python3
"""
Background forum enrichment daemon for CBSE10.
Appends new discussion threads daily (default 80) using academy bot actors.

Usage:
  python scripts/forum_daemon.py --once --count 80
  python scripts/forum_daemon.py --daemon --daily-count 80 --days 10

Schedule via cron / Task Scheduler. Uses generate_forum_threads.build_threads internally.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from generate_forum_threads import OUT_PATH, build_threads  # noqa: E402


def load_forum(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {
        "version": 1,
        "sku": "cbse10-core",
        "assistant": {"id": "sahadeva", "name": "Sahadeva", "brand": "ManjuLAB Study Assistant"},
        "threads": [],
        "meta": {"thread_count": 0, "subjects": ["science", "mathematics"]},
    }


def append_threads(path: Path, count: int, seed: int, use_web: bool) -> int:
    data = load_forum(path)
    existing_ids = {t["id"] for t in data.get("threads", [])}
    new_threads = build_threads(count, seed=seed, use_web=use_web)
    added = 0
    for t in new_threads:
        if t["id"] in existing_ids:
            t["id"] = f"{t['id']}_d{seed}"
        data["threads"].append(t)
        existing_ids.add(t["id"])
        added += 1
    data["generated_at"] = datetime.now(timezone.utc).isoformat()
    data["meta"] = data.get("meta", {})
    data["meta"]["thread_count"] = len(data["threads"])
    data["meta"]["last_daemon_run"] = data["generated_at"]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return added


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=OUT_PATH)
    ap.add_argument("--count", type=int, default=80, help="Threads to add this run")
    ap.add_argument("--daily-count", type=int, default=80)
    ap.add_argument("--days", type=int, default=10)
    ap.add_argument("--seed-base", type=int, default=1000)
    ap.add_argument("--web", action="store_true")
    ap.add_argument("--once", action="store_true", help="Single batch then exit")
    ap.add_argument("--daemon", action="store_true", help="Sleep 24h between batches")
    args = ap.parse_args()

    if args.once or not args.daemon:
        n = append_threads(args.out, args.count, args.seed_base, args.web)
        print(f"Added {n} threads (total in file: {load_forum(args.out)['meta']['thread_count']})")
        return

    for day in range(args.days):
        seed = args.seed_base + day
        n = append_threads(args.out, args.daily_count, seed, args.web)
        print(f"Day {day + 1}/{args.days}: added {n} threads")
        if day < args.days - 1:
            time.sleep(86400)


if __name__ == "__main__":
    main()
