import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, Send } from 'lucide-react';
import api from '../services/api';
import { emailSchema } from '../utils/validation';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email format before sending
        try {
            await emailSchema.required('Email is required').validate(email.trim());
            setError('');
        } catch (validationErr) {
            setError(validationErr.message);
            return;
        }

        setLoading(true);
        try {
            await api.forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            toast.error(err?.message || 'Something went wrong. Please try again.');
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

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter dark:bg-slate-950">
            <div className="bg-white rounded-xl shadow-sm w-full max-w-md p-8 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                {/* Logo + heading */}
                <div className="text-center mb-8">
                    <Logo />
                    <div className="mt-6 inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
                        {sent ? <CheckCircle2 className="text-white" size={30} /> : <KeyRound className="text-white" size={28} />}
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        {sent ? 'Check Your Email' : 'Forgot Password?'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        {sent
                            ? "We've sent a reset link if an account matches that email."
                            : "No worries — enter your email and we'll send you a reset link."}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                                    placeholder="your@email.com"
                                    required
                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 outline-none transition-colors dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                                        error
                                            ? 'border-red-300 focus:ring-red-400/20 focus:border-red-400 dark:border-red-800'
                                            : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500 dark:border-slate-700'
                                    }`}
                                />
                            </div>
                            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : (<><Send size={16} /> Send Reset Link</>)}
                        </button>
                    </form>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center dark:bg-emerald-950/30 dark:border-emerald-900">
                        <p className="text-green-700 dark:text-emerald-300 font-semibold">Reset link sent!</p>
                        <p className="text-green-600 dark:text-emerald-400 text-sm mt-1">Check your inbox and follow the instructions. The link expires in 1 hour.</p>
                        <button
                            type="button"
                            onClick={() => { setSent(false); setEmail(''); }}
                            className="text-primary-600 hover:underline text-sm mt-3 font-medium"
                        >
                            Use a different email
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline font-medium">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
