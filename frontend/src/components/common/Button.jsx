import React from 'react';

/**
 * Canonical button for the app (Minimal Enterprise design system).
 *
 * Props:
 *   - variant: 'primary' | 'secondary' | 'ghost' | 'danger'  (default 'primary')
 *   - size:    'sm' | 'md'                                    (default 'md')
 *   - as:      element/component to render as (e.g. Link)      (default 'button')
 *   - icon:    optional leading lucide icon component
 *   - loading: shows disabled + spinner-ish label
 *   - ...rest: native button props / router Link props
 *
 * Usage:
 *   <Button onClick={save}>Save</Button>
 *   <Button variant="secondary" icon={Plus}>Add</Button>
 *   <Button variant="danger" onClick={remove}>Delete</Button>
 */
const VARIANTS = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500/30',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-primary-500/20 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-primary-500/20 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-red-500/30',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
};

const Button = ({
    variant = 'primary',
    size = 'md',
    as: Component = 'button',
    icon: Icon,
    loading = false,
    disabled = false,
    className = '',
    children,
    ...rest
}) => (
    <Component
        disabled={Component === 'button' ? (disabled || loading) : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
        {...rest}
    >
        {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
        {children}
    </Component>
);

export default Button;
