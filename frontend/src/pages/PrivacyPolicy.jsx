import { Link } from 'react-router-dom';
import {
  Shield, Database, Cog, Globe, GraduationCap, Users, Scale,
  Clock, Lock, Monitor, ArrowRightLeft, Bell, Mail, Building2,
  CheckCircle, AlertCircle, FileText, CreditCard, ChevronRight
} from 'lucide-react';

const SUPPORT_EMAIL  = import.meta.env.VITE_SUPPORT_EMAIL || 'support@spokenedge.com';
const APP_NAME       = 'Spoken Edge';
const COMPANY_NAME   = 'Spoken Edge';
const EFFECTIVE_DATE = 'June 10, 2025';

const TOC = [
  { id: 's1',  label: 'Who We Are & Our Role'          },
  { id: 's2',  label: 'Information We Collect'          },
  { id: 's3',  label: 'How We Use Your Information'     },
  { id: 's4',  label: 'Third-Party Services'            },
  { id: 's5',  label: 'FERPA Compliance'                },
  { id: 's6',  label: 'COPPA Compliance'                },
  { id: 's7',  label: 'GDPR & UK GDPR Rights'           },
  { id: 's8',  label: 'Data Retention'                  },
  { id: 's9',  label: 'Data Security'                   },
  { id: 's10', label: 'Cookies & Tracking'              },
  { id: 's11', label: 'Data Transfers'                  },
  { id: 's12', label: 'Changes to This Policy'          },
  { id: 's13', label: 'Contact Us'                      },
];

/* ─── reusable section card ─────────────────────────────────── */
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

/* ─── bullet variants ────────────────────────────────────────── */
const Li = ({ children }) => (
  <li className="flex items-start gap-2.5">
    <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </li>
);

/* ─── inline callout ─────────────────────────────────────────── */
const Note = ({ color = 'amber', icon: Icon = AlertCircle, title, children }) => {
  const map = {
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    green:  'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  const ic = { amber: 'text-amber-500', blue: 'text-blue-500', green: 'text-green-500', purple: 'text-purple-500' };
  return (
    <div className={`rounded-xl border px-4 py-3 ${map[color]}`}>
      <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-1 ${ic[color]}`}>
        <Icon size={12} />{title}
      </p>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
};

/* ─── retention row ──────────────────────────────────────────── */
const RetentionRow = ({ period, label, desc }) => (
  <div className="flex items-start gap-3 bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold min-w-[72px] text-center flex-shrink-0 mt-0.5">{period}</span>
    <div>
      <p className="text-xs font-bold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
const PrivacyPolicy = () => (
  <div className="min-h-screen bg-slate-50 font-inter">

    {/* ── Top Nav ─────────────────────────────────────────────── */}
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Back link */}
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

        {/* Cross-page link */}
        <Link to="/terms" className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
          Terms of Service<ChevronRight size={14} />
        </Link>
      </div>
    </header>

    {/* ── Page header (matches dashboard style) ───────────────── */}
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Privacy Policy</h1>
              <p className="text-slate-500 text-sm mt-0.5">How {APP_NAME} collects, uses, and protects your information.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">Effective: {EFFECTIVE_DATE}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">FERPA · COPPA · GDPR</span>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">Data never sold</span>
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
              <Link to="/terms" className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline font-semibold">
                <FileText size={12} />Terms of Service
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Sections ─────────────────────────────────────────── */}
        <div className="space-y-4 mt-0">

          {/* Intro banner */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              <strong className="text-slate-900">{COMPANY_NAME}</strong> ("we", "us", or "our") operates the {APP_NAME} platform — a
              real-time language learning tool for educational institutions. This Privacy Policy explains what personal information we
              collect, why we collect it, how we use and protect it, and your rights.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              By using {APP_NAME}, you agree to this policy. If you are a school administrator, your school's use is also governed
              by our{' '}
              <Link to="/terms" className="text-primary-600 hover:underline font-semibold">Terms of Service</Link> and, where
              applicable, a Data Processing Agreement between {COMPANY_NAME} and your institution.
            </p>
          </div>

          {/* 1 */}
          <Section id="s1" num="01" icon={Building2} iconBg="bg-primary-50 text-primary-600" title="Who We Are and Our Role">
            <p>
              {COMPANY_NAME} acts as a <strong className="text-slate-800">data processor</strong> on behalf of the educational
              institutions ("<strong className="text-slate-800">schools</strong>") that subscribe to our platform. Each school is the{' '}
              <strong className="text-slate-800">data controller</strong> for its students', teachers', and administrators' personal data.
              We process that data only as instructed by the school and as necessary to deliver the service.
            </p>
            <p>
              For data we collect about our own business relationships (e.g., billing contacts), we act as an independent data controller.
            </p>
          </Section>

          {/* 2 */}
          <Section id="s2" num="02" icon={Database} iconBg="bg-blue-50 text-blue-600" title="Information We Collect">
            <p className="font-semibold text-slate-700">Account &amp; profile information</p>
            <ul className="space-y-1.5">
              <Li>Full name, email address, phone number (optional)</Li>
              <Li>Role: admin, teacher, or student</Li>
              <Li>Grade level and preferred target language (students only)</Li>
              <Li>School name and institution identifier</Li>
            </ul>
            <p className="font-semibold text-slate-700 pt-1">Usage and session data</p>
            <ul className="space-y-1.5">
              <Li>Session start/end times and duration</Li>
              <Li>Text messages exchanged within a session</Li>
              <Li>Translation requests and output (via Google Cloud Translation API)</Li>
              <Li>Text-to-speech requests and audio output (via Google Cloud TTS API)</Li>
            </ul>
            <p className="font-semibold text-slate-700 pt-1">Technical &amp; analytics data</p>
            <ul className="space-y-1.5">
              <Li>Log data: IP addresses, browser type, pages visited, timestamps</Li>
              <Li>Usage metrics: minutes used, characters translated, TTS characters consumed</Li>
              <Li>Audit log events: administrative actions for security and compliance</Li>
            </ul>
            <p className="font-semibold text-slate-700 pt-1">Billing information</p>
            <p>
              Collected and processed exclusively by <strong className="text-slate-800">Stripe</strong>. We never see or store full
              card numbers, CVV codes, or bank account details. We retain only Stripe-issued customer and subscription identifiers.
            </p>
          </Section>

          {/* 3 */}
          <Section id="s3" num="03" icon={Cog} iconBg="bg-purple-50 text-purple-600" title="How We Use Your Information">
            <ul className="space-y-1.5">
              <Li>Provide, operate, and improve the {APP_NAME} platform</Li>
              <Li>Authenticate users and maintain account security</Li>
              <Li>Enable real-time language sessions between teachers and students</Li>
              <Li>Process translation and text-to-speech via Google Cloud APIs</Li>
              <Li>Generate usage reports for school administrators</Li>
              <Li>Process subscription payments through Stripe</Li>
              <Li>Send essential service communications (account setup, security alerts, billing receipts)</Li>
              <Li>Investigate and resolve support requests</Li>
              <Li>Comply with legal obligations</Li>
            </ul>
            <Note color="amber" icon={AlertCircle} title="Important">
              We do <strong>not</strong> use student data for advertising, behavioural profiling, or any purpose unrelated to providing educational services.
            </Note>
          </Section>

          {/* 4 */}
          <Section id="s4" num="04" icon={Globe} iconBg="bg-indigo-50 text-indigo-600" title="Third-Party Services and Data Processors">
            <p>We share data with the following processors solely to deliver our service:</p>
            <div className="space-y-2.5 mt-1">
              {[
                { name: 'Google Cloud', sub: 'Translation & Text-to-Speech', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500',   text: 'Session text submitted for translation or speech synthesis. Google does not use this data to train its models under enterprise terms.' },
                { name: 'Stripe',       sub: 'Payment Processing',           bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500', text: 'Billing contact name/email and subscription details. Card data is handled exclusively by Stripe and never passes through our servers.' },
                { name: 'Cloud Host',   sub: 'Infrastructure & Storage',     bg: 'bg-green-50 border-green-100',  dot: 'bg-green-500',  text: 'All application data at rest and in transit. Hosted on SOC 2 certified infrastructure with encryption at rest.' },
              ].map(p => (
                <div key={p.name} className={`rounded-xl border p-3.5 ${p.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} />
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <span className="text-xs text-slate-500">· {p.sub}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 italic pt-1">
              We do not sell, rent, or trade personal information to any third party for their own commercial purposes.
            </p>
          </Section>

          {/* 5 */}
          <Section id="s5" num="05" icon={GraduationCap} iconBg="bg-blue-50 text-blue-600" title="FERPA Compliance (US Educational Records)">
            <p>
              For US schools, student data processed through {APP_NAME} constitutes "education records" under the{' '}
              <strong className="text-slate-800">Family Educational Rights and Privacy Act (FERPA)</strong>, 20 U.S.C. § 1232g.
              We act as a "school official" with a legitimate educational interest:
            </p>
            <ul className="space-y-1.5">
              <Li>We use student education records only to provide the contracted educational service</Li>
              <Li>We do not disclose education records to outside parties without consent, except as required by law</Li>
              <Li>We return or securely destroy student records upon request or subscription termination</Li>
              <Li>We will notify the school of any confirmed data breach affecting student records</Li>
              <Li>School administrators may review, correct, and request deletion of their students' records</Li>
            </ul>
            <Note color="blue" icon={Shield} title="FERPA Status">
              {APP_NAME} operates under the FERPA "school official" exception. Schools maintain ultimate control over their student records.
            </Note>
          </Section>

          {/* 6 */}
          <Section id="s6" num="06" icon={Users} iconBg="bg-green-50 text-green-600" title="COPPA Compliance (Children Under 13)">
            <p>
              The <strong className="text-slate-800">Children's Online Privacy Protection Act (COPPA)</strong> applies to services
              directed at children under 13. Students in {APP_NAME} are registered by school administrators — not by the children
              themselves. Under COPPA's school consent exception,{' '}
              <strong className="text-slate-800">schools provide consent on behalf of parents</strong> for educational purposes.
            </p>
            <ul className="space-y-1.5">
              <Li>We collect only the minimum information necessary to provide the service</Li>
              <Li>We do not direct advertising to children or build behavioural profiles</Li>
              <Li>Parents may request access, correction, or deletion via their school administrator</Li>
              <Li>School administrators may delete student accounts at any time from their dashboard</Li>
            </ul>
            <Note color="green" icon={Shield} title="COPPA Status">
              Student accounts are created and managed by school administrators, not directly by students or parents.
            </Note>
          </Section>

          {/* 7 */}
          <Section id="s7" num="07" icon={Scale} iconBg="bg-purple-50 text-purple-600" title="GDPR and UK GDPR Rights (EU and UK Users)">
            <p>If you are in the EU or UK, you have the following rights under the GDPR / UK GDPR:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {[
                ['Right of access',     'Request a copy of the personal data we hold about you'],
                ['Right to rectify',    'Request correction of inaccurate or incomplete data'],
                ['Right to erasure',    'Request deletion where there is no compelling reason to continue processing'],
                ['Right to restrict',   'Request we restrict processing in certain circumstances'],
                ['Right to portability','Receive your data in a structured, machine-readable format'],
                ['Right to object',     'Object to processing based on legitimate interests'],
              ].map(([right, desc]) => (
                <div key={right} className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-purple-800 mb-0.5">{right}</p>
                  <p className="text-[11px] text-purple-700 leading-snug">{desc}</p>
                </div>
              ))}
            </div>
            <p className="pt-1">
              To exercise any of these rights, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 hover:underline font-semibold">{SUPPORT_EMAIL}</a>.
              We respond within 30 days. You may also lodge a complaint with your national data protection authority.
            </p>
            <Note color="purple" icon={Shield} title="Legal Basis">
              (a) Performance of a contract · (b) Legitimate interests (security, analytics) · (c) Compliance with legal obligations.
            </Note>
          </Section>

          {/* 8 */}
          <Section id="s8" num="08" icon={Clock} iconBg="bg-orange-50 text-orange-600" title="Data Retention">
            <div className="space-y-2">
              <RetentionRow period="While active" label="Active accounts"     desc="Data retained for the full duration of the school subscription." />
              <RetentionRow period="90 days"      label="Post-subscription"   desc="School data retained after termination for data export, then permanently deleted." />
              <RetentionRow period="7 years"      label="Billing records"     desc="Payment and invoice records retained to comply with financial regulations." />
              <RetentionRow period="12 months"    label="Audit logs"          desc="Security and administrative audit logs retained for compliance review." />
              <RetentionRow period="30 days"      label="Database backups"    desc="Backups retained for disaster recovery, then overwritten." />
            </div>
            <p className="text-xs text-slate-400 pt-1">
              School admins can request immediate deletion by emailing{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary-600 hover:underline">{SUPPORT_EMAIL}</a>.
            </p>
          </Section>

          {/* 9 */}
          <Section id="s9" num="09" icon={Lock} iconBg="bg-amber-50 text-amber-600" title="Data Security">
            <p>We implement the following technical and organisational security measures:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {[
                'TLS 1.2+ encryption in transit',
                'bcrypt password hashing (never plaintext)',
                'SHA-256 one-way reset token hashes',
                'Short-lived JWT sessions with auto-expiry',
                'Multi-tenant data isolation per school',
                'Tamper-evident audit logs',
                'Rate limiting on all auth endpoints',
                'Production access restricted to authorised staff',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
            <Note color="amber" icon={AlertCircle} title="Security concern?">
              If you believe your account has been compromised, contact us immediately at <strong>{SUPPORT_EMAIL}</strong>.
            </Note>
          </Section>

          {/* 10 */}
          <Section id="s10" num="10" icon={Monitor} iconBg="bg-slate-100 text-slate-600" title="Cookies and Tracking">
            <p>We use only essential session cookies required for authentication. We do <strong className="text-slate-800">not</strong> use:</p>
            <ul className="space-y-1.5">
              <Li>Third-party advertising or tracking cookies</Li>
              <Li>Analytics cookies (e.g. Google Analytics) that track users across sites</Li>
              <Li>Fingerprinting or other cross-site tracking technologies</Li>
            </ul>
            <p>Authentication tokens are stored in your browser's localStorage solely to maintain your login session.</p>
          </Section>

          {/* 11 */}
          <Section id="s11" num="11" icon={ArrowRightLeft} iconBg="bg-slate-100 text-slate-600" title="Data Transfers">
            <p>
              Our infrastructure is primarily hosted in the United States. If you access from the EU, UK, or another jurisdiction
              with data transfer restrictions, your data may be transferred to and processed in the US. We rely on the{' '}
              <strong className="text-slate-800">EU–US Data Privacy Framework</strong> and/or{' '}
              <strong className="text-slate-800">Standard Contractual Clauses (SCCs)</strong> for such transfers where required.
            </p>
          </Section>

          {/* 12 */}
          <Section id="s12" num="12" icon={Bell} iconBg="bg-slate-100 text-slate-600" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify school administrators of material changes by
              email at least <strong className="text-slate-800">30 days before</strong> the changes take effect. The "Effective date"
              at the top always reflects the current version. Continued use constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* 13 — Contact */}
          <Section id="s13" num="13" icon={Mail} iconBg="bg-primary-50 text-primary-600" title="Contact Us">
            <p>
              For privacy-related questions, data access requests, or to report a security concern — we aim to respond within{' '}
              <strong className="text-slate-800">5 business days</strong> and resolve enquiries within 30 days.
            </p>
            <div className="mt-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
              >
                <Mail size={15} />{SUPPORT_EMAIL}
              </a>
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
          <span className="font-semibold text-slate-500">Privacy Policy</span>
          <span className="text-slate-200">·</span>
          <Link to="/terms" className="text-slate-400 hover:text-primary-600 transition-colors font-medium">Terms of Service</Link>
          <span className="text-slate-200">·</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-400 hover:text-primary-600 transition-colors font-medium">Contact</a>
        </div>
      </div>
    </footer>

  </div>
);

export default PrivacyPolicy;
