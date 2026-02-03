import { useState } from 'react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setSelected, clearSelected, setPage, setPageSize } from '../../../store/slices/registrations/registrations.slice'
import { fetchRegistrations } from '../../../store/slices/registrations/registrations.thunks'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import RegistrationTable from '../components/RegistrationTable'
import RegistrationDetailsModal from '../components/RegistrationDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import RegistrationFiltersDrawer from '../components/RegistrationFiltersDrawer'

export default function RegistrationsPage() {
    const dispatch = useAppDispatch()

    const { items, loading, page, pageSize, total, error, appliedFilters, selected } =
        useAppSelector((s) => s.registrations)
    const [filtersOpen, setFiltersOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchRegistrations({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Registrations"
                onFilterClick={() => setFiltersOpen(true)}
            />

            {filtersOpen && (
                <RegistrationFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

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
