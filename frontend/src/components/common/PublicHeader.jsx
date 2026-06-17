import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, Menu } from 'lucide-react';

const PublicHeader = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-16 flex items-center">
        <div className="container mx-auto px-4 md:px-6 w-full">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src="/Spoken-Edge-Text-Logo.png"
                alt="Spoken Edge Logo"
                className="h-10 md:h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'font-bold text-primary-600 text-xl md:text-2xl';
                  fallback.textContent = 'Spoken Edge';
                  e.target.parentElement.appendChild(fallback);
                }}
              />
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-600">
                    Welcome, <span className="font-semibold text-slate-900">{user?.firstName || 'User'}</span>
                  </span>
                  <Link
                    to="/dashboard"
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                  >
                    <Menu size={18} />
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 text-slate-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    <LogIn size={18} />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                  >
                    <UserPlus size={18} />
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <Menu size={18} />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="p-2 text-slate-700 hover:text-primary-600 transition-colors"
                    aria-label="Login"
                  >
                    <LogIn size={20} />
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <UserPlus size={18} />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;

