import { getS3KeyFromUrl } from '../../utils/s3Utils';

describe('s3Utils', () => {
    describe('getS3KeyFromUrl', () => {
        it('should return empty string if no url', () => {
            expect(getS3KeyFromUrl('')).toBe('');
            expect(getS3KeyFromUrl(null as unknown as string)).toBe('');
        });

        it('should extract key from standard S3 URL (line 15)', () => {
            const url = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/document.pdf';
            expect(getS3KeyFromUrl(url)).toBe('uploads/document.pdf');
        });

        it('should handle URL encoding in pathname', () => {
            const url = 'https://my-bucket.s3.us-east-1.amazonaws.com/path%20with%20spaces/file.pdf';
            expect(getS3KeyFromUrl(url)).toBe('path with spaces/file.pdf');
        });

        it('should return original string if it is not an S3 URL', () => {
            const url = 'https://example.com/not-s3/file.pdf';
            expect(getS3KeyFromUrl(url)).toBe(url);
        });

        it('should return original string and log error if URL is invalid (lines 21-23)', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const invalidUrl = 'not-a-url';
            expect(getS3KeyFromUrl(invalidUrl)).toBe(invalidUrl);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle pathname that does not start with / (line 15 branch)', () => {
            const url = 'https://my-bucket.s3.us-east-1.amazonaws.com/uploads/file.pdf';
            // We mock the URL object's pathname to NOT start with / to trigger the else branch
            const originalURL = window.URL;
            window.URL = jest.fn().mockImplementation(() => ({
                hostname: 'my-bucket.s3.us-east-1.amazonaws.com',
                pathname: 'no-slash-path',
                startsWith: String.prototype.startsWith
            })) as unknown as typeof URL;

            expect(getS3KeyFromUrl(url)).toBe('no-slash-path');
            window.URL = originalURL;
        });
    });
});
