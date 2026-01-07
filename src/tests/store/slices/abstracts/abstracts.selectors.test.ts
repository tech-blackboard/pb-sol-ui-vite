import { selectSelectedNormalized } from '../../../../store/slices/abstracts/abstracts.selectors'
import type { RootState } from '../../../../store/index'

describe('abstracts selectors', () => {
  const baseState: RootState = {
    abstracts: {
      items: [],
      rawItems: [],
      selected: null,
      modalStatus: null,
      loading: false,
      error: null,
      page: 1,
      pageSize: 10,
      total: 0,
      draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
      appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
      actionLoading: {
        status: false,
        invoice: false,
        reminder: false,
        confirmation: false,
        receipt: false,
      },
      invoiceModal: { open: false, abstractId: null, abstractName: '' },
      paymentReceiptModal: { open: false, abstractId: null, abstractName: '' },
      paymentReminderModal: { open: false, abstractId: null, abstractName: '' },
    },
  } as unknown as RootState

  it('returns null when no abstract is selected', () => {
    const result = selectSelectedNormalized(baseState)
    expect(result).toBeNull()
  })

  it('returns matching item when selected.id matches item.id', () => {
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '1' },
        items: [{ id: '1', title: 'A' }],
      },
    }

    const result = selectSelectedNormalized(state)
    expect(result).toEqual({ id: '1', title: 'A' })
  })

  it('matches selected.id with item._id', () => {
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '99' },
        items: [{ _id: '99', title: 'B' }],
      },
    }

    const result = selectSelectedNormalized(state)
    expect(result).toEqual({ _id: '99', title: 'B' })
  })

  it('returns undefined when no matching item is found', () => {
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '3' },
        items: [{ id: '1' }],
      },
    }

    const result = selectSelectedNormalized(state)
    expect(result).toBeUndefined()
  })

  it('is memoized for same input references', () => {
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '1' },
        items: [{ id: '1' }],
      },
    }

    const first = selectSelectedNormalized(state)
    const second = selectSelectedNormalized(state)

    expect(first).toBe(second) // same reference
  })
})
