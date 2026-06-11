import { formatDate } from '../../../utils/utils';
import type { SponsorshipItem } from '../../../services/sponsorships';

interface SponsorshipRowProps {
    item: SponsorshipItem;
    onView: () => void;
}

function SponsorshipRow({ item, onView }: SponsorshipRowProps) {
    return (
        <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-3 py-1">
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={onView}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                        title="Edit"
                        aria-label="Edit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L7.125 19.588l-3.682.409.409-3.682L16.862 3.487z" />
                        </svg>
                    </button>
                </div>
            </td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[20rem]" title={item.website?.name ?? '—'}>{item.website?.name ?? '—'}</td>
            <td className="px-3 py-1 text-gray-900 font-medium truncate max-w-[20rem]" title={item.name}>{item.name}</td>
            <td className="px-3 py-1" title={item.email}>
                <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">{item.email}</a>
            </td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.phone}>{item.phone}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.organization ?? '—'}>{item.organization ?? '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.country}>{item.country}</td>
            <td className="px-3 py-1 text-gray-700 max-w-[14rem] truncate" title={item.message ? item.message : '—'}>{item.message ? item.message : '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[16rem]" title={item.now ? formatDate(item.now) : '—'}>{item.now ? formatDate(item.now) : '—'}</td>

        </tr>
    );
}

interface Props {
    rows: SponsorshipItem[];
    loading: boolean;
    onView: (item: SponsorshipItem) => void;
}

export default function SponsorshipTable({ rows, loading, onView }: Props) {
    return (
        <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
                <table className="min-w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[5rem]">Actions</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[16rem]">Website Name</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[10rem]">Name</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[12rem]">Email</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[8rem]">Phone</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[12rem]">Organization</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[8rem]">Country</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[14rem]">Message</th>
                            <th className="px-3 py-2 text-gray-700 font-semibold min-w-[10rem]">Submitted On</th>
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

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-4 text-left text-gray-400">No records found</td>
                            </tr>
                        )}
                        {!loading && rows.map((row) => (
                            <SponsorshipRow key={row.id} item={row} onView={() => onView(row)} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
