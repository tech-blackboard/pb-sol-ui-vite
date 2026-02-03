import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';

export type SponsorshipItem = {
    id: number;
    name: string;
    email: string;
    phone: string;
    organization: string;
    country: string;
    message: string;
    now: string;
    website?: { id: number; name: string };
};

export type SponsorshipSearchResult = {
    items: SponsorshipItem[];
    total: number;
    page: number;
    limit: number;
};

const BASE = '/sponsorship';

export async function searchSponsorships(params: any = {}): Promise<SponsorshipSearchResult> {
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

export async function deleteSponsorship(id: number | string): Promise<void> {
    await api.delete(`${BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}
