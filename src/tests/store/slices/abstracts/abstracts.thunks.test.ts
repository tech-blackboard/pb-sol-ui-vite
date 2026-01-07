jest.mock('../../../../services/abstracts', () => ({
    searchAbstracts: jest.fn(),
    updateAbstractStatus: jest.fn(),
    sendInvoice: jest.fn(),
    sendPaymentReminder: jest.fn(),
    sendPaymentReceipt: jest.fn(),
    sendConfirmationEmail: jest.fn(),
  }))
  import {
    fetchAbstracts,
    updateStatusThunk,
    sendInvoiceThunk,
    sendPaymentReminderThunk,
    sendPaymentReceiptThunk,
    sendConfirmationEmailThunk,
  } from '../../../../store/slices/abstracts/abstracts.thunks'
  
  import {
    searchAbstracts,
    updateAbstractStatus,
    sendInvoice,
    sendPaymentReminder,
    sendPaymentReceipt,
    sendConfirmationEmail,
  } from '../../../../services/abstracts'
  
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
      ;(searchAbstracts as jest.Mock).mockResolvedValue({ items: [], total: 0 })
  
      const thunk = fetchAbstracts({
        page: 1,
        limit: 10,
        filters: { search: 'AI', sortBy: 'now', sortOrder: 'DESC' },
      } as any)
      await thunk(dispatch, getState, undefined)
  
      expect(searchAbstracts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'AI',
        sortBy: 'now',
        sortOrder: 'DESC',
      })
    })
  
    it('fetchAbstracts → rejects with value on error', async () => {
      ;(searchAbstracts as jest.Mock).mockRejectedValue(new Error('API error'))
  
      const thunk = fetchAbstracts({
        page: 1,
        limit: 10,
        filters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
      })
  
      const result = await thunk(dispatch, getState, undefined)
  
      expect(result.type).toBe('abstracts/fetch/rejected')
      expect(result.payload).toBe('API error')
    })
  
    /* -------------------------------------------------- */
    /* updateStatusThunk                                  */
    /* -------------------------------------------------- */
  
    it('updateStatusThunk → calls updateAbstractStatus', async () => {
      ;(updateAbstractStatus as jest.Mock).mockResolvedValue({ id: '1', status: 'Approved' })
  
      const thunk = updateStatusThunk({ id: '1', statusId: 2 })
      await thunk(dispatch, getState, undefined)
  
      expect(updateAbstractStatus).toHaveBeenCalledWith('1', 2)
    })
  
    /* -------------------------------------------------- */
    /* sendInvoiceThunk                                   */
    /* -------------------------------------------------- */
  
    it('sendInvoiceThunk → calls sendInvoice', async () => {
      ;(sendInvoice as jest.Mock).mockResolvedValue({ success: true })
  
      const thunk = sendInvoiceThunk({
        abstractId: '123',
        invoiceData: { amount: 100 },
      } as any)
  
      await thunk(dispatch, getState, undefined)
  
      expect(sendInvoice).toHaveBeenCalledWith('123', { amount: 100 })
    })
  
    /* -------------------------------------------------- */
    /* sendPaymentReminderThunk                           */
    /* -------------------------------------------------- */
  
    it('sendPaymentReminderThunk → calls sendPaymentReminder', async () => {
      ;(sendPaymentReminder as jest.Mock).mockResolvedValue({ success: true })
  
      const thunk = sendPaymentReminderThunk({
        abstractId: '123',
        paymentReminderData: { message: 'Pay now' },
      } as any)
  
      await thunk(dispatch, getState, undefined)
  
      expect(sendPaymentReminder).toHaveBeenCalledWith('123', { message: 'Pay now' })
    })
  
    /* -------------------------------------------------- */
    /* sendPaymentReceiptThunk                            */
    /* -------------------------------------------------- */
  
    it('sendPaymentReceiptThunk → sends receipt and updates status', async () => {
      ;(sendPaymentReceipt as jest.Mock).mockResolvedValue({ sent: true })
      ;(updateAbstractStatus as jest.Mock).mockResolvedValue({ id: '123', status: 'Registered' })
  
      const thunk = sendPaymentReceiptThunk({
        abstractId: '123',
        receiptData: { amount: 500 },
      } as any)
  
      const result = await thunk(dispatch, getState, undefined)
  
      expect(sendPaymentReceipt).toHaveBeenCalledWith('123', { amount: 500 })
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
      ;(sendConfirmationEmail as jest.Mock).mockResolvedValue({
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
  })
    