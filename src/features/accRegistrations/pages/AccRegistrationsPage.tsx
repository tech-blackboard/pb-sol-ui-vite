import { useState } from 'react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchAccRegistrations, setPage, setPageSize, setSelected, clearSelected } from '../../../store/slices/accRegistrations/accRegistrations.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import AccRegistrationTable from '../components/AccRegistrationTable'
import AccRegistrationDetailsModal from '../components/AccRegistrationDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import AccRegistrationFiltersDrawer from '../components/AccRegistrationFiltersDrawer'
import AccommodationForm from '../components/AccommodationForm'

export default function AccRegistrationsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.accRegistrations)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchAccRegistrations({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Accommodation Registrations"
                onAddClick={() => setIsAddModalOpen(true)}
                addButtonText="Add Accommodation"
                onFilterClick={() => setFiltersOpen(true)}
            />

            {filtersOpen && (
                <AccRegistrationFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            <AccRegistrationTable
                rows={items}
                loading={loading}
                error={error}
                onRetry={() => dispatch(fetchAccRegistrations({ filters: appliedFilters, page, limit: pageSize }))}
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
                <AccRegistrationDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                />
            )}

            {isAddModalOpen && (
                <AccommodationForm
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        dispatch(fetchAccRegistrations({ filters: appliedFilters, page, limit: pageSize }))
                    }}
                />
            )}
        </div>
    )
}
