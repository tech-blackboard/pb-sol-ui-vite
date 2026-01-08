export type AbstractStatus =
  | 'Under Review'
  | 'Accepted'
  | 'Out of Scope'
  | 'Rejected'
  | 'Sent Invoice'
  | 'Registered'

export type PresentationType =
  | 'Oral'
  | 'Poster'
  | 'Virtual'
  | 'Delegate'

export interface AbstractRecord {
  id: string
  name: string
  email: string
  altEmail?: string
  phone?: string
  whatsapp?: string
  city?: string
  country?: string
  university?: string
  title?: string
  message?: string
  presentationType?: PresentationType
  file?: string
  status: AbstractStatus
  fileS3Url?: string
  isEmailSent: boolean
}
