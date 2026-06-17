# Pre-Launch Compliance Checklist — Spoken Edge

A single-glance list of everything to complete before going live. Detail for each item is in [COMPLIANCE-GUIDE.md](COMPLIANCE-GUIDE.md).

**Last updated:** 2026-06-11

## Legal documents
- [ ] **Privacy Policy** finalized & legally reviewed (in-app at `/privacy`)
- [ ] **Terms of Service** finalized & legally reviewed (in-app at `/terms`)
- [ ] **DPA** finalized from [DPA-TEMPLATE.md](DPA-TEMPLATE.md) and offered to every school
- [ ] FERPA "school official" + COPPA "school consent" terms included (in DPA or ToS)
- [ ] CCPA/CPRA "service provider" language included

## Privacy & data rights
- [ ] Data **export** flow working (portability/access)
- [ ] **Hard-delete** / erasure flow working
- [ ] **Retention & deletion schedule** documented (per data type)
- [ ] Record of Processing Activities (RoPA) maintained
- [ ] Data-correction path for parents/students documented (via school)

## Sub-processors & transfers
- [ ] [SUB-PROCESSORS.md](SUB-PROCESSORS.md) published and current
- [ ] Stripe DPA in place
- [ ] Google Cloud DPA in place; confirmed no model-training on customer data
- [ ] Hosting + email providers and **regions** confirmed
- [ ] SCCs in place for any EU/UK data transfer

## Payments (PCI DSS)
- [ ] Confirmed **no card data** touches backend, logs, or DB
- [ ] **SAQ A** self-assessment completed
- [ ] All payment pages served over HTTPS/TLS only

## Security
- [ ] Tenant isolation (`school_id`) verified on every endpoint (no IDOR)
- [ ] Passwords hashed; strong password policy enforced both sides
- [ ] Role-based authorization verified (`super admin` / `admin` / `teacher` / `student`)
- [ ] Encryption at rest for sensitive data + encrypted backups
- [ ] Server-side, least-privilege API keys (no client-side secrets)
- [ ] Audit logging of administrative actions enabled
- [ ] **Incident-response / 72-hour breach** runbook written & rehearsed

## Accessibility
- [ ] Automated audit (axe / Lighthouse) passed
- [ ] Manual screen-reader pass on core flows
- [ ] `prefers-reduced-motion` implemented
- [ ] **VPAT** completed from [VPAT.md](VPAT.md)

## Third-party feature terms
- [ ] Google Translate **attribution** shown in UI where required
- [ ] API rate limits / quotas handled gracefully

---

> Tip: keep this checklist under version control and re-review at every major release or when adding a sub-processor, a data field, or a new region.
