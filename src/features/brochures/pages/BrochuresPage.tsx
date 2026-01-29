import { useState } from 'react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchBrochures, setPage, setPageSize, setSelected, clearSelected } from '../../../store/slices/brochures/brochures.slice'
import AbstractPagination from '../../abstracts/components/AbstractPagination'
import BrochureTable from '../components/BrochureTable'
import BrochureDetailsModal from '../components/BrochureDetailsModal'
import SectionHeader from '../../../components/SectionHeader'
import BrochureFiltersDrawer from '../components/BrochureFiltersDrawer'

export default function BrochuresPage() {
    const dispatch = useAppDispatch()
    const { items, loading, page, pageSize, total, error, appliedFilters, selected } = useAppSelector((s) => s.brochures)
    const [filtersOpen, setFiltersOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchBrochures({ filters: appliedFilters, page, limit: pageSize }))
    }, [page, pageSize, appliedFilters, dispatch])

    return (
        <div className="h-full flex flex-col">
            <SectionHeader
                title="All Conferences — Brochure Requests"
                onFilterClick={() => setFiltersOpen(true)}
            />

            {filtersOpen && (
                <BrochureFiltersDrawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                />
            )}

            <BrochureTable
                rows={items}
                loading={loading}
                error={error}
                onRetry={() => dispatch(fetchBrochures({ filters: appliedFilters, page, limit: pageSize }))}
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
                />
            )}
        </div>
    )
}
