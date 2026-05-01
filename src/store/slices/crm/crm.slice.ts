import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CrmEvent, Thread, Message, CrmLabel, EmailAccount } from '../../../features/crm/types';
import { fetchEventsThunk, fetchThreadsThunk, fetchMessagesThunk, sendReplyThunk, updateLabelsThunk, saveDraftThunk, fetchDraftsThunk, deleteDraftThunk, toggleThreadStarThunk, toggleThreadReadThunk, fetchLabelDefinitionsThunk, fetchEmailAccountsThunk } from './crm.thunks';

export interface CrmState {
    events: CrmEvent[];
    threads: Thread[];
    unreadCount: number;
    messages: Message[];
    drafts: Message[];
    labelDefinitions: CrmLabel[];
    emailAccounts: EmailAccount[];
    activeEventId: number | null;
    accountsActiveEventId: number | null;
    activeDomain: string | null;
    accountsActiveDomain: string | null;
    activeFolder: 'Inbox' | 'Drafts' | 'Sent' | 'Starred' | 'Junk' | 'Trash' | 'Accounts' | 'Contact Bucket';
    selectedThreadId: string | null;
    searchTerm: string;
    accountsSearchTerm: string;
    searchTrigger: number;
    accountsSearchTrigger: number;
    activeEmailAccountId: number | null;
    appliedEmailAccountId: number | null;
    isSidebarOpen: boolean;

    // Applied filters (only updated on search trigger)
    appliedSearchTerm: string;
    appliedDomain: string | null;
    appliedEventId: number | null;

    appliedAccountsSearchTerm: string;
    appliedAccountsDomain: string | null;
    appliedAccountsEventId: number | null;

    currentPage: number;
    totalThreads: number;
    starredCount: number;
    sentCount: number;
    draftsCount: number;
    totalDrafts: number;

    loading: {
        events: boolean;
        threads: boolean;
        messages: boolean;
        drafts: boolean;
        sending: boolean;
        savingDraft: boolean;
    };
    error: string | null;
}

export const initialState: CrmState = {
    events: [],
    threads: [],
    unreadCount: 0,
    messages: [],
    drafts: [],
    labelDefinitions: [],
    emailAccounts: [],
    activeEventId: null,
    accountsActiveEventId: null,
    activeDomain: null,
    accountsActiveDomain: null,
    activeFolder: 'Inbox',
    selectedThreadId: null,
    searchTerm: '',
    accountsSearchTerm: '',
    searchTrigger: 0,
    accountsSearchTrigger: 0,
    activeEmailAccountId: null,
    appliedEmailAccountId: null,

    appliedSearchTerm: '',
    appliedDomain: null,
    appliedEventId: null,

    appliedAccountsSearchTerm: '',
    appliedAccountsDomain: null,
    appliedAccountsEventId: null,

    currentPage: 1,
    totalThreads: 0,
    starredCount: 0,
    sentCount: 0,
    draftsCount: 0,
    totalDrafts: 0,

    isSidebarOpen: false,
    loading: {
        events: false,
        threads: false,
        messages: false,
        drafts: false,
        sending: false,
        savingDraft: false,
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
            state.activeEmailAccountId = null; // Reset email account ID when event changes
            state.currentPage = 1;
        },
        setAccountsActiveEvent(state, action: PayloadAction<number | null>) {
            state.accountsActiveEventId = action.payload;
            state.accountsActiveDomain = null; // Reset domain when event changes
        },
        setActiveDomain(state, action: PayloadAction<string | null>) {
            state.activeDomain = action.payload;
        },
        setAccountsActiveDomain(state, action: PayloadAction<string | null>) {
            state.accountsActiveDomain = action.payload;
        },
        setActiveEmailAccountId(state, action: PayloadAction<number | null>) {
            state.activeEmailAccountId = action.payload;
            state.currentPage = 1;
        },
        setActiveFolder(state, action: PayloadAction<'Inbox' | 'Drafts' | 'Sent' | 'Starred' | 'Junk' | 'Trash' | 'Accounts' | 'Contact Bucket'>) {
            state.activeFolder = action.payload;
        },
        clearSelection(state) {
            state.selectedThreadId = null;
            state.messages = [];
        },
        setSelectedThread(state, action: PayloadAction<string | null>) {
            if (state.selectedThreadId !== action.payload) {
                state.messages = [];
            }
            state.selectedThreadId = action.payload;
        },
        toggleSidebar(state) {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        setSidebarOpen(state, action: PayloadAction<boolean>) {
            state.isSidebarOpen = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
        setSearchTerm(state, action: PayloadAction<string>) {
            state.searchTerm = action.payload;
        },
        setAccountsSearchTerm(state, action: PayloadAction<string>) {
            state.accountsSearchTerm = action.payload;
        },
        triggerSearch: (state) => {
            state.searchTrigger += 1;
            state.appliedSearchTerm = state.searchTerm;
            state.appliedDomain = state.activeDomain;
            state.appliedEventId = state.activeEventId;
            state.appliedEmailAccountId = state.activeEmailAccountId;
        },
        triggerAccountsSearch: (state) => {
            state.accountsSearchTrigger += 1;
            state.appliedAccountsSearchTerm = state.accountsSearchTerm;
            state.appliedAccountsDomain = state.accountsActiveDomain;
            state.appliedAccountsEventId = state.accountsActiveEventId;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
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
            .addCase(fetchThreadsThunk.fulfilled, (state, action) => {
                state.loading.threads = false;
                state.threads = action.payload.threads;
                state.totalThreads = action.payload.total;
                state.unreadCount = action.payload.unreadCount || 0;
                state.starredCount = action.payload.starredCount || 0;
                state.sentCount = action.payload.sentCount || 0;
                state.draftsCount = action.payload.draftsCount || 0;
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
            .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
                state.loading.messages = false;
                state.messages = action.payload;
                // Auto-mark local thread as read
                if (state.selectedThreadId) {
                    const thread = state.threads.find(t => t.id === state.selectedThreadId);
                    if (thread && !thread.isRead) {
                        thread.isRead = true;
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                    }
                }
            })
            .addCase(fetchMessagesThunk.rejected, (state, action) => {
                state.loading.messages = false;
                state.error = action.payload as string;
            })

            // Toggle Thread Read
            .addCase(toggleThreadReadThunk.fulfilled, (state, { payload }) => {
                const thread = state.threads.find(t => t.id === payload.threadId);
                if (thread) {
                    if (thread.isRead && !payload.isRead) {
                        state.unreadCount += 1;
                    } else if (!thread.isRead && payload.isRead) {
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                    }
                    thread.isRead = payload.isRead;
                }
            })
            .addCase(toggleThreadReadThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // Toggle Thread Star
            .addCase(toggleThreadStarThunk.fulfilled, (state, { payload }) => {
                const thread = state.threads.find(t => t.id === payload.threadId);
                if (thread) {
                    thread.isStarred = payload.isStarred;
                }
                // If we are in the Starred folder and unstar a thread, remove it
                if (state.activeFolder === 'Starred' && !payload.isStarred) {
                    state.threads = state.threads.filter(t => t.id !== payload.threadId);
                    state.totalThreads -= 1;
                }
            })
            .addCase(toggleThreadStarThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // Send Reply
            .addCase(sendReplyThunk.pending, (state) => {
                state.loading.sending = true;
            })
            .addCase(sendReplyThunk.fulfilled, (state) => {
                state.loading.sending = false;
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
            })

            // Save Draft
            .addCase(saveDraftThunk.pending, (state) => {
                state.loading.savingDraft = true;
            })
            .addCase(saveDraftThunk.fulfilled, (state, { payload }) => {
                state.loading.savingDraft = false;
                const index = state.drafts.findIndex(d => d.id === payload.id);
                if (index !== -1) {
                    state.drafts[index] = payload;
                } else {
                    state.drafts.unshift(payload);
                }
            })
            .addCase(saveDraftThunk.rejected, (state, action) => {
                state.loading.savingDraft = false;
                state.error = action.payload as string;
            })

            // Fetch Drafts
            .addCase(fetchDraftsThunk.pending, (state) => {
                state.loading.drafts = true;
            })
            .addCase(fetchDraftsThunk.fulfilled, (state, { payload }) => {
                state.loading.drafts = false;
                state.drafts = payload.drafts;
                state.totalDrafts = payload.total;
                state.draftsCount = payload.total;
            })
            .addCase(fetchDraftsThunk.rejected, (state, action) => {
                state.loading.drafts = false;
                state.error = action.payload as string;
            })

            // Delete Draft
            .addCase(deleteDraftThunk.fulfilled, (state, { payload }) => {
                state.drafts = state.drafts.filter(d => d.id !== payload);
            })
            // Fetch Label Definitions
            .addCase(fetchLabelDefinitionsThunk.fulfilled, (state, { payload }) => {
                state.labelDefinitions = payload;
            })
            // Fetch Email Accounts
            .addCase(fetchEmailAccountsThunk.fulfilled, (state, { payload }) => {
                state.emailAccounts = payload;
            });
    },
});

export const {
    setActiveEvent,
    setAccountsActiveEvent,
    setActiveDomain,
    setAccountsActiveDomain,
    setActiveFolder,
    clearSelection,
    setSelectedThread,
    toggleSidebar,
    setSidebarOpen,
    clearError,
    setSearchTerm,
    setAccountsSearchTerm,
    triggerSearch,
    triggerAccountsSearch,
    setPage,
    setActiveEmailAccountId
} = crmSlice.actions;
export default crmSlice.reducer;
