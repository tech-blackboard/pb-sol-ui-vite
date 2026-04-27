import reducer, {
    setActiveEvent,
    setActiveDomain,
    setSelectedThread,
    clearError
} from '../../../../store/slices/crm/crm.slice';
import {
    fetchEventsThunk,
    fetchThreadsThunk,
    fetchMessagesThunk,
    sendReplyThunk,
    updateLabelsThunk
} from '../../../../store/slices/crm/crm.thunks';
import type { Message, CrmEvent, Thread } from '../../../../features/crm/types';
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

    it('should clear error', () => {
        const state = reducer({ ...initialState, error: 'err' }, clearError());
        expect(state.error).toBeNull();
    });

    describe('extraReducers', () => {
        it('handles fetchEventsThunk.rejected (lines 77-78)', () => {
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

        it('handles fetchThreadsThunk.rejected (lines 91-92)', () => {
            const action = { type: fetchThreadsThunk.rejected.type, payload: 'Fetch Threads Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.threads).toBe(false);
            expect(state.error).toBe('Fetch Threads Failed');
        });

        it('handles fetchMessagesThunk.rejected (lines 105-106)', () => {
            const action = { type: fetchMessagesThunk.rejected.type, payload: 'Fetch Messages Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.messages).toBe(false);
            expect(state.error).toBe('Fetch Messages Failed');
        });

        it('handles sendReplyThunk.rejected', () => {
            const action = { type: sendReplyThunk.rejected.type, payload: 'Send Failed' };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.loading.sending).toBe(false);
            expect(state.error).toBe('Send Failed');
        });

        it('handles updateLabelsThunk.fulfilled (lines 124-127)', () => {
            const startState = {
                ...initialState,
                messages: [{ id: 'm1', labels: [] } as unknown as Message]
            };
            const action = {
                type: updateLabelsThunk.fulfilled.type,
                payload: { messageId: 'm1', labels: ['Tag1'] }
            };
            const state = reducer(startState, action as UnknownAction);
            expect(state.messages[0].labels).toEqual(['Tag1']);
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

        it('handles fetchMessagesThunk.fulfilled', () => {
            const messages = [{ id: 'm1' }] as unknown as Message[];
            const state = reducer(initialState, fetchMessagesThunk.fulfilled(messages, '', 't1'));
            expect(state.loading.messages).toBe(false);
            expect(state.messages).toEqual(messages);
        });

        it('handles updateLabelsThunk fulfillment', () => {
            // This covers line 64 in crm.thunks.ts
            const payload = { messageId: 'm1', labels: ['Tag1'] };
            const action = updateLabelsThunk.fulfilled(payload, '', { messageId: 'm1', labels: ['Tag1'] });
            expect(action.payload).toEqual(payload);
        });
    });
});
