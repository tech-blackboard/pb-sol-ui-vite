import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { searchAccRegistrations, createAccRegistration, updateAccRegistration, deleteAccRegistration, type AccRegistrationItem } from '../../../services/accRegistrations';

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
    items: AccRegistrationItem[];
    loading: boolean;
    editLoading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: AccRegistrationFilters;
    appliedFilters: AccRegistrationFilters;
    selected: AccRegistrationItem | null;
}

export const fetchAccRegistrations = createAsyncThunk(
    'accRegistrations/fetch',
    async (params: { page: number; limit: number; filters: AccRegistrationFilters }, { rejectWithValue }) => {
        try {
            return await searchAccRegistrations({
                page: params.page,
                limit: params.limit,
                ...params.filters,
            });
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to load');
        }
    }
);

export const createAccRegistrationThunk = createAsyncThunk(
    'accRegistrations/create',
    async (data: Partial<AccRegistrationItem>, { rejectWithValue }) => {
        try {
            return await createAccRegistration(data);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to create registration';
            return rejectWithValue(message);
        }
    }
);

export const updateAccRegistrationThunk = createAsyncThunk(
    'accRegistrations/update',
    async ({ id, data }: { id: string | number; data: Partial<AccRegistrationItem> }, { rejectWithValue }) => {
        try {
            return await updateAccRegistration(id, data);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update acc-registration';
            return rejectWithValue(message);
        }
    }
);

export const deleteAccRegistrationThunk = createAsyncThunk(
    'accRegistrations/delete',
    async (id: string | number, { rejectWithValue }) => {
        try {
            await deleteAccRegistration(id);
            return id;
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete accommodation registration');
        }
    }
);

const initialState: AccRegistrationsState = {
    items: [],
    loading: false,
    editLoading: false,
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
        updateDraftFilter<K extends keyof AccRegistrationFilters>(
            state: AccRegistrationsState,
            action: PayloadAction<{ key: K; value: AccRegistrationFilters[K] }>
        ) {
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
        setSelected(state, action: PayloadAction<AccRegistrationItem | null>) {
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
                state.error = (action.payload as string) || action.error.message || 'Failed to load';
            })
            .addCase(createAccRegistrationThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createAccRegistrationThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createAccRegistrationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to create';
            })
            .addCase(updateAccRegistrationThunk.pending, (state) => {
                state.editLoading = true;
            })
            .addCase(updateAccRegistrationThunk.fulfilled, (state, { payload }) => {
                state.editLoading = false;
                state.items = state.items.map(i => i.id === payload.id ? payload : i);
                if (state.selected?.id === payload.id) state.selected = payload;
            })
            .addCase(updateAccRegistrationThunk.rejected, (state, action) => {
                state.editLoading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to update acc-registration';
            })
            .addCase(deleteAccRegistrationThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteAccRegistrationThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
                if (state.selected?.id === action.payload) {
                    state.selected = null;
                }
            })
            .addCase(deleteAccRegistrationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to delete accommodation registration';
            });
    },
});

export const { setPage, setPageSize, setFilters, updateDraftFilter, applyFilters, resetFilters, setSelected, clearSelected, clearError } = accRegistrationsSlice.actions;
export default accRegistrationsSlice.reducer;
