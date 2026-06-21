import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { sendReplyThunk, saveDraftThunk } from '../../../store/slices/crm/crm.thunks';
import { fetchEmailAccounts } from '../services/crmService';
import type { Attachment, EmailAccount, MessageImportance, NewAttachment } from '../types';
import { uploadService } from '../../../services/upload';
import toast from 'react-hot-toast';
import { GmailToolbar } from './GmailToolbar';
import { GmailReplyEditor } from './GmailReplyEditor';

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
    mode?: 'reply' | 'forward';
    forwardedFromId?: string;
    initialAttachmentIds?: number[];
    originalAttachments?: Attachment[];
    expanded?: boolean;
    onCollapse?: () => void;
    onExpand?: () => void;
}

const ReplyForm = forwardRef<ReplyFormHandle, ReplyFormProps>(({
    contactId, eventId, defaultSubject, recipientEmail, replyEmails,
    onSuccess, initialDraftId, initialHtmlBody, initialFromEmail,
    initialEmailAccountId, threadId, initialSubject, initialCc, initialBcc,
    mode = 'reply', forwardedFromId, initialAttachmentIds, originalAttachments,
    expanded, onCollapse, onExpand
}, ref) => {
    const dispatch = useAppDispatch();
    const { loading, events } = useAppSelector((state: RootState) => state.crm);
    const event = events.find(e => e.id === eventId);
    const signatureInitializedRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    // TipTap Editor States
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [showToolbar, setShowToolbar] = useState(true);

    // State
    const [htmlBody, setHtmlBody] = useState(initialHtmlBody || '');
    const [fromEmail, setFromEmail] = useState(initialFromEmail || replyEmails[0] || '');
    const [emailAccountId, setEmailAccountId] = useState<number | undefined>(initialEmailAccountId);
    const [subject, setSubject] = useState(initialSubject || (mode === 'forward' ? `Fwd: ${defaultSubject}` : (defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`)));
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);

    const [isExpanded, setIsExpanded] = useState(expanded ?? (!!initialDraftId || !!initialHtmlBody));

    useEffect(() => {
        if (expanded !== undefined) {
            setIsExpanded(expanded);
        }
    }, [expanded]);

    const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);

    const [attachmentIds, setAttachmentIds] = useState<number[]>(initialAttachmentIds || []);
    const [attachments, setAttachments] = useState<Attachment[]>(originalAttachments || []);
    const [newAttachments, setNewAttachments] = useState<NewAttachment[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const newAttachmentsRef = useRef(newAttachments);

    useEffect(() => {
        newAttachmentsRef.current = newAttachments;
    }, [newAttachments]);

    const [cc, setCc] = useState(initialCc || '');
    const [bcc, setBcc] = useState(initialBcc || '');
    const [showCC, setShowCC] = useState(!!initialCc);
    const [showBCC, setShowBCC] = useState(!!initialBcc);
    const [toEmail, setToEmail] = useState('');
    const [importance, setImportance] = useState<MessageImportance>('normal');
    const [isImportanceOpen, setIsImportanceOpen] = useState(false);
    const [lastSavedBody, setLastSavedBody] = useState(initialHtmlBody || '');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const importanceRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const metadataSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    const hasPendingSaveRef = useRef(false);
    const pendingSaveBodyRef = useRef('');
    const handleSaveDraftRef = useRef<((body: string, forceMetadata?: boolean) => Promise<void>) | null>(null);
    const htmlBodyRef = useRef(htmlBody);
    const lastSavedBodyRef = useRef(lastSavedBody);
    const draftIdRef = useRef(draftId);
    const subjectRef = useRef(subject);
    const ccRef = useRef(cc);
    const bccRef = useRef(bcc);
    const importanceValueRef = useRef(importance);
    const hasUserEditedRef = useRef(false);
    // Tracks whether a metadata-only change (attachment/importance) needs saving
    const hasMetadataChangeRef = useRef(false);

    const lastInitializedKeyRef = useRef('');
    const initializationKey = `${mode}|${forwardedFromId || ''}|${initialDraftId || ''}|${isExpanded}`;

    useEffect(() => {
        if (isExpanded && editorInstance) {
            const timer = setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isExpanded, editorInstance]);

    useEffect(() => {
        if (!isExpanded) {
            lastInitializedKeyRef.current = '';
            signatureInitializedRef.current = false;
            return;
        }

        // Wait until editorInstance is ready before doing any initialization
        if (!editorInstance) {
            return;
        }

        // We re-initialize if:
        // 1. It's a brand new expansion (!lastInitializedKeyRef.current)
        // 2. The mode or source message changed
        // 3. The initialDraftId changed to something other than what we have in state
        const prevKey = lastInitializedKeyRef.current;
        const isFirstExpand = !prevKey;
        const isModeChange = prevKey && prevKey.split('|')[0] !== mode;
        const isSourceChange = prevKey && prevKey.split('|')[1] !== (forwardedFromId || '');
        const isExternalDraftChange = initialDraftId !== draftId;

        const keyChanged = isFirstExpand || isModeChange || isSourceChange || isExternalDraftChange;

        if (keyChanged) {
            lastInitializedKeyRef.current = initializationKey;
            signatureInitializedRef.current = false;

            setDraftId(initialDraftId);
            setSubject(initialSubject || (mode === 'forward' ? `Fwd: ${defaultSubject}` : (defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`)));
            setAttachmentIds(initialAttachmentIds || []);
            setAttachments(originalAttachments || []);
            const newBody = initialHtmlBody || '';
            setHtmlBody(newBody);
            setEmailAccountId(initialEmailAccountId);
            setFromEmail(initialFromEmail || replyEmails[0] || '');
            setCc(initialCc || '');
            setBcc(initialBcc || '');
            setShowCC(!!initialCc);
            setShowBCC(!!initialBcc);

            editorInstance.commands.setContent(newBody, {
                emitUpdate: false,
            });
        }

        // Now evaluate signature initialization if it hasn't been done yet for this key
        if (!signatureInitializedRef.current) {
            const currentBody = keyChanged ? (initialHtmlBody || '') : htmlBodyRef.current;
            const hasSignature = currentBody.includes('class="email-signature"');

            if (initialDraftId || hasSignature) {
                // Draft already has the text/signature saved, or the signature is already in the body.
                signatureInitializedRef.current = true;
            } else if (event) {
                let finalBody = currentBody;
                if (event.signatureName || event.signaturePlace) {
                    const sigHtml = `
        <div class="email-signature"
            style="margin-top:24px;color:#475569;font-family:sans-serif;line-height:1.5;">

            <p style="margin:0;font-size:14px;">
                Best regards,
            </p>

            <p style="margin:4px 0 0 0;font-size:14px;">
                <strong>${event.signatureName || ''}</strong>
                | Program Manager
            </p>

            <p style="margin:0;font-size:14px;">
                ${event.signaturePlace || ''}
            </p>

            <p style="margin:0;font-size:14px;">
                Phone: +1-571-556-1014
            </p>

        </div>
    `;

                    if (mode === 'forward') {
                        finalBody = `<div><br></div>${sigHtml}${finalBody}`;
                    } else {
                        finalBody = `<div><br></div>${sigHtml}${finalBody}`;
                    }
                }
                setHtmlBody(finalBody);
                signatureInitializedRef.current = true;

                editorInstance.commands.setContent(finalBody, {
                    emitUpdate: false,
                });
                setTimeout(() => {
                    editorInstance.commands.focus('start');
                }, 100);
            } else {
                // Event is not loaded yet. Keep signatureInitializedRef.current as false
                // and wait for the event dependency to change.
            }
        }
    }, [
        initializationKey,
        initialSubject,
        initialHtmlBody,
        initialAttachmentIds,
        originalAttachments,
        mode,
        defaultSubject,
        isExpanded,
        draftId,
        initialDraftId,
        forwardedFromId,
        event,
        editorInstance,
        initialFromEmail,
        initialEmailAccountId,
        initialCc,
        initialBcc,
        replyEmails
    ]);

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
    const handleCollapse = () => {
        setIsExpanded(false);
        if (onCollapse) {
            onCollapse();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File size exceeds 20MB limit: ${file.name}`);
                continue;
            }

            const tempId = Math.random().toString(36).substring(7);
            setUploadingFiles(prev => [...prev, { id: tempId, name: file.name }]);

            try {
                const result = await uploadService.uploadFile(file);
                setNewAttachments(prev => [...prev, {
                    filename: file.name,
                    s3Key: result.key,
                    contentType: file.type || 'application/octet-stream',
                    size: file.size
                }]);
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(`Failed to upload ${file.name}:`, error.message);
                toast.error(`Failed to upload ${file.name}`);
            } finally {
                setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeNewAttachment = (index: number) => {
        setNewAttachments(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleSaveDraft = useCallback(async (currentBody: string, forceMetadata = false) => {
        // Allow save if body changed OR if a metadata-only change (attachment/importance) needs persisting
        const bodyChanged = currentBody.trim() && currentBody !== lastSavedBody;
        if (!bodyChanged && !forceMetadata) return;
        // For metadata-only saves, still require some body content
        if (forceMetadata && !currentBody.trim() && !lastSavedBodyRef.current.trim()) return;

        if (isSavingRef.current) {
            hasPendingSaveRef.current = true;
            pendingSaveBodyRef.current = currentBody;
            return;
        }

        isSavingRef.current = true;
        hasMetadataChangeRef.current = false;
        try {
            const result = await dispatch(saveDraftThunk({
                contactId,
                eventId,
                subject: subjectRef.current,
                htmlBody: currentBody,
                textBody: currentBody,
                fromEmail: fromEmail || undefined,
                emailAccountId,
                draftId: draftIdRef.current,
                threadId,
                cc: ccRef.current,
                bcc: bccRef.current,
                importance: importanceValueRef.current,
                isForwarded: mode === 'forward',
                forwardedFromId: mode === 'forward' ? forwardedFromId : undefined,
                attachmentIds: attachmentIds,
                attachments: newAttachmentsRef.current,
            }));

            if (saveDraftThunk.fulfilled.match(result)) {
                setDraftId(result.payload.id);
                setLastSavedBody(currentBody);
                if (result.payload.attachments) {
                    setAttachments(result.payload.attachments);
                    setAttachmentIds(result.payload.attachments.map(a => a.id));
                }
                setNewAttachments([]);
            }
        } finally {
            isSavingRef.current = false;
            if (hasPendingSaveRef.current) {
                hasPendingSaveRef.current = false;
                const nextBody = pendingSaveBodyRef.current;
                if (handleSaveDraftRef.current) {
                    handleSaveDraftRef.current(nextBody);
                }
            }
        }
    }, [contactId, eventId, fromEmail, emailAccountId, lastSavedBody, threadId, dispatch, attachmentIds, forwardedFromId, mode]);

    useEffect(() => {
        handleSaveDraftRef.current = handleSaveDraft;
    }, [handleSaveDraft]);

    // Auto-save draft when body changes
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

    // Mark metadata as changed when attachments or importance change
    useEffect(() => {
        hasMetadataChangeRef.current = true;
    }, [newAttachments, importance]);

    // Auto-save draft when attachments or importance change (even if body hasn't changed)
    useEffect(() => {
        if (!hasMetadataChangeRef.current) return;
        if (!isExpanded) return;

        if (metadataSaveTimeoutRef.current) clearTimeout(metadataSaveTimeoutRef.current);

        metadataSaveTimeoutRef.current = setTimeout(() => {
            if (hasMetadataChangeRef.current) {
                handleSaveDraft(lastSavedBodyRef.current || htmlBodyRef.current, true);
            }
        }, 1500);

        return () => {
            if (metadataSaveTimeoutRef.current) clearTimeout(metadataSaveTimeoutRef.current);
        };
    }, [newAttachments, importance, isExpanded, handleSaveDraft]);

    // Prepare dropdown options
    const accountOptions = useMemo(() => {
        const options: { label: string; value: string }[] = [];
        replyEmails.forEach(email => {
            const matchingAcc = emailAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
            if (matchingAcc) {
                options.push({ label: email, value: `acc_${matchingAcc.id}` });
            } else {
                options.push({ label: email, value: email });
            }
        });
        return options;
    }, [emailAccounts, replyEmails]);

    const saveStateRef = useRef({ contactId, eventId, fromEmail, emailAccountId, threadId, attachmentIds, forwardedFromId, mode });
    useEffect(() => {
        saveStateRef.current = { contactId, eventId, fromEmail, emailAccountId, threadId, attachmentIds, forwardedFromId, mode };
    }, [contactId, eventId, fromEmail, emailAccountId, threadId, attachmentIds, forwardedFromId, mode]);

    // Save on unmount
    useEffect(() => {
        return () => {
            const bodyToSave = htmlBodyRef.current;
            const lastSaved = lastSavedBodyRef.current;
            if (hasUserEditedRef.current && bodyToSave.trim() && bodyToSave !== lastSaved && !isSavingRef.current) {
                const s = saveStateRef.current;
                dispatch(saveDraftThunk({
                    contactId: s.contactId,
                    eventId: s.eventId,
                    subject: subjectRef.current,
                    htmlBody: bodyToSave,
                    textBody: bodyToSave,
                    fromEmail: s.fromEmail || undefined,
                    emailAccountId: s.emailAccountId,
                    draftId: draftIdRef.current,
                    threadId: s.threadId,
                    cc: ccRef.current,
                    bcc: bccRef.current,
                    importance: importanceValueRef.current,
                    isForwarded: s.mode === 'forward',
                    forwardedFromId: s.mode === 'forward' ? s.forwardedFromId : undefined,
                    attachmentIds: s.attachmentIds,
                    attachments: newAttachmentsRef.current,
                }));
            }
        };
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!htmlBody.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (mode === 'forward' && !toEmail.trim()) {
            setShowErrorModal(true);
            return;
        }

        const result = await dispatch(sendReplyThunk({
            contactId,
            eventId,
            fromEmail: fromEmail || undefined,
            emailAccountId,
            subject,
            htmlBody,
            textBody: htmlBody,
            draftId: draftId,
            threadId,
            cc,
            bcc,
            importance,
            isForwarded: mode === 'forward',
            forwardedFromId: mode === 'forward' ? forwardedFromId : undefined,
            attachmentIds: attachmentIds,
            attachments: newAttachments,
            ...(mode === 'forward' && toEmail ? { toEmail } : {})
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
            setNewAttachments([]);
            handleCollapse();
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
            <div ref={containerRef} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                <button
                    onClick={() => {
                        setIsExpanded(true);
                        if (onExpand) {
                            onExpand();
                        }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-500 hover:border-blue-400 hover:ring-1 hover:ring-blue-100 transition-all text-left"
                >
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                    </div>
                    Click here to <span className="text-blue-600 font-medium">{mode === 'forward' ? 'Forward' : 'Reply'}</span> to {recipientEmail || '...'}
                </button>
            </div>
        );
    }

    const removeAttachment = (id: number) => {
        setAttachmentIds(prev => prev.filter(aid => aid !== id));
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div ref={containerRef} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col">
                    {/* To Row */}
                    <div className="flex items-start gap-4 border-b border-gray-100 dark:border-gray-800 py-3 group/to">
                        <div className="w-12 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0 mt-0.5">
                            To
                        </div>
                        <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[28px]">
                            {mode === 'forward' ? (
                                <>
                                    {toEmail.split(/[;,]+/).filter(e => e.trim()).map((email, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-gray-900 dark:text-gray-100 animate-in zoom-in-95 duration-200">
                                            <span>{email.trim()}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const emails = toEmail.split(/[;,]+/).filter(e => e.trim());
                                                    emails.splice(idx, 1);
                                                    setToEmail(emails.join(', '));
                                                }}
                                                className="text-amber-400 hover:text-amber-600 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <input
                                        type="text"
                                        className="flex-1 min-w-[150px] bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs py-1"
                                        placeholder={toEmail ? "" : "Add recipients..."}
                                        onKeyDown={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            if (e.key === 'Enter') e.preventDefault();
                                            if ((e.key === ',' || e.key === ';' || e.key === ' ' || e.key === 'Enter') && val.trim()) {
                                                e.preventDefault();
                                                const newEmail = val.trim();
                                                const existing = toEmail.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                if (!existing.includes(newEmail)) {
                                                    setToEmail(existing.concat(newEmail).join(', '));
                                                }
                                                (e.target as HTMLInputElement).value = '';
                                            } else if (e.key === 'Backspace' && !val && toEmail) {
                                                const existing = toEmail.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                existing.pop();
                                                setToEmail(existing.join(', '));
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = e.target.value.trim();
                                            if (val) {
                                                const existing = toEmail.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                if (!existing.includes(val)) {
                                                    setToEmail(existing.concat(val).join(', '));
                                                }
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-gray-900 dark:text-gray-100">
                                    <span>{recipientEmail}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 ml-auto">
                                {!showCC && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCC(true)}
                                        className="text-gray-400 hover:text-blue-600 text-[11px] font-semibold transition-colors"
                                    >
                                        Cc
                                    </button>
                                )}
                                {!showBCC && (
                                    <button
                                        type="button"
                                        onClick={() => setShowBCC(true)}
                                        className="text-gray-400 hover:text-blue-600 text-[11px] font-semibold transition-colors"
                                    >
                                        Bcc
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCollapse}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
                                    aria-label="Collapse"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cc Row */}
                    {showCC && (
                        <div className="flex items-start gap-4 border-b border-gray-100 dark:border-gray-800 py-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="w-12 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0 mt-0.5">
                                Cc
                            </div>
                            <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[28px]">
                                {cc.split(/[;,]+/).filter(e => e.trim()).map((email, idx) => (
                                    <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-gray-900 dark:text-gray-100">
                                        <span>{email.trim()}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const emails = cc.split(/[;,]+/).filter(e => e.trim());
                                                emails.splice(idx, 1);
                                                setCc(emails.join(', '));
                                            }}
                                            className="text-amber-400 hover:text-amber-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs py-1"
                                    placeholder={cc ? "" : "Add Cc..."}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.endsWith(',') || val.endsWith(';') || val.endsWith(' ')) {
                                            const newEmail = val.slice(0, -1).trim();
                                            if (newEmail) {
                                                const existing = cc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                if (!existing.includes(newEmail)) {
                                                    setCc(existing.concat(newEmail).join(', ') + ', ');
                                                }
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        if (val) {
                                            const existing = cc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                            if (!existing.includes(val)) {
                                                setCc(existing.concat(val).join(', '));
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (e.key === 'Backspace' && !val && cc.length > 0) {
                                            const parts = cc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                            parts.pop();
                                            setCc(parts.join(', '));
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (val) {
                                                const newEmail = val.trim();
                                                const existing = cc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                if (!existing.includes(newEmail)) {
                                                    setCc(existing.concat(newEmail).join(', '));
                                                }
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                    autoFocus
                                />
                                {!showBCC && (
                                    <button
                                        type="button"
                                        onClick={() => setShowBCC(true)}
                                        className="text-gray-400 hover:text-blue-600 text-[11px] font-medium ml-auto"
                                    >
                                        Bcc
                                    </button>
                                )}
                                <button type="button" onClick={() => { setShowCC(false); setCc(''); }} className="text-gray-300 hover:text-red-500 ml-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bcc Row */}
                    {showBCC && (
                        <div className="flex items-start gap-4 border-b border-gray-100 dark:border-gray-800 py-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="w-12 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0 mt-0.5">
                                Bcc
                            </div>
                            <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[28px]">
                                {bcc.split(/[;,]+/).filter(e => e.trim()).map((email, idx) => (
                                    <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-gray-900 dark:text-gray-100">
                                        <span>{email.trim()}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const emails = bcc.split(/[;,]+/).filter(e => e.trim());
                                                emails.splice(idx, 1);
                                                setBcc(emails.join(', '));
                                            }}
                                            className="text-amber-400 hover:text-amber-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs py-1"
                                    placeholder={bcc ? "" : "Add Bcc..."}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.endsWith(',') || val.endsWith(';') || val.endsWith(' ')) {
                                            const newEmail = val.slice(0, -1).trim();
                                            if (newEmail) {
                                                const existing = bcc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                if (!existing.includes(newEmail)) {
                                                    setBcc(existing.concat(newEmail).join(', ') + ', ');
                                                }
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        if (val) {
                                            const existing = bcc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                            if (!existing.includes(val)) {
                                                setBcc(existing.concat(val).join(', '));
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (e.key === 'Backspace' && !val && bcc.length > 0) {
                                            const parts = bcc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                            parts.pop();
                                            setBcc(parts.join(', '));
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (val) {
                                                const newEmail = val.trim();
                                                const existing = bcc.split(/[;,]+/).map(e => e.trim()).filter(Boolean);
                                                if (!existing.includes(newEmail)) {
                                                    setBcc(existing.concat(newEmail).join(', '));
                                                }
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                    autoFocus={!showCC}
                                />
                                <button type="button" onClick={() => { setShowBCC(false); setBcc(''); }} className="text-gray-300 hover:text-red-500 ml-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* From Row */}
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 py-2">
                        <div className="w-12 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0">
                            From
                        </div>
                        <select
                            value={emailAccountId ? `acc_${emailAccountId}` : fromEmail}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            aria-label="From"
                            className="bg-transparent border-none rounded text-xs outline-none focus:ring-0 text-blue-600 font-medium cursor-pointer"
                        >
                            {accountOptions.map((opt: { label: string; value: string }) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Row */}
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 py-2">
                        <div className="w-12 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0">
                            Subject
                        </div>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 text-xs font-medium"
                            placeholder="Email subject"
                        />
                    </div>
                </div>

                <div className="flex flex-col w-full">
                    {showToolbar && <GmailToolbar editor={editorInstance} />}
                    <GmailReplyEditor
                        content={htmlBody}
                        onChange={(html) => {
                            const cleanText = html.replace(/<[^>]*>/g, '').trim();

                            // Prevent overwriting signature with initial empty updates from editor
                            if (
                                cleanText === '' &&
                                htmlBody.includes('email-signature') &&
                                (!editorInstance || !editorInstance.isFocused)
                            ) {
                                return;
                            }
                            hasUserEditedRef.current = true;
                            setHtmlBody(html);
                        }}
                        placeholder="Write your reply here..."
                        disabled={loading.sending}
                        onEditorReady={(editor) => {
                            setEditorInstance(editor);
                            if (!editorInstance && editor) {
                                setTimeout(() => {
                                    editor.commands.focus('start');
                                }, 100);
                            }
                        }}
                    />
                </div>

                {/* Attachments UI */}
                {(attachments.length > 0 || newAttachments.length > 0 || uploadingFiles.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32a.75.75 0 1 1-1.06-1.06l10.94-10.94" />
                                </svg>
                                <span className="text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{att.filename}</span>
                                <span className="text-gray-400 dark:text-gray-500 text-[10px]">({(att.size / 1024).toFixed(1)} KB)</span>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(att.id)}
                                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {newAttachments.map((att, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800/40 text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32a.75.75 0 1 1-1.06-1.06l10.94-10.94" />
                                </svg>
                                <span className="text-blue-700 dark:text-blue-305 max-w-[150px] truncate">{att.filename}</span>
                                <span className="text-blue-400 dark:text-blue-500 text-[10px]">({(att.size / 1024).toFixed(1)} KB)</span>
                                <button
                                    type="button"
                                    onClick={() => removeNewAttachment(idx)}
                                    className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/45 rounded-full text-blue-400 hover:text-red-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {uploadingFiles.map(file => (
                            <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-xs animate-pulse">
                                <div className="h-3 w-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                <span className="text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{file.name}</span>
                                <span className="text-gray-400 text-[10px]">Uploading...</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading.sending}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] active:bg-[#062e6f] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading.sending ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            )}
                            {mode === 'forward' ? 'Forward' : (threadId ? 'Send Reply' : 'Send')}
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                            title="Attach files"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32a.75.75 0 1 1-1.06-1.06l10.94-10.94" />
                            </svg>
                        </button>
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {/* Formatting Toggle Button (Aa) */}
                        <button
                            type="button"
                            onClick={() => setShowToolbar(!showToolbar)}
                            className={`hidden px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-0.5 border ${showToolbar
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 bg-white dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            title="Formatting options"
                        >
                            <span className="font-bold text-sm select-none">A</span>
                            <span className="text-xs font-semibold select-none underline decoration-2">a</span>
                        </button>

                        {/* Importance Selector */}
                        <div className="relative" ref={importanceRef}>
                            <button
                                type="button"
                                onClick={() => setIsImportanceOpen(!isImportanceOpen)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${importance === 'high'
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

                        {/* Status Messages */}
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
            {showErrorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl p-8 w-full max-w-[400px] animate-in zoom-in-95 duration-200 mx-4">
                        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Error</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg">Please specify at least one recipient.</p>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowErrorModal(false)}
                                className="bg-[#0B57D0] hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ReplyForm;
