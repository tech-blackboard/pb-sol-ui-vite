import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchThreadsThunk } from '../../../store/slices/crm/crm.thunks';
import ThreadTable from './ThreadTable';
import { setPage, setActiveEvent, setActiveFolder, setSelectedThread } from '../../../store/slices/crm/crm.slice';
import { fetchMessagesThunk } from '../../../store/slices/crm/crm.thunks';
import type { Message, Thread } from '../types';

export default function ContactBucketView() {
    const dispatch = useAppDispatch();
    const { events, totalThreads, currentPage, loading, labelDefinitions } = useAppSelector((state) => state.crm);

    const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
    const [selectedLabel, setSelectedLabel] = useState<string>('');

    const limit = 50;

    useEffect(() => {
        if (selectedEventId) {
            dispatch(fetchThreadsThunk({
                eventId: Number(selectedEventId),
                label: selectedLabel || undefined,
                page: currentPage,
                limit,
                folder: 'Contact Bucket'
            }));
        }
    }, [selectedEventId, selectedLabel, currentPage, dispatch]);

    // Reset page when filters change
    useEffect(() => {
        dispatch(setPage(1));
    }, [selectedEventId, selectedLabel, dispatch]);

    const handleRowClick: (item: Thread | Message) => void = (item) => {
        const thread = item as Thread;
        dispatch(setActiveEvent(thread.eventId));
        dispatch(setActiveFolder('Inbox'));
        dispatch(setSelectedThread(thread.id));
        dispatch(fetchMessagesThunk(thread.id));
        window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'crm' }));
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            dispatch(setPage(currentPage - 1));
        }
    };

    const handleNextPage = () => {
        if (currentPage * limit < totalThreads) {
            dispatch(setPage(currentPage + 1));
        }
    };

    const startRecord = totalThreads === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endRecord = Math.min(currentPage * limit, totalThreads);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
            {/* Page Title */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Contact Bucket</h1>
            </div>

            {/* Bucket Filter Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="conference-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Conference Edition</label>
                    <select
                        id="conference-select"
                        className="w-full h-10 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">Select Conference</option>
                        {events.map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="label-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Contact Label</label>
                    <select
                        id="label-select"
                        className="w-full h-10 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedLabel}
                        onChange={(e) => setSelectedLabel(e.target.value)}
                    >
                        <option value="">All Labeled Threads</option>
                        {labelDefinitions.map(l => (
                            <option key={l.name} value={l.name}>{l.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col items-end gap-1 ml-auto">
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-3">
                        <span>{startRecord}–{endRecord} of {totalThreads.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1 || !selectedEventId}
                                className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage * limit >= totalThreads || !selectedEventId}
                                className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {!selectedEventId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30 dark:bg-gray-900/30">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Conference</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            Select a conference above to view all contacts that have been labeled and categorized.
                        </p>
                    </div>
                ) : loading.threads ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : totalThreads === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30 dark:bg-gray-900/30">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No labeled threads found</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            There are no emails with the label "{selectedLabel || 'any'}" for this conference edition.
                        </p>
                    </div>
                ) : (
                    <ThreadTable onSelectItem={handleRowClick} />
                )}
            </div>
        </div>
    );
}
