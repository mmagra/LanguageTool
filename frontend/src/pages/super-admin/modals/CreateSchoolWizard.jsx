import React, { useState, useEffect } from 'react';
import {
    Shield, User, Globe, Loader2, Calendar, Phone, Mail,
    Lock, Eye, EyeOff, Hash, Zap, Award, Settings,
    X, Check, ChevronRight, ChevronLeft, Building2,
    DollarSign, CreditCard, FileText, ChevronDown, AlertTriangle, Mic2,
    Users, UserCog, Activity, Link2, Copy, Send, Gift, MapPin
} from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import LanguageAllocator from '../../../components/common/LanguageAllocator';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { PASSWORD_REGEX, PASSWORD_MESSAGE, PASSWORD_REQUIREMENTS, formatPhone, isValidPhone, PHONE_MESSAGE } from '../../../utils/validation';
import { US_STATES, ZIP_REGEX } from '../../../utils/usStates';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
    { id: 1, title: 'School Details', icon: Building2, desc: 'Basic information' },
    { id: 2, title: 'Plan & Limits', icon: Shield, desc: 'Subscription tier' },
    { id: 3, title: 'Localization', icon: Globe, desc: 'Language access' },
    { id: 4, title: 'School Admin', icon: User, desc: 'Initial administrator' },
    { id: 5, title: 'Activate Billing', icon: CreditCard, desc: 'Payment or free access' }
];

const CreateSchoolWizard = ({ isOpen, onClose, onSchoolCreated }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [showPassword, setShowPassword] = useState(false);

    // Step 5 (post-creation) billing activation state
    const [createdSchool, setCreatedSchool] = useState(null);
    const [priceInput, setPriceInput] = useState('');
    const [checkoutLink, setCheckoutLink] = useState('');
    const [trialDays, setTrialDays] = useState(30);
    const [subLoading, setSubLoading] = useState(false);
    const [accessState, setAccessState] = useState(null); // 'free' | 'trial' | null

    // Plan Limits Configuration — minutes = tts_chars / 1000 (1,000 TTS chars ≈ 1 min)
    const PLAN_LIMITS = {
        'basic':      { students: 100,  teachers: 8,  minutes: 200,  words: 100000,  translation_chars: 500000,  tts_chars: 200000 },
        'pro':        { students: 400,  teachers: 25, minutes: 500,  words: 400000,  translation_chars: 2000000, tts_chars: 500000 },
        'enterprise': { students: 1500, teachers: 80, minutes: 1000, words: 1000000, translation_chars: 5000000, tts_chars: 1000000 }
    };
    const TTS_CHARS_PER_MINUTE = 1000;
    const CHARS_PER_WORD = 5;
    const fmt = (n) => {
        if (!n && n !== 0) return '—';
        if (n >= 1000000) return (n / 1000000 % 1 === 0 ? n / 1000000 : (n / 1000000).toFixed(1)) + 'M';
        if (n >= 1000) return (n / 1000 % 1 === 0 ? n / 1000 : (n / 1000).toFixed(1)) + 'K';
        return n.toString();
    };

    const [formData, setFormData] = useState({
        // Step 1: School Details
        name: '',
        contact_email: '',
        contact_number: '', // New
        street_address: '', // USA address
        city: '',
        state: '',
        zip_code: '',

        // Step 2: Plan — initial values mirror PLAN_LIMITS.basic
        plan_tier: 'basic',
        max_students: 100,
        max_teachers: 8,
        minutes_limit: 200,
        translation_chars_limit: 500000,
        translation_words: 100000,
        tts_chars_limit: 200000,
        // valid_until removed, driven by payment

        // Paid Google APIs — ON by default for all plans
        premium_translation: true,
        premium_tts: true,

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
            setBillingCycle('monthly');
            setCurrentStep(1);
            setCreatedSchool(null);
            setCheckoutLink('');
            setAccessState(null);
            setTrialDays(30);
            setFormData(prev => ({
                ...prev,
                plan_tier: 'basic',
                max_students: 100,
                max_teachers: 8,
                minutes_limit: 200,
                translation_chars_limit: 500000,
                translation_words: 100000,
                tts_chars_limit: 200000,
                premium_translation: true,
                premium_tts: true,
            }));
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
        if (tier !== 'custom' && PLAN_LIMITS[tier]) {
            updates.max_students = PLAN_LIMITS[tier].students;
            updates.max_teachers = PLAN_LIMITS[tier].teachers;
            updates.translation_chars_limit = PLAN_LIMITS[tier].translation_chars;
            updates.translation_words = PLAN_LIMITS[tier].words || 0;
            updates.tts_chars_limit = PLAN_LIMITS[tier].tts_chars;
            updates.minutes_limit = PLAN_LIMITS[tier].minutes;
        }
        if (tier !== 'custom') {
            updates.premium_translation = true;
            updates.premium_tts = true;
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

    // Static, fully-spelled Tailwind classes per tier (dynamic `border-${color}-600` is not compiled)
    const PLAN_STYLES = {
        blue: { cardBorder: 'border-blue-600', cardBg: 'bg-blue-50/50', cardRing: 'ring-blue-200', badge: 'text-blue-600', iconBoxBg: 'bg-blue-100', iconBoxText: 'text-blue-600' },
        indigo: { cardBorder: 'border-primary-600', cardBg: 'bg-primary-50/50', cardRing: 'ring-primary-200', badge: 'text-primary-600', iconBoxBg: 'bg-primary-100', iconBoxText: 'text-primary-600' },
        purple: { cardBorder: 'border-purple-600', cardBg: 'bg-purple-50/50', cardRing: 'ring-purple-200', badge: 'text-purple-600', iconBoxBg: 'bg-purple-100', iconBoxText: 'text-purple-600' },
        gray: { cardBorder: 'border-slate-600', cardBg: 'bg-slate-50/50', cardRing: 'ring-slate-200', badge: 'text-slate-600', iconBoxBg: 'bg-slate-100', iconBoxText: 'text-slate-600' },
    };
    const getPlanStyles = (tier) => PLAN_STYLES[getPlanColor(tier)] || PLAN_STYLES.gray;

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
                if (!formData.name || formData.name.trim().length < 2) {
                    toast.error('Enter a valid school name');
                    return false;
                }
                if (!EMAIL_REGEX.test(formData.contact_email.trim())) {
                    toast.error('Enter a valid email address');
                    return false;
                }
                if (!formData.contact_number || !isValidPhone(formData.contact_number)) {
                    toast.error('Enter a valid contact number — ' + PHONE_MESSAGE);
                    return false;
                }
                if (!formData.street_address || formData.street_address.trim().length < 3) {
                    toast.error('Enter the school street address');
                    return false;
                }
                if (!formData.city || formData.city.trim().length < 2) {
                    toast.error('Enter the city');
                    return false;
                }
                if (!formData.state) {
                    toast.error('Select the state');
                    return false;
                }
                if (!formData.zip_code || !ZIP_REGEX.test(formData.zip_code.trim())) {
                    toast.error('Enter a valid US ZIP code (e.g. 12345 or 12345-6789)');
                    return false;
                }
                return true;
            case 2:
                // Plan validation - just ensure numbers are valid if custom
                return formData.max_students >= 0 && formData.max_teachers >= 0 && formData.minutes_limit >= 0;
            case 3:
                if (formData.allowed_languages.length === 0) {
                    toast.error('Select at least one language');
                    return false;
                }
                return true;
            case 4:
                if (!formData.admin_first_name) {
                    toast.error('Admin first name is required');
                    return false;
                }
                if (!EMAIL_REGEX.test(formData.admin_email.trim())) {
                    toast.error('Enter a valid admin email address');
                    return false;
                }
                if (!formData.admin_username || formData.admin_username.length < 3) {
                    toast.error('Admin username must be at least 3 characters');
                    return false;
                }
                if (!PASSWORD_REGEX.test(formData.admin_password)) {
                    toast.error(PASSWORD_MESSAGE);
                    return false;
                }
                if (formData.admin_phone && !isValidPhone(formData.admin_phone)) {
                    toast.error(PHONE_MESSAGE);
                    return false;
                }
                return true;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        // Validate Admin Step explicitly as it is the last step
        if (!validateStep(4)) {
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

            // Recurring monthly price = suggested price (4.5× Google cost), matching the Step 2/4 banner.
            const googleMonthly = (formData.translation_chars_limit / 1e6) * 20 + (formData.tts_chars_limit / 1e6) * 4;
            const monthly_price = Math.round(googleMonthly * 4.5);

            const response = await api.createSchool({ ...formData, monthly_price });
            if (response.success) {
                toast.success('School created — now activate billing.');
                setCreatedSchool(response.data);
                setPriceInput(String(monthly_price || ''));
                onSchoolCreated(response.data); // refresh the list behind the modal
                setCurrentStep(5);              // advance to the activation step
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.message || 'Failed to create school');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 5: billing activation (uses the just-created school's id) ---
    const startCheckout = async (alsoEmail) => {
        const price = parseFloat(priceInput);
        if (!price || price <= 0) {
            toast.error('Enter a valid monthly price first');
            return;
        }
        setSubLoading(true);
        setCheckoutLink('');
        try {
            await api.updateSchool(createdSchool.id, { ...formData, monthly_price: price });
            const res = await api.createSubscriptionCheckout(createdSchool.id, alsoEmail ? { email: formData.contact_email } : {});
            if (res.success) {
                setCheckoutLink(res.data.url);
                toast.success(res.data.emailed ? 'Checkout link emailed to the school' : 'Checkout link created');
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to create checkout link');
        } finally {
            setSubLoading(false);
        }
    };

    const grantAccess = async (mode, days) => {
        setSubLoading(true);
        try {
            await api.grantSchoolAccess(createdSchool.id, { mode, days });
            setAccessState(mode);
            toast.success(mode === 'free' ? 'Free access granted' : `Trial started (${days} days)`);
        } catch (error) {
            toast.error(error?.message || 'Failed to update access');
        } finally {
            setSubLoading(false);
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
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
        // validateStep shows its own specific error toast on failure
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const isCustomPlan = formData.plan_tier === 'custom';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-inter">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Add New School</h2>
                        <p className="text-xs text-slate-500 mt-1">Step {currentStep} of 5: {STEPS[currentStep - 1].title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-100 h-1 w-full">
                    <div
                        className="bg-primary-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    />
                </div>

                {/* Step Indicator */}
                <div className="flex justify-between px-8 py-2 border-b border-slate-100 bg-white">
                    {STEPS.map(s => (
                        <div key={s.id} className={`flex items-center gap-1.5 text-xs font-medium ${currentStep === s.id ? 'text-primary-600' : currentStep > s.id ? 'text-emerald-500' : 'text-slate-300'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === s.id ? 'bg-primary-600 text-white' : currentStep > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {currentStep > s.id ? <Check size={10} /> : s.id}
                            </div>
                            <span className="hidden sm:block">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Step 1: School Details */}
                    {currentStep === 1 && (
                        <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
                            <div className="text-center">
                                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary-600">
                                    <Building2 size={26} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">School details</h3>
                                <p className="text-sm text-slate-500 mt-0.5">All fields are required.</p>
                            </div>

                            {/* Section: School Information */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Building2 size={15} className="text-primary-600" />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">School Information</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        School Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Lincoln High School"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="email"
                                                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                                                value={formData.contact_email}
                                                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                                placeholder="school@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Contact No.
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={14}
                                                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                                                value={formData.contact_number}
                                                onChange={e => setFormData({ ...formData, contact_number: formatPhone(e.target.value) })}
                                                placeholder="(000) 000 0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: School Address */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin size={15} className="text-primary-600" />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">School Address</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                                        value={formData.street_address}
                                        onChange={e => setFormData({ ...formData, street_address: e.target.value })}
                                        placeholder="123 Main St, Suite 100"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            State
                                        </label>
                                        <CustomDropdown
                                            options={US_STATES}
                                            value={formData.state}
                                            onChange={val => setFormData({ ...formData, state: val })}
                                            placeholder="Select"
                                            matchTextInput
                                            searchable
                                            showClear={false}
                                            dropdownPosition="top"
                                            buttonClassName="py-2.5 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={10}
                                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                                            value={formData.zip_code}
                                            onChange={e => setFormData({ ...formData, zip_code: e.target.value.replace(/[^\d-]/g, '') })}
                                            placeholder="12345"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Plan & Limits */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-fade-in">

                            {/* Billing cycle tabs */}
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                                {[
                                    { key: 'monthly', label: 'Monthly', badge: null },
                                    { key: 'yearly',  label: 'Yearly',  badge: 'Save 15%' },
                                ].map(({ key, label, badge }) => (
                                    <button
                                        key={key}
                                        onClick={() => setBillingCycle(key)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${billingCycle === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {label}
                                        {badge && (
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${billingCycle === key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>{badge}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Plan cards */}
                            {(() => {
                                const multiplier = billingCycle === 'yearly' ? 12 : 1;
                                const suffix     = billingCycle === 'yearly' ? '/ yr' : '/ mo';
                                return (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {[
                                            { tier: 'basic',      popular: false },
                                            { tier: 'pro',        popular: true  },
                                            { tier: 'enterprise', popular: false },
                                            { tier: 'custom',     popular: false },
                                        ].map(({ tier, popular }) => {
                                            const styles     = getPlanStyles(tier);
                                            const Icon       = getPlanIcon(tier);
                                            const isSelected = formData.plan_tier === tier;
                                            const limits     = PLAN_LIMITS[tier];
                                            return (
                                                <button
                                                    key={tier}
                                                    onClick={() => handlePlanChange(tier)}
                                                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 overflow-hidden group ${isSelected ? `${styles.cardBorder} ${styles.cardBg} shadow-md` : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}
                                                >
                                                    {popular && (
                                                        <div className="absolute top-0 left-0 right-0 flex justify-center">
                                                            <span className="bg-gradient-to-r from-primary-500 to-blue-500 text-white text-xs font-bold px-3 py-0.5 rounded-b-lg">POPULAR</span>
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className={`absolute top-2.5 right-2.5 ${styles.badge}`}>
                                                            <CheckCircle size={17} />
                                                        </div>
                                                    )}
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 mt-1.5 ${isSelected ? `${styles.iconBoxBg} ${styles.iconBoxText}` : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                        <Icon size={17} />
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 capitalize text-sm mb-2.5">{tier}</h4>
                                                    {limits ? (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={9} /> Students</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.students)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><UserCog size={9} /> Teachers</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.teachers)}</span>
                                                            </div>
                                                            <div className="my-1 border-t border-slate-100" />
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Globe size={9} /> Words</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.words * multiplier)} <span className="font-normal text-slate-400">{suffix}</span></span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Activity size={9} /> Minutes</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.minutes * multiplier)} <span className="font-normal text-slate-400">{suffix}</span></span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-slate-400">Set any limits</p>
                                                            <p className="text-xs text-slate-400">All features included</p>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Capacity */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                    <Shield size={15} className="text-primary-600" />
                                    Capacity
                                    {!isCustomPlan && <span className="text-xs font-normal text-slate-400">— switch to Custom to edit</span>}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Max Students', key: 'max_students' },
                                        { label: 'Max Teachers', key: 'max_teachers' },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{label}</label>
                                            <input type="number" disabled={!isCustomPlan}
                                                className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all font-mono text-base ${isCustomPlan ? 'bg-white border-slate-300 focus:ring-2 focus:ring-primary-500' : 'bg-white border-transparent text-slate-500'}`}
                                                value={formData[key]}
                                                onChange={e => setFormData(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Feature Access */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-slate-900 text-sm">Feature Access</h4>
                                    <span className="text-xs text-slate-400">Always ON for all plans</span>
                                </div>
                                <div className="space-y-3">

                                    {/* Translation */}
                                    <div className="rounded-xl border-2 border-primary-200 bg-white overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary-100">
                                                    <Globe size={15} className="text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">Translation</p>
                                                    <p className="text-xs text-slate-400">Google Cloud Translation · $20/M chars</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={!isCustomPlan}
                                                className={`relative w-11 h-6 rounded-full bg-primary-600 shrink-0 ${!isCustomPlan ? 'opacity-80 cursor-default' : ''}`}
                                            >
                                                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5" />
                                            </button>
                                        </div>
                                        <div className="px-4 pb-4 border-t border-primary-100 pt-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                                        Word Count {billingCycle === 'yearly' ? '(yearly)' : '(monthly)'}
                                                    </label>
                                                    <input type="number" disabled={!isCustomPlan}
                                                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all font-mono text-base ${isCustomPlan ? 'bg-white border-slate-300 focus:ring-2 focus:ring-primary-500' : 'bg-slate-100 border-transparent text-slate-500'}`}
                                                        value={formData.translation_words * (billingCycle === 'yearly' ? 12 : 1)}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const monthly = billingCycle === 'yearly' ? Math.round(val / 12) : val;
                                                            setFormData(p => ({ ...p, translation_words: monthly, translation_chars_limit: monthly * CHARS_PER_WORD }));
                                                        }} />
                                                    <p className="text-xs text-primary-500 mt-1 font-medium">
                                                        = {fmt(formData.translation_words * (billingCycle === 'yearly' ? 12 : 1))} words / {billingCycle === 'yearly' ? 'year' : 'month'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Translation Characters</label>
                                                    <div className={`w-full px-4 py-2.5 border rounded-xl font-mono text-base ${isCustomPlan ? 'bg-primary-50 border-primary-100 text-primary-700' : 'bg-slate-100 border-transparent text-slate-500'}`}>
                                                        {((formData.translation_chars_limit || 0) * (billingCycle === 'yearly' ? 12 : 1)).toLocaleString()}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">≈ 5 chars/word</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-3">
                                                {billingCycle === 'yearly'
                                                    ? <>~${((formData.translation_chars_limit / 1e6) * 20 * 12).toFixed(2)}/yr Google · ~${((formData.translation_chars_limit / 1e6) * 90 * 12).toFixed(2)}/yr your price</>
                                                    : <>~${((formData.translation_chars_limit / 1e6) * 20).toFixed(2)}/mo Google · ~${((formData.translation_chars_limit / 1e6) * 90).toFixed(2)}/mo your price</>
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Voice */}
                                    <div className="rounded-xl border-2 border-blue-200 bg-white overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-100">
                                                    <Mic2 size={15} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">Voice (TTS)</p>
                                                    <p className="text-xs text-slate-400">Google Cloud TTS · $4/M chars (Standard voices)</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={!isCustomPlan}
                                                className={`relative w-11 h-6 rounded-full bg-blue-600 shrink-0 ${!isCustomPlan ? 'opacity-80 cursor-default' : ''}`}
                                            >
                                                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5" />
                                            </button>
                                        </div>
                                        <div className="px-4 pb-4 border-t border-blue-100 pt-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                                        Live Conversation Minutes {billingCycle === 'yearly' ? '(yearly)' : '(monthly)'}
                                                    </label>
                                                    <input type="number" disabled={!isCustomPlan}
                                                        className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all font-mono text-base ${isCustomPlan ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500' : 'bg-slate-100 border-transparent text-slate-500'}`}
                                                        value={formData.minutes_limit * (billingCycle === 'yearly' ? 12 : 1)}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const monthly = billingCycle === 'yearly' ? Math.round(val / 12) : val;
                                                            setFormData(p => ({ ...p, minutes_limit: monthly, tts_chars_limit: monthly * TTS_CHARS_PER_MINUTE }));
                                                        }} />
                                                    <p className="text-xs text-blue-500 mt-1 font-medium">
                                                        = {fmt(formData.minutes_limit * (billingCycle === 'yearly' ? 12 : 1))} minutes / {billingCycle === 'yearly' ? 'year' : 'month'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Voice Characters</label>
                                                    <div className={`w-full px-4 py-2.5 border rounded-xl font-mono text-base ${isCustomPlan ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-100 border-transparent text-slate-500'}`}>
                                                        {((formData.tts_chars_limit || 0) * (billingCycle === 'yearly' ? 12 : 1)).toLocaleString()}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">≈ 1,000 chars/min</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-3">
                                                {billingCycle === 'yearly'
                                                    ? <>~${((formData.tts_chars_limit / 1e6) * 4 * 12).toFixed(2)}/yr Google · ~${((formData.tts_chars_limit / 1e6) * 18 * 12).toFixed(2)}/yr your price</>
                                                    : <>~${((formData.tts_chars_limit / 1e6) * 4).toFixed(2)}/mo Google · ~${((formData.tts_chars_limit / 1e6) * 18).toFixed(2)}/mo your price</>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary cost box */}
                                {(() => {
                                    const googleMonthly = (formData.translation_chars_limit / 1e6) * 20 + (formData.tts_chars_limit / 1e6) * 4;
                                    const monthlyBase   = Math.round(googleMonthly * 4.5);
                                    if (billingCycle === 'yearly') {
                                        const fullYearly       = monthlyBase * 12;
                                        const discountedYearly = Math.round(fullYearly * 0.85);
                                        const googleYearly     = googleMonthly * 12;
                                        return (
                                            <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-emerald-700">Est. Google cost ≈ ${googleYearly.toFixed(2)}/yr</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400 line-through">${fullYearly}/yr</span>
                                                        <span className="text-sm font-bold text-emerald-800">${discountedYearly}/yr</span>
                                                        <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md">-15%</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-emerald-600">Yearly discount of 15% applied to suggested price</p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="mt-3 flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <span className="text-xs text-emerald-700">Est. Google cost ≈ ${googleMonthly.toFixed(2)}/mo</span>
                                            <span className="text-sm font-bold text-emerald-800">Suggested price: ${monthlyBase}/mo</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}



                    {/* Step 4: Admin Account */}
                    {currentStep === 4 && (
                        <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Create the Administrator</h3>
                                <p className="text-slate-500">This admin will have full control over the school.</p>
                            </div>

                            {/* Section 1 — Personal Info */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Personal Information</p>

                                {/* First Name + Last Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                                            value={formData.admin_first_name}
                                            onChange={e => setFormData({ ...formData, admin_first_name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                            placeholder="First name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                                            value={formData.admin_last_name}
                                            onChange={e => setFormData({ ...formData, admin_last_name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                            placeholder="Last name"
                                        />
                                    </div>
                                </div>

                                {/* Email + Phone */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="email"
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                                                value={formData.admin_email}
                                                onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                                placeholder="admin@school.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={14}
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                                                value={formData.admin_phone}
                                                onChange={e => setFormData({ ...formData, admin_phone: formatPhone(e.target.value) })}
                                                placeholder="(000) 000 0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2 — Login Credentials */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
                                <p className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    <Lock size={12} className="text-slate-400" /> Login Credentials
                                </p>

                                {/* Username + Password */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                                            value={formData.admin_username}
                                            onChange={e => setFormData({ ...formData, admin_username: e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase() })}
                                            placeholder="e.g. john_smith"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">Lowercase letters, numbers, underscore only</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
                                                value={formData.admin_password}
                                                onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(p => !p)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {formData.admin_password
                                            ? (
                                                <ul className="mt-1.5 space-y-0.5">
                                                    {PASSWORD_REQUIREMENTS.map((req) => {
                                                        const ok = req.test(formData.admin_password);
                                                        return (
                                                            <li key={req.label} className={`text-[11px] flex items-center gap-1 ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                                                                {ok ? '✓' : '○'} {req.label}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )
                                            : <p className="text-[11px] text-slate-400 mt-1">Min 8 chars with uppercase, lowercase, number &amp; special character.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Languages */}
                    {currentStep === 3 && (
                        <div className="animate-fade-in">
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-slate-900">Allowed Languages</h3>
                                <p className="text-slate-500 text-sm mt-1">Choose which languages this school's teachers and parents can use. Search, filter by voice support, or select all.</p>
                            </div>
                            <LanguageAllocator
                                languages={languages}
                                selected={new Set(formData.allowed_languages)}
                                onChange={(newSet) => setFormData(p => ({ ...p, allowed_languages: [...newSet] }))}
                            />
                        </div>
                    )}

                    {/* Step 5: Activate Billing (after the school is created) */}
                    {currentStep === 5 && createdSchool && (
                        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                    <CheckCircle size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-800 text-sm">{createdSchool.name} created</p>
                                    <p className="text-xs text-emerald-600">A welcome email with a set-password link was sent to the admin. Now activate billing.</p>
                                </div>
                            </div>

                            {accessState ? (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-4 text-green-700">
                                    <CheckCircle size={18} className="shrink-0" />
                                    <span className="text-sm font-semibold">
                                        {accessState === 'free' ? 'Free access granted — no payment required.' : `Trial started (${trialDays} days). The school is active now.`}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    {/* Paid subscription */}
                                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
                                            <CreditCard size={18} className="text-primary-600" /> Recurring subscription
                                        </h3>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Monthly price</label>
                                        <div className="flex items-stretch w-fit rounded-xl shadow-sm mb-3">
                                            <span className="px-3.5 flex items-center bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-slate-400 font-semibold">$</span>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={priceInput}
                                                onChange={(e) => setPriceInput(e.target.value)}
                                                className="w-32 px-3 py-2.5 border border-slate-200 bg-white text-lg font-bold text-primary-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                            <span className="px-3.5 flex items-center bg-slate-50 border border-l-0 border-slate-200 rounded-r-xl text-slate-400 text-sm">/mo</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button onClick={() => startCheckout(false)} disabled={subLoading}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50">
                                                {subLoading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />} Create checkout link
                                            </button>
                                            <button onClick={() => startCheckout(true)} disabled={subLoading || !formData.contact_email}
                                                title={!formData.contact_email ? 'School has no contact email' : ''}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                                                <Send size={16} /> Email link to school
                                            </button>
                                        </div>
                                        {checkoutLink && (
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-3">
                                                <input readOnly value={checkoutLink} onFocus={(e) => e.target.select()}
                                                    className="flex-1 bg-transparent text-sm text-slate-600 outline-none truncate" />
                                                <button onClick={() => { navigator.clipboard.writeText(checkoutLink); toast.success('Link copied'); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shrink-0">
                                                    <Copy size={14} /> Copy
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Free / trial */}
                                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                                            <Gift size={18} className="text-purple-600" /> Or give access without payment
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-3">For trials, internal, or comped schools.</p>
                                        <div className="flex flex-wrap items-end gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trial (days)</label>
                                                <input type="number" min="1" value={trialDays}
                                                    onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                                                    className="w-24 px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-base font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" />
                                            </div>
                                            <button onClick={() => grantAccess('trial', trialDays)} disabled={subLoading || !trialDays}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50">
                                                <Calendar size={16} /> Start trial
                                            </button>
                                            <button onClick={() => grantAccess('free')} disabled={subLoading}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                                                <Gift size={16} /> Grant free access
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-400 text-center">You can also do this later from the school's Payments tab. Click <b>Finish</b> to close.</p>
                                </>
                            )}
                        </div>
                    )}


                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1 || currentStep === 5 || loading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border ${currentStep === 1 || currentStep === 5
                            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm'
                            }`}
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <div className="flex gap-3">
                        {currentStep < 4 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                            >
                                Next Step
                                <ChevronRight size={16} />
                            </button>
                        ) : currentStep === 4 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Create School
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                            >
                                <Check size={16} />
                                Finish
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
