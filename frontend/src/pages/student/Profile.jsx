import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
    User, Mail, Phone, Shield, Edit2, Save, X, GraduationCap,
    Globe, Users, UserCheck, Camera, Check, Trash2
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import { formatPhone, isValidPhone, PHONE_MESSAGE } from '../../utils/validation';
import CustomDropdown from '../../components/common/CustomDropdown';
import useSchoolLanguages from '../../hooks/useSchoolLanguages';
import api from '../../services/api';





const Profile = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const { languages } = useSchoolLanguages(); // Active languages from backend

    const guardianRelations = [
        { value: 'Father', label: 'Father' },
        { value: 'Mother', label: 'Mother' },
        { value: 'Other', label: 'Other' }
    ];
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [grades, setGrades] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        grade_id: '',
        guardian_name: '',
        guardian_relation: '',
        preferred_language_id: ''
    });

    useEffect(() => {
        if (user?.id) {
            fetchGrades();
            fetchStudentData();
        }
    }, [user]);

    const fetchGrades = async () => {
        try {
            const response = await api.get('/grades');
            const data = response; // api.js returns data directly
            if (data.success) {
                // Transform grades for CustomDropdown
                setGrades(data.data.map(g => ({ value: String(g.id), label: g.name })));
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const fetchStudentData = async () => {
        try {
            setError(null);

            const response = await api.get(`/students/${user.id}`);
            const data = response; // api.js returns data directly


            if (data && data.success) {
                const student = data.data || {};

                // Robust mapping handling both snake_case and camelCase and user fallback
                const firstName = student.first_name || student.firstName || user.firstName || '';
                const lastName = student.last_name || student.lastName || user.lastName || '';
                const email = student.email || user.email || '';
                const phone = student.phone || '';

                // Ensure grade_id is string for Select mapping
                const gradeId = student.grade_id ? String(student.grade_id) : '';


                setStudentData(student);
                setFormData({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    grade_id: gradeId,
                    guardian_name: student.guardian_name || student.guardianName || '',
                    guardian_relation: student.guardian_relation || student.guardianRelation || '',
                    preferred_language_id: student.preferred_language_id ? String(student.preferred_language_id) : ''
                });

                if (student.profile_image) {
                    setProfileImage(student.profile_image);
                }
            } else {
                throw new Error(data.message || t('profile:errorLoading'));
            }
        } catch (error) {
            console.error('Error fetching student data:', error);
            setError(error.message || t('profile:errorLoading'));

            // Fallback to user context on error
            setStudentData({
                first_name: user?.firstName || '',
                last_name: user?.lastName || '',
                email: user?.email || '',
                // other fields empty
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

    const handleDropdownChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
                // Fallback to original if resize fails
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
            const data = await api.put(`/students/${user.id}/profile`, {
                ...formData,
                profile_image: profileImage || '' // Send empty string if null
            });

            if (data.success) {
                setMessage({ type: 'success', text: t('profile:successUpdate') });
                await fetchStudentData();
                if (refreshUser) await refreshUser(); // Update global user context to sync header
                setIsEditing(false);
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || t('profile:errorUpdate') });
            }
        } catch (error) {
            setMessage({ type: 'error', text: t('profile:genericError') });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to current studentData values
        if (studentData) {
            setFormData({
                first_name: studentData.first_name || studentData.firstName || user.firstName || '',
                last_name: studentData.last_name || studentData.lastName || user.lastName || '',
                phone: studentData.phone || '',
                grade_id: studentData.grade_id ? String(studentData.grade_id) : '',
                guardian_name: studentData.guardian_name || '',
                guardian_relation: studentData.guardian_relation || '',
                preferred_language_id: studentData.preferred_language_id ? String(studentData.preferred_language_id) : ''
            });
        }
        setMessage(null);
    };

    // Loading skeleton
    if (!studentData) {
        if (error) return <ErrorState title={t('profile:errorLoading')} message={error} onRetry={fetchStudentData} />;
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
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
                            ))}
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

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header with Avatar */}
                    {/* Header with Avatar */}
                    <div className="bg-slate-50 p-6 md:p-8 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                            {/* Profile Picture */}
                            <div className="relative group shrink-0">
                                <div className="w-24 h-24 rounded-full bg-primary-600 p-[3px] shadow-lg">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                        {profileImage && (profileImage.startsWith('data:') || profileImage.startsWith('http')) ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
                                                <span className="text-4xl font-bold text-primary-700 relative z-10">
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
                                            className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors border-2 border-primary-600"
                                        >
                                            <Camera size={14} className="text-primary-600" />
                                        </button>
                                        {profileImage && (profileImage.startsWith('data:') || profileImage.startsWith('http')) && (
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Name and Role */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-2xl font-semibold text-slate-900 mb-1 break-words">
                                    {formData.first_name || 'Student'} {formData.last_name || 'Name'}
                                </h1>
                                <p className="text-slate-600 font-medium mb-2 break-all">{studentData.email}</p>
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <span className="text-xs font-semibold tracking-wide text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                        {t('profile:studentID')}: {studentData.username || t('common:notProvided')}
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                        <Shield size={14} className="text-brand-amber" />
                                        <span className="text-slate-900 font-bold text-xs">{t('profile:role')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-primary-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-md hover:-translate-y-0.5"
                                    >
                                        <Edit2 size={16} />
                                        {t('profile:editProfile')}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-bold rounded-xl text-sm transition-all hover:bg-slate-50 border border-slate-200 shadow-sm"
                                        >
                                            <X size={16} />
                                            {t('common:cancel')}
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className={`flex items-center gap-2 px-4 py-2 bg-white text-primary-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-md hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <Save size={16} />
                                            {loading ? t('profile:saving') : t('profile:saveChanges')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <User size={16} className="text-primary-600" />
                                    {t('profile:firstName')}
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name || ''}
                                    placeholder={!isEditing && !formData.first_name ? t('common:notProvided') : ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed placeholder-slate-400'
                                        }`}
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <User size={16} className="text-primary-600" />
                                    {t('profile:lastName')}
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name || ''}
                                    placeholder={!isEditing && !formData.last_name ? t('common:notProvided') : ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed placeholder-slate-400'
                                        }`}
                                />
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Mail size={16} className="text-primary-600" />
                                    {t('profile:email')}
                                </label>
                                <input
                                    type="email"
                                    value={studentData.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl cursor-not-allowed"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Phone size={16} className="text-primary-600" />
                                    {t('profile:phone')}
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    placeholder={!isEditing && !formData.phone ? t('common:notProvided') : "(000) 000 0000"}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    inputMode="numeric"
                                    maxLength={14}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed placeholder-slate-400'
                                        }`}
                                />
                            </div>

                            {/* Grade */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <GraduationCap size={16} className="text-purple-600" />
                                    {t('profile:grade')}
                                </label>
                                <CustomDropdown
                                    options={grades}
                                    value={formData.grade_id}
                                    onChange={(val) => handleDropdownChange('grade_id', val)}
                                    placeholder={!isEditing && !formData.grade_id ? t('common:notProvided') : t('profile:selectGrade')}
                                    disabled={!isEditing}
                                    buttonClassName="h-auto py-3"
                                    matchTextInput={true}
                                    dropdownPosition="top"
                                />
                            </div>

                            {/* Primary Language */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Globe size={16} className="text-purple-600" />
                                    {t('profile:primaryLanguage')}
                                </label>
                                <CustomDropdown
                                    options={languages.map(l => ({ value: String(l.id), label: l.name }))}
                                    value={formData.preferred_language_id}
                                    onChange={(val) => handleDropdownChange('preferred_language_id', val)}
                                    placeholder={!isEditing && !formData.preferred_language_id ? t('common:notProvided') : t('profile:selectLanguage')}
                                    disabled={!isEditing}
                                    buttonClassName="h-auto py-3"
                                    matchTextInput={true}
                                    dropdownPosition="top"
                                />
                            </div>

                            {/* Guardian Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <UserCheck size={16} className="text-blue-600" />
                                    {t('profile:guardianName')}
                                </label>
                                <input
                                    type="text"
                                    name="guardian_name"
                                    value={formData.guardian_name || ''}
                                    placeholder={!isEditing && !formData.guardian_name ? t('common:notProvided') : ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed placeholder-slate-400'
                                        }`}
                                />
                            </div>

                            {/* Guardian Relation */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                    <Users size={16} className="text-blue-600" />
                                    {t('profile:guardianRelation')}
                                </label>
                                <CustomDropdown
                                    options={guardianRelations}
                                    value={formData.guardian_relation}
                                    onChange={(val) => handleDropdownChange('guardian_relation', val)}
                                    placeholder={!isEditing && !formData.guardian_relation ? t('common:notProvided') : t('profile:selectRelation')}
                                    disabled={!isEditing}
                                    buttonClassName="h-auto py-3"
                                    matchTextInput={true}
                                    dropdownPosition="top"
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
