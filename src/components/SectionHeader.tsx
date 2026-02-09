import { } from 'react'
import Alert from './Alert'

interface SectionHeaderProps {
    title: string
    onAddClick?: () => void
    onFilterClick: () => void
    addButtonText?: string
    addMobileButtonText?: string
    filterButtonText?: string
    error?: string | null
    onClearError?: () => void
}

export default function SectionHeader({
    title,
    onAddClick,
    onFilterClick,
    addButtonText = 'Add',
    addMobileButtonText = 'Add',
    filterButtonText = 'Filters',
    error,
    onClearError,
}: SectionHeaderProps) {
    return (
        <div className="flex flex-col gap-2 my-1.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Title */}
                <h2 className="text-base sm:text-xl font-semibold text-gray-700 dark:text-gray-100 md:ml-2 ">
                    {title}
                </h2>

                {/* Actions */}
                <div className="flex w-full sm:w-auto items-center gap-2">
                    {/* Add Action (Optional) */}
                    {onAddClick && (
                        <button
                            onClick={onAddClick}
                            className="
                  inline-flex flex-1 sm:flex-none
                  items-center justify-center gap-2
                  rounded-md border border-purple-600
                  bg-purple-600 text-white
                  px-2 py-1 text-sm font-medium
                  hover:bg-purple-700 transition-colors
                "
                        >
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>

                            <span className="hidden sm:inline">{addButtonText}</span>
                            <span className="sm:hidden">{addMobileButtonText}</span>
                        </button>
                    )}

                    {/* Filters Action */}
                    <button
                        onClick={onFilterClick}
                        className="
                inline-flex flex-1 sm:flex-none
                items-center justify-center gap-2
                rounded-md border border-gray-300
                bg-white px-3 py-1
                text-sm font-medium text-gray-700
                hover:bg-gray-50 transition-colors
              "
                        aria-label="Open filters"
                        title="Filters"
                    >
                        {/* Funnel icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 6h18M6 12h12M10 18h4"
                            />
                        </svg>

                        <span className="hidden sm:inline">{filterButtonText}</span>
                    </button>
                </div>
            </div>

            {error && onClearError && (
                <div className="md:mx-2">
                    <Alert message={error} onClose={onClearError} />
                </div>
            )}
        </div>
    )
}
