import { api } from '../lib/api';
import { API_DEVICE } from '../config/env';

const Device_BACE = API_DEVICE;
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
    const { data } = await api.get<DeviceListResponse>(`${Device_BACE}/user/${userId}`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        withCredentials: true,
    });
    return data.data;
}
export async function getAllDevices(page = 1, limit = 50): Promise<DeviceListResponse> {
    const { data } = await api.get<DeviceListResponse>(`${Device_BACE}/all`, {

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
        `${Device_BACE}/${deviceId}/approve`,
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
        `${Device_BACE}/${deviceId}/revoke`,
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
    await api.delete(`${Device_BACE}/${deviceId}/device-logout`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        withCredentials: true,
    });
}
