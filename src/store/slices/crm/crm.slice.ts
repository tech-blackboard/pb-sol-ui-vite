import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CrmEvent, Thread, Message } from '../../../features/crm/types';
import { fetchEventsThunk, fetchThreadsThunk, fetchMessagesThunk, sendReplyThunk, updateLabelsThunk } from './crm.thunks';

interface CrmState {
    events: CrmEvent[];
    threads: Thread[];
    messages: Message[];
    activeEventId: number | null;
    activeDomain: string | null;
    selectedThreadId: string | null;

    loading: {
        events: boolean;
        threads: boolean;
        messages: boolean;
        sending: boolean;
    };
    error: string | null;
}

const initialState: CrmState = {
    events: [],
    threads: [],
    messages: [],
    activeEventId: null,
    activeDomain: null,
    selectedThreadId: null,

    loading: {
        events: false,
        threads: false,
        messages: false,
        sending: false,
    },
    error: null,
};

const crmSlice = createSlice({
    name: 'crm',
    initialState,
    reducers: {
        setActiveEvent(state, action: PayloadAction<number | null>) {
            state.activeEventId = action.payload;
            state.activeDomain = null; // Reset domain when event changes
            state.selectedThreadId = null; // Reset selection to return to list view
        },
        setActiveDomain(state, action: PayloadAction<string | null>) {
            state.activeDomain = action.payload;
            state.selectedThreadId = null; // Reset selection to return to list view
        },
        setSelectedThread(state, action: PayloadAction<string | null>) {
            state.selectedThreadId = action.payload;
            if (action.payload === null) {
                state.messages = [];
            }
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Events
            .addCase(fetchEventsThunk.pending, (state) => {
                state.loading.events = true;
                state.error = null;
            })
            .addCase(fetchEventsThunk.fulfilled, (state, { payload }) => {
                state.loading.events = false;
                // Defensive check: ensure payload is an array to prevent crashes if API returns unexpected data
                if (Array.isArray(payload)) {
                    state.events = payload;
                    if (payload.length > 0 && !state.activeEventId) {
                        state.activeEventId = payload[0].id;
                    }
                } else {
                    console.error('CRM: fetchEvents returned non-array payload', payload);
                    state.events = [];
                }
            })
            .addCase(fetchEventsThunk.rejected, (state, action) => {
                state.loading.events = false;
                state.error = action.payload as string;
            })

            // Fetch Threads
            .addCase(fetchThreadsThunk.pending, (state) => {
                state.loading.threads = true;
                state.error = null;
            })
            .addCase(fetchThreadsThunk.fulfilled, (state, { payload }) => {
                state.loading.threads = false;
                state.threads = payload;
            })
            .addCase(fetchThreadsThunk.rejected, (state, action) => {
                state.loading.threads = false;
                state.error = action.payload as string;
            })

            // Fetch Messages
            .addCase(fetchMessagesThunk.pending, (state) => {
                state.loading.messages = true;
                state.error = null;
            })
            .addCase(fetchMessagesThunk.fulfilled, (state, { payload }) => {
                state.loading.messages = false;
                state.messages = payload;
            })
            .addCase(fetchMessagesThunk.rejected, (state, action) => {
                state.loading.messages = false;
                state.error = action.payload as string;
            })

            // Send Reply
            .addCase(sendReplyThunk.pending, (state) => {
                state.loading.sending = true;
            })
            .addCase(sendReplyThunk.fulfilled, (state) => {
                state.loading.sending = false;
                // Optionally fetch messages again or update local state
            })
            .addCase(sendReplyThunk.rejected, (state, action) => {
                state.loading.sending = false;
                state.error = action.payload as string;
            })

            // Update Labels
            .addCase(updateLabelsThunk.fulfilled, (state, { payload }) => {
                const message = state.messages.find(m => m.id === payload.messageId);
                if (message) {
                    message.labels = payload.labels;
                }
            });
    },
});

export const { setActiveEvent, setActiveDomain, setSelectedThread, clearError } = crmSlice.actions;
export default crmSlice.reducer;
