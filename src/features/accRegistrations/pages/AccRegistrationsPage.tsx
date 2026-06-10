import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchAccRegistrations, deleteAccRegistrationThunk, setPage, setPageSize, setSelected, clearSelected, clearError } from '../../../store/slices/accRegistrations/accRegistrations.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import AccRegistrationTable from '../components/AccRegistrationTable'
import AccRegistrationDetailsModal from '../components/AccRegistrationDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import AccRegistrationFiltersDrawer from '../components/AccRegistrationFiltersDrawer'
import AccommodationForm from '../components/AccommodationForm'
import type { AccRegistrationItem } from '../../../services/accRegistrations'

export default function AccRegistrationsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.accRegistrations)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<AccRegistrationItem | null>(null)

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
                error={error}
                onClearError={() => dispatch(clearError())}
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
                    onEdit={(item) => {
                        setEditItem(item)
                        dispatch(clearSelected())
                    }}
                    onDelete={(item) => {
                        dispatch(deleteAccRegistrationThunk(item.id))
                        dispatch(clearSelected())
                    }}
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

            {editItem && (
                <AccommodationForm
                    editData={editItem}
                    onClose={() => setEditItem(null)}
                    onSuccess={() => {
                        setEditItem(null)
                        dispatch(fetchAccRegistrations({ filters: appliedFilters, page, limit: pageSize }))
                    }}
                />
            )}
        </div>
    )
}
