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
import { fetchContacts, createContactThunk } from '../../../../store/slices/contacts/contacts.slice';
import type { ContactItem } from '../../../../services/contacts';

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

        it('handles fetchContacts.rejected', () => {
            const state = reducer(initialState, fetchContacts.rejected(null, '', { page: 1, limit: 10, filters: {} }, 'Fail'));
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
    });
});
