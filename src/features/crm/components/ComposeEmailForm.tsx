import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { composeEmailThunk, saveDraftThunk } from '../../../store/slices/crm/crm.thunks';
import { closeComposeModal } from '../../../store/slices/crm/crm.slice';
import type { MessageImportance, Attachment, NewAttachment } from '../types';
import { uploadService } from '../../../services/upload';
import toast from 'react-hot-toast';
import { GmailToolbar } from './GmailToolbar';
import { GmailReplyEditor } from './GmailReplyEditor';

export const ComposeEmailForm = () => {
    const dispatch = useAppDispatch();
    const { loading, emailAccounts, activeEventId, events } = useAppSelector((state: RootState) => state.crm);



    // TipTap Editor States
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [showToolbar, setShowToolbar] = useState(true);

    // State
    const [htmlBody, setHtmlBody] = useState('');

    const [fromEmail, setFromEmail] = useState('');
    const [emailAccountId, setEmailAccountId] = useState<number | undefined>(undefined);

    // Select the current event for defaults
    const currentEvent = useMemo(() => {
        return events.find(e => e.id === activeEventId) || events.find(e => e.replyEmails?.includes(fromEmail));
    }, [events, activeEventId, fromEmail]);

    const [subject, setSubject] = useState('');
    const [toEmail, setToEmail] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [showCC, setShowCC] = useState(false);
    const [showBCC, setShowBCC] = useState(false);
    const [importance, setImportance] = useState<MessageImportance>('normal');
    const [isImportanceOpen, setIsImportanceOpen] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const [draftId, setDraftId] = useState<string | undefined>(undefined);
    const [lastSavedBody, setLastSavedBody] = useState('');

    const [attachmentIds, setAttachmentIds] = useState<number[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newAttachments, setNewAttachments] = useState<NewAttachment[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentsRef = useRef(attachments);
    const newAttachmentsRef = useRef(newAttachments);
    const attachmentIdsRef = useRef(attachmentIds);

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    useEffect(() => {
        newAttachmentsRef.current = newAttachments;
    }, [newAttachments]);

    useEffect(() => {
        attachmentIdsRef.current = attachmentIds;
    }, [attachmentIds]);

    const importanceRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const metadataSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    const hasPendingSaveRef = useRef(false);
    const pendingSaveBodyRef = useRef('');
    const lastSavedBodyRef = useRef(lastSavedBody);
    const draftIdRef = useRef(draftId);
    const lastEventIdRef = useRef<number | undefined>(undefined);
    // Tracks whether a metadata-only change (attachment/importance) needs saving
    const hasMetadataChangeRef = useRef(false);
    const signatureInitializedRef = useRef(false);

    const toEmailRef = useRef(toEmail);
    const fromEmailRef = useRef(fromEmail);
    const emailAccountIdRef = useRef(emailAccountId);
    const subjectRef = useRef(subject);
    const ccRef = useRef(cc);
    const bccRef = useRef(bcc);
    const importanceValueRef = useRef(importance);
    const activeEventIdRef = useRef(activeEventId);
    const handleSaveDraftRef = useRef<((body: string) => Promise<void>) | null>(null);

    // Initialize or update signature
    useEffect(() => {
        if (!currentEvent || !editorInstance) return;

        const sigHtml = `
        <div class="email-signature"
            style="margin-top:24px;color:#475569;font-family:sans-serif;line-height:1.5;">

            <p style="margin:0;font-size:14px;">
                Best regards,
            </p>

            <p style="margin:4px 0 0 0;font-size:14px;">
                <strong>${currentEvent.signatureName || ''}</strong>
                | Program Manager
            </p>

            <p style="margin:0;font-size:14px;">
                ${currentEvent.signaturePlace || ''}
            </p>

            <p style="margin:0;font-size:14px;">
                Phone: +1-571-556-1014
            </p>

        </div>
    `;

        if (!signatureInitializedRef.current) {
            if (currentEvent.signatureName || currentEvent.signaturePlace) {
                const initialBody = `<div><br></div>${sigHtml}`;
                setHtmlBody(initialBody);
                setLastSavedBody(initialBody);
                editorInstance.commands.setContent(initialBody, { emitUpdate: false });
                setTimeout(() => {
                    editorInstance.commands.focus('start');
                }, 50);
            }
            signatureInitializedRef.current = true;
            lastEventIdRef.current = currentEvent.id;
        } else if (lastEventIdRef.current !== currentEvent.id) {
            const currentHtml = editorInstance.getHTML();
            const parser = new DOMParser();
            const doc = parser.parseFromString(currentHtml, 'text/html');
            const sigEl = doc.querySelector('.email-signature');

            if (sigEl) {
                if (currentEvent.signatureName || currentEvent.signaturePlace) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = sigHtml;
                    sigEl.replaceWith(tempDiv.firstElementChild!);
                } else {
                    sigEl.remove();
                }
                const updatedHtml = doc.body.innerHTML;
                editorInstance.commands.setContent(updatedHtml, { emitUpdate: false });
                setHtmlBody(updatedHtml);
            } else if (currentEvent.signatureName || currentEvent.signaturePlace) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sigHtml;
                doc.body.appendChild(tempDiv.firstElementChild!);
                const updatedHtml = doc.body.innerHTML;
                editorInstance.commands.setContent(updatedHtml, { emitUpdate: false });
                setHtmlBody(updatedHtml);
            }
            lastEventIdRef.current = currentEvent.id;
        }
    }, [currentEvent, editorInstance]);

    useEffect(() => {
        lastSavedBodyRef.current = lastSavedBody;
    }, [lastSavedBody]);

    useEffect(() => {
        draftIdRef.current = draftId;
    }, [draftId]);

    useEffect(() => { toEmailRef.current = toEmail; }, [toEmail]);
    useEffect(() => { fromEmailRef.current = fromEmail; }, [fromEmail]);
    useEffect(() => { emailAccountIdRef.current = emailAccountId; }, [emailAccountId]);
    useEffect(() => { subjectRef.current = subject; }, [subject]);
    useEffect(() => { ccRef.current = cc; }, [cc]);
    useEffect(() => { bccRef.current = bcc; }, [bcc]);
    useEffect(() => { importanceValueRef.current = importance; }, [importance]);
    useEffect(() => { activeEventIdRef.current = activeEventId; }, [activeEventId]);

    // Prepare dropdown options for 'From'
    const accountOptions = useMemo(() => {
        const options: { label: string; value: string }[] = [];
        const seenEmails = new Set<string>();

        let allowedReplyEmails: string[] = [];

        if (activeEventId && currentEvent) {
            allowedReplyEmails = currentEvent.replyEmails || [];
        } else {
            // Gather reply emails from ALL events
            events.forEach(e => {
                if (e.replyEmails) {
                    allowedReplyEmails.push(...e.replyEmails);
                }
            });
        }

        allowedReplyEmails.forEach(email => {
            if (!seenEmails.has(email)) {
                seenEmails.add(email);
                const matchingAcc = emailAccounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
                if (matchingAcc) {
                    options.push({ label: email, value: `acc_${matchingAcc.id}` });
                } else {
                    options.push({ label: email, value: email });
                }
            }
        });

        return options;
    }, [emailAccounts, currentEvent, events, activeEventId]);

    // Update default sender when options change
    useEffect(() => {
        if (accountOptions.length > 0 && !fromEmail) {
            const firstOption = accountOptions[0];
            if (firstOption.value.startsWith('acc_')) {
                const id = parseInt(firstOption.value.replace('acc_', ''), 10);
                setEmailAccountId(id);
                const account = emailAccounts.find(a => a.id === id);
                if (account) setFromEmail(account.email);
            } else {
                setEmailAccountId(undefined);
                setFromEmail(firstOption.value);
            }
        }
    }, [accountOptions, fromEmail, emailAccounts]);

    // Handle importance dropdown click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (importanceRef.current && !importanceRef.current.contains(e.target as Node)) {
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
            } catch (err) {
                toast.error(`Failed to upload ${file.name}`);
            } finally {
                setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (id: number) => {
        setAttachmentIds(prev => prev.filter(aid => aid !== id));
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const removeNewAttachment = (index: number) => {
        setNewAttachments(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleSaveDraft = useCallback(async (currentBody: string, forceMetadata = false) => {
        // Allow save if body changed OR if a metadata-only change (attachment/importance) needs persisting
        const bodyChanged = currentBody !== lastSavedBodyRef.current;
        if (!toEmailRef.current.trim() || (!bodyChanged && !forceMetadata)) return;

        if (isSavingRef.current) {
            hasPendingSaveRef.current = true;
            pendingSaveBodyRef.current = currentBody;
            return;
        }

        let targetEventId = activeEventIdRef.current;
        if (!targetEventId) {
            const matchingEvent = events.find(e => e.replyEmails?.includes(fromEmailRef.current));
            if (matchingEvent) targetEventId = matchingEvent.id;
        }
        if (!targetEventId) return;

        isSavingRef.current = true;
        hasMetadataChangeRef.current = false;
        try {
            const result = await dispatch(saveDraftThunk({
                draftId: draftIdRef.current,
                eventId: targetEventId,
                toEmail: toEmailRef.current,
                fromEmail: fromEmailRef.current || undefined,
                emailAccountId: emailAccountIdRef.current,
                subject: subjectRef.current || 'No subject',
                htmlBody: currentBody,
                textBody: currentBody,
                cc: ccRef.current,
                bcc: bccRef.current,
                importance: importanceValueRef.current,
                attachmentIds: attachmentIdsRef.current,
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
    }, [dispatch, events]);

    useEffect(() => {
        handleSaveDraftRef.current = handleSaveDraft;
    }, [handleSaveDraft]);

    // Auto-save draft when body changes
    useEffect(() => {
        if (!htmlBody || htmlBody === lastSavedBody || !toEmail.trim()) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            if (htmlBody !== lastSavedBodyRef.current) {
                handleSaveDraft(htmlBody);
            }
        }, 3000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [htmlBody, lastSavedBody, toEmail, handleSaveDraft]);

    // Auto-save draft when attachments or importance change (even if body hasn't changed)
    useEffect(() => {
        // Skip on initial mount — only react to actual changes
        hasMetadataChangeRef.current = true;
    }, [newAttachments, importance]);

    useEffect(() => {
        if (!hasMetadataChangeRef.current) return;
        if (!toEmail.trim()) return;

        if (metadataSaveTimeoutRef.current) clearTimeout(metadataSaveTimeoutRef.current);

        metadataSaveTimeoutRef.current = setTimeout(() => {
            if (hasMetadataChangeRef.current) {
                handleSaveDraft(lastSavedBodyRef.current, true);
            }
        }, 1500);

        return () => {
            if (metadataSaveTimeoutRef.current) clearTimeout(metadataSaveTimeoutRef.current);
        };
    }, [newAttachments, importance, toEmail, handleSaveDraft]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let targetEventId = activeEventId;

        if (!targetEventId) {
            // Infer eventId from the selected fromEmail
            const matchingEvent = events.find(e => e.replyEmails?.includes(fromEmail));
            if (matchingEvent) {
                targetEventId = matchingEvent.id;
            } else {
                toast.error('Please select a conference first to compose an email');
                return;
            }
        }

        if (!toEmail.trim()) {
            setShowErrorModal(true);
            return;
        }

        if (!htmlBody.trim()) {
            toast.error('Please enter a message');
            return;
        }

        const result = await dispatch(composeEmailThunk({
            eventId: targetEventId,
            toEmail,
            fromEmail: fromEmail || undefined,
            emailAccountId,
            subject,
            htmlBody,
            textBody: htmlBody,
            cc,
            bcc,
            importance,
            draftId,
            attachmentIds: attachmentIds,
            attachments: newAttachments,
        }));

        if (composeEmailThunk.fulfilled.match(result)) {
            toast.success('Email sent successfully');
            dispatch(closeComposeModal());
        } else {
            toast.error('Failed to send email');
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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex flex-col px-4 pt-2 shrink-0">
                    {/* To Row */}
                    <div className="flex items-start gap-4 border-b border-gray-100 dark:border-gray-800 py-3 group/to">
                        <div className="w-12 h-7 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0 mt-0.5">
                            To
                        </div>
                        <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[28px]">
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
                            className="bg-transparent border-none rounded text-xs outline-none focus:ring-0 text-blue-600 font-medium cursor-pointer"
                        >
                            {accountOptions.map((opt) => (
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

                <div className="flex flex-col w-full flex-1 min-h-[150px] overflow-hidden px-4 py-2">
                    {showToolbar && <GmailToolbar editor={editorInstance} />}
                    <GmailReplyEditor
                        content={htmlBody}
                        onChange={(html) => setHtmlBody(html)}
                        placeholder="Write your email here..."
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

                {/* Attachments list */}
                {(attachments.length > 0 || newAttachments.length > 0 || uploadingFiles.length > 0) && (
                    <div className="flex flex-wrap gap-2 px-4 pb-3 shrink-0">
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
                                <span className="text-blue-700 dark:text-blue-300 max-w-[150px] truncate">{att.filename}</span>
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

                {/* Bottom Actions */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-24 shrink-0">
                            {loading.savingDraft && (
                                <span className="text-[11px] text-gray-400 animate-pulse whitespace-nowrap">Saving draft...</span>
                            )}
                            {!loading.savingDraft && draftId && (
                                <span className="text-[11px] text-green-600 dark:text-green-500 font-medium whitespace-nowrap">Draft saved</span>
                            )}
                        </div>

                        <div className="flex items-center rounded-lg shadow-sm border border-transparent hover:border-blue-200 hover:shadow-blue-100 dark:hover:border-blue-800 dark:hover:shadow-none transition-all">
                            <button
                                type="submit"
                                disabled={loading.sending}
                                className="h-9 px-5 bg-[#0b57d0] hover:bg-[#0842a0] active:bg-[#062e6f] disabled:bg-[#0b57d0]/50 dark:disabled:bg-[#0b57d0]/30 text-white text-[13px] font-semibold rounded-l-lg transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading.sending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : 'Send'}
                            </button>
                        </div>

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
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => dispatch(closeComposeModal())}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Discard draft"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
            </form>

            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Missing Recipient</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Please specify at least one recipient in the "To" field before sending.
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
