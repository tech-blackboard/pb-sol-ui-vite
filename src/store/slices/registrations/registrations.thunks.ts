import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { searchRegistrations, deleteRegistration, createRegistration, updateRegistration } from '../../../services/registrations';
import type { RegistrationFilters } from './registrations.types';
import type { RegistrationRecord } from '../../../features/abstracts/types';
import type { RegistrationItem } from '../../../services/registrations';


export const fetchRegistrations = createAsyncThunk(
    'registrations/fetch',
    async (params: { page: number; limit: number; filters: RegistrationFilters }, { rejectWithValue }) => {
        try {
            const result = await searchRegistrations({
                page: params.page,
                limit: params.limit,
                ...params.filters,
            });
            return result;
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to load registrations');
        }
    }
);

export const deleteRegistrationThunk = createAsyncThunk(
    'registrations/delete',
    async (id: string | number, { rejectWithValue }) => {
        try {
            await deleteRegistration(id);
            return id;
        } catch (err: unknown) {
            return rejectWithValue(axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete registration');
        }
    }
);

export const createRegistrationThunk = createAsyncThunk(
    'registrations/create',
    async (data: RegistrationRecord, { rejectWithValue }) => {
        try {
            const result = await createRegistration(data);
            return result;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to create registration';
            return rejectWithValue(message);
        }
    }
);

export const updateRegistrationThunk = createAsyncThunk(
    'registrations/update',
    async ({ id, data }: { id: string | number; data: Partial<RegistrationItem> }, { rejectWithValue }) => {
        try {
            const result = await updateRegistration(id, data);
            return result;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update registration';
            return rejectWithValue(message);
        }
    }
);

