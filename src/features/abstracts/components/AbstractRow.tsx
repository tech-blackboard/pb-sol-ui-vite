import type { AbstractItem } from '../../../services/abstracts'
import { formatDate } from '../../../utils/utils'
import type { AbstractRecord } from '../types'
import { uploadService } from '../../../services/upload'
import { getS3KeyFromUrl } from '../../../utils/s3Utils'
import toast from 'react-hot-toast'

interface Props {
  record: AbstractRecord
  raw: AbstractItem | null
  onView: () => void
}

export default function AbstractRow({ record, raw, onView }: Props) {
  const f: string | undefined = record.file
  const isAbs = !!(f && /^https?:\/\//i.test(f))
  const name = f ? f.split('/').pop() || '' : ''
  const base = raw?.website?.link || ''
  const baseUrl = base.replace(/\/$/, '/')
  let href = f
    ? isAbs
      ? f
      : `${baseUrl}${f.startsWith('uploads') ? '' : 'uploads/'}${f}`
    : undefined

  if (record.fileS3Url) {
    href = record.fileS3Url
  }

  const statusClass =
    record.status === 'Accepted'
      ? 'bg-green-50 text-green-700'
      : record.status === 'Under Review'
        ? 'bg-yellow-50 text-yellow-800'
        : record.status === 'Rejected'
          ? 'bg-red-50 text-red-700'
          : record.status === 'Out of Scope'
            ? 'bg-gray-100 text-gray-700'
            : record.status === 'Deleted'
              ? 'bg-gray-100 text-red-700'
              : 'bg-blue-50 text-blue-700'

  const handleViewFile = async (e: React.MouseEvent) => {
    if (!record.fileS3Url) return

    e.preventDefault()
    const toastId = toast.loading('Generating secure link...')
    try {
      const key = getS3KeyFromUrl(record.fileS3Url)
      const url = await uploadService.getSignedUrl(key)
      toast.success('Secure link generated', { id: toastId })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error('Failed to get secure access to the file', { id: toastId })
      console.error('Error fetching signed URL:', error)
    }
  }

  return (
    <tr className="border-t border-gray-100">


      {/* Actions */}
      <td className="px-3 py-1">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={onView}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1  text-xs hover:bg-gray-50"
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

      {/* Website */}
      <td className="px-3 py-1 text-gray-700">
        <div className="max-w-[16rem] truncate" title={raw?.website?.name ?? '—'}>
          {raw?.website?.name ?? '—'}
        </div>
      </td>

      {/* Name */}
      <td className="px-3  py-1 text-gray-900">
        <div className="max-w-[16rem] truncate" title={record.name}>
          {record.name}
        </div>
      </td>

      {/* Email */}
      <td className="px-1 py-1">
        <a
          href={`mailto:${record.email}`}
          className="text-blue-600 hover:underline"
        >
          {record.email}
        </a>
      </td>

      {/* Status */}
      <td className="px-3 py-1">
        <span
          className={[
            'inline-flex items-center rounded-full px-1.5 py-1 text-xs font-medium',
            statusClass,
          ].join(' ')}
        >
          {record.status}
        </span>
      </td>

      {/* Email Sent */}
      <td className="px-3 py-1">
        <span
          className={[
            'inline-flex items-center rounded-full px-1.5 py-1 text-xs font-medium',
            record.isEmailSent
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-700',
          ].join(' ')}
        >
          {record.isEmailSent ? 'Yes' : 'No'}
        </span>
      </td>
      {/* Alternate Email */}
      <td className="px-1 py-1 text-gray-700">
        <div className="max-w-[12rem] truncate" title={record.altEmail ?? '—'}>
          {record.altEmail ?? '—'}
        </div>
      </td>

      {/* Phone */}
      <td className=" px-2 py-1 text-gray-700">
        <div className=" px-2 max-w-[12rem] truncate" title={record.phone ?? '—'}>
          {record.phone ?? '—'}
        </div>
      </td>

      {/* WhatsApp */}
      <td className="px-3 py-1 text-gray-700">
        <div className="max-w-[12rem] truncate" title={raw?.wphone ?? '—'}>
          {raw?.wphone ?? '—'}
        </div>
      </td>

      {/* City */}
      <td className="px-1 py-1 text-gray-700">
        <div className="max-w-[12rem] truncate" title={raw?.city ?? '—'}>
          {raw?.city ?? '—'}
        </div>
      </td>

      {/* Country */}
      <td className="px-3 py-1 text-gray-700">
        <div className=" px-3 max-w-[9rem] truncate" title={raw?.country ?? '—'}>
          {raw?.country ?? '—'}
        </div>
      </td>

      {/* University / Organization */}
      <td className="px-3  py-1 text-gray-700">
        <div className=" max-w-[12rem] truncate" title={raw?.organization ?? '—'}>
          {raw?.organization ?? '—'}
        </div>
      </td>

      {/* Title */}
      <td className="px-3 py-1 text-gray-700">
        <div className="max-w-[12rem] truncate" title={raw?.title ?? '—'}>
          {raw?.title ?? '—'}
        </div>
      </td>

      {/* Message */}
      <td className="px-3 py-1  text-gray-700">
        <div className="max-w-[200px] truncate" title={raw?.message ?? '—'}>
          {raw?.message ?? '—'}
        </div>
      </td>

      {/* Presentation */}
      <td className=" px-3 py-1 text-gray-700">
        <div className="max-w-[12rem] truncate" title={raw?.intrested ?? '—'}>
          {raw?.intrested ?? '—'}
        </div>
      </td>

      {/* Abstract File */}
      <td className=" px-3 py-1  text-gray-700 max-w-[12rem] truncate" title={name}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener"
            onClick={record.fileS3Url ? handleViewFile : undefined}
            className="text-blue-600 hover:underline"
          >
            {name}
          </a>
        ) : (
          '—'
        )}
      </td>

      {/* Submitted On */}
      <td className="px-3 py-1 text-gray-700">
        <div className="max-w-[12rem] truncate" title={raw?.now ? formatDate(raw.now) : '—'}>
          {raw?.now ? formatDate(raw.now) : '—'}
        </div>
      </td>





    </tr>
  )
}
