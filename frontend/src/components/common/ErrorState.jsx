import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Standard error placeholder with an optional retry action.
 *
 * Usage:
 *   if (error) return <ErrorState message={error} onRetry={fetchData} />;
 *
 * Props:
 *   - title:    headline (default 'Something went wrong')
 *   - message:  optional detail line
 *   - onRetry:  optional callback; renders a "Try again" button when provided
 *   - compact:  smaller vertical padding (default false)
 */
const ErrorState = ({ title = 'Something went wrong', message, onRetry, compact = false, className = '' }) => (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16'} px-4 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle size={22} className="text-red-500" />
        </div>
        <p className="font-semibold text-slate-700 text-sm">{title}</p>
        {message && <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>}
        {onRetry && (
            <button
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
                <RefreshCw size={14} /> Try again
            </button>
        )}
    </div>
);

export default ErrorState;
