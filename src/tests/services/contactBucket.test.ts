import { searchContactBucket, getContactBucketById, createContactBucket, updateContactBucket, getContactBucketLabels } from '../../services/contactBucket';
import { api } from '../../lib/api';

jest.mock('../../lib/api');
jest.mock('../../services/abstracts', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer token' })
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('contactBucket service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('searchContactBucket should call api.get and return formatted result', async () => {
    const mockData = {
      items: [{ id: 1, email: 'test@example.com' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    };
    mockApi.get.mockResolvedValue({ data: mockData });

    const result = await searchContactBucket({ search: 'test' });

    expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/contact-bucket/search'), expect.objectContaining({
      params: { search: 'test' }
    }));
    expect(result.items).toEqual(mockData.items);
    expect(result.total).toBe(1);
  });

  it('searchContactBucket should handle data without items key', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [{ id: 2 }], total: 1 } });
    const result = await searchContactBucket();
    expect(result.items).toEqual([{ id: 2 }]);
  });

  it('getContactBucketById should call api.get with id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: 1 } });
    const result = await getContactBucketById(1);
    expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/contact-bucket/1'), expect.anything());
    expect(result.id).toBe(1);
  });

  it('createContactBucket should call api.post with payload', async () => {
    const payload = { email: 'new@test.com', website_id: 1 };
    mockApi.post.mockResolvedValue({ data: { id: 2, ...payload } });
    const result = await createContactBucket(payload);
    expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/contact-bucket'), payload, expect.anything());
    expect(result.id).toBe(2);
  });

  it('updateContactBucket should call api.patch with id and payload', async () => {
    const payload = { name: 'Updated' };
    mockApi.patch.mockResolvedValue({ data: { id: 1, ...payload } });
    const result = await updateContactBucket(1, payload);
    expect(mockApi.patch).toHaveBeenCalledWith(expect.stringContaining('/contact-bucket/1'), payload, expect.anything());
    expect(result.name).toBe('Updated');
  });

  it('getContactBucketLabels should return array of label objects', async () => {
    const mockLabels = [
      { id: 1, name: 'Label1', description: 'desc1' },
      { id: 2, name: 'Label2', description: 'desc2' }
    ];
    mockApi.get.mockResolvedValue({ data: mockLabels });
    const result = await getContactBucketLabels();
    expect(result).toEqual(mockLabels);
  });
});
