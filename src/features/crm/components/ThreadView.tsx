import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedThread } from '../../../store/slices/crm/crm.slice';
import { updateLabelsThunk } from '../../../store/slices/crm/crm.thunks';
import * as crmService from '../services/crmService';
import ReplyForm from './ReplyForm';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ThreadView() {
    const dispatch = useAppDispatch();
    const { messages, threads, selectedThreadId, loading } = useAppSelector((state) => state.crm);
    const [isUnsubscribing, setIsUnsubscribing] = useState(false);

    const thread = threads.find(t => t.id === selectedThreadId);
    const contact = thread?.contact;

    const handleBack = () => {
        dispatch(setSelectedThread(null));
    };

    const handleUnsubscribe = async () => {
        if (!contact) return;
        if (!confirm(`Are you sure you want to unsubscribe ${contact.email}?`)) return;

        setIsUnsubscribing(true);
        try {
            await crmService.unsubscribeContact(contact.id, 'User manually unsubscribed from CRM UI');
            toast.success('Contact unsubscribed successfully');
        } catch (error) {
            toast.error('Failed to unsubscribe contact');
        } finally {
            setIsUnsubscribing(false);
        }
    };

    const handleUpdateLabels = async (messageId: string, currentLabels: string[]) => {
        const label = prompt('Enter a new label (e.g., positive, unsubscribe, abstract):');
        if (!label) return;

        const newLabels = Array.from(new Set([...currentLabels, label]));
        dispatch(updateLabelsThunk({ messageId, labels: newLabels }));
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
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate max-w-[500px]">
                            {thread.subject}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{contact?.email}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${contact?.status === 'unsubscribed'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                {contact?.status || 'active'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUnsubscribe}
                        disabled={isUnsubscribing || contact?.status === 'unsubscribed'}
                        className="flex items-center gap-2 px-3 py-1.5 rounded border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                        Unsubscribe Contact
                    </button>
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex flex-col gap-2 ${message.direction === 'outbound' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-semibold">{message.fromName || message.fromEmail}</span>
                                <span>•</span>
                                <span>{new Date(message.createdAt).toLocaleString()}</span>
                            </div>

                            <div className={`p-4 rounded-2xl shadow-sm ${message.direction === 'outbound'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                }`}>
                                {message.htmlBody ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: message.htmlBody }} />
                                ) : (
                                    <p className="whitespace-pre-wrap">{message.textBody}</p>
                                )}
                            </div>

                            {/* Message Actions (Labelling) */}
                            <div className="flex flex-wrap gap-2 mt-1">
                                {message.labels.map(label => (
                                    <span key={label} className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold">
                                        {label}
                                    </span>
                                ))}
                                <button
                                    onClick={() => handleUpdateLabels(message.id, message.labels)}
                                    className="px-2 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-blue-500 hover:border-blue-400 text-[10px] font-medium transition-all"
                                >
                                    + Add Label
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Section */}
            <ReplyForm
                threadId={thread.id}
                defaultSubject={thread.subject}
                recipientEmail={contact?.email || ''}
            />
        </div>
    );
}
