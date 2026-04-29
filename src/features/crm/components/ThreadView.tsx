import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedThread } from '../../../store/slices/crm/crm.slice';
import { updateLabelsThunk, fetchMessagesThunk, toggleThreadReadThunk } from '../../../store/slices/crm/crm.thunks';
import * as crmService from '../services/crmService';
import ReplyForm from './ReplyForm';
import EmailBody from './EmailBody';
import MessageLabelDropdown from './MessageLabelDropdown';
import { getLabelColorClasses } from '../utils/labelUtils';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ThreadView() {
    const dispatch = useAppDispatch();
    const { messages, threads, events, selectedThreadId, loading } = useAppSelector((state) => state.crm);
    const [isUnsubscribing, setIsUnsubscribing] = useState(false);
    const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
    const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
    const drafts = useAppSelector(state => state.crm.drafts);

    const thread = threads.find(t => t.id === selectedThreadId);
    const contact = thread?.contact;
    const event = events.find(e => e.id === thread?.eventId);

    const handleBack = () => {
        dispatch(setSelectedThread(null));
    };

    const toggleDetails = (messageId: string) => {
        setExpandedDetailsId(prev => prev === messageId ? null : messageId);
    };

    const handleUnsubscribe = async () => {
        if (!contact) return;
        if (!confirm(`Are you sure you want to unsubscribe ${contact.email}?`)) return;

        setIsUnsubscribing(true);
        try {
            await crmService.unsubscribeContact(contact.id, 'User manually unsubscribed from CRM UI');
            toast.success('Contact unsubscribed successfully');
        } catch {
            toast.error('Failed to unsubscribe contact');
        } finally {
            setIsUnsubscribing(false);
        }
    };


    const handleReplySuccess = () => {
        if (selectedThreadId) {
            dispatch(fetchMessagesThunk(selectedThreadId));
        }
    };

    const handleToggleRead = () => {
        if (selectedThreadId) {
            // In ThreadView, we usually want to mark it as UNREAD and go back
            dispatch(toggleThreadReadThunk({ threadId: selectedThreadId, isRead: false }));
            dispatch(setSelectedThread(null));
            toast.success('Conversation marked as unread');
        }
    };

    const handleDownload = async (attachmentId: number, filename: string) => {
        try {
            setDownloadingIds(prev => new Set(prev).add(attachmentId));
            await crmService.downloadAttachment(attachmentId, filename);
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Failed to download attachment');
        } finally {
            setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(attachmentId);
                return next;
            });
        }
    };

    if (loading.messages && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!thread) return null;

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 h-full overflow-hidden">
            {/* Thread Toolbar */}
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                        title="Back to inbox"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" title="Archive">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" title="Report spam">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                        </svg>
                    </button>
                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button
                        onClick={handleToggleRead}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Mark as unread"
                    >
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <div className="absolute top-0 right-0 w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full border border-white dark:border-gray-900 translate-x-1/4 -translate-y-1/4"></div>
                        </div>
                    </button>
                    <button
                        onClick={handleUnsubscribe}
                        disabled={isUnsubscribing || contact?.status === 'unsubscribed'}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-30"
                        title="Unsubscribe Contact"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    </button>
                    <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

                    {/* Thread-level Labeling */}
                    <div className="flex items-center">
                        <MessageLabelDropdown
                            currentLabels={messages[0]?.labels || []}
                            onToggleLabel={(toggledLabel) => {
                                const firstMsg = messages[0];
                                if (!firstMsg) return;
                                let newLabels;
                                const exists = firstMsg.labels.some(l => l.toLowerCase() === toggledLabel.toLowerCase());
                                if (exists) {
                                    newLabels = firstMsg.labels.filter(l => l.toLowerCase() !== toggledLabel.toLowerCase());
                                } else {
                                    newLabels = [...firstMsg.labels, toggledLabel];
                                }
                                dispatch(updateLabelsThunk({ messageId: firstMsg.id, labels: newLabels }));
                            }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>1 of 1</span>
                    <div className="flex gap-1">
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1000px] mx-auto px-6 py-6 pb-20">
                    {/* Subject Line */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                    {thread.subject}
                                </h1>
                                {contact?.status === 'unsubscribed' && (
                                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">Unsubscribed</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </button>
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25V21" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Thread Labels Display */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium flex items-center gap-1">
                                Inbox <span className="opacity-50">x</span>
                            </span>
                            {messages[0]?.labels.map(label => {
                                const colors = getLabelColorClasses(label);
                                return (
                                    <span key={label} className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase shadow-sm border ${colors.bg} ${colors.text} ${colors.border}`}>
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message List */}
                    <div className="space-y-12">
                        {messages.map((message) => {
                            const senderInitial = (message.fromName || message.fromEmail || '?')[0].toUpperCase();
                            const isOutbound = message.direction === 'outbound';
                            const isDetailsExpanded = expandedDetailsId === message.id;

                            return (
                                <div key={message.id} className="relative flex flex-col isolate border-b border-gray-100 dark:border-gray-800/50 pb-8 last:border-0 last:pb-0">
                                    {/* Message Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${isOutbound ? 'bg-indigo-600' : 'bg-gray-400 dark:bg-gray-600'
                                                }`}>
                                                {senderInitial}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-gray-200">
                                                        {message.fromName || message.fromEmail}
                                                    </span>
                                                    <span className="text-sm text-gray-500 italic">
                                                        &lt;{message.fromEmail}&gt;
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 relative flex items-center gap-2">
                                                    <span>to {isOutbound ? contact?.email : 'me'}</span>
                                                    {isOutbound && (
                                                        <>
                                                            {message.status === 'sent' && (
                                                                <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-800 font-medium">Sent</span>
                                                            )}
                                                            {message.status === 'failed' && (
                                                                <span className="text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-800 font-medium">Failed</span>
                                                            )}
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => toggleDetails(message.id)}
                                                        className="ml-1 cursor-pointer hover:text-gray-700 transition-colors"
                                                    >
                                                        ▼
                                                    </button>

                                                    {/* Gmail Details Dropdown */}
                                                    {isDetailsExpanded && (
                                                        <div className="absolute left-0 top-8 w-[400px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4 text-[12px] leading-6">
                                                            <div className="grid grid-cols-[80px_1fr] gap-x-2">
                                                                <span className="text-gray-400 text-right">from:</span>
                                                                <span className="text-gray-900 dark:text-gray-100">
                                                                    <span className="font-bold">{message.fromName}</span> {message.fromEmail}
                                                                </span>

                                                                <span className="text-gray-400 text-right">to:</span>
                                                                <span className="text-gray-900 dark:text-gray-100">{message.toEmail}</span>

                                                                <span className="text-gray-400 text-right">date:</span>
                                                                <span className="text-gray-900 dark:text-gray-100">
                                                                    {new Date(message.createdAt).toLocaleString([], {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>

                                                                <span className="text-gray-400 text-right">subject:</span>
                                                                <span className="text-gray-900 dark:text-gray-100">{message.subject}</span>

                                                                <span className="text-gray-400 text-right">security:</span>
                                                                <span className="text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                                                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm3 8H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v3z" /></svg>
                                                                    Standard encryption (TLS)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>
                                                {new Date(message.createdAt).toLocaleString([], {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <div className="flex gap-1">
                                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                    </svg>
                                                </button>
                                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="ml-14 mt-1">
                                        <EmailBody html={message.htmlBody} text={message.textBody} />
                                    </div>

                                    {/* Attachments Section */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="ml-14 mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {message.attachments.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex flex-col rounded border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow bg-gray-50/30 dark:bg-gray-800/20 overflow-hidden"
                                                >
                                                    <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-400">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-.11.109V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    </div>
                                                    <div className="p-2 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={file.filename}>
                                                                {file.filename}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">
                                                                {(file.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDownload(file.id, file.filename)}
                                                            disabled={downloadingIds.has(file.id)}
                                                            className="p-1.5 rounded-full text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-50"
                                                            title="Download"
                                                        >
                                                            {downloadingIds.has(file.id) ? (
                                                                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}


                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-8">
                        {(() => {
                            const draft = drafts.find(d =>
                                d.contactId === contact?.id &&
                                d.eventId === thread.eventId &&
                                (d.threadId === thread.id || !d.threadId)
                            );

                            return (
                                <ReplyForm
                                    contactId={contact?.id || 0}
                                    eventId={thread.eventId}
                                    replyEmails={event?.replyEmails || []}
                                    defaultSubject={thread.subject}
                                    recipientEmail={contact?.email || ''}
                                    onSuccess={handleReplySuccess}
                                    initialDraftId={draft?.id}
                                    initialHtmlBody={draft?.htmlBody}
                                    initialFromEmail={draft?.fromEmail}
                                    threadId={thread.id}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
