import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  searchAbstracts,
  sendConfirmationEmail,
  updateAbstractStatus,
} from '../../../services/abstracts'
import type { AbstractFilters } from './abstracts.types'

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

