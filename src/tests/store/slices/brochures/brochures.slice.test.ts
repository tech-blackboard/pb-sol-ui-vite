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
    type BrochureFilters
} from '../../../../store/slices/brochures/brochures.slice';
import {
    fetchBrochures,
    createBrochureThunk,
    updateBrochureThunk,
    deleteBrochureThunk,
    restoreBrochureThunk
} from '../../../../store/slices/brochures/brochures.slice';
import * as brochuresService from '../../../../services/brochures';
import type { BrochureItem, BrochureSearchResult } from '../../../../services/brochures';
import type { UnknownAction } from '@reduxjs/toolkit';

describe('brochures slice', () => {
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
        const filters: BrochureFilters = { search: 'test' };
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
        const item = { id: 1, name: 'Brochure' } as BrochureItem;
        const state = reducer(initialState, setSelected(item));
        expect(state.selected).toEqual(item);
    });

    it('should clear selected', () => {
        const startState = { ...initialState, selected: { id: 1 } as BrochureItem };
        const state = reducer(startState, clearSelected());
        expect(state.selected).toBeNull();
    });

    it('should clear error', () => {
        const startState = { ...initialState, error: 'err' };
        const state = reducer(startState, clearError());
        expect(state.error).toBeNull();
    });

    describe('extraReducers', () => {
        it('handles fetchBrochures.pending', () => {
            const state = reducer(initialState, fetchBrochures.pending('', { page: 1, limit: 10, filters: {} }));
            expect(state.loading).toBe(true);
        });

        it('handles fetchBrochures.fulfilled (items/data/total fallbacks)', () => {
            const payload = { items: [{ id: 2 }] as BrochureItem[], total: 0, page: 1, limit: 10 };
            const state = reducer(initialState, fetchBrochures.fulfilled(payload as BrochureSearchResult, '', { page: 1, limit: 10, filters: {} }));
            expect(state.items).toEqual([{ id: 2 }]);
            expect(state.total).toBe(0);

            const emptyPayload = { items: [], total: 0, page: 1, limit: 10 };
            const state2 = reducer(initialState, fetchBrochures.fulfilled(emptyPayload as BrochureSearchResult, '', { page: 1, limit: 10, filters: {} }));
            expect(state2.items).toEqual([]);
        });

        it('handles fetchBrochures.rejected with custom payload', () => {
            const state = reducer(initialState, fetchBrochures.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fail'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Fail');
        });

        it('handles fetchBrochures.rejected with generic message (line 52)', () => {
            const rejectedAction = {
                type: fetchBrochures.rejected.type,
                payload: null,
                error: { message: 'Network Error' }
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Network Error');
        });
        
        it('handles fetchBrochures progress resetting', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, fetchBrochures.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fail'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Fail');
        });

        it('handles createBrochureThunk.pending', () => {
            const state = reducer(initialState, createBrochureThunk.pending('', {}));
            expect(state.loading).toBe(true);
        });

        it('handles createBrochureThunk.fulfilled', () => {
            const state = reducer({ ...initialState, loading: true }, createBrochureThunk.fulfilled({ id: 1 } as BrochureItem, '', {}));
            expect(state.loading).toBe(false);
        });

        it('handles createBrochureThunk.rejected (fallback error message)', () => {
            const rejectedAction = {
                type: createBrochureThunk.rejected.type,
                payload: null,
                error: { message: 'Action Error' }
            };
            const state = reducer({ ...initialState, loading: true }, rejectedAction as UnknownAction);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Action Error');

            const rejectedAction2 = {
                type: createBrochureThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state2 = reducer(initialState, rejectedAction2 as UnknownAction);
            expect(state2.error).toBe('Failed to create brochure request');
        });

        it('fetchBrochures thunk should reject with axios error', async () => {
            const spy = jest.spyOn(brochuresService, 'searchBrochures').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Error' } }
            });
            const dispatch = jest.fn();
            const result = await fetchBrochures({ page: 1, limit: 10, filters: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Error');
            spy.mockRestore();
        });

        it('fetchBrochures thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(brochuresService, 'searchBrochures').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await fetchBrochures({ page: 1, limit: 10, filters: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to load brochures');
            spy.mockRestore();
        });

        it('createBrochureThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(brochuresService, 'createBrochure').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Create Error' } }
            });
            const dispatch = jest.fn();
            const result = await createBrochureThunk({})(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Create Error');
            spy.mockRestore();
        });

        it('createBrochureThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(brochuresService, 'createBrochure').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await createBrochureThunk({})(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to create brochure request');
            spy.mockRestore();
        });

        // updateBrochureThunk extraReducers
        it('handles updateBrochureThunk.pending', () => {
            const state = reducer(initialState, updateBrochureThunk.pending('', { id: 1, data: {} }));
            expect(state.editLoading).toBe(true);
        });

        it('handles updateBrochureThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                editLoading: true,
                items: [
                    { id: 1, name: 'Old Brochure' } as BrochureItem,
                    { id: 2, name: 'Other Brochure' } as BrochureItem
                ],
                selected: { id: 1, name: 'Old Brochure' } as BrochureItem
            };
            const updatedItem = { id: 1, name: 'New Brochure' } as BrochureItem;
            const state = reducer(startState, updateBrochureThunk.fulfilled(updatedItem, '', { id: 1, data: {} }));
            expect(state.editLoading).toBe(false);
            expect(state.items[0]).toEqual(updatedItem);
            expect(state.items[1].name).toBe('Other Brochure');
            expect(state.selected).toEqual(updatedItem);
        });

        it('handles updateBrochureThunk.rejected', () => {
            const startState = { ...initialState, editLoading: true };
            const state = reducer(startState, updateBrochureThunk.rejected(null, '', { id: 1, data: {} }, 'Update Failed'));
            expect(state.editLoading).toBe(false);
            expect(state.error).toBe('Update Failed');
        });

        // deleteBrochureThunk extraReducers
        it('handles deleteBrochureThunk.pending', () => {
            const state = reducer(initialState, deleteBrochureThunk.pending('', 1));
            expect(state.loading).toBe(true);
        });

        it('handles deleteBrochureThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                items: [{ id: 1, name: 'Brochure 1' } as BrochureItem],
                selected: { id: 1, name: 'Brochure 1' } as BrochureItem
            };
            const state = reducer(startState, deleteBrochureThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.selected).toBeNull();
        });

        it('handles deleteBrochureThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, deleteBrochureThunk.rejected(null, '', 1, 'Delete Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Delete Failed');
        });

        // updateBrochureThunk thunk tests
        it('updateBrochureThunk thunk should resolve successfully', async () => {
            const updatedItem = { id: 1, name: 'Updated' } as BrochureItem;
            const spy = jest.spyOn(brochuresService, 'updateBrochure').mockResolvedValue(updatedItem);
            const dispatch = jest.fn();
            const result = await updateBrochureThunk({ id: 1, data: { name: 'Updated' } })(dispatch, jest.fn(), undefined);
            expect(result.payload).toEqual(updatedItem);
            spy.mockRestore();
        });

        it('updateBrochureThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(brochuresService, 'updateBrochure').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Update Error' } }
            });
            const dispatch = jest.fn();
            const result = await updateBrochureThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Update Error');
            spy.mockRestore();
        });

        it('updateBrochureThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(brochuresService, 'updateBrochure').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await updateBrochureThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to update brochure');
            spy.mockRestore();
        });

        // deleteBrochureThunk thunk tests
        it('deleteBrochureThunk thunk should resolve successfully', async () => {
            const spy = jest.spyOn(brochuresService, 'deleteBrochure').mockResolvedValue(undefined);
            const dispatch = jest.fn();
            const result = await deleteBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe(1);
            spy.mockRestore();
        });

        it('deleteBrochureThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(brochuresService, 'deleteBrochure').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Delete Error' } }
            });
            const dispatch = jest.fn();
            const result = await deleteBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Delete Error');
            spy.mockRestore();
        });

        it('deleteBrochureThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(brochuresService, 'deleteBrochure').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await deleteBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to delete brochure request');
            spy.mockRestore();
        });

        // branch specific tests
        it('updateBrochureThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(brochuresService, 'updateBrochure').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await updateBrochureThunk({ id: 1, data: {} })(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });

        it('deleteBrochureThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(brochuresService, 'deleteBrochure').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await deleteBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });

        it('handles fetchBrochures.rejected fallback to Failed to load', () => {
            const rejectedAction = {
                type: fetchBrochures.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to load');
        });

        it('handles createBrochureThunk.rejected fallback to Failed to create brochure request', () => {
            const rejectedAction = {
                type: createBrochureThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to create brochure request');
        });

        it('handles updateBrochureThunk.rejected fallback to Failed to update brochure', () => {
            const rejectedAction = {
                type: updateBrochureThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to update brochure');
        });

        it('handles deleteBrochureThunk.rejected fallback to Failed to delete brochure request', () => {
            const rejectedAction = {
                type: deleteBrochureThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to delete brochure request');
        });

        // restoreBrochureThunk extraReducers
        it('handles restoreBrochureThunk.pending', () => {
            const state = reducer(initialState, restoreBrochureThunk.pending('', 1));
            expect(state.loading).toBe(true);
        });

        it('handles restoreBrochureThunk.fulfilled', () => {
            const startState = {
                ...initialState,
                loading: true,
                items: [{ id: 1, name: 'Brochure 1' } as BrochureItem],
                selected: { id: 1, name: 'Brochure 1' } as BrochureItem
            };
            const state = reducer(startState, restoreBrochureThunk.fulfilled(1, '', 1));
            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.selected).toBeNull();
        });

        it('handles restoreBrochureThunk.rejected', () => {
            const startState = { ...initialState, loading: true };
            const state = reducer(startState, restoreBrochureThunk.rejected(null, '', 1, 'Restore Failed'));
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Restore Failed');
        });

        it('handles restoreBrochureThunk.rejected fallback to Failed to restore brochure request', () => {
            const rejectedAction = {
                type: restoreBrochureThunk.rejected.type,
                payload: null,
                error: {}
            };
            const state = reducer(initialState, rejectedAction as UnknownAction);
            expect(state.error).toBe('Failed to restore brochure request');
        });

        // restoreBrochureThunk thunk tests
        it('restoreBrochureThunk thunk should resolve successfully', async () => {
            const spy = jest.spyOn(brochuresService, 'restoreBrochure').mockResolvedValue(undefined);
            const dispatch = jest.fn();
            const result = await restoreBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe(1);
            spy.mockRestore();
        });

        it('restoreBrochureThunk thunk should reject with axios error', async () => {
            const spy = jest.spyOn(brochuresService, 'restoreBrochure').mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: 'Axios Restore Error' } }
            });
            const dispatch = jest.fn();
            const result = await restoreBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios Restore Error');
            spy.mockRestore();
        });

        it('restoreBrochureThunk thunk should reject with fallback message', async () => {
            const spy = jest.spyOn(brochuresService, 'restoreBrochure').mockRejectedValue(new Error('Generic Error'));
            const dispatch = jest.fn();
            const result = await restoreBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Failed to restore brochure request');
            spy.mockRestore();
        });

        it('restoreBrochureThunk thunk should reject with axios error using fallback err.message', async () => {
            const spy = jest.spyOn(brochuresService, 'restoreBrochure').mockRejectedValue({
                isAxiosError: true,
                message: 'Axios fallback message'
            });
            const dispatch = jest.fn();
            const result = await restoreBrochureThunk(1)(dispatch, jest.fn(), undefined);
            expect(result.payload).toBe('Axios fallback message');
            spy.mockRestore();
        });
    });
});
