import React from 'react';
import {
    User, Mail, Phone, Shield, X,
    Check, Building, Briefcase, Globe, GraduationCap, UserCheck, Users, Calendar, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const UserApprovalModal = ({ user, onClose, onApprove, onReject, processing, isDenied = false }) => {
    if (!user) return null;

    const isStudent = user.role === 'student';
    const isTeacher = user.role === 'teacher';

    const [confirmDelete, setConfirmDelete] = React.useState(false);

    const handleDeleteClick = () => {
        if (confirmDelete) {
            onReject(user.id);
        } else {
            setConfirmDelete(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-lg animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">User Details Review</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Header Profile Section */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left mb-8">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 rounded-full bg-primary-600 p-[3px] shadow-lg">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                    {user.profile_image ? (
                                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                            <span className="text-2xl font-semibold text-brand-blue">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-2xl font-semibold text-slate-900 mb-1">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-slate-600 font-medium mb-3">{user.email}</p>

                            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                <span className="text-xs font-semibold tracking-wide text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                    ID: {user.username || 'Not set'}
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                    {isStudent ? (
                                        <Shield size={14} className="text-brand-amber" />
                                    ) : (
                                        <Briefcase size={14} className="text-brand-amber" />
                                    )}
                                    <span className="text-slate-900 font-bold text-xs capitalize">{user.role}</span>
                                </div>
                                <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                    <Calendar size={12} />
                                    Joined {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Common Fields */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <User size={16} className="text-primary-600" /> Full Name
                            </label>
                            <p className="text-slate-900 font-medium">{user.first_name} {user.last_name}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Mail size={16} className="text-primary-600" /> Email Address
                            </label>
                            <p className="text-slate-900 font-medium">{user.email}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Phone size={16} className="text-primary-600" /> Phone Number
                            </label>
                            <p className="text-slate-900 font-medium">{user.phone || 'Not provided'}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Shield size={16} className="text-purple-600" /> Username / ID
                            </label>
                            <p className="text-slate-900 font-medium font-mono">{user.username || 'Not set'}</p>
                        </div>

                        {/* Student Specific Fields */}
                        {isStudent && (
                            <>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <GraduationCap size={16} className="text-purple-600" /> Grade
                                    </label>
                                    <p className="text-slate-900 font-medium">{user.grade_id ? `Grade ${user.grade_id}` : 'Not provided'}</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Globe size={16} className="text-purple-600" /> Primary Language
                                    </label>
                                    <p className="text-slate-900 font-medium">{user.preferred_language || 'Not provided'}</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <UserCheck size={16} className="text-blue-600" /> Guardian Name
                                    </label>
                                    <p className="text-slate-900 font-medium">{user.guardian_name || 'Not provided'}</p>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Users size={16} className="text-blue-600" /> Guardian Relation
                                    </label>
                                    <p className="text-slate-900 font-medium">{user.guardian_relation || 'Not provided'}</p>
                                </div>
                            </>
                        )}

                        {/* Teacher Specific Fields */}
                        {isTeacher && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-1 md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Building size={16} className="text-purple-600" /> School Name
                                </label>
                                <p className="text-slate-900 font-medium">{user.school_name || 'Not provided'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button
                        onClick={handleDeleteClick}
                        onMouseLeave={() => setConfirmDelete(false)}
                        disabled={processing}
                        className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl border shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isDenied
                            ? (confirmDelete
                                ? 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-500/20'
                                : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300')
                            : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
                            }`}
                    >
                        {processing ? (
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : isDenied ? <Trash2 size={16} /> : <X size={16} />}
                        {isDenied
                            ? (confirmDelete ? 'Confirm Delete?' : 'Delete Application')
                            : 'Reject Application'}
                    </button>
                    <button
                        onClick={() => onApprove(user.id)}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {processing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                        Approve Application
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserApprovalModal;
