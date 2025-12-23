import type { AbstractRecord } from '../../../features/abstracts/types'

export interface AbstractsState {
  items: AbstractRecord[]
  rawItems: any[]
  selected: any | null

  loading: boolean
  error: string | null

  page: number
  pageSize: number
  total: number
  filters: any

  actionLoading: {
    status: boolean
    invoice: boolean
    receipt: boolean
    reminder: boolean
    confirmation: boolean
  }
}
export interface AbstractFilters {
  search?: string
  name?: string
  email?: string
  organization?: string
  country?: string
  title?: string
  status_id?: number
  website_id?: number
  sortBy?: 'now' | 'name'
  sortOrder?: 'ASC' | 'DESC'
  isEmailSent?: boolean
}
