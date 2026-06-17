import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, DollarSign, Building2, Users,
    Calendar, Activity, ArrowRight, Globe, FileText, CreditCard
} from 'lucide-react';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    basic: '#2563eb',      // Blue
    pro: '#1d4ed8',        // Darker blue
    enterprise: '#7c3aed', // Violet
    custom: '#94a3b8'      // Slate
};

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const firstName = user?.firstName || user?.first_name || 'there';
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.getAnalyticsOverview();
            if (response.success) {
                setAnalytics(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState />;

    if (!analytics) return <ErrorState message="No analytics data available." onRetry={fetchAnalytics} />;

    // Plan Distribution Data for Recharts
    const planData = [
        { name: 'Basic', value: 0, color: COLORS.basic },
        { name: 'Pro', value: 0, color: COLORS.pro },
        { name: 'Enterprise', value: 0, color: COLORS.enterprise },
    ];

    // Populate planData from analytics
    analytics.planDistribution.forEach(item => {
        const tier = item.plan.toLowerCase();
        const found = planData.find(p => p.name.toLowerCase() === tier);
        if (found) {
            found.value = item.count;
        } else {
            // Add custom if not found
            planData.push({ name: item.plan, value: item.count, color: COLORS.custom });
        }
    });

    // Generate last 6 months with $0 for missing data
    const generateLast6Months = () => {
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push({ month: monthStr, revenue: 0 });
        }

        return months;
    };

    // Merge backend data with complete 6-month structure
    const revenueTrendData = generateLast6Months();
    analytics.revenueTrend.forEach(item => {
        const found = revenueTrendData.find(m => m.month === item.month);
        if (found) {
            found.revenue = item.revenue;
        }
    });

    const quickActions = [
        {
            title: 'Manage Schools',
            label: 'Tenants',
            description: 'Review schools, plan status, usage, and administrators.',
            icon: Building2,
            path: '/super-admin/schools',
            tone: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Billing',
            label: 'Revenue',
            description: 'Monitor platform billing, payments, and access status.',
            icon: CreditCard,
            path: '/super-admin/billing',
            tone: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Languages',
            label: 'Catalog',
            description: 'Control available written and live conversation languages.',
            icon: Globe,
            path: '/super-admin/languages',
            tone: 'bg-primary-50 text-primary-600'
        },
        {
            title: 'Audit Logs',
            label: 'Security',
            description: 'Trace admin activity and platform-level changes.',
            icon: FileText,
            path: '/super-admin/audit-logs',
            tone: 'bg-amber-50 text-amber-600'
        },
    ];

    return (
        <div className="space-y-6 font-inter animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        Welcome back, {firstName}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">System-wide performance and statistics</p>
                </div>
                <div className="app-date-pill self-start sm:self-auto">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="app-card app-card-hover p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="app-icon-tile bg-emerald-50 text-emerald-600">
                            <DollarSign size={20} />
                        </div>
                        <span className="app-eyebrow">Revenue</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
                            ${analytics.revenue.total.toLocaleString()}
                        </h3>

                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Paid: <span className="text-slate-900 dark:text-slate-100">${analytics.revenue.paid.toLocaleString()}</span> |
                        Pending: <span className="text-slate-900 dark:text-slate-100">${analytics.revenue.pending.toLocaleString()}</span>
                    </div>
                </div>

                {/* Schools Card */}
                <div className="app-card app-card-hover p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="app-icon-tile bg-blue-50 text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <span className="app-eyebrow">Schools</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
                            {analytics.schools.total}
                        </h3>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Active: <span className="text-slate-900 dark:text-slate-100">{analytics.schools.active}</span> |
                        Total: <span className="text-slate-900 dark:text-slate-100">{analytics.schools.total}</span>
                    </div>
                </div>

                {/* Students Card */}
                <div className="app-card app-card-hover p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="app-icon-tile bg-purple-50 text-purple-600">
                            <Users size={20} />
                        </div>
                        <span className="app-eyebrow">Students</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
                            {analytics.users.students.toLocaleString()}
                        </h3>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Teachers: <span className="text-slate-900 dark:text-slate-100">{analytics.users.teachers}</span> |
                        Admins: <span className="text-slate-900 dark:text-slate-100">{analytics.users.admins}</span>
                    </div>
                </div>

                {/* Minutes Card */}
                <div className="app-card app-card-hover p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="app-icon-tile bg-orange-50 text-orange-600">
                            <Activity size={20} />
                        </div>
                        <span className="app-eyebrow">Minutes Used</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
                            {analytics.minutesUsage.percentage}%
                        </h3>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-slate-900 dark:text-slate-100">{analytics.minutesUsage.used.toLocaleString()}</span> / {analytics.minutesUsage.limit.toLocaleString()} min
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-4">
                    <p className="app-eyebrow">Shortcuts</p>
                    <h2 className="app-section-title mt-1">Platform operations</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.title}
                                type="button"
                                onClick={() => navigate(action.path)}
                                className="app-card app-card-hover p-5 text-left"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className={`app-icon-tile ${action.tone}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="app-eyebrow">{action.label}</span>
                                </div>
                                <h3 className="mt-5 text-sm font-semibold text-slate-900">{action.title}</h3>
                                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{action.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="app-eyebrow">Analytics</p>
                <h2 className="app-section-title mt-1">Platform performance</h2>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="app-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="app-section-title flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-600" />
                            Revenue Trend (Last 6 Months)
                        </h3>
                    </div>
                    <div className="h-56">
                        {revenueTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={revenueTrendData}
                                    margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickFormatter={(value) => `$${value}`}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            padding: '8px 12px'
                                        }}
                                        formatter={(value) => [`$${value}`, 'Revenue']}
                                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                        label={{
                                            position: 'top',
                                            content: (props) => {
                                                const { x, y, value, index } = props;
                                                if (index === revenueTrendData.length - 1) {
                                                    return (
                                                        <text
                                                            x={x}
                                                            y={y - 10}
                                                            fill="#10b981"
                                                            fontSize="12"
                                                            fontWeight="600"
                                                            textAnchor="middle"
                                                        >
                                                            ${value}
                                                        </text>
                                                    );
                                                }
                                                return null;
                                            }
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                        )}
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="app-card p-6">
                    <h3 className="app-section-title mb-6 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary-600 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
                        </div>
                        Plan Distribution
                    </h3>
                    <div className="h-56 flex items-center justify-center px-4">
                        <div className="relative w-full h-full flex items-center justify-center gap-6">
                            <div className="relative" style={{ width: '50%', height: '100%', maxWidth: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={planData.filter(p => p.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="#fff"
                                            strokeWidth={1}
                                        >
                                            {planData.filter(p => p.value > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                padding: '6px 10px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{analytics.schools.active}</div>
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Schools</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center space-y-3">
                                {planData.map((entry, index) => {
                                    if (entry.value === 0) return null;
                                    const percentage = ((entry.value / analytics.schools.active) * 100).toFixed(0);
                                    return (
                                        <div key={index} className="flex flex-col gap-1.5 group cursor-default">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-700 capitalize">{entry.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%`, backgroundColor: entry.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expiring Subscriptions Table */}
            <div className="app-card overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="app-section-title flex items-center gap-2">
                        <Calendar size={20} className="text-slate-400" />
                        Expiring Subscriptions (Next 30 Days)
                    </h3>
                </div>

                {analytics.expiringSchools.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>School</th>
                                    <th>Plan</th>
                                    <th>Expiry Date</th>
                                    <th>Days Remaining</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.expiringSchools.map((school) => (
                                    <tr key={school.id}>
                                        <td>
                                            <div className="font-semibold text-slate-900 dark:text-slate-50">{school.name}</div>
                                        </td>
                                        <td>
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full 
                                                ${school.plan_tier === 'basic' ? 'bg-green-100 text-green-700' :
                                                    school.plan_tier === 'pro' ? 'bg-blue-100 text-blue-700' :
                                                        school.plan_tier === 'enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {school.plan_tier}
                                            </span>
                                        </td>
                                        <td className="font-medium">
                                            {new Date(school.valid_until).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-lg ${school.days_remaining <= 7 ? 'bg-red-50 text-red-600 border border-red-100' :
                                                school.days_remaining <= 30 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                    'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                                }`}>
                                                {school.days_remaining} days
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-100"
                                                >
                                                    View Details <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                        <h4 className="text-slate-900 font-medium">No expiring subscriptions</h4>
                        <p className="text-slate-500 text-sm mt-1">All schools have more than 30 days remaining.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
