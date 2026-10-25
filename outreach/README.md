# JSI Outreach workspace v2

Replaces the former school-only prototype at https://yogabrata.com/outreach/.

## Deployment boundary

This repository is the public GitHub Pages frontend. It is an interactive, browser-local preview, not the production service described in the October 25 updated PRD. It makes no live discovery, email or LLM requests. All seed contacts and simulated discoveries use reserved `.example` domains. No passwords, API keys or files are accepted for storage. Do not enter sensitive contact data into a public preview.

The target private management URL remains `https://mailmkt.brahmexa.com`. Deploying that service requires dedicated-server access and separately implemented authentication, API, database and workers. No production account or endpoint was provisioned by this frontend change.

## Implemented preview workflows

- Create any number of discovery agents for arbitrary segments, with user-authored objectives/instructions, geographic scope, source categories, provider choice, field requirements, qualification rules, request/page/record/time budgets, cadence and pinned template/sender assignments.
- Store configuration versions and run history. Generate explicitly fictional review candidates from an agent configuration without a spreadsheet. No real crawl is represented as successful.
- Canonical organization records with separately normalized emails and phones, individual status and source evidence. Global email and phone duplicate checks. Ambiguous organization matches held for review. Suppression survives import and edits.
- Search, filter, sort and paginate. Optional CSV/XLSX import with mapping and validation. CSV/XLSX export with selected columns, preserved filters, organization/email row layouts and export metadata. Spreadsheet formula escaping.
- Reusable Template Studio with HTML/plain text, subject, preheader, segment/language tags, variable catalog, fallbacks, sanitized sandboxed preview, approval and version history. Unsupported HTML, scripts, remote content and unsafe links removed. Unresolved variables block queue creation.
- Campaign revisions, segment/template consistency, explicit approval, pause and pinned content versions. Queue idempotency, exact rendered snapshots, suppression/reply/campaign/template rechecks and rolling sender/domain/campaign/agent caps in preview dispatch.
- Fictional inbox with human-reply / auto-acknowledgement separation. Confirming a human reply cancels queued work. Reclassification never silently revives cancelled jobs.
- Multiple sender connection metadata records; password entry and tests unavailable until backend exists.
- Brochure metadata registration; upload, validation and campaign approval intentionally unavailable without private storage/scanning. Direct attachments disabled.
- Notification addresses parsed and normalized individually; task-level Ollama/OpenAI/Gemini routing configuration with explicit cloud opt-in and no default cloud fallback.
- Global kill switch cancels unstarted preview jobs and never restores them on resume. Local activity history labels its own limitations.

## Production requirements not implemented

FastAPI / PostgreSQL / Redis services; secure authentication, server RBAC, MFA, sessions, CSRF, password resets, secret encryption; real autonomous approved-source discovery, robots/access policies and crawling; DNS/MX/service verification; scheduler and resumable workers; SMTP/IMAP and real threaded inbox; actual follow-up drafting/scheduling; live sender health/authentication checks; backend sending windows, provider retry/backoff, complaint/bounce monitoring; real opt-out endpoint and notification delivery; private assets and malware scanning; server-side audit integrity, retention, monitoring, backup/restore.

Frontend controls are not server authorization. Local audit history is not tamper resistant. Connection statuses are never fabricated. Approval in this preview authorizes only preview operations.

## Validation

`node --check outreach/workspace.js`

`node outreach/test-prototype.cjs`

21 focused lifecycle checks cover arbitrary segments and uniqueness, suppression, duplicates, reviewed campaign/template gating, unresolved placeholders, immutable snapshots, idempotency, stale versions, human replies versus auto acknowledgements, kill behavior, sender caps, filters and formula escaping. The lightweight VM DOM stub does not validate HTML sanitization. Browser QA separately checks the actual template sandbox, agent creation, approval and queue workflows.

Static assets are `index.html`, `workspace.css`, `workspace.js` and vendored SheetJS 0.18.5 (Apache-2.0 license in `vendor/`). Browser state uses a new `jsi-outreach-workspace-v2` key; old prototype storage is not migrated or overwritten.
