import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchEventsThunk, fetchThreadsThunk, fetchDraftsThunk } from '../../../store/slices/crm/crm.thunks';
import { setSidebarOpen } from '../../../store/slices/crm/crm.slice';
import CrmHeader from '../components/CrmHeader';
import CrmSidebar from '../components/CrmSidebar';
import ThreadTable from '../components/ThreadTable';
import ThreadView from '../components/ThreadView';
import EmailAccountsPage from './EmailAccountsPage';

export default function MailboxPage() {
    const dispatch = useAppDispatch();
    const { activeEventId, selectedThreadId, activeFolder, isSidebarOpen, searchTrigger, appliedSearchTerm, appliedDomain } = useAppSelector((state) => state.crm);
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        dispatch(fetchEventsThunk());
        dispatch(fetchDraftsThunk());
    }, [dispatch]);

    useEffect(() => {
        if (activeEventId) {
            if (activeFolder === 'Drafts') {
                dispatch(fetchDraftsThunk());
            } else {
                dispatch(fetchThreadsThunk({
                    eventId: activeEventId,
                    search: appliedSearchTerm || undefined,
                    domain: appliedDomain || undefined
                }));
            }
        }
        // Close sidebar on mobile when folder changes
        dispatch(setSidebarOpen(false));
    }, [activeEventId, activeFolder, searchTrigger, appliedSearchTerm, appliedDomain, dispatch]);

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
                            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="rounded border-gray-300" title="Select All" />

                                    <div className="relative group">
                                        <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            More
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    <button className="p-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>

                                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Go to Page</span>
                                        <input type="text" className="w-10 h-7 text-center rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-blue-500" defaultValue="1" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Status</span>
                                        <select
                                            className="h-8 pr-8 pl-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option>All</option>
                                            <option>Read</option>
                                            <option>Unread</option>
                                            <option>Starred</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Showing 1 to 50 of 0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Email Listing Table */}
                            <ThreadTable />

                            {/* Pagination Controls */}
                            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                                <div className="text-xs text-gray-500">
                                    Showing 0 to 0 of 0 records
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-1 px-3 rounded text-xs border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50" disabled>Previous</button>
                                    <button className="p-1 px-3 rounded text-xs bg-blue-600 text-white font-medium border border-blue-600">1</button>
                                    <button className="p-1 px-3 rounded text-xs border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800">2</button>
                                    <button className="p-1 px-3 rounded text-xs border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-white dark:hover:bg-gray-800">Next</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

