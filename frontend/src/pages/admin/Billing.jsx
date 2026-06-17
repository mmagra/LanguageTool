import React, { useState, useEffect } from 'react';
import {
    CreditCard, Calendar, TrendingUp, Clock, Users, GraduationCap,
    Download, FileText, Loader2, Medal, CheckCircle, AlertTriangle,
    UserCog, Activity, Globe, Mic2, Copy
} from 'lucide-react';
import api from '../../services/api';
import { subscriptionLabel } from '../../utils/subscription';
import { toast } from 'react-hot-toast';

const StatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-green-100 text-green-700',
        trialing: 'bg-blue-100 text-blue-700',
        past_due: 'bg-red-100 text-red-700',
        canceled: 'bg-slate-100 text-slate-500',
        none: 'bg-slate-100 text-slate-500',
    };
    const label = subscriptionLabel(status);
    return (
        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${styles[status] || styles.none}`}>
            {label}
        </span>
    );
};

// Helpers mirroring the super-admin Usage Dashboard.
const CHARS_PER_WORD = 5;
const fmt = (n) => {
    if (!n && n !== 0) return '—';
    if (n >= 1000000) return (n / 1000000 % 1 === 0 ? n / 1000000 : (n / 1000000).toFixed(1)) + 'M';
    if (n >= 1000) return (n / 1000 % 1 === 0 ? n / 1000 : (n / 1000).toFixed(1)) + 'K';
    return n.toString();
};
const getUsageColor = (used, limit) => {
    if (!limit) return 'emerald';
    const pct = (used / limit) * 100;
    if (pct >= 90) return 'red';
    if (pct >= 70) return 'yellow';
    return 'emerald';
};

const Billing = () => {
    const [school, setSchool] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payLink, setPayLink] = useState('');
    const [payLoading, setPayLoading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    // Returning from Stripe Checkout
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const billing = params.get('billing');
        if (billing === 'success') {
            toast.success('Payment completed!');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (billing === 'cancel') {
            toast('Checkout canceled', { icon: 'ℹ️' });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schoolRes, paymentsRes, linkRes] = await Promise.all([
                api.getMySchool(),
                api.getMyPayments().catch(() => ({ success: false, data: [] })),
                api.getMyPaymentLink().catch(() => ({ success: false, data: {} }))
            ]);
            if (schoolRes.success) setSchool(schoolRes.data);
            if (paymentsRes.success) setPayments(paymentsRes.data);
            if (linkRes.success && linkRes.data?.url) setPayLink(linkRes.data.url);
        } catch (error) {
            console.error('Failed to load billing:', error);
            toast.error('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    };

    // Pay now: use the link the super admin already generated, else create one.
    const handlePayNow = async () => {
        if (payLink) {
            window.open(payLink, '_blank');
            return;
        }
        setPayLoading(true);
        try {
            const res = await api.createMyCheckout();
            if (res.success && res.data?.url) {
                setPayLink(res.data.url);
                window.open(res.data.url, '_blank');
            }
        } catch (error) {
            toast.error(error?.message || 'Could not start checkout');
        } finally {
            setPayLoading(false);
        }
    };

    const handleDownload = async (payment) => {
        // Stripe invoices link to the hosted invoice; manual ones use the PDF endpoint.
        if (payment.invoice_url) {
            window.open(payment.invoice_url, '_blank');
            return;
        }
        toast('Invoice PDF is available from your administrator', { icon: 'ℹ️' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={28} className="animate-spin text-primary-600" />
            </div>
        );
    }

    const status = school?.subscription_status || 'none';
    const validUntil = school?.valid_until ? new Date(school.valid_until) : null;
    const nextRenewal = school?.next_renewal_at ? new Date(school.next_renewal_at) : validUntil;
    const isExpired = !school?.free_access && validUntil && validUntil < new Date();
    // Active = complimentary access, or a future validity window (a payment/trial is in effect).
    const isActive = school?.free_access || (validUntil && validUntil >= new Date());

    return (
        <div className="space-y-6 font-inter">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
                <p className="text-slate-500 mt-1 text-sm">Your plan, renewal date, usage, and invoices.</p>
            </div>

            {/* Complimentary access note */}
            {school?.free_access && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-green-800">Complimentary access</p>
                        <p className="text-sm text-green-700 mt-0.5">Your school has full access with no payment required.</p>
                    </div>
                </div>
            )}

            {/* Activation banner — features stay locked until the first payment clears */}
            {!isActive && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800">
                                {isExpired ? 'Your subscription has expired' : 'Your subscription is not active yet'}
                            </p>
                            <p className="text-sm text-amber-700 mt-0.5">
                                Teacher and student features stay locked until payment is completed.
                                {school?.monthly_price ? <> Complete the secure payment below to activate.</> : <> Please contact your administrator to set up billing.</>}
                            </p>
                        </div>
                    </div>

                    {school?.monthly_price > 0 && (
                        <div className="flex flex-wrap items-center gap-3 pl-8">
                            <button
                                onClick={handlePayNow}
                                disabled={payLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50"
                            >
                                {payLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                Pay ${parseFloat(school.monthly_price).toFixed(2)}/mo
                            </button>
                            {payLink && (
                                <div className="flex-1 min-w-[240px]">
                                    <p className="text-xs font-semibold text-amber-700/80 uppercase tracking-wide mb-1">Payment link from your administrator</p>
                                    <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                                        <input readOnly value={payLink} onFocus={(e) => e.target.select()}
                                            className="flex-1 bg-transparent text-xs text-slate-600 outline-none truncate" />
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(payLink); toast.success('Link copied'); }}
                                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors shrink-0"
                                        >
                                            <Copy size={12} /> Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Subscription summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Medal size={16} className="text-primary-600" />
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Current Plan</span>
                        </div>
                        <span className="text-2xl font-semibold capitalize tracking-tight text-slate-900">{school?.plan_tier || '—'}</span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                        <div>
                            <p className="text-xs text-slate-500">Monthly Price</p>
                            <p className="text-2xl font-bold text-slate-900">{school?.free_access ? 'Free' : (school?.monthly_price ? `$${parseFloat(school.monthly_price).toFixed(2)}` : '—')}</p>
                        </div>
                        {school?.free_access
                            ? <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-green-100 text-green-700">Complimentary</span>
                            : <StatusBadge status={status} />}
                    </div>
                </div>

                {/* Renewal card */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar size={16} className="text-primary-500" />
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Next Renewal</span>
                    </div>
                    {school?.free_access ? (
                        <>
                            <p className="text-2xl font-bold text-slate-900">No renewal</p>
                            <p className="text-sm mt-2 flex items-center gap-1.5 text-slate-500">
                                <CheckCircle size={14} className="text-green-500" />
                                Complimentary access
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-2xl font-bold text-slate-900">{nextRenewal ? nextRenewal.toLocaleDateString() : '—'}</p>
                            {validUntil && (
                                <p className={`text-sm mt-2 flex items-center gap-1.5 ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                                    {isExpired ? <AlertTriangle size={14} /> : <CheckCircle size={14} className="text-green-500" />}
                                    {isExpired ? 'Expired' : 'Active'} until {validUntil.toLocaleDateString()}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Payment method card */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <CreditCard size={16} className="text-primary-500" />
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Billing</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Your subscription is managed by your provider. Contact your administrator to update the plan or payment method.
                    </p>
                </div>
            </div>

            {/* Usage */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity size={20} className="text-primary-600" />
                        Usage Dashboard
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide bg-slate-900 text-white px-3 py-1.5 rounded-lg">
                        <Medal size={13} className="text-yellow-400" /> {school?.plan_tier || '—'}
                    </span>
                </div>

                {(() => {
                    const metrics = [
                        { label: 'Teachers', sublabel: 'Active staff accounts', icon: UserCog, used: school?.teacher_count, limit: school?.max_teachers, barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                        { label: 'Students', sublabel: 'Enrolled learners', icon: Users, used: school?.student_count, limit: school?.max_students, barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                        { label: 'Words Translated', sublabel: 'Translation usage this cycle', icon: Globe, used: Math.round((school?.translation_chars_used || 0) / CHARS_PER_WORD), limit: Math.round((school?.translation_chars_limit || 0) / CHARS_PER_WORD), barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
                        { label: 'Live Conv. Minutes', sublabel: 'Voice session time this cycle', icon: Activity, used: school?.minutes_used, limit: school?.minutes_limit, barColor: 'bg-primary-600', iconCls: 'bg-primary-50 text-primary-600' },
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
                })()}
            </div>

            {/* Invoices */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
                    <FileText size={18} className="text-slate-500" />
                    Invoice History
                </h3>
                {payments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm">No invoices yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Invoice #</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4 font-mono text-sm text-slate-700">{p.invoice_number || '-'}</td>
                                        <td className="py-4 px-4 text-sm text-slate-700">{new Date(p.payment_date).toLocaleDateString()}</td>
                                        <td className="py-4 px-4 font-bold text-slate-900">${parseFloat(p.amount || 0).toFixed(2)}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {p.invoice_url ? (
                                                <button onClick={() => handleDownload(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-semibold">
                                                    <Download size={14} /> View
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Billing;
