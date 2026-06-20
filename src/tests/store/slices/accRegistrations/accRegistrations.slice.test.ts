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
    type AccRegistrationFilters
} from '../../../../store/slices/accRegistrations/accRegistrations.slice';
import {
    fetchAccRegistrations,
    createAccRegistrationThunk,
    updateAccRegistrationThunk,
    deleteAccRegistrationThunk,
    restoreAccRegistrationThunk
} from '../../../../store/slices/accRegistrations/accRegistrations.slice';
import * as accRegistrationsService from '../../../../services/accRegistrations';
import type { AccRegistrationItem } from '../../../../services/accRegistrations';
import type { UnknownAction } from '@reduxjs/toolkit';

describe('accRegistrations slice', () => {
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

    it('should set page size and reset page', () => {
        const startState = { ...initialState, page: 3 };
        const state = reducer(startState, setPageSize(20));
        expect(state.pageSize).toBe(20);
        expect(state.page).toBe(1);
    });

    it('should set filters', () => {
        const filters: AccRegistrationFilters = { search: 'test', country: 'India' };
        const state = reducer(initialState, setFilters(filters));
        expect(state.appliedFilters).toEqual(filters);
        expect(state.draftFilters).toEqual(filters);
        expect(state.page).toBe(1);
    });

    it('should update draft filter', () => {
        const state = reducer(initialState, updateDraftFilter({ key: 'search', value: 'new search' }));
        expect(state.draftFilters.search).toBe('new search');
    });

    it('should apply filters', () => {
        const startState = {
            ...initialState,
            draftFilters: { search: 'applied', sortBy: 'now', sortOrder: 'DESC' as const },
            page: 2
        };
        const state = reducer(startState, applyFilters());
        expect(state.appliedFilters.search).toBe('applied');
        expect(state.page).toBe(1);
    });

    it('should reset filters', () => {
        const startState = {
            ...initialState,
            draftFilters: { search: 'dirty' },
            appliedFilters: { search: 'applied' },
            page: 5
        };
        const state = reducer(startState, resetFilters());
        expect(state.draftFilters.search).toBe('');
        expect(state.appliedFilters.search).toBe('');
        expect(state.page).toBe(1);
    });

    it('should set selected', () => {
        const item: AccRegistrationItem = { id: 1, name: 'Test' };
        const state = reducer(initialState, setSelected(item));
        expect(state.selected).toEqual(item);
    });

    it('should clear selected', () => {
        const startState = { ...initialState, selected: { id: 1 } as AccRegistrationItem };
        const state = reducer(startState, clearSelected());
        expect(state.selected).toBeNull();
    });

    it('should clear error', () => {
        const startState = { ...initialState, error: 'some error' };
        const state = reducer(startState, clearError());
        expect(state.error).toBeNull();
    });

    describe('extraReducers', () => {
        it('handles fetchAccRegistrations.pending', () => {
            const state = reducer(initialState, fetchAccRegistrations.pending('', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('handles fetchAccRegistrations.fulfilled', () => {
            const payload = {
                items: [{ id: 1, name: 'Item 1' }] as AccRegistrationItem[],
                total: 10,
                page: 1,
                limit: 10
            };
            const state = reducer(initialState, fetchAccRegistrations.fulfilled(payload, '', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual(payload.items);
            expect(state.total).toBe(10);
        });

        it('handles fetchAccRegistrations.rejected with custom payload', () => {
            const state = reducer(initialState, fetchAccRegistrations.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fetch Error'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Fetch Error');
        });

        it('handles fetchAccRegistrations.rejected with generic message (line 123)', () => {
            const rejectedAction = {
                type: fetchAccRegistrations.rejected.type,
                payload: null,
                error: { message: 'Network Error' }
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Network Error');
        });

        it('handles createAccRegistrationThunk.pending', () => {
            const state = reducer(initialState, createAccRegistrationThunk.pending('', {}));
            expect(state.loading).toBe(true);
        });

        it('handles createAccRegistrationThunk.fulfilled', () => {
            const state = reducer({ ...initialState, loading: true }, createAccRegistrationThunk.fulfilled({ id: 1 } as AccRegistrationItem, '', {}));
            expect(state.loading).toBe(false);
        });

        it('handles createAccRegistrationThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, createAccRegistrationThunk.rejected(null, '', {}, 'Create Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Create Failed');
        });

        it('fetchAccRegistrations thunk should reject with axios error', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'searchAccRegistrations').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Error' } }
            });
            const dispatch = jest.fn();
            const result = await fetchAccRegistrations({ page: 1, limit: 10, filters: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Error');
            spy.mockRestore();
        });

        it('fetchAccRegistrations thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'searchAccRegistrations').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await fetchAccRegistrations({ page: 1, limit: 10, filters: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to load');
            spy.mockRestore();
        });

        it('createAccRegistrationThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'createAccRegistration').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Create Error' } }
            });
            const dispatch = jest.fn();
            const result = await createAccRegistrationThunk({})(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Create Error');
            spy.mockRestore();
        });

        it('createAccRegistrationThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'createAccRegistration').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await createAccRegistrationThunk({})(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to create registration');
            spy.mockRestore();
        });

        // updateAccRegistrationThunk extraReducers
        it('handles updateAccRegistrationThunk.pending', () => {
            const state = reducer(initialState, updateAccRegistrationThunk.pending('', { id: 1, data: {} }));
            expect(state.editLoading).toBe(true);
        });

        it('handles updateAccRegistrationThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                editLoading: true,
                items: [
                    { id: 1, name: 'Old Name' } as AccRegistrationItem,
                    { id: 2, name: 'Other Name' } as AccRegistrationItem
                ],
                selected: { id: 1, name: 'Old Name' } as AccRegistrationItem
            };
            const updatedItem = { id: 1, name: 'New Name' } as AccRegistrationItem;
            const state = reducer(startState, updateAccRegistrationThunk.fulfilled(updatedItem, '', { id: 1, data: {} }));
            expect(state.editLoading).toBe(false);
            expect(state.items[0]).toEqual(updatedItem);
            expect(state.items[1].name).toBe('Other Name');
            expect(state.selected).toEqual(updatedItem);
        });

        it('handles updateAccRegistrationThunk.rejected', () => {
            const startState = { ...initialState, editLoading: true };
            const state = reducer(startState, updateAccRegistrationThunk.rejected(null, '', { id: 1, data: {} }, 'Update Failed'));
            expect(state.editLoading).toBe(false);
            expect(state.error).toBe('Update Failed');
        });

        // deleteAccRegistrationThunk extraReducers
        it('handles deleteAccRegistrationThunk.pending', () => {
            const state = reducer(initialState, deleteAccRegistrationThunk.pending('', 1));
            expect(state.loading).toBe(true);
        });

        it('handles deleteAccRegistrationThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                items: [{ id: 1, name: 'Item 1' } as AccRegistrationItem],
                selected: { id: 1, name: 'Item 1' } as AccRegistrationItem
            };
            const state = reducer(startState, deleteAccRegistrationThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.selected).toBeNull();
        });

        it('handles deleteAccRegistrationThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, deleteAccRegistrationThunk.rejected(null, '', 1, 'Delete Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Delete Failed');
        });

        // updateAccRegistrationThunk thunk tests
        it('updateAccRegistrationThunk thunk should resolve successfully', async () => {
            const updatedItem = { id: 1, name: 'Updated' } as AccRegistrationItem;
            const spy = jest.spyOn(accRegistrationsService, 'updateAccRegistration').mockResolvedValue(updatedItem);
            const dispatch = jest.fn();
            const result = await updateAccRegistrationThunk({ id: 1, data: { name: 'Updated' } })(dispatch, jest.fn(), undefined);
            expect(result.payload).toEqual(updatedItem);
            spy.mockRestore();
        });

        it('updateAccRegistrationThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'updateAccRegistration').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Update Error' } }
            });
            const dispatch = jest.fn();
            const result = await updateAccRegistrationThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Update Error');
            spy.mockRestore();
        });

        it('updateAccRegistrationThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'updateAccRegistration').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await updateAccRegistrationThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to update acc-registration');
            spy.mockRestore();
        });

        // deleteAccRegistrationThunk thunk tests
        it('deleteAccRegistrationThunk thunk should resolve successfully', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'deleteAccRegistration').mockResolvedValue(undefined);
            const dispatch = jest.fn();
            const result = await deleteAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe(1);
            spy.mockRestore();
        });

        it('deleteAccRegistrationThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'deleteAccRegistration').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Delete Error' } }
            });
            const dispatch = jest.fn();
            const result = await deleteAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Delete Error');
            spy.mockRestore();
        });

        it('deleteAccRegistrationThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'deleteAccRegistration').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await deleteAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to delete accommodation registration');
            spy.mockRestore();
        });

        // branch specific tests
        it('updateAccRegistrationThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'updateAccRegistration').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await updateAccRegistrationThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });

        it('deleteAccRegistrationThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'deleteAccRegistration').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await deleteAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });

        it('handles fetchAccRegistrations.rejected fallback to Failed to load', () => {
            const rejectedAction = {
                type: fetchAccRegistrations.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to load');
        });

        it('handles createAccRegistrationThunk.rejected fallback to Failed to create', () => {
            const rejectedAction = {
                type: createAccRegistrationThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to create');
        });

        it('handles updateAccRegistrationThunk.rejected fallback to Failed to update acc-registration', () => {
            const rejectedAction = {
                type: updateAccRegistrationThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to update acc-registration');
        });

        it('handles deleteAccRegistrationThunk.rejected fallback to Failed to delete accommodation registration', () => {
            const rejectedAction = {
                type: deleteAccRegistrationThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to delete accommodation registration');
        });

        // restoreAccRegistrationThunk extraReducers
        it('handles restoreAccRegistrationThunk.pending', () => {
            const state = reducer(initialState, restoreAccRegistrationThunk.pending('', 1));
            expect(state.loading).toBe(true);
        });

        it('handles restoreAccRegistrationThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                items: [{ id: 1, name: 'Item 1' } as AccRegistrationItem],
                selected: { id: 1, name: 'Item 1' } as AccRegistrationItem
            };
            const state = reducer(startState, restoreAccRegistrationThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.selected).toBeNull();
        });

        it('handles restoreAccRegistrationThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, restoreAccRegistrationThunk.rejected(null, '', 1, 'Restore Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Restore Failed');
        });

        it('handles restoreAccRegistrationThunk.rejected fallback to Failed to restore accommodation registration', () => {
            const rejectedAction = {
                type: restoreAccRegistrationThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to restore accommodation registration');
        });

        // restoreAccRegistrationThunk thunk tests
        it('restoreAccRegistrationThunk thunk should resolve successfully', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'restoreAccRegistration').mockResolvedValue(undefined);
            const dispatch = jest.fn();
            const result = await restoreAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe(1);
            spy.mockRestore();
        });

        it('restoreAccRegistrationThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'restoreAccRegistration').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Restore Error' } }
            });
            const dispatch = jest.fn();
            const result = await restoreAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Restore Error');
            spy.mockRestore();
        });

        it('restoreAccRegistrationThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'restoreAccRegistration').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await restoreAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to restore accommodation registration');
            spy.mockRestore();
        });

        it('restoreAccRegistrationThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(accRegistrationsService, 'restoreAccRegistration').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await restoreAccRegistrationThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });
    });
});
