import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, DollarSign, Building2, Users, AlertTriangle,
    Loader2, Calendar, Activity, Mail, ArrowRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, Label
} from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const COLORS = {
    basic: '#4ade80',     // Green
    pro: '#3b82f6',       // Blue
    enterprise: '#a855f7', // Purple
    custom: '#9ca3af'     // Gray
};

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
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

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

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

    return (
        <div className="space-y-6 font-inter animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                        Super Admin Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">System-wide performance and statistics</p>
                </div>
                <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200/60">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            ${analytics.revenue.total.toLocaleString()}
                        </h3>

                    </div>
                    <div className="pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
                        Paid: <span className="text-gray-900">${analytics.revenue.paid.toLocaleString()}</span> |
                        Pending: <span className="text-gray-900">${analytics.revenue.pending.toLocaleString()}</span>
                    </div>
                </div>

                {/* Schools Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schools</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {analytics.schools.total}
                        </h3>
                    </div>
                    <div className="pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
                        Active: <span className="text-gray-900">{analytics.schools.active}</span> |
                        Total: <span className="text-gray-900">{analytics.schools.total}</span>
                    </div>
                </div>

                {/* Students Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Students</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {analytics.users.students.toLocaleString()}
                        </h3>
                    </div>
                    <div className="pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
                        Teachers: <span className="text-gray-900">{analytics.users.teachers}</span> |
                        Admins: <span className="text-gray-900">{analytics.users.admins}</span>
                    </div>
                </div>

                {/* Minutes Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Minutes Used</span>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {analytics.minutesUsage.percentage}%
                        </h3>
                    </div>
                    <div className="pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-gray-900">{analytics.minutesUsage.used.toLocaleString()}</span> / {analytics.minutesUsage.limit.toLocaleString()} min
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
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
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
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
                            <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                        )}
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
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
                                        <div className="text-2xl font-bold text-gray-900">{analytics.schools.active}</div>
                                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Schools</div>
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
                                                    <span className="text-sm font-semibold text-gray-700 capitalize">{entry.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={20} className="text-gray-400" />
                        Expiring Subscriptions (Next 30 Days)
                    </h3>
                </div>

                {analytics.expiringSchools.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">School</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Days Remaining</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {analytics.expiringSchools.map((school) => (
                                    <tr key={school.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">{school.name}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full 
                                                ${school.plan_tier === 'basic' ? 'bg-green-100 text-green-700' :
                                                    school.plan_tier === 'pro' ? 'bg-blue-100 text-blue-700' :
                                                        school.plan_tier === 'enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {school.plan_tier}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                                            {new Date(school.valid_until).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-lg ${school.days_remaining <= 7 ? 'bg-red-50 text-red-600 border border-red-100' :
                                                school.days_remaining <= 30 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                    'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                                }`}>
                                                {school.days_remaining} days
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                                                    <Mail size={14} /> Send Reminder
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
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
                        <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
                        <h4 className="text-gray-900 font-medium">No expiring subscriptions</h4>
                        <p className="text-gray-500 text-sm mt-1">All schools have more than 30 days remaining.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
