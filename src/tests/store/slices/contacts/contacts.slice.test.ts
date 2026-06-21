import reducer, {
    setPage,
    setPageSize,
    setFilters,
    updateDraftFilter,
    applyFilters,
    resetFilters,
    setSelected,
    clearSelected,
    clearError,
    type ContactFilters
} from '../../../../store/slices/contacts/contacts.slice';
import {
    fetchContacts,
    createContactThunk,
    updateContactThunk,
    deleteContactThunk,
    restoreContactThunk
} from '../../../../store/slices/contacts/contacts.slice';
import * as contactsService from '../../../../services/contacts';
import type { ContactItem } from '../../../../services/contacts';
import type { UnknownAction } from '@reduxjs/toolkit';

describe('contacts slice', () => {
    const initialState = reducer(undefined, { type: 'INIT' });

    it('should return initial state', () => {
        expect(initialState.page).toBe(1);
        expect(initialState.items).toEqual([]);
        expect(initialState.loading).toBe(false);
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

    it('should set filters', () => {
        const filters: ContactFilters = { search: 'test' };
        const state = reducer(initialState, setFilters(filters));
        expect(state.appliedFilters).toEqual(filters);
    });

    it('should update draft filter', () => {
        const state = reducer(initialState, updateDraftFilter({ key: 'search', value: 'query' }));
        expect(state.draftFilters.search).toBe('query');
    });

    it('should apply filters', () => {
        const startState = {
            ...initialState,
            draftFilters: { search: 'new' },
            page: 2
        };
        const state = reducer(startState, applyFilters());
        expect(state.appliedFilters.search).toBe('new');
        expect(state.page).toBe(1);
    });

    it('should reset filters', () => {
        const startState = {
            ...initialState,
            draftFilters: { search: 'dirty' },
            appliedFilters: { search: 'applied' }
        };
        const state = reducer(startState, resetFilters());
        expect(state.draftFilters.search).toBe('');
        expect(state.appliedFilters.search).toBe('');
    });

    it('should set selected', () => {
        const item = { id: 1, name: 'Contact' } as ContactItem;
        const state = reducer(initialState, setSelected(item));
        expect(state.selected).toEqual(item);
    });

    it('should clear selected', () => {
        const startState = { ...initialState, selected: { id: 1 } as ContactItem };
        const state = reducer(startState, clearSelected());
        expect(state.selected).toBeNull();
    });

    it('should clear error', () => {
        const startState = { ...initialState, error: 'err' };
        const state = reducer(startState, clearError());
        expect(state.error).toBeNull();
    });

    describe('extraReducers', () => {
        it('handles fetchContacts.pending', () => {
            const state = reducer(initialState, fetchContacts.pending('', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(true);
        });

        it('handles fetchContacts.fulfilled', () => {
            const payload = { items: [{ id: 1 }] as ContactItem[], total: 1, page: 1, limit: 10 };
            const state = reducer(initialState, fetchContacts.fulfilled(payload, '', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([{ id: 1 }]);
            expect(state.total).toBe(1);
        });

        it('handles fetchContacts.rejected with custom payload', () => {
            const state = reducer(initialState, fetchContacts.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fail'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Fail');
        });

        it('handles fetchContacts.rejected with generic message (line 53)', () => {
            const rejectedAction = {
                type: fetchContacts.rejected.type,
                payload: null,
                error: {} // No message, should trigger fallback 'Failed to load'
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Failed to load');
        });

        it('handles fetchContacts rejected states (lines 47-53)', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, fetchContacts.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fail'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Fail');
        });

        it('handles createContactThunk.fulfilled', () => {
            const startState = { ...initialState, items: [{ id: 1 }] as ContactItem[], total: 1 };
            const newItem = { id: 2, name: 'New' } as ContactItem;
            const state = reducer(startState, createContactThunk.fulfilled(newItem, '', {}));
            expect(state.items[0]).toEqual(newItem);
            expect(state.total).toBe(2);
        });
        it('handles createContactThunk.pending', () => {
            const state = reducer(initialState, createContactThunk.pending('', {}));
            expect(state.loading).toBe(true);
        });

        it('handles createContactThunk.rejected', () => {
            const state = reducer({ ...initialState, loading: true }, createContactThunk.rejected(null, '', {}, 'Create Fail'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Create Fail');
        });

        it('fetchContacts thunk should reject with axios error', async () => {
            const spy = jest.spyOn(contactsService, 'searchContacts').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Error' } }
            });
            const dispatch = jest.fn();
            const result = await fetchContacts({ page: 1, limit: 10, filters: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Error');
            spy.mockRestore();
        });

        it('fetchContacts thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(contactsService, 'searchContacts').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await fetchContacts({ page: 1, limit: 10, filters: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to load contacts');
            spy.mockRestore();
        });

        it('createContactThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(contactsService, 'createContact').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Create Error' } }
            });
            const dispatch = jest.fn();
            const result = await createContactThunk({})(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Create Error');
            spy.mockRestore();
        });

        it('createContactThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(contactsService, 'createContact').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await createContactThunk({})(dispatch, jest.fn(), undefined);
            expect(result.type).toBe('contacts/create/rejected');
            spy.mockRestore();
        });

        // updateContactThunk extraReducers
        it('handles updateContactThunk.pending', () => {
            const state = reducer(initialState, updateContactThunk.pending('', { id: 1, data: {} }));
            expect(state.editLoading).toBe(true);
        });

        it('handles updateContactThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                editLoading: true,
                items: [
                    { id: 1, name: 'Old Contact' } as ContactItem,
                    { id: 2, name: 'Other Contact' } as ContactItem
                ],
                selected: { id: 1, name: 'Old Contact' } as ContactItem
            };
            const updatedItem = { id: 1, name: 'New Contact' } as ContactItem;
            const state = reducer(startState, updateContactThunk.fulfilled(updatedItem, '', { id: 1, data: {} }));
            expect(state.editLoading).toBe(false);
            expect(state.items[0]).toEqual(updatedItem);
            expect(state.items[1].name).toBe('Other Contact');
            expect(state.selected).toEqual(updatedItem);
        });

        it('handles updateContactThunk.rejected', () => {
            const startState = { ...initialState, editLoading: true };
            const state = reducer(startState, updateContactThunk.rejected(null, '', { id: 1, data: {} }, 'Update Failed'));
            expect(state.editLoading).toBe(false);
            expect(state.error).toBe('Update Failed');
        });

        // deleteContactThunk extraReducers
        it('handles deleteContactThunk.pending', () => {
            const state = reducer(initialState, deleteContactThunk.pending('', 1));
            expect(state.loading).toBe(true);
        });

        it('handles deleteContactThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                items: [{ id: 1, name: 'Contact 1' } as ContactItem],
                selected: { id: 1, name: 'Contact 1' } as ContactItem
            };
            const state = reducer(startState, deleteContactThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.selected).toBeNull();
        });

        it('handles deleteContactThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, deleteContactThunk.rejected(null, '', 1, 'Delete Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Delete Failed');
        });

        // updateContactThunk thunk tests
        it('updateContactThunk thunk should resolve successfully', async () => {
            const updatedItem = { id: 1, name: 'Updated' } as ContactItem;
            const spy = jest.spyOn(contactsService, 'updateContact').mockResolvedValue(updatedItem);
            const dispatch = jest.fn();
            const result = await updateContactThunk({ id: 1, data: { name: 'Updated' } })(dispatch, jest.fn(), undefined);
            expect(result.payload).toEqual(updatedItem);
            spy.mockRestore();
        });

        it('updateContactThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(contactsService, 'updateContact').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Update Error' } }
            });
            const dispatch = jest.fn();
            const result = await updateContactThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Update Error');
            spy.mockRestore();
        });

        it('updateContactThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(contactsService, 'updateContact').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await updateContactThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to update contact');
            spy.mockRestore();
        });

        // deleteContactThunk thunk tests
        it('deleteContactThunk thunk should resolve successfully', async () => {
            const spy = jest.spyOn(contactsService, 'deleteContact').mockResolvedValue(undefined);
            const dispatch = jest.fn();
            const result = await deleteContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe(1);
            spy.mockRestore();
        });

        it('deleteContactThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(contactsService, 'deleteContact').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Delete Error' } }
            });
            const dispatch = jest.fn();
            const result = await deleteContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Delete Error');
            spy.mockRestore();
        });

        it('deleteContactThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(contactsService, 'deleteContact').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await deleteContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to delete contact');
            spy.mockRestore();
        });

        // branch specific tests
        it('updateContactThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(contactsService, 'updateContact').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await updateContactThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });

        it('deleteContactThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(contactsService, 'deleteContact').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await deleteContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });

        it('handles fetchContacts.rejected fallback to Failed to load', () => {
            const rejectedAction = {
                type: fetchContacts.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to load');
        });

        it('handles createContactThunk.rejected fallback to Failed to create contact', () => {
            const rejectedAction = {
                type: createContactThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to create contact');
        });

        it('handles updateContactThunk.rejected fallback to Failed to update contact', () => {
            const rejectedAction = {
                type: updateContactThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to update contact');
        });

        it('handles deleteContactThunk.rejected fallback to Failed to delete contact', () => {
            const rejectedAction = {
                type: deleteContactThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to delete contact');
        });

        // restoreContactThunk extraReducers
        it('handles restoreContactThunk.pending', () => {
            const state = reducer(initialState, restoreContactThunk.pending('', 1));
            expect(state.loading).toBe(true);
        });

        it('handles restoreContactThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                items: [{ id: 1, name: 'Contact 1' } as ContactItem],
                selected: { id: 1, name: 'Contact 1' } as ContactItem
            };
            const state = reducer(startState, restoreContactThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.selected).toBeNull();
        });

        it('handles restoreContactThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, restoreContactThunk.rejected(null, '', 1, 'Restore Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Restore Failed');
        });

        it('handles restoreContactThunk.rejected fallback to Failed to restore contact', () => {
            const rejectedAction = {
                type: restoreContactThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to restore contact');
        });

        // restoreContactThunk thunk tests
        it('restoreContactThunk thunk should resolve successfully', async () => {
            const spy = jest.spyOn(contactsService, 'restoreContact').mockResolvedValue(undefined);
            const dispatch = jest.fn();
            const result = await restoreContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe(1);
            spy.mockRestore();
        });

        it('restoreContactThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(contactsService, 'restoreContact').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Restore Error' } }
            });
            const dispatch = jest.fn();
            const result = await restoreContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Restore Error');
            spy.mockRestore();
        });

        it('restoreContactThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(contactsService, 'restoreContact').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await restoreContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to restore contact');
            spy.mockRestore();
        });

        it('restoreContactThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(contactsService, 'restoreContact').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await restoreContactThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });
    });
});
