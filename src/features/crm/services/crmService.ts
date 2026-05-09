import { CRM_BASE } from "../../../config/env";
import { api } from "../../../lib/api";
import type { CrmEvent, LabelResponse, Message, Thread, EmailAccount, CrmLabel } from "../types";


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
export async function fetchThreads(eventId?: number, search?: string, domain?: string, emailAccountId?: number, folder?: string, page: number = 1, limit: number = 50, label?: string): Promise<{ threads: Thread[]; total: number; unreadCount: number; starredCount: number; sentCount: number; draftsCount: number; trashCount: number; junkCount: number; accountsCount: number }> {
    const { data } = await api.get<{ threads: Thread[]; total: number; unreadCount: number; starredCount: number; sentCount: number; draftsCount: number; trashCount: number; junkCount: number; accountsCount: number }>(`${CRM_BASE}/threads`, {
        params: { eventId, search, domain, emailAccountId, folder, page, limit, label },
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
 * Toggle star status for a specific thread
 */
export async function toggleThreadStar(threadId: string, isStarred: boolean): Promise<void> {
    const encodedId = encodeURIComponent(threadId);
    await api.put(`${CRM_BASE}/threads/${encodedId}/star`, { isStarred }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

/**
 * Update read status for a specific thread
 */
export async function updateThreadReadStatus(threadId: string, isRead: boolean): Promise<void> {
    const encodedId = encodeURIComponent(threadId);
    await api.put(`${CRM_BASE}/threads/${encodedId}/read`, { isRead }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
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

export async function sendReply(payload: {
    contactId: number;
    eventId: number;
    subject: string;
    textBody: string;
    htmlBody: string;
    fromEmail?: string;
    emailAccountId?: number;
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
export async function fetchDrafts(page: number = 1, limit: number = 50, eventId?: number): Promise<{ drafts: Message[]; total: number }> {
    const { data } = await api.get<{ drafts: Message[]; total: number }>(`${CRM_BASE}/drafts`, {
        params: { page, limit, eventId },
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
 * Get all available label definitions (master list)
 */
export async function fetchLabelDefinitions(): Promise<CrmLabel[]> {
    const { data } = await api.get<CrmLabel[]>(`${CRM_BASE}/labels/definitions`, {
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

/**
 * Email Account Management
 */

export async function fetchEmailAccounts(eventId?: number, search?: string): Promise<EmailAccount[]> {
    const { data } = await api.get<EmailAccount[]>(`${CRM_BASE}/email-accounts`, {
        params: { eventId, search },
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function createEmailAccount(payload: Partial<EmailAccount>): Promise<EmailAccount> {
    const { data } = await api.post<EmailAccount>(`${CRM_BASE}/email-accounts`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function updateEmailAccount(id: number, payload: Partial<EmailAccount>): Promise<EmailAccount> {
    const { data } = await api.patch<EmailAccount>(`${CRM_BASE}/email-accounts/${id}`, payload, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data;
}

export async function deleteEmailAccount(id: number): Promise<void> {
    await api.delete(`${CRM_BASE}/email-accounts/${id}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function getMicrosoftAuthUrl(id: number): Promise<string> {
    const { data } = await api.get<{ url: string }>(`${CRM_BASE}/email-accounts/${id}/auth/microsoft`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
    return data.url;
}

/**
 * Trash Management
 */

export async function trashThreads(threadIds: string[]): Promise<void> {
    await api.post(`${CRM_BASE}/threads/trash`, { threadIds }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function restoreThreads(threadIds: string[]): Promise<void> {
    await api.post(`${CRM_BASE}/threads/restore`, { threadIds }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function deleteThreadsPermanently(threadIds: string[]): Promise<void> {
    await api.delete(`${CRM_BASE}/threads/permanent`, {
        data: { threadIds },
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function emptyTrash(eventId: number): Promise<void> {
    await api.delete(`${CRM_BASE}/threads/empty-trash/${eventId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

/**
 * Junk Management
 */

export async function junkThreads(threadIds: string[]): Promise<void> {
    await api.post(`${CRM_BASE}/threads/junk`, { threadIds }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}

export async function restoreThreadsFromJunk(threadIds: string[]): Promise<void> {
    await api.post(`${CRM_BASE}/threads/unjunk`, { threadIds }, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        withCredentials: true,
    });
}
