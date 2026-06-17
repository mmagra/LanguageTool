import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Canonical pagination (Minimal Enterprise) — numbered pages + prev/next + count.
 *
 * Props:
 *   - page:        current page (1-based)
 *   - totalPages:  total page count
 *   - onChange:    (nextPage) => void
 *   - totalItems, pageSize: optional, to render "Showing X–Y of Z"
 *
 * Usage:
 *   <Pagination page={page} totalPages={tp} onChange={setPage} totalItems={n} pageSize={25} />
 */
const Pagination = ({ page, totalPages, onChange, totalItems, pageSize }) => {
    if (!totalPages || totalPages <= 1) return null;

    const go = (p) => onChange(Math.min(Math.max(p, 1), totalPages));
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            {totalItems != null && pageSize != null ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-medium text-slate-700 dark:text-slate-200">{(page - 1) * pageSize + 1}</span>
                    –<span className="font-medium text-slate-700 dark:text-slate-200">{Math.min(page * pageSize, totalItems)}</span>
                    {' '}of <span className="font-medium text-slate-700 dark:text-slate-200">{totalItems}</span>
                </p>
            ) : <span />}
            <nav className="inline-flex items-center gap-1.5" aria-label="Pagination">
                <button
                    onClick={() => go(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft size={16} />
                </button>
                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => go(p)}
                        aria-current={page === p ? 'page' : undefined}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => go(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                    <span className="sr-only">Next</span>
                    <ChevronRight size={16} />
                </button>
            </nav>
        </div>
    );
};

export default Pagination;
