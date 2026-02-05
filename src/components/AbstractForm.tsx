import { useState, useEffect, type FormEvent } from 'react'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import {
  createAbstractWithFormDataFileUpload,
  // createAbstractWithFormDataFileUpload 
} from '../services/abstracts'
import { listWebsites, type SourceWebsite } from '../services/sourcedb'
import toast from 'react-hot-toast';
import AlertBanner from './AlertBanner';

interface AbstractFormProps {
  websiteId?: number
  onClose: () => void
  onSuccess?: () => void
}


// All countries A-Z
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

const CAPTIONS = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']

const INTERESTED_IN_OPTIONS = [
  'Oral Presentation(In-Person)',
  'Oral Presentation(Virtual)',
  'Poster Presentation(In-Person)',
  'Poster Presentation(Virtual)',
  'Delegate/ Listener (In-Person)',
  'Delegate/ Listener (Virtual)',
  'Exhibitor/Sponsor (In-Person)',
  'Exhibitor/Sponsor (Virtual)',
  'Others'
]

export default function AbstractForm({ websiteId, onClose, onSuccess }: AbstractFormProps) {
  const [formData, setFormData] = useState({
    caption: '',
    name: '',
    email: '', // ADD THIS
    aemail: '', // ADD THIS (alternate email)
    phone: '',
    whatsapp: '',
    country: '',
    city: '',
    organization: '',
    interestedIn: '',
    title: '',
    message: '',
    captcha: '',
    websiteId: websiteId || undefined,
    file: null as File | null,
  })

  const [captchaCode] = useState(() => Math.random().toString(36).substring(2, 8))
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [websites, setWebsites] = useState<SourceWebsite[]>([])
  const [webLoading, setWebLoading] = useState(false)

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'websiteId' && value ? Number(value) : value
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, file }))
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.caption) newErrors.caption = 'Caption is required'
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required' // ADD THIS
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format' // ADD THIS
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.country) newErrors.country = 'Country is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.organization.trim()) newErrors.organization = 'Organization is required'
    if (!formData.interestedIn) newErrors.interestedIn = 'Please select an option'
    if (!formData.title.trim()) newErrors.title = 'Abstract title is required'
    if (!formData.websiteId) newErrors.websiteId = 'Please select a website'
    if (!formData.file) newErrors.file = 'Please upload a file'
    if (formData.captcha !== captchaCode) newErrors.captcha = 'Captcha does not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Consolidate into a single submission handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Prevent double-submission
    if (submitting) return

    if (!validate()) {
      toast.error('Please fix all errors before submitting')
      return
    }

    setSubmitting(true)

    try {
      const formDataToSend = new FormData()

      formDataToSend.append('name', `${formData.caption} ${formData.name}`)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('aemail', formData.aemail || '')
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('wphone', formData.whatsapp || formData.phone)
      formDataToSend.append('country', formData.country)
      formDataToSend.append('city', formData.city)
      formDataToSend.append('organization', formData.organization)
      formDataToSend.append('intrested', formData.interestedIn)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('message', formData.message || '')
      formDataToSend.append('captcha', formData.captcha)
      formDataToSend.append('status_id', '1')
      formDataToSend.append('is_email_sent', 'false')

      if (formData.websiteId) {
        formDataToSend.append('website_id', String(formData.websiteId))
      }

      if (formData.file) {
        formDataToSend.append('file', formData.file)
      }

      await createAbstractWithFormDataFileUpload(formDataToSend)

      toast.success('Abstract submitted successfully!')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      console.error('Submit error:', err)
      const axiosError = err as {
        response?: {
          status?: number;
          statusText?: string;
          data?: { message?: string; error?: string }
        };
        code?: string;
        message?: string
      }

      let errorMsg = ''
      // Handle common Network Error / Connection Reset issues
      if (axiosError?.code === 'ERR_NETWORK' || axiosError?.message === 'Network Error') {
        errorMsg = 'Server connection error. This often happens if you do not have permission to upload files.'
      } else {
        errorMsg = axiosError?.response?.data?.message
          || axiosError?.response?.data?.error
          || (axiosError?.response?.status === 500 ? 'Internal Server Error.' : '')
          || axiosError?.message
          || 'Failed to submit abstract'
      }
      setBannerError(errorMsg)
      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Submit Abstract
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form id="abstract-form" onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {bannerError && (
            <AlertBanner
              type="error"
              message={bannerError}
              onClose={() => setBannerError(null)}
              className="mb-6"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Caption */}
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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name*
              </label>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email*
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
            {/* Alternate Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alternate Email
              </label>
              <input
                type="email"
                placeholder="alternate@example.com"
                value={formData.aemail}
                onChange={(e) => handleChange('aemail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website/Conference*
              </label>
              <select
                value={formData.websiteId || ''}
                onChange={(e) => handleChange('websiteId', e.target.value)}
                disabled={webLoading}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.websiteId
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
              {errors.websiteId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.websiteId}
                </p>
              )}
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone*
              </label>
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.phone
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                placeholder="WhatsApp Number"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.whatsapp ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.whatsapp}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country*
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.country
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              >
                <option value="">Select Country*</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.country}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City*
              </label>
              <input
                type="text"
                placeholder="Hyderabad"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.city
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.city}
                </p>
              )}
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization*
              </label>
              <input
                type="text"
                placeholder="Organization"
                value={formData.organization}
                onChange={(e) => handleChange('organization', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.organization
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              />
              {errors.organization && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.organization}
                </p>
              )}
            </div>

            {/* Interested In */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interested in*
              </label>
              <select
                value={formData.interestedIn}
                onChange={(e) => handleChange('interestedIn', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.interestedIn
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              >
                <option value="">--Interested in*--</option>
                {INTERESTED_IN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.interestedIn && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.interestedIn}
                </p>
              )}
            </div>
          </div>

          {/* Abstract Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Abstract Title*
            </label>
            <input
              type="text"
              placeholder="Abstract Title*"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload File*
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {formData.file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {formData.file.name}
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              placeholder="Message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Captcha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Captcha Code*
            </label>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg font-mono text-lg font-bold text-purple-700 dark:text-purple-300 select-none">
                {captchaCode}
              </div>
              <input
                type="text"
                placeholder="Enter captcha"
                value={formData.captcha}
                onChange={(e) => handleChange('captcha', e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-lg border ${errors.captcha
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.captcha && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.captcha}
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="abstract-form"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}