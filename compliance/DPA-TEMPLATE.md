# Data Processing Agreement (DPA) — Template

> **Template / not legal advice.** This is a starting draft to be reviewed and finalized by qualified legal counsel before use. Bracketed `[…]` fields must be completed. This DPA is offered to every school customer and forms part of the agreement between the School and Spoken Edge.

**Between:**
- **`[School / District legal name]`** ("**Customer**" / "**Controller**"), and
- **`[Spoken Edge legal entity name]`** ("**Processor**" / "**Provider**").

Effective date: `[date]`

---

## 1. Definitions
Terms such as "personal data," "processing," "controller," "processor," "data subject," and "sub-processor" have the meanings given in **GDPR** (and equivalents under **FERPA**, **COPPA**, and **CCPA/CPRA** as applicable). "Education records" has the meaning given in **FERPA (34 CFR Part 99)**.

## 2. Roles
The Customer is the **Controller** (and, under FERPA, the educational institution). Spoken Edge is the **Processor / service provider** and, under FERPA, acts as a **"school official"** performing an institutional service under the Customer's direct control. Spoken Edge processes personal data **only on the documented instructions** of the Customer.

## 3. Subject matter & purpose
Spoken Edge processes personal data solely to provide the Service: enabling live translated conversations and messaging between teachers and students, account management, usage metering, and billing. **No other use is permitted.**

## 4. Categories of data & data subjects
- **Data subjects:** students (including minors), teachers, school administrators.
- **Personal data:** names, school-issued IDs, grade/level, preferred language, guardian name & contact, email, phone, message content and translated content, transcribed speech, usage metrics, and billing metadata (no card data).

## 5. Processor obligations
Spoken Edge shall:
1. Process personal data only per the Customer's documented instructions.
2. **Not** use personal data for advertising, profiling, model training, or any secondary purpose; **not sell or share** it (CCPA/CPRA) and **not re-disclose** it (FERPA).
3. Ensure personnel are bound by confidentiality.
4. Implement appropriate **technical and organizational security measures** (see §9).
5. Assist the Customer with data-subject rights requests and with breach, DPIA, and regulator obligations.
6. Make available information needed to demonstrate compliance.

## 6. COPPA / children's data
Where students under 13 (US) or below the applicable GDPR age use the Service, the **Customer obtains and maintains the necessary consent** (relying on the school-consent exception under COPPA / the controller's lawful basis under GDPR). Spoken Edge collects only data necessary for the educational function (data minimization).

## 7. Sub-processors
The Customer authorizes the sub-processors listed in **[SUB-PROCESSORS.md](SUB-PROCESSORS.md)**. Spoken Edge will (a) impose data-protection terms on each sub-processor no less protective than this DPA, (b) remain liable for their performance, and (c) give the Customer **prior notice** of changes with a chance to object.

## 8. International transfers
Where personal data is transferred outside the EEA/UK, the parties rely on **Standard Contractual Clauses** (and any required supplementary measures). Hosting region: `[region]`.

## 9. Security measures
Including, at minimum: tenant isolation by `school_id` with per-request authorization; hashed passwords and role-based access control; TLS/HTTPS in transit; encryption at rest for sensitive data; least-privilege credentials and server-side API keys; audit logging of administrative actions; and regular access reviews. (See [COMPLIANCE-GUIDE.md](COMPLIANCE-GUIDE.md) §9.)

## 10. Personal data breach
Spoken Edge will notify the Customer **without undue delay** after becoming aware of a personal data breach, and in any case in time to support the Customer's **GDPR 72-hour** regulator-notification obligation, providing the information reasonably required to respond.

## 11. Data subject rights
Spoken Edge will provide tooling and/or assistance to enable the Customer to fulfill **access, rectification, erasure, restriction, portability, and objection** requests, including **data export** and **deletion** functions.

## 12. Return & deletion
On termination or expiry, Spoken Edge will, at the Customer's choice, **delete or return** all personal data within `[e.g., 30/60/90]` days, except where retention is legally required.

## 13. Audit
Spoken Edge will make available compliance information and, subject to reasonable notice and confidentiality, support audits as required by applicable law.

## 14. Term
This DPA remains in effect for the duration of the Service agreement and survives until all personal data is deleted or returned.

---

**Signatures**

| Customer (Controller) | Provider (Processor) |
|---|---|
| Name: `[…]` | Name: `[…]` |
| Title: `[…]` | Title: `[…]` |
| Date: `[…]` | Date: `[…]` |
