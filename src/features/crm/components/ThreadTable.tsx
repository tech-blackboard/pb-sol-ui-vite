import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedThread } from '../../../store/slices/crm/crm.slice';
import { fetchMessagesThunk, deleteDraftThunk } from '../../../store/slices/crm/crm.thunks';
import toast from 'react-hot-toast';

export default function ThreadTable() {
    const dispatch = useAppDispatch();
    const { threads, drafts, loading, selectedThreadId, activeDomain, activeFolder } = useAppSelector((state) => state.crm);

    const isDraftsView = activeFolder === 'Drafts';

    // Filter by activeDomain if set
    const items = isDraftsView ? drafts : threads;
    const filteredItems = activeDomain
        ? items.filter((t: any) => t.domain === activeDomain || (isDraftsView && t.fromEmail === activeDomain))
        : items;

    const handleSelectItem = (item: any) => {
        if (isDraftsView) {
            if (item.threadId) {
                dispatch(setSelectedThread(item.threadId));
                dispatch(fetchMessagesThunk(item.threadId));
            } else {
                toast.success('Opening draft...');
                // In a real app, this might open a compose modal
            }
        } else {
            dispatch(setSelectedThread(item.id));
            dispatch(fetchMessagesThunk(item.id));
        }
    };

    const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this draft?')) {
            dispatch(deleteDraftThunk(id));
            toast.success('Draft deleted');
        }
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
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="p-3 w-10">
                            <input type="checkbox" className="rounded border-gray-300" />
                        </th>
                        <th className="p-3 w-8"></th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">{isDraftsView ? 'To' : 'From'}</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Tags</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">{isDraftsView ? 'Last Saved' : 'Received Date'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredItems.map((item: any) => (
                        <tr
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors ${selectedThreadId === (isDraftsView ? item.threadId : item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                } ${!isDraftsView && !item.isRead ? 'font-bold' : ''}`}
                        >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" className="rounded border-gray-300" />
                            </td>
                            <td className="p-3">
                                {isDraftsView ? (
                                    <button 
                                        onClick={(e) => handleDeleteDraft(e, item.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        title="Delete Draft"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.247 2.118H8.086a2.25 2.25 0 01-2.247-2.118L6.822 5.792m11.142 0c.243-.077.48-.154.718-.23a2.25 2.25 0 00-1.25-4.25H8.37A2.25 2.25 0 007.12 1.54c.238.077.475.154.718.23m11.142 0l-1.815 3.085a11.95 11.95 0 01-5.045 4.519 11.95 11.95 0 01-5.045-4.519L4.088 5.792" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button className="text-gray-300 hover:text-yellow-400">
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                )}
                            </td>
                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                                {isDraftsView ? item.toEmail || 'No recipient' : item.contact?.email || 'Unknown'}
                            </td>
                            <td className="p-3 text-sm text-gray-800 dark:text-gray-200">
                                {isDraftsView && <span className="text-red-500 font-bold mr-2">Draft</span>}
                                {item.subject}
                            </td>
                            <td className="p-3">
                                <div className="flex gap-1 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDraftsView ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>
                                        {isDraftsView ? 'Draft' : 'Inbox'}
                                    </span>
                                </div>
                            </td>
                            <td className="p-3 text-xs text-gray-500 text-right whitespace-nowrap">
                                {formatDate(isDraftsView ? item.updatedAt || item.createdAt : item.lastMessageAt)}
                            </td>
                        </tr>
                    ))}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-400 text-sm">
                                {isDraftsView ? 'No drafts found.' : 'No threads found for this mailbox.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
