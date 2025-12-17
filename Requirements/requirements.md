# Functional Requirements (FR)

## Visitor & Discovery

**FR-01 — Browse catalogue**
- **Spec:** The system shall present a paginated catalogue of published content with basic metadata (title, summary, date, tags).
- **Trace:** Use Case: *Browse contents*. Stakeholders: Visitors, Website Owners.
- **Priority:** Must
- **Verify:** System test (UI) + database with 1+ stories; pagination shows correct counts.

**FR-02 — Content detail view**
- **Spec:** The system shall display a content page with body text, images/attachments, source attribution, and related items.
- **Trace:** Use Case: *Browse contents*.
- **Priority:** Must
- **Verify:** System test; check media rendering and related list.


## Search

**FR-03 — Full-text search**
- **Spec:** The system shall provide keyword search over titles and body.
- **Trace:**  Use Case: *Search by query*.
- **Priority:** Must
- **Verify:** Functional test with known page body.

**FR-04 — Filters & sort**
- **Spec:** Users shall refine search via filters and tags (ex: era/theme/location/type) and sort (relevance/newest/most-viewed).
- **Trace:** Use Case: *Search by query*.
- **Priority:** Must
- **Verify:** Functional test; URL/state reflects filters, deterministic sorting.

**FR-05 — "Did you mean...?"**
- **Spec:** When zero/low results, the system shall suggest alternate spellings or queries.
- **Trace:** Use Case: *Search by query*.
- **Priority:** Could
- **Verify:** Inject typos; assert suggestion appears.

## Contributor — Content Authoring

**FR-06 — Create content (draft)**
- **Spec:** Logged-in contributors shall create draft content with title, body, tags, and media uploads.
- **Trace:** Use Case: *Publish new content*.
- **Priority:** Must
- **Verify:** Auth + form tests; file upload acceptance.

**FR-07 — Edit & versioning**
- **Spec:** Edits shall create a new immutable version with **change notes**; current version pointer updates after approval.
- **Trace:** Use Case: *Edit existing content*.
- **Priority:** Must
- **Verify:** DB version rows + UI shows history and change notes.

**FR-08 — View moderation rules**
- **Spec:** A public, versioned rules page shall be accessible from the header.
- **Trace:** Use Case: *View moderation rules*.
- **Priority:** Must
- **Verify:** Rules presence, last-updated timestamp, link locations.

## Collaboration & Disputes

**FR-09 — Contributor discussions**
- **Spec:** Authenticated contributors shall create and reply to discussion threads tied to a content item.
- **Trace:** Use Case: *Discuss*.
- **Priority:** Should
- **Verify:** Threaded model test; permissions; notifications optional.

**FR-10 — Dispute initiation**
- **Spec:** Contributors shall open a dispute on a content/moderation decision with reason and evidence; a ticket is created for moderators.
- **Trace:** Use Case: *Initiate disputes*.
- **Priority:** Must
- **Verify:** Ticket existence; linkage to content and actor.

## Moderation

**FR-11 — Moderator toolset**
- **Spec:** Moderators shall access a dashboard listing pending reviews, disputes, flags, and actions.
- **Trace:** Use Case: *Moderator toolset*.
- **Priority:** Must
- **Verify:** Role-gated UI acceptance test.

**FR-12 — Approve/reject with rationale**
- **Spec:** Moderators shall approve or reject dispute submissions with a required rationale.
- **Trace:** Use Case: *Moderate*.
- **Priority:** Must
- **Verify:** State machine tests; rationale non-empty.

**FR-13 — Remove inappropriate content**
- **Spec:** Moderators shall soft-delete pages, comments, or accounts with reason and policy reference; content becomes non-discoverable.
- **Trace:** Use Case: *Remove inappropriate content*.
- **Priority:** Must
- **Verify:** Visibility checks; search de-index; audit entry exists.

**FR-14 — Audit logs**
- **Spec:** The system shall log moderation actions (who, what, when, rationale, version IDs) and support read-only review by moderators/admins.
- **Trace:** Use Case: *View audit logs*.
- **Priority:** Must
- **Verify:** Log entries created.

## Administration & Security

**FR-15 — GDPR data rights**
- **Spec:** The system shall support data export and deletion requests for identifiable users, with identity verification.
- **Trace:** Use Case: *Abide by GDPR*.
- **Priority:** Must
- **Verify:** Right-To-Forget test with test account; export format valid; deletion cascades.

**FR-16 — Role & access management**
- **Spec:** Admins shall assign roles (visitor, contributor, moderator, admin) and manage permissions.
- **Trace:** Use Case: *Manage account access*.
- **Priority:** Must
- **Verify:** Account privelege change test with test account.

**FR-17 — Account sanctions**
- **Spec:** Admins shall suspend/ban accounts with reason and duration; log and notify the user.
- **Trace:** Use Case: *Manage account access*.
- **Priority:** Should
- **Verify:** Login blocked during ban; audit log written; notification sent.

**FR-18 — IP blocking**
- **Spec:** Admins shall block/allow specific IPs; blocked traffic does not reach app routes.
- **Trace:** Use Case: *Block IPs*.
- **Priority:** Should
- **Verify:** Network-level rule test; requests return 403/blocked page.

## Data Quality & Provenance

**FR-19 — Source attribution**
- **Spec:** Content items shall include required fields for provenance (source, date, contributor) to aid accuracy.
- **Trace:** External: Historians/Libraries.
- **Priority:** Must
- **Verify:** Schema validation; UI input required.

---

# Non-Functional Requirements (NFR)

## Performance & Scalability

**NFR-01 — Search latency**
- **Spec:** P95 response time for `GET /search` ≤ **300 ms**.
- **Priority:** Should
- **Verify:** Load test.

**NFR-02 — Catalogue latency**
- **Spec:** P95 for `GET /contents?page=n` ≤ **400 ms** with cache warm.
- **Priority:** Should
- **Verify:** Synthetic monitoring.

**NFR-03 — Horizontal scale**
- **Spec:** System shall scale to 500 concurrent browsing sessions without errors.
- **Priority:** Could
- **Verify:** Soak test.

## Reliability & Availability

**NFR-04 — Uptime**
- **Spec:** Service availability ≥ **99.5%** monthly (excluding scheduled maintenance).
- **Priority:** Should
- **Verify:** Uptime monitor reports.

**NFR-05 — Data durability**
- **Spec:** Content and media stored with daily backups and 7-day point-in-time recovery.
- **Priority:** Must
- **Verify:** Backup/restore drill.

## Security & Privacy

**NFR-06 — Authentication**
- **Spec:** Web app shall have secure auth and be secure to SQL injections.
- **Priority:** Must
- **Verify:** Security review.

**NFR-07 — Abuse controls**
- **Spec:** Rate limiting and CAPTCHA shall protect auth, posting, and flagging endpoints.
- **Priority:** Must
- **Verify:** Pen test; rate-limit unit tests.

**NFR-08 — Audit immutability**
- **Spec:** Audit logs shall be append-only.
- **Priority:** Should
- **Verify:** Attempted edit fails.

**NFR-09 — PII minimization**
- **Spec:** Store only necessary personal data; default to pseudonymous IDs for public views.
- **Priority:** Must
- **Verify:** Data inventory audit.

**NFR-10 — GDPR compliance**
- **Spec:** Support consent, privacy notice, cookie disclosure, data access/erasure within **30 days**; retain consent logs.
- **Priority:** Must
- **Verify:** Policy + process test.

**NFR-11 — Logging & retention**
- **Spec:** Keep app logs 30 days (rotated); keep audit logs 12 months minimum; purge per policy.
- **Priority:** Should
- **Verify:** Log retention job evidence.

## Usability & Accessibility

**NFR-12 — Accessibility**
- **Spec:** UI has contrast, color-blind friendly color palet, images have alt text.
- **Priority:** Should
- **Verify:** Manual audit.

**NFR-13 — Learnability**
- **Spec:** First-time contributor can publish a draft in ≤ **10 minutes** using in-UI guidance and rules page.
- **Priority:** Could
- **Verify:** Usability test.
