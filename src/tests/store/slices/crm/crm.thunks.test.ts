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
import * as crmService from '../../../../features/crm/services/crmService';

jest.mock('../../../../features/crm/services/crmService');

describe('crm thunks catch blocks', () => {
    const dispatch = jest.fn();
    const getState = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetchEventsThunk should reject with axios error message', async () => {
        (crmService.fetchCrmEvents as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Axios Error' } }
        });

        const result = await fetchEventsThunk()(dispatch, getState, undefined);
        expect(result.payload).toBe('Axios Error');
    });

    it('fetchEventsThunk should reject with fallback message on generic error', async () => {
        (crmService.fetchCrmEvents as jest.Mock).mockRejectedValue(new Error('Generic Error'));

        const result = await fetchEventsThunk()(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to fetch events');
    });

    it('fetchThreadsThunk should reject with axios error message', async () => {
        (crmService.fetchThreads as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Threads Error' } }
        });

        const result = await fetchThreadsThunk({ eventId: 1 })(dispatch, getState, undefined);
        expect(result.payload).toBe('Threads Error');
    });

    it('fetchMessagesThunk should reject with axios error message', async () => {
        (crmService.fetchThreadMessages as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Messages Error' } }
        });

        const result = await fetchMessagesThunk('t1')(dispatch, getState, undefined);
        expect(result.payload).toBe('Messages Error');
    });

    it('sendReplyThunk should reject with axios error message', async () => {
        (crmService.sendReply as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Reply Error' } }
        });

        const result = await sendReplyThunk({ contactId: 1, eventId: 1, subject: 'S', textBody: 'B', htmlBody: 'H' })(dispatch, getState, undefined);
        expect(result.payload).toBe('Reply Error');
    });

    it('updateLabelsThunk should reject with axios error message', async () => {
        (crmService.updateMessageLabels as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Label Error' } }
        });

        const result = await updateLabelsThunk({ messageId: 'm1', labels: [] })(dispatch, getState, undefined);
        expect(result.payload).toBe('Label Error');
    });

    it('updateLabelsThunk fulfillment should return messageId and labels', async () => {
        (crmService.updateMessageLabels as jest.Mock).mockResolvedValue({});
        const result = await updateLabelsThunk({ messageId: 'm1', labels: ['L1'] })(dispatch, getState, undefined);
        expect(result.payload).toEqual({ messageId: 'm1', labels: ['L1'] });
    });

    it('all thunks should handle generic error', async () => {
        (crmService.fetchThreads as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await fetchThreadsThunk({ eventId: 1 })(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to fetch threads');
    });

    it('toggleThreadStarThunk should reject with axios error message', async () => {
        (crmService.toggleThreadStar as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Star Error' } }
        });
        const result = await toggleThreadStarThunk({ threadId: 't1', isStarred: true })(dispatch, getState, undefined);
        expect(result.payload).toBe('Star Error');
    });

    it('toggleThreadReadThunk should reject with axios error message', async () => {
        (crmService.updateThreadReadStatus as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Read Error' } }
        });
        const result = await toggleThreadReadThunk({ threadId: 't1', isRead: true })(dispatch, getState, undefined);
        expect(result.payload).toBe('Read Error');
    });

    it('saveDraftThunk should reject with axios error message', async () => {
        (crmService.saveDraft as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Save Draft Error' } }
        });
        const result = await saveDraftThunk({ contactId: 1, eventId: 1, subject: 'S' })(dispatch, getState, undefined);
        expect(result.payload).toBe('Save Draft Error');
    });

    it('fetchDraftsThunk should reject with axios error message', async () => {
        (crmService.fetchDrafts as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Fetch Drafts Error' } }
        });
        const result = await fetchDraftsThunk({})(dispatch, getState, undefined);
        expect(result.payload).toBe('Fetch Drafts Error');
    });

    it('deleteDraftThunk should reject with axios error message', async () => {
        (crmService.deleteDraft as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Delete Draft Error' } }
        });
        const result = await deleteDraftThunk('d1')(dispatch, getState, undefined);
        expect(result.payload).toBe('Delete Draft Error');
    });

    it('fetchLabelDefinitionsThunk should reject with axios error message', async () => {
        (crmService.fetchLabelDefinitions as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Label Definitions Error' } }
        });
        const result = await fetchLabelDefinitionsThunk(undefined)(dispatch, getState, undefined);
        expect(result.payload).toBe('Label Definitions Error');
    });

    it('toggleThreadStarThunk should return threadId and isStarred on success', async () => {
        (crmService.toggleThreadStar as jest.Mock).mockResolvedValue({});
        const result = await toggleThreadStarThunk({ threadId: 't1', isStarred: true })(dispatch, getState, undefined);
        expect(result.payload).toEqual({ threadId: 't1', isStarred: true });
    });

    it('toggleThreadReadThunk should return threadId and isRead on success', async () => {
        (crmService.updateThreadReadStatus as jest.Mock).mockResolvedValue({});
        const result = await toggleThreadReadThunk({ threadId: 't1', isRead: true })(dispatch, getState, undefined);
        expect(result.payload).toEqual({ threadId: 't1', isRead: true });
    });

    it('deleteDraftThunk should return draftId on success', async () => {
        (crmService.deleteDraft as jest.Mock).mockResolvedValue({});
        const result = await deleteDraftThunk('d1')(dispatch, getState, undefined);
        expect(result.payload).toBe('d1');
    });

    it('should handle axios error without response message', async () => {
        (crmService.fetchCrmEvents as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            message: 'Network Error',
            response: { data: {} }
        });
        const result = await fetchEventsThunk()(dispatch, getState, undefined);
        expect(result.payload).toBe('Network Error');
    });

    it('fetchThreadsThunk should handle axios error without response message', async () => {
        (crmService.fetchThreads as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            message: 'Threads Network Error',
            response: { data: {} }
        });
        const result = await fetchThreadsThunk({ eventId: 1 })(dispatch, getState, undefined);
        expect(result.payload).toBe('Threads Network Error');
    });

    it('fetchMessagesThunk should handle axios error without response message', async () => {
        (crmService.fetchThreadMessages as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            message: 'Messages Network Error',
            response: { data: {} }
        });
        const result = await fetchMessagesThunk('t1')(dispatch, getState, undefined);
        expect(result.payload).toBe('Messages Network Error');
    });
});
