import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  setPage,
  setPageSize,
  clearSelected,
  setSelected,
  setModalStatus,
} from '../../../store/slices/abstracts/abstracts.slice'
import { fetchAbstracts, updateStatusThunk } from '../../../store/slices/abstracts/abstracts.thunks'
import {
  selectAppliedFilters,
  selectSelectedAbstract,
  selectModalStatus,
} from '../../../store/slices/abstracts/abstracts.selectors'
import AbstractHeader from '../components/AbstractHeader'
import AbstractTable from '../components/AbstractTable'
import AbstractPagination from '../components/AbstractPagination'
import AbstractDetailsModal from '../components/AbstractDetailsModal'
import { STATUS_TO_ID } from '../status.constants'
import type { AbstractStatus } from '../types'

export default function AbstractsPage() {
  const dispatch = useAppDispatch()

  const { items, rawItems, loading, page, pageSize, total, selected } =
    useAppSelector((s) => s.abstracts)

  const appliedFilters = useAppSelector(selectAppliedFilters)
  const viewItem = useAppSelector(selectSelectedAbstract)
  const modalStatus = useAppSelector(
    selectModalStatus
  ) as AbstractStatus | null

  useEffect(() => {
    dispatch(fetchAbstracts({ filters: appliedFilters, page, limit: pageSize }))
  }, [page, pageSize, appliedFilters, dispatch])

  async function handleUpdateStatus() {
    if (!viewItem || !modalStatus) return

    const currentStatus =
      viewItem.status?.actionType ?? viewItem.status

    if (modalStatus === currentStatus) return

    const result = await dispatch(
      updateStatusThunk({
        id: String(viewItem.id ?? viewItem._id),
        statusId: STATUS_TO_ID[modalStatus],
      })
    )

    if (updateStatusThunk.fulfilled.match(result)) {
      toast.success(`Status updated to ${modalStatus}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <AbstractHeader />

      <AbstractTable
        rows={items}
        rawRows={rawItems}
        loading={loading}
        error={null}
        errKind="none"
        onRetry={() =>
          dispatch(fetchAbstracts({ page, limit: pageSize, filters: appliedFilters }))
        }
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

      {selected && modalStatus && (
        <AbstractDetailsModal
          item={selected}
          record={selected}
          modalStatus={modalStatus}
          onClose={() => dispatch(clearSelected())}
          onStatusChange={(s) => dispatch(setModalStatus(s))}
          onUpdate={handleUpdateStatus}
        />
      )}
    </div>
  )
}
