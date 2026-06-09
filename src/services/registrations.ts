import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';
import { REGISTRATION_BASE } from '../config/env';
export type RegistrationItem = {
    id: number;
    user_id?: number;
    name: string;
    email: string;
    aemail?: string;
    phone: string;
    wphone?: string;
    institution: string;
    country: string;
    presentation: string;
    participants: string;
    regtype: string;
    accomm: string;
    checkin?: string;
    checkout?: string;
    nights?: string;
    accmvalue?: string;
    acmpng?: string | number;
    accpng?: string | number;
    acc_price?: string;
    tot_price?: string;
    message?: string;
    alt_text?: string;
    transaction_id?: string;
    status_flag?: number;
    status_id?: number;
    website_id?: number;
    now?: string;
    status?: { id: number; actionType: string };
    website?: { id: number; name: string };
};

export type RegistrationSearchParams = {
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: string | number | boolean | undefined;
};

export type RegistrationSearchResult = {
    items: RegistrationItem[];
    total: number;
    page: number;
    limit: number;
};

// const VITE_REGISTRATION_BASE = import.meta.env.VITE_REGISTRATION_BASE;

export async function searchRegistrations(params: RegistrationSearchParams = {}): Promise<RegistrationSearchResult> {
    const { data } = await api.get(`${REGISTRATION_BASE}/search`, {
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

export async function getRegistrationById(id: number | string): Promise<RegistrationItem> {
    const { data } = await api.get(`${REGISTRATION_BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function deleteRegistration(id: number | string): Promise<void> {
    await api.delete(`${REGISTRATION_BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function createRegistration(data: Partial<RegistrationItem>): Promise<RegistrationItem> {
    const { data: result } = await api.post(`${REGISTRATION_BASE}`, data, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return result;
}

export async function updateRegistration(id: number | string, data: Partial<RegistrationItem>): Promise<RegistrationItem> {
    const { data: result } = await api.put(`${REGISTRATION_BASE}/${id}`, data, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return result;
}
