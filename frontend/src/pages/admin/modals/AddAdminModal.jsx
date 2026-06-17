import React, { useState } from 'react';
import api from '../../../services/api';
import { User, Mail, Phone, Lock, Hash, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    NAME_REGEX,
    PHONE_REGEX,
    USERNAME_REGEX,
    PASSWORD_REGEX,
    PASSWORD_MESSAGE,
    PHONE_MESSAGE,
    sanitizeName,
    sanitizePhone,
    sanitizeUsername,
} from '../../../utils/validation';

const AddAdminModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let next = value;
        if (name === 'firstName' || name === 'lastName') next = sanitizeName(value);
        else if (name === 'phone') next = sanitizePhone(value);
        else if (name === 'username') next = sanitizeUsername(value);
        setFormData((prev) => ({ ...prev, [name]: next }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!NAME_REGEX.test(formData.firstName.trim())) e.firstName = 'First name can only contain letters';
        if (!NAME_REGEX.test(formData.lastName.trim())) e.lastName = 'Last name can only contain letters';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) e.email = 'Enter a valid email address';
        if (formData.phone && !PHONE_REGEX.test(formData.phone.trim())) e.phone = PHONE_MESSAGE;
        if (!USERNAME_REGEX.test(formData.username.trim())) e.username = 'Username must be 3–50 letters, numbers, dot, dash or underscore';
        if (!PASSWORD_REGEX.test(formData.password)) e.password = PASSWORD_MESSAGE;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.error('Please fix the highlighted fields');
            return;
        }
        setLoading(true);

        try {
            await api.post('/admin/admins', formData);
            toast.success('Admin created successfully');
            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                username: '',
                password: ''
            });
        } catch (error) {
            console.error('Failed to create admin:', error);
            toast.error(error?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-xl w-full max-w-2xl shadow-lg animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Add New Admin</h2>
                        <p className="text-xs text-slate-500 mt-1">Create a new administrator account</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                    <User size={16} className="text-primary-600" /> First Name
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    placeholder="Enter first name"
                                />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                    <User size={16} className="text-primary-600" /> Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    placeholder="Enter last name"
                                />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                    <Mail size={16} className="text-primary-600" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    placeholder="Enter email address"
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                    <Phone size={16} className="text-primary-600" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    maxLength={14}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    placeholder="(000) 000 0000"
                                />
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                    <Hash size={16} className="text-purple-600" /> Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    placeholder="Enter username"
                                />
                                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                                    <Lock size={16} className="text-purple-600" /> Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    placeholder="Enter password"
                                />
                                {errors.password
                                    ? <p className="text-xs text-red-500">{errors.password}</p>
                                    : <p className="text-xs text-slate-400">Min 8 chars with uppercase, lowercase, number &amp; special character.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all flex items-center gap-2 shadow-sm"
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
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </div>
                            ) : (
                                <>
                                    <User size={16} />
                                    Register New Admin
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAdminModal;
