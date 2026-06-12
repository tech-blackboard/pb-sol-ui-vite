import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
    updateDraftFilter,
    applyFilters,
    resetFilters,
} from '../../../store/slices/brochures/brochures.slice'
import { listWebsites } from '../../../services/sourcedb'
import type { SourceWebsite } from '../../../services/sourcedb'

interface Props {
    open: boolean
    onClose: () => void
}

export default function BrochureFiltersDrawer({ open, onClose }: Props) {
    const dispatch = useAppDispatch()
    const filters = useAppSelector((s) => s.brochures.draftFilters)

    const [websites, setWebsites] = useState<SourceWebsite[]>([])
    const [loadingWebsites, setLoadingWebsites] = useState(false)

    // load websites only when drawer opens
    useEffect(() => {
        if (!open) return
        let mounted = true

            ; (async () => {
                try {
                    setLoadingWebsites(true)
                    const data = await listWebsites()
                    if (mounted) setWebsites(data)
                } finally {
                    if (mounted) setLoadingWebsites(false)
                }
            })()

        return () => {
            mounted = false
        }
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-base font-semibold">Brochure Filters</h3>
                    <button onClick={onClose} className="h-9 w-9 rounded hover:bg-gray-100">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    <Input
                        placeholder="Keyword search..."
                        value={filters.search ?? ''}
                        onChange={(v) =>
                            dispatch(updateDraftFilter({ key: 'search', value: v }))
                        }
                    />

                    <Input
                        placeholder="Name"
                        value={filters.name ?? ''}
                        onChange={(v) =>
                            dispatch(updateDraftFilter({ key: 'name', value: v }))
                        }
                    />

                    <Input
                        placeholder="Email"
                        value={filters.email ?? ''}
                        onChange={(v) =>
                            dispatch(updateDraftFilter({ key: 'email', value: v }))
                        }
                    />

                    <Input
                        placeholder="Phone"
                        value={filters.phone ?? ''}
                        onChange={(v) =>
                            dispatch(updateDraftFilter({ key: 'phone', value: v }))
                        }
                    />

                    <Input
                        placeholder="Country"
                        value={filters.country ?? ''}
                        onChange={(v) =>
                            dispatch(updateDraftFilter({ key: 'country', value: v }))
                        }
                    />

                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.fromDate ?? ''}
                            onChange={(e) => dispatch(updateDraftFilter({ key: 'fromDate', value: e.target.value }))}
                            title="From Date"
                        />
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.toDate ?? ''}
                            onChange={(e) => dispatch(updateDraftFilter({ key: 'toDate', value: e.target.value }))}
                            title="To Date"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loadingWebsites}
                            value={filters.website_id ?? ''}
                            onChange={(e) =>
                                dispatch(
                                    updateDraftFilter({
                                        key: 'website_id',
                                        value: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                )
                            }
                        >
                            <option value="">
                                {loadingWebsites ? 'Loading websites…' : 'Website'}
                            </option>
                            {websites.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.sortBy ?? 'now'}
                            onChange={(e) =>
                                dispatch(
                                    updateDraftFilter({
                                        key: 'sortBy',
                                        value: e.target.value,
                                    })
                                )
                            }
                        >
                            <option value="now">Sort by time</option>
                            <option value="name">Sort by name</option>
                        </select>

                        <select
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.sortOrder ?? 'DESC'}
                            onChange={(e) =>
                                dispatch(
                                    updateDraftFilter({
                                        key: 'sortOrder',
                                        value: e.target.value as 'ASC' | 'DESC',
                                    })
                                )
                            }
                        >
                            <option value="DESC">DESC</option>
                            <option value="ASC">ASC</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
                    <button
                        onClick={() => dispatch(resetFilters())}
                        className="
              inline-flex items-center justify-center
              rounded-md border border-gray-300
              bg-white px-4 py-2
              text-sm font-medium text-gray-700
              hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
                    >
                        Reset
                    </button>

                    <button
                        onClick={() => {
                            dispatch(applyFilters())
                            onClose()
                        }}
                        className="
              inline-flex items-center justify-center
              rounded-md
              bg-blue-600 px-4 py-2
              text-sm font-medium text-white
              hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
                    >
                        Apply
                    </button>
                </div>
            </aside>
        </div>
    )
}

function Input({
    value,
    onChange,
    placeholder,
}: {
    value: string
    onChange: (v: string) => void
    placeholder: string
}) {
    return (
        <input
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    )
}
