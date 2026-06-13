import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { selectAuth } from '../../../store/slices/authSlice'
import { fetchSponsorships, deleteSponsorshipThunk, setPage, setPageSize, setSelected, clearSelected, clearError, updateDraftFilter, applyFilters } from '../../../store/slices/sponsorships/sponsorships.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import SponsorshipTable from '../components/SponsorshipTable'
import SponsorshipDetailsModal from '../components/SponsorshipDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import SponsorshipFiltersDrawer from '../components/SponsorshipFiltersDrawer'
import SponsorshipForm from '../components/SponsorshipForm'
import { searchSponsorships } from '../../../services/sponsorships'
import { formatDate } from '../../../utils/utils'

export default function SponsorshipsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.sponsorships)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [addOpen, setAddOpen] = useState(false)
    const { user } = useAppSelector(selectAuth)
    const canExport = user?.permissions?.includes('export:excel')
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        dispatch(fetchSponsorships({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const toastId = toast.loading('Exporting data to Excel...')
            
            const result = await searchSponsorships({ ...appliedFilters, limit: 10000, page: 1 })
            
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
                'Organization': item.organization || '',
                'Country': item.country || '',
                'Message': item.message || '',
                'Submitted On': item.now ? formatDate(item.now) : ''
            }))

            const worksheet = XLSX.utils.json_to_sheet(formattedData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sponsorships')

            XLSX.writeFile(workbook, 'Sponsorships_Export.xlsx')
            
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
                title="All Conferences — Sponsorship Inquiries"
                onFilterClick={() => setFiltersOpen(true)}
                onAddClick={() => setAddOpen(true)}
                addButtonText="Add Sponsorship"
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

            {filtersOpen && (
                <SponsorshipFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            <SponsorshipTable
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
                <SponsorshipDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                    onDelete={selected.deletedAt ? undefined : async (item) => {
                        try {
                            await dispatch(deleteSponsorshipThunk(item.id!)).unwrap()
                            toast.success('Sponsorship deleted successfully')
                            dispatch(clearSelected())
                        } catch (err: unknown) {
                            const errorMessage = typeof err === 'string' ? err : 'Failed to delete sponsorship'
                            toast.error(errorMessage)
                        }
                    }}
                />
            )}

            {addOpen && (
                <SponsorshipForm
                    onClose={() => setAddOpen(false)}
                    onSuccess={() => dispatch(fetchSponsorships({ filters: appliedFilters, page, limit: pageSize }))}
                />
            )}
        </div>
    )
}
