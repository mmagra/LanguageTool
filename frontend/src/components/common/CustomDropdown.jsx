import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const CustomDropdown = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    icon: Icon,
    className = "",
    dropdownPosition = "bottom",
    matchTextInput = false,
    showClear = true,
    searchable = true,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm(""); // Reset search when closing
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    // Handle selection
    const handleSelect = (option) => {
        let selectedValue;
        if (typeof option === 'object' && option !== null) {
            selectedValue = option.value !== undefined ? option.value : (option.name || option);
        } else {
            selectedValue = option;
        }
        onChange(selectedValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    // Find label for current value
    const selectedOption = options.find(opt => {
        const val = (typeof opt === 'object' && opt !== null && opt.value !== undefined) ? opt.value : (opt.name || opt);
        return val === value;
    });
    const displayValue = selectedOption ? (selectedOption.label || selectedOption.name || selectedOption) : placeholder;

    // Filter options based on search
    const filteredOptions = options.filter(option => {
        const label = (option.label || option.name || option).toString().toLowerCase();
        return label.includes(searchTerm.toLowerCase());
    });

    const isDisabled = props.disabled;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Main Button */}
            <button
                type="button"
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between border rounded-xl text-sm transition-all outline-none 
                    ${Icon ? 'pl-11' : 'pl-4'} pr-4 
                    ${props.buttonClassName ? props.buttonClassName : 'h-10'}
                    ${isDisabled
                        ? (props.disabledClassName || 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed placeholder-slate-400')
                        : matchTextInput
                            ? (props.surfaceClassName || 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500')
                            : (value
                                ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold shadow-sm hover:shadow-md'
                                : 'bg-white border-slate-200 text-slate-700 font-medium shadow-sm hover:border-primary-300 hover:shadow-md'
                            )
                    } 
                    ${isOpen && !matchTextInput ? 'ring-4 ring-primary-500/10 border-primary-500' : ''}
                    ${isOpen && matchTextInput ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
            >
                {/* Left Icon */}
                {Icon && (
                    <Icon
                        size={18}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${value ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'
                            }`}
                    />
                )}

                <span className="truncate">{displayValue}</span>

                {!isDisabled && (
                    <ChevronDown
                        size={16}
                        className={`ml-2 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary-600' : (value ? 'text-primary-600' : 'text-slate-400')
                            }`}
                    />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden animate-fade-in-up 
                    ${dropdownPosition === 'top' ? 'bottom-full mb-2 origin-bottom' : 'mt-2 origin-top'}`}>

                    {/* Search Bar */}
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 placeholder-slate-400"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div
                        className="max-h-80 overflow-y-auto p-1 space-y-0.5 custom-scrollbar"
                        style={{
                            scrollbarWidth: 'none',  /* Firefox */
                            msOverflowStyle: 'none',  /* IE and Edge */
                        }}
                    >
                        {/* Hide webkit scrollbar via style injection */}
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>

                        {/* Placeholder/Clear Option (Only show if no search or matches search) */}
                        {showClear && placeholder.toLowerCase().includes(searchTerm.toLowerCase()) && (
                            <button
                                type="button"
                                onClick={() => handleSelect({ value: "", label: placeholder })}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${value === ""
                                    ? 'bg-primary-50 text-primary-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span>{placeholder}</span>
                                {value === "" && <Check size={14} className="text-primary-600" />}
                            </button>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const optValue = (typeof option === 'object' && option !== null && option.value !== undefined)
                                    ? option.value
                                    : (option.name || option);
                                const optLabel = option.label || option.name || option;
                                const isSelected = value === optValue;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${isSelected
                                            ? 'bg-primary-50 text-primary-700 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <span className="truncate">{optLabel}</span>
                                        {isSelected && <Check size={14} className="text-primary-600" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-slate-500">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
