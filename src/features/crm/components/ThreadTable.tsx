import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedThread } from '../../../store/slices/crm/crm.slice';
import { fetchMessagesThunk } from '../../../store/slices/crm/crm.thunks';


export default function ThreadTable() {
    const dispatch = useAppDispatch();
    const { threads, loading, selectedThreadId } = useAppSelector((state) => state.crm);

    const handleSelectThread = (threadId: string) => {
        dispatch(setSelectedThread(threadId));
        dispatch(fetchMessagesThunk(threadId));
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

    if (loading.threads) {
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
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">From</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Tags</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Received Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {threads.map((thread) => (
                        <tr
                            key={thread.id}
                            onClick={() => handleSelectThread(thread.id)}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors ${selectedThreadId === thread.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                } ${!thread.isRead ? 'font-bold' : ''}`}
                        >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" className="rounded border-gray-300" />
                            </td>
                            <td className="p-3">
                                <button className="text-gray-300 hover:text-yellow-400">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            </td>
                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                                {thread.contact?.email || 'Unknown'}
                            </td>
                            <td className="p-3 text-sm text-gray-800 dark:text-gray-200">
                                {thread.subject}
                            </td>
                            <td className="p-3">
                                <div className="flex gap-1 flex-wrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-bold uppercase">Inbox</span>
                                    {/* Dynamic tags from thread messages or contact could go here */}
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold uppercase">Normal</span>
                                </div>
                            </td>
                            <td className="p-3 text-xs text-gray-500 text-right whitespace-nowrap">
                                {formatDate(thread.lastMessageAt)}
                            </td>
                        </tr>
                    ))}
                    {threads.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-10 text-center text-gray-400 text-sm">
                                No threads found for this mailbox.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
