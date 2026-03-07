export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'received' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';

export interface CrmEvent {
    id: number;
    name: string;
    slug: string;
    replyDomain: string;
    domains: string[];
    isActive: boolean;
    contactCount?: number;
    unreadThreads?: number;
    createdAt: string;
}

export interface Contact {
    id: number;
    email: string;
    name?: string;
    status: ContactStatus;
    labels: string[];
    eventId: number;
    createdAt: string;
}

export interface Thread {
    id: string;
    subject: string;
    lastMessageAt: string;
    eventId: number;
    contactId: number;
    isRead: boolean;
    contact?: Contact;
    messageCount: number;
    domain: string;
    createdAt: string;
}

export interface Attachment {
    id: number;
    messageId: string;
    filename: string;
    contentType: string;
    size: number;
    s3Key: string;
    createdAt: string;
}

export interface Message {
    id: string;
    threadId: string;
    fromEmail: string;
    fromName?: string;
    toEmail: string;
    subject: string;
    textBody?: string;
    htmlBody?: string;
    direction: MessageDirection;
    status: MessageStatus;
    eventId: number;
    contactId: number;
    createdAt: string;
    labels: string[];
    attachments: Attachment[];
}

export interface LabelResponse {
    label: string;
    count: number;
}
