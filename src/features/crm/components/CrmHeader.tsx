import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchThreadsThunk } from '../../../store/slices/crm/crm.thunks';
import { setActiveEvent } from '../../../store/slices/crm/crm.slice';

export default function CrmHeader() {
    const dispatch = useAppDispatch();
    const { events, activeEventId } = useAppSelector((state) => state.crm);
    const [search, setSearch] = useState('');

    // Group events by domain or just get unique domains
    const uniqueDomains = Array.from(new Set(events.map(e => e.replyDomain)));
    const activeEvent = events.find(e => e.id === activeEventId);
    const currentDomain = activeEvent?.replyDomain || uniqueDomains[0];

    const handleSync = () => {
        if (activeEventId) {
            dispatch(fetchThreadsThunk(activeEventId));
        }
    };

    const handleDomainChange = (domain: string) => {
        const firstEventInDomain = events.find(e => e.replyDomain === domain);
        if (firstEventInDomain) {
            dispatch(setActiveEvent(firstEventInDomain.id));
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Email Account Selector */}
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Email Account</label>
                <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentDomain || ''}
                    onChange={(e) => handleDomainChange(e.target.value)}
                >
                    {uniqueDomains.map((domain) => (
                        <option key={domain} value={domain}>
                            {domain}
                        </option>
                    ))}
                </select>
            </div>


            {/* Sync Button */}
            <button
                onClick={handleSync}
                className="flex items-center gap-2 h-10 px-4 mt-5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Synchronize Emails
            </button>

            {/* Search Input */}
            <div className="flex-[2] min-w-[300px] mt-5">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Subject or Email ID"
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Search Button */}
            <button className="h-10 px-6 mt-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Search Email
            </button>

            {/* Edition Dropdown */}
            <div className="min-w-[250px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Conference Edition</label>
                <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={activeEventId || ''}
                    onChange={(e) => dispatch(setActiveEvent(Number(e.target.value)))}
                >
                    {events.filter(e => e.replyDomain === currentDomain).map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                </select>
            </div>

        </div>
    );
}
