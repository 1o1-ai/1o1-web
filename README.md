# 1o1-web · yogabrata.com

Static site for inflight Yogabrata projects on **yogabrata.com** (GitHub Pages).

## Home circles

| Circle | Path |
|--------|------|
| Elogix Americas | `/portal/elogix-americas/` |
| AI-Caregiver | [1o1.ai](https://1o1.ai) |
| 7RANGERS Hospital | `/sevenrangers/index.html` |
| **ATLAS** | [`/atlas/`](https://yogabrata.com/atlas/) |

ATLAS is a static clone of the ATOM demo UI on GitHub Pages. The browser stays on `yogabrata.com/atlas/`; API calls go to `https://api.brahmando.com/atlas/api/v1`. Visitors must never be sent to `atlas.kai247.com`.

## Anyo Brahmando Academy (Education SaaS)

**Tagline:** *A different path to knowledge, infinite possibility*

**Demo login:** `yoga` / `yoga`

| Path | Description |
|------|-------------|
| `/portal/` | SaaS folder hub — Education (live), HVAC, Restaurant, Hospital, Events, Landscaping |
| `/portal/education/` | Education microservices (CBSE 10 live) |
| `/portal/education/cbse10/room.html` | CBSE 10 study room — student (live) / teacher (preview) |

Static verticals link to [brahmando.com](https://brahmando.com) platform catalog.

Curriculum data: `portal/data/cbse10-curriculum.json` (from CBSE Class X 2026-27 syllabi + PQ papers in `C:\Knowledge\EDUCATION\CBSE-10-MATH-SCIENCE`).

## Local preview

```bash
cd 1o1-web
python -m http.server 8080
# http://localhost:8080/portal/
```

## Deploy

Push to `main` → GitHub Pages serves yogabrata.com (CNAME).
