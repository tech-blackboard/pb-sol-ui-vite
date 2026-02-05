import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { searchBrochures, createBrochure, type BrochureItem } from '../../../services/brochures';

export interface BrochureFilters {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    website_id?: number | string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface BrochuresState {
    items: BrochureItem[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: BrochureFilters;
    appliedFilters: BrochureFilters;
    selected: BrochureItem | null;
}

export const fetchBrochures = createAsyncThunk(
    'brochures/fetch',
    async (params: { page: number; limit: number; filters: BrochureFilters }) => {
        return await searchBrochures({
            page: params.page,
            limit: params.limit,
            ...params.filters,
        });
    }
);

export const createBrochureThunk = createAsyncThunk(
    'brochures/create',
    async (payload: Partial<BrochureItem>) => {
        return await createBrochure(payload);
    }
);

const initialState: BrochuresState = {
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

const brochuresSlice = createSlice({
    name: 'brochures',
    initialState,
    reducers: {
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
        setPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload;
            state.page = 1;
        },
        setFilters(state, action: PayloadAction<BrochureFilters>) {
            state.appliedFilters = action.payload;
            state.draftFilters = action.payload;
            state.page = 1;
        },
        updateDraftFilter<K extends keyof BrochureFilters>(
            state: BrochuresState,
            action: PayloadAction<{ key: K; value: BrochureFilters[K] }>
        ) {
            state.draftFilters[action.payload.key] = action.payload.value;
        },
        applyFilters(state) {
            state.appliedFilters = { ...state.draftFilters };
            state.page = 1;
        },
        resetFilters(state) {
            const initialFilters: BrochureFilters = { search: '', sortBy: 'now', sortOrder: 'DESC' };
            state.draftFilters = initialFilters;
            state.appliedFilters = initialFilters;
            state.page = 1;
        },
        setSelected(state, action: PayloadAction<BrochureItem | null>) {
            state.selected = action.payload;
        },
        clearSelected(state) {
            state.selected = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBrochures.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchBrochures.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items || payload.data || [];
                state.total = payload.total || 0;
            })
            .addCase(fetchBrochures.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to load';
            });
    },
});

export const { setPage, setPageSize, setFilters, updateDraftFilter, applyFilters, resetFilters, setSelected, clearSelected } = brochuresSlice.actions;
export default brochuresSlice.reducer;
