import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { searchBrochures, createBrochure, updateBrochure, deleteBrochure, type BrochureItem } from '../../../services/brochures';

export interface BrochureFilters {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    website_id?: number | string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onlyDeleted?: string;
}

export interface BrochuresState {
    items: BrochureItem[];
    loading: boolean;
    editLoading: boolean;
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
    async (params: { page: number; limit: number; filters: BrochureFilters }, { rejectWithValue }) => {
        try {
            return await searchBrochures({
                page: params.page,
                limit: params.limit,
                ...params.filters,
            });
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to load brochures');
        }
    }
);

export const createBrochureThunk = createAsyncThunk(
    'brochures/create',
    async (payload: Partial<BrochureItem>, { rejectWithValue }) => {
        try {
            return await createBrochure(payload);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to create brochure request';
            return rejectWithValue(message);
        }
    }
);

export const updateBrochureThunk = createAsyncThunk(
    'brochures/update',
    async ({ id, data }: { id: string | number; data: Partial<BrochureItem> }, { rejectWithValue }) => {
        try {
            return await updateBrochure(id, data);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update brochure';
            return rejectWithValue(message);
        }
    }
);

export const deleteBrochureThunk = createAsyncThunk(
    'brochures/delete',
    async (id: string | number, { rejectWithValue }) => {
        try {
            await deleteBrochure(id);
            return id;
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete brochure request');
        }
    }
);

const initialState: BrochuresState = {
    items: [],
    loading: false,
    editLoading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' },
    appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' },
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
            const initialFilters: BrochureFilters = { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' };
            state.draftFilters = initialFilters;
            state.appliedFilters = initialFilters;
            state.page = 1;
        },
        setSelected(state, action: PayloadAction<BrochureItem | null>) {
            state.selected = action.payload;
        },
        clearSelected(state) {
            state.selected = null;
        },
        clearError(state) {
            state.error = null;
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
                state.error = (action.payload as string) || action.error.message || 'Failed to load';
            })
            .addCase(createBrochureThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createBrochureThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createBrochureThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to create brochure request';
            })
            .addCase(updateBrochureThunk.pending, (state) => {
                state.editLoading = true;
            })
            .addCase(updateBrochureThunk.fulfilled, (state, { payload }) => {
                state.editLoading = false;
                state.items = state.items.map(i => i.id === payload.id ? payload : i);
                if (state.selected?.id === payload.id) state.selected = payload;
            })
            .addCase(updateBrochureThunk.rejected, (state, action) => {
                state.editLoading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to update brochure';
            })
            .addCase(deleteBrochureThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteBrochureThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
                if (state.selected?.id === action.payload) {
                    state.selected = null;
                }
            })
            .addCase(deleteBrochureThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to delete brochure request';
            });
    },
});

export const { setPage, setPageSize, setFilters, updateDraftFilter, applyFilters, resetFilters, setSelected, clearSelected, clearError } = brochuresSlice.actions;
export default brochuresSlice.reducer;
