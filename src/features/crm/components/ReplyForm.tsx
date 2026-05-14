import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { sendReplyThunk, saveDraftThunk } from '../../../store/slices/crm/crm.thunks';
import { fetchEmailAccounts } from '../services/crmService';
import type { EmailAccount, MessageImportance } from '../types';
import toast from 'react-hot-toast';

export interface ReplyFormHandle {
    expand: () => void;
}

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
    initialEmailAccountId?: number;
    threadId?: string;
    initialSubject?: string;
    initialCc?: string;
    initialBcc?: string;
}

const ReplyForm = forwardRef<ReplyFormHandle, ReplyFormProps>(({
    contactId, eventId, defaultSubject, recipientEmail, replyEmails,
    onSuccess, initialDraftId, initialHtmlBody, initialFromEmail,
    initialEmailAccountId, threadId, initialSubject, initialCc, initialBcc
}, ref) => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state: RootState) => state.crm);

    // State
    const [htmlBody, setHtmlBody] = useState(initialHtmlBody || '');
    const [fromEmail, setFromEmail] = useState(initialFromEmail || replyEmails[0] || '');
    const [emailAccountId, setEmailAccountId] = useState<number | undefined>(initialEmailAccountId);
    const [subject, setSubject] = useState(initialSubject || (defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`));
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);

    const [isExpanded, setIsExpanded] = useState(!!initialDraftId || !!initialHtmlBody);
    const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);

    const [cc, setCc] = useState(initialCc || '');
    const [bcc, setBcc] = useState(initialBcc || '');
    const [showCC, setShowCC] = useState(!!initialCc);
    const [showBCC, setShowBCC] = useState(!!initialBcc);
    const [importance, setImportance] = useState<MessageImportance>('normal');
    const [isImportanceOpen, setIsImportanceOpen] = useState(false);
    const importanceRef = useRef<HTMLDivElement>(null);

    // Handle importance dropdown click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (importanceRef.current && !importanceRef.current.contains(event.target as Node)) {
                setIsImportanceOpen(false);
            }
        }
        if (isImportanceOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isImportanceOpen]);

    useImperativeHandle(ref, () => ({
        expand: () => setIsExpanded(true)
    }));

    const [lastSavedBody, setLastSavedBody] = useState(initialHtmlBody || '');

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    const htmlBodyRef = useRef(htmlBody);
    const lastSavedBodyRef = useRef(lastSavedBody);
    const draftIdRef = useRef(draftId);
    const subjectRef = useRef(subject);
    const ccRef = useRef(cc);
    const bccRef = useRef(bcc);
    const importanceValueRef = useRef(importance);

    // Fetch connected accounts
    useEffect(() => {
        fetchEmailAccounts().then(setEmailAccounts).catch(() => { });
    }, []);

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

    useEffect(() => {
        subjectRef.current = subject;
    }, [subject]);

    useEffect(() => {
        ccRef.current = cc;
    }, [cc]);

    useEffect(() => {
        bccRef.current = bcc;
    }, [bcc]);

    useEffect(() => {
        importanceValueRef.current = importance;
    }, [importance]);

    const handleSaveDraft = useCallback(async (currentBody: string) => {
        if (!currentBody.trim() || currentBody === lastSavedBody || isSavingRef.current) return;

        isSavingRef.current = true;
        const result = await dispatch(saveDraftThunk({
            contactId,
            eventId,
            subject,
            htmlBody: currentBody.replace(/\n/g, '<br>'),
            textBody: currentBody,
            fromEmail: fromEmail || undefined,
            emailAccountId,
            draftId: draftId,
            threadId,
            cc: ccRef.current,
            bcc: bccRef.current,
            importance: importanceValueRef.current,
        }));

        if (saveDraftThunk.fulfilled.match(result)) {
            setDraftId(result.payload.id);
            setLastSavedBody(currentBody);
        }
        isSavingRef.current = false;
    }, [contactId, eventId, subject, fromEmail, emailAccountId, draftId, lastSavedBody, threadId, dispatch]);

    useEffect(() => {
        const charDifference = Math.abs(htmlBody.length - lastSavedBody.length);
        const shouldSave = isExpanded && htmlBody !== lastSavedBody && (charDifference > 10 || htmlBody.length === 0);

        if (shouldSave) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                handleSaveDraft(htmlBody);
            }, 30000);
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [htmlBody, isExpanded, lastSavedBody, handleSaveDraft]);

    // Prepare dropdown options: prioritize Accounts with IDs, fallback to plain emails
    const accountOptions = useMemo(() => {
        const options: { label: string; value: string }[] = [];

        // Only include emails that are part of the 'replyEmails' list
        replyEmails.forEach(email => {
            // Find if this specific reply email matches a connected account
            const matchingAcc = emailAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());

            if (matchingAcc) {
                options.push({ label: email, value: `acc_${matchingAcc.id}` });
            } else {
                options.push({ label: email, value: email });
            }
        });

        return options;
    }, [emailAccounts, replyEmails]);

    // Save on unmount
    useEffect(() => {
        return () => {
            const bodyToSave = htmlBodyRef.current;
            const lastSaved = lastSavedBodyRef.current;

            if (bodyToSave.trim() && bodyToSave !== lastSaved && !isSavingRef.current) {
                dispatch(saveDraftThunk({
                    contactId,
                    eventId,
                    subject: subjectRef.current,
                    htmlBody: bodyToSave.replace(/\n/g, '<br>'),
                    textBody: bodyToSave,
                    fromEmail: fromEmail || undefined,
                    emailAccountId,
                    draftId: draftIdRef.current,
                    threadId,
                    cc: ccRef.current,
                    bcc: bccRef.current,
                    importance: importanceValueRef.current,
                }));
            }
        };
    }, [contactId, eventId, fromEmail, emailAccountId, threadId, dispatch]);

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
            emailAccountId,
            subject,
            htmlBody: htmlBody.replace(/\n/g, '<br>'),
            textBody: htmlBody,
            draftId: draftId,
            threadId,
            cc,
            bcc,
            importance,
        }));

        if (sendReplyThunk.fulfilled.match(result)) {
            toast.success('Reply sent successfully');
            setHtmlBody('');
            setLastSavedBody('');
            setCc('');
            setBcc('');
            setShowCC(false);
            setShowBCC(false);
            setImportance('normal');
            setDraftId(undefined);
            setIsExpanded(false);
            if (onSuccess) onSuccess();
        } else {
            toast.error('Failed to send reply');
        }
    };

    const handleAccountChange = (val: string) => {
        if (val.startsWith('acc_')) {
            const id = parseInt(val.replace('acc_', ''), 10);
            const account = emailAccounts.find(a => a.id === id);
            setEmailAccountId(id);
            if (account) setFromEmail(account.email);
        } else {
            setEmailAccountId(undefined);
            setFromEmail(val);
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
                <div className="flex flex-col">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 py-2 group/to">
                        <div className="flex flex-1 items-center gap-2 text-sm">
                            <span className="text-gray-400 w-10 text-xs">To:</span>
                            <div className="flex-1 flex items-center justify-between pr-2">
                                <span className="text-gray-900 dark:text-gray-100 font-medium">{recipientEmail}</span>
                                <div className="flex items-center gap-3 opacity-0 group-hover/to:opacity-100 transition-opacity">
                                    {!showCC && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCC(true)}
                                            className="text-gray-400 hover:text-blue-600 hover:underline text-[11px] font-medium transition-colors"
                                        >
                                            Cc
                                        </button>
                                    )}
                                    {!showBCC && (
                                        <button
                                            type="button"
                                            onClick={() => setShowBCC(true)}
                                            className="text-gray-400 hover:text-blue-600 hover:underline text-[11px] font-medium transition-colors"
                                        >
                                            Bcc
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {showCC && (
                        <div className="flex items-center gap-2 text-sm border-b border-gray-100 dark:border-gray-800 py-2 animate-in slide-in-from-top-1 duration-200">
                            <span className="text-gray-400 w-10 text-xs">Cc:</span>
                            <input
                                type="text"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs"
                                placeholder="Recipient Cc"
                                autoFocus
                            />
                            {!showBCC && (
                                <button
                                    type="button"
                                    onClick={() => setShowBCC(true)}
                                    className="text-gray-400 hover:text-blue-600 text-[11px] font-medium mr-2"
                                >
                                    Bcc
                                </button>
                            )}
                            <button type="button" onClick={() => { setShowCC(false); setCc(''); }} className="text-gray-300 hover:text-red-500 px-1">×</button>
                        </div>
                    )}

                    {showBCC && (
                        <div className="flex items-center gap-2 text-sm border-b border-gray-100 dark:border-gray-800 py-2 animate-in slide-in-from-top-1 duration-200">
                            <span className="text-gray-400 w-10 text-xs">Bcc:</span>
                            <input
                                type="text"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs"
                                placeholder="Recipient Bcc"
                                autoFocus={!showCC}
                            />
                            <button type="button" onClick={() => { setShowBCC(false); setBcc(''); }} className="text-gray-300 hover:text-red-500 px-1">×</button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm border-b border-gray-100 dark:border-gray-800 py-2">
                        <span className="text-gray-400 w-10 text-xs">From:</span>
                        <select
                            value={emailAccountId ? `acc_${emailAccountId}` : fromEmail}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            className="bg-transparent border-none rounded text-xs outline-none focus:ring-0 text-blue-600 font-medium cursor-pointer"
                        >
                            {accountOptions.map((opt: { label: string; value: string }) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm border-b border-gray-100 dark:border-gray-800 py-2">
                        <span className="text-gray-400 w-10 text-xs">Subject:</span>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs font-medium"
                            placeholder="Email subject"
                        />
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

                        {/* Importance Selector */}
                        <div className="relative" ref={importanceRef}>
                            <button
                                type="button"
                                onClick={() => setIsImportanceOpen(!isImportanceOpen)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                    importance === 'high'
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-[#C8102E] dark:text-red-400 shadow-sm'
                                        : importance === 'low'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50'
                                }`}
                                title="Set message importance"
                            >
                                {importance === 'high' && <span className="w-4 h-4 flex items-center justify-center font-black text-lg">!</span>}
                                {importance === 'low' && <span className="w-4 h-4 flex items-center justify-center font-black text-lg">↓</span>}
                                {importance === 'normal' && <span className="w-4 h-4 flex items-center justify-center font-black text-lg opacity-0">!</span>}
                                {importance === 'high' ? 'High' : importance === 'low' ? 'Low' : 'Importance'}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${isImportanceOpen ? 'rotate-180' : ''}`}>
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {isImportanceOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set Importance</span>
                                    </div>
                                    <div className="p-1">
                                        {[
                                            { id: 'high', label: 'High Importance', color: 'text-[#C8102E]', icon: '!', bg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
                                            { id: 'normal', label: 'Normal Importance', color: 'text-gray-600', icon: '', bg: 'hover:bg-gray-100 dark:hover:bg-gray-700' },
                                            { id: 'low', label: 'Low Importance', color: 'text-blue-600', icon: '↓', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    setImportance(opt.id as MessageImportance);
                                                    setIsImportanceOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${opt.bg} ${importance === opt.id ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                                            >
                                                <span className={`w-4 h-4 flex items-center justify-center font-black text-lg ${opt.color}`}>
                                                    {opt.icon}
                                                </span>
                                                <span className={`flex-1 text-left font-medium ${importance === opt.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {opt.label}
                                                </span>
                                                {importance === opt.id && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
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
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        {emailAccountId ? `Sending via SMTP (${fromEmail})` : 'Sending via Secure Route'}
                    </div>
                </div>
            </form>
        </div>
    );
});

export default ReplyForm;
