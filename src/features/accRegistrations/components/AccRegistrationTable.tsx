import { formatDate } from '../../../utils/utils';
import type { AccRegistrationItem } from '../../../services/accRegistrations';

interface AccRegistrationRowProps {
    item: AccRegistrationItem;
    onView: () => void;
    onRestore?: () => void;
    isSelected: boolean;
    hasSelections: boolean;
    onToggleSelect: () => void;
    hideCheckboxes?: boolean;
}

function AccRegistrationRow({ item, onView, onRestore, isSelected, hasSelections, onToggleSelect, hideCheckboxes }: AccRegistrationRowProps) {
    return (
        <tr className="group border-t border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-3 py-1">
                {!hideCheckboxes && (
                    <div className={`flex items-center justify-center transition-opacity ${hasSelections || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelect}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                    </div>
                )}
            </td>
            <td className="px-3 py-1 whitespace-nowrap">
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={onView}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                        title="View Details"
                        aria-label="View Details"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L7.125 19.588l-3.682.409.409-3.682L16.862 3.487z" />
                        </svg>
                    </button>
                    {item.deletedAt && onRestore && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to restore this record?')) {
                                    onRestore();
                                }
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                            title="Restore"
                            aria-label="Restore"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[20rem]" title={item.website?.name ?? '—'}>{item.website?.name ?? '—'}</td>
            <td className="px-3 py-1 text-gray-900 font-medium truncate max-w-[20rem]" title={item.name}>
                <span className="text-gray-500  font-normal">{item.caption}</span>
                {item.name}
            </td>
            <td className="px-3 py-1" title={item.email}>
                <a href={`mailto:${item.email} `} className="text-blue-600 hover:underline">{item.email}</a>
            </td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.aemail ?? '—'}>{item.aemail ?? '—'}</td>
            <td className="px-3 py-1 text-gray-700  truncate max-w-[12rem]" title={item.phone}>{item.phone}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.wphone ?? '—'}>{item.wphone ?? '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.institution ? item.institution : '—'}>{item.institution ? item.institution : '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[16rem]" title={item.country ? item.country : '—'}>{item.country ? item.country : '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.presentation ? item.presentation : '—'}>{item.presentation ? item.presentation : '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[12rem]" title={item.participants ? item.participants : '—'}>{item.participants ? item.participants : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.regtype ? item.regtype : '—'}>{item.regtype ? item.regtype : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.accomm ?? '—'}>{item.accomm ? item.accomm : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.checkin ?? '—'}>{item.checkin ?? '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.checkout ?? '—'}>{item.checkout ?? '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.nights ?? '—'}>{item.nights ?? '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.accm ?? '—'}>{item.accm ? item.accm : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.acmpng ?? '—'}>{item.acmpng ? item.acmpng : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.acc_pr ? `$${item.acc_pr} ` : '—'}>{item.acc_pr ? `$${item.acc_pr} ` : '—'}</td>
            <td className="px-3 py-1 text-gray-700 font-medium" title={item.tot_price ? `$${item.tot_price} ` : '—'}>{item.tot_price ? `$${item.tot_price} ` : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.transaction_id ? item.transaction_id : '—'}>{item.transaction_id ? item.transaction_id : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.status_flag !== undefined ? String(item.status_flag) : '—'}>{item.status_flag ? item.status_flag : '—'}</td>
            <td className="px-3 py-1 text-gray-700" title={item.alt_text ? item.alt_text : '—'}>{item.alt_text ? item.alt_text : '—'}</td>
            <td className="px-3 py-1 text-gray-700 truncate max-w-[16rem]" title={item.now ? formatDate(item.now) : '—'}>{item.now ? formatDate(item.now) : '—'}</td>

        </tr>
    );
}

interface Props {
    rows: AccRegistrationItem[];
    loading: boolean;
    onView: (item: AccRegistrationItem) => void;
    onRestore?: (item: AccRegistrationItem) => void;
    selectedIds?: number[];
    onSelect?: (id: number) => void;
    onSelectAll?: (checked: boolean) => void;
    hideCheckboxes?: boolean;
}

export default function AccRegistrationTable({ rows, loading, onView, onRestore, selectedIds = [], onSelect, onSelectAll, hideCheckboxes = false }: Props) {
    const hasSelections = selectedIds.length > 0;
    const allSelected = rows.length > 0 && selectedIds.length === rows.length;

    return (
        <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
                <table className="min-w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2 w-10">
                                {!hideCheckboxes && (
                                    <div className={`flex items-center justify-center transition-opacity ${hasSelections ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(e) => onSelectAll?.(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </th>
                            <th className="px-3 py-2 font-semibold min-w-[6rem]">Actions</th>
                            <th className="px-3 py-2 font-semibold min-w-[16rem]">Website Name</th>
                            <th className="px-3 py-2 font-semibold min-w-[10rem]">Name</th>
                            <th className="px-3 py-2 font-semibold min-w-[12rem]">Email</th>
                            <th className="px-3 py-2 font-semibold min-w-[12rem]">Aemail</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Phone</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Wphone</th>
                            <th className="px-3 py-2 font-semibold min-w-[12rem]">Institution</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Country</th>
                            <th className="px-3 py-2 font-semibold min-w-[10rem]">Presentation</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Participants</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Regtype</th>
                            <th className="px-3 py-2 font-semibold min-w-[10rem]">Accomm</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Checkin</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Checkout</th>
                            <th className="px-3 py-2 font-semibold min-w-[6rem]">Nights</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Accm</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Acmpng</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Acc_pr</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Tot_price</th>
                            <th className="px-3 py-2 font-semibold min-w-[12rem]">Transaction_id</th>
                            <th className="px-3 py-2 font-semibold min-w-[8rem]">Status_flag</th>
                            <th className="px-3 py-2 font-semibold min-w-[10rem]">Alt_text</th>
                            <th className="px-3 py-2 font-semibold min-w-[10rem]">Submitted On</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={25} className="px-4 py-10 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Loading accommodation registrations...</span>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={25} className="px-4 py-4 text-left text-gray-400">No records found</td>
                            </tr>
                        )}
                        {!loading && rows.map((row) => (
                            <AccRegistrationRow
                                key={row.id}
                                item={row}
                                onView={() => onView(row)}
                                onRestore={onRestore ? () => onRestore(row) : undefined}
                                isSelected={selectedIds.includes(row.id!)}
                                hasSelections={hasSelections}
                                onToggleSelect={() => onSelect?.(row.id!)}
                                hideCheckboxes={hideCheckboxes}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
