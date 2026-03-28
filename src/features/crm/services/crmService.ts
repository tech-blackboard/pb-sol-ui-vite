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
    const encodedId = encodeURIComponent(threadId);
    const { data } = await api.get<Message[]>(`${CRM_BASE}/messages/${encodedId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Update labels for a specific message
 */
export async function updateMessageLabels(messageId: string, labels: string[]): Promise<void> {
    const encodedId = encodeURIComponent(messageId);
    await api.put(`${CRM_BASE}/messages/${encodedId}/labels`, { labels }, {
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
 * Send a fresh email reply
 */
export async function sendReply(payload: {
    contactId: number;
    eventId: number;
    subject: string;
    textBody: string;
    htmlBody: string;
    fromEmail?: string;
    draftId?: string;
    threadId?: string;
}): Promise<{ status: string; messageId: string }> {
    const { data } = await api.post(`${CRM_BASE}/reply`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Save or update an email draft
 */
export async function saveDraft(payload: {
    contactId: number;
    eventId: number;
    subject: string;
    textBody?: string;
    htmlBody?: string;
    fromEmail?: string;
    threadId?: string;
    draftId?: string;
}): Promise<Message> {
    const { data } = await api.post<Message>(`${CRM_BASE}/drafts`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Fetch all drafts for the current user
 */
export async function fetchDrafts(): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`${CRM_BASE}/drafts`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string): Promise<void> {
    const encodedId = encodeURIComponent(draftId);
    await api.delete(`${CRM_BASE}/drafts/${encodedId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

/**
 * Fetch available reply-from emails for an event
 */
export async function fetchReplyEmails(eventId: number): Promise<string[]> {
    const { data } = await api.get<string[]>(`${CRM_BASE}/reply-emails/${eventId}`, {
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
/**
 * Download an attachment using an authenticated request
 */
export async function downloadAttachment(id: number, filename: string): Promise<void> {
    const { data } = await api.get(`${CRM_BASE}/attachments/${id}/download`, {
        headers: { ...getAuthHeaders() },
        responseType: 'blob',
        withCredentials: true,
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
}
