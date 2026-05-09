import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { setActiveFolder, clearSelection } from '../../../store/slices/crm/crm.slice';
import { selectAuth } from '../../../store/slices/authSlice';

export default function CrmSidebar() {
    const dispatch = useAppDispatch();
    const { activeFolder, unreadCount, starredCount, sentCount, draftsCount, trashCount, junkCount, accountsCount, isSidebarOpen, isSidebarCollapsed } = useAppSelector((state: RootState) => state.crm);
    const { user } = useAppSelector(selectAuth);
    const isAdmin = Boolean(user?.isAdmin);

    const folders = [
        { name: 'Inbox' as const, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { name: 'Drafts' as const, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        { name: 'Sent' as const, icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { name: 'Starred' as const, icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
        { name: 'Junk' as const, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { name: 'Trash' as const, icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
        ...(isAdmin ? [{ name: 'Accounts' as const, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }] : []),
    ];

    return (
        <div className={`
            fixed top-0 bottom-0 left-0 z-50 md:relative md:h-full flex-shrink-0 
            border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 
            overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed ? 'w-20 p-2' : 'w-64 p-4'}
        `}>
            <button className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all mb-6 shadow-sm ${isSidebarCollapsed ? 'h-11 w-11 mx-auto' : 'h-11'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                {!isSidebarCollapsed && <span>Compose Mail</span>}
            </button>

            <div className="space-y-4">
                {!isSidebarCollapsed && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Folders</h3>}
                <nav className="space-y-1">
                    {folders.map((folder) => (
                        <button
                            key={folder.name}
                            onClick={() => {
                                dispatch(clearSelection());
                                dispatch(setActiveFolder(folder.name));
                            }}
                            title={isSidebarCollapsed ? folder.name : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${activeFolder === folder.name
                                ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d={folder.icon} />
                            </svg>
                            {!isSidebarCollapsed && <span className="flex-grow text-left">{folder.name}</span>}
                            {!isSidebarCollapsed && folder.name === 'Inbox' && unreadCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Inbox'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                    }`}>
                                    {unreadCount}
                                </span>
                            )}
                            {!isSidebarCollapsed && folder.name === 'Drafts' && draftsCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Drafts'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {draftsCount}
                                </span>
                            )}
                            {!isSidebarCollapsed && folder.name === 'Sent' && sentCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Sent'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {sentCount}
                                </span>
                            )}
                            {!isSidebarCollapsed && folder.name === 'Starred' && starredCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Starred'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                                    }`}>
                                    {starredCount}
                                </span>
                            )}
                            {!isSidebarCollapsed && folder.name === 'Junk' && junkCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Junk'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                                    }`}>
                                    {junkCount}
                                </span>
                            )}
                            {!isSidebarCollapsed && folder.name === 'Trash' && trashCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Trash'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {trashCount}
                                </span>
                            )}
                            {!isSidebarCollapsed && folder.name === 'Accounts' && accountsCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFolder === 'Accounts'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {accountsCount}
                                </span>
                            )}
                            {isSidebarCollapsed && folder.name === 'Inbox' && unreadCount > 0 && (
                                <div className="absolute top-1 right-2 h-2 w-2 bg-blue-600 rounded-full border border-white dark:border-gray-900" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-8 space-y-4">
                {!isSidebarCollapsed && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">System</h3>}
                <nav className="space-y-1">
                    <button
                        title={isSidebarCollapsed ? "Data Migration" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        {!isSidebarCollapsed && <span>Data Migration</span>}
                    </button>
                    <button
                        title={isSidebarCollapsed ? "Black List" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        {!isSidebarCollapsed && <span>Black List</span>}
                    </button>
                </nav>
            </div>
        </div>
    );
}

