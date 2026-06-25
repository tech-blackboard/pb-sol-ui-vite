import { handleGroupMailClick } from '../../utils/groupMail';
import { openComposeModal } from '../../store/slices/crm/crm.slice';

jest.mock('../../store/slices/crm/crm.slice', () => ({
    openComposeModal: jest.fn((payload) => ({ type: 'crm/openComposeModal', payload })),
}));

describe('handleGroupMailClick utility', () => {
    let mockDispatch: jest.Mock;
    let originalAlert: typeof window.alert;

    beforeAll(() => {
        originalAlert = window.alert;
        window.alert = jest.fn();
    });

    afterAll(() => {
        window.alert = originalAlert;
    });

    beforeEach(() => {
        mockDispatch = jest.fn();
        jest.clearAllMocks();
    });

    it('should do nothing if selectedIds is empty', () => {
        const items = [{ id: 1, email: 'test@example.com', website_id: 10 }];
        handleGroupMailClick({ items, selectedIds: [], dispatch: mockDispatch });

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
    });

    it('should do nothing if no items match the selectedIds', () => {
        const items = [{ id: 1, email: 'test@example.com', website_id: 10 }];
        handleGroupMailClick({ items, selectedIds: [2], dispatch: mockDispatch });

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
    });

    it('should show alert if selected records belong to different conferences', () => {
        const items = [
            { id: 1, email: 'test1@example.com', website_id: 10 },
            { id: 2, email: 'test2@example.com', website_id: 11 },
        ];

        handleGroupMailClick({ items, selectedIds: [1, 2], dispatch: mockDispatch });

        expect(window.alert).toHaveBeenCalledWith(
            "Please select records from the same conference only to send a group mail."
        );
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should show alert if selected records have mixed website objects and website_ids indicating different conferences', () => {
        const items = [
            { id: 1, email: 'test1@example.com', website: { id: 10, name: 'Conf A' } },
            { id: 2, email: 'test2@example.com', website_id: 11 },
        ];

        handleGroupMailClick({ items, selectedIds: [1, 2], dispatch: mockDispatch });

        expect(window.alert).toHaveBeenCalledWith(
            "Please select records from the same conference only to send a group mail."
        );
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should show alert if no valid email addresses are found', () => {
        const items = [
            { id: 1, website_id: 10 },
            { id: 2, email: '', website_id: 10 },
        ];

        handleGroupMailClick({ items, selectedIds: [1, 2], dispatch: mockDispatch });

        expect(window.alert).toHaveBeenCalledWith(
            "No valid email addresses found in the selected records."
        );
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should dispatch openComposeModal with formatted unique emails and eventId on success', () => {
        const items = [
            { id: 1, email: 'test1@example.com ', website_id: 10 },
            { id: 2, email: 'test2@example.com', website_id: 10 },
            { id: 3, email: 'test1@example.com', website_id: 10 }, // Duplicate email check
        ];

        handleGroupMailClick({ items, selectedIds: [1, 2, 3], dispatch: mockDispatch });

        expect(window.alert).not.toHaveBeenCalled();
        expect(openComposeModal).toHaveBeenCalledWith({
            to: 'test1@example.com, test2@example.com',
            eventId: 10,
            disableDraft: true,
        });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'crm/openComposeModal',
            payload: {
                to: 'test1@example.com, test2@example.com',
                eventId: 10,
                disableDraft: true,
            },
        });
    });
});
