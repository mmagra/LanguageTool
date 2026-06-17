import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CustomDropdown from '../../components/common/CustomDropdown';
import {
  Search,
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-400 ml-1" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={14} className="text-primary-600 ml-1" />
      : <ArrowDown size={14} className="text-primary-600 ml-1" />;
  };



  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget}`);
      toast.success('Teacher deleted successfully');
      setDeleteTarget(null);
      fetchTeachers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete teacher');
    } finally {
      setDeleting(false);
    }
  };

  const changePage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Manage Teachers</h1>
            <p className="text-slate-500 text-sm mt-1">View and manage all teachers in the system.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header & Search */}
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-2">
              <label htmlFor="teachers-per-page" className="text-sm text-slate-500 whitespace-nowrap">Show</label>
              <CustomDropdown
                className="w-20"
                value={itemsPerPage}
                onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                searchable={false}
                showClear={false}
                matchTextInput
                buttonClassName="py-1.5 rounded-lg"
                surfaceClassName="bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                options={[{ value: 10, label: '10' }, { value: 25, label: '25' }, { value: 50, label: '50' }]}
              />
              <span className="text-sm text-slate-500">entries</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search teachers..."
                aria-label="Search teachers"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
            ) : filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="p-4 bg-slate-50 rounded-full mb-3">
                  <UserPlus size={32} className="text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-900">No teachers found</p>
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
                        Teacher Name
                        <SortIcon columnKey="name" />
                      </div>
                    </th>
                    <th
                      className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center">
                        Employee ID
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
                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {currentTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.id}
                      onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-all duration-200 group relative"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {teacher.profile_image ? (
                            <img
                              src={teacher.profile_image}
                              alt={`${teacher.first_name} ${teacher.last_name}`}
                              className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-100 group-hover:border-primary-200 transition-all group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-white text-slate-500 border border-slate-100 group-hover:border-primary-200 group-hover:bg-white flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105">
                              {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {teacher.username || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{teacher.email}</div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{teacher.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                            aria-label={`View ${teacher.first_name} ${teacher.last_name}`}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                            aria-label={`Edit ${teacher.first_name} ${teacher.last_name}`}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(teacher.id)}
                            aria-label={`Delete ${teacher.first_name} ${teacher.last_name}`}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredTeachers.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, filteredTeachers.length)}</span> of{' '}
                <span className="font-semibold text-slate-900">{filteredTeachers.length}</span> entries
              </p>
              <nav className="flex items-center gap-2" aria-label="Pagination">
                <button
                  onClick={() => changePage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages || 1)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => changePage(i + 1)}
                    aria-label={`Page ${i + 1}`}
                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === i + 1
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => changePage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  aria-label="Next page"
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </ProtectedRoute>
  );
};

export default Teachers;
