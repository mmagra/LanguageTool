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
    FileText
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const SuperAdminSidebar = ({ collapsed, onCollapseChange, onClose }) => {
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
    const menuItemRefs = useRef({});
    const location = useLocation();

    const logoSectionHeight = collapsed ? 'h-[72.5px]' : 'h-[72.5px]';

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
            id: 'languages',
            icon: Globe,
            label: 'Languages',
            path: '/super-admin/languages'
        },
        {
            id: 'audit-logs',
            icon: FileText,
            label: 'Audit Logs',
            path: '/super-admin/audit-logs'
        }
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
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-300 group ${activeSubmenu === item.id
                            ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 backdrop-blur-md text-white shadow-lg shadow-indigo-500/30 border border-white/20'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:translate-x-1'
                            } ${collapsed ? 'justify-center' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeSubmenu === item.id
                                ? 'bg-white/20 text-white backdrop-blur-sm'
                                : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
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
                                className={`transition-transform duration-300 ${activeSubmenu === item.id ? 'rotate-90 text-white' : 'text-gray-400'
                                    }`}
                            />
                        )}
                    </button>

                    {
                        !collapsed && activeSubmenu === item.id && (
                            <div className="ml-4 pl-4 border-l border-gray-200 mt-2 mb-2 space-y-1">
                                {item.submenu.map((subItem, subIndex) => (
                                    <NavLink
                                        key={subIndex}
                                        to={subItem.path}
                                        className={({ isActive }) =>
                                            `flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm ${isActive
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        `flex items-center gap-3 py-2 px-3 rounded-xl mb-1 transition-all duration-300 group ${isActive
                            ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 backdrop-blur-md text-white shadow-lg shadow-indigo-500/30 border border-white/20'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:translate-x-1'
                        } ${collapsed ? 'justify-center' : ''}`
                    }
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                    onClick={onClose}
                >
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                        // Active state styling handled by parent NavLink class
                        ''
                        } flex items-center justify-center shrink-0`}>
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
                className={`flex flex-col h-full bg-white border-r border-gray-100 text-gray-900 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Sidebar Header */}
                <div className={` ${logoSectionHeight} flex items-center justify-center mb-6 border-b border-indigo-100`}>
                    {!collapsed ? (
                        <div className="w-full px-4">
                            <div className="w-full flex items-center justify-center">
                                <img
                                    src="/Spoken-Edge-Text-Logo.png"
                                    alt="Spoken Edge Logo"
                                    className="w-full max-w-[200px] h-auto object-contain"
                                    style={{
                                        maxHeight: '75px',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'w-full text-center';
                                        fallback.innerHTML = '<span class="font-bold text-indigo-600 text-2xl">Super Admin</span>';
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
                                        fallback.className = 'w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center';
                                        fallback.innerHTML = '<span class="font-bold text-indigo-600">SA</span>';
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
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2.5 py-2 text-center">
                                    •••
                                </p>
                            </div>
                        )}

                        {menuItems.map((item, index) => (
                            <SidebarItem key={item.id} item={item} index={index} />
                        ))}
                    </nav>
                </div>

                <div className="hidden lg:block border-t border-gray-200 p-4">
                    <button
                        onClick={toggleCollapse}
                        className={`w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 ${collapsed ? 'justify-center' : ''
                            }`}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {!collapsed ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Collapse</span>
                                </div>
                                <ChevronLeft size={18} className="text-gray-400" />
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
                            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[180px]"
                            style={{
                                top: `${submenuPosition.top}px`,
                                left: `${submenuPosition.left}px`,
                            }}
                            onMouseEnter={() => setHoveredItem(hoveredItem)}
                            onMouseLeave={handleMouseLeave}
                        >
                            {item.submenu ? (
                                <>
                                    <div className="px-3 py-1.5 border-b border-gray-100">
                                        <span className="font-medium text-sm text-gray-900">{item.label}</span>
                                    </div>
                                    <div className="py-0.5">
                                        {item.submenu.map((subItem, index) => (
                                            <NavLink
                                                key={index}
                                                to={subItem.path}
                                                className={({ isActive }) =>
                                                    `flex items-center justify-between px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 ${isActive
                                                        ? 'text-indigo-700 bg-indigo-50'
                                                        : 'text-gray-700'
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
                                    <span className="font-medium text-sm text-gray-900">{item.label}</span>
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
