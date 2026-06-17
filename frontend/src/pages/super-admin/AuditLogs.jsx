import React, { useState, useEffect } from 'react';
import {
    Shield, Search, Filter, Calendar, User, FileText,
    ChevronDown, ChevronUp, Clock, MapPin, Monitor
} from 'lucide-react';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import CustomDropdown from '../../components/common/CustomDropdown';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

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
            const params = { page: pagination.page, limit: pagination.limit, ...filters };
            const response = await api.getAuditLogs(params);
            if (response.success) {
                setLogs(response.data.logs || []);
                setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error('Failed to load audit logs');
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
        return 'text-slate-600 bg-slate-50';
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
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900">Audit Logs</h1>
                    <p className="text-slate-500 text-sm mt-1">Track all administrative actions and changes</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by user email..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Action Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Action</label>
                            <CustomDropdown
                                className="w-full"
                                value={filters.action}
                                onChange={val => handleFilterChange('action', val)}
                                showClear={false}
                                options={[
                                    { value: '', label: 'All Actions' },
                                    { value: 'LOGIN', label: 'Login' },
                                    { value: 'LOGOUT', label: 'Logout' },
                                    { value: 'REGISTER', label: 'Register' },
                                    { value: 'CREATE_USER', label: 'Create User' },
                                    { value: 'UPDATE_USER', label: 'Update User' },
                                    { value: 'CREATE', label: 'Create' },
                                    { value: 'UPDATE', label: 'Update' },
                                    { value: 'DELETE', label: 'Delete' },
                                    { value: 'APPROVE', label: 'Approve' },
                                    { value: 'DENY', label: 'Deny' },
                                ]}
                            />
                        </div>

                        {/* Resource Type Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Resource</label>
                            <CustomDropdown
                                className="w-full"
                                value={filters.resource_type}
                                onChange={val => handleFilterChange('resource_type', val)}
                                showClear={false}
                                searchable={false}
                                options={[
                                    { value: '', label: 'All Resources' },
                                    { value: 'auth', label: 'Auth' },
                                    { value: 'school', label: 'School' },
                                    { value: 'payment', label: 'Payment' },
                                    { value: 'user', label: 'User' },
                                    { value: 'subscription', label: 'Subscription' },
                                ]}
                            />
                        </div>

                        {/* From Date */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">From</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full pl-10 pr-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">To</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full pl-10 pr-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ action: '', resource_type: '', search: '', startDate: '', endDate: '' })}
                                className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Total Logs</p>
                                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
                            </div>
                            <FileText className="text-primary-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <LoadingState label="Loading audit logs..." />
                    ) : logs.length === 0 ? (
                        <EmptyState icon={Shield} title="No audit logs found" description="Actions will appear here as they occur." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Resource</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">IP Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {logs.map((log) => (
                                        <React.Fragment key={log.id}>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-slate-900">
                                                        <Clock size={14} className="text-slate-400" />
                                                        {formatDate(log.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-slate-400" />
                                                        <span className="text-sm text-slate-900">{log.user_email || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-slate-900">
                                                        {log.resource_type}
                                                        {log.resource_id && <span className="text-slate-500"> #{log.resource_id}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        {log.ip_address || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleLogDetails(log.id)}
                                                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold"
                                                    >
                                                        {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        {expandedLog === log.id ? 'Hide' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedLog === log.id && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 bg-slate-50">
                                                        <div className="space-y-3">
                                                            {log.user_agent && (
                                                                <div className="flex items-start gap-2">
                                                                    <Monitor size={16} className="text-slate-400 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-slate-600">User Agent</p>
                                                                        <p className="text-sm text-slate-900">{log.user_agent}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {log.details && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-slate-600 mb-2">Action Details</p>
                                                                    <pre className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-900 overflow-x-auto">
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
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
