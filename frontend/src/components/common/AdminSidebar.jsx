import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  GraduationCap,
  UserCog,
  X
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';

const AdminSidebar = ({ collapsed, onCollapseChange, onClose }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const { logoUrl, schoolName } = useBranding();
  const menuItemRefs = useRef({});
  const location = useLocation();

  const toggleSubmenu = (menu) => {
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };

  const toggleCollapse = () => {
    if (onCollapseChange) {
      onCollapseChange(!collapsed);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      id: 'manage-teachers',
      icon: GraduationCap,
      label: 'Manage Teachers',
      submenu: [
        { label: 'View all Teachers', path: '/admin/teachers' }
      ]
    },
    {
      id: 'manage-students',
      icon: Users,
      label: 'Manage Students',
      submenu: [
        { label: 'View all Students', path: '/admin/students' },
        { label: 'Student Grade Changes', path: '/admin/students/grades' }
      ]
    },
    {
      id: 'chats',
      icon: MessageCircle,
      label: 'All Chats',
      path: '/admin/chats'
    },
    {
      id: 'manage-users',
      icon: UserCog,
      label: 'Manage New Users',
      submenu: [
        { label: 'New Users Permissions', path: '/admin/approvals' },
        { label: 'Denied Users', path: '/admin/users/denied' }
      ]
    },
    {
      id: 'manage-school',
      icon: Settings,
      label: 'Manage School',
      submenu: [
        { label: 'Manage School', path: '/admin/school-details' },
        { label: 'Billing & Subscription', path: '/admin/billing' }
      ]
    },
  ];

  const updateSubmenuPosition = (itemId) => {
    const menuElement = menuItemRefs.current[itemId];
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  };


  useEffect(() => {
    // Automatically open the submenu if the current path matches one of its items
    const currentMenuItem = menuItems.find(item =>
      item.submenu && item.submenu.some(subItem => location.pathname.startsWith(subItem.path))
    );

    if (currentMenuItem) {
      setActiveSubmenu(currentMenuItem.id);
    } else {
      // If we are on a page that is NOT in a submenu (like Dashboard or All Chats), 
      // or somewhere else entirely, we might want to close active submenus
      // Check if we are on a top-level link active
      const activeTopLevel = menuItems.find(item => !item.submenu && item.path === location.pathname);
      if (activeTopLevel) {
        setActiveSubmenu(null);
      }
    }
  }, [location.pathname]);

  const handleMouseLeave = () => {
    if (collapsed) {
      setHoveredItem(null);
    }
  };

  const handleMouseEnter = (itemId) => {
    if (collapsed) {
      setHoveredItem(itemId);
      updateSubmenuPosition(itemId);
    }
  };

  const SidebarItem = ({ item, index }) => {
    const Icon = item.icon;

    if (item.submenu) {
      return (
        <div className="mb-1">
          <button
            ref={(el) => (menuItemRefs.current[item.id] = el)}
            onClick={() => toggleSubmenu(item.id)}
            onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
              className={`sidebar-link w-full justify-between group ${activeSubmenu === item.id
                ? 'sidebar-link-active'
                : ''
                } ${collapsed ? 'justify-center' : ''}`}
              aria-label={collapsed ? item.label : undefined}
              aria-expanded={activeSubmenu === item.id}
              title={collapsed ? item.label : undefined}
            >
            <div className="flex items-center gap-3">
              <div className={`sidebar-icon-tile ${activeSubmenu === item.id
                ? 'sidebar-icon-tile-active'
                : ''
                } ${collapsed ? 'mx-auto' : ''}`}>
                <Icon size={20} />
              </div>
              {!collapsed && (
                <span className="font-medium text-sm">
                  {item.label}
                </span>
              )}
            </div>
            {!collapsed && (
              <ChevronRight
                size={16}
                className={`transition-transform duration-200 ${activeSubmenu === item.id ? 'rotate-90 text-primary-500' : 'text-slate-400'
                  }`}
              />
            )}
          </button>

          {
            !collapsed && activeSubmenu === item.id && (
              <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 mt-2 mb-2 space-y-1">
                {item.submenu.map((subItem, subIndex) => (
                  <NavLink
                    key={subIndex}
                    to={subItem.path}
                    end={subItem.path === '/admin/students/grades' || subItem.path === '/admin/chats' || subItem.path === '/dashboard'}
                    className={({ isActive }) => {
                      // Custom active check for "View all" links to stay active on detail pages
                      // but not on sibling pages like /grades
                      let isLinkActive = isActive;

                      // 1. Explicitly disable if we are on a known sibling/collision route
                      if (subItem.path === '/admin/students' && location.pathname === '/admin/students/grades') {
                        isLinkActive = false;
                      }
                      if (subItem.path === '/admin/admins' && location.pathname === '/admin/admins/add') {
                        isLinkActive = false;
                      }

                      // 2. If it's not active yet (and not explicitly disabled above), check if it should be active 
                      // (e.g. for detail pages like /admin/students/123)
                      if (!isLinkActive && !((subItem.path === '/admin/students' && location.pathname === '/admin/students/grades') || (subItem.path === '/admin/admins' && location.pathname === '/admin/admins/add'))) {
                        if (location.pathname.startsWith(subItem.path)) {
                          isLinkActive = true;
                        }
                      }

                      return `flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${isLinkActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`;
                    }}
                    onClick={onClose}
                  >
                    <span className="text-sm">{subItem.label}</span>
                  </NavLink>
                ))}
              </div>
            )
          }
        </div >
      );
    }

    return (
      <div>
        <NavLink
          ref={(el) => (menuItemRefs.current[item.id] = el)}
          to={item.path}
          className={({ isActive }) =>
            `sidebar-link mb-1 group ${isActive
              ? 'sidebar-link-active'
              : ''
            } ${collapsed ? 'justify-center' : ''}`
          }
          onMouseEnter={() => handleMouseEnter(item.id)}
          onMouseLeave={handleMouseLeave}
          onClick={onClose}
          aria-label={collapsed ? item.label : undefined}
          title={collapsed ? item.label : undefined}
        >
          <div className={`sidebar-icon-tile ${
            location.pathname === item.path
              ? 'sidebar-icon-tile-active'
              : ''
          }`}>
            <Icon size={20} className="shrink-0" />
          </div>
          {!collapsed && (
            <span className="font-medium text-sm">
              {item.label}
            </span>
          )}
        </NavLink>
      </div>
    );
  };

  return (
    <>
      <div
        className={`sidebar-shell ${collapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-brand">
          {!collapsed ? (
            <div className="w-full">
              <div className="sidebar-logo-frame">
                <img
                  src={logoUrl || "/Spoken-Edge-Text-Logo-trans.png"}
                  alt={schoolName}
                  className="w-full max-w-[180px] h-auto object-contain"
                  style={{
                    maxHeight: '75px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    if (!logoUrl) {
                      // If default image fails too, rely on strict fallback or hide
                      // But for now let's assume default image exists
                    }
                  }}
                />
                {!logoUrl && (
                  /* Optional: If we want to verify image exists, but simpler to just set src */
                  /* Actually, better structure: Always render img, src is logoUrl OR default */
                  null
                )}
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="w-full flex items-center justify-center">
                <img
                  src={logoUrl || "/SpokenEdge-Icon-Trans.png"}
                  alt={schoolName}
                  className="w-12 h-12 object-contain"
                  style={{
                    maxWidth: '48px',
                    maxHeight: '48px',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sidebar-scrollbar">
          <nav className="space-y-1">
            {collapsed && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2.5 py-2 text-center">
                  •••
                </p>
              </div>
            )}
            {!collapsed && <p className="sidebar-nav-label">Workspace</p>}

            {menuItems.map((item, index) => (
              <SidebarItem key={item.id} item={item} index={index} />
            ))}
          </nav>
        </div>

        <div className="hidden lg:block border-t border-slate-200 px-3 py-2 dark:border-slate-800">
          <button
            onClick={toggleCollapse}
            className={`w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${collapsed ? 'justify-center' : ''
              }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Collapse</span>
                </div>
                <ChevronLeft size={18} className="text-slate-400" />
              </>
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Floating Submenu for Collapsed State */}
      {collapsed && hoveredItem && (
        (() => {
          const item = menuItems.find(i => i.id === hoveredItem);
          if (!item) return null;

          return (
            <div
              className="sidebar-flyout"
              style={{
                top: `${submenuPosition.top}px`,
                left: `${submenuPosition.left}px`,
              }}
              onMouseEnter={() => setHoveredItem(hoveredItem)}
              onMouseLeave={handleMouseLeave}
            >
              {item.submenu ? (
                <>
                  {/* Smaller header padding */}
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-50">{item.label}</span>
                  </div>
                  <div className="py-0.5">
                    {item.submenu.map((subItem, index) => (
                      <NavLink
                        key={index}
                        to={subItem.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${isActive
                            ? 'text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/40'
                            : 'text-slate-700 dark:text-slate-300'
                          }`
                        }
                        onClick={() => {
                          setHoveredItem(null);
                          if (onClose) onClose();
                        }}
                      >
                        <span>{subItem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </>
              ) : (
                // Smaller padding for non-submenu items too
                <div className="px-3 py-1.5">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-50">{item.label}</span>
                </div>
              )}
            </div>
          );
        })()
      )}
    </>
  );
};

const Shield = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

export default AdminSidebar;
