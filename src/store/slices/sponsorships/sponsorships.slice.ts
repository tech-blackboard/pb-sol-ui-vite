import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { searchSponsorships } from '../../../services/sponsorships';

export interface SponsorshipFilters {
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface SponsorshipsState {
    items: any[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    appliedFilters: SponsorshipFilters;
    selected: any | null;
}

export const fetchSponsorships = createAsyncThunk(
    'sponsorships/fetch',
    async (params: { page: number; limit: number; filters: SponsorshipFilters }) => {
        return await searchSponsorships({
            page: params.page,
            limit: params.limit,
            ...params.filters,
        });
    }
);

const initialState: SponsorshipsState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    selected: null,
};

const sponsorshipsSlice = createSlice({
    name: 'sponsorships',
    initialState,
    reducers: {
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
        setPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload;
            state.page = 1;
        },
        setFilters(state, action: PayloadAction<SponsorshipFilters>) {
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
            .addCase(fetchSponsorships.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSponsorships.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items;
                state.total = payload.total;
            })
            .addCase(fetchSponsorships.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to load';
            });
    },
});

export const { setPage, setPageSize, setFilters, setSelected, clearSelected } = sponsorshipsSlice.actions;
export default sponsorshipsSlice.reducer;
