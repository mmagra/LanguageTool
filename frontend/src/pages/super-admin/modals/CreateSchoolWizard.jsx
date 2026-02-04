import React, { useState, useEffect } from 'react';
import {
    Shield, User, Globe, Loader2, Calendar, Phone, Mail,
    Lock, Hash, Zap, Award, Settings,
    X, Check, ChevronRight, ChevronLeft, Building2,
    DollarSign, CreditCard, FileText, ChevronDown
} from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const STEPS = [
    { id: 1, title: 'School Details', icon: Building2, desc: 'Basic information' },
    { id: 2, title: 'Plan & Limits', icon: Shield, desc: 'Subscription tier' },
    { id: 3, title: 'Localization', icon: Globe, desc: 'Language access' },
    { id: 4, title: 'Initial Payment', icon: DollarSign, desc: 'Setup validity' },
    { id: 5, title: 'School Admin', icon: User, desc: 'Initial administrator' }
];

const CreateSchoolWizard = ({ isOpen, onClose, onSchoolCreated }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [languages, setLanguages] = useState([]);

    // Plan Limits Configuration
    const PLAN_LIMITS = {
        'basic': { students: 40, teachers: 10, minutes: 60 },
        'pro': { students: 100, teachers: 20, minutes: 120 },
        'enterprise': { students: 200, teachers: 40, minutes: 240 }
    };

    const [formData, setFormData] = useState({
        // Step 1: School Details
        name: '',
        contact_email: '',
        contact_number: '', // New

        // Step 2: Plan
        plan_tier: 'basic',
        max_students: 40,
        max_teachers: 10,
        minutes_limit: 60,
        // valid_until removed, driven by payment

        // Step 3: Payment
        payment_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        billing_period_start: new Date().toISOString().split('T')[0],
        billing_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        payment_method: 'manual',

        // Step 4: Admin
        admin_first_name: '',
        admin_last_name: '',
        admin_email: '',
        admin_phone: '',
        admin_username: '',
        admin_password: '',

        // Step 5: Languages
        allowed_languages: []
    });

    useEffect(() => {
        if (isOpen) {
            fetchLanguages();
        } else {
            // Reset state on close if needed, but keeping it simple for now
            setCurrentStep(1);
        }
    }, [isOpen]);

    const fetchLanguages = async () => {
        try {
            const response = await api.getSystemLanguages();
            if (response.success) {
                // Sort with English first, then alphabetical
                const sorted = response.data.sort((a, b) => {
                    if (a.code === 'en') return -1;
                    if (b.code === 'en') return 1;
                    return a.name.localeCompare(b.name);
                });
                setLanguages(sorted);

                // Ensure English is selected
                const en = sorted.find(l => l.code === 'en');
                if (en && !formData.allowed_languages.includes('en')) {
                    setFormData(prev => ({
                        ...prev,
                        allowed_languages: [...prev.allowed_languages, 'en']
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to load languages', error);
        }
    };

    const handlePlanChange = (tier) => {
        const updates = { plan_tier: tier };

        // Auto-set validity to 30 days from now
        // Removed manual valid_until update

        if (tier !== 'custom' && PLAN_LIMITS[tier]) {
            updates.max_students = PLAN_LIMITS[tier].students;
            updates.max_teachers = PLAN_LIMITS[tier].teachers;
            updates.minutes_limit = PLAN_LIMITS[tier].minutes;
        }
        setFormData(prev => ({ ...prev, ...updates }));
    };



    const toggleLanguage = (code) => {
        if (code === 'en') return; // Prevent deselecting English

        setFormData(prev => {
            const current = prev.allowed_languages;
            return {
                ...prev,
                allowed_languages: current.includes(code)
                    ? current.filter(c => c !== code)
                    : [...current, code]
            };
        });
    };

    const toggleAllLanguages = () => {
        const allCodes = languages.map(l => l.code);
        const areAllSelected = languages.every(l => formData.allowed_languages.includes(l.code));

        setFormData(prev => ({
            ...prev,
            allowed_languages: areAllSelected ? ['en'] : allCodes
        }));
    };

    // Helper to get plan color
    const getPlanColor = (tier) => {
        switch (tier) {
            case 'basic': return 'blue';
            case 'pro': return 'indigo';
            case 'enterprise': return 'purple';
            case 'custom': return 'gray';
            default: return 'gray';
        }
    };

    // Helper to get plan icon
    const getPlanIcon = (tier) => {
        switch (tier) {
            case 'basic': return Zap;
            case 'pro': return Award;
            case 'enterprise': return Building2;
            case 'custom': return Settings;
            default: return Shield;
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.name && formData.contact_email;
            case 2:
                // Plan validation - just ensure numbers are valid if custom
                return formData.max_students >= 0 && formData.max_teachers >= 0 && formData.minutes_limit >= 0;
            case 3:
                return formData.allowed_languages.length > 0;
            case 4:
                return formData.payment_amount && formData.payment_date && formData.billing_period_start && formData.billing_period_end;
            case 5:
                return formData.admin_first_name && formData.admin_email && formData.admin_password && formData.admin_username;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        // Validate Admin Step explicitly as it is the last step
        if (!validateStep(5)) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            // Check Admin Availability
            const userCheck = await api.checkUserAvailability({
                email: formData.admin_email,
                username: formData.admin_username
            });

            if (userCheck.exists) {
                toast.error(userCheck.message);
                setLoading(false);
                return;
            }

            const response = await api.createSchool(formData);
            if (response.success) {
                const schoolId = response.data.id;

                // Create initial payment
                try {
                    await api.createPayment(schoolId, {
                        amount: formData.payment_amount,
                        payment_date: formData.payment_date,
                        payment_method: formData.payment_method,
                        status: 'paid', // Initial payment assumed paid or pending? User wants validity updated, so 'paid' is best, or let them choose. Hardcoding 'paid' for instant validity valid setup.
                        billing_period_start: formData.billing_period_start,
                        billing_period_end: formData.billing_period_end,
                        notes: formData.payment_notes
                    });
                    toast.success('School and initial payment created successfully!');
                } catch (paymentError) {
                    console.error('Payment creation failed', paymentError);
                    toast.error('School created but payment failed');
                }

                onSchoolCreated(response.data);
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create school');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async () => {
        if (validateStep(currentStep)) {
            // Check availability for School Details (Step 1)
            if (currentStep === 1) {
                setLoading(true);
                try {
                    const check = await api.checkSchoolAvailability({
                        email: formData.contact_email,
                        name: formData.name
                    });
                    if (check.exists) {
                        toast.error(check.message);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error('Availability check failed:', err);
                    // Generate toast only implies duplicate if we are sure, otherwise proceed? 
                    // Let's assume server error shouldn't block, but error toast is safer
                }
                setLoading(false);
            }
            setCurrentStep(prev => Math.min(prev + 1, 5));
        } else {
            toast.error('Please fill in all required fields');
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const isCustomPlan = formData.plan_tier === 'custom';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-inter">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#f0f4fe]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Add New School</h2>
                        <p className="text-xs text-gray-500 mt-1">Step {currentStep} of 4: {STEPS[currentStep - 1].title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-100 h-1 w-full">
                    <div
                        className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Step 1: School Details */}
                    {currentStep === 1 && (
                        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                    <Building2 size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Let's start with the basics</h3>
                                <p className="text-gray-500">Enter the official school details.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Building2 size={16} className="text-indigo-600" /> School Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter school name"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Mail size={16} className="text-indigo-600" /> Official Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            value={formData.contact_email}
                                            onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                            placeholder="Enter contact email address"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Phone size={16} className="text-indigo-600" /> Contact Phone
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            value={formData.contact_number}
                                            onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                                            placeholder="Enter contact number"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Plan & Limits */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {['basic', 'pro', 'enterprise', 'custom'].map(tier => {
                                    const color = getPlanColor(tier);
                                    const Icon = getPlanIcon(tier);
                                    const isSelected = formData.plan_tier === tier;
                                    const limits = PLAN_LIMITS[tier];

                                    return (
                                        <button
                                            key={tier}
                                            onClick={() => handlePlanChange(tier)}
                                            className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${isSelected
                                                ? `border-${color}-600 bg-${color}-50/50 shadow-md ring-1 ring-${color}-200`
                                                : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className={`absolute top-3 right-3 text-${color}-600`}>
                                                    <CheckCircle size={20} className="fill-current text-white/20" />
                                                </div>
                                            )}

                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${isSelected ? `bg-${color}-100 text-${color}-600` : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                <Icon size={20} />
                                            </div>

                                            <div className="mb-2">
                                                <h3 className="font-bold text-gray-900 capitalize text-lg">{tier}</h3>
                                            </div>

                                            {limits ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">{limits.students} Students</p>
                                                    <p className="text-xs text-gray-500">{limits.teachers} Teachers</p>
                                                    <p className="text-xs text-gray-500">{limits.minutes / 60 < 1 ? limits.minutes : Math.round(limits.minutes / 60)} Hrs In-Person</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500">Fully configurable properties</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                        <Shield size={20} className="text-indigo-600" />
                                        Limits Configuration
                                    </h4>
                                    {/* Valid Until removed as per request */}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Students</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                disabled={!isCustomPlan}
                                                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-lg ${isCustomPlan ? 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 border-transparent text-gray-500'}`}
                                                value={formData.max_students}
                                                onChange={e => setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Teachers</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                disabled={!isCustomPlan}
                                                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-lg ${isCustomPlan ? 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 border-transparent text-gray-500'}`}
                                                value={formData.max_teachers}
                                                onChange={e => setFormData({ ...formData, max_teachers: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">In-Person Minutes</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                disabled={!isCustomPlan}
                                                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-lg ${isCustomPlan ? 'bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 border-transparent text-gray-500'}`}
                                                value={formData.minutes_limit}
                                                onChange={e => setFormData({ ...formData, minutes_limit: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Step 5: Admin Account */}
                    {currentStep === 5 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Create the Administrator</h3>
                                <p className="text-gray-500">This admin will have full control over the school.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <User size={16} className="text-indigo-600" /> First Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.admin_first_name}
                                        onChange={e => setFormData({ ...formData, admin_first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <User size={16} className="text-indigo-600" /> Last Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.admin_last_name}
                                        onChange={e => setFormData({ ...formData, admin_last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Mail size={16} className="text-indigo-600" /> Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.admin_email}
                                        onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Phone size={16} className="text-indigo-600" /> Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.admin_phone}
                                        onChange={e => setFormData({ ...formData, admin_phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Hash size={16} className="text-purple-600" /> Username
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.admin_username}
                                        onChange={e => setFormData({ ...formData, admin_username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <Lock size={16} className="text-purple-600" /> Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.admin_password}
                                        onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Languages */}
                    {currentStep === 3 && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Allowed Languages</h3>
                                    <p className="text-gray-500 text-sm">Select languages available to this school.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={toggleAllLanguages}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {languages.every(l => formData.allowed_languages.includes(l.code)) ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {formData.allowed_languages.length} Selected
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {languages.map(lang => {
                                    const isEn = lang.code === 'en';
                                    const isSelected = formData.allowed_languages.includes(lang.code);

                                    return (
                                        <label
                                            key={lang.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isEn
                                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75'
                                                : isSelected
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200 cursor-pointer'
                                                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 cursor-pointer'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected
                                                ? (isEn ? 'bg-gray-400 border-gray-400 text-white' : 'bg-indigo-600 border-indigo-600 text-white')
                                                : 'bg-white border-gray-300'
                                                }`}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${isSelected ? (isEn ? 'text-gray-700' : 'text-indigo-900') : 'text-gray-700'}`}>
                                                        {lang.name}
                                                    </span>
                                                    {isEn && (
                                                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Hidden real input for accessibility/form handling */}
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isSelected}
                                                onChange={() => toggleLanguage(lang.code)}
                                                disabled={isEn}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Initial Payment */}
                    {currentStep === 4 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                            <div className="text-center mb-8">

                                <h3 className="text-lg font-bold text-gray-900">Setup Initial Payment</h3>
                                <p className="text-gray-500">This will define the initial validity period of the school.</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                                {/* Amount & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            <DollarSign size={16} className="text-green-600" /> Amount *
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.payment_amount}
                                            onChange={e => setFormData({ ...formData, payment_amount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            <Calendar size={16} className="text-indigo-600" /> Payment Date *
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.payment_date}
                                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Method & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            <CreditCard size={16} className="text-purple-600" /> Payment Method
                                        </label>

                                        <div className="relative">
                                            <select
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-10 transition-all cursor-pointer"
                                                value={formData.payment_method}
                                                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                            >
                                                <option value="manual">Manual</option>
                                                <option value="credit_card">Credit Card</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cash">Cash</option>
                                                <option value="check">Check</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-green-600 font-semibold cursor-not-allowed flex items-center gap-2">
                                            <Check size={16} /> Paid
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Period */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            <Calendar size={16} className="text-blue-600" /> Billing Start
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.billing_period_start}
                                            onChange={e => {
                                                const start = new Date(e.target.value);
                                                const end = new Date(start);
                                                end.setMonth(end.getMonth() + 1);
                                                setFormData({
                                                    ...formData,
                                                    billing_period_start: e.target.value,
                                                    billing_period_end: end.toISOString().split('T')[0]
                                                });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            <Calendar size={16} className="text-blue-600" /> Valid Until (Billing End)
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
                                            value={formData.billing_period_end}
                                            onChange={e => setFormData({ ...formData, billing_period_end: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                        <FileText size={16} className="text-gray-500" /> Notes
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                        placeholder="Additional payment details..."
                                        value={formData.payment_notes || ''}
                                        onChange={e => setFormData({ ...formData, payment_notes: e.target.value })}
                                    />
                                </div>


                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1 || loading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border ${currentStep === 1
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm'
                            }`}
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <div className="flex gap-3">
                        {currentStep < 5 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                            >
                                Next Step
                                <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Create School
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper for check circle
const CheckCircle = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default CreateSchoolWizard;
