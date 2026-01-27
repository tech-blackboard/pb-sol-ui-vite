import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';

export type BrochureItem = {
    id: number;
    name: string;
    email: string;
    phone: string;
    country: string;
    message: string;
    now: string;
    website?: { id: number; name: string };
};

export type BrochureSearchResult = {
    items: BrochureItem[];
    total: number;
    page: number;
    limit: number;
};

const BASE = '/brochure';

export async function searchBrochures(params: any = {}): Promise<BrochureSearchResult> {
    const { data } = await api.get(`${BASE}/search`, {
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
    await api.delete(`${BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}
