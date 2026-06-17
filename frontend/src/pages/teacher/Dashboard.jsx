import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MessageSquare, UserCheck, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const firstName = user?.firstName || user?.first_name || 'there';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statsData, setStatsData] = useState({
        teacherCount: 0,
        studentCount: 0,
        conversationCount: 0,
        chartData: [],
        sentimentData: [],
        languageData: []
    });

    const fetchDashboardStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/teachers/dashboard-stats');
            if (response.success) {
                setStatsData(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const stats = [
        {
            title: 'TEACHERS',
            value: loading ? '...' : statsData.teacherCount.toString(),
            icon: Users,
            color: 'bg-orange-50 text-orange-600',
            subText: 'Active Teachers'
        },
        {
            title: 'STUDENTS',
            value: loading ? '...' : statsData.studentCount.toString(),
            icon: GraduationCap,
            color: 'bg-green-50 text-green-600',
            subText: 'Active Students'
        },
        {
            title: 'CONVERSATIONS',
            value: loading ? '...' : statsData.conversationCount.toString(),
            icon: MessageSquare,
            color: 'bg-blue-50 text-blue-600',
            subText: 'Total Messages'
        },

    ];

    const quickActions = [
        {
            title: 'My Students',
            label: 'Roster',
            description: 'View students and open private messaging.',
            icon: Users,
            to: '/teacher/students',
            tone: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Live Conversation',
            label: 'Session',
            description: 'Start or manage a translated live conversation.',
            icon: UserCheck,
            to: '/teacher/live-conversation',
            tone: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Conversations',
            label: 'Messages',
            description: 'Continue recent teacher-student threads.',
            icon: MessageSquare,
            to: '/teacher/conversations',
            tone: 'bg-primary-50 text-primary-600'
        },
        {
            title: 'Group Message',
            label: 'Broadcast',
            description: 'Send one translated message to multiple students.',
            icon: Send,
            to: '/teacher/group-message',
            tone: 'bg-amber-50 text-amber-600'
        },
    ];

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-600 font-semibold mb-3">{error}</p>
                <button onClick={fetchDashboardStats} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">Try Again</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in font-inter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Welcome back, {firstName}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's an overview of your teaching activities.</p>
                </div>
                <div className="app-date-pill self-start sm:self-auto">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="app-card app-card-hover p-5">
                            <div className="flex items-center gap-4">
                                <div className={`app-icon-tile ${stat.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="app-eyebrow">{stat.title}</p>
                                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-tight mt-1">
                                        {stat.value}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {stat.subText}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div>
                <div className="mb-4">
                    <p className="app-eyebrow">Shortcuts</p>
                    <h2 className="app-section-title mt-1">Teaching tools</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.title} to={action.to} className="app-card app-card-hover p-5 block">
                                <div className="flex items-start justify-between gap-4">
                                    <div className={`app-icon-tile ${action.tone}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="app-eyebrow">{action.label}</span>
                                </div>
                                <h3 className="mt-5 text-sm font-semibold text-slate-900">{action.title}</h3>
                                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{action.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="app-eyebrow">Analytics</p>
                <h2 className="app-section-title mt-1">Conversation activity</h2>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Monthly Conversations Chart - Spans 2 columns */}
                <div className="app-card p-6 col-span-1 md:col-span-2 lg:col-span-2">
                    <h2 className="app-section-title mb-6">Monthly Conversations (Last 6 Months)</h2>
                    {statsData.chartData.length === 0 ? (
                        <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare size={40} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">No conversation data yet</p>
                            <p className="text-xs mt-1">Data will appear once conversations start</p>
                        </div>
                    ) : (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="conversations"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorConversations)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    )}
                </div>

                {/* Sentiment Analysis Chart - Spans 2 columns */}
                <div className="app-card p-6 col-span-1 md:col-span-2 lg:col-span-2">
                    <h2 className="app-section-title mb-6">Conversation Satisfaction Levels</h2>
                    {statsData.sentimentData.length === 0 ? (
                        <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare size={40} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">No satisfaction data yet</p>
                            <p className="text-xs mt-1">Data will appear once sessions are rated</p>
                        </div>
                    ) : (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData.sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="range"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dx={-10}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#2563eb' }}
                                />
                                <Bar dataKey="conversations" radius={[4, 4, 0, 0]}>
                                    {statsData.sentimentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#EAB308', '#84CC16', '#22C55E'][index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    )}
                </div>

                {/* Language Distribution Chart - Spans 4 columns (Full Width) */}
                <div className="app-card p-6 col-span-1 md:col-span-2 lg:col-span-4">
                    <h2 className="app-section-title mb-6">Number of Conversations Per Language</h2>
                    {statsData.languageData.length === 0 ? (
                        <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare size={40} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">No language data yet</p>
                            <p className="text-xs mt-1">Data will appear once conversations start</p>
                        </div>
                    ) : (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={statsData.languageData}
                                margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    dataKey="language"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#2563eb' }}
                                />
                                <Bar dataKey="conversations" radius={[0, 4, 4, 0]} barSize={32}>
                                    {statsData.languageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#2563eb" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
