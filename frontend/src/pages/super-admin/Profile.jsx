import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    User, Mail, Phone, Shield, Edit2, Save, X,
    AlertCircle, Camera, Check, Trash2
} from 'lucide-react';

const SuperAdminProfile = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.firstName || '',
                last_name: user.lastName || '',
                phone: user.phone || '',
                email: user.email || ''
            });
            if (user.profile_image) {
                setProfileImage(user.profile_image);
            }
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file);
                setProfileImage(resizedImage);
            } catch (error) {
                console.error("Error resizing image:", error);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileImage(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    profile_image: profileImage || ''
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                if (refreshUser) await refreshUser();
                setIsEditing(false);
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            setFormData({
                first_name: user.firstName || '',
                last_name: user.lastName || '',
                phone: user.phone || '',
                email: user.email || ''
            });
        }
        setMessage(null);
    };

    return (
        <div className="h-full overflow-y-auto animate-fade-in font-inter p-6">
            <div className="max-w-5xl mx-auto">
                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        {message.type === 'success' ? <Check className="text-green-600 shrink-0" size={20} /> : <AlertCircle className="text-red-600 shrink-0" size={20} />}
                        <p className={`font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#f0f4fe] p-6 md:p-8 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                            <div className="relative group shrink-0">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] p-[3px] shadow-lg">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                        {profileImage && (profileImage.startsWith('data:') || profileImage.startsWith('http')) ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-[#f0f4fe] opacity-50"></div>
                                                <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#2ea3f2] to-[#f2a93b] relative z-10">
                                                    {(formData.first_name?.[0] || 'S')}{(formData.last_name?.[0] || 'A')}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {isEditing && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border-2 border-indigo-600"
                                        >
                                            <Camera size={14} className="text-indigo-600" />
                                        </button>
                                        {profileImage && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute bottom-0 left-0 p-1.5 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors border-2 border-red-500"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        )}
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 break-words">
                                    {formData.first_name || 'Super'} {formData.last_name || 'Admin'}
                                </h1>
                                <p className="text-gray-600 font-medium mb-2 break-all">{formData.email}</p>
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <span className="text-xs font-semibold tracking-wide text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                        ID: {user?.username || 'Not set'}
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                                        <Shield size={14} className="text-[#f2a93b]" />
                                        <span className="text-gray-900 font-bold text-xs">Super Administrator</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        <Edit2 size={16} />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-bold rounded-xl text-sm transition-all hover:bg-gray-50 border border-gray-200 shadow-sm"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className={`flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <Save size={16} />
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <User size={16} className="text-indigo-600" /> First Name
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <User size={16} className="text-indigo-600" /> Last Name
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Mail size={16} className="text-indigo-600" /> Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Phone size={16} className="text-indigo-600" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-xl transition-all outline-none ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-primary-500' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                                    placeholder={!isEditing && !formData.phone ? "Not provided" : ""}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminProfile;
