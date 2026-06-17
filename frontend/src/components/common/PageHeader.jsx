import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Consistent page header used across all dashboard pages.
 *
 * Props:
 *   - title:       main page title (always text-2xl)
 *   - subtitle:    optional description line below title
 *   - actions:     optional node (buttons) rendered right-aligned
 *   - breadcrumbs: optional array of { label, href? } — last item is current page (no link)
 *
 * Usage:
 *   <PageHeader title="Schools" subtitle="Manage all registered schools" actions={<AddButton />} />
 *   <PageHeader
 *     title="Lincoln High School"
 *     breadcrumbs={[{ label: 'Schools', href: '/super-admin/schools' }, { label: 'Lincoln High School' }]}
 *   />
 */
const PageHeader = ({ title, subtitle, actions, breadcrumbs }) => (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
        <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mb-1.5 flex-wrap" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />}
                            {crumb.href ? (
                                <Link to={crumb.href} className="hover:text-primary-600 dark:hover:text-primary-300 transition-colors font-medium">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-slate-600 dark:text-slate-300 font-medium">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
            {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
);

export default PageHeader;
