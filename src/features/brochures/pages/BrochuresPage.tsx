import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchBrochures, setPage, setPageSize, setSelected, clearSelected } from '../../../store/slices/brochures/brochures.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import BrochureTable from '../components/BrochureTable'
import BrochureDetailsModal from '../components/BrochureDetailsModal'

export default function BrochuresPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.brochures)

    useEffect(() => {
        dispatch(fetchBrochures({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between my-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100">
                    All Conferences — Brochure Requests
                </h2>
            </div>

            <BrochureTable
                rows={items}
                loading={loading}
                error={error}
                onRetry={() => dispatch(fetchBrochures({ filters: appliedFilters, page, limit: pageSize }))}
                onView={(item) => dispatch(setSelected(item))}
            />

            <AbstractPagination
                totalPages={Math.ceil(total / pageSize)}
                rowsOnPage={pageSize}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => dispatch(setPage(p))}
                onPageSizeChange={(s) => dispatch(setPageSize(s))}
            />

            {selected && (
                <BrochureDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                />
            )}
        </div>
    )
}
