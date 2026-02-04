import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, DollarSign, Building2, Users, AlertTriangle,
    Loader2, Calendar, Activity, BarChart3, PieChart
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const Analytics = () => {
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

    return (
        <div className="max-w-7xl mx-auto space-y-6 font-inter animate-fade-in p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <BarChart3 size={32} className="text-indigo-600" />
                    Analytics Dashboard
                </h1>
                <p className="text-gray-500 mt-1">System-wide performance and statistics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <DollarSign size={24} className="opacity-80" />
                        <span className="text-xs font-semibold uppercase opacity-80">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        ${analytics.revenue.total.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-90">
                        Paid: ${analytics.revenue.paid.toLocaleString()} | Pending: ${analytics.revenue.pending.toLocaleString()}
                    </div>
                </div>

                {/* Schools Card */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <Building2 size={24} className="opacity-80" />
                        <span className="text-xs font-semibold uppercase opacity-80">Total Schools</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {analytics.schools.total}
                    </div>
                    <div className="text-sm opacity-90">
                        Active: {analytics.schools.active} | Trial: {analytics.schools.trial}
                    </div>
                </div>

                {/* Students Card */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <Users size={24} className="opacity-80" />
                        <span className="text-xs font-semibold uppercase opacity-80">Total Students</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {analytics.users.students.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-90">
                        Teachers: {analytics.users.teachers} | Admins: {analytics.users.admins}
                    </div>
                </div>

                {/* Minutes Usage Card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <Activity size={24} className="opacity-80" />
                        <span className="text-xs font-semibold uppercase opacity-80">Minutes Used</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {analytics.minutesUsage.percentage}%
                    </div>
                    <div className="text-sm opacity-90">
                        {analytics.minutesUsage.used.toLocaleString()} / {analytics.minutesUsage.limit.toLocaleString()} min
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" />
                        Revenue Trend (Last 6 Months)
                    </h3>
                    {analytics.revenueTrend.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.revenueTrend.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-600 w-24">{item.month}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all"
                                            style={{
                                                width: `${Math.max((item.revenue / Math.max(...analytics.revenueTrend.map(r => r.revenue))) * 100, 5)}%`
                                            }}
                                        >
                                            <span className="text-white text-xs font-bold">
                                                ${item.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-10">No revenue data available</p>
                    )}
                </div>

                {/* Plan Distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-indigo-600" />
                        Plan Distribution
                    </h3>
                    {analytics.planDistribution.length > 0 ? (
                        <div className="space-y-4">
                            {analytics.planDistribution.map((item, index) => {
                                const colors = {
                                    basic: 'bg-blue-500',
                                    pro: 'bg-indigo-500',
                                    enterprise: 'bg-purple-500',
                                    custom: 'bg-gray-500'
                                };
                                const percentage = ((item.count / analytics.schools.active) * 100).toFixed(1);
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-700 capitalize">
                                                {item.plan}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {item.count} schools ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div
                                                className={`${colors[item.plan] || 'bg-gray-500'} h-3 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-10">No plan data available</p>
                    )}
                </div>
            </div>

            {/* Expiring Subscriptions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-600" />
                    Expiring Subscriptions (Next 30 Days)
                </h3>
                {analytics.expiringSchools.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">School</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Plan</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Expiry Date</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Days Remaining</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.expiringSchools.map((school) => (
                                    <tr key={school.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 font-semibold text-gray-900">
                                            {school.name}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-indigo-100 text-indigo-700">
                                                {school.plan_tier}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600">
                                            {new Date(school.valid_until).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${school.days_remaining <= 7 ? 'bg-red-100 text-red-700' :
                                                    school.days_remaining <= 14 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {school.days_remaining} days
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button
                                                onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                                                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                                            >
                                                View Details →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No subscriptions expiring in the next 30 days</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
