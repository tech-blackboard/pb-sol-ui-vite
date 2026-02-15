export type AbstractStatus =
  | 'Under Review'
  | 'Accepted'
  | 'Out of Scope'
  | 'Rejected'
  | 'Sent Invoice'
  | 'Registered'
  | 'Deleted'

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
  fileS3Url?: string
  status: AbstractStatus
  isEmailSent: boolean
}

export interface CreateAbstractPayload {
  name?: string;
  email: string;
  aemail?: string;
  phone?: string;
  wphone?: string;
  country?: string;
  city?: string;
  organization?: string;
  intrested?: string;
  title?: string;
  message?: string;
  file?: string;
  status_id?: number;
  isEmailSent?: boolean;
  website_id?: number;
}
export interface RegistrationRecord {
  id?: number;
  name: string;
  email: string;
  aemail?: string;
  phone: string;
  wphone?: string;
  institution: string;
  country: string;
  presentation: string;
  participants: string;
  reg_price: string;
  regtype: string;
  accomm: string;
  checkin?: string;
  checkout?: string;
  nights?: string;
  accmvalue?: string;
  acmpng?: number;
  accpng?: number;
  acc_price?: string;
  tot_price?: string;
  transaction_id?: string;
  status_flag?: number;
  now?: string;
  status_id?: number;
  website_id?: number;
  user_id?: number;
}

export interface accRegistrationRecord {
  id?: number;
  name?: string;
  email?: string;
  aemail?: string;
  phone?: string;
  wphone?: string;
  institution?: string;
  country: string;
  presentation?: string;
  participants?: string;
  regtype?: string;
  accomm?: string;
  checkin?: string;
  checkout?: string;
  nights?: string;
  accm?: string;
  acmpng?: string;
  acc_pr?: string;
  tot_price?: string;
  transaction_id?: string;
  status_flag?: number | string;
  now?: string;
  status_id?: number;
  website_id?: number;
  user_id?: number | undefined;
};

export interface brochureRecord {
  id?: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  now: string;
  website?: { id: number; name: string };
}

export interface SponsorshipRecord {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  country?: string;
  message?: string;
  now?: string;
  website_id?: number;
};

export interface ContactRecord {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  message?: string;
  now?: string;
  website_id?: number;
};
