import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchBrochures, deleteBrochureThunk, setPage, setPageSize, setSelected, clearSelected, clearError, updateDraftFilter, applyFilters } from '../../../store/slices/brochures/brochures.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import BrochureTable from '../components/BrochureTable'
import BrochureDetailsModal from '../components/BrochureDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import BrochureFiltersDrawer from '../components/BrochureFiltersDrawer'
import BrochureForm from '../components/BrochureForm'
import { searchBrochures } from '../../../services/brochures'
import { formatDate } from '../../../utils/utils'

export default function BrochuresPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.brochures)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        dispatch(fetchBrochures({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const toastId = toast.loading('Exporting data to Excel...')
            
            const result = await searchBrochures({ ...appliedFilters, limit: 10000, page: 1 })
            
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
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Brochures')

            XLSX.writeFile(workbook, 'Brochures_Export.xlsx')
            
            toast.success('Export successful!', { id: toastId })
        } catch (error) {
            console.error('Export failed:', error)
            toast.error('Failed to export data')
        } finally {
            setIsExporting(false)
        }
    }

    const handleSuccess = () => {
        dispatch(fetchBrochures({ filters: appliedFilters, page, limit: pageSize }))
    }

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Brochure Requests"
                onFilterClick={() => setFiltersOpen(true)}
                onAddClick={() => setFormOpen(true)}
                addButtonText="Add Brochure"
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
                <BrochureFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            {formOpen && (
                <BrochureForm
                    onClose={() => setFormOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}

            <BrochureTable
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
                <BrochureDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                    onDelete={selected.deletedAt ? undefined : async (item) => {
                        try {
                            await dispatch(deleteBrochureThunk(item.id)).unwrap()
                            toast.success('Brochure deleted successfully')
                            dispatch(clearSelected())
                        } catch (err: unknown) {
                            const errorMessage = typeof err === 'string' ? err : 'Failed to delete brochure'
                            toast.error(errorMessage)
                        }
                    }}
                />
            )}
        </div>
    )
}
