import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';

export const CONTACT_BUCKET_BASE = import.meta.env.VITE_CONTACT_BUCKET_BASE ?? '/contact-bucket';

export type ContactBucketItem = {
    id: number;
    name?: string;
    email: string;
    altemail?: string;
    phone?: string;
    wphone?: string;
    organization?: string;
    country?: string;
    labels?: string[];
    notes?: string;
    lastInteraction?: string;
    createdAt?: string;
    updatedAt?: string;
    website?: { id: number; name: string };
};

export type ContactBucketSearchParams = {
    page?: number;
    limit?: number;
    search?: string;
    website_id?: number;
    label?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    [key: string]: string | number | boolean | undefined;
};

export type ContactBucketSearchResult = {
    items: ContactBucketItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export async function searchContactBucket(params: ContactBucketSearchParams = {}): Promise<ContactBucketSearchResult> {
    const { data } = await api.get(`${CONTACT_BUCKET_BASE}/search`, {
        params,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });

    return {
        items: data.items ?? data.data ?? [],
        total: data.total ?? 0,
        page: data.page ?? params.page ?? 1,
        limit: data.limit ?? params.limit ?? 10,
        totalPages: data.totalPages ?? 1,
    };
}

export async function getContactBucketById(id: number): Promise<ContactBucketItem> {
    const { data } = await api.get(`${CONTACT_BUCKET_BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function createContactBucket(payload: Partial<ContactBucketItem> & { website_id: number }): Promise<ContactBucketItem> {
    const { data } = await api.post(`${CONTACT_BUCKET_BASE}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function updateContactBucket(id: number, payload: Partial<ContactBucketItem> & { website_id?: number }): Promise<ContactBucketItem> {
    const { data } = await api.patch(`${CONTACT_BUCKET_BASE}/${id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function getContactBucketLabels(): Promise<string[]> {
    const { data } = await api.get(`${CONTACT_BUCKET_BASE}/labels`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function addLabelToContact(id: number, label: string): Promise<ContactBucketItem> {
    const { data } = await api.post(`${CONTACT_BUCKET_BASE}/${id}/labels`, { label }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function removeLabelFromContact(id: number, label: string): Promise<ContactBucketItem> {
    const { data } = await api.delete(`${CONTACT_BUCKET_BASE}/${id}/labels`, {
        data: { label },
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}
