import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import * as crmService from '../../../features/crm/services/crmService';

export const fetchEventsThunk = createAsyncThunk(
    'crm/fetchEvents',
    async (_, { rejectWithValue }) => {
        try {
            return await crmService.fetchCrmEvents();
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch events';
            return rejectWithValue(message);
        }
    }
);

export const fetchThreadsThunk = createAsyncThunk(
    'crm/fetchThreads',
    async ({ eventId, search, domain, page, limit }: { eventId: number; search?: string; domain?: string; page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            return await crmService.fetchThreads(eventId, search, domain, page, limit);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch threads';
            return rejectWithValue(message);
        }
    }
);

export const fetchMessagesThunk = createAsyncThunk(
    'crm/fetchMessages',
    async (threadId: string, { rejectWithValue }) => {
        try {
            return await crmService.fetchThreadMessages(threadId);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch messages';
            return rejectWithValue(message);
        }
    }
);

export const sendReplyThunk = createAsyncThunk(
    'crm/sendReply',
    async (payload: {
        contactId: number;
        eventId: number;
        subject: string;
        textBody: string;
        htmlBody: string;
        fromEmail?: string;
        emailAccountId?: number;
        draftId?: string;
        threadId?: string;
    }, { rejectWithValue }) => {
        try {
            return await crmService.sendReply(payload);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to send reply';
            return rejectWithValue(message);
        }
    }
);

export const updateLabelsThunk = createAsyncThunk(
    'crm/updateLabels',
    async ({ messageId, labels }: { messageId: string; labels: string[] }, { rejectWithValue }) => {
        try {
            await crmService.updateMessageLabels(messageId, labels);
            return { messageId, labels };
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update labels';
            return rejectWithValue(message);
        }
    }
);
export const saveDraftThunk = createAsyncThunk(
    'crm/saveDraft',
    async (payload: {
        contactId: number;
        eventId: number;
        subject: string;
        textBody?: string;
        htmlBody?: string;
        fromEmail?: string;
        emailAccountId?: number;
        threadId?: string;
        draftId?: string;
    }, { rejectWithValue }) => {
        try {
            return await crmService.saveDraft(payload);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to save draft';
            return rejectWithValue(message);
        }
    }
);

export const fetchDraftsThunk = createAsyncThunk(
    'crm/fetchDrafts',
    async ({ page, limit }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
        try {
            return await crmService.fetchDrafts(page, limit);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch drafts';
            return rejectWithValue(message);
        }
    }
);

export const deleteDraftThunk = createAsyncThunk(
    'crm/deleteDraft',
    async (draftId: string, { rejectWithValue }) => {
        try {
            await crmService.deleteDraft(draftId);
            return draftId;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete draft';
            return rejectWithValue(message);
        }
    }
);
