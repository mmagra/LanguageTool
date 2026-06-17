import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const NavigationBlockModal = ({ isOpen, onCancel, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 m-4 animate-scale-in relative overflow-hidden">

                {/* Icon */}
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-orange-600" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 mb-3 text-center">
                    Active Session
                </h2>

                {/* Message */}
                <p className="text-slate-600 mb-8 text-center leading-relaxed">
                    {message || "You have an active live conversation. Are you sure you want to leave? This will end it."}
                </p>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onCancel}
                        className="w-full px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <X size={20} />
                        Stay
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-100 transition-all"
                    >
                        Leave Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavigationBlockModal;
