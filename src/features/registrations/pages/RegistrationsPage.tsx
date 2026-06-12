import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { selectAuth } from '../../../store/slices/authSlice'
import { setSelected, clearSelected, setPage, setPageSize, clearError, updateDraftFilter, applyFilters } from '../../../store/slices/registrations/registrations.slice'
import { fetchRegistrations, deleteRegistrationThunk } from '../../../store/slices/registrations/registrations.thunks'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import RegistrationTable from '../components/RegistrationTable'
import RegistrationDetailsModal from '../components/RegistrationDetailsModal'
import RegistrationHeader from '../components/RegistrationHeader'
import RegistrationForm from '../components/RegistrationForm'
import type { RegistrationItem } from '../../../services/registrations'
import { searchRegistrations } from '../../../services/registrations'
import { formatDate } from '../../../utils/utils'

export default function RegistrationsPage() {
    const dispatch = useAppDispatch()

    const { items, loading, page, pageSize, total, error, appliedFilters, selected } =
        useAppSelector((s) => s.registrations)

    const [editItem, setEditItem] = useState<RegistrationItem | null>(null)
    const { user } = useAppSelector(selectAuth)
    const canExport = user?.permissions?.includes('export:excel')
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        dispatch(fetchRegistrations({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const toastId = toast.loading('Exporting data to Excel...')
            
            const result = await searchRegistrations({ ...appliedFilters, limit: 10000, page: 1 })
            
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
                'Accmvalue': item.accmvalue || '',
                'Acmpng': item.acmpng || '',
                'Acc_price': item.acc_price || '',
                'Tot_price': item.tot_price || '',
                'Transaction_id': item.transaction_id || '',
                'Status_flag': item.status_flag || 0,
                'Submitted On': item.now ? formatDate(item.now) : ''
            }))

            const worksheet = XLSX.utils.json_to_sheet(formattedData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations')

            XLSX.writeFile(workbook, 'Registrations_Export.xlsx')
            
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
            <RegistrationHeader
                error={error}
                onClearError={() => dispatch(clearError())}
                onlyDeleted={appliedFilters.onlyDeleted === 'true'}
                onToggleDeleted={() => {
                    const isTrash = appliedFilters.onlyDeleted === 'true';
                    dispatch(updateDraftFilter({ key: 'onlyDeleted', value: isTrash ? 'false' : 'true' }));
                    dispatch(applyFilters());
                }}
                onExportClick={canExport ? handleExport : undefined}
                isExporting={isExporting}
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
