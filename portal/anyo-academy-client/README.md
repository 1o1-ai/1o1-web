# Anyo Academy Client

Study console for the Brahmexa Education API, hosted on **yogabrata.com**.

**Live:** https://yogabrata.com/portal/anyo-academy-client/

## Access

Sign-in gate (GitHub Pages cannot enforce HTTP Basic Auth; same session pattern as the ManjuLAB portal):

| Username | Password |
|----------|----------|
| `yoga` | `yoga` |
| `deepak` | `Deepak@2026%100#` |

## Modes

| Mode | Purpose |
|------|---------|
| **Atlas** | Constellation of chapters sized by **live** `/v1/questions` totals |
| **Reality** | Curriculum `question_count` hint vs cleaned bank `total` |
| **Tutor** | `POST /actors/chat` |
| **Questions** | Board prompt bank |
| **Quiz** | MCQ bank or generated paper |
| **Practice** | `POST /practice/start` |
| **Lesson** | `POST /teacher/plan` |
| **API Pulse** | Core probe, OpenAPI GET sweep, version drift, known gaps |

API base: `https://api.brahmando.com/education` (browser Origin `https://yogabrata.com` is allowlisted).

Local twin (proxy-based): `Brahmando/tools/education-study-app`.
