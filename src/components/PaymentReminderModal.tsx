import { useState, useEffect } from 'react'
import { getAbstractById, type PaymentReminderData } from '../services/abstracts'
import toast from 'react-hot-toast'

interface PaymentReminderModalProps {
  isOpen: boolean
  abstractId: string | number
  onClose: () => void
  onSubmit: (paymentReminderData: PaymentReminderData) => void
  isLoading?: boolean
}

export function PaymentReminderModal({
  isOpen,
  abstractId,
  onClose,
  onSubmit,
  isLoading = false,
}: PaymentReminderModalProps) {
  const DEFAULT_PAYMENT_LINK = import.meta.env.VITE_DEFAULT_PAYMENT_LINK || ''

  const [existingPaymentLink, setExistingPaymentLink] = useState<string | null>(null)
  const [formData, setFormData] = useState<PaymentReminderData>({
    paymentLink: DEFAULT_PAYMENT_LINK,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentReminderData, string>>>({})
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || !abstractId) {
      setIsDataLoaded(false)
      return
    }

    async function fetchPaymentLink() {
      try {
        setIsDataLoaded(false)
        const res = await getAbstractById(abstractId)
        console.log('res paymetnlibk bfr if ', res.paymentLink)
        if (res.paymentLink) {
          console.log('res paymetnlibk', res.paymentLink)
          setExistingPaymentLink(res.paymentLink)
        } else {
          setExistingPaymentLink(null)
        }
        setIsDataLoaded(true)
      } catch (err) {
        console.error(err)
        setIsDataLoaded(true)
      }
    }

    fetchPaymentLink()
  }, [isOpen, abstractId])

  /* -------------------- Handlers -------------------- */
  function handleChange(field: keyof PaymentReminderData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleSend() {
    const payload: PaymentReminderData = {
      paymentLink: existingPaymentLink ?? formData.paymentLink,
    }

    onSubmit(payload)
  }

  function handleClose() {
    setFormData({
      paymentLink: DEFAULT_PAYMENT_LINK,
    })
    setErrors({})
    setExistingPaymentLink(null)
    setIsDataLoaded(false)
    onClose()
  }

  function handleCopyLink() {
    if (!existingPaymentLink) return

    navigator.clipboard.writeText(existingPaymentLink)
    toast.success('Payment link copied')
  }

  if (!isOpen) return null

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
          {!isDataLoaded ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : existingPaymentLink ? (
            <>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700 mb-2">
                  ✅ Payment link already available
                </p>
                
                  <a href={existingPaymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all rounded-md bg-white px-3 py-2 text-sm text-blue-600 underline hover:bg-blue-50 transition"
                >
                  {existingPaymentLink}
                </a>
                <button
                  onClick={handleCopyLink}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                >
                  Copy link
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  You can send a reminder using this link.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-red-700 mb-2">
                Payment link is not available, please send payment reminder
              </p>
              <input
                type="url"
                value={formData.paymentLink}
                onChange={(e) => handleChange('paymentLink', e.target.value)}
                disabled={isLoading}
                className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.paymentLink
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white`}
                placeholder="https://payment.example.com/..."
              />
              {errors.paymentLink && (
                <p className="text-sm text-red-500 mt-1">{errors.paymentLink}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {!existingPaymentLink && isDataLoaded && (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={isLoading || !isDataLoaded}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}