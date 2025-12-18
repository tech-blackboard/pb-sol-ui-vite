import type { AbstractRecord } from '../types'
import { formatDate } from '../utils/utils'

interface Props {
  record: AbstractRecord
  raw: any
  onView: () => void
}

export default function AbstractRow({ record, raw, onView }: Props) {
  const f: string | undefined = raw?.file
  const isAbs = !!(f && /^https?:\/\//i.test(f))
  const name = f ? f.split('/').pop() || '' : ''
  const base = raw?.website?.link || ''
  const baseUrl = base.replace(/\/$/, '/')
  const href = f
    ? isAbs
      ? f
      : `${baseUrl}${f.startsWith('uploads') ? '' : 'uploads/'}${f}`
    : undefined

  const statusClass =
    record.status === 'Accepted'
      ? 'bg-green-50 text-green-700'
      : record.status === 'Under Review'
      ? 'bg-yellow-50 text-yellow-800'
      : record.status === 'Rejected'
      ? 'bg-red-50 text-red-700'
      : record.status === 'Out of Scope'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <tr className="border-t border-gray-100">
      {/* Website */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[16rem] truncate">
          {raw?.website?.name ?? '—'}
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3 text-gray-900">
        <div className="max-w-[16rem] truncate">
          {record.name}
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3">
        <a
          href={`mailto:${record.email}`}
          className="text-blue-600 hover:underline"
        >
          {record.email}
        </a>
      </td>

      {/* Alternate Email */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {record.altEmail ?? '—'}
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {record.phone ?? '—'}
        </div>
      </td>

      {/* WhatsApp */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {raw?.wphone ?? '—'}
        </div>
      </td>

      {/* City */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {raw?.city ?? '—'}
        </div>
      </td>

      {/* Country */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {raw?.country ?? '—'}
        </div>
      </td>

      {/* University / Organization */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {raw?.organization ?? '—'}
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[16rem] truncate">
          {raw?.title ?? '—'}
        </div>
      </td>

      {/* Message */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[16rem] truncate">
          {raw?.message ?? '—'}
        </div>
      </td>

      {/* Presentation */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {raw?.intrested ?? '—'}
        </div>
      </td>

      {/* Abstract File */}
      <td className="px-4 py-3 text-gray-700">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener"
            className="text-blue-600 hover:underline"
          >
            {name}
          </a>
        ) : (
          '—'
        )}
      </td>

      {/* Submitted On */}
      <td className="px-4 py-3 text-gray-700">
        <div className="max-w-[12rem] truncate">
          {raw?.now ? formatDate(raw.now) : '—'}
        </div>
      </td>

      {/* Email Sent */}
      <td className="px-4 py-3">
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            record.isEmailSent
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-700',
          ].join(' ')}
        >
          {record.isEmailSent ? 'Yes' : 'No'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={[
            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
            statusClass,
          ].join(' ')}
        >
          {record.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-2 py-3">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={onView}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs hover:bg-gray-50"
            title="Edit"
            aria-label="Edit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L7.125 19.588l-3.682.409.409-3.682L16.862 3.487z"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}
