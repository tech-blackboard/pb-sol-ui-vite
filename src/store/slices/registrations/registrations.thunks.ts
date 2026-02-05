import { createAsyncThunk } from '@reduxjs/toolkit';
import { searchRegistrations, deleteRegistration, createRegistration } from '../../../services/registrations';
import type { RegistrationFilters } from './registrations.types';


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
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to load registrations');
        }
    }
);

export const deleteRegistrationThunk = createAsyncThunk(
    'registrations/delete',
    async (id: string | number) => {
        await deleteRegistration(id);
        return id;
    }
);

export const createRegistrationThunk = createAsyncThunk(
    'registrations/create',
    async (data: any, { rejectWithValue }) => {
        try {
            const result = await createRegistration(data);
            return result;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to create registration';
            return rejectWithValue(message);
        }
    }
);
