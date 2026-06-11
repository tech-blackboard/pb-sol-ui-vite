import { useState, useEffect, useRef } from 'react'
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react'
import AlertBanner from '../../../components/AlertBanner'
import { useAppDispatch } from '../../../store/hooks'
import { createRegistrationThunk, updateRegistrationThunk } from '../../../store/slices/registrations/registrations.thunks'

import { listWebsites, type SourceWebsite } from '../../../services/sourcedb'
import toast from 'react-hot-toast'
import type { RegistrationRecord } from '../../abstracts/types'
import type { RegistrationItem } from '../../../services/registrations'

interface RegistrationFormProps {
    websiteId?: number
    onClose: () => void
    onSuccess?: () => void
    editData?: RegistrationItem | null
}

const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
    'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
    'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
    'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
    'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
    'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
    'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
    'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
    'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
    'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
    'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
    'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
    'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
    'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

const REGISTRATION_FEES: Record<string, number> = {
    'Oral Presenter (In-Person)': 699,
    'Oral Presenter (Virtual)': 399,
    'Poster Presenter (In-Person)': 599,
    'Poster Presenter (Virtual)': 399,
    'Listener (In-Person)': 799,
    'Listener (Virtual)': 499,
    'Exhibitor/Sponsor (In-Person)': 2999,
    'Exhibitor/Sponsor (Virtual)': 1999,
    'Others': 699
}

const PRESENTATION_INDICES: Record<string, number> = {
    'Oral Presenter (In-Person)': 1,
    'Oral Presenter (Virtual)': 2,
    'Poster Presenter (In-Person)': 3,
    'Poster Presenter (Virtual)': 4,
    'Listener (In-Person)': 5,
    'Listener (Virtual)': 6,
    'Exhibitor/Sponsor (In-Person)': 7,
    'Exhibitor/Sponsor (Virtual)': 8,
    'Others': 9
}

const PRESENTATION_OPTIONS = Object.keys(REGISTRATION_FEES)

// Helper to parse stored presentation format back to display name
// Stored format: "regtype_1_X-PresentationName" -> "PresentationName"
function parsePresentationFromStored(stored: string): string {
    if (!stored) return 'Oral Presenter (In-Person)'
    const dashIndex = stored.indexOf('-')
    if (dashIndex !== -1) {
        const name = stored.substring(dashIndex + 1)
        if (REGISTRATION_FEES[name] !== undefined) return name
    }
    // If the stored value is already a clean presentation name
    if (REGISTRATION_FEES[stored] !== undefined) return stored
    return 'Oral Presenter (In-Person)'
}

const CAPTIONS = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']

const OCCUPANCY_OPTIONS = [
    'Single Occupancy',
    'Double Occupancy',
    'Triple Occupancy',
]

// Helper to parse date string (like MM/DD/YYYY) for input[type=date]
function formatDateForInput(dateStr?: string): string {
    if (!dateStr) return '';
    // If it already starts with YYYY-MM-DD, return that part
    const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    // The CRM uses MM/DD/YYYY or MM-DD-YYYY format
    const mmddyyyyMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (mmddyyyyMatch) {
        const month = mmddyyyyMatch[1].padStart(2, '0');
        const day = mmddyyyyMatch[2].padStart(2, '0');
        const year = mmddyyyyMatch[3];
        return `${year}-${month}-${day}`;
    }

    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            // Check if it's an ISO timestamp
            if (dateStr.includes('T')) return dateStr.split('T')[0];
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch {
        // ignore
    }
    return dateStr;
}

export default function RegistrationForm({ websiteId, onClose, onSuccess, editData }: RegistrationFormProps) {
    const isEditMode = !!editData
    const dispatch = useAppDispatch()
    const formRef = useRef<HTMLFormElement>(null)
    const [submitting, setSubmitting] = useState(false)
    const [websites, setWebsites] = useState<SourceWebsite[]>([])
    const [webLoading, setWebLoading] = useState(false)

    const getInitialFormData = () => {
        if (editData) {
            const parsedPresentation = parsePresentationFromStored(editData.presentation)
            const hasAccommodation = editData.accomm && Number(editData.accomm) > 0
            return {
                caption: '',
                name: editData.name || '',
                email: editData.email || '',
                aemail: editData.aemail || '',
                phone: editData.phone || '',
                wphone: editData.wphone || '',
                institution: editData.institution || '',
                country: editData.country || '',
                presentation: parsedPresentation,
                website_id: editData.website_id || editData.website?.id || websiteId || undefined,
                participants: editData.participants || '1',
                reg_price: editData.regtype || String(REGISTRATION_FEES[parsedPresentation] || 699),
                accomm: hasAccommodation ? 'Yes' : 'No',
                checkin: formatDateForInput(editData.checkin),
                checkout: formatDateForInput(editData.checkout),
                nights: editData.nights || '0',
                accmvalue: hasAccommodation ? (editData.accmvalue || '') : '',
                acmpng: String(editData.acmpng ?? '0'),
                acc_price: hasAccommodation ? String(editData.accomm || '0') : '0',
                tot_price: editData.tot_price || '0',
                transaction_id: editData.transaction_id || '',
                status_id: editData.status_id || 1,
                regtype: editData.regtype || String(REGISTRATION_FEES[parsedPresentation] || 699),
            }
        }
        return {
            caption: '',
            name: '',
            email: '',
            aemail: '',
            phone: '',
            wphone: '',
            institution: '',
            country: '',
            presentation: 'Oral Presenter (In-Person)',
            website_id: websiteId || undefined,
            participants: '1',
            reg_price: String(REGISTRATION_FEES['Oral Presenter (In-Person)']),
            accomm: 'No',
            checkin: '',
            checkout: '',
            nights: '0',
            accmvalue: '',
            acmpng: '0',
            acc_price: '0',
            tot_price: '0',
            transaction_id: '',
            status_id: 1,
            regtype: String(REGISTRATION_FEES['Oral Presenter (In-Person)']),
        }
    }

    const [formData, setFormData] = useState(getInitialFormData)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    setWebLoading(true)
                    const ws = await listWebsites()
                    if (!mounted) return
                    setWebsites(ws)
                } catch (err) {
                    console.error('Failed to load websites:', err)
                    toast.error('Failed to load website options')
                } finally {
                    setWebLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [])

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [accommodationErrors, setAccommodationErrors] = useState<{
        checkin?: string
        checkout?: string
        nights?: string
    }>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Derived values (Calculations during render)
    const currentNights = (() => {
        if (formData.checkin && formData.checkout) {
            const start = new Date(formData.checkin)
            const end = new Date(formData.checkout)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
        return 0
    })()

    const regPrice = Number(formData.reg_price) || 0
    const participants = Number(formData.participants) || 1
    const accPrice = Number(formData.acc_price) || 0

    const totalRegistrationValue = regPrice * participants
    const totalAccommodationValue = accPrice * currentNights

    const subtotal = totalRegistrationValue + totalAccommodationValue
    const internetHandlingFees = Math.round(subtotal * 0.048)
    const totalPrice = subtotal + internetHandlingFees

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value }

            // Prevent negative values for participants
            if (field === 'participants') {
                const num = parseInt(String(value))
                if (num < 1) newData.participants = '1'
            }

            // Auto-update regtype when presentation changes
            if (field === 'presentation' && typeof value === 'string' && REGISTRATION_FEES[value]) {
                const fee = String(REGISTRATION_FEES[value])
                newData.regtype = fee
                newData.reg_price = fee
            }

            // Clear accommodation fields when disabling
            if (field === 'accomm' && value === 'No') {
                newData.accmvalue = ''
                newData.acc_price = '0'
                newData.checkin = ''
                newData.checkout = ''
                setAccommodationErrors({})
            }

            return newData
        })
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }))
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        const newAccErrors: typeof accommodationErrors = {}

        if (!isEditMode && !formData.caption) newErrors.caption = 'Caption is required'
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        if (!formData.country) newErrors.country = 'Country is required'
        if (!formData.institution.trim()) newErrors.institution = 'Institution is required'
        if (!formData.presentation) newErrors.presentation = 'Presentation is required'
        if (!isEditMode && !formData.website_id) newErrors.website_id = 'Website is required'
        if (formData.reg_price === '' || Number(formData.reg_price) < 0) newErrors.reg_price = 'Registration price is required'
        if (!formData.participants || Number(formData.participants) < 1) newErrors.participants = 'Number of participants is required'

        if (formData.accomm === 'Yes') {
            if (!formData.accmvalue) newErrors.accmvalue = 'Occupancy type is required'

            if (formData.accmvalue) {
                if (!formData.checkin) newAccErrors.checkin = 'Check-in date is required'
                if (!formData.checkout) newAccErrors.checkout = 'Check-out date is required'
                else if (formData.checkin && formData.checkout && new Date(formData.checkout) <= new Date(formData.checkin)) {
                    newAccErrors.checkout = 'Check-out must be after check-in date'
                }
                if (currentNights <= 0) {
                    newAccErrors.nights = 'Number of nights must be greater than 0'
                }
                if (accPrice <= 0) {
                    newErrors.acc_price = 'Accommodation fee is required'
                }
            }
        }

        setErrors(newErrors)
        setAccommodationErrors(newAccErrors)
        return Object.keys(newErrors).length === 0 && Object.keys(newAccErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) {
            toast.error('Please fill the missing fields')
            formRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setSubmitting(true)
        setSubmitError(null)
        try {
            const payload: RegistrationRecord = {
                ...formData,
                website_id: Number(formData.website_id),
                user_id: 1, // Assuming admin/logged-in user id
                status_id: formData.status_id || 1,
                status_flag: 1,
                nights: String(currentNights),
                tot_price: String(totalPrice),
                reg_price: String(formData.reg_price),
                presentation: `regtype_1_${PRESENTATION_INDICES[formData.presentation]}-${formData.presentation}`,

                // Mappings requested to fix 500 error
                accomm: formData.accomm === 'Yes' ? String(accPrice) : '0', // Accommodation Price
                accmvalue: formData.accomm === 'Yes' ? String(totalAccommodationValue) : '0', // Total Accommodation Value
                regtype: String(REGISTRATION_FEES[formData.presentation]), // Based on selected presentation

                // Force numeric 0 for legacy accommodation fields as requested
                acc_price: "",
                acmpng: 0,
                accpng: 0,
                transaction_id: ""
            }

            let result;
            if (isEditMode && editData) {
                result = await dispatch(updateRegistrationThunk({ id: editData.id, data: payload }))
                if (updateRegistrationThunk.fulfilled.match(result)) {
                    toast.success('Registration updated successfully')
                    onSuccess?.()
                    onClose()
                } else {
                    const errorMsg = (result.payload as string) || 'Failed to update registration';
                    setSubmitError(errorMsg);
                    toast.error(errorMsg);
                    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }
            } else {
                result = await dispatch(createRegistrationThunk(payload))
                if (createRegistrationThunk.fulfilled.match(result)) {
                    toast.success('Registration created successfully')
                    onSuccess?.()
                    onClose()
                } else {
                    const errorMsg = (result.payload as string) || 'Failed to create registration';
                    setSubmitError(errorMsg);
                    toast.error(errorMsg);
                    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }
            }
        } catch (err) {
            console.log("Error from registration form: ", err)
            toast.error('An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 flex flex-col max-h-[90vh] border-2 ${Object.keys(errors).length > 0 || Object.keys(accommodationErrors).length > 0 || !!submitError ? 'border-red-500' : 'border-transparent'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {isEditMode ? 'Edit Registration' : 'Add New Registration'}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 pointer-events-none" />
                    </button>
                </div>

                {/* Form Body */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
                    {submitError && (
                        <AlertBanner type="error" message={submitError} onClose={() => setSubmitError(null)} className="mb-6" />
                    )}
                    {/* Section 1: Basic Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider text-sm border-b pb-2">
                            <Info className="w-4 h-4" />
                            Personal & Professional Information
                        </div>
                        {isEditMode && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Registration ID</span>
                                    <span className="text-gray-900 dark:text-white font-semibold text-base">{editData?.id}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Website/Conference</span>
                                    <span className="text-gray-900 dark:text-white font-semibold text-base">{editData?.website?.name ?? '—'}</span>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {!isEditMode && (
                            <div>
                                <label htmlFor="caption-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Caption*
                                </label>
                                <select
                                    id="caption-select"
                                    value={formData.caption}
                                    onChange={(e) => handleChange('caption', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.caption
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                                        } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
                                >
                                    <option value="">--Caption*--</option>
                                    {CAPTIONS.map((cap) => (
                                        <option key={cap} value={cap}>
                                            {cap}
                                        </option>
                                    ))}
                                </select>
                                {errors.caption && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.caption}
                                    </p>
                                )}
                            </div>
                            )}
                            <InputField label="Full Name*" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
                            <InputField label="Email*" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
                            <InputField label="Alternate Email" name="aemail" type="email" value={formData.aemail} onChange={handleChange} />
                            <InputField label="Phone*" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                            <InputField label="WhatsApp Number" name="wphone" value={formData.wphone} onChange={handleChange} error={errors.wphone} />
                            <InputField label="Institution/Organization*" name="institution" value={formData.institution} onChange={handleChange} error={errors.institution} />

                            <SelectField label="Country*" name="country" value={formData.country} options={COUNTRIES} onChange={handleChange} error={errors.country} />
                            <SelectField label="Interested In (Presentation)*" name="presentation" value={formData.presentation} options={PRESENTATION_OPTIONS} onChange={handleChange} error={errors.presentation} />
                            {!isEditMode && (
                                <div className="md:col-span-2">
                                    <label htmlFor="website-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Website/Conference*
                                    </label>
                                    <select
                                        id="website-select"
                                        value={formData.website_id || ''}
                                        onChange={(e) => handleChange('website_id', e.target.value)}
                                        disabled={webLoading}
                                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.website_id
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                                            } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <option value="">
                                            {webLoading ? 'Loading websites...' : 'Select Website/Conference*'}
                                        </option>
                                        {websites.map((w) => (
                                            <option key={w.id} value={Number(w.id)}>
                                                {w.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.website_id && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.website_id}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Accommodation */}
                    <div className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Registration Price ($)*" name="reg_price" type="number" value={formData.reg_price} onWheel={(e: React.WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur()} onChange={handleChange} error={errors.reg_price} />
                            <InputField label="Number of Participants" name="participants" type="number" value={formData.participants} onWheel={(e: React.WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur()} onChange={handleChange} error={errors.participants} />
                        </div>

                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider text-sm border-b pb-2">
                            <Info className="w-4 h-4" />
                            Accommodation Details
                        </div>


                        <div className="space-y-4">
                            <label htmlFor="accomm-checkbox" className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    id="accomm-checkbox"
                                    type="checkbox"
                                    checked={formData.accomm === 'Yes'}
                                    onChange={(e) => handleChange('accomm', e.target.checked ? 'Yes' : 'No')}
                                    className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Looking for Accommodation
                                </span>
                            </label>

                            {formData.accomm === 'Yes' && (
                                <>
                                    <div className="space-y-2">
                                        {OCCUPANCY_OPTIONS.map((label) => (
                                            <label key={label} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="occupancy"
                                                    value={label}
                                                    checked={formData.accmvalue === label}
                                                    onChange={() => handleChange('accmvalue', label)}
                                                    className="form-radio text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {label}
                                                </span>
                                            </label>
                                        ))}
                                        {errors.accmvalue && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.accmvalue}
                                            </p>
                                        )}
                                    </div>

                                    {formData.accmvalue && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <InputField label="Check-in Date" name="checkin" type="date" value={formData.checkin} onChange={handleChange} error={accommodationErrors.checkin} />
                                            <InputField label="Check-out Date" name="checkout" type="date" value={formData.checkout} onChange={handleChange} error={accommodationErrors.checkout} />
                                            <InputField label="Nights" name="nights" type="number" value={currentNights} onChange={() => { }} readOnly />
                                            <InputField label="Price per Night ($)" name="acc_price" type="number" value={formData.acc_price} onWheel={(e: React.WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur()} onChange={handleChange} error={errors.acc_price} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Summary Table */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Registration Summary
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Registration Price</td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">${formData.reg_price}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Number of Participants</td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">{formData.participants}</td>
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Total Registration Value</td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">${totalRegistrationValue}</td>
                                    </tr>
                                    {formData.accomm === 'Yes' && (
                                        <>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Accommodation Price / Night</td>
                                                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">${accPrice}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Number of Nights</td>
                                                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">{currentNights}</td>
                                            </tr>
                                            <tr className="bg-gray-50 dark:bg-gray-900/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Total Accommodation Value</td>
                                                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">${totalAccommodationValue}</td>
                                            </tr>
                                        </>
                                    )}
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Internet Handling Fees (4.8%)</td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">${internetHandlingFees}</td>
                                    </tr>
                                    <tr className="bg-purple-50 dark:bg-purple-900/30">
                                        <td className="px-6 py-4 text-base font-bold text-purple-700 dark:text-purple-300">Total Price</td>
                                        <td className="px-6 py-4 text-xl text-right font-bold text-purple-600 dark:text-purple-400">${totalPrice}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer - Moved inside form */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="px-8 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50">
                            {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Registration' : 'Create Registration')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


interface InputFieldProps {
    label?: string
    name: string
    value?: string | number
    onChange: (name: string, value: string) => void
    type?: string
    error?: string
    readOnly?: boolean
    onWheel?: React.WheelEventHandler<HTMLInputElement>
}

export function InputField({ label, name, value, onChange, type = 'text', error, readOnly = false, onWheel }: InputFieldProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                id={name}
                type={type}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                readOnly={readOnly}
                onWheel={onWheel}
                className={`w-full px-4 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

interface SelectFieldProps {
    label?: string
    name: string
    value?: string | number
    options: string[] | { value: string | number; label: string }[]
    onChange: (name: string, value: string) => void
    error?: string
    isLoading?: boolean
}

export function SelectField({ label, name, value, options, onChange, error, isLoading = false }: SelectFieldProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select
                id={name}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none`}>
                <option value="">Select Option</option>
                {
                    options.map((opt) => (
                        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                            {typeof opt === 'string' ? opt : opt.label}
                        </option>
                    ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div >
    )
}
