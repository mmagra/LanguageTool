import { Link } from 'react-router-dom';
import {
  FileText, Users, ShieldCheck, Ban, CreditCard, BarChart2,
  Database, Globe, Lock, Eye, Info, Scale, Shield, XCircle,
  Bell, Cog, Mail, ChevronRight, CheckCircle, AlertCircle, Building2
} from 'lucide-react';

const SUPPORT_EMAIL  = import.meta.env.VITE_SUPPORT_EMAIL || 'support@spokenedge.com';
const APP_NAME       = 'Spoken Edge';
const COMPANY_NAME   = 'Spoken Edge';
const EFFECTIVE_DATE = 'June 10, 2025';

const TOC = [
  { id: 's1',  label: 'Description of Service'      },
  { id: 's2',  label: 'Account Types & Access'       },
  { id: 's3',  label: 'Admin Responsibilities'       },
  { id: 's4',  label: 'Acceptable Use'               },
  { id: 's5',  label: 'Subscriptions & Billing'      },
  { id: 's6',  label: 'Usage Limits & Fair Use'      },
  { id: 's7',  label: 'Data Ownership & Licence'     },
  { id: 's8',  label: 'Third-Party Services'         },
  { id: 's9',  label: 'Privacy & Data Protection'    },
  { id: 's10', label: 'Confidentiality'              },
  { id: 's11', label: 'Warranties & Disclaimers'     },
  { id: 's12', label: 'Limitation of Liability'      },
  { id: 's13', label: 'Indemnification'              },
  { id: 's14', label: 'Term & Termination'           },
  { id: 's15', label: 'Governing Law'                },
  { id: 's16', label: 'Changes to These Terms'       },
  { id: 's17', label: 'General'                      },
  { id: 's18', label: 'Contact'                      },
];

/* ─── section card ───────────────────────────────────────────── */
const Section = ({ id, num, icon: Icon, iconBg, title, children }) => (
  <div id={id} className="scroll-mt-6 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-50">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{num}</p>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
    </div>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

/* ─── bullets ────────────────────────────────────────────────── */
const Li = ({ children }) => (
  <li className="flex items-start gap-2.5">
    <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </li>
);
const BanLi = ({ children }) => (
  <li className="flex items-start gap-2.5">
    <Ban size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </li>
);

/* ─── callout ────────────────────────────────────────────────── */
const Note = ({ color = 'amber', icon: Icon = AlertCircle, title, children }) => {
  const map = {
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    green:  'bg-green-50 border-green-200 text-green-800',
    red:    'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  const ic = { amber: 'text-amber-500', blue: 'text-blue-500', green: 'text-green-500', red: 'text-red-500', purple: 'text-purple-500' };
  return (
    <div className={`rounded-xl border px-4 py-3 ${map[color]}`}>
      <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1 ${ic[color]}`}>
        <Icon size={12} />{title}
      </p>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
};

/* ─── billing row ────────────────────────────────────────────── */
const BillingRow = ({ term, children }) => (
  <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold min-w-[80px] text-center flex-shrink-0 mt-0.5">{term}</span>
    <p className="text-xs text-slate-700 leading-relaxed">{children}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
const TermsOfService = () => (
  <div className="min-h-screen bg-slate-50 font-inter">

    {/* ── Top Nav ─────────────────────────────────────────────── */}
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors">
          <ChevronRight size={14} className="rotate-180" />Back to Login
        </Link>

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img
            src="/Spoken-Edge-Text-Logo-trans.png"
            alt={APP_NAME}
            className="h-14 w-auto object-contain"
            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span class="font-bold text-primary-600 text-lg">${APP_NAME}</span>`; }}
          />
        </Link>

        <Link to="/privacy" className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
          Privacy Policy<ChevronRight size={14} />
        </Link>
      </div>
    </header>

    {/* ── Page header ─────────────────────────────────────────── */}
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>
              <p className="text-slate-500 text-sm mt-0.5">The agreement governing use of the {APP_NAME} platform.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">Effective: {EFFECTIVE_DATE}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">FERPA & GDPR referenced</span>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">Stripe-powered billing</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── Body ────────────────────────────────────────────────── */}
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">

        {/* ── Sidebar TOC ──────────────────────────────────────── */}
        <aside className="hidden lg:block sticky top-20 self-start">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contents</p>
            <nav className="space-y-0.5">
              {TOC.map((item, i) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all group"
                >
                  <span className="font-mono font-bold text-slate-300 group-hover:text-primary-400 w-5 flex-shrink-0 text-xs">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium leading-snug">{item.label}</span>
                </a>
              ))}
            </nav>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link to="/privacy" className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline font-semibold">
                <Shield size={12} />Privacy Policy
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Sections ─────────────────────────────────────────── */}
        <div className="space-y-4 mt-0">

          {/* Intro */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              These Terms of Service ("<strong className="text-slate-900">Terms</strong>") constitute a legally binding agreement
              between <strong className="text-slate-900">{COMPANY_NAME}</strong> ("we", "us", "our") and the educational institution
              or individual ("you", "School") accessing or using the {APP_NAME} platform and related services (the "Service").
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              By creating an account, subscribing, or accessing the Service, you confirm you have read, understood, and agree
              to be bound by these Terms and our{' '}
              <Link to="/privacy" className="text-primary-600 hover:underline font-semibold">Privacy Policy</Link>.
              If you do not agree, do not use the Service.
            </p>
          </div>

          {/* 1 */}
          <Section id="s1" num="01" icon={FileText} iconBg="bg-primary-50 text-primary-600" title="Description of Service">
            <p>
              {APP_NAME} is a cloud-based educational platform that enables real-time language learning sessions between teachers
              and students. The Service includes live translation, text-to-speech, session management, school administration tools,
              and related features as made available from time to time.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Service with reasonable notice.
              We will notify school administrators of material changes via email at least 30 days in advance where practical.
            </p>
          </Section>

          {/* 2 */}
          <Section id="s2" num="02" icon={Users} iconBg="bg-blue-50 text-blue-600" title="Account Types and Access">
            <p>The Service provides four account roles with distinct permissions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
              {[
                { role: 'Super Admin',  bg: 'bg-red-50 border-red-100',       dot: 'bg-red-400',     desc: `${COMPANY_NAME} staff only — manages all schools, subscriptions, and platform configuration.` },
                { role: 'School Admin', bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500',  desc: 'Authorised institution representative — manages teachers, students, and school settings.' },
                { role: 'Teacher',      bg: 'bg-blue-50 border-blue-100',     dot: 'bg-blue-500',    desc: 'School staff member — conducts live language sessions with students.' },
                { role: 'Student',      bg: 'bg-green-50 border-green-100',   dot: 'bg-green-500',   desc: 'Learner enrolled at the institution — participates in sessions.' },
              ].map(r => (
                <div key={r.role} className={`rounded-xl border p-3.5 ${r.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dot}`} />
                    <span className="text-xs font-bold text-slate-900">{r.role}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{r.desc}</p>
                </div>
              ))}
            </div>
            <p className="pt-1">
              School Admins are responsible for ensuring all accounts created within their school comply with these Terms and
              all applicable laws, including those protecting minors.
            </p>
          </Section>

          {/* 3 */}
          <Section id="s3" num="03" icon={ShieldCheck} iconBg="bg-green-50 text-green-600" title="School Administrator Responsibilities">
            <p>By subscribing on behalf of an educational institution, the School Admin agrees to:</p>
            <ul className="space-y-1.5 mt-1">
              <Li>Have the authority to enter into these Terms on behalf of the institution</Li>
              <Li>Create student accounts in accordance with applicable laws (FERPA and COPPA for US schools)</Li>
              <Li>Obtain required parental consent before enrolling students, particularly those under 13</Li>
              <Li>Maintain accuracy of account information for all users in their school</Li>
              <Li>Promptly deactivate accounts for individuals who leave the institution</Li>
              <Li>Keep login credentials confidential and notify us of any suspected unauthorised access</Li>
              <Li>Not share school admin credentials with non-authorised individuals</Li>
            </ul>
          </Section>

          {/* 4 */}
          <Section id="s4" num="04" icon={Ban} iconBg="bg-red-50 text-red-500" title="Acceptable Use">
            <p>You agree to use the Service only for lawful educational purposes. You must <strong className="text-slate-800">not</strong>:</p>
            <ul className="space-y-1.5 mt-1">
              <BanLi>Transmit content that is abusive, harassing, defamatory, obscene, or otherwise objectionable</BanLi>
              <BanLi>Attempt to gain unauthorised access to any part of the Service, other accounts, or our infrastructure</BanLi>
              <BanLi>Reverse engineer, decompile, or attempt to extract the source code of the Service</BanLi>
              <BanLi>Use automated scripts, bots, or scrapers without written permission</BanLi>
              <BanLi>Upload or transmit malware, viruses, or any malicious code</BanLi>
              <BanLi>Infringe any third party's intellectual property, privacy, or other rights</BanLi>
              <BanLi>Resell, sublicense, or offer access to any party not enrolled at your institution</BanLi>
              <BanLi>Collect personal data beyond what is necessary for your educational purpose</BanLi>
            </ul>
            <Note color="red" icon={AlertCircle} title="Enforcement">
              We reserve the right to suspend or terminate accounts found in violation without prior notice.
            </Note>
          </Section>

          {/* 5 */}
          <Section id="s5" num="05" icon={CreditCard} iconBg="bg-green-50 text-green-600" title="Subscriptions and Billing">
            <div className="space-y-2.5">
              <BillingRow term="Plans">Access to the Service requires an active subscription, billed monthly at the agreed price. Prices are in USD and exclude applicable taxes.</BillingRow>
              <BillingRow term="Free trials">We may grant time-limited trial access at no charge. At the end of the trial, access is suspended unless a paid subscription is activated.</BillingRow>
              <BillingRow term="Payment">Payments are processed by Stripe. By subscribing, you authorise recurring monthly charges until cancelled. A valid payment method must be on file at all times.</BillingRow>
              <BillingRow term="Renewals">Subscriptions renew automatically each month. You will receive a renewal reminder before each charge and may cancel any time before renewal.</BillingRow>
              <BillingRow term="Cancellation">Cancellation takes effect at the end of the current billing period. You retain access until then. We do not refund partial periods unless required by law.</BillingRow>
              <BillingRow term="Overdue">If payment fails and is not resolved within 7 days, we may suspend access until payment is received.</BillingRow>
              <BillingRow term="Price change">We will provide at least 30 days' notice of any price change via email. Continued use after the new price takes effect constitutes acceptance.</BillingRow>
            </div>
          </Section>

          {/* 6 */}
          <Section id="s6" num="06" icon={BarChart2} iconBg="bg-primary-50 text-primary-600" title="Usage Limits and Fair Use">
            <p>
              Each subscription plan includes usage allocations for session minutes, translation characters, and text-to-speech
              characters as displayed in your school's dashboard. These allocations reset each billing period.
            </p>
            <p>
              If your school exceeds its allocated usage, we may contact you to discuss an upgraded plan. We will not charge
              overage fees without prior agreement. We reserve the right to throttle or suspend usage-based features if
              consumption significantly exceeds subscribed limits.
            </p>
          </Section>

          {/* 7 */}
          <Section id="s7" num="07" icon={Database} iconBg="bg-blue-50 text-blue-600" title="Data Ownership and Licence">
            <p>
              <strong className="text-slate-800">Your data</strong> — All content, student records, and data submitted by your
              school remains your property and the property of your institution. You grant us a limited, non-exclusive licence
              to process, store, and transmit that data solely as necessary to provide the Service.
            </p>
            <p>
              <strong className="text-slate-800">Data export and deletion</strong> — Upon request or termination, we will make your
              school's data available for export for up to 90 days, then permanently delete it. Contact{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 hover:underline">{SUPPORT_EMAIL}</a> to request an export.
            </p>
            <p>
              <strong className="text-slate-800">Our platform</strong> — {APP_NAME}, including its software, design, trademarks,
              and documentation, is owned by {COMPANY_NAME} and protected by intellectual property laws. Nothing in these Terms
              grants you ownership rights in the platform itself.
            </p>
          </Section>

          {/* 8 */}
          <Section id="s8" num="08" icon={Globe} iconBg="bg-indigo-50 text-indigo-600" title="Third-Party Services">
            <p>
              The Service integrates with third-party providers including Google Cloud (translation and text-to-speech) and Stripe
              (payment processing). Your use of these integrations is also subject to the relevant third-party terms of service.
              We are not responsible for the acts or omissions of third-party providers beyond our reasonable control.
            </p>
          </Section>

          {/* 9 */}
          <Section id="s9" num="09" icon={Lock} iconBg="bg-purple-50 text-purple-600" title="Privacy and Data Protection">
            <p>
              Our <Link to="/privacy" className="text-primary-600 hover:underline font-semibold">Privacy Policy</Link> describes
              how we collect, use, and protect personal information. It forms part of these Terms by reference.
            </p>
            <p>
              For US schools, we acknowledge our role as a "school official" under FERPA and agree to comply with applicable
              obligations regarding student education records.
            </p>
            <p>
              For EU/UK schools, we are willing to enter into a <strong className="text-slate-800">Data Processing Agreement (DPA)</strong> satisfying
              GDPR Article 28 requirements. Contact{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 hover:underline">{SUPPORT_EMAIL}</a> to request one.
            </p>
          </Section>

          {/* 10 */}
          <Section id="s10" num="10" icon={Eye} iconBg="bg-slate-100 text-slate-600" title="Confidentiality">
            <p>
              Each party agrees to keep confidential any non-public information disclosed by the other party that is designated
              as confidential or that reasonably should be understood to be confidential.
            </p>
            <p>
              This obligation does not apply to information that is: (a) publicly available, (b) independently developed, or
              (c) required to be disclosed by law or regulatory authority.
            </p>
          </Section>

          {/* 11 */}
          <Section id="s11" num="11" icon={Info} iconBg="bg-amber-50 text-amber-600" title="Warranties and Disclaimers">
            <p>
              We provide the Service on an "<strong className="text-slate-800">as is</strong>" and{' '}
              "<strong className="text-slate-800">as available</strong>" basis. To the fullest extent permitted by applicable law,
              we disclaim all warranties — express or implied — including warranties of merchantability, fitness for a particular
              purpose, and non-infringement.
            </p>
            <Note color="amber" icon={AlertCircle} title="No uptime guarantee">
              We do not warrant that the Service will be uninterrupted or error-free. We use commercially reasonable efforts
              to maintain availability and promptly address known issues.
            </Note>
          </Section>

          {/* 12 */}
          <Section id="s12" num="12" icon={Scale} iconBg="bg-orange-50 text-orange-600" title="Limitation of Liability">
            <p>
              To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages — including loss of data, loss of revenue, or loss of educational opportunity —
              arising from your use of the Service, even if we have been advised of the possibility of such damages.
            </p>
            <p>
              Our total aggregate liability to you shall not exceed the total fees paid by you in the{' '}
              <strong className="text-slate-800">12 months preceding</strong> the event giving rise to the claim.
            </p>
          </Section>

          {/* 13 */}
          <Section id="s13" num="13" icon={Shield} iconBg="bg-slate-100 text-slate-600" title="Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and its officers, directors, employees, and agents
              from and against any claims, damages, costs, and expenses (including reasonable legal fees) arising from:{' '}
              (a) your violation of these Terms; (b) your violation of any applicable law; (c) failure to obtain required consents
              for student data; or (d) content submitted by your users through the Service.
            </p>
          </Section>

          {/* 14 */}
          <Section id="s14" num="14" icon={XCircle} iconBg="bg-red-50 text-red-500" title="Term and Termination">
            <p>
              These Terms are effective from the date you first access the Service and continue until terminated. Either party may
              terminate by providing written notice.
            </p>
            <p>
              We may suspend or terminate your account immediately — without notice — if you have materially breached these Terms,
              particularly the Acceptable Use provisions, or if continued access poses a security risk.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Upon termination</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {[
                  ['(a)', 'Your access to the Service will cease immediately.'],
                  ['(b)', 'We retain your data for up to 90 days for export purposes.'],
                  ['(c)', 'Any accrued payment obligations survive termination.'],
                  ['(d)', 'Sections covering data ownership, liability, and governing law survive indefinitely.'],
                ].map(([tag, text]) => (
                  <li key={tag} className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold flex-shrink-0">{tag}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* 15 */}
          <Section id="s15" num="15" icon={Scale} iconBg="bg-slate-100 text-slate-600" title="Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any dispute that cannot be resolved
              by good-faith negotiation will be subject to the exclusive jurisdiction of the courts of competent jurisdiction.
            </p>
            <p>
              Before initiating any legal proceedings, both parties agree to attempt to resolve disputes through good-faith
              negotiation for at least <strong className="text-slate-800">30 days</strong> after written notice of the dispute.
            </p>
          </Section>

          {/* 16 */}
          <Section id="s16" num="16" icon={Bell} iconBg="bg-slate-100 text-slate-600" title="Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will provide at least{' '}
              <strong className="text-slate-800">30 days' notice</strong> of material changes via email to the school admin on
              record. Continued use of the Service after the effective date constitutes acceptance of the revised Terms.
            </p>
            <p>
              If you do not agree to the revised Terms, you must stop using the Service before the effective date of the changes.
            </p>
          </Section>

          {/* 17 */}
          <Section id="s17" num="17" icon={Cog} iconBg="bg-slate-100 text-slate-600" title="General">
            <div className="space-y-2">
              {[
                ['Entire agreement', `These Terms and the Privacy Policy constitute the entire agreement between you and ${COMPANY_NAME} and supersede all prior agreements.`],
                ['Severability',     'If any provision is found unenforceable, the remaining provisions continue in full force and effect.'],
                ['Waiver',           'Our failure to enforce any right or provision does not constitute a waiver of that right.'],
                ['Assignment',       `You may not assign these Terms or your account without our written consent. We may assign our rights to a successor in a merger, acquisition, or asset sale.`],
                ['Force majeure',    'Neither party is liable for delays or failures caused by circumstances beyond their reasonable control, including natural disasters, cyberattacks, or third-party outages.'],
              ].map(([term, desc]) => (
                <div key={term} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-wide min-w-[90px] flex-shrink-0 pt-0.5">{term}</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 18 */}
          <Section id="s18" num="18" icon={Mail} iconBg="bg-primary-50 text-primary-600" title="Contact">
            <p>
              For questions about these Terms, billing disputes, or to request a Data Processing Agreement (DPA):
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
              >
                <Mail size={15} />{SUPPORT_EMAIL}
              </a>
              <Link
                to="/privacy"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Lock size={15} />View Privacy Policy
              </Link>
            </div>
          </Section>

        </div>
      </div>
    </div>

    {/* ── Footer ──────────────────────────────────────────────── */}
    <footer className="border-t border-slate-100 bg-white mt-10">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/privacy" className="text-slate-400 hover:text-primary-600 transition-colors font-medium">Privacy Policy</Link>
          <span className="text-slate-200">·</span>
          <span className="font-semibold text-slate-500">Terms of Service</span>
          <span className="text-slate-200">·</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-400 hover:text-primary-600 transition-colors font-medium">Contact</a>
        </div>
      </div>
    </footer>

  </div>
);

export default TermsOfService;
