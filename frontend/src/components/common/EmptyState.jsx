import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Standard empty-state placeholder.
 *
 * Usage:
 *   <EmptyState icon={Shield} title="No admins found" description="Try a different search." />
 *   <EmptyState title="No students yet" action={<button ...>Add student</button>} />
 *
 * Props:
 *   - icon:        lucide icon component (default Inbox)
 *   - title:       bold headline
 *   - description: optional secondary line
 *   - action:      optional node (button/link) rendered below
 *   - compact:     smaller vertical padding (default false)
 */
const EmptyState = ({ icon: Icon = Inbox, title, description, action, compact = false, className = '' }) => (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16'} px-4 ${className}`}>
        <Icon size={compact ? 32 : 40} className="text-slate-200 dark:text-slate-700 mb-3" strokeWidth={1.5} />
        <p className="font-semibold text-slate-400 dark:text-slate-300 text-sm">{title}</p>
        {description && <p className="text-xs text-slate-300 dark:text-slate-500 mt-1 max-w-sm">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export default EmptyState;
