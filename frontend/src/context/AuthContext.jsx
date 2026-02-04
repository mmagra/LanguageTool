import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    console.log('AuthProvider mounted - checking localStorage');

    const token = localStorage.getItem('token');
    const storedUser = authService.getCurrentUser();

    console.log('Stored token exists:', !!token);
    console.log('Stored user exists:', !!storedUser);

    if (storedUser && token) {
      if (storedUser?.role) {
        storedUser.role = storedUser.role.toLowerCase();
      }
      console.log('Setting user from localStorage:', storedUser);
      setUser(storedUser);
    } else {
      console.log('No user/token in localStorage');
    }

    // Always fetch fresh profile if token exists to ensure we have latest data (like preferred_language)
    if (token) {
      authService.getProfile()
        .then(response => {
          if (response.success) {
            const freshUser = response.data;
            if (freshUser.role) freshUser.role = freshUser.role.toLowerCase();

            console.log('Refreshed user profile from server:', freshUser);
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(err => console.error('Failed to refresh profile:', err));
    }

    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    console.log('AuthContext login called for:', identifier);

    try {
      const response = await authService.login({ identifier, password });
      console.log('AuthContext login response:', response);

      if (response.success) {
        const userData = response.data.user;
        if (userData?.role) {
          userData.role = userData.role.toLowerCase();
        }
        setUser(userData);

        // Auto-switch language if student
        // Auto-switch language logic disabled as per user request (show English by default)
        /*
        if (userData?.role === 'student' && userData?.preferred_language) {
          import('../utils/languages').then(({ getLanguageCode }) => {
            import('i18next').then(i18n => {
              const code = getLanguageCode(userData.preferred_language);
              i18n.default.changeLanguage(code);
              console.log('🌐 Language switched to:', code);
            });
          });
        }
        */

        console.log('User set in AuthContext:', userData);
        toast.success('Login successful!', { duration: 3000 });
        return { success: true };
      } else {
        console.error('Login failed in AuthContext:', response);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('AuthContext login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('AuthContext logout called');
    authService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        toast.success('Registration successful! Please wait for approval.');
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        const freshUser = response.data;
        if (freshUser.role) freshUser.role = freshUser.role.toLowerCase();

        console.log('Manually refreshed user profile:', freshUser);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        return { success: true, user: freshUser };
      }
    } catch (error) {
      console.error('Failed to manually refresh profile:', error);
      return { success: false, error: error.message };
    }
    return { success: false };
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isApproved: user?.status === 'approved' || user?.status === 'active',
  };

  console.log('AuthContext value:', {
    user: user?.email,
    isAuthenticated: value.isAuthenticated,
    isAdmin: value.isAdmin
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};