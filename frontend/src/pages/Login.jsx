import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';

const Login = () => {
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

      {/* Right — sign in form */}
      <div className="relative w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center justify-center px-6 sm:px-12 py-10 bg-white dark:bg-slate-950">
        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden mb-10 flex justify-center">
            <img
              src="/Spoken-Edge-Text-Logo-trans.png"
              alt="Spoken Edge"
              className="h-14 w-auto object-contain"
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="font-semibold text-primary-600 text-2xl tracking-tight">Spoken Edge</span>'; }}
            />
          </Link>

          <LoginForm />

          <p className="mt-10 text-xs text-slate-400 dark:text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Spoken Edge. All rights reserved.
            <span className="mx-2">·</span>
            <Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
