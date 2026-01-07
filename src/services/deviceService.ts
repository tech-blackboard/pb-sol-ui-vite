import { api } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_BASE;
export type Device = {
    id: string;
    userId: number;
    deviceId: string;
    browser?: string;
    os?: string;
    isAllowed: boolean;
    lastUsedAt?: string;
    createdAt: string;
    user?: {
        id: number;
        useremail: string;
        firstname: string;
        lastname: string;
    };
};

export type DeviceListResponse = {
    success: boolean;
    data: Device[];
    count?: number;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDevicesByUser(userId: number): Promise<Device[]> {
    const { data } = await api.get<DeviceListResponse>(`${API_BASE}/device/user/${userId}`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        withCredentials: true,
    });
    return data.data;
}

export async function getAllDevices(page = 1, limit = 50): Promise<DeviceListResponse> {
    const { data } = await api.get<DeviceListResponse>(`${API_BASE}/device`, {
        params: { page, limit },
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        withCredentials: true,
    });
    return data;
}

export async function approveDevice(deviceId: string): Promise<Device> {
    const { data } = await api.patch<{ success: boolean; data: Device }>(
        `${API_BASE}/device/${deviceId}/approve`,
        {},
        {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            withCredentials: true,
        }
    );
    return data.data;
}

export async function revokeDevice(deviceId: string): Promise<Device> {
    const { data } = await api.patch<{ success: boolean; data: Device }>(
        `${API_BASE}/device/${deviceId}/revoke`,
        {},
        {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            withCredentials: true,
        }
    );
    return data.data;
}

export async function forceLogoutDevice(deviceId: string): Promise<void> {
    await api.delete(`${API_BASE}/device/${deviceId}/logout`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        withCredentials: true,
    });
}
