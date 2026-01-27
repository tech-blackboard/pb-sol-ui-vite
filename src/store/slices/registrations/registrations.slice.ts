import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fetchRegistrations, deleteRegistrationThunk } from './registrations.thunks';
import type { RegistrationFilters, RegistrationsState } from './registrations.types';

const initialFilters: RegistrationFilters = {
    search: '',
    sortBy: 'now',
    sortOrder: 'DESC',
};

const initialState: RegistrationsState = {
    items: [],
    rawItems: [],
    selected: null,
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    draftFilters: initialFilters,
    appliedFilters: initialFilters,
};

const registrationsSlice = createSlice({
    name: 'registrations',
    initialState,
    reducers: {
        setSelected(state, action: PayloadAction<any>) {
            state.selected = action.payload;
        },
        clearSelected(state) {
            state.selected = null;
        },
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
        setPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload;
            state.page = 1;
        },
        updateDraftFilter(state, action: PayloadAction<{ key: string; value: any }>) {
            state.draftFilters[action.payload.key] = action.payload.value;
        },
        applyFilters(state) {
            state.appliedFilters = { ...state.draftFilters };
            state.page = 1;
        },
        resetFilters(state) {
            state.draftFilters = initialFilters;
            state.appliedFilters = initialFilters;
            state.page = 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRegistrations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRegistrations.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.rawItems = payload.items;
                state.items = payload.items; // For now no normalization needed since no complex mapping yet
                state.total = payload.total;
            })
            .addCase(fetchRegistrations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to load';
            })
            .addCase(deleteRegistrationThunk.fulfilled, (state, action) => {
                state.rawItems = state.rawItems.filter(i => i.id !== action.payload);
                state.items = state.items.filter(i => i.id !== action.payload);
                state.total -= 1;
            });
    },
});

export const {
    setSelected,
    clearSelected,
    setPage,
    setPageSize,
    updateDraftFilter,
    applyFilters,
    resetFilters,
} = registrationsSlice.actions;

export default registrationsSlice.reducer;
