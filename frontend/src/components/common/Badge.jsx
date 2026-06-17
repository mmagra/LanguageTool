import React from 'react';

/**
 * Canonical status badge (Minimal Enterprise). WCAG-AA contrast: {tone}-700 on {tone}-50.
 *
 * Props:
 *   - tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'  (default 'neutral')
 *   - icon: optional leading lucide icon component
 *
 * Usage:
 *   <Badge tone="success">Active</Badge>
 *   <Badge tone="danger" icon={AlertTriangle}>Past due</Badge>
 */
const TONES = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    primary: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-900',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
};

const Badge = ({ tone = 'neutral', icon: Icon, className = '', children }) => (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone] || TONES.neutral} ${className}`}>
        {Icon && <Icon size={12} />}
        {children}
    </span>
);

export default Badge;
