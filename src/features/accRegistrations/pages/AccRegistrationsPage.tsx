import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchAccRegistrations, deleteAccRegistrationThunk, setPage, setPageSize, setSelected, clearSelected, clearError, updateDraftFilter, applyFilters } from '../../../store/slices/accRegistrations/accRegistrations.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import AccRegistrationTable from '../components/AccRegistrationTable'
import AccRegistrationDetailsModal from '../components/AccRegistrationDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import AccRegistrationFiltersDrawer from '../components/AccRegistrationFiltersDrawer'
import AccommodationForm from '../components/AccommodationForm'
import type { AccRegistrationItem } from '../../../services/accRegistrations'
import { searchAccRegistrations } from '../../../services/accRegistrations'
import { formatDate } from '../../../utils/utils'

export default function AccRegistrationsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.accRegistrations)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<AccRegistrationItem | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        dispatch(fetchAccRegistrations({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const toastId = toast.loading('Exporting data to Excel...')
            
            const result = await searchAccRegistrations({ ...appliedFilters, limit: 10000, page: 1 })
            
            if (!result.items || result.items.length === 0) {
                toast.error('No records found to export', { id: toastId })
                setIsExporting(false)
                return
            }

            const formattedData = result.items.map(item => ({
                'Website Name': item.website?.name || '',
                'Name': item.name || '',
                'Email': item.email || '',
                'Alternate Email': item.aemail || '',
                'Phone': item.phone || '',
                'WhatsApp': item.wphone || '',
                'Institution': item.institution || '',
                'Country': item.country || '',
                'Presentation': item.presentation || '',
                'Participants': item.participants || '',
                'Regtype': item.regtype || '',
                'Accomm': item.accomm || '',
                'Checkin': item.checkin || '',
                'Checkout': item.checkout || '',
                'Nights': item.nights || '',
                'Accm': item.accm || '',
                'Acmpng': item.acmpng || '',
                'Acc_pr': item.acc_pr || '',
                'Tot_price': item.tot_price || '',
                'Transaction_id': item.transaction_id || '',
                'Status_flag': item.status_flag || 0,
                'Alt_text': item.alt_text || '',
                'Submitted On': item.now ? formatDate(item.now) : ''
            }))

            const worksheet = XLSX.utils.json_to_sheet(formattedData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Accommodation Registrations')

            XLSX.writeFile(workbook, 'AccRegistrations_Export.xlsx')
            
            toast.success('Export successful!', { id: toastId })
        } catch (error) {
            console.error('Export failed:', error)
            toast.error('Failed to export data')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Accommodation Registrations"
                onAddClick={() => setIsAddModalOpen(true)}
                addButtonText="Add Accommodation"
                onFilterClick={() => setFiltersOpen(true)}
                error={error}
                onClearError={() => dispatch(clearError())}
                onlyDeleted={appliedFilters.onlyDeleted === 'true'}
                onToggleDeleted={() => {
                    const isTrash = appliedFilters.onlyDeleted === 'true';
                    dispatch(updateDraftFilter({ key: 'onlyDeleted', value: isTrash ? 'false' : 'true' }));
                    dispatch(applyFilters());
                }}
                onExportClick={handleExport}
                isExporting={isExporting}
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
                    onEdit={selected.deletedAt ? undefined : (item) => {
                        setEditItem(item)
                        dispatch(clearSelected())
                    }}
                    onDelete={selected.deletedAt ? undefined : async (item) => {
                        try {
                            await dispatch(deleteAccRegistrationThunk(item.id)).unwrap()
                            toast.success('Accommodation Registration deleted successfully')
                            dispatch(clearSelected())
                        } catch (err: unknown) {
                            const errorMessage = typeof err === 'string' ? err : 'Failed to delete accommodation registration'
                            toast.error(errorMessage)
                        }
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
