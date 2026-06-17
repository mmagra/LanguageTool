import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import TeacherSidebar from './TeacherSidebar';
import StudentSidebar from './StudentSidebar';
import SuperAdminSidebar from './SuperAdminSidebar';

const Sidebar = ({ isOpen, onClose, collapsed, onCollapseChange }) => {
  const { user } = useAuth();

  const getRoleSidebar = () => {
    // Check for Super Admin first
    if (user?.is_super_admin || user?.role === 'super admin' || user?.role === 'super_admin') {
      return (
        <SuperAdminSidebar
          collapsed={collapsed}
          onCollapseChange={onCollapseChange}
          onClose={onClose}
        />
      );
    }

    switch (user?.role) {
      case 'admin':
        return (
          <AdminSidebar
            collapsed={collapsed}
            onCollapseChange={onCollapseChange}
            onClose={onClose}
          />
        );
      case 'teacher':
        return (
          <TeacherSidebar
            collapsed={collapsed}
            onCollapseChange={onCollapseChange}
            onClose={onClose}
          />
        );
      case 'student':
        return (
          <StudentSidebar
            collapsed={collapsed}
            onCollapseChange={onCollapseChange}
            onClose={onClose}
          />
        );
      default:
        return (
          <AdminSidebar
            collapsed={collapsed}
            onCollapseChange={onCollapseChange}
            onClose={onClose}
          />
        );
    }
  };

  return (
    <div className="h-full">
      {getRoleSidebar()}
    </div>
  );
};

export default Sidebar;