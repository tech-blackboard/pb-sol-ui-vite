import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { setSelectedThread, toggleThreadSelection, selectAllThreads } from '../../../store/slices/crm/crm.slice';
import { fetchMessagesThunk, deleteDraftThunk, toggleThreadStarThunk, toggleThreadReadThunk, trashThreadsThunk, restoreThreadsThunk, deleteThreadsPermanentlyThunk } from '../../../store/slices/crm/crm.thunks';
import type { Thread, Message } from '../types';
import toast from 'react-hot-toast';
import { getLabelColorClasses } from '../utils/labelUtils';

export default function ThreadTable({ onSelectItem }: { onSelectItem?: (item: Thread | Message) => void }) {
    const dispatch = useAppDispatch();
    const { threads, drafts, loading, selectedThreadId, selectedThreadIds, activeFolder } = useAppSelector((state: RootState) => state.crm);
    const isDraftsView = activeFolder === 'Drafts';
    const isSentView = activeFolder === 'Sent';

    const filteredItems = isDraftsView ? drafts : threads;

    const handleSelectItem = (item: Thread | Message) => {
        if (onSelectItem) {
            onSelectItem(item);
            return;
        }

        if (isDraftsView) {
            const draft = item as Message;
            if (draft.threadId) {
                dispatch(setSelectedThread(draft.threadId));
                dispatch(fetchMessagesThunk(draft.threadId));
            } else {
                dispatch(setSelectedThread(draft.id));
                // Do not fetch messages since there is no thread yet
            }
        } else {
            const thread = item as Thread;
            dispatch(setSelectedThread(thread.id));
            dispatch(fetchMessagesThunk(thread.id));
        }
    };

    const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Move this draft to Trash?')) {
            try {
                await dispatch(deleteDraftThunk(id)).unwrap();
                toast.success('Draft moved to Trash');
            } catch (err: unknown) {
                toast.error(err as string);
            }
        }
    };

    const handleToggleStar = (e: React.MouseEvent, threadId: string, isStarred: boolean) => {
        e.stopPropagation();
        dispatch(toggleThreadStarThunk({ threadId, isStarred: !isStarred }));
    };

    const handleToggleRead = async (e: React.MouseEvent, threadId: string, isRead: boolean) => {
        e.stopPropagation();
        try {
            await dispatch(toggleThreadReadThunk({ threadId, isRead: !isRead })).unwrap();
            toast.success(`Conversation marked as ${isRead ? 'unread' : 'read'}`);
        } catch (err: unknown) {
            toast.error(err as string);
        }
    };

    const handleTrashThread = async (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        if (confirm('Move this conversation to Trash?')) {
            try {
                await dispatch(trashThreadsThunk([threadId])).unwrap();
                toast.success('Conversation moved to Trash');
            } catch (err: unknown) {
                toast.error(err as string);
            }
        }
    };

    const handleRestoreThread = async (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        try {
            await dispatch(restoreThreadsThunk([threadId])).unwrap();
            toast.success('Conversation restored');
        } catch (err: unknown) {
            toast.error(err as string);
        }
    };

    const handleDeletePermanently = async (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        if (confirm('Permanently delete this conversation? This cannot be undone.')) {
            try {
                await dispatch(deleteThreadsPermanentlyThunk([threadId])).unwrap();
                toast.success('Conversation permanently deleted');
            } catch (err: unknown) {
                toast.error(err as string);
            }
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const ids = filteredItems.map(item => isDraftsView ? (item as Message).id : (item as Thread).id);
            dispatch(selectAllThreads(ids));
        } else {
            dispatch(selectAllThreads([]));
        }
    };

    const handleToggleSelect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        dispatch(toggleThreadSelection(id));
    };


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading.threads || loading.drafts) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="px-2 py-1 w-8">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                onChange={handleSelectAll}
                                checked={filteredItems.length > 0 && selectedThreadIds.length === filteredItems.length}
                            />
                        </th>
                        <th className="px-2 py-1 w-6"></th>
                        <th className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">{isDraftsView || isSentView ? 'To' : 'From'}</th>
                        <th className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                        <th className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase w-[140px]">{isDraftsView ? 'Last Saved' : 'Received Date'}</th>

                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(filteredItems as Array<Thread | Message>).map((item) => {
                        const itemId = isDraftsView ? (item as Message).id : (item as Thread).id;
                        const threadId = isDraftsView ? (item as Message).threadId : (item as Thread).id;
                        const isRead = isDraftsView ? true : (item as Thread).isRead;

                        return (
                            <tr
                                key={itemId}
                                onClick={() => handleSelectItem(item)}
                                className={`group hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors ${selectedThreadId === threadId ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                                    } ${!isDraftsView && !isRead ? 'font-bold' : ''}`}
                            >
                                <td className="px-2 py-2" onClick={(e) => handleToggleSelect(e, itemId)}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={selectedThreadIds.includes(itemId)}
                                        readOnly
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    {isDraftsView ? (
                                        <button
                                            onClick={(e) => handleDeleteDraft(e, item.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                            title="Move to Trash"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleToggleStar(e, (item as Thread).id, (item as Thread).isStarred)}
                                                className={`p-1.5 rounded-full transition-all duration-200 ${(item as Thread).isStarred ? 'text-yellow-400 bg-yellow-50/50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                title={(item as Thread).isStarred ? 'Unstar' : 'Star'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={(item as Thread).isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => handleToggleRead(e, (item as Thread).id, (item as Thread).isRead)}
                                                className={`p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${!(item as Thread).isRead ? 'text-blue-500 bg-blue-50/50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                title={(item as Thread).isRead ? 'Mark as unread' : 'Mark as read'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                                </svg>
                                            </button>
                                            {activeFolder === 'Trash' ? (
                                                <>
                                                    <button
                                                        onClick={(e) => handleRestoreThread(e, (item as Thread).id)}
                                                        className="p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 text-green-500 hover:bg-green-50"
                                                        title="Restore"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeletePermanently(e, (item as Thread).id)}
                                                        className="p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50"
                                                        title="Delete Permanently"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleTrashThread(e, (item as Thread).id)}
                                                    className="p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                                    title="Move to Trash"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td
                                    className={`px-2 py-2 text-sm max-w-0 ${!isRead ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                    title={isDraftsView ? (item as Message).toEmail || '' : (item as Thread).contact?.email || ''}
                                >
                                    <div className="truncate">
                                        {isDraftsView ? (item as Message).toEmail || 'No recipient' : (item as Thread).contact?.email || 'Unknown'}
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-800 dark:text-gray-200 max-w-0" title={item.subject}>
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        <span className={`truncate block ${!isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                            {item.subject}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${isDraftsView ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : isSentView ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                {isDraftsView ? 'Draft' : isSentView ? 'Sent' : 'Inbox'}
                                            </span>
                                            {item.labels?.map(label => {
                                                const colors = getLabelColorClasses(label);
                                                return (
                                                    <span key={label} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight border ${colors.bg} ${colors.text} ${colors.border}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    <div className="flex flex-col items-end gap-0.5">
                                        {!isDraftsView && (item as Thread).importance === 'high' && (
                                            <span className="text-[#C8102E] font-black text-sm leading-none" title="High Importance">!</span>
                                        )}
                                        {!isDraftsView && (item as Thread).importance === 'low' && (
                                            <span className="text-blue-500 font-bold text-xs leading-none" title="Low Importance">↓</span>
                                        )}
                                        <span className={`text-[11px] text-right ${!isRead ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                            {formatDate(isDraftsView ? (item as Message).updatedAt || item.createdAt : (item as Thread).lastMessageAt)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-400 text-sm">
                                {isDraftsView ? 'No drafts found.' : isSentView ? 'No sent messages found.' : activeFolder === 'Starred' ? 'No starred threads found.' : 'No threads found for this mailbox.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
