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
  status: AbstractStatus
  fileS3Url?: string
  isEmailSent: boolean
}

export interface RegistrationRecord {
  id: number;
  name: string;
  email: string;
  aemail?: string;
  phone: string;
  wphone?: string;
  institution: string;
  country: string;
  presentation: string;
  participants: string;
  regtype: string;
  accomm: string;
  checkin?: string;
  checkout?: string;
  nights?: string;
  accmvalue?: string;
  acmpng?: string;
  acc_price?: string;
  tot_price?: string;
  transaction_id?: string;
  status_flag?: number;
  now?: string;
  status?: { id: number; actionType: string };
  website?: { id: number; name: string };
}

export interface accRegistrationRecord {
  id: number;
  name: string;
  email: string;
  aemail?: string;
  phone: string;
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
  status_flag?: number;
  now: string;
  status?: { id: number; actionType: string };
  website?: { id: number; name: string };
};

export interface brochureRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  now: string;
  website?: { id: number; name: string };
}

export interface SponsorshipRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  organization: string;
  country: string;
  message: string;
  now: string;
  website?: { id: number; name: string };
};

export interface ContactRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  message: string;
  now: string;
  website?: { id: number; name: string };
};
