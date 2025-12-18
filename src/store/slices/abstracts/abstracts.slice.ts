import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AbstractFilters } from './abstracts.types'
import {
  fetchAbstracts,
  updateStatusThunk,
} from './abstracts.thunks'
import { normalizeAbstract } from '../../../utils/normalizeAbstract'

/* -------------------- types -------------------- */

interface AbstractsState {
  items: any[]
  rawItems: any[]
  selected: any | null

  loading: boolean
  error: string | null

  page: number
  pageSize: number
  total: number

  draftFilters: AbstractFilters
  appliedFilters: AbstractFilters

  actionLoading: {
    status: boolean
  }
}

/* -------------------- constants -------------------- */

const initialFilters: AbstractFilters = {
  search: '',
  sortBy: 'now',
  sortOrder: 'DESC',
}

/* -------------------- initial state -------------------- */

const initialState: AbstractsState = {
  items: [],
  rawItems: [],
  selected: null,

  loading: false,
  error: null,

  page: 1,
  pageSize: 25,
  total: 0,

  draftFilters: initialFilters,
  appliedFilters: initialFilters,

  actionLoading: {
    status: false,
  },
}

/* -------------------- slice -------------------- */

const abstractsSlice = createSlice({
  name: 'abstracts',
  initialState,
  reducers: {
    /* selection */
    setSelected(state, action: PayloadAction<any>) {
      state.selected = action.payload
    },
    clearSelected(state) {
      state.selected = null
    },

    /* pagination */
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload
      state.page = 1
    },

    /* -------- filters (OLD PAGE BEHAVIOR) -------- */
    updateDraftFilter(
      state,
      action: PayloadAction<{ key: keyof AbstractFilters; value: any }>
    ) {
      state.draftFilters[action.payload.key] = action.payload.value
    },

    applyFilters(state) {
      state.appliedFilters = { ...state.draftFilters}
      state.page = 1
    },

    resetFilters(state) {
      state.draftFilters = initialFilters
      state.appliedFilters = initialFilters
      state.page = 1
    },
  },

  extraReducers: (builder) => {
    builder
      /* fetch */
      .addCase(fetchAbstracts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAbstracts.fulfilled, (state, { payload }) => {
        state.loading = false
        state.rawItems = payload.items
        state.items = payload.items.map(normalizeAbstract)
        state.total = payload.total ?? payload.items.length
      })
      .addCase(fetchAbstracts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load'
      })

      /* status update */
      .addCase(updateStatusThunk.pending, (state) => {
        state.actionLoading.status = true
      })
      .addCase(updateStatusThunk.fulfilled, (state, { payload }) => {
        state.actionLoading.status = false

        const idx = state.rawItems.findIndex(
          (x: any) => String(x.id ?? x._id) === String(payload.id ?? payload.id)
        )

        if (idx !== -1) {
          state.rawItems[idx] = payload
          state.items[idx] = normalizeAbstract(payload)
          state.selected = payload
        }
      })
      .addCase(updateStatusThunk.rejected, (state) => {
        state.actionLoading.status = false
      })
  },
})

/* -------------------- exports -------------------- */

export const {
  setSelected,
  clearSelected,
  setPage,
  setPageSize,
  updateDraftFilter,
  applyFilters,
  resetFilters,
} = abstractsSlice.actions

export default abstractsSlice.reducer
