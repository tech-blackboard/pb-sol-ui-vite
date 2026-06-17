

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
  closePaymentReminderModal,
  clearError
} from '../../../../store/slices/abstracts/abstracts.slice'
import { fetchAbstracts, updateAbstractThunk, updateStatusThunk, sendInvoiceThunk, sendPaymentReminderThunk, sendPaymentReceiptThunk, sendConfirmationEmailThunk, deleteAbstractThunk, restoreAbstractThunk } from '../../../../store/slices/abstracts/abstracts.thunks'
import type { UnknownAction } from '@reduxjs/toolkit'

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
    const startState = { ...initialState, rawItems: [{ id: '2' }] as AbstractItem[], selected: { id: '1' } as unknown as AbstractItem }
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
      paymentReceiptModal: { open: true, abstractId: '1', abstractName: 'Test' },
      selected: { id: '1', name: 'Original' } as AbstractItem
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

  it('should handle updateAbstractThunk.fulfilled (lines 225-242)', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', name: 'Old' }] as AbstractItem[],
      items: [{ id: '1' }] as unknown as AbstractRecord[],
      actionLoading: { ...initialState.actionLoading, edit: true },
      selected: { id: '1', name: 'Old' } as AbstractItem
    }
    const updated = { id: '1', name: 'New' } as AbstractItem
    const state = reducer(startState, updateAbstractThunk.fulfilled(updated, '', { id: '1', body: {} }))

    expect(state.actionLoading.edit).toBe(false)
    expect(state.rawItems[0].name).toBe('New')
    expect(state.selected).toEqual(updated)
  })

  it('should handle fetchAbstracts.rejected with fallback message (line 219)', () => {
    const action = { type: fetchAbstracts.rejected.type, payload: null, error: { message: 'Network Er' } }
    const state = reducer(initialState, action as UnknownAction)
    expect(state.error).toBe('Network Er')

    const actionNoMsg = { type: fetchAbstracts.rejected.type, payload: null, error: {} }
    const stateNoMsg = reducer(initialState, actionNoMsg as UnknownAction)
    expect(stateNoMsg.error).toBe('Failed to load')
  })

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
      selected: { id: '1', status: { id: 1, actionType: 'Old' } } as unknown as AbstractItem
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
    const startState = { ...initialState, selected: { id: '1', status: 'Under Review' } as unknown as AbstractItem }
    const payload = { updatedAbstract: { id: '1', status: { actionType: 'Accepted' } } as unknown as AbstractItem, whatsappSent: false }
    const state = reducer(startState, updateStatusThunk.fulfilled(payload, '', { id: '1', statusId: 2 }))
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

  // New Coverage Cases
  it('should use default status if status is missing in setSelected (line 113)', () => {
    const abstract = { id: '1' } as AbstractItem
    const state = reducer(initialState, setSelected(abstract))
    expect(state.modalStatus).toBe('Under Review')
  })

  it('should clear error via clearError (line 200)', () => {
    const state = reducer({ ...initialState, error: 'err' }, clearError())
    expect(state.error).toBeNull()
  })

  // Re-importing clearError from slice for clarity (if not already redundant)
  it('should handle clearError specifically', () => {
    const state = reducer({ ...initialState, error: 'err' }, clearError())
    expect(state.error).toBeNull()
  })

  it('should handle updateAbstractThunk.pending (line 224)', () => {
    const state = reducer(initialState, updateAbstractThunk.pending('', { id: '1', body: {} }))
    expect(state.actionLoading.edit).toBe(true)
  })

  it('should handle updateAbstractThunk.rejected (line 244)', () => {
    const startState = { ...initialState, actionLoading: { ...initialState.actionLoading, edit: true } }
    const state = reducer(startState, updateAbstractThunk.rejected(null, '', { id: '1', body: {} }))
    expect(state.actionLoading.edit).toBe(false)
  })

  it('should handle updateStatusThunk.pending (line 249)', () => {
    const state = reducer(initialState, updateStatusThunk.pending('', { id: '1', statusId: 1 }))
    expect(state.actionLoading.status).toBe(true)
  })

  it('should handle sendInvoiceThunk.pending (line 274)', () => {
    const state = reducer(initialState, sendInvoiceThunk.pending('', { abstractId: '1', invoiceData: {} as InvoiceData }))
    expect(state.actionLoading.invoice).toBe(true)
  })

  it('should handle sendPaymentReceiptThunk.pending (line 315)', () => {
    const state = reducer(initialState, sendPaymentReceiptThunk.pending('', { abstractId: '1', receiptData: {} as PaymentReceiptData }))
    expect(state.actionLoading.receipt).toBe(true)
  })

  it('should handle sendConfirmationEmailThunk.pending (line 346)', () => {
    const state = reducer(initialState, sendConfirmationEmailThunk.pending('', '1'))
    expect(state.actionLoading.confirmation).toBe(true)
  })

  it('should handle sendPaymentReminderThunk.fulfilled (lines 301-304)', () => {
    const startState = {
      ...initialState,
      paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
      actionLoading: { ...initialState.actionLoading, reminder: true }
    }
    const state = reducer(startState, sendPaymentReminderThunk.fulfilled({ success: true }, '', { abstractId: '1', paymentReminderData: {} as PaymentReminderData }))
    expect(state.actionLoading.reminder).toBe(false)
    expect(state.paymentReminderModal.open).toBe(false)
  })

  it('should handle closeInvoiceModal via extraReducer (lines 291-293)', () => {
    const startState = {
      ...initialState,
      invoiceModal: { open: true, abstractId: '1', abstractName: 'Test' }
    }
    const state = reducer(startState, closeInvoiceModal())
    expect(state.invoiceModal.open).toBe(false)
    expect(state.invoiceModal.abstractId).toBeNull()
  })

  it('should handle sendPaymentReminderThunk.pending (line 298)', () => {
    const state = reducer(initialState, sendPaymentReminderThunk.pending('', { abstractId: '1', paymentReminderData: {} as PaymentReminderData }))
    expect(state.actionLoading.reminder).toBe(true)
  })

  // Thunk Rejected Coverage (Lines 118-120, 131-133 in thunks.ts)
  // These are usually tested by mocking the service to throw and checking the rejected action's payload
  // However, the coverage report likely refers to the slice handler for these rejected actions which we already have. 
  // If it's about the thunk catch block itself (axios.isAxiosError part), we need to trigger it in thunk tests.

  it('should handle deleteAbstractThunk.fulfilled', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] as AbstractItem[],
      items: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] as unknown as AbstractRecord[],
      total: 2,
    }
    const state = reducer(startState, deleteAbstractThunk.fulfilled('1', '', '1'))
    expect(state.items.length).toBe(1)
    expect(state.rawItems.length).toBe(1)
    expect(state.total).toBe(1)
  })

  it('should handle restoreAbstractThunk.fulfilled', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] as AbstractItem[],
      items: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] as unknown as AbstractRecord[],
      total: 2,
    }
    const state = reducer(startState, restoreAbstractThunk.fulfilled('1', '', '1'))
    expect(state.items.length).toBe(1)
    expect(state.rawItems.length).toBe(1)
    expect(state.total).toBe(1)
  })
})
