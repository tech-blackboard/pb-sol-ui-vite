import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchSponsorships, setPage, setPageSize, setSelected, clearSelected } from '../../../store/slices/sponsorships/sponsorships.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import SponsorshipTable from '../components/SponsorshipTable'
import SponsorshipDetailsModal from '../components/SponsorshipDetailsModal'

export default function SponsorshipsPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.sponsorships)

    useEffect(() => {
        dispatch(fetchSponsorships({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between my-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-100">
                    All Conferences — Sponsorship Inquiries
                </h2>
            </div>

            <SponsorshipTable
                rows={items}
                loading={loading}
                error={error}
                onRetry={() => dispatch(fetchSponsorships({ filters: appliedFilters, page, limit: pageSize }))}
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
                <SponsorshipDetailsModal
                    item={selected}
                    onClose={() => dispatch(clearSelected())}
                />
            )}
        </div>
    )
}
