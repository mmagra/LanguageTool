import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import {
    Users,
    CheckSquare,
    Square,
    ArrowRight,
    Search,
    AlertTriangle,
    ArrowUpRight,
    GraduationCap,
    Filter,
    School
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentGrades = () => {
    const [grades, setGrades] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Selection States
    const [sourceGrade, setSourceGrade] = useState('');
    const [targetGrade, setTargetGrade] = useState('');
    const [selectedStudents, setSelectedStudents] = useState(new Set());

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Fetch Grades
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const response = await api.get('/grades');
                setGrades(response.data || []);
            } catch (error) {
                console.error('Failed to fetch grades:', error);
                toast.error('Failed to load grades');
            }
        };
        fetchGrades();
    }, []);

    // Fetch Students when Source Grade changes
    useEffect(() => {
        if (!sourceGrade) {
            setStudents([]);
            setSelectedStudents(new Set());
            return;
        }

        const fetchStudentsByGrade = async () => {
            try {
                setFetchingStudents(true);
                const response = await api.get(`/students/grade/${sourceGrade}`);
                setStudents(response.data || []);
                setSelectedStudents(new Set()); // Reset selection
            } catch (error) {
                console.error('Failed to fetch students:', error);
                toast.error('Failed to load students');
            } finally {
                setFetchingStudents(false);
            }
        };

        fetchStudentsByGrade();
    }, [sourceGrade]);

    // Filtered Students
    const filteredStudents = students.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Toggle Selection
    const toggleStudent = (id) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudents.size === filteredStudents.length && filteredStudents.length > 0) {
            setSelectedStudents(new Set());
        } else {
            const newSelected = new Set(filteredStudents.map(s => s.id));
            setSelectedStudents(newSelected);
        }
    };

    // Handle Update
    const handleUpdate = async () => {
        try {
            setLoading(true);
            const studentIds = Array.from(selectedStudents);

            await api.post('/students/bulk-grade-update', {
                studentIds,
                newGradeId: targetGrade
            });

            toast.success(`Successfully moved ${studentIds.length} students`);

            // Refresh list
            const response = await api.get(`/students/grade/${sourceGrade}`);
            setStudents(response.data || []);
            setSelectedStudents(new Set());
            setShowConfirmModal(false);

        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.message || 'Failed to update grades');
        } finally {
            setLoading(false);
        }
    };

    const getGradeName = (id) => grades.find(g => g.id.toString() === id.toString())?.name || 'Unknown';

    return (
        <ProtectedRoute roles={['admin']}>
            <div className="space-y-8 pb-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Grade Change for Multiple Students</h1>
                        <p className="text-gray-500 text-sm mt-1">Efficiently update grade levels for multiple students in a single action.</p>
                    </div>
                    {students.length > 0 && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Total Students</p>
                                <p className="text-lg font-bold text-gray-900">{students.length}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-1">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

                        {/* Source Column */}
                        <div className="md:col-span-5 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                                <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">From Grade</span>
                            </div>
                            <div className="relative group">
                                <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <select
                                    value={sourceGrade}
                                    onChange={(e) => setSourceGrade(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none font-medium"
                                >
                                    <option value="">Select current grade...</option>
                                    {grades.map(grade => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 pl-1">Select the grade you want to move students <b>from</b>.</p>
                        </div>

                        {/* Middle Arrow */}
                        <div className="md:col-span-2 flex items-center justify-center py-4 md:py-0 relative">
                            <div className="absolute inset-x-0 top-1/2 border-t border-gray-100 hidden md:block"></div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center z-10 text-gray-400">
                                <ArrowRight size={20} />
                            </div>
                        </div>

                        {/* Target Column */}
                        <div className="md:col-span-5 p-6 space-y-4 bg-gray-50/50 rounded-r-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</div>
                                <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">To Grade</span>
                            </div>
                            <div className="relative group">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" size={18} />
                                <select
                                    value={targetGrade}
                                    onChange={(e) => setTargetGrade(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none appearance-none font-medium disabled:opacity-50 disabled:bg-gray-100"
                                    disabled={!sourceGrade || selectedStudents.size === 0}
                                >
                                    <option value="">Select target grade...</option>
                                    {grades.filter(g => g.id.toString() !== sourceGrade).map(grade => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 pl-1">Select the destination grade to move students <b>to</b>.</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50">
                    {!sourceGrade ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400 animate-in fade-in zoom-in-95 leading-relaxed">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <Users size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No Grade Selected</h3>
                            <p className="text-sm text-gray-500 max-w-sm text-center mt-2">
                                Please select a source grade from the panel above to view and manage students.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide">
                                        {getGradeName(sourceGrade)}
                                    </div>
                                    <span className="text-gray-400 text-sm">•</span>
                                    <span className="text-sm text-gray-500">{filteredStudents.length} Students found</span>
                                </div>

                                <div className="relative w-full sm:w-72">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-300 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                {fetchingStudents ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                                            <Search size={24} className="text-gray-400" />
                                        </div>
                                        <p>No students found matching your search.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-4 w-16">
                                                    <button
                                                        onClick={toggleAll}
                                                        className="flex items-center justify-center transition-all active:scale-95"
                                                    >
                                                        {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? (
                                                            <div className="bg-blue-600 text-white rounded-md p-0.5">
                                                                <CheckSquare size={18} />
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-300 hover:text-gray-400">
                                                                <Square size={20} />
                                                            </div>
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guardian Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Language</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredStudents.map((student) => {
                                                const isSelected = selectedStudents.has(student.id);
                                                return (
                                                    <tr
                                                        key={student.id}
                                                        onClick={() => toggleStudent(student.id)}
                                                        className={`
                                                            group cursor-pointer transition-all duration-200
                                                            ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                                                        `}
                                                    >
                                                        <td className="px-6 py-4 text-center">
                                                            <div className={`
                                                                transition-all duration-200
                                                                ${isSelected ? 'text-blue-600 scale-110' : 'text-gray-300 group-hover:text-gray-400'}
                                                            `}>
                                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                {student.profile_image ? (
                                                                    <img
                                                                        src={student.profile_image}
                                                                        alt={`${student.first_name} ${student.last_name}`}
                                                                        className="h-12 w-12 rounded-full object-cover shadow-sm border border-gray-100 group-hover:border-primary-200 transition-all group-hover:scale-105"
                                                                    />
                                                                ) : (
                                                                    <div className="h-12 w-12 rounded-full bg-white text-gray-500 border border-gray-100 group-hover:border-primary-200 group-hover:bg-white flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105">
                                                                        {student.first_name?.[0]}{student.last_name?.[0]}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {student.first_name} {student.last_name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">ID: {student.username || 'N/A'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-700">
                                                                {student.guardian_name || <span className="text-gray-400 italic">Not set</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-600">{student.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                                                                {student.preferred_language || 'English'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                                {student.grade_name || 'N/A'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className={`
                fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 pl-6 pr-2 flex items-center gap-8 transition-all duration-300 z-40
                ${selectedStudents.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
            `}>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-600/30">
                        {selectedStudents.size}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                        Students Selected
                    </div>
                </div>

                <div className="h-8 w-px bg-gray-200"></div>

                <div className="flex items-center gap-3">
                    {targetGrade ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                            <span className="text-gray-500">Moving to:</span>
                            <span className="font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                                {getGradeName(targetGrade)}
                            </span>
                        </div>
                    ) : (
                        <div className="text-sm text-amber-600 flex items-center gap-2 animate-pulse">
                            <AlertTriangle size={14} />
                            Select specific target grade above
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!targetGrade}
                    className="ml-4 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                    Confirm Move
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-gray-900/5">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <ArrowUpRight size={32} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Confirm Grade Transfer</h3>
                                    <p className="text-gray-500 text-sm mt-1">Review the details below before proceeding.</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Students Selected</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedStudents.size}</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">From Grade</span>
                                    <span className="text-sm font-medium text-gray-900">{getGradeName(sourceGrade)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">To Grade</span>
                                    <span className="text-sm font-bold text-green-600">{getGradeName(targetGrade)}</span>
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-400 mt-6">
                                This action will immediately update the profiles of all selected students.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Confirm Transfer
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
};

export default StudentGrades;
