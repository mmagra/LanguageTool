import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    UserPlus,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Podcast,
    GraduationCap,
    Languages
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomDropdown from '../../components/common/CustomDropdown';

// Removed hardcoded LANGUAGES to use dynamic school allowed languages


const LiveConversation = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Filter States
    const [grades, setGrades] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const [studentsRes, gradesRes, schoolRes] = await Promise.all([
                api.get('/students'),
                api.get('/grades'),
                api.getMySchool()
            ]);

            // Map backend data to frontend structure
            const mappedStudents = studentsRes.data
                .map(student => ({
                    ...student,
                    student_id: student.username || `STU-2024-${student.id.toString().padStart(3, '0')}`,
                    grade: student.grade_name || 'N/A',
                    language: student.preferred_language || 'N/A',
                    guardian_name: student.guardian_name || 'N/A'
                }))
                .sort((a, b) => b.id - a.id); // Ensure descending order

            setStudents(mappedStudents);
            setGrades(gradesRes.data || []);

            const allowedLangs = schoolRes.data?.allowed_languages || [];
            allowedLangs.sort((a, b) => a.name.localeCompare(b.name));
            setLanguages(allowedLangs);

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load students');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // Sorting helper
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter students based on search and dropdowns
    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (
            student.first_name?.toLowerCase().includes(term) ||
            student.last_name?.toLowerCase().includes(term) ||
            student.email?.toLowerCase().includes(term) ||
            student.student_id?.toLowerCase().includes(term) ||
            student.grade?.toLowerCase().includes(term)
        );

        const matchesGrade = selectedGrade ? student.grade === selectedGrade : true;
        const matchesLanguage = selectedLanguage ? student.language === selectedLanguage : true;

        return matchesSearch && matchesGrade && matchesLanguage;
    });

    // Sorting logic
    const sortedStudents = [...filteredStudents].sort((a, b) => {
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
    const currentStudents = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

    // Helper to render sort icon
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-400 ml-1" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-primary-600 ml-1" />
            : <ArrowDown size={14} className="text-primary-600 ml-1" />;
    };



    return (
        <ProtectedRoute roles={['teacher']}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Live Conversation</h1>
                        <p className="text-slate-500 text-sm mt-1">Select a student to start a live conversation.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Header & Search - Clean, Unified */}
                    <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            {/* Grade Filter */}
                            <CustomDropdown
                                options={grades}
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                placeholder="All Grades"
                                icon={GraduationCap}
                                className="w-full sm:w-64"
                            />

                            {/* Language Filter */}
                            <CustomDropdown
                                options={languages}
                                value={selectedLanguage}
                                onChange={setSelectedLanguage}
                                placeholder="All Languages"
                                icon={Languages}
                                className="w-full sm:w-64"
                            />
                        </div>

                        <div className="relative w-full sm:w-64 group">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-10 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm hover:border-slate-300 hover:shadow-md"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <div className="p-4 bg-slate-50 rounded-full mb-3">
                                    <UserPlus size={32} className="text-slate-400" />
                                </div>
                                <p className="text-base font-semibold text-slate-900">No students found</p>
                                <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Student Name
                                                <SortIcon columnKey="name" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('student_id')}
                                        >
                                            <div className="flex items-center">
                                                Student ID
                                                <SortIcon columnKey="student_id" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('grade')}
                                        >
                                            <div className="flex items-center">
                                                Grade
                                                <SortIcon columnKey="grade" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('guardian_name')}
                                        >
                                            <div className="flex items-center">
                                                Guardian Name
                                                <SortIcon columnKey="guardian_name" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                                            onClick={() => handleSort('language')}
                                        >
                                            <div className="flex items-center">
                                                Language
                                                <SortIcon columnKey="language" />
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {currentStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-100 transition-colors duration-200 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {student.profile_image ? (
                                                        <img
                                                            src={student.profile_image}
                                                            alt={`${student.first_name} ${student.last_name}`}
                                                            className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-100 group-hover:border-primary-200 transition-all group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-white text-slate-500 border border-slate-100 group-hover:border-primary-200 group-hover:bg-white flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105">
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </div>
                                                    )}
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                                                            {student.first_name} {student.last_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                                    {student.student_id || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{student.grade || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{student.guardian_name || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{student.language || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{student.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600">{student.phone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium overflow-visible">
                                                <button
                                                    onClick={() => navigate('/teacher/live-conversation-session', { state: { student } })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100/50 text-primary-700 font-medium rounded-lg hover:bg-primary-700 hover:text-white hover:shadow-md transition-all shadow-sm group-hover:scale-105"
                                                    title="Start Live Conversation"
                                                >
                                                    <Podcast size={14} />
                                                    Start Communication
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {filteredStudents.length > 0 && (
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
                                        Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, filteredStudents.length)}</span> of{' '}
                                        <span className="font-semibold text-slate-900">{filteredStudents.length}</span> entries
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
            </div>

        </ProtectedRoute>
    );
};

export default LiveConversation;
