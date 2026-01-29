import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { searchAccRegistrations } from '../../../services/accRegistrations';

export interface AccRegistrationFilters {
    search?: string;
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

const initialState: AccRegistrationsState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
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
            });
    },
});

export const { setPage, setPageSize, setFilters, setSelected, clearSelected } = accRegistrationsSlice.actions;
export default accRegistrationsSlice.reducer;
