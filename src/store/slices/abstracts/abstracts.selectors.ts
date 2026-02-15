import type { RootState } from '../../../store'

export const selectAbstractsState = (state: RootState) => state.abstracts

export const selectAbstracts = (state: RootState) =>
  state.abstracts.items

export const selectAbstractsLoading = (state: RootState) =>
  state.abstracts.loading

export const selectSelectedAbstract = (state: RootState) =>
  state.abstracts.selected

export const selectActionLoading = (state: RootState) =>
  state.abstracts.actionLoading


export const selectDraftFilters = (s: RootState) =>
  s.abstracts.draftFilters

export const selectAppliedFilters = (s: RootState) =>
  s.abstracts.appliedFilters

export const selectModalStatus = (s: RootState) =>
  s.abstracts.modalStatus

export const selectStatusLoading = (s: RootState) =>
  s.abstracts.actionLoading.status

// src/store/slices/abstracts/abstracts.selectors.ts
import { createSelector } from '@reduxjs/toolkit'

export const selectSelectedNormalized = createSelector(
  [(s: RootState) => s.abstracts.selected, (s: RootState) => s.abstracts.items],
  (selected, items) => {
    if (!selected) return null
    const id = String(selected.id)
    return items.find(item => String(item.id) === id)
  }
)