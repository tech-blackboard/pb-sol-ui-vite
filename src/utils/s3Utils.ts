/**
 * Utility to extract S3 key from a full S3 URL
 * @param url Full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/path/to/file.pdf)
 * @returns The S3 key (e.g., path/to/file.pdf)
 */
export const getS3KeyFromUrl = (url: string): string => {
    if (!url) return '';

    try {
        const urlObj = new URL(url);

        // Check if it's an S3 URL
        if (urlObj.hostname.includes('.s3.') && urlObj.hostname.includes('.amazonaws.com')) {
            // Path usually starts with /
            return decodeURIComponent(urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname);
        }

        // Fallback for other potential formats if needed
        return url;
    } catch (error) {
        // If URL parsing fails, return as is (could be a relative path already)
        return url;
    }
};
