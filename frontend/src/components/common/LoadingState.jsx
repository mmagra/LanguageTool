import React from 'react';

/**
 * Standard loading indicator used across the app.
 *
 * Usage:
 *   if (loading) return <LoadingState label="Loading admins..." />;
 *   <LoadingState size="sm" inline />   // inside a small panel
 *
 * Props:
 *   - label:   optional text under the spinner
 *   - size:    'sm' | 'md' | 'lg'  (default 'md')
 *   - inline:  render without the tall min-height wrapper (default false)
 *   - className: extra classes on the wrapper
 */
const SIZES = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
};

const LoadingState = ({ label, size = 'md', inline = false, className = '' }) => (
    <div className={`flex flex-col items-center justify-center gap-3 ${inline ? 'py-6' : 'h-64'} ${className}`}>
        <div className={`animate-spin rounded-full border-primary-600 border-t-transparent ${SIZES[size] || SIZES.md}`} />
        {label && <p className="text-sm text-slate-400 font-medium">{label}</p>}
    </div>
);

export default LoadingState;
