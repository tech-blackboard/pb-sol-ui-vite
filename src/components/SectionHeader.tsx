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
    onlyDeleted?: boolean
    onToggleDeleted?: () => void
    onExportClick?: () => void
    exportButtonText?: string
    isExporting?: boolean
    selectedCount?: number
    onDeleteSelected?: () => void
    onGroupMailClick?: () => void
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
    onlyDeleted = false,
    onToggleDeleted,
    onExportClick,
    exportButtonText = 'Export',
    isExporting = false,
    selectedCount = 0,
    onDeleteSelected,
    onGroupMailClick,
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
                    {/* Delete Selected Action */}
                    {selectedCount > 0 && onDeleteSelected && (
                        <button
                            onClick={onDeleteSelected}
                            className="
                  inline-flex flex-1 sm:flex-none
                  items-center justify-center gap-2
                  rounded-md border border-red-600
                  bg-red-600 text-white
                  px-2 py-1 text-sm font-medium
                  hover:bg-red-700 transition-colors
                "
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>

                            <span className="hidden sm:inline">Delete Selected ({selectedCount})</span>
                            <span className="sm:hidden">Delete ({selectedCount})</span>
                        </button>
                    )}

                    {/* Group Mail Action */}
                    {selectedCount > 0 && onGroupMailClick && (
                        <button
                            onClick={onGroupMailClick}
                            className="
                  inline-flex flex-1 sm:flex-none
                  items-center justify-center gap-2
                  rounded-md border border-blue-600
                  bg-blue-600 text-white
                  px-3 py-1 text-sm font-medium
                  hover:bg-blue-700 transition-colors
                            "
                            title="Group Mail"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>

                            <span className="hidden sm:inline">Group Mail</span>
                            <span className="sm:hidden">Mail</span>
                        </button>
                    )}

                    {/* Add Action (Optional) */}
                    {onAddClick && selectedCount === 0 && (
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

                    {/* View Trash Action */}
                    {onToggleDeleted && selectedCount === 0 && (
                        <button
                            onClick={onToggleDeleted}
                            className={`
                                inline-flex flex-1 sm:flex-none
                                items-center justify-center gap-2
                                rounded-md border px-3 py-1
                                text-sm font-medium transition-colors
                                ${onlyDeleted
                                    ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }
                            `}
                            title={onlyDeleted ? "Viewing Deleted Records" : "View Deleted Records"}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="h-4 w-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                            </svg>
                            <span className="hidden sm:inline">{onlyDeleted ? 'Viewing Trash' : 'View Trash'}</span>
                            <span className="sm:hidden">Trash</span>
                        </button>
                    )}

                    {/* Export Action */}
                    {onExportClick && (
                        <button
                            onClick={onExportClick}
                            disabled={isExporting}
                            className={`
                                inline-flex flex-1 sm:flex-none
                                items-center justify-center gap-2
                                rounded-md border border-green-600
                                bg-green-50 text-green-700
                                px-3 py-1 text-sm font-medium
                                transition-colors
                                dark:bg-green-900/20 dark:text-green-400 dark:border-green-700
                                ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100 dark:hover:bg-green-900/40'}
                            `}
                            title="Export to Excel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : exportButtonText}</span>
                            <span className="sm:hidden">{isExporting ? '...' : 'Export'}</span>
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
