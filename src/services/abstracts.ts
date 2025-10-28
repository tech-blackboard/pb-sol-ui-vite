import { api } from '../lib/api';

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

  now?: string
}

const ABSTRACT_BASE = (import.meta as any).env?.VITE_ABSTRACT_BASE || 'http://localhost:3000/abstract'

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
  console.log(list)
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
): Promise<AbstractItem> {
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
  return data
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
  const q: any = { ...params }
  if (typeof q.isEmailSent === 'boolean') {
    q.is_email_sent = q.isEmailSent ? 1 : 0
    delete q.isEmailSent
  }
  console.log(q)
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


