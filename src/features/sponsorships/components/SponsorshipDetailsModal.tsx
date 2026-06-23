import { useState, useEffect } from 'react'
import { formatDate } from '../../../utils/utils'
import type { SponsorshipItem } from '../../../services/sponsorships'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { updateSponsorshipThunk } from '../../../store/slices/sponsorships/sponsorships.slice'
import toast from 'react-hot-toast'

const COUNTRIES = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
    'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
    'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
    'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
    'Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo',
    'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica',
    'Dominican Republic','East Timor','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea',
    'Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
    'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti',
    'Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
    'Jamaica','Japan','Jordan','Capital','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan',
    'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
    'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco',
    'Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua',
    'Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine',
    'Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
    'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
    'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
    'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa',
    'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
    'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tonga','Trinidad and Tobago',
    'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
    'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela',
    'Vietnam','Yemen','Zambia','Zimbabwe',
]


interface Props {
    item: SponsorshipItem | null
    onClose: () => void
    onDelete?: (item: SponsorshipItem) => void
}

export default function SponsorshipDetailsModal({ item, onClose, onDelete }: Props) {
    const dispatch = useAppDispatch()
    const editLoading = useAppSelector((s) => s.sponsorships.editLoading)

    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Partial<SponsorshipItem>>({})

    useEffect(() => {
        if (item && isEditing) {
            setFormData({
                name: item.name || '',
                email: item.email || '',
                phone: item.phone || '',
                organization: item.organization || '',
                country: item.country || '',
                message: item.message || '',
            })
        }
    }, [item, isEditing])

    if (!item) return null

    const handleSave = async () => {
        try {
            const result = await dispatch(updateSponsorshipThunk({ id: item.id!, data: formData }))
            if (updateSponsorshipThunk.fulfilled.match(result)) {
                toast.success('Sponsorship updated successfully')
                setIsEditing(false)
            } else {
                toast.error((result.payload as string) || 'Failed to update sponsorship')
            }
        } catch {
            toast.error('An error occurred while updating')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Sponsorship Inquiry Details</h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                {!item.deletedAt && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        ✎ Edit
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this record?')) {
                                                onDelete(item)
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                        Delete
                                    </button>
                                )}
                            </>
                        )}
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
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 border-b border-gray-100 pb-4 mb-4">
                        <Field label="Inquiry ID" value={item.id} />
                        <Field label="Website Name" value={item.website?.name ?? '—'} />
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <EditField label="Full Name" value={formData.name || ''} onChange={(v) => setFormData({ ...formData, name: v })} />
                            <EditField label="Email" type="email" value={formData.email || ''} onChange={(v) => setFormData({ ...formData, email: v })} />
                            <EditField label="Phone" value={formData.phone || ''} onChange={(v) => setFormData({ ...formData, phone: v })} />
                            <EditField label="Organization" value={formData.organization || ''} onChange={(v) => setFormData({ ...formData, organization: v })} />
                            <SelectField label="Country" value={formData.country || ''} options={COUNTRIES} onChange={(v) => setFormData({ ...formData, country: v })} />
                            <EditField label="Message" value={formData.message || ''} onChange={(v) => setFormData({ ...formData, message: v })} span isTextArea />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
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
                                <Field label="Organization" value={item.organization ?? '—'} />
                                <Field label="Country" value={item.country ?? '—'} />
                                <Field label="Submitted On" value={item.now ? formatDate(item.now) : '—'} />
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Message</h3>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[120px]">
                                    {item.message || 'No additional message provided.'}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={editLoading}
                                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 inline mr-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L7.125 19.588l-3.682.409.409-3.682L16.862 3.487z" />
                                </svg>
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                disabled={editLoading}
                                className="px-4 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-[13px] hover:bg-gray-50 font-semibold transition-all shadow-sm active:scale-95"
                        >
                            Close
                        </button>
                    )}
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

function EditField({
    label, value, onChange, span, isTextArea, type = 'text',
}: {
    label: string
    value: string
    onChange: (val: string) => void
    span?: boolean
    isTextArea?: boolean
    type?: string
}) {
    const id = `sp-edit-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
        <div className={span ? 'sm:col-span-2' : undefined}>
            <label htmlFor={id} className="block text-xs font-semibold text-gray-500 uppercase tracking-tight mb-1">{label}</label>
            {isTextArea ? (
                <textarea
                    id={id}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <input
                    id={id}
                    type={type}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    )
}

function SelectField({
    label, value, options, onChange, span,
}: {
    label: string
    value: string
    options: string[]
    onChange: (val: string) => void
    span?: boolean
}) {
    const id = `sp-edit-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
        <div className={span ? 'sm:col-span-2' : undefined}>
            <label htmlFor={id} className="block text-xs font-semibold text-gray-500 uppercase tracking-tight mb-1">{label}</label>
            <select
                id={id}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select Country</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    )
}

