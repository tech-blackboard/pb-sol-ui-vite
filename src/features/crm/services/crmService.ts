import { CRM_BASE } from "../../../config/env";
import { api } from "../../../lib/api";
import type { CrmEvent, LabelResponse, Message, Thread } from "../types";


function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch all active CRM events (conferences)
 */
export async function fetchCrmEvents(): Promise<CrmEvent[]> {
    const { data } = await api.get<CrmEvent[]>(`${CRM_BASE}/events`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Fetch threads for a specific event
 */
export async function fetchThreads(eventId: number): Promise<Thread[]> {
    const { data } = await api.get<Thread[]>(`${CRM_BASE}/threads`, {
        params: { eventId },
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Fetch all messages in a specific thread
 */
export async function fetchThreadMessages(threadId: string): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`${CRM_BASE}/messages/${threadId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Update labels for a specific message
 */
export async function updateMessageLabels(messageId: string, labels: string[]): Promise<void> {
    await api.put(`${CRM_BASE}/messages/${messageId}/labels`, { labels }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

/**
 * Unsubscribe a contact from communications
 */
export async function unsubscribeContact(contactId: number, reason?: string): Promise<void> {
    await api.put(`${CRM_BASE}/contacts/${contactId}/unsubscribe`, { reason }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

/**
 * Send a reply to an email thread
 */
export async function sendReply(payload: {
    threadId: string;
    subject: string;
    textBody: string;
    htmlBody: string;
    replyTo?: string;
}): Promise<{ status: string; messageId: string }> {
    const { data } = await api.post(`${CRM_BASE}/reply`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Get all available labels with their message counts
 */
export async function fetchLabels(eventId?: number): Promise<LabelResponse[]> {
    const { data } = await api.get<LabelResponse[]>(`${CRM_BASE}/labels`, {
        params: { eventId },
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}
