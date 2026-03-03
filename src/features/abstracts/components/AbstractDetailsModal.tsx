import { useState, useEffect } from 'react'
import type { AbstractItem } from '../../../services/abstracts'
import { formatDate } from '../../../utils/utils'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { selectActionLoading } from '../../../store/slices/abstracts/abstracts.selectors'
import { sendConfirmationEmailThunk, updateAbstractThunk } from '../../../store/slices/abstracts/abstracts.thunks'
import { openInvoiceModal, openPaymentReceiptModal, openPaymentReminderModal } from '../../../store/slices/abstracts/abstracts.slice'
import toast from 'react-hot-toast'
import type { AbstractRecord, AbstractStatus } from '../types'

type StatusAction = AbstractStatus

interface Props {
  item: AbstractItem | null
  record: AbstractRecord | null
  modalStatus: StatusAction
  onClose: () => void
  onStatusChange: (status: StatusAction) => void
  onUpdate: () => void
}

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

export default function AbstractDetailsModal({
  item,
  record,
  modalStatus,
  onClose,
  onStatusChange,
  onUpdate,
}: Props) {
  const actionLoading = useAppSelector(selectActionLoading)
  const dispatch = useAppDispatch()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<AbstractItem>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (item && isEditing) {
      setFormData({
        name: record?.name || '',
        email: record?.email || '',
        aemail: item.aemail || '',
        phone: item.phone || '',
        wphone: item.wphone || '',
        city: item.city || '',
        country: item.country || '',
        organization: item.organization || '',
        title: item.title || '',
        message: item.message || '',
        intrested: item.intrested || '',
      })
      setSelectedFile(null)
    }
  }, [item, record, isEditing])

  if (!item || !record) return null

  const handleSave = async () => {
    try {
      const dataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          dataToSend.append(key, String(value))
        }
      })
      if (selectedFile) {
        dataToSend.append('file', selectedFile)
      }

      const result = await dispatch(updateAbstractThunk({ id: String(item.id), body: dataToSend }))
      if (updateAbstractThunk.fulfilled.match(result)) {
        toast.success('Abstract updated successfully')
        setIsEditing(false)
        setSelectedFile(null)
      } else {
        toast.error((result.payload as string) || 'Failed to update abstract')
      }
    } catch (error) {
      toast.error('An error occurred while updating')
    }
  }

  /* -------------------- status -------------------- */
  const currentStatus: StatusAction =
    (typeof item.status === 'object'
      ? item.status?.actionType ?? 'Under Review'
      : item.status ?? 'Under Review') as StatusAction
  const isSameStatus = modalStatus === currentStatus
  const showUpdateButton = modalStatus !== 'Sent Invoice'
  const statusClass =
    currentStatus === 'Accepted'
      ? 'bg-green-50 text-green-700'
      : currentStatus === 'Under Review'
        ? 'bg-yellow-50 text-yellow-800'
        : currentStatus === 'Rejected'
          ? 'bg-red-50 text-red-700'
          : currentStatus === 'Out of Scope'
            ? 'bg-gray-100 text-gray-700'
            : currentStatus === 'Deleted'
              ? 'bg-gray-100 text-red-700'
              : 'bg-blue-50 text-blue-700'

  /* -------------------- file -------------------- */
  const file = (() => {
    const f = typeof item?.file === 'string' ? item.file : ''
    if (!f) return null
    const isAbs = /^https?:\/\//i.test(f)
    const name = f.split('/').pop() || ''
    const base = (item?.website?.link || '').replace(/\/$/, '/')
    let href = isAbs
      ? f
      : `${base}${f.startsWith('uploads') ? '' : 'uploads/'}${f}`
    if (record.fileS3Url) {
      href = record.fileS3Url
    }
    return { href, name }
  })()

  /* -------------------- status rules (OLD PAGE) -------------------- */
  const isUnderReview = currentStatus === 'Under Review'
  const isAccepted = currentStatus === 'Accepted'
  const isSentInvoice = currentStatus === 'Sent Invoice'
  const isRegistered = currentStatus === 'Registered'
  const isTerminal = currentStatus === 'Rejected' || currentStatus === 'Out of Scope' || currentStatus === 'Deleted'
  const showInvoiceActions = modalStatus === 'Sent Invoice'
  const showPaymentReceiptActions = modalStatus === 'Registered'
  const showConfirmationButton = !item.isEmailSent

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Abstract Details</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                ✎ Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-auto px-4 py-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="ID" value={String(item.id)} />
            <Field label="Website" value={item.website?.name ?? '—'} />

            {isEditing ? (
              <>
                <EditField
                  label="Name"
                  value={formData.name || ''}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <EditField
                  label="Email"
                  value={formData.email || ''}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
                <EditField
                  label="Alternate Email"
                  value={formData.aemail || ''}
                  onChange={(v) => setFormData({ ...formData, aemail: v })}
                />
                <EditField
                  label="Phone"
                  value={formData.phone || ''}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                />
                <EditField
                  label="WhatsApp"
                  value={formData.wphone || ''}
                  onChange={(v) => setFormData({ ...formData, wphone: v })}
                />
                <EditField
                  label="City"
                  value={formData.city || ''}
                  onChange={(v) => setFormData({ ...formData, city: v })}
                />
                <EditField
                  label="Country"
                  value={formData.country || ''}
                  onChange={(v) => setFormData({ ...formData, country: v })}
                />
                <EditField
                  label="Organization"
                  value={formData.organization || ''}
                  onChange={(v) => setFormData({ ...formData, organization: v })}
                  span
                />
                <EditField
                  label="Title"
                  value={formData.title || ''}
                  onChange={(v) => setFormData({ ...formData, title: v })}
                  span
                />
                <EditField
                  label="Message"
                  value={formData.message || ''}
                  onChange={(v) => setFormData({ ...formData, message: v })}
                  span
                  isTextArea
                />
                <SelectField
                  label="Interested"
                  value={formData.intrested || ''}
                  options={INTERESTED_IN_OPTIONS}
                  onChange={(v) => setFormData({ ...formData, intrested: v })}
                />
                <FileField
                  label="Upload New File"
                  onChange={setSelectedFile}
                />
              </>
            ) : (
              <>
                <Field label="Name" value={record.name} />
                <Field
                  label="Email"
                  value={
                    <a
                      href={`mailto:${record.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {record.email}
                    </a>
                  }
                />
                <Field label="Alternate Email" value={item.aemail ?? '—'} />
                <Field label="Phone" value={item.phone ?? '—'} />
                <Field label="WhatsApp" value={item.wphone ?? '—'} />
                <Field label="City" value={item.city ?? '—'} />
                <Field label="Country" value={item.country ?? '—'} />
                <Field label="Organization" value={item.organization ?? '—'} span />
                <Field label="Title" value={item.title ?? '—'} span />
                <Field label="Message" value={item.message ?? '—'} span />
                <Field label="Interested" value={item.intrested ?? '—'} />
              </>
            )}

            <Field
              label="Submitted On"
              value={item.now ? formatDate(item.now) : '—'}
            />

            <Field
              label="Status"
              value={
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusClass}`}
                >
                  {currentStatus}
                </span>
              }
            />

            <Field label="Email Sent" value={item.isEmailSent ? 'Yes' : 'No'} />

            <Field
              label="File"
              value={
                file ? (
                  <a
                    href={file.href}
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 hover:underline"
                  >
                    {file.name}
                  </a>
                ) : (
                  '—'
                )
              }
            />

          </dl>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap gap-2 justify-between items-center">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={actionLoading.edit}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading.edit ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={actionLoading.edit}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Status selector */}
              <div className="flex items-center gap-2">
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={modalStatus}
                  onChange={(e) =>
                    onStatusChange(e.target.value as StatusAction)
                  }
                >
                  <option disabled={isAccepted || isSentInvoice || isRegistered || isTerminal}>
                    Under Review
                  </option>
                  <option disabled={isAccepted || isSentInvoice || isRegistered || isTerminal}>
                    Accepted
                  </option>
                  <option disabled={isTerminal}>
                    Out of Scope
                  </option>
                  <option disabled={isTerminal}>
                    Rejected
                  </option>
                  <option
                    value="Sent Invoice"
                    disabled={isUnderReview || isSentInvoice || isRegistered || isTerminal}
                  >
                    Send Invoice
                  </option>
                  <option disabled={isUnderReview || isRegistered || isTerminal}>
                    Registered
                  </option>
                  <option>
                    Deleted
                  </option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {showUpdateButton && (
                  <button
                    onClick={onUpdate}
                    disabled={actionLoading.status || isSameStatus}
                    className={`rounded-md border px-2.5 py-1.5 text-xs ${actionLoading.status || isSameStatus
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    {actionLoading.status ? 'Updating...' : 'Update'}
                  </button>
                )}

                {showConfirmationButton && (
                  <button
                    onClick={async () => {
                      const result = await dispatch(
                        sendConfirmationEmailThunk(String(item.id))
                      )

                      if (sendConfirmationEmailThunk.fulfilled.match(result)) {
                        toast.success(
                          (result.payload as { message: string })?.message || 'Confirmation email sent successfully!'
                        )
                      } else {
                        toast.error((result.payload as string) || 'Failed to send confirmation email')
                      }
                    }}
                    disabled={actionLoading.confirmation}
                    className="rounded-md border border-blue-600 bg-blue-600 text-white px-2.5 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"              >
                    {actionLoading.confirmation ? 'Sending...' : 'Send Confirmation Email'}
                  </button>
                )}

                {/* INVOICE + REMINDER (ONLY for Sent Invoice) */}
                {showInvoiceActions && (
                  <>
                    <button
                      onClick={() => dispatch(openInvoiceModal({
                        id: String(item.id),
                        name: record.name,
                      }))}
                      className={`rounded-md border px-2.5 py-1.5 text-xs ${actionLoading.invoice ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                      disabled={actionLoading.invoice}
                    >
                      {actionLoading.invoice ? 'Sending...' : 'Invoice'}
                    </button>

                    <button
                      onClick={() => dispatch(openPaymentReminderModal({
                        id: String(item.id),
                        name: record.name,
                      }))}
                      className={`rounded-md border px-2.5 py-1.5 text-xs ${actionLoading.reminder ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'text-black border-gray-300 hover:bg-gray-100'}`}
                      disabled={actionLoading.reminder}
                    >
                      {actionLoading.reminder ? 'Sending...' : 'Payment Reminder'}
                    </button>

                  </>
                )}
                {showPaymentReceiptActions && (

                  <button
                    onClick={() =>
                      dispatch(
                        openPaymentReceiptModal({
                          id: String(item.id),
                          name: record.name,
                        })
                      )
                    }
                    className="rounded-md border border-blue-600 bg-blue-600 text-white px-2.5 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Payment Receipt
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- helper ---------- */

function Field({
  label,
  value,
  span,
}: {
  label: string
  value: React.ReactNode
  span?: boolean
}) {
  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  span,
  isTextArea,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  span?: boolean
  isTextArea?: boolean
}) {
  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <label className="block text-gray-500 mb-1">{label}</label>
      {isTextArea ? (
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
  span,
}: {
  label: string
  value: string
  options: string[]
  onChange: (val: string) => void
  span?: boolean
}) {
  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <label className="block text-gray-500 mb-1">{label}</label>
      <select
        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select Option</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function FileField({
  label,
  onChange,
}: {
  label: string
  onChange: (file: File | null) => void
}) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-gray-500 mb-1">{label}</label>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>
  )
}

