import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import api from '../services/api';
import { PASSWORD_REQUIREMENTS } from '../utils/validation';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
    const allMet = PASSWORD_REQUIREMENTS.every((r) => r.test(newPassword));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Invalid reset link. Please request a new one.');
            return;
        }

        const failedReqs = PASSWORD_REQUIREMENTS.filter((r) => !r.test(newPassword));
        if (failedReqs.length > 0) {
            toast.error(`Password must have: ${failedReqs.map((r) => r.label).join(', ')}`);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.resetPassword(token, newPassword);
            toast.success('Password reset successfully! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const Logo = () => (
        <Link to="/" className="inline-flex justify-center">
            <img
                src="/Spoken-Edge-Text-Logo-trans.png"
                alt="Spoken Edge"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="font-bold text-primary-600 text-2xl">Spoken Edge</span>';
                }}
            />
        </Link>
    );

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dark:bg-slate-950">
                <div className="bg-white rounded-xl shadow-sm w-full max-w-md p-8 text-center border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <Logo />
                    <div className="mt-6 inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-3">
                        <Lock className="text-red-500" size={24} />
                    </div>
                    <p className="text-slate-800 dark:text-slate-100 font-semibold">This reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="text-primary-600 hover:underline text-sm mt-4 inline-block font-semibold">
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter dark:bg-slate-950">
            <div className="bg-white rounded-xl shadow-sm w-full max-w-md p-8 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                {/* Logo + heading */}
                <div className="text-center mb-8">
                    <Logo />
                    <div className="mt-6 inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
                        <ShieldCheck className="text-white" size={30} />
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Set a New Password</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Choose a strong password to secure your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 outline-none transition-colors dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                                    confirmPassword.length > 0 && !passwordsMatch
                                        ? 'border-red-300 focus:ring-red-400/20 focus:border-red-400 dark:border-red-800'
                                        : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500 dark:border-slate-700'
                                }`}
                            />
                        </div>
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                        )}
                    </div>

                    {/* Requirements checklist */}
                    {newPassword && (
                        <ul className="grid grid-cols-1 gap-1 bg-slate-50 rounded-xl p-3 border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                            {PASSWORD_REQUIREMENTS.map((req) => {
                                const ok = req.test(newPassword);
                                return (
                                    <li key={req.label} className={`text-xs flex items-center gap-2 ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                                        <span className={`flex items-center justify-center w-4 h-4 rounded-full ${ok ? 'bg-green-100' : 'bg-slate-200'}`}>
                                            {ok ? <Check size={10} className="text-green-600" /> : null}
                                        </span>
                                        {req.label}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !allMet || !passwordsMatch}
                        className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline font-medium">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
