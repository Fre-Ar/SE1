# Requirements Analysis — Local History Documentation Site

**Project:** Local History Documentation Site
**Version:** 1.0  
**Date:** 2025-10-09

> This document defines and analyzes requirements for the Local History Documentation Site.

---

## 2. Stakeholders 

### 2.1 Primary (Direct Users)
- **Visitors (residents, tourists)** — browse stories, search by era/location; want a respectful, fast UI.
- **Contributors (families, amateur historians, photographers)** — submit stories/images/docs; want simple upload, clear attribution and licensing, predictable moderation.
- **Educators (teachers, students)** — classroom usage; want curated collections, timelines aligned to curricula, export/print.
- **Professional historians/archivists** — demand rigorous metadata/provenance; want controlled vocabularies, citations, and revision history.

### 2.2 Secondary (Indirect)
- **Local libraries/museums/archives** — provide/ingest collections; want import/export pipelines, rights management, attribution rules; want stable permalinks.

### 2.3 External (Influencers/Regulators)
- **Municipality/legal officers** — ensure compliance (consent, minors’ data, copyright).  
- **Funding bodies/donors/university administration** — track impact, reliability, and sustainability.

### 2.4 Hidden (Often Overlooked)
- **System admins/DevOps** — handle hosting, backups, monitoring, incident response.  
- **Moderators/curators** — review queues, deduplication, tagging, dispute handling.  
- **Accessibility advocates/users** — inclusive design and authoring support.  
- **Security team** — protect personal information, prevent abuse/spam, enforce least-privilege access.

---

## 3. Stakeholder Register (Concise)

| Stakeholder | Type | Key Interests | Success Criteria | Risks/Concerns | Engagement Plan |
|---|---|---|---|---|---|
| Visitors | Primary | Fast discovery, respectful curation | p95 ≤ 2s, intuitive search/filters, high satisfaction | Confusing UI, slow pages | Usability tests |
| Contributors | Primary | Easy uploads, licensing clarity, attribution | 3-step submission; visible attribution; moderation SLA | Unclear rights; long queues | Guided forms; clear ToS; moderation dashboard |
| Educators | Primary | Curriculum-aligned collections, export/print | Themed collections; PDF export; stable links | Low-quality/unreliable content | Content curation |
| Historians/Archivists | Primary | Provenance, controlled vocabularies, versioning | Metadata completeness; citation fields; revision history | Data inconsistency; schema drift | Metadata policy; schema validation |
| Libraries/Museums | Secondary | Bulk ingest/export, rights, attribution | CSV/JSON import; rights fields; partner pages | Misattributed content; format mismatch | Integration tests |
| Municipality | External | Compliance, consent, takedowns, minors’ data | Takedown in ≤ X days; consent records; audit logs | Violations; reputational damage | Privacy reviews; audits |
| Funders/University | External | Impact, uptime, sustainability | uptime ≥ 99.5%; backup daily | Underuse; outages | Incident reports; Usage reports |
| Admins/DevOps | Hidden | Simple deploys, backups, monitoring, logs | Deployment scripts; alerts; nightly backups | Operational toil; silent failures | Runbooks |
| Moderators/Curators | Hidden | Efficient review, tagging, dispute tools | <N min review flow; audit trail; messaging | Backlogs; burnout | Queue metrics; role-based workflows |
| Accessibility Advocates | Hidden | Inclusive UX and content authoring | alt-text completeness | Non-compliant components | Automated accessibility checker; audits |
| Security Team | Hidden | Abuse prevention, least privilege | Role-based access; rate-limits; upload scanning | Spam, personal information leaks | Threat model |

---

## 4. Interests → Candidate Requirements (Traceable)

> Each item should later gain acceptance criteria and test cases; IDs enable traceability to use cases and validation.

**Content submission & curation**  
- **R1:** Guided submission with required metadata (title, place, date/era, theme) and optional consent/licensing.  
- **R2:** Moderation queue with approve/reject/edit, provenance tracking, and audit trail.  
- **R3:** Bulk import/export (CSV/JSON) for institutional partners.

**Discovery & exploration**  
- **R4:** Search by era/theme/location with filters and relevance ranking.  
- **R5:** Interactive **timeline** and **map** views; embeddable widgets with stable permalinks.  
- **R6:** Curated collection pages (e.g., eras, districts, themes).

**Quality & trust**  
- **R7:** Source citations and revision history; contributor attribution; moderation notes.  
- **R8:** Content flag/report and dispute resolution workflow.

**Legal & privacy**  
- **R9 (NFR):** Consent management; Takedown workflow within agreed SLA; data minimization.  
- **R10 (NFR):** Personal information redaction tools for images/documents where needed.  
- **R11 (NFR):** Administrative action audit logs with retention policy.

**Performance & availability**  
- **R12 (NFR):** p95 page response ≤ 2 s; uptime ≥ 99.5%; daily backups.  
- **R13 (NFR):** Accessibility with measurable checks.

**Operations & security**  
- **R14 (NFR):** Role-based access (non-logged-in user/contributor/moderator/admin/partner).  
- **R15 (NFR):** Anti-spam (rate limiting/CAPTCHA), file-type/size validation, malware scan on upload.

---

## 5. Conflict Analysis & Mitigations

- **Open access vs. moderation burden** — *Mitigate:* staged publishing, review SLAs, community guidelines.  
- **Speed vs. accuracy** — *Mitigate:* quick publish with essential fields; progressive enrichment by archivists.  
- **Privacy/compliance vs. storytelling richness** — *Mitigate:* consent templates, default anonymization, takedown workflow.  
- **Scope creep vs. semester timeline** — *Mitigate:* MoSCoW and 100-dollar tests during workshops; MVP freeze.

---

## 6. Power–Interest Matrix (Summary)

| Category | Stakeholders | Engagement Strategy |
|---|---|---|
| **High Power / High Interest** | Municipality/legal, University/funders, Library/Museum partners, Product owner | Frequent demos; formal sign-offs; policy-to-feature mapping |
| **High Power / Lower Interest** | University IT/Security | Early threat model; design/security review checkpoint |
| **Low Power / High Interest** | Contributors, residents, educators, historians, moderators | Interviews; usability tests; feedback into backlog |
| **Low Power / Low Interest** | Media/tourism (pre-launch), general diaspora | Inform via release notes; embeddable components |

---

## 8. Elicitation, Validation, and Traceability Plan

1. **Elicit** — Role-based interviews/workshops; capture user stories and scenarios.  
2. **Model** — Use-case diagram and textual use cases with pre/post-conditions and alt flows.  
3. **Prioritize** — MoSCoW + 100-dollar test across roles; publish MVP scope.  
4. **Specify** — Convert to functional/NFR requirements with acceptance criteria.  
5. **Trace** — Maintain a lightweight matrix linking *Stakeholder → Story → Requirement → Use Case → Test Case*.  
6. **Validate** — Scenario walkthroughs and early usability tests per stakeholder group; update backlog.

---

## 9. Initial Traceability Seeds (Example)

| Stakeholder Need | User Story (Draft) | Requirement ID |
|---|---|---|
| Simple uploads with licensing | As a contributor, I want a 3-step upload with clear licensing so that I can share safely. | R1 |
| Rigorous provenance | As an archivist, I want citation and revision history to ensure trust. | R7 |
| Classroom-ready collections | As a teacher, I want curated collections I can export for lessons. | R6 |
| GDPR compliance | As a legal officer, I need takedowns processed within an SLA. | R9 |
| Reliable performance | As a resident, I want fast pages on mobile. | R12 |
| Abuse prevention | As security, I need rate limits and scanning on uploads. | R15 |

---

## 10. Deliverable Alignment (Weeks 1–5)

- Finalize stakeholder register and engagement plan.  
- Produce first-pass user stories/use cases tied to stakeholders.  
- Publish MVP feature list with prioritization rationale.  
- Create initial traceability matrix to carry forward into design, testing, and acceptance.

