# Anyo Brahmando Academy — Study Room Agent Policy

See full tutor/RAG rules: `Brahmando/services/education-portal/docs/CBSE10_TUTOR_AGENTS.md`

**Non-negotiable:** Verified MCQs and answer keys are served from the ingested bank only — never from an LLM.

- Question fetch → `tutor-intent.js` + bank filter
- Explain / answer → verified `correctIndex` first; LLM only with RAG context
- Peer bots → `bots.js` (no bank fetch on peer mentions)
