import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';
import { CONTACT_BUCKET_BASE } from '../config/env';


export type CrmLabel = {
    id: number;
    name: string;
    description: string;
};

export type ContactBucketItem = {
    id: number;
    name?: string;
    email: string;
    altemail?: string;
    phone?: string;
    wphone?: string;
    organization?: string;
    country?: string;
    label?: CrmLabel | null;
    labels?: CrmLabel[];
    labelIds?: number[];
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
    labelId?: number;
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

export async function getContactBucketLabels(): Promise<CrmLabel[]> {
    const { data } = await api.get(`${CONTACT_BUCKET_BASE}/all-labels`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

