import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import {
  searchAbstracts,
  sendConfirmationEmail,
  sendPaymentReceipt,
  sendPaymentReminder,
  updateAbstractStatus,
} from '../../../services/abstracts'
import type { AbstractFilters } from './abstracts.types'
import { sendInvoice } from '../../../services/abstracts'
import type { InvoiceData, PaymentReceiptData, PaymentReminderData } from '../../../services/abstracts'
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
        ...filters,
      })
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'An unknown error occurred'
      return rejectWithValue(message)
    }
  }
)

export const updateStatusThunk = createAsyncThunk(
  'abstracts/status',
  async ({ id, statusId }: { id: string; statusId: number }, { rejectWithValue }) => {
    try {
      return await updateAbstractStatus(id, statusId)
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update status';
      return rejectWithValue(message);
    }
  }
)

export const sendInvoiceThunk = createAsyncThunk(
  'abstracts/sendInvoice',
  async (
    { abstractId, invoiceData }: { abstractId: string; invoiceData: InvoiceData },
    { rejectWithValue }
  ) => {
    try {
      return await sendInvoice(abstractId, invoiceData)
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to send invoice';
      return rejectWithValue(message);
    }
  }
)

export const sendPaymentReminderThunk = createAsyncThunk(
  'abstracts/paymentReminder',
  async ({ abstractId, paymentReminderData }: { abstractId: string; paymentReminderData: PaymentReminderData }, { rejectWithValue }) => {
    try {
      return await sendPaymentReminder(abstractId, paymentReminderData)
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to send payment reminder';
      return rejectWithValue(message);
    }
  }
)
export const sendPaymentReceiptThunk = createAsyncThunk(
  'abstracts/sendPaymentReceipt',
  async (
    {
      abstractId,
      receiptData,
    }: { abstractId: string; receiptData: PaymentReceiptData },
    { rejectWithValue }
  ) => {
    try {
      // 1️⃣ Send receipt email
      const receiptResult = await sendPaymentReceipt(abstractId, receiptData)

      // 2️⃣ Update status → Registered
      const updated = await updateAbstractStatus(abstractId, STATUS_TO_ID.Registered)

      return {
        receiptResult,
        updated,
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to send payment receipt';
      return rejectWithValue(message);
    }
  }
)

export const sendConfirmationEmailThunk = createAsyncThunk(
  'abstracts/sendConfirmationEmail',
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await sendConfirmationEmail(id)
      return { id, message: result.message }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to send confirmation email';
      return rejectWithValue(message);
    }
  }
)



