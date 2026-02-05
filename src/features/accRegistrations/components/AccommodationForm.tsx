import { useState, useEffect } from 'react'
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react'
import AlertBanner from '../../../components/AlertBanner'
import { useAppDispatch } from '../../../store/hooks'
import { createAccRegistrationThunk } from '../../../store/slices/accRegistrations/accRegistrations.slice'
import { listWebsites, type SourceWebsite } from '../../../services/sourcedb'
import toast from 'react-hot-toast'
import type { accRegistrationRecord } from '../../abstracts/types'

interface AccommodationFormProps {
    websiteId?: number
    onClose: () => void
    onSuccess?: () => void
}

// const COUNTRIES = [
//     'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
//     'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
//     'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
//     'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
//     'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
//     'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
//     'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
//     'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
//     'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
//     'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
//     'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
//     'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
//     'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
//     'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
//     'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
//     'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
//     'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
//     'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
//     'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
//     'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
//     'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
//     'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
//     'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
//     'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
//     'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
// ]

const CAPTIONS = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']

const OCCUPANCY_OPTIONS = [
    'Single Occupancy',
    'Double Occupancy',
    'Triple Occupancy',
]

export default function AccommodationForm({ websiteId, onClose, onSuccess }: AccommodationFormProps) {
    const dispatch = useAppDispatch()
    const [submitting, setSubmitting] = useState(false)
    const [websites, setWebsites] = useState<SourceWebsite[]>([])
    const [webLoading, setWebLoading] = useState(false)



    const [formData, setFormData] = useState({
        caption: '',
        name: '',
        email: '',
        aemail: '',
        phone: '',
        wphone: '',
        institution: '',
        country: '',
        website_id: websiteId || undefined,
        accomm: '',
        accm: '',
        checkin: '',
        checkout: '',
        acc_pr: '',
        tot_price: '0',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

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


    const currentNights = (() => {
        if (formData.checkin && formData.checkout) {
            const start = new Date(formData.checkin)
            const end = new Date(formData.checkout)
            const diffTime = end.getTime() - start.getTime()
            return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        }
        return 0
    })()

    const accPrice = Number(formData.accomm) || 0
    const totalAccommodationValue = accPrice * currentNights
    const internetHandlingFees = Math.round(totalAccommodationValue * 0.048)
    const totalPrice = totalAccommodationValue + internetHandlingFees

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value }
            return newData
        })
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.caption) newErrors.caption = 'Caption is required'
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        // if (!formData.country) newErrors.country = 'Country is required'
        // if (!formData.institution.trim()) newErrors.institution = 'Institution is required'
        if (!formData.website_id) newErrors.website_id = 'Website is required'
        if (!formData.accomm) newErrors.accomm = 'Accommodation price is required'
        if (!formData.checkin) newErrors.checkin = 'Check-in date is required'
        if (!formData.checkout) newErrors.checkout = 'Check-out date is required'
        else if (formData.checkin && formData.checkout && new Date(formData.checkout) <= new Date(formData.checkin)) {
            newErrors.checkout = 'Check-out must be after check-in date'
        }

        if (accPrice <= 0) {
            newErrors.acc_pr = 'Accommodation price is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) {
            toast.error('Please fill the missing fields correctly')
            return
        }

        setSubmitting(true)
        setSubmitError(null)
        try {
            const payload: accRegistrationRecord = {
                ...formData,
                website_id: Number(formData.website_id),
                user_id: 10,
                status_id: 1,
                status_flag: 1,
                nights: String(currentNights),
                tot_price: String(totalPrice),
                accomm: String(accPrice), // Accommodation Price / Night
                accm: String(totalAccommodationValue), // Total Accommodation Value
                acmpng: '0',
                acc_pr: formData.acc_pr,
                transaction_id: '',
                presentation: '',
                regtype: '',
                participants: '1'
            }
            const result = await dispatch(createAccRegistrationThunk(payload))
            if (createAccRegistrationThunk.fulfilled.match(result)) {
                toast.success('Accommodation Registration created successfully')
                onSuccess?.()
                onClose()
            } else {
                const errorMsg = (result.payload as string) || 'Failed to create registration';
                setSubmitError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (err) {
            toast.error('An error occurred')
            console.log("Error from accommodation form:", err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 flex flex-col max-h-[90vh] border-2 ${Object.keys(errors).length > 0 ? 'border-red-500' : 'border-transparent'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Add New Accommodation
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
                    {submitError && (
                        <AlertBanner type="error" message={submitError} onClose={() => setSubmitError(null)} className="mb-6" />
                    )}
                    {/* Section 1: Basic Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider text-sm border-b pb-2">
                            <Info className="w-4 h-4" />
                            Personal & Professional Information
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Caption*
                                </label>
                                <select
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
                            <InputField label="Full Name*" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
                            <InputField label="Email*" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
                            <InputField label="Alternate Email" name="aemail" type="email" value={formData.aemail} onChange={handleChange} />
                            <InputField label="Phone*" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                            <InputField label="WhatsApp Number" name="wphone" value={formData.wphone} onChange={handleChange} error={errors.wphone} />
                            {/* <InputField label="Institution/Organization*" name="institution" value={formData.institution} onChange={handleChange} error={errors.institution} />

                            <SelectField label="Country*" name="country" value={formData.country} options={COUNTRIES} onChange={handleChange} error={errors.country} /> */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Website/Conference*
                                </label>
                                <select
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
                        </div>
                    </div>

                    {/* Section 2: Accommodation Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider text-sm border-b pb-2">
                            <Info className="w-4 h-4" />
                            Accommodation Details
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Occupancy Type*</label>
                                <div className="flex flex-wrap gap-4">
                                    {OCCUPANCY_OPTIONS.map((label) => (
                                        <label key={label} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="occupancy"
                                                value={label}
                                                checked={formData.accm === label}
                                                onChange={() => handleChange('accm', label)}
                                                className="form-radio text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <InputField label="Check-in Date" name="checkin" type="date" value={formData.checkin} onChange={handleChange} error={errors.checkin} />
                                <InputField label="Check-out Date" name="checkout" type="date" value={formData.checkout} onChange={handleChange} error={errors.checkout} />
                                <InputField label="Nights" name="nights" type="number" value={currentNights} onChange={() => { }} readOnly />
                                <InputField label="Price per Night ($)*" name="accomm" type="number" value={formData.accomm} onWheel={(e: React.WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur()} onChange={handleChange} error={errors.accomm} />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Summary Table */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Accommodation Summary
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
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
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Internet Handling Fees (4.8%)</td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">${internetHandlingFees}</td>
                                    </tr>
                                    <tr className="bg-purple-50 dark:bg-purple-900/30">
                                        <td className="px-6 py-4 text-base font-bold text-purple-700 dark:text-purple-300">Total Accommodation Price</td>
                                        <td className="px-6 py-4 text-xl text-right font-bold text-purple-600 dark:text-purple-400">${totalPrice}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>



                    <div className="flex items-center justify-end gap-4">
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="px-8 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50">
                                {submitting ? 'Adding...' : 'Add Accommodation'}
                            </button>
                        </div>

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

function InputField({ label, name, value, onChange, type = 'text', error, readOnly = false, ...props }: InputFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(name, e.target.value)} readOnly={readOnly} onWheel={props.onWheel}
                className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none`} />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

// function SelectField({ label, name, value, options, onChange, error, isLoading = false }: any) {
//     return (
//         <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
//             <select value={value} onChange={(e) => onChange(name, e.target.value)} disabled={isLoading}
//                 className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none`}>
//                 <option value="">Select Option</option>
//                 {options.map((opt: any) => (
//                     <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
//                         {typeof opt === 'string' ? opt : opt.label}
//                     </option>
//                 ))}
//             </select>
//             {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//         </div>
//     )
// }
