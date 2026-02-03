import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  setPage,
  setPageSize,
  clearSelected,
  setSelected,
  setModalStatus,
  closeInvoiceModal,
  closePaymentReceiptModal,
  closePaymentReminderModal,
} from '../../../store/slices/abstracts/abstracts.slice'
import { fetchAbstracts, sendInvoiceThunk, sendPaymentReceiptThunk, sendPaymentReminderThunk, updateStatusThunk } from '../../../store/slices/abstracts/abstracts.thunks'
import {
  selectAppliedFilters,
  selectModalStatus,
  selectActionLoading,
  selectSelectedAbstract,
  selectSelectedNormalized,
} from '../../../store/slices/abstracts/abstracts.selectors'
import AbstractHeader from '../components/AbstractHeader'
import AbstractTable from '../components/AbstractTable'
import AbstractPagination from '../components/AbstractPagination'
import AbstractDetailsModal from '../components/AbstractDetailsModal'
import { STATUS_TO_ID } from '../status.constants'
import type { AbstractStatus } from '../types'
import { InvoiceForm } from '../../../components/InvoiceForm'
import type { InvoiceData, PaymentReceiptData, PaymentReminderData } from '../../../services/abstracts'
import { PaymentReceiptForm } from '../../../components/PaymentReceipt'
import { PaymentReminderModal } from '../../../components/PaymentReminderModal'

export default function AbstractsPage() {
  const dispatch = useAppDispatch()

  const { items, rawItems, loading, page, pageSize, total, error } =
    useAppSelector((s) => s.abstracts)

  const appliedFilters = useAppSelector(selectAppliedFilters)
  const viewItem = useAppSelector(selectSelectedAbstract)
  const viewRecord = useAppSelector(selectSelectedNormalized) // normalized
  const modalStatus = useAppSelector(
    selectModalStatus
  ) as AbstractStatus | null

  const invoiceModal = useAppSelector((s) => s.abstracts.invoiceModal)
  const actionLoading = useAppSelector(selectActionLoading)
  const paymentReceiptModal = useAppSelector((s) => s.abstracts.paymentReceiptModal)
  const paymentReminderModal = useAppSelector((s) => s.abstracts.paymentReminderModal)

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
        id: String(viewItem.id),
        statusId: STATUS_TO_ID[modalStatus],
      })
    )

    if (updateStatusThunk.fulfilled.match(result)) {
      toast.success(`Status updated to ${modalStatus}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  const handleInvoiceSubmit = async (invoiceData: InvoiceData) => {
    if (!invoiceModal.abstractId) return

    // 1️⃣ Send invoice email
    const invoiceResult = await dispatch(
      sendInvoiceThunk({
        abstractId: invoiceModal.abstractId,
        invoiceData,
      })
    )

    if (!sendInvoiceThunk.fulfilled.match(invoiceResult)) {
      toast.error('Failed to send invoice')
      return
    }

    // 2️⃣ Update status → Sent Invoice
    const statusResult = await dispatch(
      updateStatusThunk({
        id: invoiceModal.abstractId,
        statusId: STATUS_TO_ID['Sent Invoice'],
      })
    )

    if (updateStatusThunk.fulfilled.match(statusResult)) {
      toast.success(` Invoice sent successfully to ${statusResult.payload.email}`)
      setTimeout(() => {
        toast.success('Status updated to Sent Invoice')
      }, 500)
    } else {
      toast.error('Invoice sent, but status update failed')
    }

    // 3️⃣ Close modal
    dispatch(closeInvoiceModal())
  }

  const handlePaymentReceiptSubmit = async (paymentReceiptData: PaymentReceiptData) => {
    if (!paymentReceiptModal.abstractId) return
    // 1️⃣ Send payment receipt email
    const paymentReceiptResult = await dispatch(
      sendPaymentReceiptThunk({
        abstractId: paymentReceiptModal.abstractId,
        receiptData: paymentReceiptData,
      })
    )
    if (!sendPaymentReceiptThunk.fulfilled.match(paymentReceiptResult)) {
      toast.error('Failed to send payment receipt')
      return
    }
    if (sendPaymentReceiptThunk.fulfilled.match(paymentReceiptResult)) {
      toast.success(`${paymentReceiptResult.payload.receiptResult.message}`)
      setTimeout(() => {
        toast.success('Status updated to Registered')
      }, 400)
    } else {
      toast.error('Failed to send payment receipt')
    }

    // 3️⃣ Close modal
    dispatch(closePaymentReceiptModal())
  }

  const handlePaymentReminderSubmit = async (paymentReminderData: PaymentReminderData) => {
    if (!paymentReminderModal.abstractId) return
    // 1️⃣ Send payment reminder email
    const paymentReminderResult = await dispatch(
      sendPaymentReminderThunk({
        abstractId: String(paymentReminderModal.abstractId),
        paymentReminderData: paymentReminderData,
      })
    )
    if (sendPaymentReminderThunk.fulfilled.match(paymentReminderResult)) {
      toast.success(`${paymentReminderResult.payload.message}`)

    } else {
      toast.error('Failed to send payment reminder')
    }
    // 3️⃣ Close modal
    dispatch(closePaymentReminderModal())
  }

  return (
    <div className="h-full flex flex-col ">
      <AbstractHeader />

      < AbstractTable
        rows={items}
        rawRows={rawItems}
        loading={loading}
        error={error}
        errKind={error ? 'generic' : 'none'}
        onRetry={() =>
          dispatch(fetchAbstracts({ page, limit: pageSize, filters: appliedFilters }))
        }
        onView={(item) => item && dispatch(setSelected(item))}
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

      {viewItem && viewRecord && modalStatus && (
        <AbstractDetailsModal
          item={viewItem}            // raw
          record={viewRecord}        // normalized
          modalStatus={modalStatus}
          onClose={() => dispatch(clearSelected())}
          onStatusChange={(s) => dispatch(setModalStatus(s))}
          onUpdate={() => handleUpdateStatus()}
        />
      )}

      {invoiceModal.open && (
        <InvoiceForm
          isOpen={invoiceModal.open}
          abstractName={invoiceModal.abstractName}
          isLoading={actionLoading.invoice}
          onClose={() => dispatch(closeInvoiceModal())}
          onSubmit={(invoiceData) => handleInvoiceSubmit(invoiceData)}
        />
      )}

      {paymentReceiptModal.open && (
        <PaymentReceiptForm
          isOpen={paymentReceiptModal.open}
          onClose={() => dispatch(closePaymentReceiptModal())}
          onSubmit={(paymentReceiptData) =>
            handlePaymentReceiptSubmit(paymentReceiptData)
          }
          abstractName={paymentReceiptModal.abstractName}
          isLoading={actionLoading.receipt}   // <-- use receipt flag
        />
      )}

      {paymentReminderModal.open && (
        <PaymentReminderModal
          abstractId={paymentReminderModal.abstractId ?? 0}
          isOpen={paymentReminderModal.open}
          onClose={() => dispatch(closePaymentReminderModal())}
          onSubmit={(paymentReminderData) => handlePaymentReminderSubmit(paymentReminderData)}
          isLoading={actionLoading.reminder}
        />
      )}
    </div>
  )
}
