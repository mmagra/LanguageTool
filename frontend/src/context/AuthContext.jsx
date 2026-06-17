import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = authService.getCurrentUser();

    if (storedUser && token) {
      if (storedUser?.role) storedUser.role = storedUser.role.toLowerCase();
      setUser(storedUser);
    }

    if (token) {
      authService.getProfile()
        .then(response => {
          if (response.success) {
            const freshUser = response.data;
            if (freshUser.role) freshUser.role = freshUser.role.toLowerCase();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(err => console.error('Failed to refresh profile:', err))
        .finally(() => setLoading(false)); // only finish loading once the profile resolves
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await authService.login({ identifier, password });

      if (response.success) {
        const userData = response.data.user;
        if (userData?.role) userData.role = userData.role.toLowerCase();
        setUser(userData);
        toast.success('Login successful!', { duration: 3000 });
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};