import { useState } from 'react'
import type { InvoiceData } from '../services/abstracts'

interface InvoiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InvoiceData) => void
  abstractName?: string
  isLoading?: boolean
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
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InvoiceData, string>>>({})

  function handleChange(field: keyof InvoiceData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
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
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
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
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
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
                  className={`block w-full rounded-md border pl-7 pr-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    errors.invoiceAmount
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
                className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  errors.description
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
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    errors.quantity
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
                    className={`block w-full rounded-md border pl-7 pr-3 py-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      errors.price
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
        </form>

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
          <button
            type="submit"
            onClick={handleSubmit}
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
  )
}

