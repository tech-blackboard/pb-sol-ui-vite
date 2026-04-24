import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { fetchEmailAccounts, createEmailAccount, updateEmailAccount, deleteEmailAccount, getMicrosoftAuthUrl } from '../services/crmService';
import type { EmailAccount } from '../types';
import { toast } from 'react-hot-toast';
import { selectAuth } from '../../../store/slices/authSlice';

interface BulkAccountItem {
    'Email ID'?: string;
    email?: string;
    Purpose?: string;
    name?: string;
    'IMAP/SMTP Server'?: string;
    imapHost?: string;
    smtpHost?: string;
    'IMAP Port'?: string | number;
    imapPort?: string | number;
    'SMTP Port'?: string | number;
    smtpPort?: string | number;
    Password?: string;
    imapPassword?: string;
    smtpPassword?: string;
}

export default function EmailAccountsPage() {
    const { user } = useAppSelector(selectAuth);
    const isAdmin = Boolean(user?.isAdmin);
    const {
        accountsActiveEventId,
        accountsActiveDomain: activeDomain,
        appliedAccountsSearchTerm,
        accountsSearchTrigger: searchTrigger
    } = useAppSelector((state) => state.crm);
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkJson, setBulkJson] = useState('');

    // Form state
    const [formData, setFormData] = useState<Partial<EmailAccount>>({
        name: '',
        email: '',
        imapHost: '',
        imapPort: 993,
        imapUser: '',
        imapPassword: '',
        imapEncryption: 'ssl' as const,
        smtpHost: '',
        smtpPort: 465,
        smtpUser: '',
        smtpPassword: '',
        smtpEncryption: 'ssl' as const,
        outboundProvider: 'smtp',
        apiKey: '',
        apiRegion: '',
        isActive: true
    });

    const loadAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchEmailAccounts(accountsActiveEventId || undefined, appliedAccountsSearchTerm);
            setAccounts(data);
            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load accounts';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [accountsActiveEventId, appliedAccountsSearchTerm]);

    useEffect(() => {
        if (!isAdmin) return;
        loadAccounts();

        // --- 🧹 URL Cleaning Logic ---
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const message = params.get('message');

        if (status === 'success') {
            toast.success('Microsoft account connected successfully!');
            // Remove parameters and custom path from URL without reloading
            window.history.replaceState({}, document.title, '/');
        } else if (status === 'error') {
            toast.error(message || 'Failed to connect Microsoft account');
            window.history.replaceState({}, document.title, '/');
        }
    }, [accountsActiveEventId, searchTrigger, isAdmin, loadAccounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await updateEmailAccount(editingAccount.id, formData);
                toast.success('Account updated successfully');
            } else {
                await createEmailAccount(formData);
                toast.success('Account added successfully');
            }
            setIsFormOpen(false);
            setEditingAccount(null);
            loadAccounts();
        } catch (error: unknown) {
            let message = 'Failed to save account';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            toast.error(message);
        }
    };

    const handleEdit = (account: EmailAccount) => {
        setEditingAccount(account);
        setFormData({
            ...account,
            imapPassword: '', // Don't show encrypted password
            smtpPassword: '',
            apiKey: '',
            outboundProvider: account.outboundProvider || 'smtp'
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            await deleteEmailAccount(id);
            toast.success('Account deleted');
            loadAccounts();
        } catch {
            toast.error('Failed to delete account');
        }
    };

    const handleMicrosoftAuth = async (id: number) => {
        try {
            const authUrl = await getMicrosoftAuthUrl(id);
            if (authUrl) {
                window.open(authUrl, '_self');
            }
        } catch {
            toast.error('Failed to initiate Microsoft login');
        }
    };

    const handleBulkUpload = async () => {
        try {
            const data = JSON.parse(bulkJson);
            if (!Array.isArray(data)) {
                toast.error('Input must be a JSON array');
                return;
            }

            let createdCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            toast.loading('Creating accounts...', { id: 'bulk-upload' });

            for (const item of data as BulkAccountItem[]) {
                try {
                    const email = item['Email ID'] || item['email'];
                    if (!email) {
                        skippedCount++;
                        continue;
                    }

                    // Duplicate check (UI side)
                    const exists = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
                    if (exists) {
                        skippedCount++;
                        continue;
                    }

                    const payload: Partial<EmailAccount> = {
                        name: item.Purpose || item.name || email.split('@')[0],
                        email: email,
                        imapHost: item['IMAP/SMTP Server'] || item.imapHost || '',
                        imapPort: Number(item['IMAP Port'] || item.imapPort || 993),
                        imapUser: email,
                        imapPassword: item.Password || item.imapPassword || '',
                        imapEncryption: 'ssl' as const,
                        smtpHost: item['IMAP/SMTP Server'] || item.smtpHost || '',
                        smtpPort: Number(item['SMTP Port'] || item.smtpPort || 465),
                        smtpUser: email,
                        smtpPassword: item.Password || item.smtpPassword || '',
                        smtpEncryption: 'ssl' as const,
                        isActive: true
                    };

                    await createEmailAccount(payload);
                    createdCount++;
                } catch (err) {
                    console.error('Failed to create account:', item, err);
                    errorCount++;
                }
            }

            toast.dismiss('bulk-upload');
            if (errorCount > 0) {
                toast.error(`Completed with ${errorCount} errors. Created: ${createdCount}, Skipped: ${skippedCount}`);
            } else {
                toast.success(`Success! Created: ${createdCount}, Skipped: ${skippedCount}`);
            }

            setIsBulkModalOpen(false);
            setBulkJson('');
            loadAccounts();
        } catch {
            toast.error('Invalid JSON format');
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    You do not have permission to view or manage email accounts. Please contact an administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    const filteredAccounts = accounts.filter(a => !activeDomain || a.email === activeDomain);

    if (loading) return <div className="p-8 text-center">Loading accounts...</div>;

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 p-6 overflow-auto">
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400 animate-fade-in">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Accounts</h1>
                    <p className="text-gray-500 text-sm">Manage IMAP and SMTP configurations for shared inbox.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => {
                            setEditingAccount(null);
                            setFormData({
                                name: '', email: '', imapHost: '', imapPort: 993, imapUser: '',
                                imapPassword: '', imapEncryption: 'ssl' as const, smtpHost: '',
                                smtpPort: 465, smtpUser: '', smtpPassword: '',
                                smtpEncryption: 'ssl' as const, outboundProvider: 'smtp',
                                apiKey: '', apiRegion: '', isActive: true
                            });
                            setIsFormOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Account
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map(account => (
                    <div key={account.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50/50 dark:bg-gray-800/40 hover:shadow-md transition-shadow relative group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(account)} aria-label="Edit account" className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button onClick={() => handleDelete(account.id)} aria-label="Delete account" className="p-1.5 text-gray-400 hover:text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{account.name}</h3>
                        <p className="text-gray-500 text-sm truncate mb-4">{account.email}</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {account.isActive ? 'Active Sync' : 'Disabled'}
                                </div>
                                {account.authMethod === 'oauth2' && (
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase">
                                        OAuth2 Ready
                                    </span>
                                )}
                            </div>

                            {(account.email.includes('outlook.com') || account.email.includes('precisionsummits.com')) && account.authMethod !== 'oauth2' && (
                                <button
                                    onClick={() => handleMicrosoftAuth(account.id)}
                                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
                                >
                                    <svg viewBox="0 0 23 23" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 0h11.045v11.045H0z" fill="#f25022" /><path d="M11.955 0H23v11.045H11.955z" fill="#7fbb00" /><path d="M0 11.955h11.045V23H0z" fill="#00a1f1" /><path d="M11.955 11.955H23V23H11.955z" fill="#ffbb00" />
                                    </svg>
                                    Connect Microsoft
                                </button>
                            )}

                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                Last Sync: {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : 'Never'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAccounts.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/10 dark:bg-gray-800/10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 mt-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No email accounts found</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        We couldn't find any email accounts matching your criteria. Try adjusting your filters or add a new account.
                    </p>
                </div>
            )}

            {/* Modal / Slide-over for adding/editing account */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col p-8 overflow-y-auto transform transition-transform animate-slide-in">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold dark:text-white">{editingAccount ? 'Edit Account' : 'Connect Account'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Base Info</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Account Name</label>
                                        <input type="text" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Company Support" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email Address</label>
                                        <input type="email" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="support@precisionglobalconferences.com" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Inbound (IMAP)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Host</label>
                                        <input type="text" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.imapHost} onChange={e => setFormData({ ...formData, imapHost: e.target.value })} required placeholder="imap.gmail.com" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Port</label>
                                        <input type="number" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.imapPort} onChange={e => setFormData({ ...formData, imapPort: +e.target.value })} required />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Username</label>
                                        <input type="text" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.imapUser} onChange={e => setFormData({ ...formData, imapUser: e.target.value })} required />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Password</label>
                                        <input type="password" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.imapPassword} onChange={e => setFormData({ ...formData, imapPassword: e.target.value })} placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Outbound Setup</h3>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-3">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Outbound Provider</label>
                                        <select
                                            className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.outboundProvider}
                                            onChange={e => setFormData({ ...formData, outboundProvider: e.target.value })}
                                        >
                                            <option value="smtp">Standard SMTP</option>
                                            <option value="sendgrid">SendGrid API</option>
                                            <option value="aws-ses">AWS SES API</option>
                                        </select>
                                    </div>

                                    {formData.outboundProvider === 'smtp' && (
                                        <>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Host</label>
                                                <input type="text" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.smtpHost} onChange={e => setFormData({ ...formData, smtpHost: e.target.value })} required placeholder="smtp.gmail.com" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Port</label>
                                                <input type="number" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.smtpPort} onChange={e => setFormData({ ...formData, smtpPort: +e.target.value })} required />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">SMTP User (Optional if same)</label>
                                                <input type="text" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.smtpUser} onChange={e => setFormData({ ...formData, smtpUser: e.target.value })} />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">SMTP Password</label>
                                                <input type="password" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.smtpPassword} onChange={e => setFormData({ ...formData, smtpPassword: e.target.value })} placeholder="••••••••" />
                                            </div>
                                        </>
                                    )}

                                    {formData.outboundProvider === 'sendgrid' && (
                                        <div className="col-span-3">
                                            <label htmlFor="sg-api-key" className="block text-xs font-semibold text-gray-400 uppercase mb-1">SendGrid API Key</label>
                                            <input id="sg-api-key" type="password" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} placeholder="SG.xxxxxxxxxxxxxx" required={!editingAccount} />
                                        </div>
                                    )}

                                    {formData.outboundProvider === 'aws-ses' && (
                                        <>
                                            <div className="col-span-3">
                                                <label htmlFor="aws-api-key" className="block text-xs font-semibold text-gray-400 uppercase mb-1">AWS Access Key & Secret (Format: KeyID:Secret)</label>
                                                <input id="aws-api-key" type="password" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} placeholder="AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" required={!editingAccount} />
                                            </div>
                                            <div className="col-span-3">
                                                <label htmlFor="aws-region" className="block text-xs font-semibold text-gray-400 uppercase mb-1">AWS Region</label>
                                                <input id="aws-region" type="text" className="w-full h-11 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-blue-500" value={formData.apiRegion} onChange={e => setFormData({ ...formData, apiRegion: e.target.value })} placeholder="us-east-1" required />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30">
                                    {editingAccount ? 'Update Account' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Bulk Upload Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBulkModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b dark:border-gray-800">
                            <div>
                                <h2 className="text-xl font-bold dark:text-white">Bulk Upload Accounts</h2>
                                <p className="text-xs text-gray-400 mt-1">Paste a JSON array of email accounts to create them in bulk.</p>
                            </div>
                            <button onClick={() => setIsBulkModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <textarea
                                aria-label="Bulk JSON input"
                                className="w-full h-96 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 font-mono text-xs border-none outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder={`[
  {
    "Email ID": "support@example.com",
    "Password": "password123",
    "IMAP/SMTP Server": "mail.example.com",
    "IMAP Port": 993,
    "SMTP Port": 465,
    "Purpose": "Support Team"
  }
]`}
                                value={bulkJson}
                                onChange={e => setBulkJson(e.target.value)}
                            />
                        </div>

                        <div className="p-6 border-t dark:border-gray-800 flex gap-4 bg-gray-50/50 dark:bg-gray-800/20">
                            <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-all">Cancel</button>
                            <button
                                onClick={handleBulkUpload}
                                disabled={!bulkJson.trim()}
                                className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30"
                            >
                                Create Bulk Accounts
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

