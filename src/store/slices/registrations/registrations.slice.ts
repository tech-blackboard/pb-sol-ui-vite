import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fetchRegistrations, deleteRegistrationThunk, createRegistrationThunk, updateRegistrationThunk } from './registrations.thunks';
import type { RegistrationFilters, RegistrationsState } from './registrations.types';
import type { RegistrationItem } from '../../../services/registrations';

const initialFilters: RegistrationFilters = {
    search: '',
    sortBy: 'now',
    sortOrder: 'DESC',
    onlyDeleted: 'false',
};

const initialState: RegistrationsState = {
    items: [],
    rawItems: [],
    selected: null,
    loading: false,
    editLoading: false,
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
        setSelected(state, action: PayloadAction<RegistrationItem | null>) {
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
        updateDraftFilter<K extends keyof RegistrationFilters>(
            state: RegistrationsState,
            action: PayloadAction<{ key: K; value: RegistrationFilters[K] }>
        ) {
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
        clearError(state) {
            state.error = null;
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
                state.error = (action.payload as string) || action.error.message || 'Failed to load';
            })
            .addCase(deleteRegistrationThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteRegistrationThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.rawItems = state.rawItems.filter(i => i.id !== action.payload);
                state.items = state.items.filter(i => i.id !== action.payload);
                state.total -= 1;
            })
            .addCase(deleteRegistrationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to delete registration';
            })
            .addCase(createRegistrationThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createRegistrationThunk.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.rawItems = [payload, ...state.rawItems];
                state.items = [payload, ...state.items];
                state.total += 1;
            })
            .addCase(createRegistrationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to create registration';
            })
            .addCase(updateRegistrationThunk.pending, (state) => {
                state.editLoading = true;
            })
            .addCase(updateRegistrationThunk.fulfilled, (state, { payload }) => {
                state.editLoading = false;
                // Update the item in-place
                state.rawItems = state.rawItems.map(i => i.id === payload.id ? payload : i);
                state.items = state.items.map(i => i.id === payload.id ? payload : i);
                if (state.selected?.id === payload.id) state.selected = payload;
            })
            .addCase(updateRegistrationThunk.rejected, (state, action) => {
                state.editLoading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to update registration';
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
    clearError,
} = registrationsSlice.actions;

export default registrationsSlice.reducer;
