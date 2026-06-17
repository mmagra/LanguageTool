# Sub-processors — Spoken Edge

Spoken Edge uses the third-party services below to process personal data on behalf of schools (the data controllers). Keep this list current and **notify schools in advance** of any additions or changes.

**Last updated:** 2026-06-11

| Sub-processor | Purpose | Personal data shared | Region(s) | Agreements to hold |
|---------------|---------|----------------------|-----------|--------------------|
| **Stripe, Inc.** | Subscription billing & payment processing | Billing contact name/email, Stripe customer & subscription IDs. **No card data is stored by Spoken Edge** — Stripe handles all cardholder data. | US (global) | Stripe DPA, PCI DSS attestation, SCCs |
| **Google Cloud** (Cloud Translation / Speech-to-Text) | Real-time translation and speech-to-text for live conversations | Message text and transcribed speech submitted for translation | US / configurable | Google Cloud DPA, SCCs |
| **Hosting provider** *(e.g., Railway / cloud host — confirm)* | Application server & PostgreSQL database hosting | All stored personal data (profiles, messages, usage, billing metadata) | *Confirm region* | Provider DPA, SCCs (if EU data) |
| **Email / notification provider** *(if used — confirm)* | Transactional email (password reset, invites, notifications) | Email address, name | *Confirm* | Provider DPA |

## Notes
- **No card data** ever reaches the Spoken Edge backend, logs, or database — only Stripe identifiers and billing metadata are stored. This keeps payment handling in **PCI DSS SAQ-A** scope.
- Google Cloud APIs are configured **not to use customer content to train** Google's models — confirm this for the exact products in use and retain the Google DPA.
- For EU/UK customers, confirm the **hosting region** and that **Standard Contractual Clauses (SCCs)** are in place for any transfer outside the EEA.

## Change process
1. Before adding/replacing a sub-processor, confirm it offers a DPA (and SCCs if it processes EU data).
2. Update this file (and the table in [COMPLIANCE-GUIDE.md](COMPLIANCE-GUIDE.md) §7).
3. Notify schools per the DPA's sub-processor change-notice clause.

> **Action items:** confirm the exact hosting and email providers and their regions, then replace the *italicized placeholders* above.
