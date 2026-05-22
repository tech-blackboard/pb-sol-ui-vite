import { useState, useEffect, useCallback } from 'react';
import { searchContactBucket, getContactBucketLabels, type CrmLabel } from '../../../services/contactBucket';
import type { ContactBucketItem } from '../../../services/contactBucket';
import { listWebsites } from '../../../services/sourcedb';
import type { SourceWebsite } from '../../../services/sourcedb';
import { formatDate } from '../../../utils/utils';
import AbstractPagination from '../../abstracts/components/AbstractPagination';
import ContactBucketFormModal from '../components/ContactBucketFormModal';

const LABEL_COLORS: Record<string, string> = {
    'Abstract Submitted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Registration Submitted': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'Brochure Downloaded': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Contact Inquiry': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Accommodation Registration': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Sponsorship/Exhibitor': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

export default function GlobalContactsPage() {
    const [items, setItems] = useState<ContactBucketItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [websiteId, setWebsiteId] = useState<number | ''>('');
    const [selectedLabelId, setSelectedLabelId] = useState<number | ''>('');
    const [websites, setWebsites] = useState<SourceWebsite[]>([]);
    const [labels, setLabels] = useState<CrmLabel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit' | null>(null);
    const [modalItem, setModalItem] = useState<ContactBucketItem | null>(null);

    // Fetch websites & labels on mount
    useEffect(() => {
        listWebsites().then(setWebsites).catch(() => { });
        getContactBucketLabels().then(setLabels).catch(() => { });
    }, []);

    const refreshLabels = () => {
        getContactBucketLabels().then(setLabels).catch(() => { });
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await searchContactBucket({
                page,
                limit: pageSize,
                search: search || undefined,
                website_id: websiteId || undefined,
                labelId: selectedLabelId || undefined,
                sortBy: 'lastInteraction',
                sortOrder: 'DESC',
            });
            setItems(result.items);
            setTotal(result.total);
        } catch (err) {
            setError('Failed to load contacts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, websiteId, selectedLabelId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, websiteId, selectedLabelId]);

    const handleSearch = () => {
        setSearch(searchInput.trim());
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-2 my-1.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base sm:text-xl font-semibold text-gray-700 dark:text-gray-100 md:ml-2">
                        Global Contacts
                    </h2>
                    <button
                        onClick={() => { setModalMode('add'); setModalItem(null); }}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-purple-600 bg-purple-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Contact</span>
                    </button>
                </div>

                {error && (
                    <div className="md:mx-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="px-2 py-2 flex flex-wrap items-end gap-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 rounded-t-lg">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Search</label>
                    <div className="flex gap-1">
                        <input
                            type="text"
                            placeholder="Name, email, phone, organization..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="flex-1 h-9 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            className="h-9 px-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Conference Filter */}
                <div className="min-w-[180px]">
                    <label htmlFor="conference-filter" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Conference</label>
                    <select
                        id="conference-filter"
                        className="w-full h-9 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={websiteId}
                        onChange={(e) => setWebsiteId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">All Conferences</option>
                        {websites.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                {/* Label Filter */}
                <div className="min-w-[180px]">
                    <label htmlFor="label-filter" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Label</label>
                    <select
                        id="label-filter"
                        className="w-full h-9 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedLabelId}
                        onChange={(e) => setSelectedLabelId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">All Labels</option>
                        {labels.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="relative flex-1 min-h-0 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
                    <table className="min-w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-3 py-2 font-semibold min-w-[6rem]">Actions</th>
                                <th className="px-3 py-2 font-semibold min-w-[14rem]">Conference</th>
                                <th className="px-3 py-2 font-semibold min-w-[10rem]">Name</th>
                                <th className="px-3 py-2 font-semibold min-w-[12rem]">Email</th>
                                <th className="px-3 py-2 font-semibold min-w-[15rem]">Label</th>
                                <th className="px-3 py-2 font-semibold min-w-[8rem]">Phone</th>
                                <th className="px-3 py-2 font-semibold min-w-[8rem]">WhatsApp</th>
                                <th className="px-3 py-2 font-semibold min-w-[10rem]">Organization</th>
                                <th className="px-3 py-2 font-semibold min-w-[8rem]">Country</th>
                                <th className="px-3 py-2 font-semibold min-w-[10rem]">Notes</th>
                                <th className="px-3 py-2 font-semibold min-w-[10rem]">Last Interaction</th>

                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Loading global contacts...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                                        No contacts found
                                    </td>
                                </tr>
                            )}
                            {!loading && items.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-3 py-1.5">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => { setModalMode('view'); setModalItem(item); }}
                                                className="p-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                title="View Details"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => { setModalMode('edit'); setModalItem(item); }}
                                                className="p-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                title="Edit Contact"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[14rem]" title={item.website?.name ?? '—'}>
                                        {item.website?.name ?? '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-900 dark:text-gray-100 font-medium max-w-[10rem] truncate" title={item.name ?? '—'}>
                                        {item.name ?? '—'}
                                    </td>
                                    <td className="px-3 py-1.5" title={item.email}>
                                        <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <div className="flex flex-wrap gap-1">
                                            {item.labels && item.labels.length > 0 ? (
                                                item.labels.map(l => (
                                                    <div key={l.id} className="flex flex-col">
                                                        <span
                                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border w-fit ${LABEL_COLORS[l.name] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}
                                                        >
                                                            {l.name}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">No labels</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate" title={item.phone ?? '—'}>
                                        {item.phone ?? '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate" title={item.wphone ?? '—'}>
                                        {item.wphone ?? '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[10rem]" title={item.organization ?? '—'}>
                                        {item.organization ?? '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate" title={item.country ?? '—'}>
                                        {item.country ?? '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate" title={item.notes || '—'}>
                                        {item.notes || '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate" title={item.lastInteraction ? formatDate(item.lastInteraction) : '—'}>
                                        {item.lastInteraction ? formatDate(item.lastInteraction) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <AbstractPagination
                totalPages={Math.ceil(total / pageSize)}
                rowsOnPage={pageSize}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />

            {/* View / Add / Edit Modal */}
            {modalMode && (
                <ContactBucketFormModal
                    mode={modalMode}
                    item={modalItem}
                    onClose={() => { setModalMode(null); setModalItem(null); }}
                    onSuccess={() => { fetchData(); refreshLabels(); }}
                />
            )}
        </div>
    );
}
