import { formatDate } from '../../../utils/utils'
import type { ContactItem } from '../../../services/contacts'

interface Props {
    item: ContactItem | null
    onClose: () => void
}

export default function ContactDetailsModal({ item, onClose }: Props) {
    if (!item) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Contact Request Details</h2>
                    <button
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <Field label="Request ID" value={item.id} />
                        <Field label="Website Name" value={item.website?.name ?? '—'} />
                        <Field label="Full Name" value={item.name} />
                        <Field
                            label="Email"
                            value={
                                <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">
                                    {item.email}
                                </a>
                            }
                        />
                        <Field label="Phone" value={item.phone ?? '—'} />
                        <Field label="Country" value={item.country ? item.country : '—'} />
                        <Field label="Submitted On" value={item.now ? formatDate(item.now) : '—'} />
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Message</h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[120px]" >
                            {item.message || 'No additional message provided.'}
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700  text-[13px] hover:bg-gray-50 font-semibold transition-all shadow-sm active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col border-b border-gray-50 pb-2">
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">{label}</dt>
            <dd className="text-sm text-gray-900 font-medium">{value}</dd>
        </div>
    )
}
