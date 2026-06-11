import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setSelected, clearSelected, setPage, setPageSize, clearError, updateDraftFilter, applyFilters } from '../../../store/slices/registrations/registrations.slice'
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
            <RegistrationHeader
                error={error}
                onClearError={() => dispatch(clearError())}
                onlyDeleted={appliedFilters.onlyDeleted === 'true'}
                onToggleDeleted={() => {
                    const isTrash = appliedFilters.onlyDeleted === 'true';
                    dispatch(updateDraftFilter({ key: 'onlyDeleted', value: isTrash ? 'false' : 'true' }));
                    dispatch(applyFilters());
                }}
            />


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
                    onEdit={selected.deletedAt ? undefined : (item) => {
                        setEditItem(item)
                        dispatch(clearSelected())
                    }}
                    onDelete={selected.deletedAt ? undefined : async (item) => {
                        try {
                            await dispatch(deleteRegistrationThunk(item.id)).unwrap()
                            toast.success('Registration deleted successfully')
                            dispatch(clearSelected())
                        } catch (err: unknown) {
                            const errorMessage = typeof err === 'string' ? err : 'Failed to delete registration'
                            toast.error(errorMessage)
                        }
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
