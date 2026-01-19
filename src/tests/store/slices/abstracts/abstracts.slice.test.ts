

import type { AbstractItem } from '../../../../services/abstracts'
import reducer, { setSelected, clearSelected, setPage, setPageSize, updateDraftFilter, applyFilters, resetFilters, openInvoiceModal, closeInvoiceModal } from '../../../../store/slices/abstracts/abstracts.slice'
import { fetchAbstracts, updateStatusThunk, sendInvoiceThunk } from '../../../../store/slices/abstracts/abstracts.thunks'

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

  it('should handle updateStatusThunk.fulfilled', () => {
    const startState = {
      ...initialState,
      rawItems: [{ id: '1', status: { id: 1, actionType: 'Old' } }] as unknown as AbstractItem[],
      items: [{ id: '1', status: 'Old' as import('../../../../features/abstracts/types').AbstractStatus }] as unknown as import('../../../../features/abstracts/types').AbstractRecord[],
    }

    const payload = { id: '1', status: { id: 1, actionType: 'Approved' } } as unknown as AbstractItem

    const state = reducer(
      startState,
      updateStatusThunk.fulfilled(payload as AbstractItem, '', { id: '1', statusId: 2 })
    )

    expect(state.actionLoading.status).toBe(false)
    expect(state.rawItems[0]).toEqual(payload)
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
})
