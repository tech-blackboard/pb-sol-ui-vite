import { formatDate } from '../../../utils/utils'

interface Props {
    item: any | null
    onClose: () => void
}

export default function RegistrationDetailsModal({ item, onClose }: Props) {
    if (!item) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[90vh] rounded-lg bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Registration Details</h2>
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <section className="space-y-6">
                            <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider border-b pb-2">Basic Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <Field label="Registration ID" value={item.id} />
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
                                <Field label="Alt Email" value={item.aemail ?? '—'} />
                                <Field label="Phone" value={item.phone ?? '—'} />
                                <Field label="Work Phone" value={item.wphone ?? '—'} />
                                <Field label="Institution" value={item.institution ?? '—'} />
                                <Field label="Country" value={item.country ?? '—'} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider border-b pb-2">Registration & Dates</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <Field label="Presentation" value={item.presentation ?? '—'} />
                                <Field label="Participants" value={item.participants ?? '—'} />
                                <Field label="Reg Type" value={item.regtype ?? '—'} />
                                <Field label="Submitted On" value={item.now ? formatDate(item.now) : '—'} />
                                <Field
                                    label="Status Flag"
                                    value={
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.status_flag ?? '—'}
                                        </span>
                                    }
                                />

                            </div>
                        </section>

                        <section className="space-y-6 md:col-span-2">
                            <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider border-b pb-2">Accommodation & Payment</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <Field label="Accommodation" value={item.accomm ?? '—'} />
                                <Field label="Check-in" value={item.checkin ?? '—'} />
                                <Field label="Check-out" value={item.checkout ?? '—'} />
                                <Field label="Nights" value={item.nights ?? '—'} />
                                <Field label="Accm Value" value={item.accmvalue ?? '—'} />
                                <Field label="Accompng" value={item.acmpng ?? '—'} />
                                <Field label="Acc Price" value={item.acc_price ? `$${item.acc_price}` : '—'} />
                                <Field label="Total Price" value={item.tot_price ? `$${item.tot_price}` : '—'} />
                                <Field label="TransactionID" value={item.transaction_id ? item.transaction_id : '—'} />
                            </div>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Message / Comments</h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">
                            {item.message || 'No additional message provided.'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline border-b border-gray-50 pb-2 sm:pb-1">
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight sm:w-1/3">{label}</dt>
            <dd className="text-sm text-gray-900 font-medium sm:w-2/3 sm:text-right">{value}</dd>
        </div>
    )
}
