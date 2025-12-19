import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  searchAbstracts,
  sendConfirmationEmail,
  sendPaymentReceipt,
  sendPaymentReminder,
  updateAbstractStatus,
} from '../../../services/abstracts'
import type { AbstractFilters } from './abstracts.types'
import { sendInvoice } from '../../../services/abstracts'
import type { InvoiceData, PaymentReceiptData } from '../../../services/abstracts'
import { STATUS_TO_ID } from '../../../features/abstracts/status.constants'

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
export const sendPaymentReceiptThunk = createAsyncThunk(
  'abstracts/sendPaymentReceipt',
  async (
    {
      abstractId,
      receiptData,
    }: { abstractId: string; receiptData: PaymentReceiptData }) => {
    // 1️⃣ Send receipt email
    const receiptResult = await sendPaymentReceipt(abstractId, receiptData)

    // 2️⃣ Update status → Registered
    const updated = await updateAbstractStatus(abstractId, STATUS_TO_ID.Registered)

    return {
      receiptResult,
      updated,
    }
  }
)

export const sendConfirmationEmailThunk = createAsyncThunk(
  'abstracts/sendConfirmationEmail',
  async (id: string) => {
    const result = await sendConfirmationEmail(id)
    return { id, message: result.message }
  }
)



