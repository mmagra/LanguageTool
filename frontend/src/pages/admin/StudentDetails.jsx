import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import {
    User, Mail, Phone, Shield, Edit2, Save, X,
    ArrowLeft, Trash2, Camera, Check, AlertCircle, Building, Briefcase, FileText, Globe, GraduationCap, UserCheck, Users, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomDropdown from '../../components/common/CustomDropdown';
import AdminResetPasswordModal from './modals/AdminResetPasswordModal';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [grades, setGrades] = useState([]);
    const [languages, setLanguages] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        username: '', // Student ID
        grade_id: '',
        guardian_name: '',
        guardian_relation: '',
        preferred_language_id: '',
        school_name: ''
    });

    const [profileImage, setProfileImage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Filter languages based on school restrictions
    const filteredLanguages = React.useMemo(() => {
        let allowed = studentData?.allowed_languages;

        // Handle case where Postgres returns JSON as string
        if (typeof allowed === 'string') {
            try {
                allowed = JSON.parse(allowed);
            } catch (e) {
                console.error("Failed to parse allowed_languages:", e);
                return languages;
            }
        }

        if (!allowed || !Array.isArray(allowed) || allowed.length === 0) {
            return languages;
        }

        // Filter valid IDs (remove nulls)
        const allowedIds = allowed.filter(id => id !== null).map(String);

        // If allowed list effectively empty after filtering nulls, return all
        if (allowedIds.length === 0) return languages;

        return languages.filter(l => allowedIds.includes(l.value));
    }, [studentData, languages]);

    // Guardian Relations Options
    const GUARDIAN_RELATIONS = [
        { value: 'Father', label: 'Father' },
        { value: 'Mother', label: 'Mother' },
        { value: 'Other', label: 'Other' }
    ];

    const fetchLanguages = async () => {
        try {
            const response = await api.get('/system/languages');
            if (response.success || Array.isArray(response.data)) {
                // Handle both { success: true, data: [...] } and direct array responses
                const langs = response.data || response;
                if (Array.isArray(langs)) {
                    // Sort alphabetically
                    langs.sort((a, b) => a.name.localeCompare(b.name));
                    setLanguages(langs.map(l => ({ value: String(l.id), label: l.name })));
                }
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
            toast.error('Failed to load languages');
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await api.get('/grades');
            if (response.success || Array.isArray(response.data)) {
                const gradesData = response.data || response;
                if (Array.isArray(gradesData)) {
                    setGrades(gradesData.map(g => ({ value: String(g.id), label: g.name })));
                }
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/students/${id}`);
            if (response.success || response.data) {
                const data = response.data || response;
                setStudentData(data);

                // Initialize form data
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    username: data.username || '',
                    grade_id: data.grade_id ? String(data.grade_id) : '',
                    guardian_name: data.guardian_name || '',
                    guardian_relation: data.guardian_relation || '',
                    preferred_language_id: data.preferred_language_id ? String(data.preferred_language_id) : '',
                    school_name: data.school_name || ''
                });

                setProfileImage(data.profile_image);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch student details:', error);
            toast.error('Failed to load student details');
            navigate('/admin/students');
        }
    };

    useEffect(() => {
        fetchStudentDetails();
        fetchGrades();
        fetchLanguages();
    }, [id]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleDropdownChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
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
        setSaving(true);
        setMessage(null);

        try {
            // Validate unique fields if changed (email, username) - Backend usually handles this but good to have UX
            // relying on backend error response for simplicity and consistency with other pages

            const updateData = {
                ...formData,
                profile_image: profileImage || ''
            };

            const response = await api.put(`/students/${id}/profile`, updateData);

            if (response.success) {
                setStudentData({ ...studentData, ...updateData });
                setIsEditing(false);
                toast.success('Student profile updated successfully');
                fetchStudentDetails(); // Refresh to get any server-side formatting
            }
        } catch (error) {
            console.error('Update error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update profile';
            setMessage({ type: 'error', text: errorMsg });
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/users/${id}`); // Admin delete user endpoint
            toast.success('Student deleted successfully');
            navigate('/admin/students');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete student');
            setShowDeleteModal(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form
        if (studentData) {
            setFormData({
                first_name: studentData.first_name || '',
                last_name: studentData.last_name || '',
                phone: studentData.phone || '',
                email: studentData.email || '',
                username: studentData.username || '',
                grade_id: studentData.grade_id ? String(studentData.grade_id) : '',
                guardian_name: studentData.guardian_name || '',
                guardian_relation: studentData.guardian_relation || '',
                preferred_language_id: studentData.preferred_language_id ? String(studentData.preferred_language_id) : '',
                school_name: studentData.school_name || ''
            });
            setProfileImage(studentData.profile_image);
            setMessage(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle size={48} className="mb-4 text-red-400" />
                <p className="text-xl font-semibold text-gray-700">Student not found</p>
                <button
                    onClick={() => navigate('/admin/students')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Back to Students
                </button>
            </div>
        );
    }

    // Filter languages based on school restrictions

    return (
        <ProtectedRoute roles={['admin']}>
            <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
                <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Message Alert */}
                    {message && (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            {message.type === 'success' ? (
                                <Check className="text-green-600 shrink-0" size={20} />
                            ) : (
                                <AlertCircle className="text-red-600 shrink-0" size={20} />
                            )}
                            <p className={`font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        {/* Cover / Header Area */}
                        <div className="bg-[#f0f4fe] p-6 md:p-8 relative">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                {/* Avatar Section */}
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[3px] shadow-lg">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                            {profileImage && (profileImage.startsWith('data:') || profileImage.startsWith('http')) ? (
                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-[#f0f4fe] opacity-50"></div>
                                                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] relative z-10">
                                                        {(formData.first_name?.[0] || 'S')}{(formData.last_name?.[0] || 'T')}
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
                                                className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border-2 border-indigo-600"
                                            >
                                                <Camera size={14} className="text-indigo-600" />
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
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 break-words">
                                        {studentData.first_name} {studentData.last_name}
                                    </h1>
                                    <p className="text-gray-600 font-medium mb-2 break-all">
                                        {isEditing ? formData.email : studentData.email}
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                        <span className="text-xs font-semibold tracking-wide text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                            ID: {isEditing ? formData.username : studentData.username}
                                        </span>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                                            <Shield size={14} className="text-[#f2a93b]" />
                                            <span className="text-gray-900 font-bold text-xs">Student</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
                                    {!isEditing ? (
                                        <>
                                            <div className="relative group">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="p-2 bg-white text-indigo-600 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Edit Profile
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <button
                                                    onClick={() => setShowPasswordModal(true)}
                                                    className="p-2 bg-white text-amber-600 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                                                >
                                                    <Lock size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Change Password
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <button
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="p-2 bg-white text-red-600 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Delete Student
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
                                            >
                                                <X size={18} />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
                                            >
                                                {saving ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Save size={18} />
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
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <User size={16} className="text-indigo-600" /> First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <User size={16} className="text-indigo-600" /> Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Mail size={16} className="text-indigo-600" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Phone size={16} className="text-indigo-600" /> Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                        placeholder={!isEditing && !formData.phone ? "Not provided" : ""}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Shield size={16} className="text-purple-600" /> Student ID
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none font-mono text-sm ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                    />
                                </div>

                                {/* School Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Building size={16} className="text-purple-600" /> School Name
                                    </label>
                                    <div className={`w-full px-4 h-12 border rounded-xl flex items-center text-sm ${isEditing ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                                        {formData.school_name || "Not provided"}
                                    </div>
                                </div>

                                {/* Grade Dropdown */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <GraduationCap size={16} className="text-purple-600" /> Grade
                                    </label>
                                    <CustomDropdown
                                        options={grades}
                                        value={formData.grade_id}
                                        onChange={(val) => handleDropdownChange('grade_id', val)}
                                        placeholder={!isEditing && !formData.grade_id ? "Not provided" : "Select Grade"}
                                        disabled={!isEditing}
                                        buttonClassName="h-12"
                                        matchTextInput={true}
                                        dropdownPosition="top"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Globe size={16} className="text-purple-600" /> Primary Language
                                    </label>
                                    <CustomDropdown
                                        options={filteredLanguages}
                                        value={formData.preferred_language_id}
                                        onChange={(val) => handleDropdownChange('preferred_language_id', val)}
                                        placeholder={!isEditing && !formData.preferred_language_id ? "Not provided" : "Select Language"}
                                        disabled={!isEditing}
                                        buttonClassName="h-12"
                                        matchTextInput={true}
                                        dropdownPosition="top"
                                    />
                                </div>

                                {/* Guardian Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <UserCheck size={16} className="text-blue-600" /> Guardian Name
                                    </label>
                                    <input
                                        type="text"
                                        name="guardian_name"
                                        value={formData.guardian_name}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 h-12 border rounded-xl transition-all outline-none text-sm ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                        placeholder={!isEditing && !formData.guardian_name ? "Not provided" : ""}
                                    />
                                </div>

                                {/* Guardian Relation Dropdown */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Users size={16} className="text-blue-600" /> Guardian Relation
                                    </label>
                                    <CustomDropdown
                                        options={GUARDIAN_RELATIONS}
                                        value={formData.guardian_relation}
                                        onChange={(val) => handleDropdownChange('guardian_relation', val)}
                                        placeholder={!isEditing && !formData.guardian_relation ? "Not provided" : "Select Relation"}
                                        disabled={!isEditing}
                                        buttonClassName="h-12"
                                        matchTextInput={true}
                                        dropdownPosition="top"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                        <AlertCircle className="text-red-600" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Student?</h3>
                                    <p className="text-gray-500 text-center mb-6">
                                        Are you sure you want to delete <strong>{studentData.first_name} {studentData.last_name}</strong>?
                                        This action cannot be undone and all student data will be permanently removed.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
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
                    {showPasswordModal && studentData && (
                        <AdminResetPasswordModal
                            userId={studentData.id}
                            userName={`${studentData.first_name} ${studentData.last_name}`}
                            onClose={() => setShowPasswordModal(false)}
                        />
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default StudentDetails;
