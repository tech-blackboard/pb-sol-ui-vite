import { fetchEventsThunk, fetchThreadsThunk, fetchMessagesThunk, sendReplyThunk, updateLabelsThunk } from '../../../../store/slices/crm/crm.thunks';
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

        const result = await fetchThreadsThunk(1)(dispatch, getState, undefined);
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

        const result = await sendReplyThunk({ threadId: '1', subject: 'S', textBody: 'B', htmlBody: 'H' })(dispatch, getState, undefined);
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
        const result = await fetchThreadsThunk(1)(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to fetch threads');
    });
});
