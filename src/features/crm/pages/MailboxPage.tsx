import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchEventsThunk, fetchThreadsThunk, fetchDraftsThunk } from '../../../store/slices/crm/crm.thunks';
import { setSidebarOpen, setPage } from '../../../store/slices/crm/crm.slice';
import CrmHeader from '../components/CrmHeader';
import CrmSidebar from '../components/CrmSidebar';
import ThreadTable from '../components/ThreadTable';
import ThreadView from '../components/ThreadView';
import EmailAccountsPage from './EmailAccountsPage';

export default function MailboxPage() {
    const dispatch = useAppDispatch();
    const { activeEventId, selectedThreadId, activeFolder, isSidebarOpen, searchTrigger, appliedSearchTerm, appliedDomain, currentPage, totalThreads, totalDrafts } = useAppSelector((state) => state.crm);

    const limit = 50;
    const totalRecords = activeFolder === 'Drafts' ? totalDrafts : totalThreads;
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endRecord = Math.min(currentPage * limit, totalRecords);

    useEffect(() => {
        dispatch(fetchEventsThunk());
        // Do not fetch drafts here, as they are fetched in the effect below based on activeFolder
    }, [dispatch]);

    useEffect(() => {
        if (activeEventId) {
            if (activeFolder === 'Drafts') {
                dispatch(fetchDraftsThunk({ page: currentPage, limit, eventId: activeEventId }));
            } else {
                dispatch(fetchThreadsThunk({
                    eventId: activeEventId,
                    search: appliedSearchTerm || undefined,
                    domain: appliedDomain || undefined,
                    folder: activeFolder,
                    page: currentPage,
                    limit
                }));
            }
        }
        // Close sidebar on mobile when folder changes
        dispatch(setSidebarOpen(false));
    }, [activeEventId, activeFolder, searchTrigger, appliedSearchTerm, appliedDomain, currentPage, dispatch]);

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
    }, [activeFolder, activeEventId, searchTrigger, appliedSearchTerm, appliedDomain, dispatch]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Bar */}
            <CrmHeader />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in"
                        onClick={() => dispatch(setSidebarOpen(false))}
                    />
                )}
                {/* Left Sidebar */}
                <CrmSidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 relative">

                    {activeFolder === 'Accounts' ? (
                        <EmailAccountsPage />
                    ) : selectedThreadId ? (
                        <ThreadView />
                    ) : (
                        <>
                            {/* Toolbar Above Email List */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded border-gray-300 ml-1" title="Select All" />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                                        <span>{startRecord}–{endRecord} of {totalRecords.toLocaleString()}</span>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={handlePrevPage}
                                                disabled={currentPage === 1}
                                                className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={handleNextPage}
                                                disabled={currentPage * limit >= totalRecords}
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

                            {/* Email Listing Table */}
                            <ThreadTable />
                        </>

                    )}
                </div>
            </div>
        </div>
    );
}

