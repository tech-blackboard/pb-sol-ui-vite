import { useState, useEffect } from 'react'

interface InvoiceData {
  invoiceAmount: number
  description: string
  quantity: number
  price: number
  paymentLink?: string
  interestedIn?: string
  registrationFee?: number
}

interface InvoiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InvoiceData) => void
  abstractName?: string
  isLoading?: boolean
}

const INTERESTED_IN_OPTIONS = [
  'Oral Presenter (In-Person)',
  'Oral Presenter (Virtual)',
  'Poster Presenter (In-Person)',
  'Poster Presenter (Virtual)',
  'Listener (In-Person)',
  'Listener (Virtual)',
  'Exhibitor/Sponsor (In-Person)',
  'Exhibitor/Sponsor (Virtual)',
  'Others'
]

// Fee mapping for each option
const REGISTRATION_FEES: Record<string, number> = {
  'Oral Presenter (In-Person)': 699,
  'Oral Presenter (Virtual)': 399,
  'Poster Presenter (In-Person)': 599,
  'Poster Presenter (Virtual)': 399,
  'Listener (In-Person)': 799,
  'Listener (Virtual)': 199,
  'Exhibitor/Sponsor (In-Person)': 1299,
  'Exhibitor/Sponsor (Virtual)': 999,
  'Others': 399
}


const OCCUPANCY_OPTIONS: Record<string, number> = {
  'Single Occupancy': 245,
  'Double Occupancy': 265,
  'Triple Occupancy': 290,
}

export function InvoiceForm({
  isOpen,
  onClose,
  onSubmit,
  abstractName,
  isLoading = false,
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceData>({
    invoiceAmount: 0,
    description: '',
    quantity: 1,
    price: 0,
    paymentLink: '',
    interestedIn: '',
    registrationFee: 0,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InvoiceData, string>>>({})
  const [registrationFee, setRegistrationFee] = useState(699)
  const [occupancyType, setOccupancyType] = useState<string>('')
  const [checkIn, setCheckIn] = useState<string>('')
  const [checkOut, setCheckOut] = useState<string>('')
  const [numberOfNights, setNumberOfNights] = useState<number>(0)
  const [accommodationFee, setAccommodationFee] = useState<number>(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)


  // Update registration fee and invoice amount when interested option changes
  useEffect(() => {
    if (formData.interestedIn) {
      const newFee = REGISTRATION_FEES[formData.interestedIn] || 699
      setRegistrationFee(newFee)
      setFormData(prev => ({
        ...prev,

        price: newFee
      }))
    }
  }, [formData.interestedIn])

  function handleChange(field: keyof InvoiceData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleInterestedInChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      interestedIn: value
    }))
    if (errors.interestedIn) {
      setErrors((prev) => ({ ...prev, interestedIn: undefined }))
    }
  }

  function handleOccupancyChange(value: string) {
    setOccupancyType(value)
    setAccommodationFee(OCCUPANCY_OPTIONS[value])
    setCheckIn('')
    setCheckOut('')
    setNumberOfNights(0)
  }

  function handleCheckInChange(value: string) {
    setCheckIn(value)
    setCheckOut('')
    setNumberOfNights(0)
  }

  function handleCheckOutChange(value: string) {
    setCheckOut(value)
    if (checkIn && value) {
      const nights = calculateNights(checkIn, value)
      setNumberOfNights(nights)
    }
  }

  function calculateNights(start: string, end: string): number {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, diff)
  }

  function handleregistrationFeeChange(field: keyof InvoiceData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handlePreviewInvoice() {
    setShowPreview(true)
  }

  function handleClosePreview() {
    setShowPreview(false)
  }

  function handleConfirmClick() {
    setShowConfirmModal(true)
  }

  function handleCancelConfirm() {
    setShowConfirmModal(false)
  }

  function handleFinalSubmit() {
    setShowConfirmModal(false)
    onSubmit(formData)
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof InvoiceData, string>> = {}

    if (!formData.invoiceAmount || formData.invoiceAmount <= 0) {
      newErrors.invoiceAmount = 'Invoice amount is required and must be greater than 0'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.quantity !== undefined && formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    if (!formData.interestedIn) {
      newErrors.interestedIn = 'Please select an option'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.MouseEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  function handleClose() {
    setFormData({
      invoiceAmount: 0,
      description: '',
      quantity: 1,
      price: 0,
      paymentLink: '',
      interestedIn: '',
    })
    setErrors({})
    // setRegistrationFee(699)

    onClose()
  }
  const totalRegistrationValue =
    (formData.registrationFee && Number(formData.registrationFee) > 0
      ? Number(formData.registrationFee)
      : registrationFee) * (formData.quantity || 1)

  const totalAccommodationValue = accommodationFee * numberOfNights
  const totalPrice = totalRegistrationValue + totalAccommodationValue


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800">

        {!showPreview ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generate Invoice
                </h2>
                {abstractName && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    For: {abstractName}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-50 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Form Body */}
            <div className="max-h-[75vh] overflow-y-auto px-6 py-4">
              <div className="space-y-6">

                {/* Interested In */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interested in <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.interestedIn}
                    onChange={(e) => handleInterestedInChange(e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.interestedIn
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 disabled:opacity-50`}
                  >
                    <option value="">-- Select Option --</option>
                    {INTERESTED_IN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} (${REGISTRATION_FEES[option]})
                      </option>
                    ))}
                  </select>
                  {errors.interestedIn && (
                    <p className="mt-1 text-sm text-red-600">{errors.interestedIn}</p>
                  )}
                </div>

                {/* Looking for Accommodation */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Looking for Accommodation
                  </label>
                  <div className="space-y-2">
                    {Object.entries(OCCUPANCY_OPTIONS).map(([label, fee]) => (
                      <label key={label} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="occupancy"
                          value={label}
                          checked={occupancyType === label}
                          onChange={() => handleOccupancyChange(label)}
                          className="form-radio text-blue-600"
                        />
                        <span className="text-gray-900 dark:text-white">
                          {label} – ${fee}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Registration Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Registration Fee : <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.registrationFee}
                      onChange={(e) => handleregistrationFeeChange('registrationFee', e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.registrationFee
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 disabled:opacity-50`}
                    />

                    {errors.registrationFee && (
                      <p className="mt-1 text-sm text-red-600">{errors.registrationFee}</p>
                    )}
                  </div>

                  {occupancyType && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Check In
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => handleCheckInChange(e.target.value)}
                          className="w-full mt-1 rounded-md border px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Check Out */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Check Out
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => handleCheckOutChange(e.target.value)}
                          className="w-full mt-1 rounded-md border px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                      </div>


                      {/* Number of Nights */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Number of Nights
                        </label>
                        <input
                          type="number"
                          value={numberOfNights}
                          readOnly
                          className="w-full mt-1 rounded-md border px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration Summary Table */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Registration Summary
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            Registration Price:
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            ${formData.registrationFee && Number(formData.registrationFee) > 0 ? Number(formData.registrationFee) : registrationFee}
                          </td>
                        </tr>

                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            Number of participants:
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            {formData.quantity || 1}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            Total Registration Value
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            ${totalRegistrationValue}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            Accommodation
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            ${accommodationFee}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            Number of Nights:
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            {numberOfNights}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            Total Accommodation Value
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            ${totalAccommodationValue}
                          </td>
                        </tr>
                        <tr className="bg-blue-50 dark:bg-blue-900">
                          <td className="px-6 py-4 text-base font-bold text-gray-900 dark:text-white">
                            Total Registration Price:
                          </td>
                          <td className="px-6 py-4 text-base text-right font-bold text-blue-600 dark:text-blue-400">
                            ${totalPrice}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Amount */}
                <div>
                  <label
                    htmlFor="invoiceAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Invoice Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="invoiceAmount"
                      step="0.01"
                      min="0"
                      value={formData.invoiceAmount || ''}
                      onChange={(e) => handleChange('invoiceAmount', parseFloat(e.target.value) || 0)}
                      disabled={isLoading}
                      className={`block w-full rounded-md border pl-7 pr-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${errors.invoiceAmount
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                        } dark:bg-gray-700 dark:text-white`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.invoiceAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.invoiceAmount}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={isLoading}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${errors.description
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                    placeholder="Enter invoice description..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Quantity */}
                  <div>
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      value={formData.quantity || ''}
                      onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                      disabled={isLoading}
                      className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${errors.quantity
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                        } dark:bg-gray-700 dark:text-white`}
                      placeholder="1"
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Unit Price
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        id="price"
                        step="0.01"
                        min="0"
                        value={formData.price || ''}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className={`block w-full rounded-md border pl-7 pr-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${errors.price
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                          } dark:bg-gray-700 dark:text-white`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>
                </div>

                {/* Payment Link */}
                <div>
                  <label
                    htmlFor="paymentLink"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Payment Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="paymentLink"
                    value={formData.paymentLink || ''}
                    onChange={(e) => handleChange('paymentLink', e.target.value)}
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="https://payment.example.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handlePreviewInvoice}
                  disabled={isLoading}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Preview Invoice
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preview Details</h2>
                  <button
                    onClick={() => handleClosePreview()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 12L6 6" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-auto px-4 py-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Interested In:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.interestedIn || 'Oral Presenter (In-Person)'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Registration Fee:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.registrationFee || '699'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Occupancy Type:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{occupancyType || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Check In:</strong></dt>
                      <dd className="text-blue-700 dark:text-blue-300">{checkIn || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Check Out:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{checkOut || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Number of Nights:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{numberOfNights}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Accommodation Fee:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{accommodationFee}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Invoice Amount:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.invoiceAmount}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Description:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.description ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Quantity:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.quantity ?? '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Unit Price:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.price ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400"><strong>Payment Link:</strong></dt>
                      <dd className="text-gray-900 dark:text-gray-100">{formData.paymentLink || '—'}</dd>
                    </div>
                    <div>
                    </div>
                    {/* Registration Summary */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Registration Summary
                      </h3>
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">

                          <tr>
                            <td className="px-3 py-2">Registration Price</td>
                            <td className="px-3 py-2 text-right">
                              ${formData.registrationFee && formData.registrationFee > 0
                                ? formData.registrationFee
                                : registrationFee}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">Number of participants</td>
                            <td className="px-3 py-2 text-right">{formData.quantity || 1}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">Total Registration Value</td>
                            <td className="px-3 py-2 text-right">${totalRegistrationValue}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">Accommodation</td>
                            <td className="px-3 py-2 text-right">${accommodationFee}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">Number of Nights</td>
                            <td className="px-3 py-2 text-right">{numberOfNights}</td>
                          </tr>

                          <tr>
                            <td className="px-3 py-2">Total Accommodation Value</td>
                            <td className="px-3 py-2 text-right">${totalAccommodationValue}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-bold">Grand Total</td>
                            <td className="px-3 py-2 text-right font-bold">${totalPrice}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </dl>
                </div>

                {/* Preview Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleClosePreview}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Back to Form
                  </button>
                  <button
                    onClick={handleConfirmClick}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Invoice'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}


        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Invoice Submission
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                You're about to send this invoice. Please verify all details including registration, accommodation, and payment information. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}