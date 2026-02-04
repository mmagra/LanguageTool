import React from 'react';
import { NavLink } from 'react-router-dom';

const SidebarItem = ({ to, icon, label, colorScheme = 'blue' }) => {
  const colorClasses = {
    blue: {
      active: 'bg-blue-700',
      hover: 'hover:bg-blue-600',
      text: 'text-blue-100',
    },
    green: {
      active: 'bg-green-700',
      hover: 'hover:bg-green-600',
      text: 'text-green-100',
    },
    purple: {
      active: 'bg-purple-700',
      hover: 'hover:bg-purple-600',
      text: 'text-purple-100',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
          colors.hover
        } ${isActive ? colors.active : ''}`
      }
      end
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export default SidebarItem;