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

## Mock generator requirements
1. Always render **all sections** (A–E for Class X).
2. Enforce **3-hour** timer and **total marks** on paper header.
3. Section A: MCQs from verified bank.
4. Sections B–E: constructed-response UI (textarea); reuse bank prompts when needed.
5. Entry: `education/cbse10/mock-exam.js` + `exam-schema.js` (shared by cbse12 via `../cbse10/mock-exam.js`).
