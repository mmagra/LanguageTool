import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import {
    User, Mail, Phone, Shield, Edit2, Save, X,
    ArrowLeft, Trash2, Camera, Check, AlertCircle, Building, Briefcase, FileText, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPhone, isValidPhone, PHONE_MESSAGE } from '../../utils/validation';
import AdminResetPasswordModal from './modals/AdminResetPasswordModal';

const TeacherDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [teacherData, setTeacherData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        school_name: '',
        username: '',
        about: ''
    });

    useEffect(() => {
        fetchTeacherData();
    }, [id]);

    const fetchTeacherData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/teachers/${id}`);
            const teacher = response.data || {};

            setTeacherData(teacher);
            setFormData({
                first_name: teacher.first_name || '',
                last_name: teacher.last_name || '',
                email: teacher.email || '',
                phone: teacher.phone || '',
                username: teacher.username || '',
                school_name: teacher.school_name || '',
                about: teacher.about || ''
            });

            if (teacher.profile_image) {
                setProfileImage(teacher.profile_image);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching teacher data:', error);
            toast.error('Failed to load teacher data');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'phone' ? formatPhone(value) : value
        });
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file);
                setProfileImage(resizedImage);
            } catch (error) {
                console.error("Error resizing image:", error);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileImage(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phone && !isValidPhone(formData.phone)) {
            toast.error(PHONE_MESSAGE);
            return;
        }
        setSaving(true);

        try {
            await api.put(`/teachers/${id}/profile`, {
                ...formData,
                profile_image: profileImage || ''
            });

            toast.success('Teacher profile updated successfully');
            await fetchTeacherData();
            setIsEditing(false);
        } catch (error) {
            console.error('Update teacher error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success('Teacher deleted successfully');
            navigate('/admin/teachers');
        } catch (error) {
            console.error('Delete teacher error:', error);
            toast.error('Failed to delete teacher');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (teacherData) {
            setFormData({
                first_name: teacherData.first_name || '',
                last_name: teacherData.last_name || '',
                email: teacherData.email || '',
                phone: teacherData.phone || '',
                username: teacherData.username || '',
                school_name: teacherData.school_name || '',
                about: teacherData.about || ''
            });
            setProfileImage(teacherData.profile_image);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!teacherData) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                    <h3 className="text-lg font-bold text-red-700">Teacher Not Found</h3>
                    <button
                        onClick={() => navigate('/admin/teachers')}
                        className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        Return to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute roles={['admin']}>
            <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
                <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Breadcrumb / Back navigation */}
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 flex-wrap" aria-label="Breadcrumb">
                        <Link to="/admin/dashboard" className="hover:text-primary-600 transition-colors font-medium">Dashboard</Link>
                        <span className="text-slate-300">›</span>
                        <Link to="/admin/teachers" className="hover:text-primary-600 transition-colors font-medium">Teachers</Link>
                        <span className="text-slate-300">›</span>
                        <span className="text-slate-600 font-medium">{teacherData?.first_name} {teacherData?.last_name}</span>
                    </nav>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium mb-4">
                        <ArrowLeft size={15} /> Back to Teachers
                    </button>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Cover / Header Area */}
                        <div className="bg-slate-50 p-6 md:p-8 relative">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                {/* Avatar Section */}
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-primary-600 p-[3px] shadow-lg">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                            {profileImage && (profileImage.startsWith('data:') || profileImage.startsWith('http')) ? (
                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
                                                    <span className="text-4xl font-bold text-primary-700 relative z-10">
                                                        {(formData.first_name?.[0] || 'T')}{(formData.last_name?.[0] || 'P')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors border-2 border-primary-600"
                                            >
                                                <Camera size={14} className="text-primary-600" />
                                            </button>
                                            {profileImage && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="absolute bottom-0 left-0 p-1.5 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors border-2 border-red-500"
                                                >
                                                    <Trash2 size={14} className="text-red-500" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </div>

                                {/* Info Section */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl md:text-2xl font-semibold text-slate-900 mb-1 break-words">
                                        {teacherData.first_name} {teacherData.last_name}
                                    </h1>
                                    <p className="text-slate-600 font-medium mb-2 break-all">
                                        {isEditing ? formData.email : teacherData.email}
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                        <span className="text-xs font-semibold tracking-wide text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                            ID: {isEditing ? formData.username : teacherData.username}
                                        </span>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                            <Briefcase size={14} className="text-brand-amber" />
                                            <span className="text-slate-900 font-bold text-xs">Teacher</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
                                    {!isEditing ? (
                                        <>
                                            <div className="relative group">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="p-2 bg-white text-primary-600 rounded-xl shadow-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Edit Profile
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <button
                                                    onClick={() => setShowPasswordModal(true)}
                                                    className="p-2 bg-white text-amber-600 rounded-xl shadow-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                                >
                                                    <Lock size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Change Password
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <button
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="p-2 bg-white text-red-600 rounded-xl shadow-lg hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Delete Teacher
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-bold rounded-xl text-sm transition-all hover:bg-slate-50 border border-slate-200 shadow-sm"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-md hover:-translate-y-0.5 hover:bg-primary-700"
                                            >
                                                {saving ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Save size={16} />
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleSubmit} className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <User size={16} className="text-primary-600" /> First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <User size={16} className="text-primary-600" /> Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Mail size={16} className="text-primary-600" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Phone size={16} className="text-primary-600" /> Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        inputMode="numeric"
                                        maxLength={14}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                        placeholder={!isEditing && !formData.phone ? "Not provided" : "(000) 000 0000"}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Shield size={16} className="text-purple-600" /> Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none font-mono text-sm ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Building size={16} className="text-purple-600" /> School Name
                                    </label>
                                    <div className="w-full px-4 h-12 border border-slate-200 bg-slate-50 rounded-xl flex items-center text-sm text-slate-700 cursor-not-allowed">
                                        {formData.school_name || "Not provided"}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 size={32} className="text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Teacher?</h3>
                                    <p className="text-slate-500 text-sm mb-6">
                                        Are you sure you want to delete <strong>{teacherData.first_name} {teacherData.last_name}</strong>?
                                        This action cannot be undone and will remove all associated data.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all"
                                        >
                                            Yes, Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password Reset Modal */}
                    {showPasswordModal && teacherData && (
                        <AdminResetPasswordModal
                            userId={teacherData.id}
                            userName={`${teacherData.first_name} ${teacherData.last_name}`}
                            onClose={() => setShowPasswordModal(false)}
                        />
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default TeacherDetails;
