import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';
import { SPONSORSHIP_BASE } from '../config/env';
export type SponsorshipItem = {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    country?: string;
    message?: string;
    website_id?: number;
    now?: string;
    website?: { id: number; name: string };
};

export type SponsorshipSearchParams = {
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: string | number | boolean | undefined;
};

export type SponsorshipSearchResult = {
    items: SponsorshipItem[];
    total: number;
    page: number;
    limit: number;
};

// const VITE_SPONSORSHIP_BASE = import.meta.env.VITE_SPONSORSHIP_BASE;

export async function searchSponsorships(params: SponsorshipSearchParams = {}): Promise<SponsorshipSearchResult> {
    const { data } = await api.get(`${SPONSORSHIP_BASE}/search`, {
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

export async function createSponsorship(payload: Partial<SponsorshipItem>): Promise<SponsorshipItem> {
    const { data } = await api.post(`${SPONSORSHIP_BASE}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function deleteSponsorship(id: number | string): Promise<void> {
    await api.delete(`${SPONSORSHIP_BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}
