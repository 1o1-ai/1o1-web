# JSI Outreach prototype

Interactive public prototype for the Autonomous Cold Outreach, Lead Hunter & Email Lifecycle PRD.

Route: https://yogabrata.com/outreach/

## What works

- Eight responsive sections: overview, leads, campaigns, inbox, discovery, assets, activity and settings.
- Browser-local persistence with 12 fictional schools, two campaigns and a sample reply.
- CSV import with column mapping, quoted/multiline field support, normalization, duplicate detection, validation preview and review-first ingestion. CSV export guards spreadsheet formula injection. Excel files must be exported to CSV for this version.
- Lead creation, notes, filters, source details, recipient eligibility review and suppression. Opted-out and suppressed contacts cannot be reactivated through UI/import.
- Campaign editing, saved personalization previews, revision invalidation, content checks and explicit demo approval.
- Simulated dispatch with rolling sender/campaign caps and minimum 180-second spacing. Exact rendered demo messages are retained in browser state.
- Follow-up template previews, explicit approval, interval/count validation and immediate eligibility/revision rechecks.
- Simulated inbox replies cancel pending jobs and drafts. Opt-outs also stop future demo follow-ups.
- Simulated discovery creates fictional .example contacts in review; it has independent pause/resume.
- Global pause/resume and kill switch. Emergency stop cancels pending jobs/drafts and returns queued leads to eligibility review.
- PDF extension, size and header validation. Only metadata is retained; contents are discarded. Assets stay pending_scan because no malware scanner is connected.
- Activity history, CSV exports, policy settings, workspace reset and mobile navigation.

## Deliberate prototype boundaries

This is a static, browser-local demonstration, not the production backend specified by the PRD. It has no live sending, crawling, external search, IMAP polling, Ollama inference, authentication, MFA, server RBAC, shared database, scheduler, Redis queue, private file storage, malware scanning, DNS verification, signed unsubscribe links, backups or encrypted secrets. Template follow-up copy is explicitly labeled as a preview, not model output. No passwords are collected. Audit history is local and editable, not a production audit trail. Production mail transport and all provider checks must be implemented before live use.

Use fictional data only on this public route. State is isolated per browser/origin. Browser data clearing or Settings → Reset demo removes it.

## Demo walkthrough

1. Leads → Import CSV → download the sample → upload → map columns → import.
2. Review the new recipient and explicitly confirm eligibility.
3. Campaigns → open a pending campaign → preflight and approval → confirm simulation approval.
4. Simulate one send. A second immediate send is blocked by minimum spacing.
5. Generate a follow-up preview for one of the older eligible sample leads, then review it.
6. Inbox → simulate incoming reply. Pending follow-ups for that school are cancelled.
7. Discovery → run demo discovery → review its fictional source and contact.
8. Settings → stop and cancel all queued sends. Resume requires cancelled queued leads to be reviewed again.

## Validation

Run `node outreach/test-prototype.cjs` from the repository root. Nineteen checks cover CSV parsing, duplicate preservation, escaping, recipient review, rendering, pacing, caps, reply/opt-out cancellation, kill-switch recovery, follow-up eligibility and draft approval/revision gates, discovery pause and rendering of all eight sections. Desktop and 390px mobile layouts plus discovery/campaign approval interactions were checked in a browser.

## Production next step

Implement a separate private FastAPI/PostgreSQL/Redis service with Docker Compose at mailmkt.brahmexa.com. Enforce all approval, authorization, suppression, quota and idempotency rules on the server; frontend state must never be trusted. Integrate SMTP/IMAP and local Ollama only server-side, with the PRD's security, deliverability, asset-storage and operational acceptance tests. This public route can remain a synthetic showcase.
