import { uploadService } from '../../services/upload';
import { api } from '../../lib/api';

jest.mock('../../lib/api');

describe('uploadService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSignedUrl', () => {
        it('should call api.get with correct params (lines 14-24)', async () => {
            (api.get as jest.Mock).mockResolvedValue({ data: { url: 'presigned-url' } });
            
            const url = await uploadService.getSignedUrl('test-key', 3600);
            
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/signed-url'), {
                params: { key: 'test-key', expiresIn: 3600 }
            });
            expect(url).toBe('presigned-url');
        });

        it('should work without expiresIn', async () => {
            (api.get as jest.Mock).mockResolvedValue({ data: { url: 'presigned-url' } });
            await uploadService.getSignedUrl('test-key');
            expect(api.get).toHaveBeenCalledWith(expect.anything(), {
                params: { key: 'test-key' }
            });
        });
    });

    describe('uploadFile', () => {
        it('should call api.post with FormData (lines 31-41)', async () => {
            (api.post as jest.Mock).mockResolvedValue({ data: { url: 'file-url', key: 'file-key' } });
            
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            const result = await uploadService.uploadFile(file);
            
            expect(api.post).toHaveBeenCalledWith(expect.anything(), expect.any(FormData), {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            expect(result).toEqual({ url: 'file-url', key: 'file-key' });
        });
    });
});
