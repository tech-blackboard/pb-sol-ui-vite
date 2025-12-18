import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setPage, setPageSize, clearSelected, setSelected } from '../../../store/slices/abstracts/abstracts.slice'
import { fetchAbstracts } from '../../../store/slices/abstracts/abstracts.thunks'
import AbstractHeader from '../components/AbstractHeader'
import AbstractTable from '../components/AbstractTable'
import AbstractPagination from '../components/AbstractPagination'
import AbstractDetailsModal from '../components/AbstractDetailsModal'
import { useEffect } from 'react'
import { selectAppliedFilters } from '../../../store/slices/abstracts/abstracts.selectors'

export default function AbstractsPage() {
  const dispatch = useAppDispatch()
  const { items, rawItems, loading, page, pageSize, total, selected } =
useAppSelector((s) => s.abstracts)
  const appliedFilters = useAppSelector(selectAppliedFilters)
  useEffect(() => {
    dispatch(fetchAbstracts({ filters: appliedFilters, page, limit: pageSize }))
  }, [page, pageSize, appliedFilters])


  return (
    <div className="h-full flex flex-col">
      <AbstractHeader />


      <AbstractTable
  rows={items}
  rawRows={rawItems}
  loading={loading}
  error={null}
  errKind={'none'}
  onRetry={() => dispatch(fetchAbstracts({ page, limit: pageSize, filters: appliedFilters }))}
  onView={(item) => dispatch(setSelected(item))}
/>


<AbstractPagination
  page={page}
  pageSize={pageSize}
  total={total}
  totalPages={Math.ceil(total / pageSize)}
  rowsOnPage={items.length}
  onPageChange={(page) => dispatch(setPage(page))}
  onPageSizeChange={(pageSize) => dispatch(setPageSize(pageSize))}
/>


      {selected && (
        <AbstractDetailsModal
          item={selected}
          record={selected}
          modalStatus={selected.status}
          updating={false}
          updateError={null}
          onClose={() => dispatch(clearSelected())}
          onStatusChange={() => {}}
          onUpdate={() => {}}
        />
      )}
    </div>
  )
}
