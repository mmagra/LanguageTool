import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard useEffect - user:', user);
    if (!loading && user) {
      console.log('Redirecting based on role:', user.role);
      if (user.is_super_admin || user.role === 'super_admin') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Redirecting...</h2>
        <p className="text-gray-600">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
};

export default Dashboard;