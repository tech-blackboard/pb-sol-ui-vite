import * as crmService from '../../../../features/crm/services/crmService';
import { api } from '../../../../lib/api';

jest.mock('../../../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../../../../config/env', () => ({
  CRM_BASE: '/api/crm',
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── helpers ─

const mockToken = (token: string | null, store: 'localStorage' | 'sessionStorage' = 'localStorage') => {
  localStorage.clear();
  sessionStorage.clear();
  if (token) {
    if (store === 'localStorage') localStorage.setItem('accessToken', token);
    else sessionStorage.setItem('accessToken', token);
  }
};

// ── fetchCrmEvents ─

describe('fetchCrmEvents', () => {
  it('returns events on success with localStorage token', async () => {
    mockToken('tok-abc');
    const events = [{ id: 1, name: 'Conf A' }];
    mockApi.get.mockResolvedValueOnce({ data: events });

    const result = await crmService.fetchCrmEvents();

    expect(result).toEqual(events);
    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/crm/events',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok-abc' }),
        withCredentials: true,
      }),
    );
  });

  it('uses sessionStorage token when localStorage has none', async () => {
    mockToken('sess-tok', 'sessionStorage');
    mockApi.get.mockResolvedValueOnce({ data: [] });

    await crmService.fetchCrmEvents();

    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/crm/events',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer sess-tok' }),
      }),
    );
  });

  it('sends no Authorization header when no token exists', async () => {
    mockToken(null);
    mockApi.get.mockResolvedValueOnce({ data: [] });

    await crmService.fetchCrmEvents();

    const callHeaders = mockApi.get.mock.calls[0][1]?.headers as Record<string, string>;
    expect(callHeaders['Authorization']).toBeUndefined();
  });

  it('throws when api rejects', async () => {
    mockToken('tok');
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    await expect(crmService.fetchCrmEvents()).rejects.toThrow('Network error');
  });
});

// ── fetchThreads ──

describe('fetchThreads', () => {
  it('returns threads for the given eventId', async () => {
    mockToken('tok');
    const threads = [{ id: 'thread-1', subject: 'Hello' }];
    mockApi.get.mockResolvedValueOnce({ data: threads });

    const result = await crmService.fetchThreads(42);

    expect(result).toEqual(threads);
    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/crm/threads',
      expect.objectContaining({ params: { eventId: 42 } }),
    );
  });

  it('throws on api failure', async () => {
    mockToken('tok');
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(crmService.fetchThreads(1)).rejects.toThrow('fail');
  });
});

// ── fetchThreadMessages ──

describe('fetchThreadMessages', () => {
  it('URL-encodes the threadId and returns messages', async () => {
    mockToken('tok');
    const messages = [{ id: 'msg-1' }];
    mockApi.get.mockResolvedValueOnce({ data: messages });

    const result = await crmService.fetchThreadMessages('thread/with spaces');

    expect(result).toEqual(messages);
    expect(mockApi.get).toHaveBeenCalledWith(
      `/api/crm/messages/${encodeURIComponent('thread/with spaces')}`,
      expect.anything(),
    );
  });

  it('throws on api failure', async () => {
    mockToken('tok');
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(crmService.fetchThreadMessages('t1')).rejects.toThrow('fail');
  });
});

// ── updateMessageLabels ───────────────────────────────────────────────────────

describe('updateMessageLabels', () => {
  it('calls PUT with encoded messageId and labels payload', async () => {
    mockToken('tok');
    mockApi.put.mockResolvedValueOnce({});

    await crmService.updateMessageLabels('msg/1', ['positive', 'abstract']);

    expect(mockApi.put).toHaveBeenCalledWith(
      `/api/crm/messages/${encodeURIComponent('msg/1')}/labels`,
      { labels: ['positive', 'abstract'] },
      expect.anything(),
    );
  });

  it('throws on api failure', async () => {
    mockToken('tok');
    mockApi.put.mockRejectedValueOnce(new Error('fail'));
    await expect(crmService.updateMessageLabels('msg-1', [])).rejects.toThrow('fail');
  });
});

// ── unsubscribeContact ───────────────────────────────────────────────────────

describe('unsubscribeContact', () => {
  it('calls PUT with contactId and reason', async () => {
    mockToken('tok');
    mockApi.put.mockResolvedValueOnce({});

    await crmService.unsubscribeContact(7, 'User requested');

    expect(mockApi.put).toHaveBeenCalledWith(
      '/api/crm/contacts/7/unsubscribe',
      { reason: 'User requested' },
      expect.anything(),
    );
  });

  it('calls PUT with undefined reason when omitted', async () => {
    mockToken('tok');
    mockApi.put.mockResolvedValueOnce({});

    await crmService.unsubscribeContact(7);

    expect(mockApi.put).toHaveBeenCalledWith(
      '/api/crm/contacts/7/unsubscribe',
      { reason: undefined },
      expect.anything(),
    );
  });

  it('throws on api failure', async () => {
    mockToken('tok');
    mockApi.put.mockRejectedValueOnce(new Error('fail'));
    await expect(crmService.unsubscribeContact(1)).rejects.toThrow('fail');
  });
});

// ── sendReply ─────────────────────────────────────────────────────────────────

describe('sendReply', () => {
  it('posts the payload and returns the response data', async () => {
    mockToken('tok');
    const responseData = { status: 'ok', messageId: 'new-msg-1' };
    mockApi.post.mockResolvedValueOnce({ data: responseData });

    const payload = {
      threadId: 'th-1',
      subject: 'Re: Hello',
      textBody: 'Hello there',
      htmlBody: '<p>Hello there</p>',
    };
    const result = await crmService.sendReply(payload);

    expect(result).toEqual(responseData);
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/crm/reply',
      payload,
      expect.anything(),
    );
  });

  it('throws on api failure', async () => {
    mockToken('tok');
    mockApi.post.mockRejectedValueOnce(new Error('fail'));
    await expect(
      crmService.sendReply({ threadId: 't', subject: 's', textBody: 'b', htmlBody: '<b>' }),
    ).rejects.toThrow('fail');
  });
});

// ── fetchLabels ───────────────────────────────────────────────────────────────

describe('fetchLabels', () => {
  it('fetches labels without eventId', async () => {
    mockToken('tok');
    const labels = [{ label: 'positive', count: 3 }];
    mockApi.get.mockResolvedValueOnce({ data: labels });

    const result = await crmService.fetchLabels();

    expect(result).toEqual(labels);
    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/crm/labels',
      expect.objectContaining({ params: { eventId: undefined } }),
    );
  });

  it('passes eventId as a query param when provided', async () => {
    mockToken('tok');
    mockApi.get.mockResolvedValueOnce({ data: [] });

    await crmService.fetchLabels(99);

    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/crm/labels',
      expect.objectContaining({ params: { eventId: 99 } }),
    );
  });

  it('throws on api failure', async () => {
    mockToken('tok');
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(crmService.fetchLabels()).rejects.toThrow('fail');
  });
});

// ── downloadAttachment ────────────────────────────────────────────────────────

describe('downloadAttachment', () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let clickSpy: jest.Mock;

  beforeEach(() => {
    mockToken('tok');
    createObjectURLMock = jest.fn().mockReturnValue('blob://fake');
    revokeObjectURLMock = jest.fn();
    clickSpy = jest.fn();

    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURLMock, writable: true, configurable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURLMock, writable: true, configurable: true });

    // Intercept createElement to capture the anchor so we can verify click
    const origCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        jest.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => clickSpy());
      }
      return el;
    });
    jest.spyOn(document.body, 'appendChild').mockReturnValue({} as Node);
    jest.spyOn(document.body, 'removeChild').mockReturnValue({} as Node);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches the attachment blob, triggers download, and cleans up', async () => {
    const fakeBlob = new Blob(['data']);
    mockApi.get.mockResolvedValueOnce({ data: fakeBlob });

    await crmService.downloadAttachment(5, 'report.pdf');

    expect(mockApi.get).toHaveBeenCalledWith(
      '/api/crm/attachments/5/download',
      expect.objectContaining({ responseType: 'blob' }),
    );
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob://fake');
  });

  it('throws when the api call fails', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    await expect(crmService.downloadAttachment(1, 'file.pdf')).rejects.toThrow('Network error');
  });
});
