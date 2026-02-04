import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, Save, Users, UserCog,
    CheckCircle, XCircle, AlertTriangle, Loader2,
    Shield, Mail, Phone, Globe, Calendar, Zap, Award, Settings, Check, LayoutDashboard, DollarSign, Plus, Edit2, Trash2, Download, Activity, TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import AddPaymentModal from './modals/AddPaymentModal';
import AdminResetPasswordModal from '../admin/modals/AdminResetPasswordModal';

const SchoolDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data for Configurations
    const [allLanguages, setAllLanguages] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [payments, setPayments] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [usageStats, setUsageStats] = useState(null);

    // Editable Form State
    const [formData, setFormData] = useState({
        name: '',
        contact_email: '',
        contact_number: '',
        status: '',
        max_students: 0,
        max_teachers: 0,
        minutes_limit: 0,
        plan_tier: '',
        valid_until: '',
        allowed_languages: [] // Array of codes
    });

    const [showResetPassword, setShowResetPassword] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const PLAN_LIMITS = {
        'basic': { students: 100, teachers: 10, minutes: 1000 },
        'pro': { students: 500, teachers: 50, minutes: 5000 },
        'enterprise': { students: 2000, teachers: 200, minutes: 20000 }
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
    }, [activeTab, statusFilter]);

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
                    status: s.status,
                    max_students: s.max_students,
                    max_teachers: s.max_teachers,
                    minutes_limit: s.minutes_limit || 1000,
                    plan_tier: s.plan_tier,
                    valid_until: s.valid_until ? new Date(s.valid_until).toISOString().split('T')[0] : '',
                    allowed_languages: s.allowed_languages ? s.allowed_languages.map(l => l.code) : []
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

    const handleDeletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment?')) return;
        try {
            await api.deletePayment(id, paymentId);
            toast.success('Payment deleted successfully');
            fetchPayments();
        } catch (error) {
            console.error('Failed to delete payment:', error);
            toast.error('Failed to delete payment');
        }
    };

    const handlePaymentSaved = (payment) => {
        fetchPayments();
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
            updates.minutes_limit = PLAN_LIMITS[tier].minutes;
        }
        setFormData(prev => ({ ...prev, ...updates }));
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

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!school) return <div className="text-center p-10">School not found</div>;

    const isCustomPlan = formData.plan_tier === 'custom';
    const stats = school.stats || { students: 0, teachers: 0 };

    return (
        <div className="max-w-7xl mx-auto space-y-8 font-inter animate-in fade-in duration-500 p-8">
            {/* Header Card with Profile Header Color */}
            <div className="relative overflow-hidden rounded-2xl bg-[#f0f4fe] shadow-xl shadow-gray-100/50 border border-gray-100/50 group">

                <div className="relative p-10 flex flex-col md:flex-row gap-10 items-start md:items-start justify-between z-10">
                    <div className="flex items-center gap-8">
                        {/* Elevated Logo Container matching Profile Style */}
                        <div className="relative group/logo">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[3px] shadow-lg">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/logo:scale-105">
                                    {school.logo_url ? (
                                        <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building2 size={32} className="text-gray-300" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{formData.name || school.name}</h1>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${formData.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    {formData.status}
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                <span className="text-xs font-semibold tracking-wide text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-500" />
                                    Joined {new Date(school.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                                    {React.createElement(getPlanIcon(formData.plan_tier), { size: 14, className: `text-${getPlanColor(formData.plan_tier)}-500` })}
                                    <span className="text-gray-900 font-bold text-xs capitalize">{formData.plan_tier} Plan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-indigo-50 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>


                {/* Premium Tab Strip */}
                <div className="bg-white border-t border-gray-100 px-10">
                    <div className="flex items-center gap-8 -mb-px">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                            { id: 'subscription', icon: Shield, label: 'Plan & Usage' },
                            { id: 'languages', icon: Globe, label: 'Languages' },
                            { id: 'admins', icon: Users, label: 'Administrators' },
                            { id: 'payments', icon: DollarSign, label: 'Payments' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
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
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Building2 size={20} className="text-indigo-600" />
                                    School Information
                                </h2>

                                <div className="space-y-5">
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
                                                placeholder="contact@school.edu"
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
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                            <CheckCircle size={16} className="text-emerald-600" /> Status
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 outline-none transition-all font-medium text-gray-900 hover:border-gray-300 cursor-pointer"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%236B7280' d='M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 0.75rem center',
                                                    backgroundSize: '1.25rem'
                                                }}
                                            >
                                                <option value="active" className="py-2">✓ Active</option>
                                                <option value="inactive" className="py-2">○ Inactive</option>
                                                <option value="suspended" className="py-2">⊗ Suspended</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">

                            {/* Quick Stats Card */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-sm p-8 h-full">
                                <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                                    <Activity size={20} className="text-indigo-600" />
                                    Quick Stats
                                </h3>
                                <div className="space-y-6">
                                    {/* Teachers */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <UserCog size={16} className="text-purple-600" />
                                                Teachers
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">{stats.teachers} / {formData.max_teachers || 0}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                                                style={{ width: `${formData.max_teachers ? Math.min(100, (stats.teachers / formData.max_teachers) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Students */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Users size={16} className="text-blue-600" />
                                                Students
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">{stats.students} / {formData.max_students || 0}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${formData.max_students ? Math.min(100, (stats.students / formData.max_students) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* In-Person Minutes */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Activity size={16} className="text-indigo-600" />
                                                In-Person Minutes
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {usageStats?.minutes_used?.toLocaleString() || 0} / {formData.minutes_limit?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                                                style={{ width: `${formData.minutes_limit ? Math.min(100, ((usageStats?.minutes_used || 0) / formData.minutes_limit) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Languages */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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

                {/* 2. SUBSCRIPTION TAB (Combines Plan & Usage) */}
                {activeTab === 'subscription' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Left Column - Usage Statistics */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Usage Stats Card */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-sm p-8">
                                <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                                    <Activity size={20} className="text-indigo-600" />
                                    Usage Statistics
                                </h3>
                                {usageStats && (
                                    <div className="space-y-6">
                                        {/* Teachers */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <UserCog size={16} className="text-purple-600" />
                                                    Teachers
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {usageStats.teachers_count?.toLocaleString() || 0} / {usageStats.max_teachers?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${usageStats.max_teachers ? Math.min(100, ((usageStats.teachers_count || 0) / usageStats.max_teachers) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Students */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <Users size={16} className="text-blue-600" />
                                                    Students
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {usageStats.students_count?.toLocaleString() || 0} / {usageStats.max_students?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${usageStats.max_students ? Math.min(100, ((usageStats.students_count || 0) / usageStats.max_students) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* In-Person Minutes */}
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <Activity size={16} className="text-indigo-600" />
                                                    In-Person Minutes
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {usageStats.minutes_used?.toLocaleString() || 0} / {usageStats.minutes_limit?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${usageStats.minutes_limit ? Math.min(100, ((usageStats.minutes_used || 0) / usageStats.minutes_limit) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Plan Validity */}
                                        {usageStats.valid_until && (
                                            <div className={`bg-white rounded-xl p-4 shadow-sm border ${usageStats.days_until_expiry <= 7 ? 'border-red-200 bg-red-50/50' :
                                                usageStats.days_until_expiry <= 30 ? 'border-yellow-200 bg-yellow-50/50' :
                                                    'border-emerald-200 bg-emerald-50/50'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={16} className={
                                                        usageStats.days_until_expiry <= 7 ? 'text-red-600' :
                                                            usageStats.days_until_expiry <= 30 ? 'text-yellow-600' :
                                                                'text-emerald-600'
                                                    } />
                                                    <span className="text-sm font-semibold text-gray-700">Plan Validity</span>
                                                </div>
                                                <p className={`text-2xl font-bold mb-1 ${usageStats.days_until_expiry <= 7 ? 'text-red-700' :
                                                    usageStats.days_until_expiry <= 30 ? 'text-yellow-700' :
                                                        'text-emerald-700'
                                                    }`}>
                                                    {usageStats.days_until_expiry > 0
                                                        ? `${usageStats.days_until_expiry} days`
                                                        : 'Expired'
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {usageStats.days_until_expiry > 0 ? 'Expires' : 'Expired'} {new Date(usageStats.valid_until).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Plan Configuration */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    Plan Configuration
                                </h3>

                                {/* Plan Selection Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

                                {/* Configuration Inputs */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <div className="mb-6">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                            Limits Configuration
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                        </div>
                    </div>
                )}

                {/* 3. LANGUAGES TAB */}
                {activeTab === 'languages' && (
                    <div className="grid grid-cols-1 gap-6 animate-fade-in">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Allowed Languages</h3>
                                    <p className="text-gray-500 text-sm">Select languages available to this school.</p>
                                </div>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                    {formData.allowed_languages.length} Selected
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {allLanguages.map(lang => {
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
                    </div>
                )}



                {/* 4. ADMINS TAB */}
                {activeTab === 'admins' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <UserCog size={20} className="text-orange-500" />
                                    School Administrators
                                </h2>
                            </div>

                            {admins.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <UserCog size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-gray-500">No administrators found for this school.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {admins.map(admin => (
                                        <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-md">
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
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                            {admin.first_name[0]}{admin.last_name[0]}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900 text-lg">
                                                            {admin.first_name} {admin.last_name}
                                                        </h3>
                                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-bold font-mono">
                                                            {admin.username}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail size={14} className="text-gray-400" />
                                                            {admin.email}
                                                        </div>
                                                        {admin.phone && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone size={14} className="text-gray-400" />
                                                                {admin.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto pl-16 sm:pl-0">
                                                <button
                                                    onClick={() => handleResetPassword(admin)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-semibold rounded-xl text-sm border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all group/btn"
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
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <DollarSign size={20} className="text-green-600" />
                                            Payment History
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Total Revenue: <span className="font-bold text-green-600">${totalRevenue.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingPayment(null);
                                            setShowAddPayment(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        <Plus size={18} />
                                        Add Payment
                                    </button>
                                </div>

                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                {/* Payments Table */}
                                {payments.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">No payments found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Invoice #</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Method</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Billing Period</th>
                                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.map((payment) => (
                                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <span className="font-mono text-sm text-gray-700">
                                                                {payment.invoice_number || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-gray-700">
                                                            {new Date(payment.payment_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="font-bold text-gray-900">
                                                                ${parseFloat(payment.amount).toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 capitalize">
                                                            {payment.payment_method?.replace('_', ' ')}
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-gray-600">
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
                                                                        try {
                                                                            await api.downloadInvoice(id, payment.id);
                                                                            toast.success('Invoice downloaded');
                                                                        } catch (error) {
                                                                            toast.error('Failed to download invoice');
                                                                        }
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                    title="Download Invoice"
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingPayment(payment);
                                                                        setShowAddPayment(true);
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePayment(payment.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
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

                {/* Add/Edit Payment Modal */}
                <AddPaymentModal
                    isOpen={showAddPayment}
                    onClose={() => {
                        setShowAddPayment(false);
                        setEditingPayment(null);
                    }}
                    schoolId={id}
                    payment={editingPayment}
                    onPaymentSaved={handlePaymentSaved}
                />
            </div >
        </div >
    );
};

export default SchoolDetails;
