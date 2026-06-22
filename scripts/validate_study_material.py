#!/usr/bin/env python3
"""Validate CBSE 10 VOLTAIC study material — heuristics + local Gemma + OpenRouter."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

BRAHMANDO_EP = Path(r"C:\Users\whizy\AppData\Local\Temp\Brahmando\services\education-portal")
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BRAHMANDO_EP))

from modules.cbse10.study_material_ingest import StudyMaterialIngestor, youtube_is_embeddable  # noqa: E402

DEFAULT_SOURCE = Path(r"C:\Knowledge\EDUCATION\CBSE-10-MATH-SCIENCE\Study Material")
DEFAULT_PORTAL = ROOT / "portal" / "data"
DEFAULT_REPORT = DEFAULT_PORTAL / "cbse10-study-material-validation-report.json"

YOUTUBE_ID_RE = re.compile(r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube-nocookie\.com/embed/)([a-zA-Z0-9_-]+)")

HINGLISH_PATTERNS = [
    (re.compile(r"\bBaccho\b", re.I), "Hinglish greeting 'Baccho'"),
    (re.compile(r"\bAlakh\s+sir\b", re.I), "Hinglish presenter reference"),
    (re.compile(r"\bArre\b|\bBhai\b|\bYaar\b", re.I), "Informal Hinglish filler"),
]

LLM_SYSTEM = """You are a CBSE Class 10 curriculum QA reviewer.
Return ONLY valid JSON (no markdown fences):
{
  "overall_score": 0-100,
  "correctness": "pass|warn|fail",
  "sanity": "pass|warn|fail",
  "references": "pass|warn|fail",
  "issues": ["short bullet"],
  "reference_notes": ["YouTube / link observations"],
  "recommendations": ["actionable next step"]
}
Score against: chapter title, NCERT CBSE Class 10 syllabus, English study-room tone.
Flag: wrong-subject content, placeholder IDs, biology in chemistry, invalid references, AI junk."""

PLACEHOLDER_IDS = re.compile(r"^[a-zA-Z_]+10$|^[A-Za-z]+-\d+$")


@dataclass
class HeuristicFinding:
    severity: str  # error | warn | info
    code: str
    message: str
    chapter_id: str = ""
    field: str = ""


@dataclass
class ChapterValidation:
    chapter_id: str
    title: str
    subject: str
    source_file: str
    heuristic_findings: list[HeuristicFinding] = field(default_factory=list)
    local_gemma: dict[str, Any] | None = None
    openrouter: dict[str, Any] | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _extract_youtube_ids(ch: dict) -> list[str]:
    ids: list[str] = []
    for v in ch.get("videos") or []:
        if v.get("youtubeId"):
            ids.append(v["youtubeId"])
        elif v.get("url"):
            m = YOUTUBE_ID_RE.search(v["url"])
            if m:
                ids.append(m.group(1))
    for link in ch.get("links") or []:
        m = YOUTUBE_ID_RE.search(link.get("url") or "")
        if m:
            ids.append(m.group(1))
    return ids


async def check_youtube_oembed(client: httpx.AsyncClient, video_id: str) -> tuple[bool, str]:
    if not youtube_is_embeddable(video_id):
        return False, "placeholder or invalid format"
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    try:
        r = await client.get(url, timeout=15.0)
        if r.status_code == 200:
            title = r.json().get("title", "")
            return True, title
        return False, f"oEmbed HTTP {r.status_code}"
    except httpx.HTTPError as exc:
        return False, str(exc)


def scan_text_issues(chapter_id: str, text: str, field: str) -> list[HeuristicFinding]:
    out: list[HeuristicFinding] = []
    if not text:
        return out
    if "undefined" in text.lower():
        out.append(
            HeuristicFinding("warn", "undefined_token", "Contains 'undefined' placeholder text", chapter_id, field)
        )
    for pat, label in HINGLISH_PATTERNS:
        if pat.search(text):
            out.append(HeuristicFinding("warn", "hinglish", label, chapter_id, field))
    return out


async def run_heuristics(chapters: dict[str, dict]) -> dict[str, ChapterValidation]:
    results: dict[str, ChapterValidation] = {}
    id_to_chapters: dict[str, list[str]] = {}

    async with httpx.AsyncClient() as client:
        for ch_id, ch in sorted(chapters.items()):
            cv = ChapterValidation(
                chapter_id=ch_id,
                title=ch.get("title") or ch_id,
                subject=ch.get("subject") or "",
                source_file=ch.get("sourceFile") or "",
            )

            if not ch.get("syllabusOutline"):
                cv.heuristic_findings.append(
                    HeuristicFinding("warn", "empty_syllabus", "No syllabus outline bullets", ch_id)
                )

            blob_parts = [
                ch.get("studySummary") or "",
                " ".join(ch.get("scholarTips") or []),
                " ".join(t.get("text", "") for v in ch.get("videos") or [] for t in v.get("transcripts") or []),
            ]
            for part, fname in zip(blob_parts, ["studySummary", "scholarTips", "transcripts"]):
                cv.heuristic_findings.extend(scan_text_issues(ch_id, part, fname))

            for v in ch.get("videos") or []:
                yt_id = v.get("youtubeId") or ""
                if not yt_id:
                    cv.heuristic_findings.append(
                        HeuristicFinding("error", "missing_video_id", "Video entry has no YouTube ID", ch_id, "videos")
                    )
                    continue
                if PLACEHOLDER_IDS.match(yt_id) or not youtube_is_embeddable(yt_id):
                    cv.heuristic_findings.append(
                        HeuristicFinding(
                            "error",
                            "placeholder_video",
                            f"Non-embeddable or placeholder YouTube ID: {yt_id}",
                            ch_id,
                            "videos",
                        )
                    )
                else:
                    ok, detail = await check_youtube_oembed(client, yt_id)
                    if ok:
                        cv.heuristic_findings.append(
                            HeuristicFinding("info", "youtube_ok", f"YouTube OK: {detail[:120]}", ch_id, "videos")
                        )
                        id_to_chapters.setdefault(yt_id, []).append(ch_id)
                    else:
                        cv.heuristic_findings.append(
                            HeuristicFinding(
                                "error",
                                "youtube_invalid",
                                f"YouTube ID {yt_id} failed validation: {detail}",
                                ch_id,
                                "videos",
                            )
                        )

            results[ch_id] = cv

    for yt_id, ch_list in id_to_chapters.items():
        if len(ch_list) > 1:
            for ch_id in ch_list:
                results[ch_id].heuristic_findings.append(
                    HeuristicFinding(
                        "warn",
                        "duplicate_video",
                        f"Same YouTube ID {yt_id} shared across chapters: {', '.join(ch_list)}",
                        ch_id,
                        "videos",
                    )
                )

    return results


def _chapter_llm_payload(ch: dict) -> str:
    videos = []
    for v in ch.get("videos") or []:
        videos.append(
            {
                "title": v.get("title"),
                "presenter": v.get("presenter"),
                "youtubeId": v.get("youtubeId"),
                "url": v.get("url"),
                "milestones": (v.get("milestones") or [])[:5],
            }
        )
    payload = {
        "chapterId": ch.get("chapterId"),
        "title": ch.get("title"),
        "subject": ch.get("subject"),
        "syllabusOutline": ch.get("syllabusOutline") or [],
        "scholarTips": (ch.get("scholarTips") or [])[:4],
        "videos": videos,
        "studySummaryExcerpt": (ch.get("studySummary") or "")[:1200],
        "disclaimer": ch.get("disclaimer"),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _parse_llm_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    m = re.search(r"(\{[\s\S]+\})", text)
    if m:
        text = m.group(1)
    return json.loads(text)


async def _ollama_chat(base_url: str, model: str, messages: list[dict], max_tokens: int = 600) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(
                f"{base_url.rstrip('/')}/v1/chat/completions",
                json={"model": model, "messages": messages, "stream": False, "max_tokens": max_tokens},
            )
            resp.raise_for_status()
            return str(resp.json()["choices"][0]["message"]["content"]).strip()
        except httpx.HTTPError:
            resp = await client.post(
                f"{base_url.rstrip('/')}/api/chat",
                json={"model": model, "messages": messages, "stream": False},
            )
            resp.raise_for_status()
            return str(resp.json()["message"]["content"]).strip()


async def _openrouter_chat(api_key: str, model: str, messages: list[dict], max_tokens: int = 600) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://yogabrata.com",
                "X-Title": "CBSE10 Study Material Validator",
            },
            json={"model": model, "messages": messages, "max_tokens": max_tokens},
        )
        resp.raise_for_status()
        return str(resp.json()["choices"][0]["message"]["content"]).strip()


async def llm_validate_chapter(
    ch: dict,
    *,
    provider: str,
    ollama_url: str,
    ollama_model: str,
    openrouter_key: str,
    openrouter_model: str,
) -> dict[str, Any]:
    user_content = (
        "Review this CBSE Class 10 study material chapter for correctness, sanity, and reference quality.\n\n"
        + _chapter_llm_payload(ch)
    )
    messages = [{"role": "system", "content": LLM_SYSTEM}, {"role": "user", "content": user_content}]

    if provider == "openrouter":
        if not openrouter_key:
            return {"error": "OPENROUTER_API_KEY not set", "skipped": True}
        raw = await _openrouter_chat(openrouter_key, openrouter_model, messages)
    else:
        raw = await _ollama_chat(ollama_url, ollama_model, messages)

    try:
        parsed = _parse_llm_json(raw)
        parsed["_raw_excerpt"] = raw[:400]
        return parsed
    except json.JSONDecodeError:
        return {"error": "bad_llm_json", "raw": raw[:800]}


def summarize_report(results: dict[str, ChapterValidation]) -> dict[str, Any]:
    errors = warns = 0
    for cv in results.values():
        for f in cv.heuristic_findings:
            if f.severity == "error":
                errors += 1
            elif f.severity == "warn":
                warns += 1

    gemma_scores = [
        float(cv.local_gemma["overall_score"])
        for cv in results.values()
        if cv.local_gemma and cv.local_gemma.get("overall_score") is not None
    ]
    or_scores = [
        float(cv.openrouter["overall_score"])
        for cv in results.values()
        if cv.openrouter and cv.openrouter.get("overall_score") is not None
    ]

    return {
        "chapters": len(results),
        "heuristic_errors": errors,
        "heuristic_warnings": warns,
        "local_gemma_avg_score": round(sum(gemma_scores) / len(gemma_scores), 1) if gemma_scores else None,
        "openrouter_avg_score": round(sum(or_scores) / len(or_scores), 1) if or_scores else None,
    }


def print_human_report(report: dict[str, Any]) -> None:
    print("\n=== CBSE 10 Study Material Validation ===")
    print(f"Generated: {report.get('generated_at')}")
    s = report.get("summary") or {}
    print(
        f"Chapters: {s.get('chapters')} | Heuristic errors: {s.get('heuristic_errors')} | "
        f"Warnings: {s.get('heuristic_warnings')}"
    )
    if s.get("local_gemma_avg_score") is not None:
        print(f"Local Gemma avg score: {s['local_gemma_avg_score']}")
    if s.get("openrouter_avg_score") is not None:
        print(f"OpenRouter avg score: {s['openrouter_avg_score']}")

    print("\n--- Heuristic issues (errors first) ---")
    for ch_id, ch in (report.get("chapters_detail") or {}).items():
        issues = [f for f in ch.get("heuristic_findings") or [] if f["severity"] != "info"]
        if not issues:
            continue
        print(f"\n[{ch_id}] {ch.get('title')}")
        for f in issues:
            print(f"  {f['severity'].upper():5} {f['code']}: {f['message']}")

    print("\n--- LLM reviews ---")
    for ch_id, ch in (report.get("chapters_detail") or {}).items():
        g = ch.get("local_gemma")
        o = ch.get("openrouter")
        if not g and not o:
            continue
        print(f"\n[{ch_id}] {ch.get('title')}")
        if g and not g.get("skipped"):
            print(f"  Gemma: score={g.get('overall_score')} correctness={g.get('correctness')} sanity={g.get('sanity')}")
            for issue in (g.get("issues") or [])[:3]:
                print(f"    - {issue}")
        if o and not o.get("skipped"):
            print(
                f"  OpenRouter: score={o.get('overall_score')} correctness={o.get('correctness')} "
                f"sanity={o.get('sanity')}"
            )
            for issue in (o.get("issues") or [])[:3]:
                print(f"    - {issue}")


async def main_async(args: argparse.Namespace) -> int:
    source = Path(args.source)
    portal = Path(args.portal_data)

    ingestor = StudyMaterialIngestor(source_dir=source, portal_export_dir=portal)
    chapters: dict[str, dict] = {}

    for subj_dir, subject in (("science", "science"), ("mathematics", "mathematics")):
        base = source / subj_dir
        if not base.is_dir():
            continue
        for path in sorted(base.glob("*.md")):
            if path.name.endswith("-discussion.md"):
                continue
            from modules.cbse10.study_material_ingest import STUDY_FILE_TO_CHAPTER  # noqa: WPS433

            stem = path.stem
            ch_id = STUDY_FILE_TO_CHAPTER.get(stem, stem)
            if args.chapter and ch_id != args.chapter:
                continue
            text = path.read_text(encoding="utf-8")
            chapters[ch_id] = ingestor._parse_chapter_material(path, text, subject, ch_id)

    if portal.is_dir():
        ingestor._apply_video_overrides(chapters)

    if args.max_chapters and len(chapters) > args.max_chapters:
        chapters = dict(list(sorted(chapters.items()))[: args.max_chapters])

    if not chapters:
        print("No chapters matched.", file=sys.stderr)
        return 1

    results = await run_heuristics(chapters)

    ollama_url = args.ollama_url or os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    ollama_model = args.ollama_model or os.environ.get(
        "STUDY_VALIDATOR_OLLAMA_MODEL",
        os.environ.get("PRACTICE_VALIDATOR_MODEL", "gemma3:4b"),
    )
    openrouter_key = args.openrouter_key or os.environ.get("OPENROUTER_API_KEY", "")
    openrouter_model = args.openrouter_model or os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    llm_targets = list(results.keys())
    if not args.heuristic_only:
        for ch_id in llm_targets:
            ch = chapters[ch_id]
            if args.local_llm:
                try:
                    results[ch_id].local_gemma = await llm_validate_chapter(
                        ch,
                        provider="ollama",
                        ollama_url=ollama_url,
                        ollama_model=ollama_model,
                        openrouter_key="",
                        openrouter_model="",
                    )
                    print(f"  Gemma reviewed: {ch_id}")
                except Exception as exc:
                    results[ch_id].local_gemma = {"error": str(exc), "skipped": True}
                    print(f"  Gemma failed {ch_id}: {exc}")

            if args.openrouter_llm:
                try:
                    results[ch_id].openrouter = await llm_validate_chapter(
                        ch,
                        provider="openrouter",
                        ollama_url="",
                        ollama_model="",
                        openrouter_key=openrouter_key,
                        openrouter_model=openrouter_model,
                    )
                    print(f"  OpenRouter reviewed: {ch_id}")
                except Exception as exc:
                    results[ch_id].openrouter = {"error": str(exc), "skipped": True}
                    print(f"  OpenRouter failed {ch_id}: {exc}")

    chapters_detail = {}
    for ch_id, cv in results.items():
        chapters_detail[ch_id] = {
            "chapter_id": cv.chapter_id,
            "title": cv.title,
            "subject": cv.subject,
            "source_file": cv.source_file,
            "heuristic_findings": [asdict(f) for f in cv.heuristic_findings],
            "local_gemma": cv.local_gemma,
            "openrouter": cv.openrouter,
        }

    report = {
        "version": 1,
        "generated_at": _now(),
        "source_dir": str(source),
        "validators": {
            "heuristics": True,
            "local_gemma": args.local_llm and not args.heuristic_only,
            "local_gemma_model": ollama_model if args.local_llm else None,
            "openrouter": args.openrouter_llm and not args.heuristic_only,
            "openrouter_model": openrouter_model if args.openrouter_llm else None,
        },
        "summary": summarize_report(results),
        "chapters_detail": chapters_detail,
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nReport written: {out_path}")
    print_human_report(report)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate CBSE 10 study material (heuristics + LLM)")
    ap.add_argument("--source", default=str(DEFAULT_SOURCE))
    ap.add_argument("--portal-data", default=str(DEFAULT_PORTAL))
    ap.add_argument("--output", default=str(DEFAULT_REPORT))
    ap.add_argument("--chapter", help="Validate one chapter id only (e.g. metals)")
    ap.add_argument("--max-chapters", type=int, default=0, help="Limit chapters for LLM cost control")
    ap.add_argument("--heuristic-only", action="store_true", help="Skip LLM validators")
    ap.add_argument("--local-llm", action="store_true", help="Run local Gemma via Ollama")
    ap.add_argument("--openrouter-llm", action="store_true", help="Run OpenRouter validator")
    ap.add_argument("--ollama-url", default="")
    ap.add_argument("--ollama-model", default="")
    ap.add_argument("--openrouter-key", default="")
    ap.add_argument("--openrouter-model", default="")
    args = ap.parse_args()

    if not args.heuristic_only and not args.local_llm and not args.openrouter_llm:
        args.local_llm = True
        args.openrouter_llm = True

    return asyncio.run(main_async(args))


if __name__ == "__main__":
    raise SystemExit(main())
