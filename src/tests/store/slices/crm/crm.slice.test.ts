import reducer, {
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
    setPage
} from '../../../../store/slices/crm/crm.slice';
import {
    fetchEventsThunk,
    fetchThreadsThunk,
    fetchMessagesThunk,
    sendReplyThunk,
    updateLabelsThunk,
    toggleThreadStarThunk,
    toggleThreadReadThunk,
    saveDraftThunk,
    fetchDraftsThunk,
    deleteDraftThunk,
    fetchLabelDefinitionsThunk
} from '../../../../store/slices/crm/crm.thunks';
import type { Message, CrmEvent, Thread, CrmLabel } from '../../../../features/crm/types';
import type { CrmState } from '../../../../store/slices/crm/crm.slice';
import type { UnknownAction } from '@reduxjs/toolkit';

describe('crm slice', () => {
    const initialState = reducer(undefined, { type: 'INIT' });

    it('should return initial state', () => {
        expect(initialState.events).toEqual([]);
        expect(initialState.threads).toEqual([]);
        expect(initialState.loading.events).toBe(false);
    });

    it('should set active event', () => {
        const state = reducer(initialState, setActiveEvent(123));
        expect(state.activeEventId).toBe(123);
        expect(state.activeDomain).toBeNull();
    });

    it('should set active domain', () => {
        const state = reducer(initialState, setActiveDomain('example.com'));
        expect(state.activeDomain).toBe('example.com');
        expect(state.selectedThreadId).toBeNull();
    });

    it('should set selected thread', () => {
        const state = reducer({ ...initialState, messages: [{ id: 'm1' } as unknown as Message] }, setSelectedThread('t1'));
        expect(state.selectedThreadId).toBe('t1');
        // If null, should clear messages
        const clearedState = reducer(state, setSelectedThread(null));
        expect(clearedState.messages).toEqual([]);
    });

    it('should set accounts active event', () => {
        const state = reducer(initialState, setAccountsActiveEvent(456));
        expect(state.accountsActiveEventId).toBe(456);
        expect(state.accountsActiveDomain).toBeNull();
    });

    it('should set accounts active domain', () => {
        const state = reducer(initialState, setAccountsActiveDomain('crm.com'));
        expect(state.accountsActiveDomain).toBe('crm.com');
    });

    it('should set active folder', () => {
        const state = reducer(initialState, setActiveFolder('Drafts'));
        expect(state.activeFolder).toBe('Drafts');
    });

    it('should clear selection', () => {
        const startState = { ...initialState, selectedThreadId: 't1', messages: [{ id: 'm1' } as unknown as Message] };
        const state = reducer(startState, clearSelection());
        expect(state.selectedThreadId).toBeNull();
        expect(state.messages).toEqual([]);
    });

    it('should toggle sidebar', () => {
        const state1 = reducer(initialState, toggleSidebar());
        expect(state1.isSidebarOpen).toBe(true); // initialState is false
        const state2 = reducer(state1, toggleSidebar());
        expect(state2.isSidebarOpen).toBe(false);
    });

    it('should set sidebar open', () => {
        const state = reducer(initialState, setSidebarOpen(false));
        expect(state.isSidebarOpen).toBe(false);
    });

    it('should clear error', () => {
        const state = reducer({ ...initialState, error: 'err' }, clearError());
        expect(state.error).toBeNull();
    });

    it('should set search term', () => {
        const state = reducer(initialState, setSearchTerm('test'));
        expect(state.searchTerm).toBe('test');
    });

    it('should set accounts search term', () => {
        const state = reducer(initialState, setAccountsSearchTerm('acc'));
        expect(state.accountsSearchTerm).toBe('acc');
    });

    it('should trigger search', () => {
        const startState = { ...initialState, searchTerm: 'find me', activeDomain: 'd.com', activeEventId: 1, searchTrigger: 0 };
        const state = reducer(startState, triggerSearch());
        expect(state.searchTrigger).toBe(1);
        expect(state.appliedSearchTerm).toBe('find me');
        expect(state.appliedDomain).toBe('d.com');
        expect(state.appliedEventId).toBe(1);
    });

    it('should trigger accounts search', () => {
        const startState = { ...initialState, accountsSearchTerm: 'acc-find', accountsActiveDomain: 'a.com', accountsActiveEventId: 2, accountsSearchTrigger: 0 };
        const state = reducer(startState, triggerAccountsSearch());
        expect(state.accountsSearchTrigger).toBe(1);
        expect(state.appliedAccountsSearchTerm).toBe('acc-find');
        expect(state.appliedAccountsDomain).toBe('a.com');
        expect(state.appliedAccountsEventId).toBe(2);
    });

    it('should set page', () => {
        const state = reducer(initialState, setPage(5));
        expect(state.currentPage).toBe(5);
    });

    describe('extraReducers', () => {
        it('handles fetchEventsThunk.rejected', () => {
            const action = { type: fetchEventsThunk.rejected.type, payload: 'Fetch Events Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.events).toBe(false);
            expect(state.error).toBe('Fetch Events Failed');
        });

        it('handles fetchEventsThunk.pending', () => {
            const state = reducer(initialState, fetchEventsThunk.pending('', undefined));
            expect(state.loading.events).toBe(true);
            expect(state.error).toBeNull();
        });

        it('handles fetchEventsThunk.fulfilled and selects first event if none active', () => {
            const events = [{ id: 1, name: 'Event 1' }, { id: 2, name: 'Event 2' }] as unknown as CrmEvent[];
            const state = reducer(initialState, fetchEventsThunk.fulfilled(events, '', undefined));
            expect(state.loading.events).toBe(false);
            expect(state.events).toEqual(events);
            expect(state.activeEventId).toBe(1);
        });

        it('handles fetchEventsThunk.fulfilled and keeps active event', () => {
            const startState = { ...initialState, activeEventId: 2 };
            const events = [{ id: 1, name: 'Event 1' }] as unknown as CrmEvent[];
            const state = reducer(startState, fetchEventsThunk.fulfilled(events, '', undefined));
            expect(state.activeEventId).toBe(2);
        });

        it('handles fetchEventsThunk.fulfilled with non-array payload', () => {
            const state = reducer(initialState, fetchEventsThunk.fulfilled({} as unknown as CrmEvent[], '', undefined));
            expect(state.events).toEqual([]);
        });

        it('handles fetchThreadsThunk.rejected', () => {
            const action = { type: fetchThreadsThunk.rejected.type, payload: 'Fetch Threads Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.threads).toBe(false);
            expect(state.error).toBe('Fetch Threads Failed');
        });

        it('handles fetchThreadsThunk.pending', () => {
            const state = reducer(initialState, fetchThreadsThunk.pending('', { eventId: 1 }));
            expect(state.loading.threads).toBe(true);
        });

        it('handles fetchThreadsThunk.fulfilled', () => {
            const payload = {
                threads: [{ id: 't1' } as unknown as Thread],
                total: 1,
                unreadCount: 1,
                starredCount: 0,
                sentCount: 0,
                draftsCount: 0
            };
            const state = reducer(initialState, fetchThreadsThunk.fulfilled(payload, '', { eventId: 1 }));
            expect(state.loading.threads).toBe(false);
            expect(state.threads).toEqual(payload.threads);
            expect(state.totalThreads).toBe(1);
        });

        it('handles fetchThreadsThunk.fulfilled with missing counts', () => {
            const payload = {
                threads: [],
                total: 0
                // counts missing
            } as unknown as { threads: Thread[]; total: number; unreadCount: number; starredCount: number; sentCount: number; draftsCount: number };
            const state = reducer(initialState, fetchThreadsThunk.fulfilled(payload, '', { eventId: 1 }));
            expect(state.unreadCount).toBe(0);
            expect(state.starredCount).toBe(0);
        });

        it('handles fetchMessagesThunk.rejected', () => {
            const action = { type: fetchMessagesThunk.rejected.type, payload: 'Fetch Messages Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.messages).toBe(false);
            expect(state.error).toBe('Fetch Messages Failed');
        });

        it('handles fetchMessagesThunk.pending', () => {
            const state = reducer(initialState, fetchMessagesThunk.pending('', 't1'));
            expect(state.loading.messages).toBe(true);
        });

        it('handles fetchMessagesThunk.fulfilled and marks thread as read', () => {
            const startState: CrmState = {
                ...initialState,
                selectedThreadId: 't1',
                threads: [{ id: 't1', isRead: false } as unknown as Thread],
                unreadCount: 1
            };
            const messages = [{ id: 'm1' }] as unknown as Message[];
            const state = reducer(startState, fetchMessagesThunk.fulfilled(messages, '', 't1'));
            expect(state.loading.messages).toBe(false);
            expect(state.messages).toEqual(messages);
            expect(state.threads[0].isRead).toBe(true);
            expect(state.unreadCount).toBe(0);
        });

        it('handles sendReplyThunk.rejected', () => {
            const action = { type: sendReplyThunk.rejected.type, payload: 'Send Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.sending).toBe(false);
            expect(state.error).toBe('Send Failed');
        });

        it('handles sendReplyThunk.pending', () => {
            const state = reducer(initialState, sendReplyThunk.pending('', { contactId: 1, eventId: 1, subject: '', textBody: '', htmlBody: '' }));
            expect(state.loading.sending).toBe(true);
        });

        it('handles sendReplyThunk.fulfilled', () => {
            const state = reducer(
                { ...initialState, loading: { ...initialState.loading, sending: true } }, 
                sendReplyThunk.fulfilled({ status: 'ok', messageId: 'm1' }, '', { contactId: 1, eventId: 1, subject: '', textBody: '', htmlBody: '' })
            );
            expect(state.loading.sending).toBe(false);
        });

        it('handles updateLabelsThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                messages: [{ id: 'm1', labels: [] } as unknown as Message]
            };
            const action = updateLabelsThunk.fulfilled({ messageId: 'm1', labels: ['Tag1'] }, '', { messageId: 'm1', labels: ['Tag1'] });
            const state = reducer(startState, action);
            expect(state.messages[0].labels).toEqual(['Tag1']);
        });

        it('handles toggleThreadStarThunk.fulfilled (toggle star)', () => {
            const startState = {
                ...initialState,
                threads: [{ id: 't1', isStarred: false } as unknown as Thread]
            };
            const payload = { threadId: 't1', isStarred: true };
            const state = reducer(startState, toggleThreadStarThunk.fulfilled(payload, '', payload));
            expect(state.threads[0].isStarred).toBe(true);
        });

        it('handles toggleThreadStarThunk.fulfilled (remove from Starred folder)', () => {
            const startState: CrmState = {
                ...initialState,
                activeFolder: 'Starred' as const,
                threads: [{ id: 't1', isStarred: true } as unknown as Thread],
                totalThreads: 1
            };
            const payload = { threadId: 't1', isStarred: false };
            const state = reducer(startState, toggleThreadStarThunk.fulfilled(payload, '', payload));
            expect(state.threads).toHaveLength(0);
            expect(state.totalThreads).toBe(0);
        });

        it('handles toggleThreadStarThunk.rejected', () => {
            const action = { type: toggleThreadStarThunk.rejected.type, payload: 'Star Error' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.error).toBe('Star Error');
        });

        it('handles toggleThreadReadThunk.fulfilled (mark as unread)', () => {
            const startState = {
                ...initialState,
                threads: [{ id: 't1', isRead: true } as unknown as Thread],
                unreadCount: 5
            };
            const payload = { threadId: 't1', isRead: false };
            const state = reducer(startState, toggleThreadReadThunk.fulfilled(payload, '', payload));
            expect(state.threads[0].isRead).toBe(false);
            expect(state.unreadCount).toBe(6);
        });

        it('handles toggleThreadReadThunk.fulfilled (mark as read)', () => {
            const startState = {
                ...initialState,
                threads: [{ id: 't1', isRead: false } as unknown as Thread],
                unreadCount: 5
            };
            const payload = { threadId: 't1', isRead: true };
            const state = reducer(startState, toggleThreadReadThunk.fulfilled(payload, '', payload));
            expect(state.threads[0].isRead).toBe(true);
            expect(state.unreadCount).toBe(4);
        });

        it('handles toggleThreadReadThunk.rejected', () => {
            const action = { type: toggleThreadReadThunk.rejected.type, payload: 'Read Error' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.error).toBe('Read Error');
        });

        it('handles saveDraftThunk.fulfilled (update existing)', () => {
            const startState: CrmState = {
                ...initialState,
                drafts: [{ id: 'd1', subject: 'Old' } as unknown as Message]
            };
            const payload = { id: 'd1', subject: 'New' } as unknown as Message;
            const state = reducer(startState, saveDraftThunk.fulfilled(payload, '', { contactId: 1, eventId: 1, subject: 'New' }));
            expect(state.drafts[0].subject).toBe('New');
            expect(state.loading.savingDraft).toBe(false);
        });

        it('handles saveDraftThunk.fulfilled (add new)', () => {
            const payload = { id: 'd2', subject: 'New' } as unknown as Message;
            const state = reducer(initialState, saveDraftThunk.fulfilled(payload, '', { contactId: 1, eventId: 1, subject: 'New' }));
            expect(state.drafts[0].id).toBe('d2');
        });

        it('handles saveDraftThunk.pending', () => {
            const state = reducer(initialState, saveDraftThunk.pending('', { contactId: 1, eventId: 1, subject: 'New' }));
            expect(state.loading.savingDraft).toBe(true);
        });

        it('handles saveDraftThunk.rejected', () => {
            const action = { type: saveDraftThunk.rejected.type, payload: 'Save Draft Error' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.savingDraft).toBe(false);
            expect(state.error).toBe('Save Draft Error');
        });

        it('handles fetchDraftsThunk.fulfilled', () => {
            const payload = { drafts: [{ id: 'd1' } as unknown as Message], total: 10 };
            const state = reducer(initialState, fetchDraftsThunk.fulfilled(payload, '', {}));
            expect(state.loading.drafts).toBe(false);
            expect(state.drafts).toHaveLength(1);
            expect(state.totalDrafts).toBe(10);
            expect(state.draftsCount).toBe(10); // Check sync
        });

        it('handles fetchDraftsThunk.pending', () => {
            const state = reducer(initialState, fetchDraftsThunk.pending('', {}));
            expect(state.loading.drafts).toBe(true);
        });

        it('handles fetchDraftsThunk.rejected', () => {
            const action = { type: fetchDraftsThunk.rejected.type, payload: 'Fetch Drafts Error' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.drafts).toBe(false);
            expect(state.error).toBe('Fetch Drafts Error');
        });

        it('handles deleteDraftThunk.fulfilled', () => {
            const startState: CrmState = {
                ...initialState,
                drafts: [{ id: 'd1' } as unknown as Message]
            };
            const state = reducer(startState, deleteDraftThunk.fulfilled('d1', '', 'd1'));
            expect(state.drafts).toHaveLength(0);
        });

        it('handles fetchLabelDefinitionsThunk.fulfilled', () => {
            const labels = [{ id: 1, name: 'L1' } as unknown as CrmLabel];
            const state = reducer(initialState, fetchLabelDefinitionsThunk.fulfilled(labels, '', undefined));
            expect(state.labelDefinitions).toEqual(labels);
        });
    });
});