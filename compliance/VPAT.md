# Accessibility Conformance Report (VPAT) — Spoken Edge

> **Skeleton / work in progress.** A VPAT (Voluntary Product Accessibility Template) documents how a product conforms to accessibility standards. Schools — especially US public institutions — often require this for procurement. Complete the conformance levels after an automated (axe / Lighthouse) **and** manual screen-reader audit. This draft must not be presented as a final report until verified.

**Product:** Spoken Edge
**Version:** `[product version]`
**Report date:** `[date]`
**Standards evaluated:** WCAG 2.1 Level A & AA; Section 508 (Revised); EN 301 549
**Evaluation methods:** `[automated tools used]`, `[manual / assistive-technology testing]`

## Conformance levels (key)
- **Supports** — meets the criterion
- **Partially Supports** — some functionality does not meet the criterion
- **Does Not Support** — majority of functionality does not meet
- **Not Applicable** — criterion does not apply

---

## WCAG 2.1 Level A & AA — summary

| Criterion | Level | Conformance | Notes |
|-----------|-------|-------------|-------|
| 1.1.1 Non-text Content (alt text) | A | `[ ]` | Profile images have alt text; verify all icons/controls |
| 1.3.1 Info & Relationships | A | `[ ]` | Semantic headings, labels, table structure |
| 1.4.3 Contrast (Minimum) | AA | **Supports** | Role/status badges updated to AA-compliant contrast |
| 1.4.11 Non-text Contrast | AA | `[ ]` | Verify UI control / focus-ring contrast |
| 2.1.1 Keyboard | A | `[ ]` | Full keyboard-nav audit pending |
| 2.4.3 Focus Order | A | `[ ]` | Verify logical focus order in modals/dropdowns |
| 2.4.7 Focus Visible | AA | **Supports** | Global `:focus-visible` ring applied |
| 2.5.x Pointer/Target size | AA | `[ ]` | Verify touch target sizes |
| 3.2.x Predictable | AA | `[ ]` | Consistent navigation across roles |
| 3.3.1 Error Identification | A | `[ ]` | Form errors shown; ensure programmatic association |
| 3.3.2 Labels or Instructions | A | `[ ]` | Inputs labeled; verify all forms |
| 4.1.2 Name, Role, Value | A | `[ ]` | ARIA labels added (e.g., live-conversation mic button); verify all interactive controls |
| 4.1.3 Status Messages | AA | `[ ]` | Verify toasts/alerts use `role="status"`/`aria-live` |

> Fill each `[ ]` with Supports / Partially Supports / Does Not Support after testing.

## Known gaps / roadmap
- [ ] `prefers-reduced-motion` support for animations (float, fade, pulse)
- [ ] Full keyboard-navigation pass (modals, dropdowns, live conversation)
- [ ] Screen-reader pass (VoiceOver / NVDA) on core flows
- [ ] `aria-live` on toast notifications and connection-status changes
- [ ] Automated CI accessibility scan (axe) wired into the build

## Already addressed
- WCAG-AA color contrast on role/status badges
- ARIA labels + `aria-pressed` on the live-conversation microphone control
- Consistent visible focus indicators (`:focus-visible` ring) and accessible shared state components (loading / empty / error)

---

*Contact for accessibility questions: `[email]`.*
