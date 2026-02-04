import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Building2, Mail, Link as LinkIcon, Save, Upload, AlertCircle, Phone, Image as ImageIcon, Edit2, X, Trash2, Users, Clock, Sparkles, GraduationCap, TrendingUp, Medal } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import ImageCropper from '../../components/common/ImageCropper';

const SchoolDetails = () => {
    const { schoolName, logoUrl, planTier, loading: brandingLoading } = useBranding();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // Needed to reset form on Cancel
    const [initialData, setInitialData] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        contact_email: '',
        contact_number: '',
        logo_url: ''
    });

    useEffect(() => {
        fetchSchoolDetails();
    }, []);

    const fetchSchoolDetails = async () => {
        try {
            setLoading(true);
            const response = await api.getMySchool();
            if (response.success) {
                const { name, contact_email, contact_number, logo_url, student_count, teacher_count, minutes_used, minutes_limit, max_students, max_teachers } = response.data;
                const data = {
                    name: name || '',
                    contact_email: contact_email || '',
                    contact_number: contact_number || '',
                    logo_url: logo_url || '',
                    student_count: student_count || 0,
                    teacher_count: teacher_count || 0,
                    minutes_used: minutes_used || 0,
                    minutes_limit: minutes_limit || 1000,
                    max_students: max_students || 100,
                    max_teachers: max_teachers || 10
                };
                setFormData(data);
                setInitialData(data);
            }
        } catch (error) {
            console.error('Failed to fetch school details:', error);
            toast.error('Failed to load school details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(initialData);
    };

    const handleLogoCropComplete = (base64Image) => {
        setFormData({ ...formData, logo_url: base64Image });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await api.updateMySchool(formData);
            if (response.success) {
                toast.success('School details updated successfully');
                setInitialData(formData);
                setIsEditing(false);
                // Optional: Refresh Branding Context if needed, but page reload works too
                // Ideally trigger a refresh in context, but for now user sees success
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update school');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading school details...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in font-inter px-20">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Manage School Details</h1>
                <p className="text-gray-500 text-sm mt-1">Update your school's public profile and branding.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-3 space-y-6 h-full">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 space-y-6 h-full flex flex-col justify-between">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">School Logo</label>

                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                {/* Preview Area (Fixed Size Container) */}
                                <div className="shrink-0">
                                    <div className="w-[180px] h-[56px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                        {formData.logo_url ? (
                                            <img
                                                src={formData.logo_url}
                                                alt="Logo Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <img
                                                    src="/Spoken-Edge-Text-Logo.png"
                                                    alt="Default System Logo"
                                                    className="w-[150px] h-auto object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                {isEditing ? (
                                    <div className="flex flex-col justify-center gap-2 pt-0.5">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowCropper(true)}
                                                className="h-8 flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 rounded-md transition-colors"
                                            >
                                                {formData.logo_url ? 'Replace' : 'Upload Logo'}
                                            </button>

                                            {formData.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                    className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-md transition-all ml-1"
                                                    title="Remove Logo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-gray-400 leading-tight">
                                            320x100px transp. PNG
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col justify-center h-[56px]">
                                        <span className="text-sm text-gray-400 italic">Enable editing to change logo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* School Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">School Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                                    placeholder="Enter school name"
                                />
                            </div>
                        </div>

                        {/* Contact Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    required
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                                    placeholder="Enter contact email address"
                                />
                            </div>
                        </div>

                        {/* Contact Phone (NEW) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="tel"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleChange}
                                    required
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                                    placeholder="Enter contact number"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md active:scale-95"
                                >
                                    <Edit2 size={18} />
                                    Edit Details
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
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
                    </form>
                </div>

                {/* Right Column: Plan Usage Details */}
                <div className="lg:col-span-2 space-y-6 h-full">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 h-full flex flex-col relative overflow-hidden">
                        {/* Decorative background removed */}

                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <TrendingUp size={20} className="text-indigo-600" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 tracking-tight">
                                Plan Usage & Limits
                            </h3>
                        </div>

                        <div className="space-y-4 flex-1 relative z-10">
                            {/* Students Usage */}
                            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={16} className="text-indigo-500" />
                                        <span className="text-sm font-semibold text-gray-700">Active Students</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">
                                        {formData.student_count || 0} <span className="text-gray-400 font-normal">/ {formData.max_students || '∞'}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                        style={{ width: `${Math.min(((formData.student_count || 0) / (formData.max_students || 100)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                    {Math.max(0, (formData.max_students || 100) - (formData.student_count || 0))} profiles remaining
                                </p>
                            </div>

                            {/* Teachers Usage */}
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-blue-500" />
                                        <span className="text-sm font-semibold text-gray-700">Active Teachers</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">
                                        {formData.teacher_count || 0} <span className="text-gray-400 font-normal">/ {formData.max_teachers || '∞'}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                        style={{ width: `${Math.min(((formData.teacher_count || 0) / (formData.max_teachers || 10)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                    {Math.max(0, (formData.max_teachers || 10) - (formData.teacher_count || 0))} profiles remaining
                                </p>
                            </div>

                            {/* Minutes Usage */}
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-purple-500" />
                                        <span className="text-sm font-semibold text-gray-700">In-Person Minutes</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">
                                        {formData.minutes_used || 0} <span className="text-gray-400 font-normal">/ {formData.minutes_limit || 1000}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                        style={{ width: `${Math.min(((formData.minutes_used || 0) / (formData.minutes_limit || 1000)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                    {Math.max(0, (formData.minutes_limit || 1000) - (formData.minutes_used || 0))} minutes available
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 relative z-10">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl flex items-center justify-between border border-gray-700">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Medal size={16} className="text-yellow-400" />
                                        <span className="text-xs text-gray-300 uppercase tracking-widest font-semibold">Current Tier</span>
                                    </div>
                                    <span className="text-2xl font-bold capitalize tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                                        {planTier || 'Enterprise'}
                                    </span>
                                </div>
                                <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg text-white backdrop-blur-md border border-white/10 shadow-sm">
                                    ACTIVE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            <ImageCropper
                isOpen={showCropper}
                onClose={() => setShowCropper(false)}
                onCropComplete={handleLogoCropComplete}
                aspectRatio={320 / 100}
            />
        </div>
    );
};

export default SchoolDetails;
