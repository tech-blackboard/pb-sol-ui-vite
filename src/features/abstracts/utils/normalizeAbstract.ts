import type { AbstractItem } from '../../../services/abstracts'
import type { AbstractRecord, AbstractStatus } from '../types'

const allowedStatuses: AbstractStatus[] = [
  'Under Review',
  'Accepted',
  'Out of Scope',
  'Rejected',
  'Sent Invoice',
  'Registered',
  'Deleted',
]

function toPresentationType(v: string | number | undefined | null) {
  const value = String(v ?? '').toLowerCase()
  if (value.includes('oral')) return 'Oral'
  if (value.includes('poster')) return 'Poster'
  if (value.includes('virtual')) return 'Virtual'
  if (value.includes('delegate')) return 'Delegate'
  return undefined
}

export function normalizeAbstract(item: AbstractItem): AbstractRecord {
  const statusRaw = item?.status
  const action = typeof statusRaw === 'object' ? statusRaw?.actionType : statusRaw

  const status: AbstractStatus = (action && (allowedStatuses as string[]).includes(action as string))
    ? (action as AbstractStatus)
    : 'Under Review'

  return {
    id: String(item?.id),
    name:
      item?.name ||
      [item?.user?.firstname, item?.user?.lastname]
        .filter(Boolean)
        .join(' ') ||
      'Unnamed',
    email: item?.email ?? item?.user?.useremail ?? '',
    altEmail: item?.aemail,
    phone: item?.phone,
    whatsapp: item?.wphone,
    city: item?.city,
    country: item?.country,
    university: item?.organization,
    title: item?.title,
    message: item?.message,
    presentationType: toPresentationType(item?.intrested),
    file: item?.file,
    fileS3Url: item?.fileS3Url,
    status,
    isEmailSent: Boolean(item?.isEmailSent),
  }
}
