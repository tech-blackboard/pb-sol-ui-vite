export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'received' | 'sent' | 'failed' | 'draft';
export type MessageImportance = 'low' | 'normal' | 'high';
export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';

export interface CrmEvent {
    id: number;
    name: string;
    slug: string;
    replyDomain: string;
    domains: string[];
    replyEmails: string[];
    isActive: boolean;
    contactCount?: number;
    unreadThreads?: number;
    signatureName?: string;
    signaturePlace?: string;
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
    isStarred: boolean;
    isTrash: boolean;
    trashedAt?: string;
    isJunk: boolean;
    junkedAt?: string;
    contact?: Contact;
    messageCount: number;
    domain: string;
    createdAt: string;
    status?: MessageStatus;
    labels?: string[];
    importance?: MessageImportance;
    isForwarded?: boolean;
    forwardedFromId?: string;
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
    ccEmail?: string;
    bccEmail?: string;
    direction: MessageDirection;
    status: MessageStatus;
    isTrash: boolean;
    trashedAt?: string;
    isJunk: boolean;
    junkedAt?: string;
    eventId: number;
    contactId: number;
    createdAt: string;
    updatedAt?: string;
    labels: string[];
    attachments: Attachment[];
    userId?: number;
    contact?: Contact;
    event?: CrmEvent;
    importance?: MessageImportance;
    isForwarded?: boolean;
    forwardedFromId?: string;
}

export interface LabelResponse {
    label: string;
    count: number;
}

export interface CrmLabel {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmailAccount {
    id: number;
    name: string;
    email: string;
    imapHost: string;
    imapPort: number;
    imapUser: string;
    imapPassword?: string;
    imapEncryption: 'ssl' | 'tls' | 'none';
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword?: string;
    smtpEncryption: 'ssl' | 'tls' | 'none';
    outboundProvider?: string;
    apiKey?: string;
    apiRegion?: string;
    isActive: boolean;
    lastSyncAt?: string;
    authMethod?: 'password' | 'oauth2';
    provider?: 'none' | 'microsoft' | 'google';
    tokenExpiresAt?: string;
    createdAt: string;
    updatedAt: string;
}
