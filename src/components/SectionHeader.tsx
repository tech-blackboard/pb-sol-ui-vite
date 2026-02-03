import { } from 'react'

interface SectionHeaderProps {
    title: string
    onAddClick?: () => void
    onFilterClick: () => void
    addButtonText?: string
    addMobileButtonText?: string
    filterButtonText?: string
}

export default function SectionHeader({
    title,
    onAddClick,
    onFilterClick,
    addButtonText = 'Add',
    addMobileButtonText = 'Add',
    filterButtonText = 'Filters',
}: SectionHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between my-3">
            {/* Title */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100">
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
              px-3 py-2 text-sm font-medium
              hover:bg-purple-700 transition-colors
            "
                    >
                        <svg
                            className="h-4 w-4"
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
            bg-white px-3 py-2
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
                        className="h-5 w-5"
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
    )
}
