import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { fetchEventsThunk, fetchThreadsThunk, fetchDraftsThunk, fetchLabelDefinitionsThunk, trashThreadsThunk, restoreThreadsThunk, deleteThreadsPermanentlyThunk, emptyTrashThunk } from '../../../store/slices/crm/crm.thunks';
import { setSidebarOpen, setPage } from '../../../store/slices/crm/crm.slice';
import CrmHeader from '../components/CrmHeader';
import CrmSidebar from '../components/CrmSidebar';
import ThreadTable from '../components/ThreadTable';
import ThreadView from '../components/ThreadView';
import EmailAccountsPage from './EmailAccountsPage';

import ContactBucketView from '../components/ContactBucketView';
import toast from 'react-hot-toast';

export default function MailboxPage() {
    const dispatch = useAppDispatch();
    const { activeEventId, selectedThreadId, selectedThreadIds, activeFolder, isSidebarOpen, searchTrigger, appliedSearchTerm, appliedDomain, appliedEmailAccountId, currentPage, totalThreads, totalDrafts } = useAppSelector((state: RootState) => state.crm);

    const limit = 50;
    const totalRecords = activeFolder === 'Drafts' ? totalDrafts : totalThreads;
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endRecord = Math.min(currentPage * limit, totalRecords);

    useEffect(() => {
        dispatch(fetchEventsThunk());
        dispatch(fetchLabelDefinitionsThunk());
        // Do not fetch drafts here, as they are fetched in the effect below based on activeFolder
    }, [dispatch]);

    useEffect(() => {
        if (activeEventId) {
            if (activeFolder === 'Drafts') {
                dispatch(fetchDraftsThunk({ page: currentPage, limit, eventId: activeEventId }));
            } else if (activeFolder === 'Contact Bucket') {
                // Fetching is handled internally by ContactBucketView to allow independent filter state
                // but we might want to close sidebar etc.
            } else {
                dispatch(fetchThreadsThunk({
                    eventId: activeEventId,
                    search: appliedSearchTerm || undefined,
                    domain: appliedDomain || undefined,
                    emailAccountId: appliedEmailAccountId || undefined,
                    folder: activeFolder,
                    page: currentPage,
                    limit
                }));
            }
        }
        // Close sidebar on mobile when folder changes
        if (window.innerWidth < 768) {
            dispatch(setSidebarOpen(false));
        }
    }, [activeEventId, activeFolder, searchTrigger, appliedSearchTerm, appliedDomain, appliedEmailAccountId, currentPage, dispatch]);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            dispatch(setPage(currentPage - 1));
        }
    };

    const handleNextPage = () => {
        if (currentPage * limit < totalRecords) {
            dispatch(setPage(currentPage + 1));
        }
    };

    // Reset page when filters change
    useEffect(() => {
        dispatch(setPage(1));
    }, [activeFolder, activeEventId, searchTrigger, appliedSearchTerm, appliedDomain, appliedEmailAccountId, dispatch]);

    const handleBulkTrash = async () => {
        if (confirm(`Move ${selectedThreadIds.length} conversations to Trash?`)) {
            try {
                await dispatch(trashThreadsThunk(selectedThreadIds)).unwrap();
                toast.success(`${selectedThreadIds.length} conversations moved to Trash`);
            } catch (err: unknown) {
                toast.error(err as string);
            }
        }
    };

    const handleBulkRestore = async () => {
        try {
            await dispatch(restoreThreadsThunk(selectedThreadIds)).unwrap();
            toast.success(`${selectedThreadIds.length} conversations restored`);
        } catch (err: unknown) {
            toast.error(err as string);
        }
    };

    const handleBulkDeletePermanently = async () => {
        if (confirm(`Permanently delete ${selectedThreadIds.length} conversations? This cannot be undone.`)) {
            try {
                await dispatch(deleteThreadsPermanentlyThunk(selectedThreadIds)).unwrap();
                toast.success(`${selectedThreadIds.length} conversations permanently deleted`);
            } catch (err: unknown) {
                toast.error(err as string);
            }
        }
    };

    const handleEmptyTrash = async () => {
        if (activeEventId && confirm('Empty Trash? All conversations in Trash will be permanently deleted.')) {
            try {
                await dispatch(emptyTrashThunk(activeEventId)).unwrap();
                toast.success('Trash emptied successfully');
            } catch (err: unknown) {
                toast.error(err as string);
            }
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Bar - Only show for standard CRM folders */}
            {activeFolder !== 'Contact Bucket' && <CrmHeader />}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div
                        data-testid="mobile-backdrop"
                        className="fixed inset-0 bg-black/50 z-48 md:hidden animate-fade-in"
                        onClick={() => dispatch(setSidebarOpen(false))}
                    />
                )}
                {/* Left Sidebar - Hidden for Contact Bucket */}
                {activeFolder !== 'Contact Bucket' && <CrmSidebar />}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 relative">

                    {activeFolder === 'Accounts' ? (
                        <EmailAccountsPage />
                    ) : activeFolder === 'Contact Bucket' ? (
                        <ContactBucketView />
                    ) : selectedThreadId ? (
                        <ThreadView />
                    ) : (
                        <>
                            {/* Toolbar Above Email List */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
                                <div className="flex items-center gap-2">
                                    {selectedThreadIds.length > 0 ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-2 border-r border-gray-200 dark:border-gray-700 mr-1">
                                                {selectedThreadIds.length} selected
                                            </span>
                                            {activeFolder === 'Trash' ? (
                                                <>
                                                    <button
                                                        onClick={handleBulkRestore}
                                                        className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 flex items-center gap-1.5"
                                                        title="Restore Selected"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                        </svg>
                                                        <span className="text-[11px] font-medium">Restore</span>
                                                    </button>
                                                    <button
                                                        onClick={handleBulkDeletePermanently}
                                                        className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors text-red-600 dark:text-red-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 flex items-center gap-1.5"
                                                        title="Delete Selected Permanently"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                                                        </svg>
                                                        <span className="text-[11px] font-medium">Delete Permanently</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={handleBulkTrash}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 flex items-center gap-1.5"
                                                    title="Move Selected to Trash"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                                                    </svg>
                                                    <span className="text-[11px] font-medium">Move to Trash</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {/* Placeholder for when no items selected */}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                                        <span>{startRecord}–{endRecord} of {totalRecords.toLocaleString()}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={handlePrevPage}
                                                disabled={currentPage === 1}
                                                title="Previous Page"
                                                className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={handleNextPage}
                                                disabled={currentPage * limit >= totalRecords}
                                                title="Next Page"
                                                className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium mr-1 border-l pl-4 border-gray-200 dark:border-gray-700">
                                        {activeFolder}
                                    </div>
                                </div>
                            </div>

                            {/* Trash Folder Banner */}
                            {activeFolder === 'Trash' && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/20 px-4 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                        <span>Messages in Trash can be restored or deleted permanently.</span>
                                    </div>
                                    <button
                                        onClick={handleEmptyTrash}
                                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-md transition-colors"
                                    >
                                        Empty Trash now
                                    </button>
                                </div>
                            )}

                            {/* Email Listing Table */}
                            <ThreadTable />
                        </>

                    )}
                </div>
            </div>
        </div>
    );
}



