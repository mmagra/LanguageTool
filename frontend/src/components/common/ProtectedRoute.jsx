import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    const userRole = user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      console.error('ProtectedRoute violation:', {
        requiredRoles: allowedRoles,
        userRole: userRole,
        originalUserRole: user.role
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (user.role !== 'admin' && user.status !== 'approved' && user.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Pending Approval</h2>
          <p className="text-gray-600">
            Your account is pending admin approval. You will be notified once approved.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;