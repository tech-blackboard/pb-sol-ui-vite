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
import { fetchAccRegistrations, createAccRegistrationThunk } from '../../../../store/slices/accRegistrations/accRegistrations.slice';
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
    });
});
