import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { searchBrochures } from '../../../services/brochures';

export interface BrochureFilters {
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface BrochuresState {
    items: any[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    appliedFilters: BrochureFilters;
    selected: any | null;
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

const initialState: BrochuresState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
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
            .addCase(fetchBrochures.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchBrochures.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items;
                state.total = payload.total;
            })
            .addCase(fetchBrochures.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to load';
            });
    },
});

export const { setPage, setPageSize, setFilters, setSelected, clearSelected } = brochuresSlice.actions;
export default brochuresSlice.reducer;
