import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Building2, Shield, Calendar, ChevronRight, Users, Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomDropdown from '../../components/common/CustomDropdown';
import { NAME_REGEX, PASSWORD_REGEX, PASSWORD_MESSAGE, sanitizeName } from '../../utils/validation';
import EmptyState from '../../components/common/EmptyState';

const Admins = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [schools, setSchools] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '', role: 'admin', school_id: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, schoolsRes] = await Promise.all([
                api.getAllUsers({ role: 'admin' }),
                api.getAllSchools()
            ]);
            if (usersRes.success) setUsers(usersRes.data);
            if (schoolsRes.success) setSchools(schoolsRes.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        // Field-level validation (matches backend rules)
        if (!NAME_REGEX.test(formData.first_name.trim())) return toast.error('First name can only contain letters');
        if (!NAME_REGEX.test(formData.last_name.trim())) return toast.error('Last name can only contain letters');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return toast.error('Enter a valid email address');
        if (!PASSWORD_REGEX.test(formData.password)) return toast.error(PASSWORD_MESSAGE);
        if (!formData.school_id) return toast.error('Please assign a school');

        try {
            const response = await api.createUser(formData);
            if (response.success) {
                toast.success('Admin created successfully');
                setUsers(prev => [response.data, ...prev]);
                setIsCreateOpen(false);
                setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'admin', school_id: '' });
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to create admin');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.school_name && u.school_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 font-inter">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">School Admins</h1>
                    <p className="text-slate-500 mt-1 text-sm">Click any admin to view their school details.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm"
                >
                    <Plus size={17} />
                    Create Admin
                </button>
            </div>

            {/* Search + count */}
            <div className="flex items-center gap-4">
                <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
                    <Search size={17} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or school..."
                        className="w-full outline-none text-slate-700 text-sm placeholder-slate-400"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-slate-500 text-lg leading-none shrink-0">&times;</button>
                    )}
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-3 flex items-center gap-2.5 shrink-0">
                    <Users size={16} className="text-primary-500" />
                    <span className="text-sm font-bold text-slate-800">{users.length}</span>
                    <span className="text-xs text-slate-400">admins</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact No.</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 shrink-0" />
                                            <div className="h-3.5 w-28 bg-slate-100 rounded" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="h-3 w-36 bg-slate-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-3 w-24 bg-slate-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                                    <td className="px-6 py-4" />
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6">
                                    <EmptyState icon={Shield} title="No admins found" description="Try a different search or create a new admin." />
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr
                                    key={user.id}
                                    onClick={() => user.school_id && navigate(`/super-admin/schools/${user.school_id}`)}
                                    className={`transition-all duration-150 group ${user.school_id ? 'hover:bg-primary-50/60 cursor-pointer' : 'hover:bg-slate-50/60'}`}
                                >
                                    {/* Admin */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {user.profile_image ? (
                                                <img
                                                    src={user.profile_image}
                                                    alt={`${user.first_name} ${user.last_name}`}
                                                    className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-100 group-hover:border-primary-200 transition-all group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-white text-slate-500 border border-slate-100 group-hover:border-primary-200 flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105 shrink-0">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </div>
                                            )}
                                            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                                                {user.first_name} {user.last_name}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail size={13} className="text-slate-300 shrink-0" />
                                            {user.email || <span className="text-slate-300 italic text-xs">—</span>}
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Phone size={13} className="text-slate-300 shrink-0" />
                                            {user.phone || <span className="text-slate-300 italic text-xs">—</span>}
                                        </div>
                                    </td>

                                    {/* School */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.school_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                                    <Building2 size={13} className="text-primary-500" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{user.school_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">No school assigned</span>
                                        )}
                                    </td>

                                    {/* Joined */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Calendar size={12} />
                                            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </td>

                                    {/* Arrow */}
                                    <td className="px-6 py-4 text-right">
                                        {user.school_id && (
                                            <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-400 ml-auto transition-colors" />
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                    <Shield size={15} className="text-primary-600" />
                                </div>
                                <h2 className="text-base font-bold text-slate-900">Create School Admin</h2>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 text-slate-500 hover:text-slate-700 transition-colors text-lg leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">First Name</label>
                                    <input required type="text"
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: sanitizeName(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Last Name</label>
                                    <input required type="text"
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: sanitizeName(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
                                <input required type="email"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
                                <input required type="password"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                <p className="text-[11px] text-slate-400 mt-1">Min 8 chars with uppercase, lowercase, number &amp; special character.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assign School</label>
                                <CustomDropdown
                                    className="w-full"
                                    placeholder="Select a school…"
                                    value={formData.school_id}
                                    onChange={val => setFormData({ ...formData, school_id: val })}
                                    options={schools.map(s => ({ value: String(s.id), label: s.name }))}
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium text-sm transition-colors">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium text-sm transition-colors">
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admins;
