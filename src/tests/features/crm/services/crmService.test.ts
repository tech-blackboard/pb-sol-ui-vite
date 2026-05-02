import { api } from '../../../../lib/api';
import * as crmService from '../../../../features/crm/services/crmService';

// Mock the api instance
jest.mock('../../../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('crmService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getAuthHeaders', () => {
    it('returns empty object if no token', async () => {
      // Internal function getAuthHeaders is used inside the public functions
      mockApi.get.mockResolvedValueOnce({ data: [] });
      await crmService.fetchCrmEvents();
      
      const lastCallHeaders = mockApi.get.mock.calls[0][1]?.headers;
      expect(lastCallHeaders).not.toHaveProperty('Authorization');
    });

    it('returns Authorization header if token exists in localStorage', async () => {
      localStorage.setItem('accessToken', 'test-token');
      mockApi.get.mockResolvedValueOnce({ data: [] });
      await crmService.fetchCrmEvents();
      
      const lastCallHeaders = mockApi.get.mock.calls[0][1]?.headers;
      expect(lastCallHeaders).toHaveProperty('Authorization', 'Bearer test-token');
    });
  });

  describe('fetchCrmEvents', () => {
    it('calls api.get with correct URL', async () => {
      const mockData = [{ id: 1, name: 'Event 1' }];
      mockApi.get.mockResolvedValueOnce({ data: mockData });
      
      const result = await crmService.fetchCrmEvents();
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/events'), expect.anything());
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchThreads', () => {
    it('calls api.get with params', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      await crmService.fetchThreads(1, 'search-term', 'domain.com');
      
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/threads'),
        expect.objectContaining({
          params: { eventId: 1, search: 'search-term', domain: 'domain.com', page: 1, limit: 50 }
        })
      );
    });
  });

  describe('fetchThreadMessages', () => {
    it('encodes thread ID and calls api.get', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      const threadId = 'thread/123';
      await crmService.fetchThreadMessages(threadId);
      
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining(`/messages/${encodeURIComponent(threadId)}`),
        expect.anything()
      );
    });
  });

  describe('updateMessageLabels', () => {
    it('calls api.put with labels', async () => {
      mockApi.put.mockResolvedValueOnce({});
      await crmService.updateMessageLabels('msg-1', ['label1', 'label2']);
      
      expect(mockApi.put).toHaveBeenCalledWith(
        expect.stringContaining('/messages/msg-1/labels'),
        { labels: ['label1', 'label2'] },
        expect.anything()
      );
    });
  });

  describe('unsubscribeContact', () => {
    it('calls api.put with reason', async () => {
      mockApi.put.mockResolvedValueOnce({});
      await crmService.unsubscribeContact(10, 'Testing');
      
      expect(mockApi.put).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/10/unsubscribe'),
        { reason: 'Testing' },
        expect.anything()
      );
    });
  });

  describe('sendReply', () => {
    it('calls api.post with payload', async () => {
      const payload = { contactId: 1, eventId: 1, subject: 'S', textBody: 'T', htmlBody: 'H' };
      mockApi.post.mockResolvedValueOnce({ data: { status: 'ok', messageId: 'm1' } });
      
      const result = await crmService.sendReply(payload);
      expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/reply'), payload, expect.anything());
      expect(result.status).toBe('ok');
    });
  });

  describe('saveDraft', () => {
    it('calls api.post and returns message', async () => {
      const payload = { contactId: 1, eventId: 1, subject: 'S' };
      const mockMsg = { id: 'd1', subject: 'S' };
      mockApi.post.mockResolvedValueOnce({ data: mockMsg });
      
      const result = await crmService.saveDraft(payload);
      expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/drafts'), payload, expect.anything());
      expect(result).toEqual(mockMsg);
    });
  });

  describe('fetchDrafts', () => {
    it('calls api.get with params', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { drafts: [], total: 0 } });
      await crmService.fetchDrafts(2, 20);
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/drafts'),
        expect.objectContaining({
          params: { page: 2, limit: 20 }
        })
      );
    });
  });

  describe('deleteDraft', () => {
    it('calls api.delete', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await crmService.deleteDraft('d1');
      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/drafts/d1'), expect.anything());
    });
  });

  describe('downloadAttachment', () => {
    it('triggers browser download', async () => {
      const mockBlob = new Blob(['content']);
      mockApi.get.mockResolvedValueOnce({ data: mockBlob });
      
      // Mock window.URL
      const mockUrl = 'blob:url';
      window.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
      window.URL.revokeObjectURL = jest.fn();
      
      // Mock document.createElement
      const mockLink = {
        href: '',
        setAttribute: jest.fn(),
        click: jest.fn(),
        parentNode: { removeChild: jest.fn() }
      } as unknown as HTMLAnchorElement;
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();

      await crmService.downloadAttachment(1, 'test.pdf');
      
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/attachments/1/download'), expect.anything());
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test.pdf');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('Email Account Management', () => {
    it('fetchEmailAccounts calls api.get with params', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      await crmService.fetchEmailAccounts(1, 'search');
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/email-accounts'),
        expect.objectContaining({ params: { eventId: 1, search: 'search' } })
      );
    });

    it('createEmailAccount calls api.post', async () => {
      const payload = { name: 'New' };
      mockApi.post.mockResolvedValueOnce({ data: { id: 1, ...payload } });
      await crmService.createEmailAccount(payload);
      expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/email-accounts'), payload, expect.anything());
    });

    it('updateEmailAccount calls api.patch', async () => {
      const payload = { name: 'Updated' };
      mockApi.patch.mockResolvedValueOnce({ data: { id: 1, ...payload } });
      await crmService.updateEmailAccount(1, payload);
      expect(mockApi.patch).toHaveBeenCalledWith(expect.stringContaining('/email-accounts/1'), payload, expect.anything());
    });

    it('deleteEmailAccount calls api.delete', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await crmService.deleteEmailAccount(1);
      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/email-accounts/1'), expect.anything());
    });

    it('getMicrosoftAuthUrl returns url', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { url: 'http://auth.url' } });
      const result = await crmService.getMicrosoftAuthUrl(1);
      expect(result).toBe('http://auth.url');
    });
  });

  describe('toggleThreadStar and updateThreadReadStatus', () => {
    it('toggleThreadStar calls api.put', async () => {
      mockApi.put.mockResolvedValueOnce({});
      await crmService.toggleThreadStar('t1', true);
      expect(mockApi.put).toHaveBeenCalledWith(expect.stringContaining('/threads/t1/star'), { isStarred: true }, expect.anything());
    });

    it('updateThreadReadStatus calls api.put', async () => {
      mockApi.put.mockResolvedValueOnce({});
      await crmService.updateThreadReadStatus('t1', true);
      expect(mockApi.put).toHaveBeenCalledWith(expect.stringContaining('/threads/t1/read'), { isRead: true }, expect.anything());
    });
  });

  describe('fetchReplyEmails, fetchLabels, fetchLabelDefinitions', () => {
    it('fetchReplyEmails calls api.get', async () => {
      mockApi.get.mockResolvedValueOnce({ data: ['e1@test.com'] });
      const res = await crmService.fetchReplyEmails(1);
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/reply-emails/1'), expect.anything());
      expect(res).toEqual(['e1@test.com']);
    });

    it('fetchLabels calls api.get', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      await crmService.fetchLabels(1);
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/labels'), expect.objectContaining({ params: { eventId: 1 } }));
    });

    it('fetchLabelDefinitions calls api.get', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      await crmService.fetchLabelDefinitions();
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/labels/definitions'), expect.anything());
    });
  });

  describe('Trash Management', () => {
    it('trashThreads calls api.post', async () => {
      mockApi.post.mockResolvedValueOnce({});
      await crmService.trashThreads(['t1']);
      expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/threads/trash'), { threadIds: ['t1'] }, expect.anything());
    });

    it('restoreThreads calls api.post', async () => {
      mockApi.post.mockResolvedValueOnce({});
      await crmService.restoreThreads(['t1']);
      expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/threads/restore'), { threadIds: ['t1'] }, expect.anything());
    });

    it('deleteThreadsPermanently calls api.delete', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await crmService.deleteThreadsPermanently(['t1']);
      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/threads/permanent'), expect.objectContaining({ data: { threadIds: ['t1'] } }));
    });

    it('emptyTrash calls api.delete', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await crmService.emptyTrash(1);
      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/threads/empty-trash/1'), expect.anything());
    });
  });
});
