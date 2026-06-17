import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    UserX,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import UserApprovalModal from './modals/UserApprovalModal';

const DeniedUsers = () => {
    const [deniedUsers, setDeniedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'denied_at', direction: 'desc' });

    // Modal state
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchDeniedUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/denied-users');
            setDeniedUsers(response.data || []);
        } catch (error) {
            toast.error('Failed to fetch denied users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeniedUsers();
    }, []);

    const handleApproval = async (userId, action) => {
        try {
            setProcessing(true);

            if (action === 'delete') {
                await api.delete(`/admin/users/${userId}`);
                toast.success('User application deleted permanently');
            } else {
                await api.put(`/admin/users/${userId}/approval`, { action });

                if (action === 'approve') {
                    toast.success('User approved and moved to active list');
                } else {
                    toast.success('User updated');
                }
            }

            setSelectedUser(null); // Close modal
            fetchDeniedUsers(); // Refresh list
        } catch (error) {
            toast.error(`Failed to ${action === 'delete' ? 'delete' : action} user`);
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    // Sorting helper
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter users based on search
    const filteredUsers = deniedUsers.filter(user => {
        const term = searchTerm.toLowerCase();
        return (
            user.first_name?.toLowerCase().includes(term) ||
            user.last_name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.username?.toLowerCase().includes(term) ||
            user.phone?.toLowerCase().includes(term)
        );
    });

    // Sorting logic
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Sort by full name
        if (sortConfig.key === 'name') {
            aValue = `${a.first_name} ${a.last_name}`;
            bValue = `${b.first_name} ${b.last_name}`;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    // Helper to render sort icon
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-400 ml-1" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-primary-600 ml-1" />
            : <ArrowDown size={14} className="text-primary-600 ml-1" />;
    };

    return (
        <ProtectedRoute roles={['admin']}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Denied Users</h1>
                        <p className="text-slate-500 text-sm mt-1">Review and manage denied account requests.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header & Search */}
                    <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-end gap-4 bg-white">
                        <div className="relative w-full sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search denied users..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 pr-4 py-2 w-full bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-500 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-200 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <div className="p-4 bg-slate-100 rounded-full mb-4">
                                    <UserX size={48} className="text-slate-400" />
                                </div>
                                <p className="text-lg font-bold text-slate-900 mb-1">No denied users found</p>
                                <p className="text-sm text-slate-600">Your denial list is clean.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Name
                                                <SortIcon columnKey="name" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('username')}
                                        >
                                            <div className="flex items-center">
                                                Username (ID)
                                                <SortIcon columnKey="username" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('email')}
                                        >
                                            <div className="flex items-center">
                                                Email
                                                <SortIcon columnKey="email" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('denied_at')}
                                        >
                                            <div className="flex items-center">
                                                Denied Date
                                                <SortIcon columnKey="denied_at" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            <ChevronRight size={16} className="ml-auto" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {currentUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className="hover:bg-slate-50 transition-colors duration-200 group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {user.profile_image ? (
                                                        <img
                                                            src={user.profile_image}
                                                            alt={`${user.first_name} ${user.last_name}`}
                                                            className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-100 group-hover:border-primary-200 transition-all group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-white text-slate-500 border border-slate-100 group-hover:border-primary-200 group-hover:bg-white flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105">
                                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                                        </div>
                                                    )}
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                                    {user.username || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{user.phone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${user.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    user.role === 'teacher' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-purple-50 text-purple-600 border-purple-100'
                                                    }`}>
                                                    {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-red-600 bg-red-50 w-fit px-3 py-1 rounded-lg">
                                                    <Calendar size={14} className="mr-2" />
                                                    {user.denied_at ? format(new Date(user.denied_at), 'MMM dd, yyyy h:mm a') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors ml-auto" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{' '}
                                        <span className="font-semibold text-slate-900">{filteredUsers.length}</span> entries
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm space-x-2" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft size={16} />
                                        </button>

                                        {/* Page Numbers */}
                                        {[...Array(totalPages || 1)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === i + 1
                                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages || totalPages <= 1}
                                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Approval Modal (Reused for Denied Users to allow re-approval) */}
                <UserApprovalModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onApprove={(id) => handleApproval(id, 'approve')}
                    onReject={(id) => handleApproval(id, 'delete')}
                    processing={processing}
                    isDenied={true}
                />
            </div>
        </ProtectedRoute>
    );
};

export default DeniedUsers;
