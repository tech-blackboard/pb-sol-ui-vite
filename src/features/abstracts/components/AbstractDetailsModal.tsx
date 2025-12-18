import type { AbstractRecord, AbstractStatus } from '../types'
import { formatDate } from '../../../utils/utils'
import { useAppSelector } from '../../../store/hooks'
import { selectActionLoading } from '../../../store/slices/abstracts/abstracts.selectors'

type StatusAction = AbstractStatus

interface Props {
  item: any | null
  record: AbstractRecord | null
  modalStatus: StatusAction
  onClose: () => void
  onStatusChange: (status: StatusAction) => void
  onUpdate: () => void
}

export default function AbstractDetailsModal({
  item,
  record,
  modalStatus,
  onClose,
  onStatusChange,
  onUpdate,
}: Props) {
  const actionLoading = useAppSelector(selectActionLoading)

  if (!item || !record) return null

  /* -------------------- status -------------------- */

  const currentStatus: StatusAction =
    typeof item.status === 'object'
      ? item.status?.actionType ?? 'Under Review'
      : record.status

  const isSameStatus = modalStatus === currentStatus

  const statusClass =
    currentStatus === 'Accepted'
      ? 'bg-green-50 text-green-700'
      : currentStatus === 'Under Review'
      ? 'bg-yellow-50 text-yellow-800'
      : currentStatus === 'Rejected'
      ? 'bg-red-50 text-red-700'
      : currentStatus === 'Out of Scope'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-blue-50 text-blue-700'

  /* -------------------- file -------------------- */

  const file = (() => {
    const f = typeof item?.file === 'string' ? item.file : ''
    if (!f) return null
    const isAbs = /^https?:\/\//i.test(f)
    const name = f.split('/').pop() || ''
    const base = (item?.website?.link || '').replace(/\/$/, '/')
    const href = isAbs
      ? f
      : `${base}${f.startsWith('uploads') ? '' : 'uploads/'}${f}`
    return { href, name }
  })()

  /* -------------------- status rules (OLD PAGE) -------------------- */

  const isUnderReview = currentStatus === 'Under Review'
  const isAccepted = currentStatus === 'Accepted'
  const isSentInvoice = currentStatus === 'Sent Invoice'
  const isRegistered = currentStatus === 'Registered'
  const isTerminal =
    currentStatus === 'Rejected' || currentStatus === 'Out of Scope'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Abstract Details</h2>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-auto px-4 py-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="ID" value={String(item.id ?? item._id)} />
            <Field label="Website" value={item.website?.name ?? '—'} />
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
            <Field
              label="Submitted On"
              value={item.now ? formatDate(item.now) : '—'}
            />
            <Field label="Phone" value={item.phone ?? '—'} />
            <Field label="WhatsApp" value={item.wphone ?? '—'} />
            <Field label="City" value={item.city ?? '—'} />
            <Field label="Country" value={item.country ?? '—'} />
            <Field label="Organization" value={item.organization ?? '—'} span />
            <Field label="Title" value={item.title ?? '—'} />
            <Field label="Message" value={item.message ?? '—'} />
            <Field label="Interested" value={item.intrested ?? '—'} />

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

            <Field
              label="Created By"
              value={
                [item.user?.firstname, item.user?.lastname]
                  .filter(Boolean)
                  .join(' ') || '—'
              }
            />

            <Field
              label="User Role"
              value={
                (item.user?.roles ?? [])
                  .map((r: any) => (typeof r === 'string' ? r : r?.name))
                  .filter(Boolean)
                  .join(', ') || '—'
              }
            />
          </dl>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm">Status</label>
            <select
              className="rounded-md border px-2.5 py-1.5 text-xs"
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
              <option disabled={isAccepted || isSentInvoice || isRegistered || isTerminal}>
                Out of Scope
              </option>
              <option disabled={isAccepted || isSentInvoice || isRegistered || isTerminal}>
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
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUpdate}
              disabled={actionLoading.status || isSameStatus}
              className={`rounded-md border px-2.5 py-1.5 text-xs ${
                actionLoading.status || isSameStatus
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {actionLoading.status ? 'Updating...' : 'Update'}
            </button>

            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
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
