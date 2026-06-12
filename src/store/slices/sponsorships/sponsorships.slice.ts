import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { searchSponsorships, createSponsorship, updateSponsorship, deleteSponsorship, type SponsorshipItem } from '../../../services/sponsorships';
import type { SponsorshipRecord } from '../../../features/abstracts/types';

export interface SponsorshipFilters {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    country?: string;
    website_id?: number | string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onlyDeleted?: string;
    fromDate?: string;
    toDate?: string;
}

export interface SponsorshipsState {
    items: SponsorshipItem[];
    loading: boolean;
    editLoading?: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: SponsorshipFilters;
    appliedFilters: SponsorshipFilters;
    selected: SponsorshipItem | null;
}

export const fetchSponsorships = createAsyncThunk(
    'sponsorships/fetch',
    async (params: { page: number; limit: number; filters: SponsorshipFilters }, { rejectWithValue }) => {
        try {
            return await searchSponsorships({
                page: params.page,
                limit: params.limit,
                ...params.filters,
            });
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to load sponsorships');
        }
    }
);

export const createSponsorshipThunk = createAsyncThunk(
    'sponsorships/create',
    async (payload: SponsorshipRecord, { rejectWithValue }) => {
        try {
            return await createSponsorship(payload);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to create sponsorship';
            return rejectWithValue(message);
        }
    }
);

export const updateSponsorshipThunk = createAsyncThunk(
    'sponsorships/update',
    async ({ id, data }: { id: string | number; data: Partial<SponsorshipItem> }, { rejectWithValue }) => {
        try {
            return await updateSponsorship(id, data);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update sponsorship';
            return rejectWithValue(message);
        }
    }
);

export const deleteSponsorshipThunk = createAsyncThunk(
    'sponsorships/delete',
    async (id: string | number, { rejectWithValue }) => {
        try {
            await deleteSponsorship(id);
            return id;
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete sponsorship');
        }
    }
);

const initialState: SponsorshipsState = {
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
            state.draftFilters = action.payload;
            state.page = 1;
        },
        updateDraftFilter<K extends keyof SponsorshipFilters>(
            state: SponsorshipsState,
            action: PayloadAction<{ key: K; value: SponsorshipFilters[K] }>
        ) {
            state.draftFilters[action.payload.key] = action.payload.value;
        },
        applyFilters(state) {
            state.appliedFilters = { ...state.draftFilters };
            state.page = 1;
        },
        resetFilters(state) {
            const initialFilters: SponsorshipFilters = { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' };
            state.draftFilters = initialFilters;
            state.appliedFilters = initialFilters;
            state.page = 1;
        },
        setSelected(state, action: PayloadAction<SponsorshipItem | null>) {
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
                state.error = (action.payload as string) || action.error.message || 'Failed to load';
            })
            .addCase(createSponsorshipThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createSponsorshipThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createSponsorshipThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to create';
            })
            .addCase(updateSponsorshipThunk.pending, (state) => {
                state.editLoading = true;
            })
            .addCase(updateSponsorshipThunk.fulfilled, (state, { payload }) => {
                state.editLoading = false;
                state.items = state.items.map(i => i.id === payload.id ? payload : i);
                if (state.selected?.id === payload.id) state.selected = payload;
            })
            .addCase(updateSponsorshipThunk.rejected, (state, action) => {
                state.editLoading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to update sponsorship';
            })
            .addCase(deleteSponsorshipThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteSponsorshipThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
                if (state.selected?.id === action.payload) {
                    state.selected = null;
                }
            })
            .addCase(deleteSponsorshipThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to delete sponsorship';
            });
    },
});

export const { setPage, setPageSize, setFilters, updateDraftFilter, applyFilters, resetFilters, setSelected, clearSelected, clearError } = sponsorshipsSlice.actions;
export default sponsorshipsSlice.reducer;
