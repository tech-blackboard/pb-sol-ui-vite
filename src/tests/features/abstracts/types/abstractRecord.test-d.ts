import { expectType, expectError } from 'tsd'
import type {
    PresentationType,
    AbstractStatus,
    AbstractRecord,
} from '../../../../features/abstracts/types'

/* ---------- Valid values ---------- */

expectType<AbstractStatus>('Under Review')
expectType<AbstractStatus>('Accepted')
expectType<AbstractStatus>('Out of Scope')
expectType<AbstractStatus>('Rejected')
expectType<AbstractStatus>('Sent Invoice')
expectType<AbstractStatus>('Registered')

expectType<PresentationType>('Oral')
expectType<PresentationType>('Poster')
expectType<PresentationType>('Virtual')
expectType<PresentationType>('Delegate')

/* ---------- Valid AbstractRecord (Minimal) ---------- */

expectType<AbstractRecord>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'Accepted',
    isEmailSent: true,
})

/* ---------- Valid AbstractRecord (Full) ---------- */

expectType<AbstractRecord>({
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    altEmail: 'alt@example.com',
    phone: '1234567890',
    whatsapp: '0987654321',
    city: 'New York',
    country: 'USA',
    university: 'Oxford',
    title: 'Research Paper',
    message: 'Hello World',
    presentationType: 'Oral',
    file: 'paper.pdf',
    status: 'Sent Invoice',
    fileS3Url: 'https://s3.aws.com/paper.pdf',
    isEmailSent: false,
})

/* ---------- Invalid cases ---------- */

// ❌ invalid status
expectError<AbstractRecord>({
    id: '3',
    name: 'Invalid',
    email: 'invalid@example.com',
    status: 'Invalid Status' as unknown as AbstractStatus,
    isEmailSent: true,
})

// ❌ invalid presentation type
expectError<AbstractRecord>({
    id: '4',
    name: 'Invalid',
    email: 'invalid@example.com',
    status: 'Accepted',
    presentationType: 'Incorrect' as unknown as PresentationType,
    isEmailSent: true,
})

// ❌ missing required field (name)
expectError<AbstractRecord>({
    id: '5',
    email: 'missing@example.com',
    status: 'Accepted',
    isEmailSent: true,
} as unknown as AbstractRecord)

// ❌ wrong type for id
expectError<AbstractRecord>({
    id: 123 as unknown as string,
    name: 'Wrong ID Type',
    email: 'test@example.com',
    status: 'Accepted',
    isEmailSent: true,
})
