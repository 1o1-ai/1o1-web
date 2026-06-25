# CBSE Exam Simulation Schema (Class X & XI–XII Science)

**Source of truth in code:** `portal/assets/exam-schema.js` — mock generator must read this file; do not hard-code 20-question Section A only.

## General Rules
- Duration: **3 hours**
- Total Marks: **80** (Class X) or **70/80** (Class XI–XII depending on subject)
- Passing: **33%** minimum in theory
- Internal assessment/practical ignored in mock simulation

## Class X — Mathematics (80 marks)
| Section | Type | Count × Marks |
|---------|------|---------------|
| A | MCQ | 20 × 1 = 20 |
| B | VSA | 5 × 2 = 10 |
| C | SA | 6 × 3 = 18 |
| D | LA | 3 × 4 = 12 |
| E | LA | 4 × 5 = 20 |

## Class X — Science (80 marks)
| Section | Type | Count × Marks |
|---------|------|---------------|
| A | MCQ | 20 × 1 = 20 |
| B | VSA | 6 × 2 = 12 |
| C | SA | 7 × 3 = 21 |
| D | LA | 3 × 4 = 12 |
| E | LA | 3 × 5 = 15 |

## Class XI–XII Science (70 or 80 marks)

Competency split: **20% MCQ · 50% application · 30% constructed response**

| Subject | Total marks | Section A (20%) | Section B (50%) | Section C (30%) |
|---------|-------------|-----------------|-----------------|-----------------|
| Physics | 70 | 14 × 1 | 18 × 2 | 8 × 3 |
| Chemistry | 70 | 14 × 1 | 18 × 2 | 8 × 3 |
| Biology | 70 | 14 × 1 | 18 × 2 | 8 × 3 |
| Mathematics | 80 | 16 × 1 | 20 × 2 | 9 × 3 |

Question bank: `portal/data/cbse12-science-questions.json` (export via `scripts/export_portal_study_assets.py`).

Mock entry: `education/cbse12-science/mock-exam.html` → shared `education/cbse10/mock-exam.js` with `data-sku="cbse12-science"`.

## Class X — Mock question sources
| Section | Source | Status |
|---------|--------|--------|
| A | Verified MCQ bank + approved 1-mark items | Live |
| B–E | `cbse10-board-questions.json` from `Study Material/*.md` | **Approved** |

Export: `python scripts/export_cbse10_voltaic_assets.py` (reads `C:\Knowledge\EDUCATION\CBSE-10-MATH-SCIENCE\Study Material`).

Discussion boards: `*-discussion.md` → `discussionThreads` per chapter in `cbse10-study-material.json`.

## Mock generator requirements
1. Always render **all sections** (A–E for Class X; A–C for Class XII).
2. Enforce **3-hour** timer and **total marks** on paper header.
3. Section A: MCQs from verified bank.
4. Sections B–E: constructed-response UI (textarea); reuse bank prompts when needed.
5. Entry: `education/cbse10/mock-exam.js` + `exam-schema.js` (Class XII: `cbse12-science/mock-exam.html` sets `data-sku`).
