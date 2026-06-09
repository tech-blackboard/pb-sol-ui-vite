import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { searchContacts, createContact, updateContact, deleteContact, type ContactItem } from '../../../services/contacts';


export interface ContactFilters {
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    website_id?: number | string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface ContactsState {
    items: ContactItem[];
    loading: boolean;
    editLoading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
    draftFilters: ContactFilters;
    appliedFilters: ContactFilters;
    selected: ContactItem | null;
}

export const fetchContacts = createAsyncThunk(
    'contacts/fetch',
    async (params: { page: number; limit: number; filters: ContactFilters }, { rejectWithValue }) => {
        try {
            return await searchContacts({
                page: params.page,
                limit: params.limit,
                ...params.filters,
            });
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to load contacts');
        }
    }
);

export const createContactThunk = createAsyncThunk(
    'contacts/create',
    async (payload: Partial<ContactItem>, { rejectWithValue }) => {
        try {
            return await createContact(payload);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to create contact';
            return rejectWithValue(message);
        }
    }
);

export const updateContactThunk = createAsyncThunk(
    'contacts/update',
    async ({ id, data }: { id: string | number; data: Partial<ContactItem> }, { rejectWithValue }) => {
        try {
            return await updateContact(id, data);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update contact';
            return rejectWithValue(message);
        }
    }
);

export const deleteContactThunk = createAsyncThunk(
    'contacts/delete',
    async (id: string | number, { rejectWithValue }) => {
        try {
            await deleteContact(id);
            return id;
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete contact');
        }
    }
);

const initialState: ContactsState = {
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

const contactsSlice = createSlice({
    name: 'contacts',
    initialState,
    reducers: {
        setPage(state, action: PayloadAction<number>) {
            state.page = action.payload;
        },
        setPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload;
            state.page = 1;
        },
        setFilters(state, action: PayloadAction<ContactFilters>) {
            state.appliedFilters = action.payload;
            state.draftFilters = action.payload;
            state.page = 1;
        },
        updateDraftFilter<K extends keyof ContactFilters>(
            state: ContactsState,
            action: PayloadAction<{ key: K; value: ContactFilters[K] }>
        ) {
            state.draftFilters[action.payload.key] = action.payload.value;
        },
        applyFilters(state) {
            state.appliedFilters = { ...state.draftFilters };
            state.page = 1;
        },
        resetFilters(state) {
            const initialFilters: ContactFilters = { search: '', sortBy: 'now', sortOrder: 'DESC' };
            state.draftFilters = initialFilters;
            state.appliedFilters = initialFilters;
            state.page = 1;
        },
        setSelected(state, action: PayloadAction<ContactItem | null>) {
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
            .addCase(fetchContacts.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchContacts.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload.items;
                state.total = payload.total;
            })
            .addCase(fetchContacts.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to load';
            })
            .addCase(createContactThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createContactThunk.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = [payload, ...state.items];
                state.total += 1;
            })
            .addCase(createContactThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to create contact';
            })
            .addCase(updateContactThunk.pending, (state) => {
                state.editLoading = true;
            })
            .addCase(updateContactThunk.fulfilled, (state, { payload }) => {
                state.editLoading = false;
                state.items = state.items.map(i => i.id === payload.id ? payload : i);
                if (state.selected?.id === payload.id) state.selected = payload;
            })
            .addCase(updateContactThunk.rejected, (state, action) => {
                state.editLoading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to update contact';
            })
            .addCase(deleteContactThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteContactThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
                if (state.selected?.id === action.payload) {
                    state.selected = null;
                }
            })
            .addCase(deleteContactThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || action.error.message || 'Failed to delete contact';
            });
    },
});

export const { setPage, setPageSize, setFilters, updateDraftFilter, applyFilters, resetFilters, setSelected, clearSelected, clearError } = contactsSlice.actions;
export default contactsSlice.reducer;
