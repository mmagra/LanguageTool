import React, { useState, useEffect } from 'react';
import {
    Shield, Search, Filter, Calendar, User, FileText,
    ChevronDown, ChevronUp, Clock, MapPin, Monitor
} from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        resource_type: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [expandedLog, setExpandedLog] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        fetchAuditLogs();
    }, [filters, pagination.page]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            });

            const response = await fetch(`/api/super-admin/audit-logs?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setLogs(data.data.logs || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.data.total || 0
                }));
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const getActionColor = (action) => {
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (action.includes('APPROVE')) return 'text-emerald-600 bg-emerald-50';
        if (action.includes('DENY')) return 'text-orange-600 bg-orange-50';
        return 'text-gray-600 bg-gray-50';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleLogDetails = (logId) => {
        setExpandedLog(expandedLog === logId ? null : logId);
    };

    return (
        <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Audit Logs</h1>
                    <p className="text-gray-500 text-sm mt-1">Track all administrative actions and changes</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by user email..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Action Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Action</label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="APPROVE">Approve</option>
                                <option value="DENY">Deny</option>
                            </select>
                        </div>

                        {/* Resource Type Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Resource</label>
                            <select
                                value={filters.resource_type}
                                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                            >
                                <option value="">All Resources</option>
                                <option value="school">School</option>
                                <option value="payment">Payment</option>
                                <option value="user">User</option>
                                <option value="subscription">Subscription</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ action: '', resource_type: '', search: '', startDate: '', endDate: '' })}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1">Total Logs</p>
                                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                            </div>
                            <FileText className="text-indigo-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Loading audit logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Shield className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-600 font-semibold">No audit logs found</p>
                            <p className="text-sm text-gray-500 mt-1">Actions will appear here as they occur</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resource</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <React.Fragment key={log.id}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-gray-900">
                                                        <Clock size={14} className="text-gray-400" />
                                                        {formatDate(log.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-gray-400" />
                                                        <span className="text-sm text-gray-900">{log.user_email || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {log.resource_type}
                                                        {log.resource_id && <span className="text-gray-500"> #{log.resource_id}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {log.ip_address || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleLogDetails(log.id)}
                                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                                                    >
                                                        {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        {expandedLog === log.id ? 'Hide' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedLog === log.id && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                                        <div className="space-y-3">
                                                            {log.user_agent && (
                                                                <div className="flex items-start gap-2">
                                                                    <Monitor size={16} className="text-gray-400 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-gray-600">User Agent</p>
                                                                        <p className="text-sm text-gray-900">{log.user_agent}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {log.details && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Action Details</p>
                                                                    <pre className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-900 overflow-x-auto">
                                                                        {JSON.stringify(log.details, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && logs.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
