import axios from 'axios'
import {
  fetchAbstracts,
  updateStatusThunk,
  sendInvoiceThunk,
  sendPaymentReminderThunk,
  sendPaymentReceiptThunk,
  sendConfirmationEmailThunk,
  updateAbstractThunk,
} from '../../../../store/slices/abstracts/abstracts.thunks'

import {
  searchAbstracts,
  updateAbstractStatus,
  sendInvoice,
  sendPaymentReminder,
  sendPaymentReceipt,
  sendConfirmationEmail,
  updateAbstract,
  type InvoiceData,
  type PaymentReceiptData,
  type PaymentReminderData,
} from '../../../../services/abstracts'

jest.mock('../../../../services/abstracts', () => ({
  searchAbstracts: jest.fn(),
  updateAbstractStatus: jest.fn(),
  sendInvoice: jest.fn(),
  sendPaymentReminder: jest.fn(),
  sendPaymentReceipt: jest.fn(),
  sendConfirmationEmail: jest.fn(),
  updateAbstract: jest.fn(),
}))

import { STATUS_TO_ID } from '../../../../features/abstracts/status.constants'


const dispatch = jest.fn()
const getState = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('abstracts thunks', () => {
  /* -------------------------------------------------- */
  /* fetchAbstracts                                     */
  /* -------------------------------------------------- */

  it('fetchAbstracts → calls searchAbstracts with merged filters', async () => {
    ; (searchAbstracts as jest.Mock).mockResolvedValue({ items: [], total: 0 })

    const thunk = fetchAbstracts({
      page: 1,
      limit: 10,
      filters: { search: 'AI', sortBy: 'now', sortOrder: 'DESC' },
    })
    await thunk(dispatch, getState, undefined)

    expect(searchAbstracts).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'AI',
      sortBy: 'now',
      sortOrder: 'DESC',
    })
  })

  it('fetchAbstracts → rejects with fallback message on generic error', async () => {
    (searchAbstracts as jest.Mock).mockRejectedValue(new Error('Generic fail'))

    const thunk = fetchAbstracts({
      page: 1,
      limit: 10,
      filters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    })

    const result = await thunk(dispatch, getState, undefined)

    expect(result.payload).toBe('An unknown error occurred')
  })

  /* -------------------------------------------------- */
  /* updateStatusThunk                                  */
  /* -------------------------------------------------- */

  it('updateStatusThunk → calls updateAbstractStatus', async () => {
    ; (updateAbstractStatus as jest.Mock).mockResolvedValue({ id: '1', status: 'Approved' })

    const thunk = updateStatusThunk({ id: '1', statusId: 2 })
    await thunk(dispatch, getState, undefined)

    expect(updateAbstractStatus).toHaveBeenCalledWith('1', 2)
  })

  /* -------------------------------------------------- */
  /* sendInvoiceThunk                                   */
  /* -------------------------------------------------- */

  it('sendInvoiceThunk → calls sendInvoice', async () => {
    ; (sendInvoice as jest.Mock).mockResolvedValue({ success: true })

    const thunk = sendInvoiceThunk({
      abstractId: '123',
      invoiceData: { invoiceAmount: 100, orderItems: [] },
    })

    await thunk(dispatch, getState, undefined)

    expect(sendInvoice).toHaveBeenCalledWith('123', { invoiceAmount: 100, orderItems: [] })
  })

  /* -------------------------------------------------- */
  /* sendPaymentReminderThunk                           */
  /* -------------------------------------------------- */

  it('sendPaymentReminderThunk → calls sendPaymentReminder', async () => {
    ; (sendPaymentReminder as jest.Mock).mockResolvedValue({ success: true })

    const thunk = sendPaymentReminderThunk({
      abstractId: '123',
      paymentReminderData: { paymentLink: 'https://pay.example.com' },
    })

    await thunk(dispatch, getState, undefined)

    expect(sendPaymentReminder).toHaveBeenCalledWith('123', { paymentLink: 'https://pay.example.com' })
  })

  /* -------------------------------------------------- */
  /* sendPaymentReceiptThunk                            */
  /* -------------------------------------------------- */

  it('sendPaymentReceiptThunk → sends receipt and updates status', async () => {
    ; (sendPaymentReceipt as jest.Mock).mockResolvedValue({ sent: true })
      ; (updateAbstractStatus as jest.Mock).mockResolvedValue({ id: '123', status: 'Registered' })

    const thunk = sendPaymentReceiptThunk({
      abstractId: '123',
      receiptData: { paymentReceiptAmount: 500, orderItems: [] },
    })

    const result = await thunk(dispatch, getState, undefined)

    expect(sendPaymentReceipt).toHaveBeenCalledWith('123', { paymentReceiptAmount: 500, orderItems: [] })
    expect(updateAbstractStatus).toHaveBeenCalledWith(
      '123',
      STATUS_TO_ID.Registered
    )

    expect(result.payload).toEqual({
      receiptResult: { sent: true },
      updated: { id: '123', status: 'Registered' },
    })
  })

  /* -------------------------------------------------- */
  /* sendConfirmationEmailThunk                         */
  /* -------------------------------------------------- */

  it('sendConfirmationEmailThunk → returns id and message', async () => {
    ; (sendConfirmationEmail as jest.Mock).mockResolvedValue({
      message: 'Email sent',
    })

    const thunk = sendConfirmationEmailThunk('abc')

    const result = await thunk(dispatch, getState, undefined)

    expect(sendConfirmationEmail).toHaveBeenCalledWith('abc')
    expect(result.payload).toEqual({
      id: 'abc',
      message: 'Email sent',
    })
  })

  it('sendPaymentReceiptThunk → rejects with descriptive message on axios error', async () => {
    (sendPaymentReceipt as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Receipt failed' } },
    })

    const thunk = sendPaymentReceiptThunk({ abstractId: '1', receiptData: {} as PaymentReceiptData })
    const result = await thunk(dispatch, getState, undefined)

    expect(result.type).toBe('abstracts/sendPaymentReceipt/rejected')
    expect(result.payload).toBe('Receipt failed')
  })

  it('sendConfirmationEmailThunk → rejects with fallback message on generic error', async () => {
    (sendConfirmationEmail as jest.Mock).mockRejectedValue(new Error('Generic fail'))

    const thunk = sendConfirmationEmailThunk('1')
    const result = await thunk(dispatch, getState, undefined)

    expect(result.type).toBe('abstracts/sendConfirmationEmail/rejected')
    expect(result.payload).toBe('Failed to send confirmation email')
  })

  it('updateStatusThunk → rejects with descriptive message on generic error', async () => {
    (updateAbstractStatus as jest.Mock).mockRejectedValue(new Error('Update failed'))

    const thunk = updateStatusThunk({ id: '1', statusId: 1 })
    const result = await thunk(dispatch, getState, undefined)

    expect(result.type).toBe('abstracts/status/rejected')
    expect(result.payload).toBe('Failed to update status')
  })

  it('sendInvoiceThunk → rejects with descriptive message on generic error', async () => {
    (sendInvoice as jest.Mock).mockRejectedValue(new Error('Invoice failed'))

    const thunk = sendInvoiceThunk({ abstractId: '1', invoiceData: {} as InvoiceData })
    const result = await thunk(dispatch, getState, undefined)

    expect(result.type).toBe('abstracts/sendInvoice/rejected')
    expect(result.payload).toBe('Failed to send invoice')
  })

  it('sendPaymentReminderThunk → rejects with descriptive message on generic error', async () => {
    (sendPaymentReminder as jest.Mock).mockRejectedValue(new Error('Reminder failed'))

    const thunk = sendPaymentReminderThunk({ abstractId: '1', paymentReminderData: {} as PaymentReminderData })
    const result = await thunk(dispatch, getState, undefined)

    expect(result.type).toBe('abstracts/paymentReminder/rejected')
    expect(result.payload).toBe('Failed to send payment reminder')
  })

  it('updateStatusThunk → rejects with axios error', async () => {
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      ; (updateAbstractStatus as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Axios Status Error' } },
      })

    const thunk = updateStatusThunk({ id: '1', statusId: 1 })
    const result = await thunk(dispatch, getState, undefined)
    expect(result.payload).toBe('Axios Status Error')
    isAxiosErrorSpy.mockRestore()
  })

  it('sendInvoiceThunk → rejects with axios error', async () => {
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      ; (sendInvoice as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Axios Invoice Error' } },
      })

    const thunk = sendInvoiceThunk({ abstractId: '1', invoiceData: {} as InvoiceData })
    const result = await thunk(dispatch, getState, undefined)
    expect(result.payload).toBe('Axios Invoice Error')
    isAxiosErrorSpy.mockRestore()
  })

  it('updateAbstractThunk → calls updateAbstract and returns result', async () => {
    ; (updateAbstract as jest.Mock).mockResolvedValue({ id: '1', name: 'New' })

    const thunk = updateAbstractThunk({ id: '1', body: { name: 'New' } })
    const result = await thunk(dispatch, getState, undefined)

    expect(updateAbstract).toHaveBeenCalledWith('1', { name: 'New' })
    expect(result.payload).toEqual({ id: '1', name: 'New' })
  })

  it('updateAbstractThunk → rejects with descriptive message on axios error', async () => {
    // The thunk uses axios.isAxiosError(err).
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      ; (updateAbstract as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      })

    const thunk = updateAbstractThunk({ id: '1', body: {} })
    const result = await thunk(dispatch, getState, undefined)

    expect(result.payload).toBe('Update failed')
    isAxiosErrorSpy.mockRestore()
  })

  it('updateAbstractThunk → rejects with fallback message on generic error', async () => {
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(false)
      ; (updateAbstract as jest.Mock).mockRejectedValue(new Error('Fail'))

    const thunk = updateAbstractThunk({ id: '1', body: {} })
    const result = await thunk(dispatch, getState, undefined)

    expect(result.payload).toBe('Failed to update record')
    isAxiosErrorSpy.mockRestore()
  })

  it('covers err.message fallback when response.data.message is missing for all thunks (lines 37, 52, 65, 80, 92, 118, 131)', async () => {
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
    const errObj = { isAxiosError: true, message: 'Axios Fallback Message', response: { data: {} } }
    
    ;(searchAbstracts as jest.Mock).mockRejectedValue(errObj)
    ;(updateAbstract as jest.Mock).mockRejectedValue(errObj)
    ;(updateAbstractStatus as jest.Mock).mockRejectedValue(errObj)
    ;(sendInvoice as jest.Mock).mockRejectedValue(errObj)
    ;(sendPaymentReminder as jest.Mock).mockRejectedValue(errObj)
    ;(sendPaymentReceipt as jest.Mock).mockRejectedValue(errObj)
    ;(sendConfirmationEmail as jest.Mock).mockRejectedValue(errObj)

    const thunks = [
      fetchAbstracts({ page: 1, limit: 10, filters: { search: '', sortBy: 'now', sortOrder: 'DESC' } }),
      updateAbstractThunk({ id: '1', body: {} }),
      updateStatusThunk({ id: '1', statusId: 1 }),
      sendInvoiceThunk({ abstractId: '1', invoiceData: {} as InvoiceData }),
      sendPaymentReminderThunk({ abstractId: '1', paymentReminderData: {} as PaymentReminderData }),
      sendPaymentReceiptThunk({ abstractId: '1', receiptData: {} as PaymentReceiptData }),
      sendConfirmationEmailThunk('1')
    ]

    for (const t of thunks) {
      const res = await t(dispatch, getState, undefined)
      expect(res.payload).toBe('Axios Fallback Message')
    }

    isAxiosErrorSpy.mockRestore()
  })
})
