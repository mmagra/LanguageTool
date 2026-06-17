import { Link } from 'react-router-dom';
import { Languages, Check, Volume2 } from 'lucide-react';

/**
 * Left brand panel for the auth pages. Logo, a restrained live-translation
 * infographic, headline + highlights. No photos.
 *
 * `centered` → stacks everything (logo, infographic, headline) centered in the
 * middle of the panel (used on the login page). Otherwise the content is
 * top/bottom anchored and left-aligned (used on the register page).
 */
const AuthBrandPanel = ({
  title = 'Breaking language barriers in education',
  subtitle = 'Where every student is heard, every teacher is understood, and learning knows no language limits.',
  highlights = ['Real-time translation', 'Natural voice playback', 'Built for schools'],
  eyebrow = '100+ languages',
  centered = false,
}) => {
  // One teacher message → understood by every family in their own language
  const replies = [
    { code: 'ES', name: 'Español', text: 'La tarea es para el viernes.', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900' },
    { code: 'DE', name: 'Deutsch', text: 'Hausaufgabe bis Freitag fällig.', chip: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900' },
    { code: 'AR', name: 'العربية', text: 'الواجب مطلوب يوم الجمعة.', rtl: true, chip: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900' },
    { code: 'HI', name: 'हिन्दी', text: 'गृहकार्य शुक्रवार तक है।', chip: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' },
  ];

  const Logo = (
    <Link to="/" className="hover:opacity-80 transition-opacity">
      <img
        src="/Spoken-Edge-Text-Logo-trans.png"
        alt="Spoken Edge"
        className="h-16 xl:h-20 w-auto object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<span class="font-semibold text-primary-600 text-3xl tracking-tight">Spoken Edge</span>';
        }}
      />
    </Link>
  );

  const Infographic = (
    <div className="w-full max-w-md text-left">
      {/* Teacher speaks (English) */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">T</div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Teacher</span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">· English</span>
          </div>
          <div className="inline-block rounded-xl rounded-tl-sm bg-white border border-slate-200 text-slate-800 px-4 py-2.5 text-sm font-medium shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
            Homework is due Friday.
          </div>
        </div>
      </div>

      {/* Translate divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-medium whitespace-nowrap dark:bg-primary-950/40 dark:border-primary-900 dark:text-primary-300">
          <Languages size={13} /> Every parent, their language
        </span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Each parent receives it on the RIGHT, in their own language */}
      <div className="space-y-3">
        {replies.map((r) => (
          <div key={r.name} className="flex items-end gap-2.5 flex-row-reverse">
            {/* Parent profile avatar (right) */}
            <span className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full ring-1 ${r.chip} text-xs font-semibold`}>{r.code}</span>

            {/* Parent bubble */}
            <div className="flex flex-col items-end max-w-[82%]">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 mr-1">{r.name}</span>
              <div className="rounded-xl rounded-tr-sm bg-white border border-slate-200 px-4 py-2.5 shadow-sm flex items-center gap-2.5 dark:bg-slate-900 dark:border-slate-800">
                <p className={`text-sm font-medium text-slate-700 dark:text-slate-200 ${r.rtl ? 'text-right' : ''}`} dir={r.rtl ? 'rtl' : 'ltr'}>
                  {r.text}
                </p>
                <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" title="Plays aloud">
                  <Volume2 size={13} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Background = (
    <>
      {/* Faint dotted grid, fading toward edges */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(100,116,139,0.12) 1px, transparent 1.4px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 80%)',
        }}
      />
    </>
  );

  // ---- Centered variant (login) ----
  if (centered) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-50 border-r border-slate-200 dark:bg-slate-950 dark:border-slate-800">
        {Background}
        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-8 xl:px-14 py-10">
          <div className="mb-8">{Logo}</div>
          {title && (
            <h2 className="text-xl xl:text-2xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {title}
            </h2>
          )}
          {subtitle && <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{subtitle}</p>}
          <div className="mt-10 w-full flex justify-center">{Infographic}</div>
        </div>
      </div>
    );
  }

  // ---- Default variant (register) ----
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50 border-r border-slate-200 dark:bg-slate-950 dark:border-slate-800">
      {Background}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
        {Logo}
        <div className="flex-1 flex items-center justify-center py-10">{Infographic}</div>

        {(title || subtitle || eyebrow || (highlights && highlights.length > 0)) && (
          <div className="max-w-lg">
            {eyebrow && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full dark:bg-primary-950/40 dark:border-primary-900 dark:text-primary-300">
                <Languages size={13} /> {eyebrow}
              </span>
            )}
            {title && (
              <h2 className={`text-3xl xl:text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 ${eyebrow ? 'mt-4' : ''}`}>
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">{subtitle}</p>}
            {highlights && highlights.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-600">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthBrandPanel;
