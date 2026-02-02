import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { searchAccRegistrations, createAccRegistration } from '../../../services/accRegistrations';

export interface AccRegistrationFilters {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    institution?: string;
    country?: string;
    status_flag?: string;
    website_id?: number | string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface AccRegistrationsState {
    items: any[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: AccRegistrationFilters;
    appliedFilters: AccRegistrationFilters;
    selected: any | null;
}

export const fetchAccRegistrations = createAsyncThunk(
    'accRegistrations/fetch',
    async (params: { page: number; limit: number; filters: AccRegistrationFilters }) => {
        return await searchAccRegistrations({
            page: params.page,
            limit: params.limit,
            ...params.filters,
        });
    }
);

export const createAccRegistrationThunk = createAsyncThunk(
    'accRegistrations/create',
    async (data: any) => {
        return await createAccRegistration(data);
    }
);

const initialState: AccRegistrationsState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    selected: null,
};

const accRegistrationsSlice = createSlice({
    name: 'accRegistrations',
    initialState,
    reducers: {
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
        setPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload;
            state.page = 1;
        },
        setFilters(state, action: PayloadAction<AccRegistrationFilters>) {
            state.appliedFilters = action.payload;
            state.draftFilters = action.payload;
            state.page = 1;
        },
        updateDraftFilter(state, action: PayloadAction<{ key: keyof AccRegistrationFilters; value: any }>) {
            state.draftFilters[action.payload.key] = action.payload.value;
        },
        applyFilters(state) {
            state.appliedFilters = { ...state.draftFilters };
            state.page = 1;
        },
        resetFilters(state) {
            const initialFilters: AccRegistrationFilters = { search: '', sortBy: 'now', sortOrder: 'DESC' };
            state.draftFilters = initialFilters;
            state.appliedFilters = initialFilters;
            state.page = 1;
        },
        setSelected(state, action: PayloadAction<any>) {
            state.selected = action.payload;
        },
        clearSelected(state) {
            state.selected = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccRegistrations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAccRegistrations.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items;
                state.total = payload.total;
            })
            .addCase(fetchAccRegistrations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to load';
            })
            .addCase(createAccRegistrationThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createAccRegistrationThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createAccRegistrationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to create';
            });
    },
});

export const { setPage, setPageSize, setFilters, updateDraftFilter, applyFilters, resetFilters, setSelected, clearSelected } = accRegistrationsSlice.actions;
export default accRegistrationsSlice.reducer;
