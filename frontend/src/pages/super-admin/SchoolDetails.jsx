import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Building2, Save, Users, UserCog,
    CheckCircle, XCircle, AlertTriangle, Loader2,
    Shield, Mail, Phone, Globe, Calendar, Zap, Award, Settings, Check, LayoutDashboard, DollarSign, Download, Activity, TrendingUp, Mic2,
    CreditCard, Copy, Send, Link2, RefreshCw, Ban, Gift, MapPin, Map, Flag, Hash, Trash2
} from 'lucide-react';
import api from '../../services/api';
import CustomDropdown from '../../components/common/CustomDropdown';
import { toast } from 'react-hot-toast';
import AdminResetPasswordModal from '../admin/modals/AdminResetPasswordModal';
import LanguageAllocator from '../../components/common/LanguageAllocator';
import { subscriptionLabel, getSchoolAccessStatus, ACCESS_TONE_CLASSES } from '../../utils/subscription';
import { formatPhone, isValidPhone, PHONE_MESSAGE } from '../../utils/validation';
import { US_STATES, ZIP_REGEX } from '../../utils/usStates';

const SchoolDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [billingCycle, setBillingCycle] = useState('monthly');

    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data for Configurations
    const [allLanguages, setAllLanguages] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [payments, setPayments] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [subscription, setSubscription] = useState(null);
    const [checkoutLink, setCheckoutLink] = useState('');
    const [subLoading, setSubLoading] = useState(false);
    const [priceInput, setPriceInput] = useState('');
    const [trialDays, setTrialDays] = useState(30);
    const [usageStats, setUsageStats] = useState(null);
    const [usageHistory, setUsageHistory] = useState([]);
    const [usageHistoryLoading, setUsageHistoryLoading] = useState(false);
    const [resettingUsage, setResettingUsage] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, confirmLabel, confirmClass, onConfirm }
    const showConfirm = (opts) => setConfirmDialog(opts);

    // Delete-school (type-to-confirm) state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteText, setDeleteText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDeleteSchool = async () => {
        const schoolName = (school?.name || '').trim();
        if (deleteText.trim() !== schoolName) return;
        try {
            setDeleting(true);
            const res = await api.deleteSchool(id, deleteText.trim());
            if (res.success) {
                toast.success(res.message || 'School deleted');
                navigate('/super-admin/schools');
            } else {
                toast.error(res.message || 'Failed to delete school');
                setDeleting(false);
            }
        } catch (e) {
            toast.error(e?.message || 'Failed to delete school');
            setDeleting(false);
        }
    };

    // Editable Form State
    const [formData, setFormData] = useState({
        name: '',
        contact_email: '',
        contact_number: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        status: '',
        max_students: 0,
        max_teachers: 0,
        minutes_limit: 0,
        translation_chars_limit: 0,
        tts_chars_limit: 0,
        plan_tier: '',
        valid_until: '',
        allowed_languages: [], // Array of codes
        premium_translation: true,
        premium_tts: true
    });

    const [showResetPassword, setShowResetPassword] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

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

    // Google cost: translation $20/M, TTS Standard $4/M. Suggested price = 4.5x cost.
    const suggestedPrice = (translationChars, ttsChars) => {
        const cost = (translationChars / 1e6) * 20 + (ttsChars / 1e6) * 4;
        return Math.round(cost * 4.5);
    };

    // ... (rest of the file until the admins tab)

    const handleResetPassword = (admin) => {
        setSelectedAdmin(admin);
        setShowResetPassword(true);
    };


    useEffect(() => {
        fetchInitialData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'payments') {
            fetchPayments();
        }
        if (activeTab === 'usage-history') {
            fetchUsageHistory();
        }
    }, [activeTab, statusFilter]);

    useEffect(() => {
        if (activeTab === 'payments') {
            fetchSubscription();
        }
    }, [activeTab]);

    // Seed the editable recurring price from the saved value, else the suggestion.
    useEffect(() => {
        if (school) {
            const seed = school.monthly_price ?? suggestedPrice(school.translation_chars_limit, school.tts_chars_limit);
            setPriceInput(seed ? String(seed) : '');
        }
    }, [school]);

    // Handle return from Stripe Checkout (?billing=success|cancel)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const billing = params.get('billing');
        if (billing === 'success') {
            toast.success('Subscription payment completed!');
            setActiveTab('payments');
            fetchSubscription();
            fetchPayments();
            window.history.replaceState({}, '', window.location.pathname);
        } else if (billing === 'cancel') {
            toast('Checkout canceled', { icon: 'ℹ️' });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'subscription') {
            fetchUsageStats();
        }
    }, [activeTab]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [schoolRes, langsRes, adminsRes] = await Promise.all([
                api.getSchoolById(id),
                api.getAllLanguages(),
                api.getSchoolAdmins(id)
            ]);

            if (schoolRes.success) {
                const s = schoolRes.data;
                setSchool(s);
                setFormData({
                    name: s.name,
                    contact_email: s.contact_email || '',
                    contact_number: s.contact_number || '',
                    street_address: s.street_address || '',
                    city: s.city || '',
                    state: s.state || '',
                    zip_code: s.zip_code || '',
                    status: s.status,
                    max_students: s.max_students,
                    max_teachers: s.max_teachers,
                    minutes_limit: s.minutes_limit || 1000,
                    plan_tier: s.plan_tier,
                    valid_until: s.valid_until ? new Date(s.valid_until).toISOString().split('T')[0] : '',
                    translation_chars_limit: s.translation_chars_limit || 0,
                    translation_words: Math.round((s.translation_chars_limit || 0) / CHARS_PER_WORD),
                    tts_chars_limit: s.tts_chars_limit || 0,
                    allowed_languages: s.allowed_languages ? s.allowed_languages.map(l => l.code) : [],
                    premium_translation: s.features?.premium_translation === true,
                    premium_tts: s.features?.premium_tts === true
                });
            }

            if (langsRes.success) {
                // Sort with English first
                const sorted = langsRes.data.sort((a, b) => {
                    if (a.code === 'en') return -1;
                    if (b.code === 'en') return 1;
                    return a.name.localeCompare(b.name);
                });
                setAllLanguages(sorted);
            }

            if (adminsRes.success) {
                setAdmins(adminsRes.data);
            }

        } catch (error) {
            console.error('Failed to fetch school details:', error);
            toast.error('Failed to load school details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (formData.contact_number && !isValidPhone(formData.contact_number)) {
            toast.error(PHONE_MESSAGE);
            return;
        }
        if (formData.zip_code && !ZIP_REGEX.test(formData.zip_code.trim())) {
            toast.error('Enter a valid US ZIP code (e.g. 12345 or 12345-6789)');
            return;
        }
        setSaving(true);
        try {
            const response = await api.updateSchool(id, formData);
            if (response.success) {
                toast.success('School updated successfully');
                await fetchInitialData();
            }
        } catch (error) {
            console.error('Failed to update school:', error);
            toast.error('Failed to update school');
        } finally {
            setSaving(false);
        }
    };

    const fetchPayments = async () => {
        try {
            const response = await api.getSchoolPayments(id, { status: statusFilter !== 'all' ? statusFilter : undefined });
            if (response.success) {
                setPayments(response.data);
                setTotalRevenue(parseFloat(response.totalRevenue || 0));
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            toast.error('Failed to load payments');
        }
    };

    const fetchUsageHistory = async () => {
        setUsageHistoryLoading(true);
        try {
            const res = await api.getSchoolUsageHistory(id);
            if (res.success) setUsageHistory(res.data);
        } catch (err) {
            console.error('Failed to fetch usage history:', err);
        } finally {
            setUsageHistoryLoading(false);
        }
    };

    const handleManualUsageReset = () => {
        showConfirm({
            title: 'Reset Usage Meters?',
            message: 'This will save a snapshot of the current usage into history and reset all counters to zero.',
            confirmLabel: 'Reset',
            confirmClass: 'bg-orange-600 hover:bg-orange-700',
            onConfirm: async () => {
                setResettingUsage(true);
                try {
                    const res = await api.resetSchoolUsage(id);
                    if (res.success) {
                        toast.success('Usage reset and snapshot saved');
                        fetchUsageHistory();
                        const updated = await api.getSchool(id);
                        if (updated.success) setSchool(updated.data);
                    }
                } catch (err) {
                    toast.error('Failed to reset usage');
                } finally {
                    setResettingUsage(false);
                }
            }
        });
    };

    const fetchSubscription = async () => {
        try {
            const response = await api.getSubscription(id);
            if (response.success) setSubscription(response.data);
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        }
    };

    const handleStartSubscription = async (alsoEmail) => {
        const price = parseFloat(priceInput);
        if (!price || price <= 0) {
            toast.error('Enter a valid monthly price before creating the link');
            return;
        }
        setSubLoading(true);
        setCheckoutLink('');
        try {
            // Persist the (editable) recurring price before checkout so Stripe charges this amount.
            await api.updateSchool(id, { ...formData, monthly_price: price });
            setSchool(prev => prev ? { ...prev, monthly_price: price } : prev);
            const response = await api.createSubscriptionCheckout(id, alsoEmail ? { email: formData.contact_email } : {});
            if (response.success) {
                setCheckoutLink(response.data.url);
                if (response.data.emailed) {
                    toast.success('Checkout link emailed to the school');
                } else {
                    toast.success('Checkout link created — copy it below');
                }
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to start subscription');
        } finally {
            setSubLoading(false);
        }
    };

    const handleCancelSubscription = () => {
        showConfirm({
            title: 'Cancel Subscription?',
            message: 'The school will keep access until the end of the current billing period, then features will lock.',
            confirmLabel: 'Yes, cancel at period end',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                setSubLoading(true);
                try {
                    await api.cancelSubscription(id);
                    toast.success('Subscription will cancel at period end');
                    fetchSubscription();
                } catch (error) {
                    toast.error(error?.message || 'Failed to cancel subscription');
                } finally {
                    setSubLoading(false);
                }
            }
        });
    };

    const handleResumeSubscription = async () => {
        setSubLoading(true);
        try {
            await api.resumeSubscription(id);
            toast.success('Subscription will keep renewing');
            fetchSubscription();
        } catch (error) {
            toast.error(error?.message || 'Failed to resume subscription');
        } finally {
            setSubLoading(false);
        }
    };

    const handleGrantAccess = (mode, days) => {
        const doGrant = async () => {
            setSubLoading(true);
            try {
                await api.grantSchoolAccess(id, { mode, days });
                toast.success(
                    mode === 'revoke' ? 'Free / trial access revoked'
                    : mode === 'free' ? 'Free access granted'
                    : `Trial started (${days} days)`
                );
                await fetchInitialData();
                fetchSubscription();
            } catch (error) {
                toast.error(error?.message || 'Failed to update access');
            } finally {
                setSubLoading(false);
            }
        };

        if (mode === 'revoke') {
            showConfirm({
                title: 'Revoke Access?',
                message: 'This will end the trial / free access. Features will lock immediately unless the school has a paid subscription.',
                confirmLabel: 'Yes, revoke access',
                confirmClass: 'bg-red-600 hover:bg-red-700',
                onConfirm: doGrant,
            });
        } else {
            doGrant();
        }
    };

    const fetchUsageStats = async () => {
        try {
            const response = await api.getSchoolUsageStats(id);
            if (response.success) {
                setUsageStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch usage stats:', error);
            toast.error('Failed to load usage statistics');
        }
    };

    const toggleLanguage = (code) => {
        setFormData(prev => {
            const current = prev.allowed_languages || [];
            if (current.includes(code)) {
                // Prevent removing English if it's required (optional logic)
                if (code === 'en') return prev;
                return { ...prev, allowed_languages: current.filter(c => c !== code) };
            } else {
                return { ...prev, allowed_languages: [...current, code] };
            }
        });
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

    // Color-coded thresholds for usage bars and card borders
    const getUsageColor = (used, limit) => {
        if (!limit) return 'emerald';
        const pct = used / limit;
        if (pct >= 0.9) return 'red';
        if (pct >= 0.7) return 'yellow';
        return 'emerald';
    };
    const usageBarClass = { emerald: 'from-emerald-500 to-emerald-600', yellow: 'from-yellow-400 to-amber-500', red: 'from-red-500 to-red-600' };
    const usageBorderClass = { emerald: 'border-emerald-100', yellow: 'border-yellow-200', red: 'border-red-200' };

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

    // Static, fully-spelled Tailwind classes per tier. Dynamic strings like
    // `border-${color}-600` are NOT compiled by Tailwind, so they must be literal here.
    const PLAN_STYLES = {
        blue: { icon: 'text-blue-500', cardBorder: 'border-blue-600', cardBg: 'bg-blue-50/50', cardRing: 'ring-blue-200', badge: 'text-blue-600', iconBoxBg: 'bg-blue-100', iconBoxText: 'text-blue-600' },
        indigo: { icon: 'text-primary-500', cardBorder: 'border-primary-600', cardBg: 'bg-primary-50/50', cardRing: 'ring-primary-200', badge: 'text-primary-600', iconBoxBg: 'bg-primary-100', iconBoxText: 'text-primary-600' },
        purple: { icon: 'text-purple-500', cardBorder: 'border-purple-600', cardBg: 'bg-purple-50/50', cardRing: 'ring-purple-200', badge: 'text-purple-600', iconBoxBg: 'bg-purple-100', iconBoxText: 'text-purple-600' },
        gray: { icon: 'text-slate-500', cardBorder: 'border-slate-600', cardBg: 'bg-slate-50/50', cardRing: 'ring-slate-200', badge: 'text-slate-600', iconBoxBg: 'bg-slate-100', iconBoxText: 'text-slate-600' },
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

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;
    if (!school) return <div className="text-center p-10">School not found</div>;

    const isCustomPlan = formData.plan_tier === 'custom';
    const stats = school.stats || { students: 0, teachers: 0 };

    return (
        <div className="max-w-7xl mx-auto space-y-8 font-inter animate-in fade-in duration-500 p-8">
{/* Header Card with Profile Header Color */}
            <div className="relative overflow-hidden rounded-xl bg-slate-50 shadow-sm border border-slate-100 group">

                <div className="relative p-10 flex flex-col md:flex-row gap-10 items-start md:items-start justify-between z-10">
                    <div className="flex items-center gap-8">
                        {/* Elevated Logo Container matching Profile Style */}
                        <div className="relative group/logo">
                            <div className="w-24 h-24 rounded-full bg-primary-600 p-[3px] shadow-lg">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/logo:scale-105">
                                    {school.logo_url ? (
                                        <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building2 size={32} className="text-slate-300" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{formData.name || school.name}</h1>
                                {(() => {
                                    const { label, tone } = getSchoolAccessStatus(school);
                                    const dot = { green: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500', red: 'bg-rose-500', gray: 'bg-slate-400' }[tone];
                                    return (
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${ACCESS_TONE_CLASSES[tone]}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                                            {label}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                <span className="text-xs font-semibold tracking-wide text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-500" />
                                    Joined {new Date(school.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                    {React.createElement(getPlanIcon(formData.plan_tier), { size: 14, className: getPlanStyles(formData.plan_tier).icon })}
                                    <span className="text-slate-900 font-bold text-xs capitalize">{formData.plan_tier} Plan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-md hover:-translate-y-0.5 border border-primary-50 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Save Changes</span>
                        </button>
                        <button
                            onClick={() => { setDeleteText(''); setDeleteOpen(true); }}
                            className="flex items-center gap-2 px-4 py-3 bg-white text-rose-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-sm hover:bg-rose-50 border border-rose-100"
                            title="Delete this school"
                        >
                            <Trash2 size={18} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                </div>


                {/* Premium Tab Strip */}
                <div className="bg-white border-t border-slate-100 px-10">
                    <div className="flex items-center gap-8 -mb-px">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                            { id: 'subscription', icon: Shield, label: 'Plan & Usage' },
                            { id: 'languages', icon: Globe, label: 'Languages' },
                            { id: 'admins', icon: Users, label: 'Administrators' },
                            { id: 'payments', icon: DollarSign, label: 'Payments' },
                            { id: 'usage-history', icon: Activity, label: 'Usage History' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                                    }`}
                            >
                                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            <div className="pt-2">

                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* School Details Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Building2 size={20} className="text-primary-600" />
                                    School Information
                                </h2>

                                <div className="space-y-5">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                            <Building2 size={16} className="text-primary-600" /> School Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter school name"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                                <Mail size={16} className="text-primary-600" /> Email
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                                <input
                                                    type="email"
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                    value={formData.contact_email}
                                                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                                    placeholder="contact@school.edu"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                                <Phone size={16} className="text-primary-600" /> Contact No.
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={14}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                    value={formData.contact_number}
                                                    onChange={e => setFormData({ ...formData, contact_number: formatPhone(e.target.value) })}
                                                    placeholder="(000) 000 0000"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* School Address (USA) */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                            <MapPin size={16} className="text-primary-600" /> Street Address
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            value={formData.street_address}
                                            onChange={e => setFormData({ ...formData, street_address: e.target.value })}
                                            placeholder="123 Main St, Suite 100"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                                <Map size={16} className="text-primary-600" /> City
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="City"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                                <Flag size={16} className="text-primary-600" /> State
                                            </label>
                                            <CustomDropdown
                                                options={US_STATES}
                                                value={formData.state}
                                                onChange={val => setFormData({ ...formData, state: val })}
                                                placeholder="Select"
                                                matchTextInput
                                                showClear={false}
                                                dropdownPosition="top"
                                                surfaceClassName="bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                buttonClassName="py-3.5 rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                                <Hash size={16} className="text-primary-600" /> ZIP Code
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={10}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                value={formData.zip_code}
                                                onChange={e => setFormData({ ...formData, zip_code: e.target.value.replace(/[^\d-]/g, '') })}
                                                placeholder="12345"
                                            />
                                        </div>
                                    </div>

                                    {/* Status — last field */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                            <CheckCircle size={16} className="text-emerald-600" /> Status
                                        </label>
                                        <CustomDropdown
                                            className="w-full"
                                            value={formData.status}
                                            onChange={val => setFormData({ ...formData, status: val })}
                                            showClear={false}
                                            searchable={false}
                                            matchTextInput
                                            dropdownPosition="top"
                                            surfaceClassName="bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            buttonClassName="py-3.5 rounded-xl"
                                            options={[
                                                { value: 'active', label: 'Active' },
                                                { value: 'inactive', label: 'Inactive' },
                                                { value: 'suspended', label: 'Suspended' },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">

                            {/* Quick Stats Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 h-full">
                                <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                                    <Activity size={20} className="text-primary-600" />
                                    Quick Stats
                                </h3>
                                <div className="space-y-6">
                                    {/* Teachers */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <UserCog size={16} className="text-purple-600" />
                                                Teachers
                                            </span>
                                            <span className="text-sm font-bold text-slate-900">{stats.teachers} / {formData.max_teachers || 0}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                                style={{ width: `${formData.max_teachers ? Math.min(100, (stats.teachers / formData.max_teachers) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Students */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Users size={16} className="text-blue-600" />
                                                Students
                                            </span>
                                            <span className="text-sm font-bold text-slate-900">{stats.students} / {formData.max_students || 0}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                                style={{ width: `${formData.max_students ? Math.min(100, (stats.students / formData.max_students) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Words Translated */}
                                    {formData.premium_translation && (
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Globe size={16} className="text-emerald-600" />
                                                    Words Translated
                                                </span>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {Math.round((usageStats?.translation_chars_used || 0) / CHARS_PER_WORD).toLocaleString()} / {formData.translation_words?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${formData.translation_chars_limit ? Math.min(100, ((usageStats?.translation_chars_used || 0) / formData.translation_chars_limit) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Live Conversation Minutes */}
                                    {formData.premium_tts && (
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-primary-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Activity size={16} className="text-primary-600" />
                                                    Live Conversation Minutes
                                                </span>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {usageStats?.minutes_used?.toLocaleString() || 0} / {formData.minutes_limit?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-600 hover:bg-primary-700 rounded-full transition-all duration-500"
                                                    style={{ width: `${formData.minutes_limit ? Math.min(100, ((usageStats?.minutes_used || 0) / formData.minutes_limit) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Languages */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Globe size={16} className="text-emerald-600" />
                                                Languages
                                            </span>
                                            <span className="text-2xl font-bold text-emerald-600">{formData.allowed_languages?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SUBSCRIPTION TAB — 3 stacked full-width sections */}
                {activeTab === 'subscription' && (
                    <div className="space-y-6 animate-fade-in">

                        {/* ── SECTION A: Usage Dashboard ── */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Activity size={20} className="text-primary-600" />
                                    Usage Dashboard
                                </h3>
                                {usageStats?.valid_until && (() => {
                                    const d = usageStats.days_until_expiry;
                                    return (
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${d <= 7 ? 'bg-red-50 border-red-200 text-red-700' : d <= 30 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                            <Calendar size={15} />
                                            {d > 0 ? `${d} days left` : 'Expired'} · {new Date(usageStats.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {usageStats ? (() => {
                                const metrics = [
                                    { label: 'Teachers', sublabel: 'Active staff accounts', icon: UserCog, used: usageStats.teachers_count, limit: usageStats.max_teachers, barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                                    { label: 'Students', sublabel: 'Enrolled learners', icon: Users, used: usageStats.students_count, limit: usageStats.max_students, barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                                    { label: 'Words Translated', sublabel: 'Translation usage this cycle', icon: Globe, used: Math.round((usageStats.translation_chars_used || 0) / CHARS_PER_WORD), limit: Math.round((usageStats.translation_chars_limit || 0) / CHARS_PER_WORD), barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                                    { label: 'Live Conv. Minutes', sublabel: 'Voice session time this cycle', icon: Activity, used: usageStats.minutes_used, limit: usageStats.minutes_limit, barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                                ];
                                const statusRing = { emerald: 'bg-emerald-400', yellow: 'bg-amber-400', red: 'bg-red-500' };
                                const statusLabel = { emerald: 'text-emerald-700 bg-emerald-50', yellow: 'text-amber-700 bg-amber-50', red: 'text-red-700 bg-red-50' };
                                const warnBar = { emerald: null, yellow: 'bg-amber-500', red: 'bg-red-500' };
                                return (
                                    <div className="divide-y divide-slate-50">
                                        {metrics.map(({ label, sublabel, icon: Icon, used, limit, barColor, iconCls }) => {
                                            const color = getUsageColor(used, limit);
                                            const pct = limit ? Math.min(100, ((used || 0) / limit) * 100) : 0;
                                            const remaining = Math.max(0, (limit || 0) - (used || 0));
                                            const finalBar = warnBar[color] || barColor;
                                            return (
                                                <div key={label} className="flex items-center gap-5 py-5">
                                                    {/* Icon */}
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
                                                        <Icon size={19} />
                                                    </div>

                                                    {/* Label block */}
                                                    <div className="w-48 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-800">{label}</span>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusRing[color]}`} />
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-0.5 truncate">{sublabel}</p>
                                                    </div>

                                                    {/* Bar */}
                                                    <div className="flex-1">
                                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${finalBar} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="text-right shrink-0 w-36">
                                                        <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">
                                                            {fmt(used || 0)}
                                                            <span className="text-sm font-normal text-slate-400"> / {fmt(limit || 0)}</span>
                                                        </p>
                                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusLabel[color]}`}>{pct.toFixed(0)}%</span>
                                                            <span className="text-xs text-slate-400">{fmt(remaining)} left</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })() : (
                                <div className="text-center py-8 text-slate-400 text-sm">Loading usage data…</div>
                            )}
                        </div>

                        {/* ── SECTION B: Plan Configuration ── */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-7">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Shield size={20} className="text-primary-600" />
                                    Plan Configuration
                                </h3>

                                {/* Billing Cycle Tabs */}
                                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
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
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${billingCycle === key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                                                    {badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Plan Selection Cards */}
                            {(() => {
                                const multiplier = billingCycle === 'yearly' ? 12 : 1;
                                const suffix    = billingCycle === 'yearly' ? '/ yr' : '/ mo';
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { tier: 'basic',      popular: false },
                                            { tier: 'pro',        popular: true  },
                                            { tier: 'enterprise', popular: false },
                                            { tier: 'custom',     popular: false },
                                        ].map(({ tier, popular }) => {
                                            const styles   = getPlanStyles(tier);
                                            const Icon     = getPlanIcon(tier);
                                            const isSelected = formData.plan_tier === tier;
                                            const limits   = PLAN_LIMITS[tier];
                                            return (
                                                <button
                                                    key={tier}
                                                    onClick={() => handlePlanChange(tier)}
                                                    className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 overflow-hidden group ${isSelected ? `${styles.cardBorder} ${styles.cardBg} shadow-md` : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}
                                                >
                                                    {/* Popular badge */}
                                                    {popular && (
                                                        <div className="absolute top-0 left-0 right-0 flex justify-center">
                                                            <span className="bg-primary-600 text-white text-xs font-bold px-3 py-0.5 rounded-b-lg">
                                                                POPULAR
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Selected check */}
                                                    {isSelected && (
                                                        <div className={`absolute top-3 right-3 ${styles.badge}`}>
                                                            <CheckCircle size={18} />
                                                        </div>
                                                    )}

                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 mt-2 ${isSelected ? `${styles.iconBoxBg} ${styles.iconBoxText}` : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                        <Icon size={19} />
                                                    </div>

                                                    {/* Name */}
                                                    <h4 className="font-bold text-slate-900 capitalize text-base mb-3">{tier}</h4>

                                                    {/* Limits */}
                                                    {limits ? (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={10} /> Students</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.students)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><UserCog size={10} /> Teachers</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.teachers)}</span>
                                                            </div>
                                                            <div className="my-1.5 border-t border-slate-100" />
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Globe size={10} /> Words</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.words * multiplier)} <span className="font-normal text-slate-400">{suffix}</span></span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Activity size={10} /> Minutes</span>
                                                                <span className="text-xs font-bold text-slate-700">{fmt(limits.minutes * multiplier)} <span className="font-normal text-slate-400">{suffix}</span></span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
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
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-5">Capacity {!isCustomPlan && <span className="text-xs font-normal text-slate-400 ml-2">— switch to Custom to edit</span>}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {[
                                        { label: 'Max Students', key: 'max_students' },
                                        { label: 'Max Teachers', key: 'max_teachers' },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
                                            <input type="number" disabled={!isCustomPlan}
                                                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-lg ${isCustomPlan ? 'bg-white border-slate-300 focus:ring-2 focus:ring-primary-500' : 'bg-slate-100 border-transparent text-slate-500'}`}
                                                value={formData[key]}
                                                onChange={e => setFormData(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Feature Access */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mt-5">
                                <div className="flex items-center justify-between mb-5">
                                    <h4 className="font-bold text-slate-900">Feature Access</h4>
                                    <span className="text-xs text-slate-400">OFF = API calls blocked immediately</span>
                                </div>
                                <div className="space-y-3">
                                    {/* Translation */}
                                    <div className="rounded-xl border-2 border-primary-200 bg-white transition-all overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary-100">
                                                    <Globe size={17} className="text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">Translation</p>
                                                    <p className="text-xs text-slate-400">Google Cloud Translation · $20/M chars</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={!isCustomPlan}
                                                onClick={() => {
                                                    if (!isCustomPlan) return;
                                                    const on = !formData.premium_translation;
                                                    const words = on ? (PLAN_LIMITS[formData.plan_tier]?.words || 100000) : 0;
                                                    setFormData(p => ({
                                                        ...p,
                                                        premium_translation: on,
                                                        translation_words: words,
                                                        translation_chars_limit: on ? words * CHARS_PER_WORD : 0
                                                    }));
                                                }}
                                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 bg-primary-600 ${!isCustomPlan ? 'opacity-80 cursor-default' : ''}`}
                                            >
                                                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 translate-x-6" />
                                            </button>
                                        </div>
                                        <div className="px-5 pb-4 border-t border-primary-100 pt-4">
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

                                    {/* Voice (TTS) */}
                                    <div className="rounded-xl border-2 border-blue-200 bg-white transition-all overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-100">
                                                    <Mic2 size={17} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">Voice (TTS)</p>
                                                    <p className="text-xs text-slate-400">Google Cloud TTS · $4/M chars (Standard voices)</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={!isCustomPlan}
                                                onClick={() => {
                                                    if (!isCustomPlan) return;
                                                    const on = !formData.premium_tts;
                                                    const mins = on ? (PLAN_LIMITS[formData.plan_tier]?.minutes || 250) : 0;
                                                    setFormData(p => ({
                                                        ...p,
                                                        premium_tts: on,
                                                        minutes_limit: mins,
                                                        tts_chars_limit: on ? mins * TTS_CHARS_PER_MINUTE : 0
                                                    }));
                                                }}
                                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 bg-blue-600 ${!isCustomPlan ? 'opacity-80 cursor-default' : ''}`}
                                            >
                                                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 translate-x-6" />
                                            </button>
                                        </div>
                                        <div className="px-5 pb-4 border-t border-blue-100 pt-4">
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

                                {(() => {
                                    const monthlyBase   = parseFloat(suggestedPrice(formData.translation_chars_limit, formData.tts_chars_limit));
                                    const googleMonthly = (formData.translation_chars_limit / 1e6) * 20 + (formData.tts_chars_limit / 1e6) * 4;
                                    if (billingCycle === 'yearly') {
                                        const fullYearly       = monthlyBase * 12;
                                        const discountedYearly = fullYearly * 0.85;
                                        const googleYearly     = googleMonthly * 12;
                                        return (
                                            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-emerald-700">Est. Google cost ≈ ${googleYearly.toFixed(2)}/yr</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400 line-through">${fullYearly.toFixed(2)}/yr</span>
                                                        <span className="text-sm font-bold text-emerald-800">${discountedYearly.toFixed(2)}/yr</span>
                                                        <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md">-15%</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-emerald-600">Yearly discount of 15% applied to suggested price</p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <span className="text-xs text-emerald-700">Est. Google cost ≈ ${googleMonthly.toFixed(2)}/mo</span>
                                            <span className="text-sm font-bold text-emerald-800">Suggested price: ${monthlyBase.toFixed(2)}/mo</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. LANGUAGES TAB */}
                {activeTab === 'languages' && (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Allowed Languages</h3>
                                <p className="text-slate-500 text-sm mt-1">Choose which languages this school's teachers and parents can use. Search, filter by voice availability, or select all.</p>
                            </div>
                            <LanguageAllocator
                                languages={allLanguages}
                                selected={new Set(formData.allowed_languages?.map(l => l.code || l) || [])}
                                onChange={(newSet) => setFormData(p => ({ ...p, allowed_languages: [...newSet] }))}
                            />
                        </div>
                    </div>
                )}



                {/* 4. ADMINS TAB */}
                {activeTab === 'admins' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <UserCog size={20} className="text-orange-500" />
                                    School Administrators
                                </h2>
                            </div>

                            {admins.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <UserCog size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-500">No administrators found for this school.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {admins.map(admin => (
                                        <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50/50 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-md">
                                            <div className="flex items-center gap-5 w-full sm:w-auto">
                                                {/* Profile Image with Fallback */}
                                                <div className="relative">
                                                    {admin.profile_picture_url ? (
                                                        <img
                                                            src={admin.profile_picture_url}
                                                            alt={`${admin.first_name} ${admin.last_name}`}
                                                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-primary-50 border border-primary-100 shadow-sm flex items-center justify-center text-primary-600 font-bold text-lg">
                                                            {admin.first_name[0]}{admin.last_name[0]}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 text-lg">
                                                            {admin.first_name} {admin.last_name}
                                                        </h3>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold font-mono">
                                                            {admin.username}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail size={14} className="text-slate-400" />
                                                            {admin.email}
                                                        </div>
                                                        {admin.phone && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone size={14} className="text-slate-400" />
                                                                {admin.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto pl-16 sm:pl-0">
                                                <button
                                                    onClick={() => handleResetPassword(admin)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all group/btn"
                                                    title="Reset Password"
                                                >
                                                    <div className="p-1 rounded-lg bg-orange-50 text-orange-600 group-hover/btn:bg-orange-100 transition-colors">
                                                        <Zap size={14} className="fill-orange-600" />
                                                    </div>
                                                    <span>Reset Password</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {showResetPassword && selectedAdmin && (
                    <AdminResetPasswordModal
                        userId={selectedAdmin.id}
                        userName={`${selectedAdmin.first_name} ${selectedAdmin.last_name}`}
                        onClose={() => {
                            setShowResetPassword(false);
                            setSelectedAdmin(null);
                        }}
                        onSuccess={() => {
                            toast.success(`Password reset for ${selectedAdmin.first_name}`);
                        }}
                    />
                )}



                {/* 5. PAYMENTS TAB */}
                {
                    activeTab === 'payments' && (
                        <div className="animate-fade-in space-y-6">

                            {/* Stripe Subscription Panel */}
                            {(() => {
                                const status = subscription?.subscription_status || 'none';
                                const hasStripeSub = !!subscription?.stripe_subscription_id;
                                const isManualTrial = status === 'trialing' && !hasStripeSub;
                                const hasSub = hasStripeSub && ['active', 'trialing', 'past_due'].includes(status);
                                const suggested = suggestedPrice(formData.translation_chars_limit, formData.tts_chars_limit);
                                const price = subscription?.monthly_price ?? school?.monthly_price ?? suggested;
                                const statusStyles = {
                                    active:   'bg-green-100 text-green-700',
                                    trialing: 'bg-blue-100 text-blue-700',
                                    past_due: 'bg-red-100 text-red-700',
                                    canceled: 'bg-slate-100 text-slate-500',
                                    none:     'bg-slate-100 text-slate-500',
                                };
                                const dotStyles = {
                                    active:   'bg-green-500',
                                    trialing: 'bg-blue-500',
                                    past_due: 'bg-red-500',
                                    canceled: 'bg-slate-400',
                                    none:     'bg-slate-400',
                                };
                                return (
                                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                                        {/* Header */}
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                    <CreditCard size={20} className="text-primary-600" />
                                                    Recurring Subscription
                                                </h2>
                                                <p className="text-sm text-slate-500 mt-1">Automated monthly billing — renews on its own.</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded-full ${statusStyles[status] || statusStyles.none}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || dotStyles.none}`} />
                                                {subscriptionLabel(status)}
                                            </span>
                                        </div>

                                        {/* Block 1 — Stripe subscription active */}
                                        {hasSub && (
                                            <div className="space-y-4">
                                                {/* Price hero */}
                                                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Monthly Price</p>
                                                        <p className="text-2xl font-semibold mt-0.5 text-slate-900">
                                                            ${price ? parseFloat(price).toFixed(2) : '—'}
                                                            <span className="text-base font-medium text-slate-500 ml-1">/mo</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">Cancel to change the price.</p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[120px]">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1"><Calendar size={11} /> Next renewal</p>
                                                            <p className="text-sm font-bold text-slate-900 mt-1.5">
                                                                {subscription?.next_renewal_at ? new Date(subscription.next_renewal_at).toLocaleDateString() : '—'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[120px]">
                                                            <p className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1"><CreditCard size={11} /> Card</p>
                                                            <p className="text-sm font-bold text-slate-900 mt-1.5 capitalize">
                                                                {subscription?.card_brand ? `${subscription.card_brand} •••• ${subscription.card_last4}` : '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {subscription?.cancel_at_period_end && (
                                                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                                                        <p className="text-sm text-amber-700">
                                                            Scheduled to cancel on{' '}
                                                            <b>{subscription?.next_renewal_at ? new Date(subscription.next_renewal_at).toLocaleDateString() : 'period end'}</b>.
                                                            Access continues until then.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex gap-3 pt-1">
                                                    {status !== 'canceled' && (
                                                        subscription?.cancel_at_period_end ? (
                                                            <button
                                                                onClick={handleResumeSubscription}
                                                                disabled={subLoading}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
                                                            >
                                                                <RefreshCw size={16} /> Keep subscription
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={handleCancelSubscription}
                                                                disabled={subLoading}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            >
                                                                <Ban size={16} /> Cancel at period end
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Block 2 — Manual trial (no Stripe subscription) */}
                                        {isManualTrial && (() => {
                                            const trialExpiry = school?.valid_until ? new Date(school.valid_until) : null;
                                            const trialActive = trialExpiry && trialExpiry >= new Date();
                                            const daysLeft = trialExpiry ? Math.max(0, Math.ceil((trialExpiry - new Date()) / (1000 * 60 * 60 * 24))) : 0;
                                            return (
                                                <div className="space-y-5">
                                                    {/* Trial status card */}
                                                    <div className={`rounded-xl p-5 border ${trialActive ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${trialActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${trialActive ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                                                    {trialActive ? 'Trial Active' : 'Trial Expired'}
                                                                </span>
                                                                <div>
                                                                    <p className={`text-sm font-semibold ${trialActive ? 'text-blue-800' : 'text-slate-700'}`}>
                                                                        {trialActive
                                                                            ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
                                                                            : 'Trial has ended'}
                                                                    </p>
                                                                    {trialExpiry && (
                                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                                            {trialActive ? 'Expires' : 'Expired'}: {trialExpiry.toLocaleDateString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {trialActive && (
                                                                <button
                                                                    onClick={() => handleGrantAccess('revoke')}
                                                                    disabled={subLoading}
                                                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Ban size={16} /> End Trial Early
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Create checkout link — always visible for manual trial schools */}
                                                    <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-5">
                                                        <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3">
                                                            Create a payment link for when the trial ends
                                                        </p>
                                                        <label className="block text-xs text-slate-500 mb-2">Recurring price (charged monthly)</label>
                                                        <div className="flex items-stretch w-fit shadow-sm rounded-xl mb-3">
                                                            <span className="px-3.5 flex items-center bg-white border border-r-0 border-primary-200 rounded-l-xl text-slate-400 font-semibold">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={priceInput}
                                                                onChange={(e) => setPriceInput(e.target.value)}
                                                                className="w-32 px-3 py-3 border border-primary-200 bg-white text-lg font-bold text-primary-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                                                placeholder="0.00"
                                                            />
                                                            <span className="px-3.5 flex items-center bg-white border border-l-0 border-primary-200 rounded-r-xl text-slate-400 text-sm">/mo</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mb-3">
                                                            Suggested{' '}
                                                            <button type="button" onClick={() => setPriceInput(String(suggested))} className="font-bold text-primary-600 hover:underline">${suggested}</button>
                                                            {' '}· charged automatically each cycle.
                                                        </p>
                                                        <div className="flex flex-wrap gap-3">
                                                            <button
                                                                onClick={() => handleStartSubscription(false)}
                                                                disabled={subLoading}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50"
                                                            >
                                                                {subLoading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                                                                Create checkout link
                                                            </button>
                                                            <button
                                                                onClick={() => handleStartSubscription(true)}
                                                                disabled={subLoading || !formData.contact_email}
                                                                title={!formData.contact_email ? 'School has no contact email' : ''}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                            >
                                                                <Send size={16} /> Email link to school
                                                            </button>
                                                        </div>
                                                        {checkoutLink && (
                                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-3">
                                                                <input
                                                                    readOnly
                                                                    value={checkoutLink}
                                                                    className="flex-1 bg-transparent text-sm text-slate-600 outline-none truncate"
                                                                    onFocus={(e) => e.target.select()}
                                                                />
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(checkoutLink); toast.success('Link copied'); }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shrink-0"
                                                                >
                                                                    <Copy size={14} /> Copy
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Block 3 — No subscription, no manual trial */}
                                        {!hasSub && !isManualTrial && (
                                            <div className="space-y-5">
                                                <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-5">
                                                    <label className="block text-xs text-primary-600 font-semibold uppercase tracking-wide mb-2">Recurring price (charged monthly)</label>
                                                    <div className="flex items-stretch w-fit shadow-sm rounded-xl">
                                                        <span className="px-3.5 flex items-center bg-white border border-r-0 border-primary-200 rounded-l-xl text-slate-400 font-semibold">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={priceInput}
                                                            onChange={(e) => setPriceInput(e.target.value)}
                                                            className="w-32 px-3 py-3 border border-primary-200 bg-white text-lg font-bold text-primary-700 focus:ring-2 focus:ring-primary-500 outline-none"
                                                            placeholder="0.00"
                                                        />
                                                        <span className="px-3.5 flex items-center bg-white border border-l-0 border-primary-200 rounded-r-xl text-slate-400 text-sm">/mo</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2.5">
                                                        Suggested{' '}
                                                        <button type="button" onClick={() => setPriceInput(String(suggested))} className="font-bold text-primary-600 hover:underline">${suggested}</button>
                                                        {' '}· charged automatically each cycle.
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => handleStartSubscription(false)}
                                                        disabled={subLoading}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50"
                                                    >
                                                        {subLoading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                                                        Create checkout link
                                                    </button>
                                                    <button
                                                        onClick={() => handleStartSubscription(true)}
                                                        disabled={subLoading || !formData.contact_email}
                                                        title={!formData.contact_email ? 'School has no contact email' : ''}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                    >
                                                        <Send size={16} /> Email link to school
                                                    </button>
                                                </div>

                                                {checkoutLink && (
                                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                                        <input
                                                            readOnly
                                                            value={checkoutLink}
                                                            className="flex-1 bg-transparent text-sm text-slate-600 outline-none truncate"
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                        <button
                                                            onClick={() => { navigator.clipboard.writeText(checkoutLink); toast.success('Link copied'); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shrink-0"
                                                        >
                                                            <Copy size={14} /> Copy
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Free Access & Trials */}
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                                <div className="mb-5">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Gift size={20} className="text-purple-600" />
                                        Free Access &amp; Trials
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">Give this school access without payment — for trials, internal, or comped accounts.</p>
                                </div>

                                {school?.free_access ? (
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle size={18} className="shrink-0" />
                                            <span className="text-sm font-semibold">Complimentary access is enabled — full access, no payment required.</span>
                                        </div>
                                        <button
                                            onClick={() => handleGrantAccess('revoke')}
                                            disabled={subLoading}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            <Ban size={16} /> Revoke
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-end gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trial length (days)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={trialDays}
                                                    onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                                                    className="w-28 px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-base font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleGrantAccess('trial', trialDays)}
                                                disabled={subLoading || !trialDays}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50"
                                            >
                                                <Calendar size={16} /> Start trial
                                            </button>
                                            <button
                                                onClick={() => handleGrantAccess('free')}
                                                disabled={subLoading}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                            >
                                                <Gift size={16} /> Grant free access (no expiry)
                                            </button>
                                        </div>
                                        {school?.valid_until && subscription?.subscription_status !== 'active' && new Date(school.valid_until) >= new Date() && (
                                            <p className="text-xs text-slate-400">
                                                Current access valid until <b>{new Date(school.valid_until).toLocaleDateString()}</b>.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <DollarSign size={20} className="text-green-600" />
                                            Payment History
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Total Revenue: <span className="font-bold text-green-600">${totalRevenue.toLocaleString()}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Payments are recorded automatically by Stripe each billing cycle.
                                        </p>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <CustomDropdown
                                        className="w-44"
                                        value={statusFilter}
                                        onChange={val => setStatusFilter(val)}
                                        showClear={false}
                                        searchable={false}
                                        options={[
                                            { value: 'all', label: 'All Status' },
                                            { value: 'paid', label: 'Paid' },
                                            { value: 'pending', label: 'Pending' },
                                            { value: 'failed', label: 'Failed' },
                                        ]}
                                    />
                                </div>

                                {/* Payments Table */}
                                {payments.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <DollarSign size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-500">No payments found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Invoice #</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Method</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Billing Period</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.map((payment) => (
                                                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <span className="font-mono text-sm text-slate-700">
                                                                {payment.invoice_number || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-700">
                                                            {new Date(payment.payment_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="font-bold text-slate-900">
                                                                ${parseFloat(payment.amount).toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-600 capitalize">
                                                            {payment.payment_method?.replace('_', ' ')}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-slate-600">
                                                            {payment.billing_period_start && payment.billing_period_end ? (
                                                                `${new Date(payment.billing_period_start).toLocaleDateString()} - ${new Date(payment.billing_period_end).toLocaleDateString()}`
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        // Stripe payments link to the hosted invoice; manual ones generate a PDF.
                                                                        if (payment.invoice_url) {
                                                                            window.open(payment.invoice_url, '_blank');
                                                                            return;
                                                                        }
                                                                        try {
                                                                            await api.downloadInvoice(id, payment.id);
                                                                            toast.success('Invoice downloaded');
                                                                        } catch (error) {
                                                                            toast.error('Failed to download invoice');
                                                                        }
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                    title={payment.invoice_url ? 'View Stripe invoice' : 'Download invoice PDF'}
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* ── Usage History Tab ────────────────────────────── */}
                {activeTab === 'usage-history' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Header + Reset button */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Activity size={20} className="text-primary-600" />
                                        Usage History
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        One record per billing or trial period. Usage is snapshotted automatically when a new paid period, trial, or free-access grant starts.
                                    </p>
                                </div>
                                <button
                                    onClick={handleManualUsageReset}
                                    disabled={resettingUsage}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-all disabled:opacity-60 shrink-0"
                                >
                                    <RefreshCw size={15} className={resettingUsage ? 'animate-spin' : ''} />
                                    {resettingUsage ? 'Resetting…' : 'Manual Reset & Snapshot'}
                                </button>
                            </div>
                        </div>

                        {/* History table */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            {usageHistoryLoading ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader2 size={26} className="animate-spin text-primary-600" />
                                </div>
                            ) : usageHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                    <Activity size={36} className="mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No history yet</p>
                                    <p className="text-xs mt-1 text-slate-400">Records appear when a new paid period, trial, or free-access grant starts.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Minutes</th>
                                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Translation</th>
                                                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">TTS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {usageHistory.map((row) => {
                                                const pct = (used, limit) => limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                                                const bar = (pct) => pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-emerald-500';
                                                const typeStyle = {
                                                    paid:   'bg-green-100 text-green-700',
                                                    trial:  'bg-blue-100 text-blue-700',
                                                    free:   'bg-purple-100 text-purple-700',
                                                    manual: 'bg-slate-100 text-slate-600',
                                                };
                                                const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                                                const minPct = pct(row.minutes_used, row.minutes_limit);
                                                const trPct  = pct(row.translation_chars_used, row.translation_chars_limit);
                                                const ttsPct = pct(row.tts_chars_used, row.tts_chars_limit);

                                                return (
                                                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <div className="text-sm font-semibold text-slate-800">{fmtDate(row.period_end)}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{fmtDate(row.period_start)} → {fmtDate(row.period_end)}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${typeStyle[row.period_type] || typeStyle.manual}`}>
                                                                {row.period_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 min-w-[140px]">
                                                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                                                <span className="font-semibold">{row.minutes_used.toLocaleString()}</span>
                                                                <span className="text-slate-400">/ {row.minutes_limit.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-1.5 rounded-full ${bar(minPct)}`} style={{ width: `${minPct}%` }} />
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{minPct}%</div>
                                                        </td>
                                                        <td className="px-5 py-4 min-w-[140px]">
                                                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                                                <span className="font-semibold">{(row.translation_chars_used / 1000).toFixed(1)}k</span>
                                                                <span className="text-slate-400">/ {(row.translation_chars_limit / 1000).toFixed(0)}k</span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-1.5 rounded-full ${bar(trPct)}`} style={{ width: `${trPct}%` }} />
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{trPct}%</div>
                                                        </td>
                                                        <td className="px-5 py-4 min-w-[140px]">
                                                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                                                <span className="font-semibold">{(row.tts_chars_used / 1000).toFixed(1)}k</span>
                                                                <span className="text-slate-400">/ {(row.tts_chars_limit / 1000).toFixed(0)}k</span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-1.5 rounded-full ${bar(ttsPct)}`} style={{ width: `${ttsPct}%` }} />
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{ttsPct}%</div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div >

            {/* Delete School — type-to-confirm */}
            {deleteOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => !deleting && setDeleteOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                            <AlertTriangle size={24} className="text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Delete this school?</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            This permanently deletes <strong className="text-slate-900">{school?.name}</strong> and <strong className="text-slate-900">all of its data</strong> — every admin, teacher, student, conversation, message, and payment record. This action cannot be undone.
                        </p>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Type <span className="font-bold text-slate-900">{school?.name}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={deleteText}
                            onChange={(e) => setDeleteText(e.target.value)}
                            placeholder={school?.name}
                            autoFocus
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none mb-5"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteOpen(false)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSchool}
                                disabled={deleting || deleteText.trim() !== (school?.name || '').trim()}
                                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting…</> : <><Trash2 size={16} /> Delete school</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                    onClick={() => setConfirmDialog(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
                        <p className="text-sm text-slate-600 mb-6">{confirmDialog.message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const fn = confirmDialog.onConfirm;
                                    setConfirmDialog(null);
                                    fn();
                                }}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${confirmDialog.confirmClass || 'bg-primary-600 hover:bg-primary-700'}`}
                            >
                                {confirmDialog.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default SchoolDetails;
