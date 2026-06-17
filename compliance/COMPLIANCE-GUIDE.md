# Compliance Guide — Spoken Edge

> **Purpose:** This document describes the data-protection, privacy, payment, and accessibility regulations that apply to Spoken Edge, what each one requires, how the platform is designed to meet it, and the operational steps still required. It is an internal reference for the team and a starting point for legal review — **it is not legal advice.** Before launch, have a qualified attorney review your final policies and Data Processing Agreements.

**Last updated:** 2026-06-11
**Product:** Spoken Edge — a multi-tenant SaaS platform that lets teachers and students hold live, real-time **translated** conversations and messaging, sold to **schools**.
**Who uses it:** Super Admins (platform owner), School Admins, Teachers, and Students (including **minors**).
**Key data flows:** student/teacher/admin profiles, messages & translated message content, live conversation audio→text, usage metering, and billing via Stripe.

---

## 0. Why compliance matters for this product

Spoken Edge has three characteristics that pull in several regulations at once:

1. **It handles children's data in an educational setting** → FERPA + COPPA (US), and the equivalent child-data rules under GDPR (EU/UK).
2. **It processes personal data on behalf of schools** → you are a **data processor / service provider**, the school is the **data controller**. This shapes nearly every obligation below.
3. **It takes payments and uses third-party AI/translation** → PCI DSS (via Stripe) and Google Cloud / Translation API terms.

---

## 1. FERPA — Family Educational Rights and Privacy Act (US)

**Applies because:** schools share student data (names, IDs, grades, guardian info, messages) with Spoken Edge.

**What it requires**
- Student "education records" are protected; they may only be disclosed with parental consent **unless** an exception applies.
- The **"school official" exception (34 CFR §99.31(a)(1))** lets a school share records with a vendor that:
  - performs a function the school would otherwise do itself,
  - is under the school's **direct control** regarding use and maintenance of the data,
  - uses the data **only** for the authorized purpose, and **does not re-disclose** it.
- Parents/eligible students have the right to **access, review, and correct** records.

**How Spoken Edge is positioned**
- Operate strictly as a **school official / service provider** under the school's direction.
- **Do not** use student data for advertising, profiling, or training models; **do not** sell it.
- Multi-tenant isolation: every record is scoped to a `school_id` and access is enforced per request (see middleware + the IDOR isolation rule the team already tracks).
- Profile/data correction is available through the admin/teacher/student profile screens.

**Still to do (operational)**
- [ ] Offer schools a **written FERPA agreement** (often folded into the DPA) confirming the school-official role and the no-re-disclosure / no-secondary-use commitments.
- [ ] Document a data-access & correction process for parents (routed through the school).
- [ ] Document data-deletion on contract termination.

---

## 2. COPPA — Children's Online Privacy Protection Act (US, under-13)

**Applies because:** students under 13 use the platform.

**What it requires**
- Verifiable **parental consent** before collecting personal info from a child under 13.
- The **school-consent exception:** a school may consent **on behalf of parents** when the service is used **solely for an educational purpose** and there is no commercial use of the data.
- Clear notice of what's collected, data minimization, and reasonable security.

**How Spoken Edge is positioned**
- Rely on the **school-consent model**: schools (not Spoken Edge directly) onboard students, and consent is obtained by the school. Make this explicit in the contract.
- **Collect only what's needed** (data minimization): name, school-issued ID, grade, preferred language, guardian contact. Avoid collecting anything not required for the educational function.
- No behavioral advertising; no selling data.

**Still to do (operational)**
- [ ] State the school-consent reliance in the Terms/DPA and Privacy Policy.
- [ ] Provide schools the info they need to give parents notice (what's collected, why, retention).
- [ ] Confirm registration flows don't collect more child data than necessary.

---

## 3. GDPR — General Data Protection Regulation (EU) & UK GDPR

**Applies because:** any students/teachers/schools in the EU/EEA/UK (or if you market there).

**What it requires**
- A lawful basis for processing; for schools this is typically **public task / legitimate interest**, with the **school as controller** and **Spoken Edge as processor**.
- A **Data Processing Agreement (Art. 28)** between each school (controller) and Spoken Edge (processor).
- Data-subject rights: **access, rectification, erasure ("right to be forgotten"), restriction, portability, objection.**
- **Children's data** gets special protection (Art. 8) — consent age varies 13–16 by member state; in schools this is handled through the controller.
- **Breach notification within 72 hours** to the supervisory authority.
- **International transfer** safeguards (Standard Contractual Clauses) if EU data leaves the EEA (e.g., to US-based Stripe/Google or your hosting).
- **Records of processing** and **privacy by design / by default**.

**How Spoken Edge is positioned**
- Act as **processor**; only process data per the school's documented instructions.
- Maintain a list of **sub-processors** (see §7) and pass GDPR obligations down to them (Stripe and Google both offer DPAs + SCCs).
- Support erasure/export via account deletion and data export tooling.

**Still to do (operational)**
- [ ] Publish a **DPA** offered to every school, listing sub-processors and SCCs.
- [ ] Implement/verify **data export** and **hard-delete** flows for erasure requests.
- [ ] Maintain a **Record of Processing Activities (RoPA)**.
- [ ] Define and rehearse the **72-hour breach notification** procedure.
- [ ] Confirm hosting region & transfer mechanism (SCCs) for EU customers.

---

## 4. CCPA / CPRA — California Consumer Privacy Act / Privacy Rights Act (US)

**Applies because:** California schools, families, or staff may use the platform (thresholds apply to the business, but plan for it).

**What it requires**
- Disclose categories of personal info collected and the purpose.
- Consumer rights: **know, delete, correct, opt out of "sale"/"sharing."**
- **Service-provider** contractual terms that prohibit using data for any purpose other than the service.
- Note: there are exemptions where data overlaps with FERPA, but the safest posture is to honor the rights regardless.

**How Spoken Edge is positioned**
- Operate as a **"service provider"** (the CCPA analog of a processor) under contract — **no sale, no sharing** of personal information.

**Still to do (operational)**
- [ ] Add CCPA "service provider" language to the Terms/DPA.
- [ ] Ensure the Privacy Policy lists data categories + purposes and a rights-request channel.

---

## 5. PCI DSS — Payment Card Industry Data Security Standard

**Applies because:** schools pay subscriptions; payments are processed by **Stripe**.

**What it requires**
- Anyone storing, processing, or transmitting cardholder data must meet PCI DSS.
- Using a tokenized, hosted processor (Stripe Checkout / Elements) dramatically **reduces scope** to the simplest self-assessment, **SAQ A**.

**How Spoken Edge is positioned**
- **Never** store, log, or transmit raw card numbers — Stripe handles all cardholder data; the app only keeps Stripe IDs (`stripe_subscription_id`, etc.) and metadata.
- This keeps Spoken Edge in **SAQ-A scope** (the lightest tier).

**Still to do (operational)**
- [ ] Verify no card data ever touches the backend or logs.
- [ ] Complete the annual **SAQ A** self-assessment.
- [ ] Serve all payment pages over TLS (HTTPS) only.

---

## 6. Google Cloud / Translation & Speech API Terms

**Applies because:** the core feature uses Google for translation (and speech-to-text).

**What it requires / to confirm**
- Comply with the **Google Cloud Platform Terms** and **Translation/Speech API** acceptable use.
- Confirm whether the chosen Google products are covered by Google's **Data Processing and Security Terms** and **do not use customer content to train** their models (Cloud APIs generally do not train on customer data — verify for the exact products in use).
- Attribution requirements ("Powered by Google Translate") where applicable.
- Respect rate limits and quota; don't expose API keys client-side.

**Still to do (operational)**
- [ ] Confirm the exact Google products used and accept their DPA.
- [ ] List Google as a **sub-processor** (§7).
- [ ] Verify API keys are server-side only and scoped/least-privilege.
- [ ] Add required attribution in the UI where translations are shown.

---

## 7. Sub-processors

Spoken Edge relies on third parties that process personal data on its behalf. Maintain this list publicly and notify schools of changes.

| Sub-processor | Purpose | Data shared | Compliance docs to hold |
|---|---|---|---|
| **Stripe** | Subscription billing / payments | Billing contact, Stripe IDs (no card data stored by us) | Stripe DPA, PCI attestation |
| **Google Cloud** (Translation / Speech) | Real-time translation & speech-to-text | Message text / transcribed speech to translate | Google Cloud DPA + SCCs |
| **Hosting provider** (e.g., Railway / cloud host) | Application + database hosting | All stored personal data | Provider DPA, region, SCCs if EU |
| **Email/notification provider** (if used) | Transactional email (password reset, etc.) | Email address, name | Provider DPA |

> Update this table to reflect the exact services and regions actually in use.

---

## 8. Accessibility — WCAG 2.1 AA / ADA / Section 508

**Applies because:** schools (especially US public schools) are frequently required to procure software that meets **WCAG 2.1 Level AA** (ADA Title II/III, Section 508).

**What it requires**
- Perceivable, Operable, Understandable, Robust content (the WCAG "POUR" principles): sufficient color contrast, keyboard operability, focus indicators, alt text, ARIA labels on interactive controls, screen-reader support, and respect for reduced-motion preferences.

**How Spoken Edge is positioned (in progress)**
- Recent UI work added: WCAG-AA-compliant badge contrast, ARIA labels on the live-conversation mic button, consistent focus rings, and shared accessible state components.
- Outstanding items tracked in the UI/UX backlog: `prefers-reduced-motion` support, full keyboard-nav audit, and an automated accessibility scan.

**Still to do (operational)**
- [ ] Run an automated audit (axe / Lighthouse) and a manual screen-reader pass.
- [ ] Add `prefers-reduced-motion` handling for animations.
- [ ] Produce a **VPAT / Accessibility Conformance Report** for school procurement.

---

## 9. Data security practices (cross-cutting)

These underpin every regulation above.

- **Tenant isolation:** every query scoped by `school_id`; per-request authorization to prevent cross-tenant access (IDOR).
- **Authentication:** hashed passwords (strong password policy enforced front- and back-end), JWT-based sessions, role-based authorization (`super admin` / `admin` / `teacher` / `student`).
- **Transport security:** TLS/HTTPS everywhere; no secrets or card data in logs.
- **Least privilege:** API keys server-side only; scoped DB credentials.
- **Audit logging:** administrative actions recorded (audit-log feature) for accountability.
- **Data minimization & retention:** collect only what the educational function needs; archive/reset usage per billing period; delete on contract end.

**Still to do (operational)**
- [ ] Document a **data retention & deletion schedule** (per data type).
- [ ] Define an **incident response / breach-notification** runbook (ties to GDPR 72-hour rule).
- [ ] Encrypt sensitive data at rest (DB-level/disk) and confirm backups are encrypted.
- [ ] Periodic access reviews and dependency/security scanning.

---

## 10. Required user-facing documents

| Document | Status | Notes |
|---|---|---|
| **Privacy Policy** | Drafted in-app (`/privacy`) | Must list data categories, purposes, sub-processors, rights, retention |
| **Terms of Service** | Drafted in-app (`/terms`) | Includes acceptable use, billing, liability, termination |
| **Data Processing Agreement (DPA)** | ☐ To create | Offered to every school; school = controller, Spoken Edge = processor; lists sub-processors + SCCs |
| **FERPA/COPPA school agreement** | ☐ To create | Can be folded into the DPA; confirms school-official role + school consent |
| **Sub-processor list** | ☐ Publish | Keep current; notify schools of changes (§7) |
| **VPAT / Accessibility report** | ☐ To create | For school procurement (§8) |
| **Cookie/Tracking notice** | ☐ Confirm | Only if non-essential cookies/analytics are used |

---

## 11. Pre-launch compliance checklist (summary)

- [ ] Privacy Policy & Terms of Service finalized and legally reviewed
- [ ] DPA (with FERPA/COPPA + GDPR Art. 28 terms) offered to schools
- [ ] Sub-processor list published; Stripe & Google DPAs/SCCs in place
- [ ] PCI SAQ A completed; confirmed no card data stored
- [ ] Data export + hard-delete (erasure) flows working
- [ ] Retention & deletion schedule documented
- [ ] Incident-response / 72-hour breach runbook written
- [ ] Accessibility audit done + VPAT produced
- [ ] EU hosting region & transfer mechanism confirmed (if serving EU)
- [ ] Google Translate attribution shown in UI where required

---

### Disclaimer
This document is an engineering/product reference summarizing how Spoken Edge approaches compliance. It is **not legal advice** and does not create any warranty of compliance. Regulations change and apply differently by jurisdiction and contract — obtain qualified legal counsel before relying on any statement here.
