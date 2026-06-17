import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <MapPin size={32} className="text-primary-600" />
                </div>
                <h1 className="text-5xl font-bold text-slate-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-slate-700 mb-3">Page not found</h2>
                <p className="text-sm text-slate-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={16} /> Go back
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
                    >
                        <Home size={16} /> Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
