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
