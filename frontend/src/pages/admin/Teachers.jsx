import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import DashboardLayout from '../../components/common/DashboardLayout';
import {
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sorting helper
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teachers');
      const teacherData = (response.data || []).filter(teacher => ['active', 'approved'].includes(teacher.status));
      setTeachers(teacherData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      toast.error('Failed to load teachers');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    const term = searchTerm.toLowerCase();
    return (
      teacher.first_name?.toLowerCase().includes(term) ||
      teacher.last_name?.toLowerCase().includes(term) ||
      teacher.email?.toLowerCase().includes(term) ||
      teacher.username?.toLowerCase().includes(term) ||
      teacher.phone?.toLowerCase().includes(term)
    );
  });

  // Sorting logic
  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
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
  const currentTeachers = sortedTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);

  // Helper to render sort icon
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400 ml-1" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} className="text-primary-600 ml-1" />
      : <ArrowDown size={14} className="text-primary-600 ml-1" />;
  };



  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      // Demo delete
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      toast.success('Teacher deleted successfully');

      // Actual API call commented out
      /*
      try {
        await api.delete(`/admin/users/${teacherId}`);
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      } catch (error) {
        toast.error('Failed to delete teacher');
        console.error(error);
      }
      */
    }
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Manage Teachers</h1>
            <p className="text-gray-500 text-sm mt-1">View and manage all teachers in the system.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 overflow-hidden">
          {/* Header & Search - Clean, Unified */}
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-end gap-4 bg-white">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-600 transition-colors" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="p-4 bg-gray-50 rounded-full mb-3">
                  <UserPlus size={32} className="text-gray-400" />
                </div>
                <p className="text-base font-semibold text-gray-900">No teachers found</p>
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
                        Teacher Name
                        <SortIcon columnKey="name" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center">
                        Employee ID
                        <SortIcon columnKey="username" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        <SortIcon columnKey="email" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <ChevronRight size={16} className="ml-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.id}
                      onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-all duration-200 group relative"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {teacher.profile_image ? (
                            <img
                              src={teacher.profile_image}
                              alt={`${teacher.first_name} ${teacher.last_name}`}
                              className="h-12 w-12 rounded-full object-cover shadow-sm border border-gray-100 group-hover:border-primary-200 transition-all group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-white text-gray-500 border border-gray-100 group-hover:border-primary-200 group-hover:bg-white flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105">
                              {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                          {teacher.username || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{teacher.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{teacher.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredTeachers.length > 0 && (
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
                    Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredTeachers.length)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{filteredTeachers.length}</span> entries
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
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages <= 1}
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

      {/* Fixed Position Action Menu */}
      {/* Fixed Position Action Menu */}
      {openActionMenu && (
        <div
          className="fixed z-50 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: 'translateX(-100%)' // Align right edge with button
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            onClick={() => { /* TODO: View */ setOpenActionMenu(null); }}
          >
            <Eye size={14} className="text-blue-500" />
            View Details
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            onClick={() => { /* TODO: Edit */ setOpenActionMenu(null); }}
          >
            <Edit size={14} className="text-amber-500" />
            Edit Teacher
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
            onClick={() => { handleDelete(openActionMenu); setOpenActionMenu(null); }}
          >
            <Trash2 size={14} className="text-red-500" />
            Delete Teacher
          </button>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default Teachers;
