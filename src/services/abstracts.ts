import { api } from '../lib/api';
import { ABSTRACT_BASE } from '../config/env';
export type AbstractRole = { id: number | string; name: string }

export type AbstractUser = {
  id: number | string
  firstname?: string
  lastname?: string
  useremail?: string
  roles?: AbstractRole[]
  createdAt?: string
  updatedAt?: string
}

export type AbstractStatus = {
  id: number | string
  actionType: 'Under Review' | 'Accepted' | 'Out of Scope' | 'Rejected' | 'Registered' | string
  description?: string
}

export type AbstractWebsite = {
  id: number | string
  name?: string
  link?: string
  description?: string
}

export type AbstractItem = {
  id: number | string
  user?: AbstractUser
  name?: string
  email?: string
  aemail?: string
  organization?: string
  phone?: string
  wphone?: string
  city?: string
  country?: string
  intrested?: string
  message?: string
  title?: string
  file?: string
  status?: AbstractStatus
  website?: AbstractWebsite
  originalId?: number | string
  isEmailSent?: boolean
  paymentLink?: string

  now?: string
  website_name?: string
  fileS3Url?: string
  uuid?: string
  website_id?: number | string
}


export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getAllAbstracts(): Promise<AbstractItem[]> {
  const { data } = await api.get<
    AbstractItem[] | { data?: AbstractItem[]; items?: AbstractItem[]; results?: AbstractItem[] }
  >(`${ABSTRACT_BASE}/all`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    withCredentials: true,
  })
  const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? data?.results ?? []
  return Array.isArray(list) ? list : []
}

export async function getAbstractById(id: string | number): Promise<AbstractItem> {
  const { data } = await api.get<AbstractItem>(`${ABSTRACT_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    withCredentials: true,
  })
  return data
}

export async function createAbstract(body: Partial<AbstractItem>): Promise<AbstractItem> {
  const { data } = await api.post<AbstractItem>(`${ABSTRACT_BASE}`, body, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    withCredentials: true,
  })
  return data
}

export async function createAbstractWithFormDataFileUpload(body: Partial<AbstractItem> | FormData): Promise<AbstractItem> {
  const isFormData = body instanceof FormData

  // For FormData, we need to handle headers differently
  const config: { withCredentials: boolean; headers?: Record<string, string> } = {
    withCredentials: true,
  }

  if (isFormData) {
    // Don't set Content-Type for FormData - let browser set it with boundary
    // Only add Authorization header
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (token) {
      config.headers = {
        'Authorization': `Bearer ${token}`
      }
    }
  } else {
    // For JSON requests
    config.headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    }
  }

  const { data } = await api.post<AbstractItem>(`${ABSTRACT_BASE}`, body, config)
  return data
}

export async function updateAbstract(id: string | number, body: Partial<AbstractItem>): Promise<AbstractItem> {
  const { data } = await api.put<AbstractItem>(`${ABSTRACT_BASE}/${id}`, body, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    withCredentials: true,
  })
  return data
}

export async function updateAbstractStatus(
  id: string | number,
  statusId: number,
): Promise<{ updatedAbstract: AbstractItem; whatsappSent: boolean }> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  }
  const numericId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id
  const { data } = await api.patch<AbstractItem>(
    `${ABSTRACT_BASE}/${numericId}/status`,
    { status_id: statusId },
    { headers, withCredentials: true },
  )
  return data as unknown as { updatedAbstract: AbstractItem; whatsappSent: boolean }
}

export async function deleteAbstract(id: string | number): Promise<void> {
  await api.delete(`${ABSTRACT_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    withCredentials: true,
  })
}

export type AbstractSearchParams = {
  page?: number
  limit?: number
  status_id?: number
  website_id?: number
  user_id?: number
  name?: string
  email?: string
  country?: string
  city?: string
  organization?: string
  title?: string
  search?: string
  isEmailSent?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export type AbstractSearchResult = {
  items: AbstractItem[]
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export async function searchAbstracts(params: AbstractSearchParams = {}): Promise<AbstractSearchResult> {
  const q: Omit<AbstractSearchParams, 'isEmailSent'> & { isEmailSent?: boolean | number } = { ...params }
  if (typeof q.isEmailSent === 'boolean') {
    q.isEmailSent = q.isEmailSent === true ? 1 : 0
  }
  const { data } = await api.get(`${ABSTRACT_BASE}/search`, {
    params: q,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    withCredentials: true,
  })

  const list = Array.isArray(data)
    ? data
    : data?.items ?? data?.data ?? data?.results ?? []

  const total = data?.total ?? data?.count ?? data?.pagination?.total ?? undefined
  const page = data?.page ?? data?.pagination?.page ?? params.page
  const limit = data?.limit ?? data?.pagination?.limit ?? params.limit
  const totalPages = data?.totalPages ?? data?.pagination?.totalPages ?? (total && limit ? Math.ceil(total / limit) : undefined)

  return {
    items: Array.isArray(list) ? list : [],
    page,
    limit,
    total,
    totalPages,
  }
}

export type InvoiceOrderItem = {
  serialNumber: number
  description: string
  quantity: number
  price: number
}

export type InvoiceData = {
  invoiceAmount: number
  orderItems: InvoiceOrderItem[]
  paymentLink?: string
  interestedIn?: string
  note?: string
  // Additional data for context
  registrationFee?: number
  numberOfParticipants?: number
  accommodationFee?: number
  numberOfNights?: number
  occupancyType?: string
  internetHandlingFees?: number
  checkIn?: string
  checkOut?: string
}

export type SendInvoiceResponse = {
  success: boolean
  message: string
  abstract: {
    id: number | string
    name?: string
    email?: string
  }
}

export async function sendInvoice(
  id: string | number,
  invoiceData: InvoiceData
): Promise<SendInvoiceResponse> {
  const { data } = await api.post<SendInvoiceResponse>(
    `${ABSTRACT_BASE}/${id}/send-invoice`,
    invoiceData,
    {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      withCredentials: true,
    }
  )
  return data
}

export type PaymentReceiptOrderItem = {
  serialNumber: number
  description: string
  quantity: number
  price: number
}

export type PaymentReceiptData = {
  paymentReceiptAmount: number
  orderItems: PaymentReceiptOrderItem[]
  paymentLink?: string
  interestedIn?: string
  note?: string
  // Additional data for context
  registrationFee?: number
  numberOfParticipants?: number
  accommodationFee?: number
  totalAccommodationValue?: number
  numberOfNights?: number
  occupancyType?: string
  internetHandlingFees?: number
  checkIn?: string
  checkOut?: string
  totalRegistrationValue?: number
}

export type SendPaymentReceiptResponse = {
  success: boolean
  message: string
  abstract: {
    id: number | string
    name?: string
    email?: string
  }
}

export type PaymentReminderData = {
  paymentLink?: string
}

export async function sendPaymentReceipt(
  id: string | number,
  paymentReceiptData: PaymentReceiptData
): Promise<SendPaymentReceiptResponse> {
  const { data } = await api.post<SendPaymentReceiptResponse>(
    `${ABSTRACT_BASE}/${id}/send-payment-receipt`,
    paymentReceiptData,
    {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      withCredentials: true,
    }
  )
  return data
}

export async function sendConfirmationEmail(
  id: string | number
): Promise<SendInvoiceResponse> {
  const { data } = await api.post<SendInvoiceResponse>(
    `${ABSTRACT_BASE}/${id}/send-confirmation`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      withCredentials: true,
    }
  )
  return data
}

export type PaymentReminderResponse = { status?: 'success' | 'error'; message?: string }

export async function sendPaymentReminder(id: string | number, paymentReminderData: PaymentReminderData): Promise<PaymentReminderResponse> {
  const { data } = await api.post(
    `${ABSTRACT_BASE}/${id}/payment-reminder`,
    paymentReminderData,
    {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      withCredentials: true,
    },
  )
  return data
}

export type DashboardFilters = {
  website_id?: string | number
  from_date?: string
  to_date?: string
  status_id?: number
}

export type DashboardStatusCount = { status_id: number; count: number | string }
export type DashboardData = {
  total: number
  statusCounts: DashboardStatusCount[]
  recentAbstracts: AbstractItem[]
}

export async function fetchDashboard(filters: DashboardFilters): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>(`${ABSTRACT_BASE}/dashboard`, {
    params: filters,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    withCredentials: true,
  })
  return data
}
