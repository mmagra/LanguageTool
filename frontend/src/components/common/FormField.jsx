import React from 'react';

/**
 * Canonical labelled input (Minimal Enterprise).
 *
 * Props:
 *   - label, name, type, value, onChange, placeholder, error, required, disabled
 *   - icon: optional leading lucide icon
 *   - ...rest: forwarded to <input>
 *
 * For non-input controls, use <FormField.Label> + your control, or pass children.
 *
 * Usage:
 *   <FormField label="Email" name="email" type="email" value={v} onChange={fn} error={err} />
 */
const FormField = ({
    label,
    name,
    type = 'text',
    icon: Icon,
    error,
    required = false,
    disabled = false,
    className = '',
    children,
    ...rest
}) => (
    <div className={className}>
        {label && (
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
        )}
        <div className="relative">
            {Icon && (
                <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            )}
            {children || (
                <input
                    id={name}
                    name={name}
                    type={type}
                    disabled={disabled}
                    required={required}
                    className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border rounded-lg outline-none transition-colors duration-200 ${error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-800' : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700'} ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500' : 'bg-white dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'}`}
                    {...rest}
                />
            )}
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
);

export default FormField;
