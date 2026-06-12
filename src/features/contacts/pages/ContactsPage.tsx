import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchContacts, deleteContactThunk, setPage, setPageSize, setSelected, clearSelected, clearError, updateDraftFilter, applyFilters } from '../../../store/slices/contacts/contacts.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import ContactTable from '../components/ContactTable'
import ContactDetailsModal from '../components/ContactDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import ContactFiltersDrawer from '../components/ContactFiltersDrawer'
import ContactForm from '../components/ContactForm'
import { searchContacts } from '../../../services/contacts'
import { formatDate } from '../../../utils/utils'

export default function ContactsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.contacts)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [contactFormOpen, setContactFormOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        dispatch(fetchContacts({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const toastId = toast.loading('Exporting data to Excel...')
            
            const result = await searchContacts({ ...appliedFilters, limit: 10000, page: 1 })
            
            if (!result.items || result.items.length === 0) {
                toast.error('No records found to export', { id: toastId })
                setIsExporting(false)
                return
            }

            const formattedData = result.items.map(item => ({
                'Website Name': item.website?.name || '',
                'Name': item.name || '',
                'Email': item.email || '',
                'Phone': item.phone || '',
                'Country': item.country || '',
                'Message': item.message || '',
                'Submitted On': item.now ? formatDate(item.now) : ''
            }))

            const worksheet = XLSX.utils.json_to_sheet(formattedData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')

            XLSX.writeFile(workbook, 'Contacts_Export.xlsx')
            
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
                title="All Conferences — Contact Requests"
                onFilterClick={() => setFiltersOpen(true)}
                onAddClick={() => setContactFormOpen(true)}
                addButtonText="Add Contact"
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
                <ContactFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            {contactFormOpen && (
                <ContactForm
                    onClose={() => setContactFormOpen(false)}
                    onSuccess={() => dispatch(fetchContacts({ filters: appliedFilters, page, limit: pageSize }))}
                />
            )}

            <ContactTable
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
                <ContactDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                    onDelete={selected.deletedAt ? undefined : async (item) => {
                        try {
                            await dispatch(deleteContactThunk(item.id)).unwrap()
                            toast.success('Contact deleted successfully')
                            dispatch(clearSelected())
                        } catch (err: unknown) {
                            const errorMessage = typeof err === 'string' ? err : 'Failed to delete contact'
                            toast.error(errorMessage)
                        }
                    }}
                />
            )}
        </div>
    )
}
