import { selectSelectedNormalized } from '../../../../store/slices/abstracts/abstracts.selectors'
import type { RootState } from '../../../../store/index'
import type { AbstractRecord, AbstractStatus } from '../../../../features/abstracts/types'

describe('abstracts selectors', () => {
  const baseState = {
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
    auth: {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      isInitialized: false,
    },
    theme: {
      mode: 'light',
    },
    registrations: { items: [], loading: false, error: null },
    sponsorships: { items: [], loading: false, error: null },
    brochures: { items: [], loading: false, error: null },
    accRegistrations: { items: [], loading: false, error: null },
    contacts: { items: [], loading: false, error: null },
  } as unknown as RootState

  const createMockItem = (id: string, name: string): AbstractRecord => ({
    id,
    name,
    email: `${name.toLowerCase()}@test.com`,
    status: 'Accepted' as AbstractStatus,
    isEmailSent: false,
  })

  it('returns null when no abstract is selected', () => {
    const result = selectSelectedNormalized(baseState)
    expect(result).toBeNull()
  })

  it('returns matching item when selected.id matches item.id', () => {
    const item = createMockItem('1', 'N1')
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '1' } as unknown as import('../../../../services/abstracts').AbstractItem,
        items: [item],
      },
    }

    const result = selectSelectedNormalized(state)
    expect(result).toEqual(item)
  })

  it('returns undefined when no matching item is found', () => {
    const item = createMockItem('1', 'N1')
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '3' } as unknown as import('../../../../services/abstracts').AbstractItem,
        items: [item],
      },
    }

    const result = selectSelectedNormalized(state)
    expect(result).toBeUndefined()
  })

  it('is memoized for same input references', () => {
    const item = createMockItem('1', 'N1')
    const state = {
      ...baseState,
      abstracts: {
        ...baseState.abstracts,
        selected: { id: '1' } as unknown as import('../../../../services/abstracts').AbstractItem,
        items: [item],
      },
    }

    const first = selectSelectedNormalized(state)
    const second = selectSelectedNormalized(state)

    expect(first).toBe(second) // same reference
  })
})
