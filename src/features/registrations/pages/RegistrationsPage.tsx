import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setSelected, clearSelected, setPage, setPageSize, clearError } from '../../../store/slices/registrations/registrations.slice'
import { fetchRegistrations, deleteRegistrationThunk } from '../../../store/slices/registrations/registrations.thunks'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import RegistrationTable from '../components/RegistrationTable'
import RegistrationDetailsModal from '../components/RegistrationDetailsModal'
import RegistrationHeader from '../components/RegistrationHeader'
import RegistrationForm from '../components/RegistrationForm'
import type { RegistrationItem } from '../../../services/registrations'

export default function RegistrationsPage() {
    const dispatch = useAppDispatch()

    const { items, loading, page, pageSize, total, error, appliedFilters, selected } =
        useAppSelector((s) => s.registrations)

    const [editItem, setEditItem] = useState<RegistrationItem | null>(null)

    useEffect(() => {
        dispatch(fetchRegistrations({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <RegistrationHeader error={error} onClearError={() => dispatch(clearError())} />


            <RegistrationTable
                rows={items}
                loading={loading}
                onView={(row) => {
                    dispatch(setSelected(row))
                }}
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
                    onEdit={(item) => {
                        setEditItem(item)
                        dispatch(clearSelected())
                    }}
                    onDelete={(item) => {
                        dispatch(deleteRegistrationThunk(item.id))
                        dispatch(clearSelected())
                    }}
                />
            )}

            {editItem && (
                <RegistrationForm
                    editData={editItem}
                    onClose={() => setEditItem(null)}
                    onSuccess={() => {
                        setEditItem(null)
                        dispatch(fetchRegistrations({ filters: appliedFilters, page, limit: pageSize }))
                    }}
                />
            )}
        </div>
    )
}
