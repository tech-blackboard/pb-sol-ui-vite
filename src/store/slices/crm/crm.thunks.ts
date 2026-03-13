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
    async (eventId: number, { rejectWithValue }) => {
        try {
            return await crmService.fetchThreads(eventId);
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
        threadId: string;
        subject: string;
        textBody: string;
        htmlBody: string;
        replyTo?: string;
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
