import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  searchAbstracts,
  sendPaymentReminder,
  updateAbstractStatus,
} from '../../../services/abstracts'
import type { AbstractFilters } from './abstracts.types'
import { sendInvoice } from '../../../services/abstracts'
import type { InvoiceData } from '../../../services/abstracts'

export const fetchAbstracts = createAsyncThunk(
  'abstracts/fetch',
  async (
    {
      page,
      limit,
      filters,
    }: {
      page: number
      limit: number
      filters: AbstractFilters
    },
    { rejectWithValue }
  ) => {
    try {
      return await searchAbstracts({
        page,
        limit,
        ...filters, // 🔥 THIS IS CRITICAL
      })
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateStatusThunk = createAsyncThunk(
  'abstracts/status',
  async ({ id, statusId }: { id: string; statusId: number }) => {
    return await updateAbstractStatus(id, statusId)
  }
)

export const sendInvoiceThunk = createAsyncThunk(
  'abstracts/sendInvoice',
  async (
    { abstractId, invoiceData }: { abstractId: string; invoiceData: InvoiceData }
  ) => {
    return await sendInvoice(abstractId, invoiceData)
  }
)

export const sendPaymentReminderThunk = createAsyncThunk(
  'abstracts/paymentReminder',
  async (abstractId: string) => {
    return await sendPaymentReminder(abstractId)
  }
)

