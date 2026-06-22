#!/usr/bin/env python3
"""Ingest VOLTAIC study material → portal JSON, forum, bots, RAG corpus."""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

BRAHMANDO_EP = Path(r"C:\Users\whizy\AppData\Local\Temp\Brahmando\services\education-portal")
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BRAHMANDO_EP))

from modules.cbse10.study_material_ingest import StudyMaterialIngestor  # noqa: E402

DEFAULT_SOURCE = Path(r"C:\Knowledge\EDUCATION\CBSE-10-MATH-SCIENCE\Study Material")
PORTAL_DATA = ROOT / "portal" / "data"
KNOWLEDGE_OUT = BRAHMANDO_EP / "knowledge"


async def maybe_ingest_rag(kb_dir: Path, *, recreate: bool) -> dict:
    from rag import EducationRAG

    rag = EducationRAG()
    chunks = await rag.ingest_directory(kb_dir, recreate=recreate)
    return {"rag_chunks": chunks, "rag_dir": str(kb_dir)}


def main() -> int:
    ap = argparse.ArgumentParser(description="CBSE 10 VOLTAIC study material ingest")
    ap.add_argument("--source", default=str(DEFAULT_SOURCE))
    ap.add_argument("--portal-data", default=str(PORTAL_DATA))
    ap.add_argument("--knowledge-out", default=str(KNOWLEDGE_OUT))
    ap.add_argument("--no-forum-merge", action="store_true")
    ap.add_argument("--no-bots-merge", action="store_true")
    ap.add_argument("--no-rag-write", action="store_true")
    ap.add_argument("--ingest-rag", action="store_true", help="Embed study_material_v1 into Qdrant")
    ap.add_argument("--recreate-rag", action="store_true")
    args = ap.parse_args()

    portal = Path(args.portal_data)
    ingestor = StudyMaterialIngestor(
        source_dir=Path(args.source),
        portal_export_dir=portal,
        knowledge_out=None if args.no_rag_write else Path(args.knowledge_out),
        bots_path=None if args.no_bots_merge else portal / "academy-bots.json",
        forum_path=None if args.no_forum_merge else portal / "cbse10-forum.json",
    )
    result = ingestor.run(
        write_rag=not args.no_rag_write,
        export_portal=True,
        merge_forum=not args.no_forum_merge,
        merge_bots=not args.no_bots_merge,
    )
    print(
        f"Study material: chapters={result.chapters} threads={result.discussion_threads} "
        f"voltaic_bots={result.voltaic_bots} rag_docs={result.rag_documents}"
    )

    if args.ingest_rag and not args.no_rag_write:
        kb_dir = Path(args.knowledge_out) / "cbse10" / "study_material_v1"
        rag_report = asyncio.run(maybe_ingest_rag(kb_dir, recreate=args.recreate_rag))
        print(f"RAG: {rag_report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
