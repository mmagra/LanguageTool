import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  return (
    <div className="flex min-h-screen bg-white font-inter">
      {/* Left Side - Form & Branding */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white z-10 px-6 sm:px-12 lg:px-16 py-6 font-inter h-screen overflow-y-auto scrollbar-hide">
        {/* Logo */}
        <div className="mb-4 lg:mb-6 flex-none">
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
        <div className="flex-grow flex items-center justify-center w-full my-auto">
          <div className="w-full max-w-xl">
            <RegisterForm />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 lg:mt-12 text-center lg:text-left">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Spoken Edge. All rights reserved.
            <span className="hidden sm:inline mx-2">|</span>
            <Link to="/privacy" className="hover:text-primary-600 transition-colors block sm:inline mt-1 sm:mt-0">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-indigo-900/40 mix-blend-multiply z-10" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
          alt="Students collaborating"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        <div className="relative z-20 flex flex-col justify-end h-full p-20 text-white pb-24">
          <h2 className="text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
            Education Without <br /> <span className="text-yellow-400">Borders</span>
          </h2>
          <p className="text-xl text-gray-100 max-w-lg leading-relaxed drop-shadow-md">
            Join Spoken Edge today. Where every student is heard, every teacher is understood, and learning knows no language limits.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
