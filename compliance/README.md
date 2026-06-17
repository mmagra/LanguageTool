# Compliance — Spoken Edge

This folder holds all compliance, privacy, and data-protection documentation for **Spoken Edge** (a multi-tenant SaaS platform for live translated teacher↔student conversations, sold to schools, handling minors' data).

> **Not legal advice.** These documents are an engineering/product reference and starting point for legal review. Have a qualified attorney review final policies and agreements before launch.

**Last updated:** 2026-06-11

## Contents

| File | What it is |
|------|------------|
| [COMPLIANCE-GUIDE.md](COMPLIANCE-GUIDE.md) | The master guide — every regulation that applies (FERPA, COPPA, GDPR, CCPA/CPRA, PCI DSS, Google API, accessibility), what each requires, how Spoken Edge meets it, and what's still to do. |
| [SUB-PROCESSORS.md](SUB-PROCESSORS.md) | Public list of third parties that process personal data (Stripe, Google, hosting, email) + data shared and required agreements. |
| [DPA-TEMPLATE.md](DPA-TEMPLATE.md) | Data Processing Agreement template offered to every school (school = controller, Spoken Edge = processor). Covers GDPR Art. 28 + FERPA/COPPA terms. |
| [VPAT.md](VPAT.md) | Accessibility Conformance Report (VPAT) skeleton for WCAG 2.1 AA / ADA / Section 508 — used in school procurement. |
| [PRE-LAUNCH-CHECKLIST.md](PRE-LAUNCH-CHECKLIST.md) | One-glance checklist of everything that must be done before going live. |

## Regulations at a glance

| Regulation | Region | Why it applies | Spoken Edge role |
|------------|--------|----------------|------------------|
| **FERPA** | US | Schools share student education records | School official / service provider |
| **COPPA** | US | Students under 13 | Relies on school consent |
| **GDPR / UK GDPR** | EU / UK | EU students, teachers, schools | Data **processor** (school = controller) |
| **CCPA / CPRA** | California | CA families/staff | Service provider (no sale/share) |
| **PCI DSS** | Global | Subscription payments | SAQ-A scope via Stripe |
| **Google Cloud / Translation API** | Global | Core translation feature | Customer; Google is sub-processor |
| **WCAG 2.1 AA / ADA / 508** | US (+global) | School procurement requirements | Conformance target |

See [COMPLIANCE-GUIDE.md](COMPLIANCE-GUIDE.md) for the full detail on each.
