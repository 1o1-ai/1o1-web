#!/usr/bin/env python3
"""
Overnight batch: review / rewrite CBSE 10 catalog reference answers with Gemma (via API).

Writes portal/data/cbse10-answer-overrides.json (safe incremental checkpoint).
Resume with the same command after interrupt.

Examples:
  python scripts/review_catalog_answers.py --provider api
  python scripts/review_catalog_answers.py --provider ollama --ollama-model gemma3:4b
  python scripts/review_catalog_answers.py --limit 50 --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "portal" / "data" / "cbse10-master-catalog.json"
OVERRIDES = ROOT / "portal" / "data" / "cbse10-answer-overrides.json"
PROGRESS = ROOT / "portal" / "data" / "cbse10-answer-review-progress.json"
LOG_FILE = ROOT / "portal" / "data" / "cbse10-answer-review.log"

PLACEHOLDER_RE = re.compile(
    r"\[supercop|\[gemini|checked scheme|result validated cleanly|"
    r"we first write down given quantities|invoke standard formulas|"
    r"formula definition\s*&\s*statement verification",
    re.I,
)

AP_NTH_RE = re.compile(
    r"(\d+)(?:st|nd|rd|th)\s+term\s+of\s+the\s+AP\s*:\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)",
    re.I,
)

SYSTEM = """You are a CBSE Class 10 examiner writing model answers for students.
Return ONLY the worked solution: clear steps and final answer.
Rules:
- No mark scheme labels, no "(1 Mark)", no [Supercop] or [Gemini] tags
- No meta commentary about the question
- Use plain English and standard CBSE notation
- For MCQ, state the correct option letter and brief reason if options were given
- Keep under 12 lines unless a proof requires more"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(msg: str) -> None:
    line = f"[{datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def is_placeholder(text: str) -> bool:
    t = (text or "").strip()
    if not t or len(t) < 8:
        return True
    return bool(PLACEHOLDER_RE.search(t))


def derive_ap_nth(prompt: str) -> str | None:
    m = AP_NTH_RE.search(prompt)
    if not m:
        return None
    n, a, second = int(m.group(1)), int(m.group(2)), int(m.group(3))
    d = second - a
    an = a + (n - 1) * d
    return (
        f"Given: a = {a}, common difference d = {second} − {a} = {d}.\n\n"
        f"aₙ = a + (n − 1)d\n"
        f"a{n} = {a} + ({n} − 1)({d}) = {an}\n\n"
        f"The {n}th term is {an}."
    )


def clean_solution(text: str) -> str:
    t = text.strip()
    t = re.sub(r"\[[^\]]{2,120}\]", " ", t)
    t = re.sub(r"\(\s*\d+(?:\.\d+)?\s*Marks?\s*\)", "", t, flags=re.I)
    t = re.sub(r"\b\d+(?:\.\d+)?\s*Marks?\b", "", t, flags=re.I)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def question_prompt(q: dict) -> str:
    text = (q.get("text") or q.get("prompt") or "").strip()
    opts = q.get("options") or []
    if opts:
        letters = "\n".join(f"{chr(65+i)}. {o}" for i, o in enumerate(opts[:6]))
        return f"{text}\n\nOptions:\n{letters}"
    return text


async def ollama_chat(base: str, model: str, messages: list[dict], max_tokens: int = 700) -> str:
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            r = await client.post(
                f"{base.rstrip('/')}/v1/chat/completions",
                json={"model": model, "messages": messages, "stream": False, "max_tokens": max_tokens},
            )
            r.raise_for_status()
            return str(r.json()["choices"][0]["message"]["content"]).strip()
        except httpx.HTTPError:
            r = await client.post(
                f"{base.rstrip('/')}/api/chat",
                json={"model": model, "messages": messages, "stream": False},
            )
            r.raise_for_status()
            return str(r.json()["message"]["content"]).strip()


async def openrouter_chat(key: str, model: str, messages: list[dict], max_tokens: int = 700) -> str:
    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "HTTP-Referer": "https://yogabrata.com",
                "X-Title": "CBSE10 Answer Review",
            },
            json={"model": model, "messages": messages, "max_tokens": max_tokens},
        )
        r.raise_for_status()
        return str(r.json()["choices"][0]["message"]["content"]).strip()


async def api_chat(base: str, prompt: str, q: dict) -> str:
    body = {
        "actor": "student",
        "message": f"Give only the worked solution (no mark scheme tags):\n\n{prompt}",
        "context": {
            "grade": "10",
            "board": "CBSE",
            "study_room": True,
            "subject": "Science" if q.get("subject_slug") == "science" else "Mathematics",
            "chapter": q.get("chapterId") or q.get("chapter") or "",
            "chapter_title": q.get("chapterTitle") or "",
        },
    }
    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(f"{base.rstrip('/')}/actors/chat", json=body)
        r.raise_for_status()
        data = r.json()
        return str(data.get("answer") or data.get("evaluation") or data.get("message") or "").strip()


async def generate_answer(
    provider: str,
    q: dict,
    *,
    api_base: str,
    ollama_url: str,
    ollama_model: str,
    openrouter_key: str,
    openrouter_model: str,
) -> str:
    prompt = question_prompt(q)
    derived = derive_ap_nth(prompt)
    if derived:
        return derived

    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": prompt},
    ]

    if provider == "api":
        raw = await api_chat(api_base, prompt, q)
    elif provider == "openrouter":
        raw = await openrouter_chat(openrouter_key, openrouter_model, messages)
    else:
        raw = await ollama_chat(ollama_url, ollama_model, messages)

    cleaned = clean_solution(raw)
    if is_placeholder(cleaned):
        raise ValueError("model returned placeholder-style answer")
    return cleaned


async def run_batch(args: argparse.Namespace) -> int:
    catalog = load_json(CATALOG, {})
    questions: list[dict] = catalog.get("questions") or []
    if not questions:
        log("No questions in catalog.")
        return 1

    overrides = load_json(OVERRIDES, {"version": 1, "reviewed": {}, "meta": {}})
    reviewed: dict[str, Any] = overrides.setdefault("reviewed", {})
    progress = load_json(
        PROGRESS,
        {"started_at": utc_now(), "processed": 0, "errors": 0, "skipped": 0},
    )

    todo = [q for q in questions if q.get("id") and q["id"] not in reviewed]
    if args.only_placeholders:
        todo = [
            q
            for q in todo
            if is_placeholder((q.get("solutions") or {}).get("answer_01", {}).get("text", ""))
            or is_placeholder((q.get("solutions") or {}).get("alt_answer_02", {}).get("text", ""))
        ]
    if args.limit:
        todo = todo[: args.limit]

    total = len(todo)
    log(f"Starting overnight review — {total} questions via {args.provider}")
    log(f"Overrides: {OVERRIDES}")
    log(f"Already reviewed: {len(reviewed)}")

    start = time.time()
    for i, q in enumerate(todo, 1):
        qid = q["id"]
        try:
            if args.dry_run:
                ans = derive_ap_nth(question_prompt(q)) or "(would call LLM)"
            else:
                ans = await generate_answer(
                    args.provider,
                    q,
                    api_base=args.api_base,
                    ollama_url=args.ollama_url,
                    ollama_model=args.ollama_model,
                    openrouter_key=args.openrouter_key,
                    openrouter_model=args.openrouter_model,
                )

            reviewed[qid] = {
                "text": ans,
                "provider": args.provider,
                "reviewed_at": utc_now(),
                "chapterId": q.get("chapterId"),
                "subject_slug": q.get("subject_slug"),
                "prompt_excerpt": (q.get("text") or "")[:120],
            }
            progress["processed"] = progress.get("processed", 0) + 1
            log(f"[{i}/{total}] OK {qid} · {len(ans)} chars")
        except Exception as exc:
            progress["errors"] = progress.get("errors", 0) + 1
            reviewed[qid] = {
                "error": str(exc)[:300],
                "reviewed_at": utc_now(),
                "status": "failed",
            }
            log(f"[{i}/{total}] FAIL {qid}: {exc}")

        if not args.dry_run and i % args.checkpoint_every == 0:
            overrides["meta"] = {
                "last_updated": utc_now(),
                "provider": args.provider,
                "count": len(reviewed),
            }
            save_json(OVERRIDES, overrides)
            save_json(PROGRESS, progress)
            log(f"Checkpoint saved ({len(reviewed)} total overrides)")

        if args.delay > 0:
            await asyncio.sleep(args.delay)

    overrides["meta"] = {
        "last_updated": utc_now(),
        "provider": args.provider,
        "count": len(reviewed),
        "elapsed_sec": round(time.time() - start),
    }
    if not args.dry_run:
        save_json(OVERRIDES, overrides)
        save_json(PROGRESS, progress)

    if args.merge_catalog and not args.dry_run:
        merged = 0
        for q in questions:
            ov = reviewed.get(q.get("id") or "")
            if not ov or ov.get("error") or not ov.get("text"):
                continue
            sol = q.setdefault("solutions", {})
            sol["answer_01"] = {
                "text": ov["text"],
                "generated-by": f"gemma-review/{args.provider}",
                "validated": True,
                "reviewed_at": ov.get("reviewed_at"),
            }
            merged += 1
        catalog["answer_review_merged_at"] = utc_now()
        save_json(CATALOG, catalog)
        log(f"Merged {merged} answers into master catalog")

    elapsed = round((time.time() - start) / 60, 1)
    log(f"Done in {elapsed} min — {progress.get('processed', 0)} ok, {progress.get('errors', 0)} errors")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Overnight Gemma review of CBSE 10 catalog answers")
    ap.add_argument("--provider", choices=("api", "ollama", "openrouter"), default="api")
    ap.add_argument("--api-base", default=os.environ.get("EDUCATION_API", "https://api.brahmando.com/education"))
    ap.add_argument("--ollama-url", default=os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))
    ap.add_argument("--ollama-model", default=os.environ.get("OLLAMA_MODEL", "gemma3:4b"))
    ap.add_argument("--openrouter-key", default=os.environ.get("OPENROUTER_API_KEY", ""))
    ap.add_argument("--openrouter-model", default=os.environ.get("OPENROUTER_MODEL", "google/gemma-2-9b-it"))
    ap.add_argument("--limit", type=int, default=0, help="Max questions (0 = all remaining)")
    ap.add_argument("--delay", type=float, default=0.3, help="Seconds between API calls")
    ap.add_argument("--checkpoint-every", type=int, default=10)
    ap.add_argument("--only-placeholders", action="store_true", default=True)
    ap.add_argument("--merge-catalog", action="store_true", help="Write reviewed text into master catalog at end")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.provider == "openrouter" and not args.openrouter_key:
        log("OPENROUTER_API_KEY required for openrouter provider")
        return 1

    return asyncio.run(run_batch(args))


if __name__ == "__main__":
    sys.exit(main())
