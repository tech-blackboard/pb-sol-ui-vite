import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';

export type ContactItem = {
    id: number;
    name: string;
    email: string;
    phone: string;
    country: string;
    message: string;
    now: string;
    website?: { id: number; name: string };
};

export type ContactSearchResult = {
    items: ContactItem[];
    total: number;
    page: number;
    limit: number;
};

const BASE = '/contact';

export async function searchContacts(params: any = {}): Promise<ContactSearchResult> {
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

export async function deleteContact(id: number | string): Promise<void> {
    await api.delete(`${BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}
