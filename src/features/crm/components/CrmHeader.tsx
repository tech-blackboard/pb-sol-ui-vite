import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchThreadsThunk } from '../../../store/slices/crm/crm.thunks';
import {
    setActiveEvent,
    setAccountsActiveEvent,
    setActiveDomain,
    setAccountsActiveDomain,
    clearSelection,
    toggleSidebar,
    toggleSidebarCollapse,
    setSearchTerm,
    setAccountsSearchTerm,
    triggerSearch,
    triggerAccountsSearch,
    setActiveEmailAccountId
} from '../../../store/slices/crm/crm.slice';
import { fetchEmailAccountsThunk } from '../../../store/slices/crm/crm.thunks';
import { selectAuth } from '../../../store/slices/authSlice';
import { useEffect } from 'react';

export default function CrmHeader() {
    const dispatch = useAppDispatch();
    const {
        events,
        activeEventId,
        accountsActiveEventId,
        activeDomain,
        accountsActiveDomain,
        searchTerm,
        accountsSearchTerm,
        activeFolder,
        emailAccounts,
        activeEmailAccountId
    } = useAppSelector((state) => state.crm);
    const { user } = useAppSelector(selectAuth);
    const isAdmin = Boolean(user?.isAdmin);

    const isAccountsTab = activeFolder === 'Accounts';
    const currentActiveEventId = isAccountsTab ? accountsActiveEventId : activeEventId;
    // const currentActiveDomain = isAccountsTab ? accountsActiveDomain : activeDomain;
    const currentSearchTerm = isAccountsTab ? accountsSearchTerm : searchTerm;

    // const activeEvent = events.find(e => e.id === currentActiveEventId);
    // Domains for the currently selected conference
    // const currentEventDomains = activeEvent?.domains || [];

    useEffect(() => {
        const relevantEventId = isAccountsTab ? accountsActiveEventId : activeEventId;
        if (relevantEventId) {
            dispatch(fetchEmailAccountsThunk(relevantEventId));
        }
    }, [activeEventId, accountsActiveEventId, isAccountsTab, dispatch]);

    const handleSync = () => {
        if (activeEventId) {
            dispatch(fetchThreadsThunk({
                eventId: activeEventId,
                search: searchTerm || undefined,
                domain: activeDomain || undefined,
                emailAccountId: activeEmailAccountId || undefined,
                folder: activeFolder
            }));
        }
    };

    const handleEventChange = (eventId: number) => {
        dispatch(clearSelection());
        // Reset email filter to "All Accounts" when conference changes
        if (isAccountsTab) {
            dispatch(setAccountsActiveDomain(null));
            dispatch(setAccountsActiveEvent(eventId));
            dispatch(triggerAccountsSearch());
        } else {
            dispatch(setActiveDomain(null));
            dispatch(setActiveEmailAccountId(null));
            dispatch(setActiveEvent(eventId));
            dispatch(triggerSearch());
        }
    };

    const handleSearchClick = () => {
        if (isAccountsTab) {
            dispatch(triggerAccountsSearch());
        } else {
            dispatch(triggerSearch());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (isAccountsTab) {
                dispatch(triggerAccountsSearch());
            } else {
                dispatch(triggerSearch());
            }
        }
    };

    const handleAccountChange = (value: string) => {
        dispatch(clearSelection());
        const val = value === 'all' ? null : value;

        if (isAccountsTab) {
            const domain = val ? emailAccounts.find(a => a.id === Number(val))?.email || null : null;
            dispatch(setAccountsActiveDomain(domain));
            dispatch(triggerAccountsSearch());
        } else {
            if (value === 'all') {
                dispatch(setActiveDomain(null));
                dispatch(setActiveEmailAccountId(null));
            } else {
                const account = emailAccounts.find(a => a.id === Number(value));
                if (account) {
                    dispatch(setActiveDomain(account.email));
                    dispatch(setActiveEmailAccountId(account.id));
                }
            }
            dispatch(triggerSearch());
        }
    };

    const handleSearchChange = (value: string) => {
        if (isAccountsTab) {
            dispatch(setAccountsSearchTerm(value));
            if (value === '') {
                dispatch(triggerAccountsSearch());
            }
        } else {
            dispatch(setSearchTerm(value));
            if (value === '') {
                dispatch(triggerSearch());
            }
        }
    };

    const currentActiveAccountValue = isAccountsTab
        ? (emailAccounts.find(a => a.email === accountsActiveDomain)?.id || 'all')
        : (activeEmailAccountId || 'all');

    return (
        <div className="flex flex-nowrap items-end gap-2 p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30 overflow-x-auto no-scrollbar">
            {/* Desktop & Mobile Toggle */}
            <div className="mb-1 flex-shrink-0">
                <button
                    onClick={() => {
                        if (window.innerWidth < 768) {
                            dispatch(toggleSidebar());
                        } else {
                            dispatch(toggleSidebarCollapse());
                        }
                    }}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    aria-label="Toggle Sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>

            {/* Edition Dropdown */}
            <div className="flex-1 min-w-[180px] lg:min-w-[220px]">
                <label className="block text-xs font-medium text-gray-500 mb-1 truncate">Conference Edition</label>
                <select
                    className="w-full h-10 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
            {isAdmin && (
                <div className="flex-1 min-w-[180px] lg:min-w-[220px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1 truncate">Email Account</label>
                    <select
                        className="w-full h-10 px-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentActiveAccountValue}
                        onChange={(e) => handleAccountChange(e.target.value)}
                    >
                        <option value="all">All Accounts</option>
                        {emailAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.email}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Sync Button */}
            <div className="flex-shrink-0">
                <button
                    onClick={handleSync}
                    title="Synchronize Emails"
                    className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </button>
            </div>

            {/* Search Input */}
            <div className="flex-[1.5] min-w-[150px]">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Subject or Email ID"
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentSearchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Search Button */}
            <div className="flex-shrink-0">
                <button
                    onClick={handleSearchClick}
                    title="Search Email"
                    className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
