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
import { fetchBrochures, createBrochureThunk } from '../../../../store/slices/brochures/brochures.slice';
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
    });
});
