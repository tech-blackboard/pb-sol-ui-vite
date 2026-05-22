import { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';

interface Props {
    currentLabels: string[];
    onToggleLabel: (label: string) => void;
}

export default function MessageLabelDropdown({ currentLabels, onToggleLabel }: Props) {
    const { labelDefinitions } = useAppSelector((state) => state.crm);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-xs p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                title="Add or manage labels"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.659A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transform origin-top-left transition-all">
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manage Labels</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                        {labelDefinitions.map((label) => {
                            const isSelected = currentLabels.some(l => l.toLowerCase() === label.name.toLowerCase());
                            return (
                                <button
                                    key={label.name}
                                    onClick={() => {
                                        onToggleLabel(label.name);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-md transition-colors ${isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/10'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></div>
                                        <span className={`font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {label.name}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600 dark:text-blue-400">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
