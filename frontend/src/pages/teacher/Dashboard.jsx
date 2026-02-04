import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar, CheckCircle, GraduationCap, MessageSquare, Languages } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({
        teacherCount: 0,
        studentCount: 0,
        conversationCount: 0,
        chartData: [],
        sentimentData: [],
        languageData: []
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const response = await api.get('/teachers/dashboard-stats');
                if (response.success) {
                    setStatsData(response.data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                // toast.error('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

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
        {
            title: 'LANGUAGES',
            value: '108',
            icon: Languages,
            color: 'bg-indigo-50 text-indigo-600',
            subText: 'Written (108) | Verbal (37)'
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in font-inter">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Teacher Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Overview of your teaching activities.</p>
                </div>
                <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200/60">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</span>
                            </div>
                            <div className="mb-4">
                                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className="pt-4 border-t border-gray-50 text-xs text-gray-500 font-medium">
                                {stat.subText}
                            </div>
                        </div>
                    );
                })}

                {/* Monthly Conversations Chart - Spans 2 columns */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 col-span-1 md:col-span-2 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Monthly Conversations (Last 6 Months)</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="conversations"
                                    stroke="#4F46E5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorConversations)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sentiment Analysis Chart - Spans 2 columns */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 col-span-1 md:col-span-2 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Conversation Satisfaction Levels</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData.sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="range"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dx={-10}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#4F46E5' }}
                                />
                                <Bar dataKey="conversations" radius={[4, 4, 0, 0]}>
                                    {statsData.sentimentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#EAB308', '#84CC16', '#22C55E'][index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Language Distribution Chart - Spans 4 columns (Full Width) */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 col-span-1 md:col-span-2 lg:col-span-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Number of Conversations Per Language</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={statsData.languageData}
                                margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    dataKey="language"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#8B5CF6' }}
                                />
                                <Bar dataKey="conversations" radius={[0, 4, 4, 0]} barSize={32}>
                                    {statsData.languageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#8B5CF6" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
