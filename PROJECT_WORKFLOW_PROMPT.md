# Spoken Edge — Complete Project & Workflow Prompt

> A full specification of the application — product, roles, data model, every workflow, billing/renewal, real-time features, i18n, design system, and deployment. Use it to brief a developer, onboard an AI assistant, or rebuild the system. Last updated: 2026-06-16.

---

## 1. Product
**Spoken Edge** is a **multi-tenant SaaS for schools** that lets **teachers and students communicate across languages** in two ways:
1. **Messaging (chat):** text conversations that are automatically translated to each person's language.
2. **Live conversation:** a real-time, split-screen translated session (speech → text → translation → spoken aloud).

Each **school** is an isolated tenant. The platform owner ("Super Admin") sells/administers schools; each school has its own admins, teachers, and students.

---

## 2. Tech stack (do not swap)
- **Frontend:** React (Vite, JSX) + **Tailwind CSS v4** (tokens live in the `@theme` block in `src/index.css`, NOT tailwind.config.js), `recharts`, `lucide-react`, `react-hot-toast`, `react-i18next` (incl. RTL), `react-router-dom`, `socket.io-client`.
- **Backend:** Node.js + Express, **PostgreSQL** (`pg`), JWT auth (`jsonwebtoken`), `bcrypt`, **Stripe** (recurring subscriptions + webhooks), **Google Cloud Translation + Text-to-Speech**, **Socket.io** (live sessions + notifications).
- **Auth:** JWT bearer token; payload `{ id, email, firstName, lastName, role, status, school_id, is_super_admin }`.

---

## 3. Roles & permissions
| Role | Scope | Can do |
|---|---|---|
| **super admin** | Whole platform; `school_id = null`, `is_super_admin = true` | Manage all schools (create/edit/**delete**), billing/subscriptions, analytics, audit logs, the global language catalog |
| **admin** (school admin) | One school | Approve/deny sign-ups, manage that school's teachers/students/admins, edit school profile, view that school's billing |
| **teacher** | One school | Message students, run live translated conversations, send group messages |
| **student** (often used by a **parent/guardian**) | One school | Chat with teachers, join live conversations; uses the student's **preferred language** (with RTL support) |

**Multi-tenant rule (critical):** every data query for non-super-admins is scoped by `school_id`. Never return or mutate another school's data.

---

## 4. Data model (PostgreSQL)
- **schools** — `id, name, contact_email, contact_number, street_address, city, state, zip_code, logo_url, status('active'|'suspended'|'trial'), plan_tier('basic'|'pro'|'enterprise'), features(jsonb), max_students, max_teachers, minutes_limit, minutes_used, translation_chars_limit/used, tts_chars_limit/used, monthly_price, subscription_status('none'|'trialing'|'active'|'past_due'|'canceled'), valid_until, next_renewal_at, free_access(bool), stripe_customer_id, stripe_subscription_id`.
- **users** — `id, email, password_hash, first_name, last_name, username, role, status('pending'|'approved'|'active'|'denied'), phone, profile_image, about, school_id(FK), approved_by, approved_at`.
- **teacher_profiles / student_profiles** — `user_id(FK, cascade)`; student has `grade_id, guardian_name, guardian_relation, preferred_language_id`.
- **grades** — per-school grade levels.
- **languages** — `id, name, code, speech_code, tts_premium(bool=voice), is_active, voice_name, voice_gender` (currently **192 total, 55 with voice**).
- **school_languages** — which languages a school enabled (`school_id`+`language_id`, cascade).
- **conversations** — `student_id, teacher_id, subject, last_message_*, teacher_unread_count, student_unread_count, *_last_read_at`.
- **messages** — `conversation_id(cascade), sender_id(SET NULL), sender_name, content, translated_content, sent_at`.
- **subscription_logs** — payment/invoice history per school.
- **payment_links** — short codes for shareable checkout links.
- **sessions** — live conversation sessions (`teacher_id, student_id, school_id(cascade), status, duration`).
- **school_usage_history** — archived usage per billing/trial period.
- **audit_logs** — admin actions (`user_id SET NULL, action, resource_type, resource_id, details, ip`).
- **notifications**, **password_reset_tokens**.

---

## 5. WORKFLOWS (the core of the system)

### 5.1 Registration → Approval → Login
1. **Register** (`/register`, parent/student or teacher tab): collects name, IDs, school, grade/preferred language (student), guardian info (student), email, phone `(000) 000 0000`, password (policy: ≥8 + upper + lower + number + special). New user is created with **`status='pending'`**.
2. **Admin approval:** the school admin sees pending users (`/admin/approvals`) and approves/denies. Approve → `status='approved'`; the action is school-scoped and audit-logged.
3. **Login** (`/login`): only `approved`/`active`/`allowed` may log in. On first login after approval, status auto-flips `approved → active`. A JWT is issued and the user is routed to their role dashboard.

### 5.2 Access gating (every protected request)
Middleware order on protected routes: `protect` (verify JWT) → `authorize(role)` → `requireSchoolActive` → `requireSchoolValid`.
- **requireSchoolActive:** blocks if the school's `status !== 'active'` (super admin bypasses).
- **requireSchoolValid:** allows if `free_access = true`; else requires a non-expired `valid_until` (NULL → "not activated yet"; past → "expired"). Super admin bypasses.

### 5.3 School lifecycle (super admin)
- **Create** (multi-step wizard): Step 1 details (name, **Email**, **Contact No.**, **USA address**: street/city/searchable **State**/ZIP) → Step 2 plan & limits → Step 3 languages → Step 4 initial admin (creates the admin user + sends a welcome/password-set email) → Step 5 activate billing (free / trial / paid checkout). All in one DB transaction.
- **Edit:** super-admin `SchoolDetails` (full fields incl. status, plan, limits, address) and admin `SchoolDetails` (name/email/contact/address/logo only).
- **Delete:** **type-to-confirm** (must type the exact school name) → transactional cascade that removes the school AND all its data (users → cascades profiles/conversations/messages/sessions/notifications; plus subscription_logs, payment_links, school_languages, usage history). Audit-logged.

### 5.4 Billing, payments & **monthly auto-renewal**
- **Suggested price:** `round((translation_chars/1M × $20 + tts_chars/1M × $4) × 4.5)`.
- **Paid checkout:** creates a **recurring Stripe subscription** (`mode:'subscription'`, monthly price). Returns a hosted Checkout URL / shareable short link.
- **Webhook** (`POST /api/stripe/webhook`, raw body, **signature-verified**) handles: `checkout.session.completed` (store stripe ids, set active), `invoice.paid`/`invoice.payment_succeeded` (log payment, **roll `valid_until` + `next_renewal_at` forward = auto-renewal**, reset usage), `invoice.payment_failed` (`past_due`), `customer.subscription.updated/deleted` (sync/cancel). Idempotent on invoice id.
- **Auto-renewal:** fully automatic for Stripe-subscription schools **as long as the webhook endpoint is registered in Stripe and reachable** (there is no internal cron — renewals are webhook-driven; Stripe retries failed deliveries ~3 days).
- **Free access / trial / revoke** (`grantAccess`): free = unlimited comp (`free_access=true`); trial = `valid_until = now + N days`; revoke = clears comp/trial (snapshots usage first). Trials/free do **not** auto-renew.
- **Usage metering:** `minutes_used`, `translation_chars_used`, `tts_chars_used` tracked vs limits; `snapshotAndResetUsage()` archives a period to `school_usage_history` then zeroes counters (on paid period, trial/free grant, revoke, manual reset).
- **Billing displays:** admin `Billing` shows active/trial/past-due/**complimentary** states; super-admin `Billing` shows MRR / revenue / renewals / past-due (complimentary schools are excluded from MRR).
- **Manual payments:** `AddPaymentModal` records one-off payments (not Stripe-linked).

### 5.5 Conversations & messaging (with translation)
- **Create conversation** (teacher↔student, same school). **Send message:** stored as `content` (source) + `translated_content` (recipient's language) via Google Translate; quota-enforced with graceful fallback. Unread counts update; `new_message` emitted over socket; `markAsRead` clears unread.

### 5.6 Live conversation (real-time, sockets)
- Teacher invites a student → student `accept`/`decline` → live split-screen session: each speech turn is transcribed, translated, displayed, and spoken (TTS). `end_session` records the **minutes** against the school's usage. States: waiting / connected / ended.
- *(Known hardening gaps: no invite timeout, limited mid-session disconnect recovery, no teacher-refresh recovery.)*

### 5.7 Group message
Teacher selects grades/students and sends **one message translated per-recipient** into each student's preferred language (sequential send; school-scoped).

### 5.8 Teacher/Student/Admin management
List / search / paginate / edit / delete (school-scoped); detail pages with breadcrumbs + back button; profile image upload/crop.

### 5.9 Language catalog (super admin)
"Language Management" imports languages from the Google catalog, toggles active, and detects voice support (`tts_premium`). Schools pick their enabled subset. Help & Support shows the live count (**192 languages / 55 voice**) in a searchable table.

### 5.10 Supporting
Profiles, Change Password (with live requirements checklist matching Reset/Register), Help & Support, Audit Logs (super admin), Notifications (header bell + global incoming-invite modal), 404 page.

---

## 6. Validation rules (shared, enforced front + back)
- **Phone:** US format `(000) 000 0000` — only digits accepted, formats live, errors if incomplete (`utils/validation.js` `formatPhone`/`isValidPhone`; backend Joi requires 10 digits).
- **Password:** ≥8 chars + uppercase + lowercase + number + special.
- **Email:** standard email format. **ZIP:** US `12345` or `12345-6789`.
- **Names:** letters only. **Username/IDs:** alphanumeric + `._-`.

---

## 7. Design system (Minimal Enterprise)
- **Palette:** slate neutrals + single blue accent `primary-600 #2563eb` (full 50–950 scale); semantic success/warning/danger/info; **no gradients on functional UI**.
- **Surfaces:** page `bg-app-bg` (#f1f5f9); cards `bg-white rounded-xl border border-slate-200 shadow-sm`; nested panels `slate-50`.
- **Typography:** Inter (global); page title `text-xl font-semibold tracking-tight`; labels with leading lucide icons; one type scale.
- **Radius:** controls `rounded-lg` (8px), cards/modals `rounded-xl` (12px), pills/avatars `rounded-full`.
- **Dark mode:** `.dark` class toggled from the header, persisted in `localStorage` (`spoken-edge-theme`), initialized in `main.jsx` before render; tokens + fallback CSS in `index.css`.
- **Component kit** (`src/components/common/`): `Button`, `Card`, `Badge`, `FormField`, `Pagination`, `PageHeader`, `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmDialog`, `CustomDropdown` (searchable, `matchTextInput`/`surfaceClassName`/`disabledClassName`), per-role sidebars, `Header`, `DashboardLayout`; helper classes `app-card`, `app-table`, `app-icon-tile`, `app-eyebrow`, `app-section-title`, `app-date-pill`, `sidebar-link*`.
- **Shell:** white header (`h-16`, sticky), collapsible white sidebar with a blue left-bar active state + mobile drawer.

---

## 8. Deployment & configuration
**Backend env:** `PORT`, `DB_HOST/PORT/NAME/USER/PASSWORD`, `JWT_SECRET`, `STRIPE_SECRET_KEY` (live: `sk_live_…`), `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (per-endpoint signing secret), `FRONTEND_URL` (checkout success/cancel redirects), Google Cloud credentials (Translation + TTS), support email/phone.
**Frontend env:** `VITE_API_URL`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_PHONE`, optional Stripe publishable key.
**Stripe (production):** register the webhook in the Dashboard → `https://<backend>/api/stripe/webhook` with events `checkout.session.completed, invoice.paid, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted`; set `STRIPE_WEBHOOK_SECRET` to that endpoint's signing secret; use live keys. The raw-body middleware for the webhook is already wired. **No code change needed for auto-renewal — only this config.**
**Local Stripe testing:** `stripe listen --forward-to localhost:5001/api/stripe/webhook`.

---

## 9. Known hardening backlog (optional, not blocking)
- Registration should reject a missing/invalid `schoolId` (currently can fall back to a default/null school).
- New schools are created `status='active'` before payment (an "active-but-gated" window) — consider a `pending` status.
- Live conversation: add invite timeout, reconnect/disconnect handling, teacher-refresh recovery.
- Optional daily reconciliation cron as a safety net behind Stripe webhooks.
- Finish per-page dark-mode `dark:` classes (most pages currently rely on global fallback CSS).

---

## 10. Build/extend instructions for an AI or developer
- Keep the stack and the Tailwind v4 `@theme` token approach.
- Enforce `school_id` isolation on **every** non-super-admin query.
- Reuse the shared validators (`utils/validation.js`, backend `middleware/validation.js`) and the component kit — do not create one-off variants.
- Presentational changes must not alter routes, data shapes, i18n keys, or validation.
- After any change, ensure `npm run build` (frontend) and `node -c` (backend files) pass, and that Stripe stays in the correct (test vs live) mode.
