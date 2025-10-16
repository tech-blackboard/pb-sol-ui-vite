import { useMemo, useState } from 'react'

export type AbstractRecord = {
  id: string
  name: string
  email: string
  altEmail?: string
  phone?: string
  whatsapp?: string
  country?: string
  university?: string
  presentationType?: 'Oral' | 'Poster' | 'Virtual'
  status: 'Under Review' | 'Accepted' | 'Out of Scope' | 'Rejected' | 'Registered'
}

type StatusAction = 'Under Review' | 'Accepted' | 'Out of Scope' | 'Rejected'

export default function AbstractsPage() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<AbstractRecord[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      altEmail: 'alice.alt@example.com',
      phone: '+1 555-1010',
      whatsapp: '+1 555-1010',
      country: 'USA',
      university: 'Example University',
      presentationType: 'Oral',
      status: 'Under Review',
    },
    {
      id: '2',
      name: 'Bob Kumar',
      email: 'bob@example.com',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      country: 'India',
      university: 'Tech Institute',
      presentationType: 'Poster',
      status: 'Accepted',
    },
  ])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [
        r.name,
        r.email,
        r.altEmail,
        r.phone,
        r.whatsapp,
        r.country,
        r.university,
        r.presentationType,
        r.status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [rows, query])

  function setStatus(id: string, action: StatusAction) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)))
    // TODO: integrate email alerts for status changes
  }

  function sendAcceptance(id: string) {
    // TODO: trigger backend to send acceptance letter PDF attachment
    alert(`Sent acceptance letter for ID ${id}`)
  }

  function sendInvoice(id: string) {
    // TODO: trigger backend invoice creation
    alert(`Invoice generated for ID ${id}`)
  }

  function remindPayment(id: string) {
    // TODO: trigger backend payment reminder email
    alert(`Payment reminder sent for ID ${id}`)
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">All Conferences — Abstracts</h1>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, university..."
            className="w-full sm:w-72 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Alternate Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">University</th>
              <th className="px-4 py-3 font-medium">Presentation</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{r.name}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">
                    {r.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.altEmail ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.whatsapp ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.country ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.university ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.presentationType ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      [
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        r.status === 'Accepted'
                          ? 'bg-green-50 text-green-700'
                          : r.status === 'Under Review'
                          ? 'bg-yellow-50 text-yellow-800'
                          : r.status === 'Rejected'
                          ? 'bg-red-50 text-red-700'
                          : r.status === 'Out of Scope'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-50 text-blue-700',
                      ].join(' ')
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="relative inline-block">
                      <select
                        className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value as StatusAction)}
                      >
                        <option>Under Review</option>
                        <option>Accepted</option>
                        <option>Out of Scope</option>
                        <option>Rejected</option>
                      </select>
                    </div>

                    <button
                      onClick={() => sendAcceptance(r.id)}
                      className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                    >
                      Acceptance PDF
                    </button>
                    <button
                      onClick={() => sendInvoice(r.id)}
                      className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                    >
                      Invoice
                    </button>
                    <button
                      onClick={() => remindPayment(r.id)}
                      className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs hover:bg-gray-50"
                    >
                      Payment Reminder
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Notes: Email alerts should trigger automatically for "Under Review" status; acceptance letters must include a PDF attachment. Add invoice and payment reminder integrations here. This UI is ready for wiring to backend APIs.
      </p>
    </div>
  )
}


