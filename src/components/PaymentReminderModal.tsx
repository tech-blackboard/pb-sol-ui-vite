import { useState } from 'react'
import type { PaymentReminderData } from '../services/abstracts'
import toast from 'react-hot-toast'

interface PaymentReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (paymentReminderData: PaymentReminderData) => void
  isLoading?: boolean
}

export function PaymentReminderModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: PaymentReminderModalProps) {
  const DEFAULT_PAYMENT_LINK = import.meta.env.VITE_DEFAULT_PAYMENT_LINK || ''

  const [formData, setFormData] = useState<PaymentReminderData>({
    paymentLink: DEFAULT_PAYMENT_LINK,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentReminderData, string>>>({})

  if (!isOpen) return null

  /* -------------------- Handlers -------------------- */
  function handleChange(field: keyof PaymentReminderData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof PaymentReminderData, string>> = {}

    if (!formData.paymentLink) {
      newErrors.paymentLink = 'Payment link is required'
    } else if (!/^https?:\/\//i.test(formData.paymentLink)) {
      newErrors.paymentLink = 'Enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSend() {
    if (!validate()) {
      toast.error('Please fix errors before submitting')
      return
    }
    onSubmit(formData)
    console.log('formData in handleSend --->', formData)
  }

  function handleClose() {
    setFormData({
      paymentLink: DEFAULT_PAYMENT_LINK,
    })
    setErrors({})
    onClose()
  }
  /* -------------------- UI -------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-xl rounded-lg bg-white shadow-xl dark:bg-gray-800">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Send Payment Reminder
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Link <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.paymentLink}
            onChange={(e) => handleChange('paymentLink', e.target.value)}
            disabled={isLoading}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.paymentLink
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
            placeholder="https://payment.example.com/..."
          />
          {errors.paymentLink && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentLink}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}
