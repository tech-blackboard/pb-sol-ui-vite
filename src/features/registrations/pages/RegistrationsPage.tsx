import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setSelected, clearSelected, setPage, setPageSize } from '../../../store/slices/registrations/registrations.slice'
import { fetchRegistrations } from '../../../store/slices/registrations/registrations.thunks'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import RegistrationTable from '../components/RegistrationTable'
import RegistrationDetailsModal from '../components/RegistrationDetailsModal'

export default function RegistrationsPage() {
    const dispatch = useAppDispatch()

    const { items, loading, page, pageSize, total, error, appliedFilters, selected } =
        useAppSelector((s) => s.registrations)

    useEffect(() => {
        dispatch(fetchRegistrations({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between my-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100">
                    All Conferences — Registrations
                </h2>
            </div>

            <RegistrationTable
                rows={items}
                loading={loading}
                error={error}
                onRetry={() =>
                    dispatch(fetchRegistrations({ page, limit: pageSize, filters: appliedFilters }))
                }
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
                <RegistrationDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                />
            )}
        </div>
    )
}
