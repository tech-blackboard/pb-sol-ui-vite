import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchSponsorships, deleteSponsorshipThunk, setPage, setPageSize, setSelected, clearSelected, clearError } from '../../../store/slices/sponsorships/sponsorships.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import SponsorshipTable from '../components/SponsorshipTable'
import SponsorshipDetailsModal from '../components/SponsorshipDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import SponsorshipFiltersDrawer from '../components/SponsorshipFiltersDrawer'
import SponsorshipForm from '../components/SponsorshipForm'

export default function SponsorshipsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.sponsorships)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [addOpen, setAddOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchSponsorships({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Sponsorship Inquiries"
                onFilterClick={() => setFiltersOpen(true)}
                onAddClick={() => setAddOpen(true)}
                addButtonText="Add Sponsorship"
                error={error}
                onClearError={() => dispatch(clearError())}
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
                    onDelete={(item) => {
                        dispatch(deleteSponsorshipThunk(item.id!))
                        dispatch(clearSelected())
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
