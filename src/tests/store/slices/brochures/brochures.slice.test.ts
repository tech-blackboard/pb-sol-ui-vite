import reducer, {
  setPage,
  setPageSize,
  setFilters,
  updateDraftFilter,
  applyFilters,
  resetFilters,
  setSelected,
  clearSelected,
  clearError,
  type BrochureFilters,
} from '../../../../store/slices/brochures/brochures.slice'

import {
  fetchBrochures,
  createBrochureThunk,
} from '../../../../store/slices/brochures/brochures.slice'

import type { BrochureItem } from '../../../../services/brochures'

import * as api from '../../../../services/brochures'
import axios from 'axios'

jest.mock('../../../../services/brochures')

describe('brochures slice', () => {
  const initialState = reducer(undefined, { type: 'INIT' })

  // ================= BASIC REDUCERS =================

  it('should return initial state', () => {
    expect(initialState.page).toBe(1)
    expect(initialState.items).toEqual([])
    expect(initialState.loading).toBe(false)
  })

  it('should set page', () => {
    const state = reducer(initialState, setPage(2))
    expect(state.page).toBe(2)
  })

  it('should set page size', () => {
    const state = reducer(initialState, setPageSize(20))
    expect(state.pageSize).toBe(20)
    expect(state.page).toBe(1)
  })

  it('should set filters', () => {
    const filters: BrochureFilters = { search: 'test' }
    const state = reducer(initialState, setFilters(filters))
    expect(state.appliedFilters).toEqual(filters)
  })

  it('should update draft filter', () => {
    const state = reducer(
      initialState,
      updateDraftFilter({ key: 'search', value: 'query' })
    )
    expect(state.draftFilters.search).toBe('query')
  })

  it('should apply filters', () => {
    const startState = {
      ...initialState,
      draftFilters: { search: 'new' },
      page: 2,
    }
    const state = reducer(startState, applyFilters())
    expect(state.appliedFilters.search).toBe('new')
    expect(state.page).toBe(1)
  })

  it('should reset filters', () => {
    const startState = {
      ...initialState,
      draftFilters: { search: 'dirty' },
      appliedFilters: { search: 'applied' },
    }
    const state = reducer(startState, resetFilters())
    expect(state.draftFilters.search).toBe('')
    expect(state.appliedFilters.search).toBe('')
  })

  it('should set selected', () => {
    const item = { id: 1, name: 'Brochure' } as BrochureItem
    const state = reducer(initialState, setSelected(item))
    expect(state.selected).toEqual(item)
  })

  it('should clear selected', () => {
    const startState = {
      ...initialState,
      selected: { id: 1 } as BrochureItem,
    }
    const state = reducer(startState, clearSelected())
    expect(state.selected).toBeNull()
  })

  it('should clear error', () => {
    const startState = { ...initialState, error: 'err' }
    const state = reducer(startState, clearError())
    expect(state.error).toBeNull()
  })

  // ================= EXTRA REDUCERS =================

  describe('extraReducers', () => {
    it('handles fetchBrochures.pending', () => {
      const state = reducer(
        initialState,
        fetchBrochures.pending('', { page: 1, limit: 10, filters: {} })
      )
      expect(state.loading).toBe(true)
    })

    it('handles fetchBrochures.fulfilled', () => {
      const payload = {
        items: [{ id: 1 }] as BrochureItem[],
        total: 1,
        page: 1,
        limit: 10,
      }
      const state = reducer(
        initialState,
        fetchBrochures.fulfilled(payload, '', {
          page: 1,
          limit: 10,
          filters: {},
        })
      )
      expect(state.loading).toBe(false)
      expect(state.items).toEqual([{ id: 1 }])
    })

    it('handles fetchBrochures.rejected', () => {
      const state = reducer(
        initialState,
        fetchBrochures.rejected(null, '', {
          page: 1,
          limit: 10,
          filters: {},
        }, 'Fail')
      )
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Fail')
    })
  })

  // ================= THUNK COVERAGE (FIX RED LINES) =================

  it('fetchBrochures success (try block)', async () => {
    ;(api.searchBrochures as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    })

    const thunk = fetchBrochures({ page: 1, limit: 10, filters: {} })
    const result = await thunk(jest.fn(), () => ({}), undefined)

    expect(result.type).toContain('fulfilled')
  })

  it('fetchBrochures axios error branch', async () => {
    jest.spyOn(axios, 'isAxiosError').mockImplementation(() => true)

    ;(api.searchBrochures as jest.Mock).mockRejectedValue({
      response: { data: { message: 'API error' } },
    })

    const thunk = fetchBrochures({ page: 1, limit: 10, filters: {} })
    const result = await thunk(jest.fn(), () => ({}), undefined)

    expect(result.payload).toBe('API error')
  })

  it('fetchBrochures fallback error branch', async () => {
    jest.spyOn(axios, 'isAxiosError').mockImplementation(() => false)

    ;(api.searchBrochures as jest.Mock).mockRejectedValue(new Error())

    const thunk = fetchBrochures({ page: 1, limit: 10, filters: {} })
    const result = await thunk(jest.fn(), () => ({}), undefined)

    expect(result.payload).toBe('Failed to load brochures')
  })

  // ===== createBrochureThunk coverage =====

  it('createBrochureThunk success', async () => {
    ;(api.createBrochure as jest.Mock).mockResolvedValue({ id: 1 })

    const thunk = createBrochureThunk({})
    const result = await thunk(jest.fn(), () => ({}), undefined)

    expect(result.type).toContain('fulfilled')
  })

  it('createBrochureThunk axios error', async () => {
    jest.spyOn(axios, 'isAxiosError').mockImplementation(() => true)

    ;(api.createBrochure as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Create error' } },
    })

    const thunk = createBrochureThunk({})
    const result = await thunk(jest.fn(), () => ({}), undefined)

    expect(result.payload).toBe('Create error')
  })

  it('createBrochureThunk fallback error', async () => {
    jest.spyOn(axios, 'isAxiosError').mockImplementation(() => false)

    ;(api.createBrochure as jest.Mock).mockRejectedValue(new Error())

    const thunk = createBrochureThunk({})
    const result = await thunk(jest.fn(), () => ({}), undefined)

    expect(result.payload).toBe('Failed to create brochure request')
  })
})