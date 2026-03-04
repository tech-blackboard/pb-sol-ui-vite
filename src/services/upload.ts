import { UPLOAD_BASE } from '../config/env';
import { api } from '../lib/api';

/**
 * Handle AWS S3 related operations
 */
export const uploadService = {
    /**
     * Generate a pre-signed URL for an existing file in S3
     * @param key S3 key of the file
     * @param expiresIn Optional expiration time in seconds
     * @returns Pre-signed URL
     */
    async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
        const params: any = { key };
        if (expiresIn) {
            params.expiresIn = expiresIn;
        }

        const { data } = await api.get<{ url: string }>(`${UPLOAD_BASE}/signed-url`, {
            params,
        });
        return data.url;
    },

    /**
     * Upload a file to S3
     * @param file File to upload
     * @returns Object containing public URL and key
     */
    async uploadFile(file: File): Promise<{ url: string; key: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<{ url: string; key: string }>(`${UPLOAD_BASE}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
};
