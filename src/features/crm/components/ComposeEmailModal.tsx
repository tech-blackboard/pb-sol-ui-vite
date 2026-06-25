import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { closeComposeModal } from '../../../store/slices/crm/crm.slice';
import { ComposeEmailForm } from './ComposeEmailForm';
import { useEffect } from 'react';
import { fetchEventsThunk, fetchEmailAccountsThunk } from '../../../store/slices/crm/crm.thunks';

export default function ComposeEmailModal() {
    const dispatch = useAppDispatch();
    const { isComposeModalOpen, activeEventId, events, composeInitialValues } = useAppSelector((state: RootState) => state.crm);

    const composeEventId = (composeInitialValues && composeInitialValues.eventId !== undefined)
        ? composeInitialValues.eventId
        : activeEventId;

    useEffect(() => {
        if (isComposeModalOpen) {
            dispatch(fetchEventsThunk());
        }
    }, [isComposeModalOpen, dispatch]);

    useEffect(() => {
        if (isComposeModalOpen) {
            // Wait for events to load first if we have a composeEventId but events list is still empty
            if (composeEventId && events.length === 0) {
                return;
            }

            // If composeEventId is currently a sourcedbId (website_id), wait until it is resolved by fetchEventsThunk
            const isSourcedbId = composeEventId && events.length > 0 && 
                !events.some(e => e.id === composeEventId) && 
                events.some(e => e.sourcedbId === composeEventId);

            if (!isSourcedbId) {
                dispatch(fetchEmailAccountsThunk(composeEventId || undefined));
            }
        }
    }, [isComposeModalOpen, composeEventId, events, dispatch]);

    if (!isComposeModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/30 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full h-full sm:w-[600px] sm:h-[520px] sm:rounded-xl shadow-2xl shadow-blue-900/10 border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">New Message</h2>
                    <button
                        onClick={() => dispatch(closeComposeModal())}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-hidden">
                    <ComposeEmailForm />
                </div>
            </div>
        </div>
    );
}
