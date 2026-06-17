import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';

const Register = () => {
  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-white font-inter dark:bg-slate-950">
      {/* Left — brand panel (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] h-screen">
        <AuthBrandPanel
          centered
          title="Breaking language barriers in education"
          subtitle={null}
          highlights={[]}
          eyebrow={null}
        />
      </div>

      {/* Right — registration form (scrolls) */}
      <div className="relative w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center px-6 sm:px-12 py-10 lg:h-screen lg:overflow-y-auto bg-white dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-slate-50 lg:hidden dark:bg-slate-950" />

        <div className="relative z-10 w-full max-w-xl m-auto">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden mb-6 flex justify-center">
            <img
              src="/Spoken-Edge-Text-Logo-trans.png"
              alt="Spoken Edge"
              className="h-16 w-auto object-contain"
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="font-bold text-primary-600 text-2xl">Spoken Edge</span>'; }}
            />
          </Link>

          <RegisterForm />

          <p className="mt-8 text-xs text-slate-400 dark:text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Spoken Edge. All rights reserved.
            <span className="mx-2">·</span>
            <Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
