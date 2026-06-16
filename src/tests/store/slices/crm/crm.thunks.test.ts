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
    fetchLabelDefinitionsThunk,
    trashThreadsThunk,
    restoreThreadsThunk,
    deleteThreadsPermanentlyThunk,
    emptyTrashThunk,
    fetchEmailAccountsThunk,
    composeEmailThunk,
    junkThreadsThunk,
    restoreThreadsFromJunkThunk
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

    it('trashThreadsThunk should return threadIds on success', async () => {
        (crmService.trashThreads as jest.Mock).mockResolvedValue({});
        const result = await trashThreadsThunk(['t1', 't2'])(dispatch, getState, undefined);
        expect(result.payload).toEqual(['t1', 't2']);
    });

    it('trashThreadsThunk should reject with axios error message', async () => {
        (crmService.trashThreads as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Trash Error' } }
        });
        const result = await trashThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Trash Error');
    });

    it('restoreThreadsThunk should return threadIds on success', async () => {
        (crmService.restoreThreads as jest.Mock).mockResolvedValue({});
        const result = await restoreThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toEqual(['t1']);
    });

    it('restoreThreadsThunk should reject with axios error message', async () => {
        (crmService.restoreThreads as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Restore Error' } }
        });
        const result = await restoreThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Restore Error');
    });

    it('deleteThreadsPermanentlyThunk should return threadIds on success', async () => {
        (crmService.deleteThreadsPermanently as jest.Mock).mockResolvedValue({});
        const result = await deleteThreadsPermanentlyThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toEqual(['t1']);
    });

    it('deleteThreadsPermanentlyThunk should reject with axios error message', async () => {
        (crmService.deleteThreadsPermanently as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Delete Error' } }
        });
        const result = await deleteThreadsPermanentlyThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Delete Error');
    });

    it('emptyTrashThunk should return eventId on success', async () => {
        (crmService.emptyTrash as jest.Mock).mockResolvedValue({});
        const result = await emptyTrashThunk(1)(dispatch, getState, undefined);
        expect(result.payload).toBe(1);
    });

    it('emptyTrashThunk should reject with fallback message', async () => {
        (crmService.emptyTrash as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await emptyTrashThunk(1)(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to empty trash');
    });

    it('fetchEmailAccountsThunk should reject with axios error message', async () => {
        (crmService.fetchEmailAccounts as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Accounts Error' } }
        });
        const result = await fetchEmailAccountsThunk(1)(dispatch, getState, undefined);
        expect(result.payload).toBe('Accounts Error');
    });

    it('fetchEmailAccountsThunk should reject with fallback message', async () => {
        (crmService.fetchEmailAccounts as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await fetchEmailAccountsThunk(1)(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to fetch email accounts');
    });

    it('composeEmailThunk should reject with axios error message', async () => {
        (crmService.composeEmail as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Compose Error' } }
        });
        const result = await composeEmailThunk({ eventId: 1, toEmail: 'a@b.com', subject: 'A', htmlBody: 'B' })(dispatch, getState, undefined);
        expect(result.payload).toBe('Compose Error');
    });

    it('composeEmailThunk should reject with fallback message', async () => {
        (crmService.composeEmail as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await composeEmailThunk({ eventId: 1, toEmail: 'a@b.com', subject: 'A', htmlBody: 'B' })(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to send email');
    });

    it('composeEmailThunk should succeed', async () => {
        (crmService.composeEmail as jest.Mock).mockResolvedValue({ id: 'msg1' });
        const result = await composeEmailThunk({ eventId: 1, toEmail: 'a@b.com', subject: 'A', htmlBody: 'B' })(dispatch, getState, undefined);
        expect(result.payload).toEqual({ id: 'msg1' });
    });

    it('junkThreadsThunk should reject with axios error message', async () => {
        (crmService.junkThreads as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Junk Error' } }
        });
        const result = await junkThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Junk Error');
    });

    it('junkThreadsThunk should succeed', async () => {
        (crmService.junkThreads as jest.Mock).mockResolvedValue(undefined);
        const result = await junkThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toEqual(['t1']);
    });

    it('restoreThreadsFromJunkThunk should reject with axios error message', async () => {
        (crmService.restoreThreadsFromJunk as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Restore Error' } }
        });
        const result = await restoreThreadsFromJunkThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Restore Error');
    });

    it('restoreThreadsFromJunkThunk should succeed', async () => {
        (crmService.restoreThreadsFromJunk as jest.Mock).mockResolvedValue(undefined);
        const result = await restoreThreadsFromJunkThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toEqual(['t1']);
    });

    it('trashThreadsThunk should handle generic error', async () => {
        (crmService.trashThreads as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await trashThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to move threads to trash');
    });

    it('restoreThreadsThunk should handle generic error', async () => {
        (crmService.restoreThreads as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await restoreThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to restore threads from trash');
    });

    it('deleteThreadsPermanentlyThunk should handle generic error', async () => {
        (crmService.deleteThreadsPermanently as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await deleteThreadsPermanentlyThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to delete threads permanently');
    });

    it('junkThreadsThunk should handle generic error', async () => {
        (crmService.junkThreads as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await junkThreadsThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to report threads as spam');
    });

    it('restoreThreadsFromJunkThunk should handle generic error', async () => {
        (crmService.restoreThreadsFromJunk as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await restoreThreadsFromJunkThunk(['t1'])(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to restore threads from junk');
    });

    it('should join array error messages', async () => {
        (crmService.deleteDraft as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: ['Error 1', 'Error 2'] } }
        });
        const result = await deleteDraftThunk('d1')(dispatch, getState, undefined);
        expect(result.payload).toBe('Error 1, Error 2');
    });

    it('covers err.message fallback when response.data.message is missing (lines 245-246, 258-259, 271-272, 284-285)', async () => {
        const errObj = { isAxiosError: true, message: 'Axios Fallback Message', response: { data: {} } };
        
        (crmService.deleteThreadsPermanently as jest.Mock).mockRejectedValue(errObj);
        (crmService.emptyTrash as jest.Mock).mockRejectedValue(errObj);
        (crmService.junkThreads as jest.Mock).mockRejectedValue(errObj);
        (crmService.restoreThreadsFromJunk as jest.Mock).mockRejectedValue(errObj);

        const thunks = [
            deleteThreadsPermanentlyThunk(['1']),
            emptyTrashThunk(1),
            junkThreadsThunk(['1']),
            restoreThreadsFromJunkThunk(['1'])
        ];

        for (const t of thunks) {
            const res = await t(dispatch, getState, undefined);
            expect(res.payload).toBe('Axios Fallback Message');
        }
    });

    it('covers all error branches for all crm thunks', async () => {
        const testCases = [
            { thunk: fetchEventsThunk(), mockFn: crmService.fetchCrmEvents, fallback: 'Failed to fetch events' },
            { thunk: fetchThreadsThunk({}), mockFn: crmService.fetchThreads, fallback: 'Failed to fetch threads' },
            { thunk: fetchEmailAccountsThunk(1), mockFn: crmService.fetchEmailAccounts, fallback: 'Failed to fetch email accounts' },
            { thunk: fetchMessagesThunk('1'), mockFn: crmService.fetchThreadMessages, fallback: 'Failed to fetch messages' },
            { thunk: toggleThreadStarThunk({ threadId: '1', isStarred: true }), mockFn: crmService.toggleThreadStar, fallback: 'Failed to update star status' },
            { thunk: toggleThreadReadThunk({ threadId: '1', isRead: true }), mockFn: crmService.updateThreadReadStatus, fallback: 'Failed to update read status' },
            { thunk: sendReplyThunk({ contactId: 1, eventId: 1, subject: '', textBody: '', htmlBody: '' }), mockFn: crmService.sendReply, fallback: 'Failed to send reply' },
            { thunk: deleteDraftThunk('1'), mockFn: crmService.deleteDraft, fallback: 'Failed to delete draft', isArray: true },
            { thunk: fetchLabelDefinitionsThunk(), mockFn: crmService.fetchLabelDefinitions, fallback: 'Failed to fetch label definitions' },
            { thunk: trashThreadsThunk(['1']), mockFn: crmService.trashThreads, fallback: 'Failed to move threads to trash', isArray: true },
            { thunk: restoreThreadsThunk(['1']), mockFn: crmService.restoreThreads, fallback: 'Failed to restore threads from trash', isArray: true },
            { thunk: deleteThreadsPermanentlyThunk(['1']), mockFn: crmService.deleteThreadsPermanently, fallback: 'Failed to delete threads permanently', isArray: true },
            { thunk: emptyTrashThunk(1), mockFn: crmService.emptyTrash, fallback: 'Failed to empty trash', isArray: true },
            { thunk: junkThreadsThunk(['1']), mockFn: crmService.junkThreads, fallback: 'Failed to report threads as spam', isArray: true },
            { thunk: restoreThreadsFromJunkThunk(['1']), mockFn: crmService.restoreThreadsFromJunk, fallback: 'Failed to restore threads from junk', isArray: true },
        ];

        for (const tc of testCases) {
            // Test 1: Non-Axios Error (fallback message)
            (tc.mockFn as jest.Mock).mockRejectedValue(new Error('Normal Error'));
            let res = await tc.thunk(dispatch, getState, undefined);
            expect(res.payload).toBe(tc.fallback);

            // Test 2: Axios Error missing response data message (fallback to err.message)
            (tc.mockFn as jest.Mock).mockRejectedValue({
                isAxiosError: true,
                message: 'Fallback Axios Message',
                response: { data: {} }
            });
            res = await tc.thunk(dispatch, getState, undefined);
            expect(res.payload).toBe('Fallback Axios Message');

            // Test 3: Array message join
            (tc.mockFn as jest.Mock).mockRejectedValue({
                isAxiosError: true,
                response: { data: { message: ['Arr1', 'Arr2'] } }
            });
            res = await tc.thunk(dispatch, getState, undefined);
            if (tc.isArray) {
                expect(res.payload).toBe('Arr1, Arr2');
            } else {
                expect(res.payload).toEqual(['Arr1', 'Arr2']);
            }
        }
    });

    it('saveDraftThunk should reject with fallback message on generic error (line 169)', async () => {
        (crmService.saveDraft as jest.Mock).mockRejectedValue(new Error('Generic Fail'));
        const result = await saveDraftThunk({ eventId: 1, subject: 'S' })(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to save draft');
    });

    it('saveDraftThunk should succeed', async () => {
        (crmService.saveDraft as jest.Mock).mockResolvedValue({ id: 'draft1' });
        const result = await saveDraftThunk({ eventId: 1, subject: 'S' })(dispatch, getState, undefined);
        expect(result.payload).toEqual({ id: 'draft1' });
    });

    it('fetchDraftsThunk should reject with fallback message on generic error (line 181)', async () => {
        (crmService.fetchDrafts as jest.Mock).mockRejectedValue(new Error('Generic Fail'));
        const result = await fetchDraftsThunk({})(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to fetch drafts');
    });

    it('fetchDraftsThunk should succeed', async () => {
        (crmService.fetchDrafts as jest.Mock).mockResolvedValue({ drafts: [], total: 0 });
        const result = await fetchDraftsThunk({})(dispatch, getState, undefined);
        expect(result.payload).toEqual({ drafts: [], total: 0 });
    });

    it('updateLabelsThunk should reject with fallback message on generic error', async () => {
        (crmService.updateMessageLabels as jest.Mock).mockRejectedValue(new Error('Label Fail'));
        const result = await updateLabelsThunk({ messageId: 'm1', labels: [] })(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to update labels');
    });

    it('sendReplyThunk should succeed', async () => {
        (crmService.sendReply as jest.Mock).mockResolvedValue({ id: 'msg1' });
        const result = await sendReplyThunk({ contactId: 1, eventId: 1, subject: 'S', textBody: 'B', htmlBody: 'H' })(dispatch, getState, undefined);
        expect(result.payload).toEqual({ id: 'msg1' });
    });

    it('fetchLabelDefinitionsThunk should succeed', async () => {
        (crmService.fetchLabelDefinitions as jest.Mock).mockResolvedValue([{ id: 'l1' }]);
        const result = await fetchLabelDefinitionsThunk(undefined)(dispatch, getState, undefined);
        expect(result.payload).toEqual([{ id: 'l1' }]);
    });

    it('fetchLabelDefinitionsThunk should reject with fallback on generic error', async () => {
        (crmService.fetchLabelDefinitions as jest.Mock).mockRejectedValue(new Error('Fail'));
        const result = await fetchLabelDefinitionsThunk(undefined)(dispatch, getState, undefined);
        expect(result.payload).toBe('Failed to fetch label definitions');
    });
});

