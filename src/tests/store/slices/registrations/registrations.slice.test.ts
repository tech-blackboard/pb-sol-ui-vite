import reducer, {
    setSelected,
    clearSelected,
    setPage,
    setPageSize,
    updateDraftFilter,
    applyFilters,
    resetFilters,
    clearError
} from '../../../../store/slices/registrations/registrations.slice';
import { fetchRegistrations, deleteRegistrationThunk, createRegistrationThunk, updateRegistrationThunk } from '../../../../store/slices/registrations/registrations.thunks';
import type { RegistrationItem } from '../../../../services/registrations';
import type { RegistrationRecord } from '../../../../features/abstracts/types';
import type { UnknownAction } from '@reduxjs/toolkit';

describe('registrations slice', () => {
    const initialState = reducer(undefined, { type: 'INIT' });

    it('should return initial state', () => {
        expect(initialState.page).toBe(1);
        expect(initialState.items).toEqual([]);
        expect(initialState.loading).toBe(false);
    });

    it('should set selected', () => {
        const item = { id: 1, name: 'Reg' } as RegistrationItem;
        const state = reducer(initialState, setSelected(item));
        expect(state.selected).toEqual(item);
    });

    it('should clear selected', () => {
        const startState = { ...initialState, selected: { id: 1 } as RegistrationItem };
        const state = reducer(startState, clearSelected());
        expect(state.selected).toBeNull();
    });

    it('should set page', () => {
        const state = reducer(initialState, setPage(2));
        expect(state.page).toBe(2);
    });

    it('should set page size', () => {
        const state = reducer(initialState, setPageSize(20));
        expect(state.pageSize).toBe(20);
        expect(state.page).toBe(1);
    });

    it('should update draft filter', () => {
        const state = reducer(initialState, updateDraftFilter({ key: 'search', value: 'find' }));
        expect(state.draftFilters.search).toBe('find');
    });

    it('should apply filters', () => {
        const startState = {
            ...initialState,
            draftFilters: { search: 'go', sortBy: 'now', sortOrder: 'DESC' as const },
            page: 2
        };
        const state = reducer(startState, applyFilters());
        expect(state.appliedFilters.search).toBe('go');
        expect(state.page).toBe(1);
    });

    it('should reset filters', () => {
        const startState = {
            ...initialState,
            draftFilters: { search: 'x' },
            appliedFilters: { search: 'y' }
        };
        const state = reducer(startState, resetFilters());
        expect(state.draftFilters.search).toBe('');
        expect(state.appliedFilters.search).toBe('');
    });

    it('should clear error', () => {
        const startState = { ...initialState, error: 'err' };
        const state = reducer(startState, clearError());
        expect(state.error).toBeNull();
    });

    describe('extraReducers', () => {
        it('handles fetchRegistrations.pending', () => {
            const state = reducer(initialState, fetchRegistrations.pending('', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(true);
        });

        it('handles fetchRegistrations.fulfilled', () => {
            const payload = {
                items: [{
                    id: 1,
                    name: 'Test',
                    email: 'test@test.com',
                    phone: '123',
                    institution: 'Inst',
                    country: 'Country',
                    website_id: 1
                }] as RegistrationItem[],
                total: 1,
                page: 1,
                limit: 10
            };
            const state = reducer(initialState, fetchRegistrations.fulfilled(payload, '', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual(payload.items);
            expect(state.total).toBe(1);
        });

        it('handles fetchRegistrations.rejected with custom payload', () => {
            const state = reducer(initialState, fetchRegistrations.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fail'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Fail');
        });

        it('handles fetchRegistrations.rejected with generic message (line 76)', () => {
            const rejectedAction = {
                type: fetchRegistrations.rejected.type,
                payload: null,
                error: { message: 'Network Error' }
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Network Error');
        });

        it('handles createRegistrationThunk.rejected with generic message (line 95)', () => {
            const rejectedAction = {
                type: createRegistrationThunk.rejected.type,
                payload: null,
                error: { message: 'Create Error' }
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Create Error');
        });

        it('handles deleteRegistrationThunk.pending', () => {
            const startState = { ...initialState, loading: false, error: 'some-stale-error' };
            const state = reducer(startState, deleteRegistrationThunk.pending('', 1));
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('handles deleteRegistrationThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                rawItems: [{ id: 1 }, { id: 2 }] as RegistrationItem[],
                items: [{ id: 1 }, { id: 2 }] as RegistrationItem[],
                total: 2
            };
            const state = reducer(startState, deleteRegistrationThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items.length).toBe(1);
            expect(state.items[0].id).toBe(2);
            expect(state.total).toBe(1);
        });

        it('handles deleteRegistrationThunk.rejected with custom payload', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, deleteRegistrationThunk.rejected(null, '', 1, 'Delete Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Delete Failed');
        });

        it('handles deleteRegistrationThunk.rejected with generic message', () => {
            const rejectedAction = {
                type: deleteRegistrationThunk.rejected.type,
                payload: null,
                error: { message: 'Network Error' }
            };
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Network Error');
        });

        it('handles deleteRegistrationThunk.rejected fallback', () => {
            const action = { type: deleteRegistrationThunk.rejected.type, payload: null, error: {} };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.error).toBe('Failed to delete registration');
        });

        it('handles createRegistrationThunk.pending', () => {
            const state = reducer(initialState, createRegistrationThunk.pending('', {} as unknown as RegistrationRecord));
            expect(state.loading).toBe(true);
        });

        it('handles createRegistrationThunk.fulfilled', () => {
            const newItem = {
                id: 3,
                name: 'New',
                email: 'new@test.com',
                phone: '456',
                institution: 'Inst',
                country: 'Country',
                website_id: 1
            } as RegistrationItem;
            const state = reducer(initialState, createRegistrationThunk.fulfilled(newItem, '', {} as unknown as RegistrationRecord));
            expect(state.items[0]).toEqual(newItem);
            expect(state.total).toBe(1);
        });

        it('handles createRegistrationThunk.rejected', () => {
            const state = reducer(initialState, createRegistrationThunk.rejected(null, '', {} as unknown as RegistrationRecord, 'err'));
            expect(state.error).toBe('err');
        });

        it('handles fetchRegistrations.rejected fallback (line 76)', () => {
            const rejectedAction = {
                type: fetchRegistrations.rejected.type,
                payload: null,
                error: {} 
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to load');
        });
        it('handles createRegistrationThunk.rejected fallback (line 95)', () => {
            const action = { type: createRegistrationThunk.rejected.type, payload: null, error: {} };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.error).toBe('Failed to create registration');
        });

        // updateRegistrationThunk extraReducers
        it('handles updateRegistrationThunk.pending', () => {
            const state = reducer(initialState, updateRegistrationThunk.pending('', { id: 1, data: {} }));
            expect(state.editLoading).toBe(true);
        });

        it('handles updateRegistrationThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                editLoading: true,
                rawItems: [
                    { id: 1, name: 'Old' } as RegistrationItem,
                    { id: 2, name: 'Other' } as RegistrationItem
                ],
                items: [
                    { id: 1, name: 'Old' } as RegistrationItem,
                    { id: 2, name: 'Other' } as RegistrationItem
                ],
                selected: { id: 1, name: 'Old' } as RegistrationItem
            };
            const updated = { id: 1, name: 'New' } as RegistrationItem;
            const state = reducer(startState, updateRegistrationThunk.fulfilled(updated, '', { id: 1, data: {} }));
            expect(state.editLoading).toBe(false);
            expect(state.items[0]).toEqual(updated);
            expect(state.items[1].name).toBe('Other');
            expect(state.rawItems[0]).toEqual(updated);
            expect(state.rawItems[1].name).toBe('Other');
            expect(state.selected).toEqual(updated);
        });

        it('handles updateRegistrationThunk.rejected', () => {
            const startState = { ...initialState, editLoading: true };
            const state = reducer(startState, updateRegistrationThunk.rejected(null, '', { id: 1, data: {} }, 'Update Failed'));
            expect(state.editLoading).toBe(false);
            expect(state.error).toBe('Update Failed');
        });

        it('handles updateRegistrationThunk.rejected fallback', () => {
            const action = { type: updateRegistrationThunk.rejected.type, payload: null, error: {} };
            const state = reducer(initialState, action as UnknownAction);
            expect(state.error).toBe('Failed to update registration');
        });
    });
});
