import type { AbstractRecord, AbstractStatus } from '../types'

const allowedStatuses: AbstractStatus[] = [
  'Under Review',
  'Accepted',
  'Out of Scope',
  'Rejected',
  'Sent Invoice',
  'Registered',
]

function toPresentationType(v: any) {
  const value = String(v ?? '').toLowerCase()
  if (value.includes('oral')) return 'Oral'
  if (value.includes('poster')) return 'Poster'
  if (value.includes('virtual')) return 'Virtual'
  if (value.includes('delegate')) return 'Delegate'
  return undefined
}

export function normalizeAbstract(item: any): AbstractRecord {
  const action = item?.status?.actionType

  const status: AbstractStatus = allowedStatuses.includes(action)
    ? action
    : 'Under Review'

  return {
    id: String(item?.id ?? item?._id),
    name:
      item?.name ??
      [item?.user?.firstname, item?.user?.lastname]
        .filter(Boolean)
        .join(' ') ??
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
    status,
    isEmailSent: Boolean(item?.isEmailSent),
  }
}
