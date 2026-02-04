import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    Building2,
    ChevronRight,
    ChevronLeft,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    CheckCircle,
    XCircle
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import CreateSchoolWizard from './modals/CreateSchoolWizard';

const Schools = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Pagination & Sorting State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' }); // Default sort by ID descending (newest first)

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            setLoading(true);
            const response = await api.getAllSchools();
            if (response.success) {
                setSchools(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch schools:', error);
            toast.error('Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    const handleSchoolCreated = () => {
        fetchSchools();
    };

    // Sorting Helper
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter & Sort
    const filteredSchools = schools.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedSchools = [...filteredSchools].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested or specific fields
        if (sortConfig.key === 'students') {
            aValue = parseInt(a.student_count || 0);
            bValue = parseInt(b.student_count || 0);
        } else if (sortConfig.key === 'teachers') {
            aValue = parseInt(a.teacher_count || 0);
            bValue = parseInt(b.teacher_count || 0);
        } else if (sortConfig.key === 'minutes') {
            aValue = parseInt(a.minutes_used || 0);
            bValue = parseInt(b.minutes_used || 0);
        } else if (sortConfig.key === 'id') {
            aValue = parseInt(a.id || 0);
            bValue = parseInt(b.id || 0);
        } else {
            // string sort
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSchools = sortedSchools.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedSchools.length / itemsPerPage);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400 ml-1" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-indigo-600 ml-1" />
            : <ArrowDown size={14} className="text-indigo-600 ml-1" />;
    };

    return (
        <div className="space-y-6 font-inter animate-fade-in">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Manage Schools</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage school accounts, plans, and usage limits.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md active:scale-95 text-sm font-medium"
                >
                    <Plus size={18} />
                    Add School
                </button>
            </div>

            {/* Create Wizard */}
            <CreateSchoolWizard
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSchoolCreated={handleSchoolCreated}
            />

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 overflow-hidden">

                {/* Search Bar */}
                <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-end gap-4 bg-white">
                    <div className="relative w-full sm:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search schools..."
                            className="pl-10 pr-4 py-2 w-full bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredSchools.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <div className="p-4 bg-gray-50 rounded-full mb-3">
                                <Building2 size={32} className="text-gray-400" />
                            </div>
                            <p className="text-base font-semibold text-gray-900">No schools found</p>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            School Name
                                            <SortIcon columnKey="name" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            <SortIcon columnKey="status" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                        onClick={() => handleSort('plan_tier')}
                                    >
                                        <div className="flex items-center">
                                            Plan & Expiry
                                            <SortIcon columnKey="plan_tier" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                        onClick={() => handleSort('students')}
                                    >
                                        <div className="flex items-center">
                                            Students
                                            <SortIcon columnKey="students" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                        onClick={() => handleSort('teachers')}
                                    >
                                        <div className="flex items-center">
                                            Teachers
                                            <SortIcon columnKey="teachers" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                                        onClick={() => handleSort('minutes')}
                                    >
                                        <div className="flex items-center">
                                            In-Person Minutes
                                            <SortIcon columnKey="minutes" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        <ChevronRight size={16} className="ml-auto" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentSchools.map((school) => (
                                    <tr
                                        key={school.id}
                                        onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                                        className="hover:bg-gray-50 cursor-pointer transition-all duration-200 group relative"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {school.logo_url ? (
                                                    <img
                                                        src={school.logo_url}
                                                        alt={school.name}
                                                        className="h-10 w-24 rounded-lg object-contain bg-gray-50 border border-gray-100 group-hover:border-indigo-200 transition-all group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-24 rounded-lg bg-gray-50 text-gray-400 border border-gray-100 group-hover:border-indigo-200 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
                                                        <Building2 size={20} />
                                                    </div>
                                                )}
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        {school.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{school.contact_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${school.status === 'active'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {school.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <span className="text-sm text-gray-700 capitalize font-medium block">{school.plan_tier}</span>
                                                {school.valid_until && (
                                                    <span className="text-xs text-gray-400">
                                                        Exp: {new Date(school.valid_until).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-900 font-semibold">{school.student_count || 0}</span>
                                                <span className="text-xs text-gray-400">/ {school.max_students}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((school.student_count || 0) / school.max_students) * 100)}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-900 font-semibold">{school.teacher_count || 0}</span>
                                                <span className="text-xs text-gray-400">/ {school.max_teachers}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, ((school.teacher_count || 0) / school.max_teachers) * 100)}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-900 font-semibold">{(school.minutes_used || 0).toLocaleString()}</span>
                                                <span className="text-xs text-gray-400">/ {(school.minutes_limit || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ((school.minutes_used || 0) / (school.minutes_limit || 1)) * 100)}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors ml-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {filteredSchools.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredSchools.length)}</span> of{' '}
                                    <span className="font-semibold text-gray-900">{filteredSchools.length}</span> schools
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-lg shadow-sm space-x-2" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
        </div>
    );
};

export default Schools;
