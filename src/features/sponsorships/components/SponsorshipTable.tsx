import { formatDate } from '../../../utils/utils';

interface SponsorshipRowProps {
    item: any;
    onView: () => void;
}

function SponsorshipRow({ item, onView }: SponsorshipRowProps) {
    return (
        <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-gray-700 truncate max-w-[12rem]">{item.website?.name ?? '—'}</td>
            <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{item.name}</td>
            <td className="px-4 py-3">
                <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a>
            </td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.phone}</td>
            <td className="px-4 py-3 text-gray-700">{item.organization ?? '—'}</td>
            <td className="px-4 py-3 text-gray-700">{item.country}</td>
            <td className="px-4 py-3 text-gray-700 min-w-[14rem]">{item.message}</td>
            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.now ? formatDate(item.now) : '—'}</td>
            <td className="px-4 py-3 whitespace-nowrap">
                <button
                    onClick={onView}
                    className="p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                    title="View Details"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </td>
        </tr>
    );
}

interface Props {
    rows: any[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onView: (item: any) => void;
}

export default function SponsorshipTable({ rows, loading, error, onRetry, onView }: Props) {
    return (
        <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
                <table className="min-w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold min-w-[12rem]">Website Name</th>
                            <th className="px-4 py-3 font-semibold min-w-[10rem]">Name</th>
                            <th className="px-4 py-3 font-semibold min-w-[12rem]">Email</th>
                            <th className="px-4 py-3 font-semibold min-w-[8rem]">Phone</th>
                            <th className="px-4 py-3 font-semibold min-w-[12rem]">Organization</th>
                            <th className="px-4 py-3 font-semibold min-w-[8rem]">Country</th>
                            <th className="px-4 py-3 font-semibold min-w-[14rem]">Message</th>
                            <th className="px-4 py-3 font-semibold min-w-[10rem]">Submitted On</th>
                            <th className="px-4 py-3 font-semibold min-w-[5rem]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Loading sponsorship inquiries...</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && error && (
                            <tr>
                                <td colSpan={9} className="px-4 py-10 text-center text-red-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <span>{error}</span>
                                        <button onClick={onRetry} className="text-sm font-medium text-purple-600 hover:text-purple-700">Retry</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && !error && rows.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-4 text-left text-gray-400">No records found</td>
                            </tr>
                        )}
                        {!loading && !error && rows.map((row) => (
                            <SponsorshipRow key={row.id} item={row} onView={() => onView(row)} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
