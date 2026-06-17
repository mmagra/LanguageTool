import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Building2, Mail, Link as LinkIcon, Save, Upload, AlertCircle, Phone, Image as ImageIcon, Edit2, X, Trash2, Users, Clock, Sparkles, GraduationCap, TrendingUp, Medal, MapPin } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import ImageCropper from '../../components/common/ImageCropper';
import AdminsList from './AdminsList';
import { formatPhone, isValidPhone, PHONE_MESSAGE } from '../../utils/validation';
import { US_STATES, ZIP_REGEX } from '../../utils/usStates';
import CustomDropdown from '../../components/common/CustomDropdown';

const SchoolDetails = () => {
    const { schoolName, logoUrl, planTier, loading: brandingLoading, refreshBranding } = useBranding();
    const [activeTab, setActiveTab] = useState('profile');
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
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
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
                const { name, contact_email, contact_number, logo_url, student_count, teacher_count, minutes_used, minutes_limit, max_students, max_teachers,
                    translation_chars_used, translation_chars_limit, tts_chars_used, tts_chars_limit } = response.data;
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
                    max_teachers: max_teachers || 10,
                    translation_chars_used: translation_chars_used || 0,
                    translation_chars_limit: translation_chars_limit || 0,
                    tts_chars_used: tts_chars_used || 0,
                    tts_chars_limit: tts_chars_limit || 0
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

    const PHONE_FIELDS = ['contact_number', 'admin_phone', 'phone'];
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: PHONE_FIELDS.includes(name) ? formatPhone(value) : value });
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
        if (formData.contact_number && !isValidPhone(formData.contact_number)) {
            toast.error(PHONE_MESSAGE);
            return;
        }
        if (formData.zip_code && !ZIP_REGEX.test(String(formData.zip_code).trim())) {
            toast.error('Enter a valid US ZIP code (e.g. 12345 or 12345-6789)');
            return;
        }
        try {
            setSaving(true);
            const response = await api.updateMySchool(formData);
            if (response.success) {
                toast.success('School details updated successfully');
                setInitialData(formData);
                setIsEditing(false);
                // Refresh local + branding (header/sidebar logo & name) without a full page reload
                await fetchSchoolDetails();
                if (refreshBranding) refreshBranding();
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error?.message || 'Failed to update school');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading school details...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in font-inter max-w-5xl mx-auto px-4 sm:px-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Manage School</h1>
                <p className="text-slate-500 text-sm mt-1">Update your school profile and manage administrators.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-100">
                {[{ id: 'profile', label: 'School Profile', icon: Building2 }, { id: 'admins', label: 'Administrators', icon: Users }].map(t => {
                    const TabIcon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <TabIcon size={16} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">School Logo</label>

                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                {/* Preview Area (Fixed Size Container) */}
                                <div className="shrink-0">
                                    <div className="w-[180px] h-[56px] bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
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
                                                className="h-8 flex items-center gap-2 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 rounded-md transition-colors"
                                            >
                                                {formData.logo_url ? 'Replace' : 'Upload Logo'}
                                            </button>

                                            {formData.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                    className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-md transition-all ml-1"
                                                    title="Remove Logo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-400 leading-tight">
                                            320x100px transp. PNG
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col justify-center h-[56px]">
                                        <span className="text-sm text-slate-400 italic">Enable editing to change logo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* School Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">School Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                                    placeholder="Enter school name"
                                />
                            </div>
                        </div>

                        {/* Email + Contact No. — 2 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={handleChange}
                                        required
                                        disabled={!isEditing}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                                        placeholder="Enter contact email address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact No.</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="tel"
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleChange}
                                        required
                                        disabled={!isEditing}
                                        inputMode="numeric"
                                        maxLength={14}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                                        placeholder="(000) 000 0000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* School Address (USA) */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    name="street_address"
                                    value={formData.street_address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                                    placeholder="123 Main St, Suite 100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                                <CustomDropdown
                                    options={US_STATES}
                                    value={formData.state}
                                    onChange={val => setFormData({ ...formData, state: val })}
                                    placeholder="Select state"
                                    matchTextInput
                                    showClear={false}
                                    disabled={!isEditing}
                                    dropdownPosition="top"
                                    surfaceClassName="bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    disabledClassName="bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed"
                                    buttonClassName="h-[50px] rounded-xl text-base"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">ZIP Code</label>
                                <input
                                    type="text"
                                    name="zip_code"
                                    value={formData.zip_code}
                                    onChange={e => setFormData({ ...formData, zip_code: e.target.value.replace(/[^\d-]/g, '') })}
                                    disabled={!isEditing}
                                    inputMode="numeric"
                                    maxLength={10}
                                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'}`}
                                    placeholder="12345"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary-600 text-white rounded-xl font-medium shadow-sm hover:bg-primary-700 transition-all hover:shadow-md active:scale-95"
                                >
                                    <Edit2 size={18} />
                                    Edit Details
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary-600 text-white rounded-xl font-medium shadow-sm hover:bg-primary-700 transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}

            {activeTab === 'admins' && (
                <AdminsList />
            )}

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
