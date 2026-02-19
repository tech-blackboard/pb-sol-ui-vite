import { useState, useEffect, useRef } from 'react'
import { X, AlertCircle } from 'lucide-react'
import AlertBanner from '../../../components/AlertBanner'
import { useAppDispatch } from '../../../store/hooks'
import { createBrochureThunk } from '../../../store/slices/brochures/brochures.slice'
import { listWebsites, type SourceWebsite } from '../../../services/sourcedb'
import toast from 'react-hot-toast'

interface BrochureFormProps {
    websiteId?: number
    onClose: () => void
    onSuccess?: () => void
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
    'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
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

export default function BrochureForm({ websiteId, onClose, onSuccess }: BrochureFormProps) {
    const dispatch = useAppDispatch()
    const formRef = useRef<HTMLFormElement>(null)
    const [submitting, setSubmitting] = useState(false)
    const [websites, setWebsites] = useState<SourceWebsite[]>([])
    const [webLoading, setWebLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        website_id: websiteId || undefined,
        message: '',
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

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
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

        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        if (!formData.country) newErrors.country = 'Country is required'
        if (!formData.website_id) newErrors.website_id = 'Website is required'
        if (!formData.message.trim()) newErrors.message = 'Message is required'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) {
            toast.error('Please fill all required fields correctly')
            formRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setSubmitting(true)
        setSubmitError(null)
        try {
            const payload = {
                ...formData,
                website_id: Number(formData.website_id),
            }
            const result = await dispatch(createBrochureThunk(payload))
            if (createBrochureThunk.fulfilled.match(result)) {
                toast.success('Brochure request submitted successfully')
                onSuccess?.()
                onClose()
            } else {
                const errorMsg = (result.payload as string) || 'Failed to submit brochure request';
                setSubmitError(errorMsg);
                toast.error(errorMsg);
                formRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch {
            toast.error('An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh] border-2 ${Object.keys(errors).length > 0 || !!submitError ? 'border-red-500' : 'border-transparent'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase">
                        Request Brochure
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    {submitError && (
                        <AlertBanner type="error" message={submitError} onClose={() => setSubmitError(null)} className="mb-4" />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
                        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
                        <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                        <SelectField label="Select Country" name="country" value={formData.country} options={COUNTRIES} onChange={handleChange} error={errors.country} />
                    </div>

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

                    <div>
                        <label htmlFor="message-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                        <textarea
                            id="message-input"
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            rows={4}
                            className={`w-full px-4 py-2.5 rounded-lg border ${errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none`}
                            placeholder="Message"
                        />
                        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-2 rounded-lg bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Now'}
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
    onChange: (field: string, value: string | number) => void
    type?: string
    error?: string
    readOnly?: boolean
}

function InputField({ label, name, value, onChange, type = 'text', error, readOnly = false }: InputFieldProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
                id={name}
                type={type}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                readOnly={readOnly}
                placeholder={label}
                className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

interface SelectFieldProps {
    label?: string
    name: string
    value?: string | number
    options?: (string | { value: string | number; label: string })[]
    onChange: (field: string, value: string | number) => void
    error?: string
    isLoading?: boolean
}

function SelectField({ label, name, value, options, onChange, error, isLoading = false }: SelectFieldProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select
                id={name}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none`}>
                <option value="">{label}</option>
                {options?.map((opt) => (
                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                        {typeof opt === 'string' ? opt : opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}
