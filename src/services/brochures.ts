import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';
import { BROCHURE_BASE } from '../config/env';
export type BrochureItem = {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    message?: string;
    website_id?: number;
    now?: string;
    website?: { id: number; name: string };
};

export type BrochureSearchParams = {
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: string | number | boolean | undefined;
};

export type BrochureSearchResult = {
    items: BrochureItem[];
    total: number;
    page: number;
    limit: number;
    data?: BrochureItem[]; // To handle both API response formats
};

// const VITE_BROCHURE_BASE = import.meta.env.VITE_BROCHURE_BASE;

export async function createBrochure(payload: Partial<BrochureItem>): Promise<BrochureItem> {
    const { data } = await api.post(`${BROCHURE_BASE}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function searchBrochures(params: BrochureSearchParams = {}): Promise<BrochureSearchResult> {
    const { data } = await api.get(`${BROCHURE_BASE}/search`, {
        params,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });

    return {
        items: data.items ?? data.data ?? [],
        total: data.total ?? 0,
        page: data.page ?? params.page ?? 1,
        limit: data.limit ?? params.limit ?? 10,
    };
}

export async function deleteBrochure(id: number | string): Promise<void> {
    await api.delete(`${BROCHURE_BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function updateBrochure(id: number | string, data: Partial<BrochureItem>): Promise<BrochureItem> {
    const { data: result } = await api.patch(`${BROCHURE_BASE}/${id}`, data, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return result;
}
