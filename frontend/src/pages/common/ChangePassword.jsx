import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Save,
    Lock,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { PASSWORD_REGEX } from '../../utils/validation';

const ChangePassword = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Visibility State
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validatePassword = (password) => {
        // Shared policy: min 8 with uppercase, lowercase, number and special char
        return PASSWORD_REGEX.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setMessage({ type: 'error', text: t('changePassword:messages.error') });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: t('changePassword:messages.mismatch') });
            return;
        }

        if (!validatePassword(formData.newPassword)) {
            setMessage({
                type: 'error',
                text: t('changePassword:messages.required')
            });
            return;
        }

        setLoading(true);

        try {
            const response = await api.put('/auth/password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            if (response.success) {
                // Update token if provided
                if (response.data && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                setMessage({ type: 'success', text: t('changePassword:messages.success') });
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setMessage({ type: 'error', text: response.message || t('changePassword:messages.failed') });
            }
        } catch (error) {
            console.error('Change password error:', error);
            setMessage({
                type: 'error',
                text: error?.message || error.message || t('changePassword:messages.error')
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
            <div className="max-w-3xl mx-auto">
                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        {message.type === 'success' ? (
                            <Check className="text-green-600 shrink-0" size={20} />
                        ) : (
                            <AlertCircle className="text-red-600 shrink-0" size={20} />
                        )}
                        <p className={`font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-50 p-6 md:p-8 relative">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary-600 p-[3px] shadow-lg flex items-center justify-center">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <Lock size={32} className="text-brand-blue" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-slate-900 mb-1">
                                    {t('changePassword:title')}
                                </h1>
                                <p className="text-slate-600 font-medium">
                                    {t('changePassword:subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('changePassword:currentPassword')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-slate-800 placeholder-slate-400"
                                    placeholder={t('changePassword:currentPasswordPlaceholder')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                                >
                                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('changePassword:newPassword')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-slate-800 placeholder-slate-400"
                                    placeholder={t('changePassword:newPasswordPlaceholder')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {formData.newPassword && (
                                <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-1.5">
                                    {[
                                        { label: 'At least 8 characters', met: formData.newPassword.length >= 8 },
                                        { label: 'Uppercase letter', met: /[A-Z]/.test(formData.newPassword) },
                                        { label: 'Lowercase letter', met: /[a-z]/.test(formData.newPassword) },
                                        { label: 'Number', met: /\d/.test(formData.newPassword) },
                                        { label: 'Special character', met: /[^A-Za-z0-9]/.test(formData.newPassword) },
                                    ].map(({ label, met }) => (
                                        <div key={label} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${met ? 'text-green-600' : 'text-slate-400'}`}>
                                            <Check size={12} className={met ? 'text-green-500' : 'text-slate-300'} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('changePassword:confirmPassword')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-slate-800 placeholder-slate-400"
                                    placeholder={t('changePassword:confirmPasswordPlaceholder')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center gap-2 px-4 py-3 bg-slate-50 text-primary-600 font-bold rounded-xl text-sm transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Save size={16} />
                                {loading ? t('changePassword:button.updating') : t('changePassword:button.update')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
