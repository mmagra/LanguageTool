import { ChevronDown } from 'lucide-react';

const StyledSelect = ({ wrapperClassName = '', className = '', ...props }) => (
    <div className={`relative ${wrapperClassName}`}>
        <select
            className={`pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 focus:bg-white hover:border-slate-300 transition-all duration-200 cursor-pointer appearance-none ${className}`}
            {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <ChevronDown size={14} />
        </div>
    </div>
);

export default StyledSelect;
