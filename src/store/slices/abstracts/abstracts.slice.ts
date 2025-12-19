import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AbstractFilters } from './abstracts.types'
import { fetchAbstracts, sendConfirmationEmailThunk, sendInvoiceThunk, sendPaymentReceiptThunk, sendPaymentReminderThunk, updateStatusThunk } from './abstracts.thunks'
import { normalizeAbstract } from '../../../features/abstracts/utils/normalizeAbstract'
import type { AbstractStatus } from '../../../features/abstracts/types'

interface AbstractsState {
  items: any[]
  rawItems: any[]
  selected: any | null
  modalStatus: AbstractStatus | null

  loading: boolean
  error: string | null

  page: number
  pageSize: number
  total: number

  draftFilters: AbstractFilters
  appliedFilters: AbstractFilters

  actionLoading: {
    status: boolean
    invoice: boolean
    reminder: boolean
    confirmation: boolean
    receipt: boolean
  }

  invoiceModal: {
    open: boolean
    abstractId: string | null
    abstractName: string
  }

  paymentReceiptModal: {
    open: boolean
    abstractId: string | null
    abstractName: string
  }
  
}

const initialFilters: AbstractFilters = {
  search: '',
  sortBy: 'now',
  sortOrder: 'DESC',
}

const initialState: AbstractsState = {
  items: [],
  rawItems: [],
  selected: null,
  modalStatus: null,

  loading: false,
  error: null,

  page: 1,
  pageSize: 25,
  total: 0,

  draftFilters: initialFilters,
  appliedFilters: initialFilters,

  actionLoading: {
    status: false,
    invoice: false,
    reminder: false,
    confirmation: false,
    receipt: false,
  },

  invoiceModal: {
    open: false,
    abstractId: null,
    abstractName: '',
  },

  paymentReceiptModal: {
    open: false,
    abstractId: null,
    abstractName: '',
  },
  
}

const abstractsSlice = createSlice({
  name: 'abstracts',
  initialState,
  reducers: {
    /* ---------- selection ---------- */
    setSelected(state, action: PayloadAction<any>) {
      state.selected = action.payload
      state.modalStatus =
        action.payload?.status?.actionType ??
        action.payload?.status ??
        'Under Review'
    },

    clearSelected(state) {
      state.selected = null
      state.modalStatus = null
    },

    setModalStatus(state, action: PayloadAction<AbstractStatus>) {
      state.modalStatus = action.payload
    },

    /* ---------- pagination ---------- */
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload
      state.page = 1
    },

    /* ---------- filters ---------- */
    updateDraftFilter(
      state,
      action: PayloadAction<{ key: keyof AbstractFilters; value: any }>
    ) {
      state.draftFilters[action.payload.key] = action.payload.value
    },

    applyFilters(state) {
      state.appliedFilters = { ...state.draftFilters }
      state.page = 1
    },

    resetFilters(state) {
      state.draftFilters = initialFilters
      state.appliedFilters = initialFilters
      state.page = 1
    },
    /* ---------- invoice modal ---------- */
    openInvoiceModal(
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) {
      state.invoiceModal.open = true
      state.invoiceModal.abstractId = action.payload.id
      state.invoiceModal.abstractName = action.payload.name
    },

    closeInvoiceModal(state) {
      state.invoiceModal.open = false
      state.invoiceModal.abstractId = null
      state.invoiceModal.abstractName = ''
    },

    /* ---------- payment receipt modal ---------- */
    openPaymentReceiptModal(
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) {
      state.paymentReceiptModal.open = true
      state.paymentReceiptModal.abstractId = action.payload.id
      state.paymentReceiptModal.abstractName = action.payload.name
    },
    
    closePaymentReceiptModal(state) {
      state.paymentReceiptModal.open = false
      state.paymentReceiptModal.abstractId = null
      state.paymentReceiptModal.abstractName = ''
    },
    
  },

  extraReducers: (builder) => {
    builder
      /* ---------- fetch ---------- */
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

      /* ---------- status update ---------- */
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
        }

        // 🔥 keep modal + table in sync
        state.selected = payload
        state.modalStatus = (payload.status?.actionType ?? payload.status ?? 'Under Review') as AbstractStatus
      })
      .addCase(updateStatusThunk.rejected, (state) => {
        state.actionLoading.status = false
      })
      /* ---------- open invoice modal ---------- */
      .addCase(sendInvoiceThunk.pending, (state) => {
        state.actionLoading.invoice = true
      })

      .addCase(sendInvoiceThunk.fulfilled, (state) => {
        state.actionLoading.invoice = false
        state.invoiceModal.open = false
        state.invoiceModal.abstractId = null
        state.invoiceModal.abstractName = ''
      })

      .addCase(sendInvoiceThunk.rejected, (state) => {
        state.actionLoading.invoice = false
      })


      /* ---------- close invoice modal ---------- */
      .addCase(closeInvoiceModal, (state) => {
        state.invoiceModal.open = false
        state.invoiceModal.abstractId = null
        state.invoiceModal.abstractName = ''
      })

      /* ---------- send payment reminder ---------- */
      .addCase(sendPaymentReminderThunk.pending, (state) => {
        state.actionLoading.reminder = true
      })
      .addCase(sendPaymentReminderThunk.fulfilled, (state) => {
        state.actionLoading.reminder = false
      })
      .addCase(sendPaymentReminderThunk.rejected, (state) => {
        state.actionLoading.reminder = false
      })

      /* ---------- send payment receipt ---------- */
      .addCase(sendPaymentReceiptThunk.pending, (state) => {
        state.actionLoading.reminder = true
      })
      
      .addCase(sendPaymentReceiptThunk.fulfilled, (state, { payload }) => {
        state.actionLoading.reminder = false
      
        const updated = payload.updated
      
        const idx = state.rawItems.findIndex(
          (x) => String(x.id ?? x._id) === String(updated.id ?? updated.id)
        )
      
        if (idx !== -1) {
          state.rawItems[idx] = updated
          state.items[idx] = normalizeAbstract(updated)
        }
      
        state.selected = updated
        state.modalStatus = 'Registered'
      
        state.paymentReceiptModal.open = false
        state.paymentReceiptModal.abstractId = null
        state.paymentReceiptModal.abstractName = ''
      })
      
      .addCase(sendPaymentReceiptThunk.rejected, (state) => {
        state.actionLoading.reminder = false
      })

      /* ---------- send confirmation email ---------- */
      .addCase(sendConfirmationEmailThunk.pending, (state) => {
        state.actionLoading.confirmation = true
      })
      
      .addCase(sendConfirmationEmailThunk.fulfilled, (state, { payload }) => {
        state.actionLoading.confirmation = false
      
        const { id } = payload
      
        const idx = state.rawItems.findIndex(
          (x) => String(x.id ?? x._id) === String(id)
        )
      
        if (idx !== -1) {
          state.rawItems[idx] = {
            ...state.rawItems[idx],
            isEmailSent: true,
          }
          state.items[idx] = normalizeAbstract(state.rawItems[idx])
        }
      
        if (state.selected && String(state.selected.id ?? state.selected._id) === String(id)) {
          state.selected = {
            ...state.selected,
            isEmailSent: true,
          }
        }
      })
      
      .addCase(sendConfirmationEmailThunk.rejected, (state) => {
        state.actionLoading.confirmation = false
      })
  },
})

export const {
  setSelected,
  clearSelected,
  setModalStatus,
  setPage,
  setPageSize,
  updateDraftFilter,
  applyFilters,
  resetFilters,
  openInvoiceModal,
  closeInvoiceModal,
  openPaymentReceiptModal,
  closePaymentReceiptModal
} = abstractsSlice.actions

export default abstractsSlice.reducer
