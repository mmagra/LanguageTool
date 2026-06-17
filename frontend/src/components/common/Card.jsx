import React from 'react';

/**
 * Canonical surface/card (Minimal Enterprise): white, thin slate border, subtle shadow.
 *
 * Props:
 *   - padded:  apply default p-6 padding (default true)
 *   - as:      element to render as (default 'div')
 *   - className: extra classes
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card padded={false}><table .../></Card>
 */
const Card = ({ as: Component = 'div', padded = true, className = '', children, ...rest }) => (
    <Component
        className={`bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:shadow-none ${padded ? 'p-6' : ''} ${className}`}
        {...rest}
    >
        {children}
    </Component>
);

export default Card;
