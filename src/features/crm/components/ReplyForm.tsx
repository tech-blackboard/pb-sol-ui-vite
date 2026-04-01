import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { sendReplyThunk, saveDraftThunk } from '../../../store/slices/crm/crm.thunks';
import toast from 'react-hot-toast';

interface ReplyFormProps {
    contactId: number;
    eventId: number;
    defaultSubject: string;
    recipientEmail: string;
    replyEmails: string[];
    onSuccess?: () => void;
    initialDraftId?: string;
    initialHtmlBody?: string;
    initialFromEmail?: string;
    threadId?: string;
}

export default function ReplyForm({ contactId, eventId, defaultSubject, recipientEmail, replyEmails, onSuccess, initialDraftId, initialHtmlBody, initialFromEmail, threadId }: ReplyFormProps) {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.crm);
    const [htmlBody, setHtmlBody] = useState(initialHtmlBody || '');
    const [fromEmail, setFromEmail] = useState(initialFromEmail || replyEmails[0] || '');
    const [isExpanded, setIsExpanded] = useState(!!initialDraftId || !!initialHtmlBody);
    const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
    const [lastSavedBody, setLastSavedBody] = useState(initialHtmlBody || '');

    const saveTimeoutRef = useRef<any>(null);
    const isSavingRef = useRef(false);
    const htmlBodyRef = useRef(htmlBody);
    const lastSavedBodyRef = useRef(lastSavedBody);
    const draftIdRef = useRef(draftId);

    // Keep refs in sync with state
    useEffect(() => {
        htmlBodyRef.current = htmlBody;
    }, [htmlBody]);

    useEffect(() => {
        lastSavedBodyRef.current = lastSavedBody;
    }, [lastSavedBody]);

    useEffect(() => {
        draftIdRef.current = draftId;
    }, [draftId]);

    const handleSaveDraft = useCallback(async (currentBody: string) => {
        if (!currentBody.trim() || currentBody === lastSavedBody || isSavingRef.current) return;

        isSavingRef.current = true;
        const result = await dispatch(saveDraftThunk({
            contactId,
            eventId,
            subject: defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`,
            htmlBody: currentBody.replace(/\n/g, '<br>'),
            textBody: currentBody,
            fromEmail: fromEmail || undefined,
            draftId: draftId,
            threadId,
        }));

        if (saveDraftThunk.fulfilled.match(result)) {
            setDraftId(result.payload.id);
            setLastSavedBody(currentBody);
        }
        isSavingRef.current = false;
    }, [contactId, eventId, defaultSubject, fromEmail, draftId, lastSavedBody, dispatch]);

    useEffect(() => {
        // Only trigger auto-save if:
        // 1. Body has changed from last saved version
        // 2. We've changed more than 10 characters OR it's been a while (15s) since last save
        const charDifference = Math.abs(htmlBody.length - lastSavedBody.length);
        const shouldSave = isExpanded && htmlBody !== lastSavedBody && (charDifference > 10 || htmlBody.length === 0);

        if (shouldSave) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                handleSaveDraft(htmlBody);
            }, 30000); // 30 seconds for auto-save while typing
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [htmlBody, isExpanded, lastSavedBody, handleSaveDraft]);

    // Save on unmount or when component is being destroyed
    useEffect(() => {
        return () => {
            // Use refs to get the latest values without re-triggering this effect
            const bodyToSave = htmlBodyRef.current;
            const lastSaved = lastSavedBodyRef.current;

            if (bodyToSave.trim() && bodyToSave !== lastSaved && !isSavingRef.current) {
                // We define a one-off save for unmount to avoid dependency issues
                dispatch(saveDraftThunk({
                    contactId,
                    eventId,
                    subject: defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`,
                    htmlBody: bodyToSave.replace(/\n/g, '<br>'),
                    textBody: bodyToSave,
                    fromEmail: fromEmail || undefined,
                    draftId: draftIdRef.current,
                    threadId,
                }));
            }
        };
    }, [contactId, eventId, defaultSubject, fromEmail, threadId, dispatch]); 
    // This effect only depends on stable props, not the changing body

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!htmlBody.trim()) {
            toast.error('Please enter a message');
            return;
        }

        const result = await dispatch(sendReplyThunk({
            contactId,
            eventId,
            fromEmail: fromEmail || undefined,
            subject: defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`,
            htmlBody: htmlBody.replace(/\n/g, '<br>'),
            textBody: htmlBody,
            draftId: draftId,
            threadId,
        }));

        if (sendReplyThunk.fulfilled.match(result)) {
            toast.success('Reply sent successfully');
            setHtmlBody('');
            setLastSavedBody('');
            setDraftId(undefined);
            setIsExpanded(false);
            if (onSuccess) onSuccess();
        } else {
            toast.error('Failed to send reply');
        }
    };

    if (!isExpanded) {
        return (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-500 hover:border-blue-400 hover:ring-1 hover:ring-blue-100 transition-all text-left"
                >
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                    </div>
                    Click here to <span className="text-blue-600 font-medium">Reply</span> to {recipientEmail}...
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Reply to:</span>
                            <span>{recipientEmail}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">From:</span>
                        <select
                            value={fromEmail}
                            onChange={(e) => setFromEmail(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Default (System Settings)</option>
                            {replyEmails.map(email => (
                                <option key={email} value={email}>{email}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <textarea
                    autoFocus
                    className="w-full min-h-[200px] p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Write your reply here..."
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    disabled={loading.sending}
                />

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading.sending}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading.sending ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            )}
                            Send Reply
                        </button>

                        {loading.savingDraft && (
                            <span className="text-xs text-gray-400 animate-pulse flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                                Saving draft...
                            </span>
                        )}
                        {!loading.savingDraft && draftId && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-green-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Draft saved
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        Sending via secure SMTP
                    </div>
                </div>
            </form>
        </div>
    );
}
