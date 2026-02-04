import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  return (
    <div className="flex min-h-screen bg-white font-inter">
      {/* Left Side - Form & Branding */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white z-10 px-6 sm:px-12 lg:px-16 py-10">
        {/* Logo */}
        <div className="mb-12">
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
            <img
              src="/Spoken-Edge-Text-Logo.png"
              alt="Spoken Edge Logo"
              className="h-12 md:h-16 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="font-bold text-primary-600 text-2xl">Spoken Edge</span>';
              }}
            />
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-grow flex items-center justify-center w-full">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center lg:text-left">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Spoken Edge. All rights reserved.
            <span className="hidden sm:inline mx-2">|</span>
            <Link to="/privacy" className="hover:text-primary-600 transition-colors block sm:inline mt-1 sm:mt-0">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/40 mix-blend-multiply z-10" />
        <img
          src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=2674&auto=format&fit=crop"
          alt="Diverse students connecting"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        <div className="relative z-20 flex flex-col justify-end h-full p-20 text-white pb-24">
          <h2 className="text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
            Breaking Language <br /> Barriers in <span className="text-yellow-400">Education</span>
          </h2>
          <p className="text-xl text-gray-100 max-w-lg leading-relaxed drop-shadow-md">
            Empowering every student and teacher to connect, communicate, and succeed—no matter what language they speak.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;