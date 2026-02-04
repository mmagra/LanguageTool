import React, { useState } from 'react';
import { X, Lock, Save, Eye, EyeOff } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const AdminResetPasswordModal = ({ userId, userName, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8 || password.length > 20) {
            toast.error('Password must be between 8 and 20 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/admin/users/${userId}/password`, { password });
            toast.success('Password updated successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#f0f4fe]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                        <p className="text-xs text-gray-500 mt-1">For {userName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                            <Lock className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-amber-800">
                                This will override the current password. The user will need to use this new password to log in.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-white outline-none transition-all"
                                    placeholder="Enter new password (8-20 chars)"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-white outline-none transition-all"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                        </div>

                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                            disabled={loading}
                        >
                            <X size={16} />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={16} />
                                    Update Password
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminResetPasswordModal;
