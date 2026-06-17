import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard, TrendingUp, DollarSign, Calendar, AlertTriangle,
    CheckCircle, XCircle, Clock, Loader2, ChevronRight, Building2
} from 'lucide-react';
import api from '../../services/api';
import { subscriptionLabel } from '../../utils/subscription';
import { toast } from 'react-hot-toast';

const fmtMoney = (n) => `$${(parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard = ({ icon: Icon, label, value, sub, tone = 'primary' }) => {
    const tones = {
        primary: 'bg-primary-50 text-primary-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        gray: 'bg-slate-50 text-slate-500',
        blue: 'bg-blue-50 text-blue-600',
    };
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${tones[tone]}`}>
                    <Icon size={18} />
                </div>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    );
};

const Billing = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.getBillingOverview();
            if (res.success) setData(res.data);
        } catch (error) {
            console.error('Failed to load billing overview:', error);
            toast.error('Failed to load billing overview');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={28} className="animate-spin text-primary-600" />
            </div>
        );
    }

    const subs = data?.subscriptions || {};
    const renewals = data?.upcoming_renewals || [];
    const pastDue = data?.past_due || [];

    return (
        <div className="space-y-6 font-inter">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Billing &amp; Revenue</h1>
                <p className="text-slate-500 mt-1 text-sm">Recurring revenue, subscriptions, and upcoming renewals across all schools.</p>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={TrendingUp} label="MRR" value={fmtMoney(data?.mrr)} sub="Monthly recurring revenue" tone="primary" />
                <StatCard icon={DollarSign} label="Revenue (this month)" value={fmtMoney(data?.revenue?.this_month)} sub={`${fmtMoney(data?.revenue?.total)} all-time`} tone="green" />
                <StatCard icon={CheckCircle} label="Active subscriptions" value={subs.active || 0} sub={`${subs.trialing || 0} on trial`} tone="blue" />
                <StatCard icon={AlertTriangle} label="Past due" value={subs.past_due || 0} sub={`${data?.revenue?.failed_count || 0} failed charges`} tone="red" />
            </div>

            {/* Subscription breakdown */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Subscription Status</h3>
                <div className="flex flex-wrap gap-3">
                    {[
                        { key: 'active', label: 'Active', cls: 'bg-green-100 text-green-700' },
                        { key: 'trialing', label: 'Trial', cls: 'bg-blue-100 text-blue-700' },
                        { key: 'past_due', label: 'Past Due', cls: 'bg-red-100 text-red-700' },
                        { key: 'canceled', label: 'Canceled', cls: 'bg-slate-100 text-slate-500' },
                        { key: 'none', label: 'No Subscription', cls: 'bg-slate-100 text-slate-500' },
                    ].map(s => (
                        <div key={s.key} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${s.cls}`}>
                            <span className="text-lg font-bold">{subs[s.key] || 0}</span>
                            <span className="text-xs font-semibold uppercase">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Past due alert list */}
            {pastDue.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 shadow-xl shadow-red-200/50 p-6">
                    <h3 className="text-base font-bold text-red-700 flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} /> Past-due schools — need attention
                    </h3>
                    <div className="space-y-2">
                        {pastDue.map(s => (
                            <button
                                key={s.id}
                                onClick={() => navigate(`/super-admin/schools/${s.id}`)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-red-50/60 hover:bg-red-50 transition-colors group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                                        <Building2 size={15} className="text-red-500" />
                                    </div>
                                    <span className="font-semibold text-slate-900 text-sm">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">{s.monthly_price ? fmtMoney(s.monthly_price) : '—'}</span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-red-400 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming renewals */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-primary-500" /> Upcoming renewals (next 30 days)
                </h3>
                {renewals.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm">No renewals in the next 30 days</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">School</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Renews</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                                    <th className="py-3 px-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {renewals.map(s => {
                                    const subStyles = {
                                        active: 'bg-green-100 text-green-700',
                                        trialing: 'bg-blue-100 text-blue-700',
                                        past_due: 'bg-red-100 text-red-700',
                                    };
                                    return (
                                        <tr
                                            key={s.id}
                                            onClick={() => navigate(`/super-admin/schools/${s.id}`)}
                                            className="border-b border-slate-100 hover:bg-primary-50/40 transition-colors cursor-pointer group"
                                        >
                                            <td className="py-4 px-4 font-semibold text-slate-900 text-sm">{s.name}</td>
                                            <td className="py-4 px-4 text-sm text-slate-700">{new Date(s.next_renewal_at).toLocaleDateString()}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full ${subStyles[s.subscription_status] || 'bg-slate-100 text-slate-500'}`}>
                                                    {subscriptionLabel(s.subscription_status)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-slate-900">{s.monthly_price ? fmtMoney(s.monthly_price) : '—'}</td>
                                            <td className="py-4 px-4 text-right">
                                                <ChevronRight size={16} className="text-slate-200 group-hover:text-primary-400 ml-auto transition-colors" />
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
    );
};

export default Billing;
