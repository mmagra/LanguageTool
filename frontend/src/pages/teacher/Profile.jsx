import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    User, Mail, Phone, Shield, Edit2, Save, X, GraduationCap,
    Globe, Briefcase, Award, Clock, FileText, Camera, Check, Trash2, Building
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import { formatPhone, isValidPhone, PHONE_MESSAGE } from '../../utils/validation';
import CustomDropdown from '../../components/common/CustomDropdown';
import api from '../../services/api';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [teacherData, setTeacherData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        school_name: '',
        about: ''
    });

    useEffect(() => {
        if (user?.id) {
            fetchTeacherData();
        }
    }, [user]);

    const fetchTeacherData = async () => {
        try {
            setError(null);

            // Use the centralized API service
            const response = await api.get(`/teachers/${user.id}`);
            const data = response; // api.js interceptor returns response.data directly


            if (data && data.success) {
                const teacher = data.data || {};

                // Map data from backend
                const firstName = teacher.first_name || teacher.firstName || user.firstName || '';
                const lastName = teacher.last_name || teacher.lastName || user.lastName || '';
                const email = teacher.email || user.email || '';
                const phone = teacher.phone || '';

                setTeacherData(teacher);
                setFormData({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    school_name: teacher.school_name || '',
                    about: teacher.about || ''
                });

                if (teacher.profile_image) {
                    setProfileImage(teacher.profile_image);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch teacher data');
            }
        } catch (error) {
            console.error('Error fetching teacher data:', error);
            setError(error.message || 'Failed to load profile data.');

            // Fallback to user context
            setTeacherData({
                first_name: user?.firstName || '',
                last_name: user?.lastName || '',
                email: user?.email || '',
            });

            setFormData(prev => ({
                ...prev,
                first_name: user?.firstName || '',
                last_name: user?.lastName || ''
            }));
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
            setMessage({ type: 'error', text: PHONE_MESSAGE });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const data = await api.put(`/teachers/${user.id}/profile`, {
                ...formData,
                profile_image: profileImage || ''
            });

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                await fetchTeacherData();
                if (refreshUser) await refreshUser();
                setIsEditing(false);
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (teacherData) {
            setFormData({
                first_name: teacherData.first_name || teacherData.firstName || user.firstName || '',
                last_name: teacherData.last_name || teacherData.lastName || user.lastName || '',
                phone: teacherData.phone || '',
                school_name: teacherData.school_name || '',
                about: teacherData.about || ''
            });
        }
        setMessage(null);
    };

    if (!teacherData) {
        if (error) return <ErrorState title="Error Loading Profile" message={error} onRetry={fetchTeacherData} />;
        return (
            <div className="h-full animate-fade-in p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                    <div className="animate-pulse space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 rounded-full bg-slate-200"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-8 bg-slate-200 rounded w-48"></div>
                                <div className="h-4 bg-slate-200 rounded w-64"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
            <div className="max-w-5xl mx-auto">
                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        {message.type === 'success' ? <Check className="text-green-600 shrink-0" size={20} /> : <AlertCircle className="text-red-600 shrink-0" size={20} />}
                        <p className={`font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-50 p-6 md:p-8 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
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

                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-2xl font-semibold text-slate-900 mb-1 break-words">
                                    {formData.first_name || 'Teacher'} {formData.last_name || 'Name'}
                                </h1>
                                <p className="text-slate-600 font-medium mb-2 break-all">{teacherData.email}</p>
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <span className="text-xs font-semibold tracking-wide text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                        ID: {teacherData.username || 'Not set'}
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                        <Briefcase size={14} className="text-brand-amber" />
                                        <span className="text-slate-900 font-bold text-xs">Teacher</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-primary-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-md hover:-translate-y-0.5"
                                    >
                                        <Edit2 size={16} />
                                        Edit Profile
                                    </button>
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
                                            disabled={loading}
                                            className={`flex items-center gap-2 px-4 py-2 bg-white text-primary-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-md hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <Save size={16} />
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basics */}
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
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
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
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Mail size={16} className="text-primary-600" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={teacherData.email}
                                    disabled
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Phone size={16} className="text-primary-600" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    inputMode="numeric"
                                    maxLength={14}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'}`}
                                    placeholder={!isEditing && !formData.phone ? "Not provided" : "(000) 000 0000"}
                                />
                            </div>

                            {/* Teacher Specifics */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Shield size={16} className="text-purple-600" /> Employee ID
                                </label>
                                <input
                                    type="text"
                                    value={teacherData.username || ''}
                                    disabled
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Building size={16} className="text-purple-600" /> School Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.school_name}
                                    disabled
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
