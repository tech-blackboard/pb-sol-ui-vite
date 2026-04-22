import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchThreadsThunk } from '../../../store/slices/crm/crm.thunks';
import { setActiveEvent, setAccountsActiveEvent, setActiveDomain, toggleSidebar, setSearchTerm, triggerSearch } from '../../../store/slices/crm/crm.slice';

export default function CrmHeader() {
    const dispatch = useAppDispatch();
    const { events, activeEventId, accountsActiveEventId, activeDomain, searchTerm, activeFolder } = useAppSelector((state) => state.crm);

    const isAccountsTab = activeFolder === 'Accounts';
    const currentActiveEventId = isAccountsTab ? accountsActiveEventId : activeEventId;

    const activeEvent = events.find(e => e.id === activeEventId); // Use mailbox event for domains
    // Domains for the currently selected conference
    const currentEventDomains = activeEvent?.domains || [];

    const handleSync = () => {
        if (activeEventId) {
            dispatch(fetchThreadsThunk(activeEventId));
        }
    };

    const handleEventChange = (eventId: number) => {
        if (isAccountsTab) {
            dispatch(setAccountsActiveEvent(eventId));
        } else {
            dispatch(setActiveEvent(eventId));
        }
    };

    const handleSearchClick = () => {
        dispatch(triggerSearch());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            dispatch(triggerSearch());
        }
    };

    const handleDomainChange = (domain: string) => {
        dispatch(setActiveDomain(domain === 'all' ? null : domain));
    };

    return (
        <div className="flex flex-nowrap items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30">
            {/* Mobile Toggle */}
            <button
                onClick={() => dispatch(toggleSidebar())}
                className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600 dark:text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            {/* Edition Dropdown */}
            <div className="min-w-[250px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Conference Edition</label>
                <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentActiveEventId || ''}
                    onChange={(e) => handleEventChange(Number(e.target.value))}
                >
                    <option value="">{isAccountsTab ? 'All Conferences' : 'Select Conference'}</option>
                    {events.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                </select>
            </div>
            {/* Email Account Selector */}
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Email Account</label>
                <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={activeDomain || 'all'}
                    onChange={(e) => handleDomainChange(e.target.value)}
                >
                    <option value="all">All Accounts</option>
                    {currentEventDomains.map((domain, idx) => (
                        <option key={idx} value={domain}>
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
                        value={searchTerm}
                        onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                        onKeyDown={handleKeyDown}
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Search Button */}
            <button 
                onClick={handleSearchClick}
                className="h-10 px-6 mt-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
                Search Email
            </button>


        </div>
    );
}
