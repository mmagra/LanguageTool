import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard,
    Building2,
    Globe,
    Settings,
    Shield,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
    Lock,
    FileText,
    Users,
    BarChart2,
    CreditCard
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const SuperAdminSidebar = ({ collapsed, onCollapseChange, onClose }) => {
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
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
            path: '/super-admin/dashboard'
        },
        {
            id: 'schools',
            icon: Building2,
            label: 'Manage Schools',
            path: '/super-admin/schools'
        },
        {
            id: 'billing',
            icon: CreditCard,
            label: 'Billing',
            path: '/super-admin/billing'
        },
        {
            id: 'languages',
            icon: Globe,
            label: 'Languages',
            path: '/super-admin/languages'
        },
        {
            id: 'admins',
            icon: Users,
            label: 'Admins',
            path: '/super-admin/admins'
        },
        {
            id: 'audit-logs',
            icon: FileText,
            label: 'Audit Logs',
            path: '/super-admin/audit-logs'
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
        const currentMenuItem = menuItems.find(item =>
            item.submenu && item.submenu.some(subItem => location.pathname.startsWith(subItem.path))
        );

        if (currentMenuItem) {
            setActiveSubmenu(currentMenuItem.id);
        } else {
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
                                        className={({ isActive }) =>
                                            `flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${isActive
                                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                            }`
                                        }
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
                                    src="/Spoken-Edge-Text-Logo-trans.png"
                                    alt="Spoken Edge Logo"
                                    className="w-full max-w-[180px] h-auto object-contain"
                                    style={{
                                        maxHeight: '75px',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full text-center';
                                        fallback.innerHTML = '<span class="font-bold text-primary-600 text-2xl">Super Admin</span>';
                                        e.target.parentElement.appendChild(fallback);
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="w-full flex items-center justify-center">
                                <img
                                    src="/SpokenEdge-Icon-Trans.png"
                                    alt="Spoken Edge Icon"
                                    className="w-12 h-12 object-contain"
                                    style={{
                                        maxWidth: '48px',
                                        maxHeight: '48px',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center';
                                        fallback.innerHTML = '<span class="font-bold text-primary-600">SA</span>';
                                        e.target.parentElement.appendChild(fallback);
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

export default SuperAdminSidebar;
