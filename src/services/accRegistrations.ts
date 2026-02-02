import { api } from '../lib/api';
import { getAuthHeaders } from './abstracts';

export type AccRegistrationItem = {
    id: number;
    name: string;
    email: string;
    aemail?: string;
    phone: string;
    wphone?: string;
    institution?: string;
    country: string;
    presentation?: string;
    participants?: string;
    regtype?: string;
    accomm?: string;
    checkin?: string;
    checkout?: string;
    nights?: string;
    accm?: string;
    acmpng?: string;
    acc_pr?: string;
    tot_price?: string;
    transaction_id?: string;
    status_flag?: number;
    now: string;
    status?: { id: number; actionType: string };
    website?: { id: number; name: string };
};

export type AccRegistrationSearchResult = {
    items: AccRegistrationItem[];
    total: number;
    page: number;
    limit: number;
};

const VITE_ACC_REGISTRATION_BASE = import.meta.env.VITE_ACC_REGISTRATION_BASE;

export async function searchAccRegistrations(params: any = {}): Promise<AccRegistrationSearchResult> {
    const { data } = await api.get(`${VITE_ACC_REGISTRATION_BASE}/search`, {
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

export async function deleteAccRegistration(id: number | string): Promise<void> {
    await api.delete(`${VITE_ACC_REGISTRATION_BASE}/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function createAccRegistration(data: any): Promise<AccRegistrationItem> {
    const { data: responseData } = await api.post(`${VITE_ACC_REGISTRATION_BASE}`, data, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return responseData;
}
