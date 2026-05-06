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
    async ({ eventId, search, domain, emailAccountId, folder, page, limit, label }: { eventId?: number; search?: string; domain?: string; emailAccountId?: number; folder?: string; page?: number; limit?: number; label?: string }, { rejectWithValue }) => {
        try {
            return await crmService.fetchThreads(eventId, search, domain, emailAccountId, folder, page, limit, label);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch threads';
            return rejectWithValue(message);
        }
    }
);

export const fetchEmailAccountsThunk = createAsyncThunk(
    'crm/fetchEmailAccounts',
    async (eventId: number | undefined, { rejectWithValue }) => {
        try {
            return await crmService.fetchEmailAccounts(eventId);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch email accounts';
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

export const toggleThreadStarThunk = createAsyncThunk(
    'crm/toggleThreadStar',
    async ({ threadId, isStarred }: { threadId: string; isStarred: boolean }, { rejectWithValue }) => {
        try {
            await crmService.toggleThreadStar(threadId, isStarred);
            return { threadId, isStarred };
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update star status';
            return rejectWithValue(message);
        }
    }
);

export const toggleThreadReadThunk = createAsyncThunk(
    'crm/toggleThreadRead',
    async ({ threadId, isRead }: { threadId: string; isRead: boolean }, { rejectWithValue }) => {
        try {
            await crmService.updateThreadReadStatus(threadId, isRead);
            return { threadId, isRead };
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to update read status';
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
    async ({ page, limit, eventId }: { page?: number; limit?: number; eventId?: number } = {}, { rejectWithValue }) => {
        try {
            return await crmService.fetchDrafts(page, limit, eventId);
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
            return rejectWithValue(Array.isArray(message) ? message.join(', ') : message);
        }
    }
);

export const fetchLabelDefinitionsThunk = createAsyncThunk(
    'crm/fetchLabelDefinitions',
    async (_, { rejectWithValue }) => {
        try {
            return await crmService.fetchLabelDefinitions();
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to fetch label definitions';
            return rejectWithValue(message);
        }
    }
);

export const trashThreadsThunk = createAsyncThunk(
    'crm/trashThreads',
    async (threadIds: string[], { rejectWithValue }) => {
        try {
            await crmService.trashThreads(threadIds);
            return threadIds;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to move threads to trash';
            return rejectWithValue(Array.isArray(message) ? message.join(', ') : message);
        }
    }
);

export const restoreThreadsThunk = createAsyncThunk(
    'crm/restoreThreads',
    async (threadIds: string[], { rejectWithValue }) => {
        try {
            await crmService.restoreThreads(threadIds);
            return threadIds;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to restore threads from trash';
            return rejectWithValue(Array.isArray(message) ? message.join(', ') : message);
        }
    }
);

export const deleteThreadsPermanentlyThunk = createAsyncThunk(
    'crm/deleteThreadsPermanently',
    async (threadIds: string[], { rejectWithValue }) => {
        try {
            await crmService.deleteThreadsPermanently(threadIds);
            return threadIds;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to delete threads permanently';
            return rejectWithValue(Array.isArray(message) ? message.join(', ') : message);
        }
    }
);

export const emptyTrashThunk = createAsyncThunk(
    'crm/emptyTrash',
    async (eventId: number, { rejectWithValue }) => {
        try {
            await crmService.emptyTrash(eventId);
            return eventId;
        } catch (err: unknown) {
            const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Failed to empty trash';
            return rejectWithValue(Array.isArray(message) ? message.join(', ') : message);
        }
    }
);
