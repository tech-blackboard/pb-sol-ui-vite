

import type { AbstractItem, AbstractSearchResult, InvoiceData, PaymentReceiptData, PaymentReminderData, SendPaymentReceiptResponse } from '../../../../services/abstracts'
import type { AbstractRecord, AbstractStatus } from '../../../../features/abstracts/types'

import type { AbstractFilters } from '../../../../store/slices/abstracts/abstracts.types'
import reducer, {
  setSelected,
  clearSelected,
  setPage,
  setPageSize,
  updateDraftFilter,
  applyFilters,
  resetFilters,
  openInvoiceModal,
  closeInvoiceModal,
  setModalStatus,
  openPaymentReceiptModal,
  closePaymentReceiptModal,
  openPaymentReminderModal,
  closePaymentReminderModal
} from '../../../../store/slices/abstracts/abstracts.slice'
import { fetchAbstracts, updateStatusThunk, sendInvoiceThunk, sendPaymentReminderThunk, sendPaymentReceiptThunk, sendConfirmationEmailThunk } from '../../../../store/slices/abstracts/abstracts.thunks'

describe('abstracts slice', () => {
  const initialState = reducer(undefined, { type: 'INIT' })

  /* -------------------- BASIC REDUCERS -------------------- */

  it('should return initial state', () => {
    expect(initialState.page).toBe(1)
    expect(initialState.items).toEqual([])
    expect(initialState.loading).toBe(false)
  })

  it('should set selected abstract and modal status', () => {
    const abstract = { id: '1', status: { id: 1, actionType: 'Approved' } } as unknown as AbstractItem

    const state = reducer(initialState, setSelected(abstract))

    expect(state.selected).toEqual(abstract)
    expect(state.modalStatus).toBe('Approved')
  })

  it('should clear selected abstract', () => {
    const state = reducer(
      { ...initialState, selected: { id: '1' } as unknown as AbstractItem, modalStatus: 'Under Review' },
      clearSelected()
    )

    expect(state.selected).toBeNull()
    expect(state.modalStatus).toBeNull()
  })

  /* -------------------- PAGINATION -------------------- */

  it('should set page', () => {
    const state = reducer(initialState, setPage(3))
    expect(state.page).toBe(3)
  })

  it('should set page size and reset page to 1', () => {
    const state = reducer(
      { ...initialState, page: 5 },
      setPageSize(20)
    )

    expect(state.pageSize).toBe(20)
    expect(state.page).toBe(1)
  })

  /* -------------------- FILTERS -------------------- */

  it('should update draft filter', () => {
    const state = reducer(
      initialState,
      updateDraftFilter({ key: 'search', value: 'AI' })
    )

    expect(state.draftFilters.search).toBe('AI')
  })

  it('should apply filters and reset page', () => {
    const state = reducer(
      {
        ...initialState,
        draftFilters: { search: 'ML', sortBy: 'now', sortOrder: 'DESC' },
        page: 3,
      },
      applyFilters()
    )

    expect(state.appliedFilters.search).toBe('ML')
    expect(state.page).toBe(1)
  })

  it('should reset filters', () => {
    const state = reducer(
      {
        ...initialState,
        draftFilters: { search: 'X', sortBy: 'now', sortOrder: 'DESC' },
        appliedFilters: { search: 'Y', sortBy: 'now', sortOrder: 'DESC' },
        page: 4,
      },
      resetFilters()
    )

    expect(state.draftFilters.search).toBe('')
    expect(state.appliedFilters.search).toBe('')
    expect(state.page).toBe(1)
  })

  /* -------------------- MODALS -------------------- */

  it('should open invoice modal', () => {
    const state = reducer(
      initialState,
      openInvoiceModal({ id: '123', name: 'Test Abstract' })
    )

    expect(state.invoiceModal.open).toBe(true)
    expect(state.invoiceModal.abstractId).toBe('123')
  })

  it('should close invoice modal', () => {
    const state = reducer(
      { ...initialState, invoiceModal: { open: true, abstractId: '1', abstractName: 'A' } },
      closeInvoiceModal()
    )

    expect(state.invoiceModal.open).toBe(false)
    expect(state.invoiceModal.abstractId).toBeNull()
  })

  /* -------------------- EXTRA REDUCERS -------------------- */

  it('should handle fetchAbstracts.pending', () => {
    const state = reducer(initialState, fetchAbstracts.pending('', {
      page: 1,
      limit: 10,
      filters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    }))

    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('should handle fetchAbstracts.fulfilled', () => {
    const payload = {
      items: [{ id: '1' }, { id: '2' }],
      total: 2,
    }

    const state = reducer(
      initialState,
      fetchAbstracts.fulfilled(payload as unknown as import('../../../../services/abstracts').AbstractSearchResult, '', {
        page: 1,
        limit: 10,
        filters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
      })
    )

    expect(state.loading).toBe(false)
    expect(state.rawItems.length).toBe(2)
    expect(state.items.length).toBe(2)
    expect(state.total).toBe(2)
  })

  it('should set selected abstract and modal status (status as string)', () => {
    const abstract = { id: '1', status: 'Pending' as AbstractStatus } as unknown as AbstractItem

    const state = reducer(initialState, setSelected(abstract))

    expect(state.selected).toEqual(abstract)
    expect(state.modalStatus).toBe('Pending')
  });

  it('should set modal status via setModalStatus', () => {
    const state = reducer(initialState, setModalStatus('Approved' as AbstractStatus))
    expect(state.modalStatus).toBe('Approved')
  });

  it('should handle fetchAbstracts.fulfilled with missing total', () => {
    const payload = { items: [{ id: '1' }] }
    const state = reducer(initialState, fetchAbstracts.fulfilled(payload as unknown as AbstractSearchResult, '', { page: 1, limit: 10, filters: { search: '', sortBy: 'now', sortOrder: 'DESC' } }))
    expect(state.total).toBe(1)
  });

  it('should handle updateStatusThunk.fulfilled when ID is not in rawItems', () => {
    const startState = { ...initialState, rawItems: [{ id: '2' }] as AbstractItem[] }
    const payload = { updatedAbstract: { id: '1', status: 'Approved' } as unknown as AbstractItem, whatsappSent: false }
    const state = reducer(startState, updateStatusThunk.fulfilled(payload, '', { id: '1', statusId: 1 }))
    expect(state.rawItems[0].id).toBe('2')
    expect(state.selected).toEqual(payload.updatedAbstract)
  });

  it('should handle sendPaymentReceiptThunk.fulfilled', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', name: 'Original' }] as AbstractItem[],
      items: [{ id: '1' }] as unknown as AbstractRecord[],
      actionLoading: { ...initialState.actionLoading, receipt: true },
      paymentReceiptModal: { open: true, abstractId: '1', abstractName: 'Test' }
    }
    const payload = { receiptResult: {} as SendPaymentReceiptResponse, updated: { updatedAbstract: { id: '1', name: 'Updated' } as AbstractItem, whatsappSent: false } }
    const state = reducer(startState, sendPaymentReceiptThunk.fulfilled(payload, '', { abstractId: '1', receiptData: {} as PaymentReceiptData }))

    expect(state.rawItems[0].name).toBe('Updated')
    expect(state.paymentReceiptModal.open).toBe(false)
    expect(state.modalStatus).toBe('Registered')
  });

  it('should handle sendConfirmationEmailThunk.fulfilled and update items', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', isEmailSent: false }] as AbstractItem[],
      items: [{ id: '1' }] as unknown as AbstractRecord[],
      selected: { id: '1', isEmailSent: false } as AbstractItem
    }
    const state = reducer(startState, sendConfirmationEmailThunk.fulfilled({ id: '1', message: 'Sent' }, '', '1'))

    expect(state.rawItems[0].isEmailSent).toBe(true)
    expect(state.selected?.isEmailSent).toBe(true)
  });

  it('should handle sendPaymentReminderThunk.rejected and close modal', () => {
    const startState = {
      ...initialState,
      paymentReminderModal: { open: true, abstractId: '1', abstractName: 'T' },
      actionLoading: { ...initialState.actionLoading, reminder: true }
    }
    const state = reducer(startState, sendPaymentReminderThunk.rejected(null, '', { abstractId: '1', paymentReminderData: {} as PaymentReminderData }))
    expect(state.actionLoading.reminder).toBe(false)
    expect(state.paymentReminderModal.open).toBe(false)
  });

  /* -------------------- OTHER MODALS -------------------- */
  it('should open/close payment receipt modal', () => {
    let state = reducer(initialState, openPaymentReceiptModal({ id: '1', name: 'N' }))
    expect(state.paymentReceiptModal.open).toBe(true)
    state = reducer(state, closePaymentReceiptModal())
    expect(state.paymentReceiptModal.open).toBe(false)
  });

  it('should open/close payment reminder modal', () => {
    let state = reducer(initialState, openPaymentReminderModal({ id: '1', name: 'N' }))
    expect(state.paymentReminderModal.open).toBe(true)
    state = reducer(state, closePaymentReminderModal())
    expect(state.paymentReminderModal.open).toBe(false)
  });

  it('should handle updateStatusThunk.fulfilled', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', status: { id: 1, actionType: 'Old' } }] as unknown as AbstractItem[],
      items: [{ id: '1', status: 'Old' as AbstractStatus }] as unknown as AbstractRecord[],
    }

    const payload = { updatedAbstract: { id: '1', status: { id: 1, actionType: 'Approved' } } as unknown as AbstractItem, whatsappSent: false }

    const state = reducer(
      startState,
      updateStatusThunk.fulfilled(payload, '', { id: '1', statusId: 2 })
    )

    expect(state.actionLoading.status).toBe(false)
    expect(state.rawItems[0]).toEqual(payload.updatedAbstract)
    expect(state.modalStatus).toBe('Approved')
  })

  it('should close invoice modal after sendInvoiceThunk.fulfilled', () => {
    const startState = {
      ...initialState,
      invoiceModal: { open: true, abstractId: '1', abstractName: 'Test' },
      actionLoading: { ...initialState.actionLoading, invoice: true },
    }

    const state = reducer(
      startState,
      sendInvoiceThunk.fulfilled({ success: true, message: 'Invoice sent', abstract: { id: '1', name: 'Test', email: 'test@test.com' } }, '', { abstractId: '1', invoiceData: { invoiceAmount: 100, orderItems: [] } })
    )

    expect(state.actionLoading.invoice).toBe(false)
    expect(state.invoiceModal.open).toBe(false)
  })

  it('should handle fetchAbstracts.rejected', () => {
    const state = reducer(initialState, fetchAbstracts.rejected(new Error('Network Error'), '', { page: 1, limit: 10, filters: { search: '', sortBy: 'now', sortOrder: 'DESC' } as AbstractFilters }))

    expect(state.loading).toBe(false)
    expect(state.error).toBe('Network Error')
  })

  it('should handle updateStatusThunk.rejected', () => {
    const startState = { ...initialState, actionLoading: { ...initialState.actionLoading, status: true } }
    const state = reducer(startState, updateStatusThunk.rejected(null, '', { id: '1', statusId: 1 }))
    expect(state.actionLoading.status).toBe(false)
  })

  it('should handle sendInvoiceThunk.rejected', () => {
    const startState = { ...initialState, actionLoading: { ...initialState.actionLoading, invoice: true } }
    const state = reducer(startState, sendInvoiceThunk.rejected(null, '', { abstractId: '1', invoiceData: {} as InvoiceData }))
    expect(state.actionLoading.invoice).toBe(false)
  })

  it('should handle sendPaymentReminderThunk.rejected', () => {
    const startState = { ...initialState, actionLoading: { ...initialState.actionLoading, reminder: true } }
    const state = reducer(startState, sendPaymentReminderThunk.rejected(null, '', { abstractId: '1', paymentReminderData: {} as PaymentReminderData }))
    expect(state.actionLoading.reminder).toBe(false)
  })

  it('should handle sendPaymentReceiptThunk.rejected', () => {
    const startState = { ...initialState, actionLoading: { ...initialState.actionLoading, receipt: true } }
    const state = reducer(startState, sendPaymentReceiptThunk.rejected(null, '', { abstractId: '1', receiptData: {} as PaymentReceiptData }))
    expect(state.actionLoading.receipt).toBe(false)
  })

  it('should handle sendConfirmationEmailThunk.rejected', () => {
    const startState = { ...initialState, actionLoading: { ...initialState.actionLoading, confirmation: true } }
    const state = reducer(startState, sendConfirmationEmailThunk.rejected(null, '', '1'))
    expect(state.actionLoading.confirmation).toBe(false)
  })

  it('should handle updateStatusThunk.fulfilled with payload.status as object', () => {
    const payload = { updatedAbstract: { id: '1', status: { actionType: 'Accepted' } } as unknown as AbstractItem, whatsappSent: false }
    const state = reducer(initialState, updateStatusThunk.fulfilled(payload, '', { id: '1', statusId: 2 }))
    expect(state.modalStatus).toBe('Accepted')
  })

  it('should handle sendConfirmationEmailThunk.fulfilled when selected ID matches', () => {
    const startState = {
      ...initialState,
      selected: { id: '1', isEmailSent: false } as AbstractItem
    }
    const state = reducer(startState, sendConfirmationEmailThunk.fulfilled({ id: '1', message: 'Sent' }, '', '1'))
    expect(state.selected?.isEmailSent).toBe(true)
  })
})
